# Must Remember

## S3 `voice/` path — KHÔNG dùng `{entity_id}`

**Quyết định:** `voice/*` giữ flat, không scoping theo `identityId`.

**Lý do:** Cognito Identity Pool ID có dạng `us-east-1:xxxx...` (chứa dấu `:`).
Nếu dùng `voice/${identityId}/${fileName}`, `MediaFileUri` truyền vào AWS Transcribe sẽ là:

```
s3://bucket/voice/us-east-1:xxxx.../file.m4a
```

Transcribe URI parser hiểu `us-east-1` là hostname, `:xxxx` là port → **Transcribe job fail**.

**Tại sao `incoming/` không bị?**
`incoming/` không đi qua Transcribe URI — đọc trực tiếp bằng AWS SDK (`GetObjectCommand`), dấu `:` không bị parse như URL.

**Tại sao không sanitize (replace `:` → `_`)?**
Amplify `allow.entity('identity')` tạo IAM condition check `entity_id == identityId` (có dấu `:`). Nếu path thực tế dùng `_` sẽ mismatch → user bị denied khi upload.

**Trade-off chấp nhận được vì:**
- Voice files ephemeral: Lambda xóa ngay sau Transcribe xong (`Promise.allSettled` xóa cả Transcribe job lẫn S3 object)
- Safety net: S3 Lifecycle rule `voice/` expire sau 1 ngày
- Timestamp làm filename → collision cực thấp
- Vẫn require authenticated để upload/read/delete

> **Không thêm `{entity_id}` vào `voice/` path — đây là quyết định có chủ đích.**

---

## Bug Report: ECS Scan Label — Bedrock Image Call Hangs Indefinitely

**Ngày phát hiện:** 2026-04-13  
**Severity:** High — tính năng scan label hoàn toàn không hoạt động

### Triệu chứng

- User scan label từ app → nhận lỗi `Lambda:ExecutionTimeoutException`
- Lambda poll ECS mỗi 3s nhưng job mãi ở trạng thái `"processing"`
- ECS health check vẫn trả `200 OK` (container sống, không crash)
- CloudWatch ECS logs ngừng sau bước `"Compressing image"` — không có log nào từ Bedrock trở đi

### Flow khi lỗi xảy ra

```
Frontend
  → upload ảnh lên S3 incoming/{identityId}/{file}        ✅
  → GraphQL query scanImage (AppSync)                     ✅
  → Lambda scan-image invoke                              ✅
  → Lambda download S3 + POST /analyze-label đến ECS      ✅
  → ECS nhận job, trả 202 + job_id                       ✅
  → ECS background thread gọi OCRER.analyze_label()       ✅
  → OCRER gọi BedrockModel.analyze() → client.converse()  ❌ TREO Ở ĐÂY
  → Lambda poll /jobs/{id} → mãi "processing"
  → Lambda timeout (300s) → AppSync trả ExecutionTimeoutException
```

### Root Cause

**File:** `ECS/NUTRI_TRACK/third_apis/Bedrock.py` (dòng 49–53)

```python
# TRƯỚC (lỗi)
self.client = boto3.client(
    "bedrock-runtime",
    region_name=self.region,
    config=Config(read_timeout=300)   # ← quá dài + không giới hạn retry
)
```

3 vấn đề kết hợp:

| Vấn đề | Chi tiết |
|--------|----------|
| `read_timeout=300` quá cao | Mỗi lần Bedrock không respond, client chờ 5 phút |
| Không set `connect_timeout` | Default 60s — nếu TCP không connect được, treo 60s |
| Không giới hạn `max_attempts` | boto3 mặc định retry 3–5 lần → tổng thời gian: `5 retries × 300s = 25 phút+` |
| Không có timeout ở tầng FastAPI | `run_in_threadpool()` không cancelable → thread treo vô thời hạn |

**Hậu quả:** Background thread của FastAPI bị treo hàng giờ. ECS `job_store` tích lũy các job mãi ở `"processing"`. Mọi lần user thử đều thêm một hung thread mới vào ECS.

### Bằng chứng từ CloudWatch

**Lambda log** (06:28:17 UTC):
```
[scan-image] Handler invoked { action: 'analyzeFoodLabel' }
[scan-image] Downloading image from S3 { s3Key: 'incoming/ap-southeast-2:.../1776061695714.jpg' }
[scan-image] Image downloaded { size: 110877, contentType: 'image/jpeg' }
[scan-image] Calling ECS { ecsUrl: '.../analyze-label' }
[scan-image] Job accepted { jobId: 'cbe85943-...', status: 'processing' }
[scan-image] Poll result { status: 'processing' }   ← lặp lại mỗi 3s cho đến khi timeout
```

**ECS log** (03:17 UTC — job trước đó, cùng pattern):
```
Preparing image bytes for Bedrock (size: 0.04MB)
Image requires compression for vision model optimization
Compressing image: 0.04 MB (max_pixels=768, quality=75)
← DỪNG TẠI ĐÂY, không có log nào từ Bedrock trở đi
```

### Fix đã apply (cần rebuild Docker + redeploy ECS)

**File:** `ECS/NUTRI_TRACK/third_apis/Bedrock.py`

```python
# SAU (đã fix)
self.client = boto3.client(
    "bedrock-runtime",
    region_name=self.region,
    config=Config(
        connect_timeout=10,
        read_timeout=120,
        retries={"max_attempts": 1, "mode": "standard"},
    ),
)
```

### Fix bổ sung cần làm (chưa implement)

**File:** `ECS/NUTRI_TRACK/templates/api.py` — thêm timeout tầng FastAPI để job tự fail thay vì treo mãi:

```python
async def background_analyze_label(job_id: str, image_bytes: bytes, filename: str):
    try:
        start = time.time()
        # Thêm timeout 150s — nếu Bedrock không trả lời thì fail rõ ràng
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(
                analyze_label,
                ocrer=ocrer_client, image_bytes=image_bytes, filename=filename
            )
            results = await asyncio.get_event_loop().run_in_executor(
                None, lambda: future.result(timeout=150)
            )
        ...
    except concurrent.futures.TimeoutError:
        job_store[job_id]["status"] = "failed"
        job_store[job_id]["error"] = "Bedrock analysis timed out after 150s"
    except Exception as e:
        ...
```

### Action Items cho team

| # | Việc cần làm | File | Priority |
|---|---|---|---|
| 1 | Restart ECS service để clear hung threads hiện tại | AWS Console → ECS | **Ngay** |
| 2 | Rebuild Docker image với fix `Bedrock.py` (đã commit) | `ECS/NUTRI_TRACK/` | High |
| 3 | Redeploy ECS service với image mới | CI/CD hoặc manual | High |
| 4 | Thêm timeout tầng FastAPI trong `background_analyze_label` | `templates/api.py` | Medium |
| 5 | Apply tương tự cho `background_analyze_food_nutrition` và `background_scan_barcode` | `templates/api.py` | Medium |

### Lưu ý về Lambda timeout (đã hotfix)

Lambda `scan-image` ban đầu có timeout **120s** (từ lần deploy đầu 07/04). Code `resource.ts` đã cập nhật `timeoutSeconds: 300` nhưng chưa được deploy. Đã hotfix trực tiếp qua AWS CLI:

```bash
aws lambda update-function-configuration \
  --function-name "amplify-nutritrackbackend--scanimagelambda33F662E3-xa8SPaEYrdBx" \
  --timeout 300 --region ap-southeast-2
```

Cần deploy lại sandbox để giữ config này permanent.
