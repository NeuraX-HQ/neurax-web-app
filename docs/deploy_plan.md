# Kế Hoạch Triển Khai — ECS VPC Security & Lambda Integration

**Ngày lập:** 2026-04-14  
**Người thực hiện:** Team Backend  
**Môi trường:** Production (`ap-southeast-2`)  
**Thời gian dự kiến:** ~30 phút  
**Downtime dự kiến:** Không có (zero-downtime)

---

## Tổng Quan

Mục tiêu: Kết nối `scanImage` Lambda (Amplify) với ECS FastAPI (VPC nội bộ) một cách bảo mật, không để lộ ECS ra internet trực tiếp.

```
[Mobile App]
     ↓ GraphQL
[Amplify Lambda: scanImage]  ←── gắn vào VPC private subnet
     ↓ HTTP (qua VPC nội bộ)
[ALB: nutritrack-api-vpc-alb]  ←── khoá SG, chỉ nhận từ Lambda SG
     ↓
[ECS Fargate: FastAPI / Qwen3-VL]
```

---

## Trạng Thái Hiện Tại (Đã Xong)

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| VPC `vpc-0d51760ce0dee8e6b` | ✅ Done | `10.0.0.0/16` |
| NAT Instance AZ-a | ✅ Done | `i-080ee17a2085ca6ee`, EIP `13.211.185.11` |
| NAT Instance AZ-c | ✅ Done | `i-02b9e72fa29b30a34`, EIP `3.25.234.1` |
| Route tables Multi-AZ | ✅ Done | `private-rt01` → NAT-AZa, `private-rt02` → NAT-AZc |
| ECS Cluster + Service | ✅ Done | 1 task FARGATE_SPOT đang chạy tại AZ-a |
| Autoscaling StepScaling | ✅ Done | CPU >70% scale out, <20% scale in, min=1 max=10 |
| ALB `nutritrack-api-vpc-alb` | ✅ Done | internet-facing, port 80 |

---

## Các Bước Triển Khai

### Giai đoạn 1 — Hạ tầng AWS (CLI) ~10 phút

> Thực hiện trên máy có AWS CLI đã cấu hình đúng profile production.

**Bước 1.1 — Tạo Lambda Security Group**

```bash
LAMBDA_SG_ID=$(aws ec2 create-security-group \
  --group-name "nutritrack-api-vpc-lambda-sg" \
  --description "Security group for scanImage Lambda" \
  --vpc-id vpc-0d51760ce0dee8e6b \
  --query "GroupId" --output text)

echo "✅ Lambda SG: $LAMBDA_SG_ID"
```

Kết quả mong đợi: in ra `sg-xxxxxxxxxxxxxxxxx`

---

**Bước 1.2 — Khoá ALB Security Group**

```bash
# Lấy ALB SG ID
ALB_SG_ID=$(aws elbv2 describe-load-balancers \
  --names nutritrack-api-vpc-alb \
  --query "LoadBalancers[0].SecurityGroups[0]" --output text)

echo "ALB SG: $ALB_SG_ID"

# Xóa rule cũ (0.0.0.0/0)
aws ec2 revoke-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# Thêm rule mới: chỉ cho phép từ Lambda SG
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp --port 80 \
  --source-group $LAMBDA_SG_ID

echo "✅ ALB SG đã khoá"
```

> **Rủi ro:** Sau bước này ALB không còn nhận traffic từ internet. Nếu có client nào đang gọi ALB trực tiếp (không qua Lambda) sẽ bị từ chối. Rollback: thêm lại rule `0.0.0.0/0`.

---

**Bước 1.3 — Tạo SSM Parameters**

```bash
# ALB URL
aws ssm put-parameter \
  --name "/nutritrack/ecs/alb_url" \
  --value "http://nutritrack-api-vpc-alb-1060755902.ap-southeast-2.elb.amazonaws.com" \
  --type "String" --overwrite

# Lambda SG ID (từ bước 1.1)
aws ssm put-parameter \
  --name "/nutritrack/ecs/lambda_sg_id" \
  --value "$LAMBDA_SG_ID" \
  --type "String" --overwrite

# Private Subnet AZ-a
aws ssm put-parameter \
  --name "/nutritrack/ecs/private_subnet_1" \
  --value "subnet-053bc336367a61075" \
  --type "String" --overwrite

# Private Subnet AZ-c
aws ssm put-parameter \
  --name "/nutritrack/ecs/private_subnet_2" \
  --value "subnet-04aec5718bc8ec526" \
  --type "String" --overwrite

echo "✅ SSM params đã tạo"
```

---

**Bước 1.4 — Verify Giai Đoạn 1**

```bash
# Kiểm tra 4 SSM params
aws ssm get-parameters \
  --names "/nutritrack/ecs/alb_url" \
           "/nutritrack/ecs/lambda_sg_id" \
           "/nutritrack/ecs/private_subnet_1" \
           "/nutritrack/ecs/private_subnet_2" \
  --query "Parameters[*].{Name:Name,Value:Value}" \
  --output table

# Kiểm tra ALB SG chỉ còn nhận từ Lambda SG
aws ec2 describe-security-groups \
  --group-ids $ALB_SG_ID \
  --query "SecurityGroups[0].IpPermissions[*].{Port:FromPort,Source:UserIdGroupPairs[0].GroupId}" \
  --output table
```

Kết quả mong đợi: 4 params có giá trị, ALB SG chỉ có 1 inbound rule trỏ về `$LAMBDA_SG_ID`.

---

### Giai đoạn 2 — Cập nhật Backend Code ~5 phút

**Bước 2.1 — Thêm VPC IAM cho scanImage Lambda**

Mở `backend/amplify/backend.ts`, tìm đoạn `cfnScanImageFn.vpcConfig = {...}` (dòng ~174) và thêm ngay bên dưới:

```typescript
// Thêm sau dòng cfnScanImageFn.vpcConfig = { ... };
scanImageLambda.role?.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
);
```

> Thiếu đoạn này Lambda sẽ không tạo được ENI trong VPC và báo lỗi khi invoke.

---

**Bước 2.2 — Push & Deploy**

```bash
cd backend

# Kiểm tra lần cuối
git diff amplify/backend.ts

# Push để Amplify CI tự deploy
git add amplify/backend.ts
git commit -m "fix: add VPC ENI permissions for scanImage Lambda"
git push origin <branch-hiện-tại>
```

Theo dõi pipeline tại **AWS Amplify Console → branch đang deploy**.

---

### Giai đoạn 3 — Verify End-to-End ~10 phút

**Bước 3.1 — Xác nhận Lambda đã vào VPC**

Chờ Amplify CI deploy xong, rồi chạy:

```bash
LAMBDA_NAME=$(aws lambda list-functions \
  --query "Functions[?contains(FunctionName,'scanImage')].FunctionName | [0]" \
  --output text)

aws lambda get-function-configuration \
  --function-name $LAMBDA_NAME \
  --query "{VpcId:VpcConfig.VpcId,Subnets:VpcConfig.SubnetIds,SGs:VpcConfig.SecurityGroupIds}" \
  --output table
```

Kết quả mong đợi:
- `VpcId` = `vpc-0d51760ce0dee8e6b`
- `Subnets` = `["subnet-053bc336367a61075", "subnet-04aec5718bc8ec526"]`
- `SGs` = `["sg-xxxxxxxxxxxxxxxxx"]` (Lambda SG vừa tạo)

---

**Bước 3.2 — Test Invoke**

Thực hiện scan ảnh thật từ app (hoặc gọi trực tiếp qua GraphQL). Kiểm tra CloudWatch Logs:

```bash
aws logs tail /aws/lambda/$LAMBDA_NAME --follow
```

Logs mong đợi:
```
[INFO] Connecting to ECS: http://nutritrack-api-vpc-alb-...
[INFO] ECS response: 200 OK
```

Nếu thấy lỗi:

| Lỗi | Nguyên nhân | Fix |
|---|---|---|
| `Task timed out` | Lambda không reach được ALB | Kiểm tra route từ private subnet qua NAT |
| `Connection refused` | ECS task không chạy | Kiểm tra ECS service desired count |
| `failed to create an ENI` | Thiếu VPC IAM (bước 2.1) | Kiểm tra lại managed policy |
| `ParameterNotFound` | SSM chưa tạo | Quay lại bước 1.3 |

---

## Rollback

Nếu có sự cố sau giai đoạn 1 (ALB bị khoá nhưng Lambda chưa deploy xong):

```bash
# Mở lại ALB tạm thời
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
```

Nếu có sự cố sau giai đoạn 2 (Lambda lỗi):

```bash
# Revert commit
git revert HEAD
git push origin <branch>
```

---

## Tham Khảo

- Chi tiết kiến trúc và CLI đầy đủ: [infrastructure_sync_guide.md](infrastructure_sync_guide.md)
- ECS Cluster: `nutritrack-api-cluster` — ap-southeast-2
- ALB DNS: `nutritrack-api-vpc-alb-1060755902.ap-southeast-2.elb.amazonaws.com`
- Branch Amplify đang active: `feat/scan-image-lambda`
