# Voice Logging Prompt (Xử lý Giọng nói)

Thư mục này chứa mẫu prompt gốc (raw prompt template) được sử dụng để phân tích và xử lý đầu vào bằng giọng nói (đã qua text-transcription) của người dùng trong hệ thống NutriTrack 2.0.

## 1. Mục đích
Prompt này giúp AI (đang sử dụng Claude 3.5 Sonnet/Haiku) đóng vai trò là một trợ lý dinh dưỡng, nhận thông tin dạng văn bản thô từ giọng nói và chuyển đổi thành một đối tượng JSON có cấu trúc. Mục tiêu chính là nhận diện món ăn, thành phần, khẩu phần và đưa ra quyết định Hành động (Action) thích hợp: ghi nhận ngay (`log`) hoặc hỏi lại cho rõ (`clarify`).

## 2. Các file trong thư mục
- `voice_logging_prompt.py`: File duy nhất chứa các chuỗi (string) thuần túy của Prompt.
  - `VOICE_SYSTEM_PROMPT`: Định nghĩa vai trò, quy tắc cơ sở dữ liệu và xử lý lỗi của AI.
  - `VOICE_USER_PROMPT_TEMPLATE`: Mẫu vài shot (few-shot) hướng dẫn AI cách ánh xạ các đầu vào tự nhiên thành JSON.

## 3. Hướng dẫn sử dụng cho Developer

### 3.1 Quy trình ghép nối
1. Hệ thống AWS Transcribe sẽ chuyển giọng nói thành text (`transcribed_text`).
2. Backend (Lambda) nạp `transcribed_text` vào biến `{transcribed_text}` trong `VOICE_USER_PROMPT_TEMPLATE`.
3. Gửi toàn bộ dữ liệu kèm `VOICE_SYSTEM_PROMPT` qua Amazon Bedrock API.
4. Nhận và parse (phân tích) kết quả JSON trả về.

### 3.2 Đầu ra (Output)
Phản hồi của AI luôn là một đối tượng JSON duy nhất có cấu trúc nghiêm ngặt bao gồm các field quan trọng:
- `action`: Trạng thái xử lý ("log" nếu đủ thông tin, "clarify" nếu mập mờ).
- `food_name_vi` / `food_name_en`: Tên món ăn song ngữ.
- `ingredients`: Danh sách thành phần kèm trọng lượng dự đoán (`estimated_g`).
- `in_database`: Cờ (boolean) báo hiệu món này có trong DB chuẩn Việt Nam hay không.

### 3.3 Trường hợp ngoại lệ (Edge Cases)
Nếu từ khóa của người dùng là các câu giao tiếp thông thường, không chứa thông tin đồ ăn, hoặc hoàn toàn phi lý (ví dụ: *"Hôm nay trời đẹp quá"*, *"cho tôi một chiếc máy bay"*), AI sẽ không tạo rác dữ liệu. Thay vào đó, AI sẽ tự động phản hồi:
```json
{
  "action": "clarify",
  "clarification_question": "Bạn vừa ăn gì không? Mình chỉ hỗ trợ ghi nhận bữa ăn thôi nha! 🍜",
  "detected_language": "vi",
  "food_name_vi": null,
  "food_id": null,
  "ingredients": [],
  "confidence": 0.0
}
```
*Frontend cần kiểm tra `action === "clarify"` và hiển thị/phát âm thanh `clarification_question` cho người dùng thay vì lưu món ăn.*

---
**Lưu ý:** Nếu có thay đổi thêm về các quy tắc xử lý loại món ăn (ví dụ support thêm đồ ăn chay chuyên biệt), hãy cập nhật trực tiếp tại `VOICE_SYSTEM_PROMPT` (phần DATABASE RULES).
