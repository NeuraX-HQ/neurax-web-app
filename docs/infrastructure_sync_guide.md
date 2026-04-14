# Hướng Dẫn Đồng Bộ Terraform & Cấu Hình Security ALB/Lambda

Tài liệu này hướng dẫn team thực hiện các bước cấu hình hạ tầng qua **AWS Console / AWS CLI** (không dùng Terraform):
1. Tạo Lambda Security Group và khoá chặt ALB — chỉ nhận traffic từ Lambda.
2. Tạo 4 SSM Parameters để `backend.ts` tự động đọc cấu hình VPC khi deploy.
3. Thêm IAM VPC permission còn thiếu cho `scanImage` Lambda trong `backend.ts`.
4. Xác minh kiến trúc Multi-AZ NAT đã triển khai (2026-04-14).

> **Hạ tầng được quản lý hoàn toàn qua Console/CLI.** Các file Terraform trong `ECS/NUTRI_TRACK/infra/` chỉ dùng để tham khảo kiến trúc ban đầu — không apply.

---

## 0. Hiện Trạng Thực Tế (As-Deployed — Verified 2026-04-14)

> Phần này phản ánh kiến trúc **thực tế đang chạy trên AWS** (xác minh bằng AWS CLI), không phải code TF. Team cần nắm rõ delta này trước khi `terraform apply`.

### 0.1 VPC & Mạng

| Resource | ID | AZ | CIDR | Ghi chú |
|---|---|---|---|---|
| VPC | `vpc-0d51760ce0dee8e6b` | — | `10.0.0.0/16` | `nutritrack-api-vpc` |
| Public Subnet ALB-01 | `subnet-08cdfbfbc1e9b73b7` | `ap-southeast-2a` | `10.0.1.0/24` | MapPublicIP = true |
| Public Subnet ALB-02 | `subnet-0ecbf081b5ca68707` | `ap-southeast-2c` | `10.0.2.0/24` | MapPublicIP = true |
| Private Subnet ECS-01 | `subnet-053bc336367a61075` | `ap-southeast-2a` | `10.0.3.0/24` | ECS chạy tại đây |
| Private Subnet ECS-02 | `subnet-04aec5718bc8ec526` | `ap-southeast-2c` | `10.0.4.0/24` | Dự phòng, chưa dùng |

> **Drift với TF:** TF khai báo private subnets là `10.0.1/2.0/24`, public là `10.0.11/12.0/24`. Thực tế khác hoàn toàn. **Không `terraform apply` trực tiếp** vào VPC — sẽ gây xung đột.

### 0.2 NAT Instances (Multi-AZ — Cập nhật 2026-04-14)

Kiến trúc ban đầu dùng Interface VPC Endpoints (ECR, Secrets Manager, CloudWatch, Bedrock). Đã **xóa toàn bộ Interface Endpoints** để tiết kiệm chi phí (~$7–10/endpoint/tháng) và thay bằng NAT Instances.

**Sau khi nâng cấp Multi-AZ hôm nay:**

| Instance | ID | AZ | Public IP | Subnet | SourceDestCheck |
|---|---|---|---|---|---|
| NAT-AZa | `i-080ee17a2085ca6ee` | `ap-southeast-2a` | `13.211.185.11` (EIP `eipalloc-083692795a888efe6`) | `subnet-08cdfbfbc1e9b73b7` | Disabled ✅ |
| NAT-AZc | `i-02b9e72fa29b30a34` | `ap-southeast-2c` | `3.25.234.1` | `subnet-0ecbf081b5ca68707` | Disabled ✅ |

**Luồng traffic:**
```
ECS task (AZ-a) → private-ecs01 → private-rt01 (rtb-05f81e99377ee2263) → NAT-AZa → Internet
                   private-ecs02 → private-rt02 (rtb-01394169212d5059e) → NAT-AZc → Internet
```
Không còn cross-AZ traffic. Chi phí thêm: ~$7.45/tháng (1× t4g.nano + 1× Elastic IP).

**Cấu hình NAT Instance (cả 2):**
- AMI: `ami-0616f53416cce05f5` (Amazon Linux 2023, arm64)
- Instance type: `t4g.nano`
- Key pair: `nutritrack-api-vpc-pulic-nati-keypair`
- IAM Profile: `nutritrack-api-vpc-nat-instance-role`
- Security Group: `sg-0fab8bf16eab2ec0a` (`nutritrack-api-vpc-nat-sg`)
- UserData (NAT-AZa có, NAT-AZc cần kiểm tra):
  ```bash
  #!/bin/bash
  yum install -y iptables-services
  systemctl enable iptables && systemctl start iptables
  echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.d/custom-ip-forwarding.conf
  sysctl -p /etc/sysctl.d/custom-ip-forwarding.conf
  /sbin/iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
  /sbin/iptables -F FORWARD
  service iptables save
  ```

### 0.3 VPC Endpoints (Còn lại)

Chỉ còn **1 endpoint** sau khi xóa các Interface Endpoints:

| Endpoint | ID | Type | Ghi chú |
|---|---|---|---|
| S3 Gateway | `vpce-0cceaa95620884fa9` | Gateway | Giữ lại để kéo Docker image từ ECR qua S3 miễn phí |

> TF vẫn khai báo 5 Interface Endpoints (ECR API, ECR DKR, Secrets Manager, CloudWatch, Bedrock). Phần này đã lỗi thời — cần xóa khỏi `vpc.tf` khi sync.

### 0.4 ECS & Autoscaling

**Cluster:** `nutritrack-api-cluster` (Fargate + Fargate Spot)

**Services:**

| Service | Desired | Running | Subnet | Capacity Provider |
|---|---|---|---|---|
| `spot-arm-nutritrack-api-task-service` | 1 | 1 | `subnet-053bc336367a61075` (AZ-a) | FARGATE_SPOT |
| `spot-arm-nutritrack-api-task-service02` | 0 | 0 | `subnet-053bc336367a61075` (AZ-a) | — |

**Task Definition:** `arm-nutritrack-api-task:10`
- CPU: 1024 (1 vCPU), Memory: 2048 MB
- Architecture: ARM64
- Image: ECR `backend/nutritrack-api-image:arm`
- Port: 8000
- Env vars: `AWS_REGION`, `MODEL_ID=qwen.qwen3-vl-235b-a22b`
- Secret: `NUTRITRACK_API_KEY` từ Secrets Manager

**Deployment:**
- Strategy: Rolling Update
- Max: 200%, Min healthy: 100%
- Circuit breaker: bật (rollback tự động khi deploy fail)

### 0.5 Autoscaling — Cách Hoạt Động Chính Xác

> **Drift quan trọng:** TF khai báo `TargetTrackingScaling` nhưng thực tế đang dùng `StepScaling`.

**Scalable Target:**
- Min capacity: **1** (TF khai báo 0 — sai thực tế)
- Max capacity: 10
- Dimension: `ecs:service:DesiredCount`

**Policies (StepScaling):**

| Policy | Tên | Trigger | Hành động |
|---|---|---|---|
| Scale Out | `nutritrack-api-cluster-cpu-above-70` | CPU trung bình > 70% | Tăng số task |
| Scale In | `nutritrack-api-cluster-cpu-below-20` | CPU trung bình < 20% | Giảm số task |

**Luồng hoạt động:**
```
CloudWatch Alarm (CPU > 70%)
    → Application Auto Scaling
    → Tăng DesiredCount của ECS Service
    → ECS Scheduler launch task mới trên FARGATE_SPOT
    → Task attach vào Target Group → ALB route traffic

CloudWatch Alarm (CPU < 20%)
    → Application Auto Scaling
    → Giảm DesiredCount (không xuống dưới min=1)
    → ECS drain connections → terminate task
```

**Lưu ý:** Min = 1 nghĩa là **luôn có ít nhất 1 task chạy**. Không scale về 0. Nếu muốn scale-to-zero (tiết kiệm hơn) cần đổi min = 0 và cơ chế warm-up.

### 0.6 ALB

| Thuộc tính | Giá trị |
|---|---|
| Tên | `nutritrack-api-vpc-alb` |
| Scheme | `internet-facing` (chưa đổi sang internal) |
| Subnets | ALB-01 (AZ-a) + ALB-02 (AZ-c) |
| DNS | `nutritrack-api-vpc-alb-1060755902.ap-southeast-2.elb.amazonaws.com` |
| Port | 80/HTTP → forward → Target Group port 8000 |
| Health check | `GET /health`, threshold 3/3, interval 30s |

> Phần 1 bên dưới mô tả kế hoạch đổi ALB sang internal — **chưa được apply**.

---

---

## 1. Cấu Hình Security Groups (AWS CLI)

> Team quản lý hạ tầng qua Console/CLI — không dùng Terraform. Làm theo thứ tự từng bước.

### Bước 1 — Tạo Lambda Security Group (chưa tồn tại)

Lambda cần SG riêng để ALB nhận ra và chỉ cho phép traffic từ nó.

```bash
LAMBDA_SG_ID=$(aws ec2 create-security-group \
  --group-name "nutritrack-api-vpc-lambda-sg" \
  --description "Security group for scanImage Lambda" \
  --vpc-id vpc-0d51760ce0dee8e6b \
  --query "GroupId" --output text)

echo "Lambda SG: $LAMBDA_SG_ID"

# Chỉ cần egress (Lambda chủ động gọi ra, không nhận inbound)
# Egress all đã được tạo mặc định — không cần thêm rule
```

### Bước 2 — Khoá chặt ALB Security Group

ALB hiện cho phép HTTP từ `0.0.0.0/0`. Đổi thành chỉ nhận từ Lambda SG.

> **Lưu ý:** AWS không thể đổi scheme ALB từ internet-facing sang internal trực tiếp. Thay vào đó, khoá SG để đạt hiệu quả tương đương về bảo mật.

```bash
# Lấy ALB SG hiện tại
ALB_SG_ID=$(aws elbv2 describe-load-balancers \
  --names nutritrack-api-vpc-alb \
  --query "LoadBalancers[0].SecurityGroups[0]" --output text)

echo "ALB SG: $ALB_SG_ID"

# Xóa rule cũ (cho phép 0.0.0.0/0)
aws ec2 revoke-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp --port 80 \
  --cidr 0.0.0.0/0

# Thêm rule mới: chỉ cho phép từ Lambda SG
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp --port 80 \
  --source-group $LAMBDA_SG_ID
```

### Bước 3 — Tạo SSM Parameters

`backend.ts` đọc 4 params này lúc CloudFormation deploy. Tất cả đang `ParameterNotFound` — phải tạo trước khi push backend.

```bash
# ALB URL (internet-facing DNS, Lambda gọi qua VPC nội bộ)
aws ssm put-parameter \
  --name "/nutritrack/ecs/alb_url" \
  --value "http://nutritrack-api-vpc-alb-1060755902.ap-southeast-2.elb.amazonaws.com" \
  --type "String" --overwrite

# Lambda Security Group ID (vừa tạo ở Bước 1)
aws ssm put-parameter \
  --name "/nutritrack/ecs/lambda_sg_id" \
  --value "$LAMBDA_SG_ID" \
  --type "String" --overwrite

# Private Subnet AZ-a (ECS đang chạy ở đây)
aws ssm put-parameter \
  --name "/nutritrack/ecs/private_subnet_1" \
  --value "subnet-053bc336367a61075" \
  --type "String" --overwrite

# Private Subnet AZ-c (dự phòng)
aws ssm put-parameter \
  --name "/nutritrack/ecs/private_subnet_2" \
  --value "subnet-04aec5718bc8ec526" \
  --type "String" --overwrite
```

### Bước 4 — Verify

```bash
# Xác nhận cả 4 params tồn tại
aws ssm get-parameters \
  --names "/nutritrack/ecs/alb_url" \
           "/nutritrack/ecs/lambda_sg_id" \
           "/nutritrack/ecs/private_subnet_1" \
           "/nutritrack/ecs/private_subnet_2" \
  --query "Parameters[*].{Name:Name,Value:Value}" \
  --output table

# Xác nhận ALB SG chỉ còn nhận từ Lambda SG
aws ec2 describe-security-groups \
  --group-ids $ALB_SG_ID \
  --query "SecurityGroups[0].IpPermissions"
```

---

## 2. Phần `backend/amplify/backend.ts` — Trạng Thái & Việc Cần Làm

> **Trạng thái (2026-04-14):** Code SSM + VPC config đã được viết sẵn (dòng 161–177). **Chưa deploy được** vì còn 2 vấn đề bên dưới. Team cần xử lý trước khi push.

### 2.1 Những gì đã có sẵn (KHÔNG cần viết lại)

Đoạn code từ dòng 161–177 trong `backend/amplify/backend.ts` đã đúng:

```typescript
// Dòng 161–177 — ĐÃ CÓ SẴN, không sửa
const cfnScanImageFn = scanImageLambda.node.defaultChild as cdk.aws_lambda.CfnFunction;
cfnScanImageFn.addPropertyOverride('Environment.Variables.STORAGE_BUCKET_NAME', s3Bucket.bucketName);

const albUrl    = cdk.aws_ssm.StringParameter.valueForStringParameter(scanImageLambda.stack, '/nutritrack/ecs/alb_url');
const lambdaSg  = cdk.aws_ssm.StringParameter.valueForStringParameter(scanImageLambda.stack, '/nutritrack/ecs/lambda_sg_id');
const subnet1   = cdk.aws_ssm.StringParameter.valueForStringParameter(scanImageLambda.stack, '/nutritrack/ecs/private_subnet_1');
const subnet2   = cdk.aws_ssm.StringParameter.valueForStringParameter(scanImageLambda.stack, '/nutritrack/ecs/private_subnet_2');

cfnScanImageFn.addPropertyOverride('Environment.Variables.ECS_BASE_URL', albUrl);

cfnScanImageFn.vpcConfig = {
  subnetIds: [subnet1, subnet2],
  securityGroupIds: [lambdaSg],
};
```

### 2.2 Vấn đề #1 — SSM Parameters chưa tồn tại (BLOCKER)

`valueForStringParameter` dùng CloudFormation dynamic reference `{{resolve:ssm:...}}` — resolve tại lúc **CloudFormation deploy**, không phải lúc CDK synth. Nếu SSM params chưa có, stack sẽ **fail khi deploy**.

Kiểm tra hiện tại (2026-04-14): cả 4 params đều `ParameterNotFound`.

**Điều kiện tiên quyết bắt buộc:**
```
[Bước 1] terraform apply (phần 1 + 1.3 bên trên)
          → Tạo SSM params: /nutritrack/ecs/alb_url
                             /nutritrack/ecs/lambda_sg_id
                             /nutritrack/ecs/private_subnet_1
                             /nutritrack/ecs/private_subnet_2
[Bước 2] Mới được: git push → Amplify CI deploy backend
```

Đừng push backend trước khi Terraform apply xong.

### 2.3 Vấn đề #2 — Thiếu IAM cho Lambda trong VPC (BUG)

Khi Lambda được gắn vào VPC qua escape hatch (`cfnScanImageFn.vpcConfig = ...`), CDK **không tự động** thêm quyền tạo/xóa Network Interface. Nếu thiếu, Lambda sẽ không start được và báo lỗi:

```
Lambda was unable to configure your environment variables because the environment
variables you have provided exceeded 4KB ... / Lambda failed to create an ENI
```

**Cần thêm đoạn sau vào `backend.ts`**, ngay sau dòng `cfnScanImageFn.vpcConfig = {...}`:

```typescript
// BẮT BUỘC: Lambda trong VPC cần quyền tạo/xóa Network Interface
// CDK không tự thêm khi dùng escape hatch cho vpcConfig
scanImageLambda.role?.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
);
```

Managed policy `AWSLambdaVPCAccessExecutionRole` bao gồm:
- `ec2:CreateNetworkInterface`
- `ec2:DescribeNetworkInterfaces`
- `ec2:DeleteNetworkInterface`

### 2.4 Checklist Trước Khi Push Backend

- [ ] Terraform apply xong → 4 SSM params tồn tại (verify: `aws ssm get-parameter --name "/nutritrack/ecs/alb_url"`)
- [ ] Đã thêm `AWSLambdaVPCAccessExecutionRole` cho `scanImageLambda` (mục 2.3)
- [ ] ALB đã đổi sang `internal = true` (nếu chưa, Lambda vẫn reach được qua VPC nhưng cần đúng DNS)
- [ ] Push → đợi Amplify CI → kiểm tra CloudWatch logs của `scan-image` Lambda

---

## 3. Autoscaling — Cấu Hình Thực Tế (Đã Chạy, Không Cần Đổi)

Autoscaling đã được cấu hình đúng qua Console. Phần này chỉ để tham khảo và kiểm tra.

**Kiểm tra nhanh bằng CLI:**
```bash
# Xem target và min/max
aws application-autoscaling describe-scalable-targets \
  --service-namespace ecs \
  --query "ScalableTargets[?ResourceId=='service/nutritrack-api-cluster/spot-arm-nutritrack-api-task-service'].{Min:MinCapacity,Max:MaxCapacity}" \
  --output table

# Xem 2 policies
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id "service/nutritrack-api-cluster/spot-arm-nutritrack-api-task-service" \
  --query "ScalingPolicies[*].{Name:PolicyName,Type:PolicyType}" \
  --output table
```

**Luồng hoạt động:**
```
[CloudWatch Alarm] CPU > 70% trong 1 phút
        ↓ cooldown 60s
[App Auto Scaling] DesiredCount +1 (tối đa 10)
        ↓
[ECS] Launch task mới trên FARGATE_SPOT
        ↓
[Task] Pull image ECR → qua S3 Gateway Endpoint (miễn phí, không qua NAT)
       Fetch secret → qua NAT Instance
        ↓
[Target Group] /health pass → ALB route traffic vào task mới

[CloudWatch Alarm] CPU < 20% trong 5 phút
        ↓ cooldown 300s (dài hơn để tránh flapping)
[App Auto Scaling] DesiredCount -1 (tối thiểu 1, không bao giờ về 0)
        ↓
[ECS] Drain → terminate task
```

---

## 4. Checklist Toàn Bộ (Thực Hiện Theo Thứ Tự)

```
[ ] Bước 1 — Tạo Lambda SG          (mục 1, Bước 1)
[ ] Bước 2 — Khoá ALB SG            (mục 1, Bước 2)
[ ] Bước 3 — Tạo 4 SSM parameters   (mục 1, Bước 3)
[ ] Bước 4 — Verify SSM + SG        (mục 1, Bước 4)
[ ] Bước 5 — Thêm VPC IAM vào backend.ts  (mục 2, mục 2.3)
[ ] Bước 6 — Push backend → đợi Amplify CI deploy
[ ] Bước 7 — Test scan-image Lambda qua CloudWatch Logs
```

**Verify cuối — sau khi Amplify deploy xong:**
```bash
# Xác nhận scan-image Lambda đã được gắn VPC
aws lambda get-function-configuration \
  --function-name $(aws lambda list-functions \
    --query "Functions[?contains(FunctionName,'scanImage')].FunctionName" \
    --output text) \
  --query "{VpcId:VpcConfig.VpcId,Subnets:VpcConfig.SubnetIds,SGs:VpcConfig.SecurityGroupIds}" \
  --output table
```
