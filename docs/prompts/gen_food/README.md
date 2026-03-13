# Đặc tả Prompt "Gen Food"

## 1. Tổng quan

**Prompt "Gen Food"** là một cơ chế dự phòng được hỗ trợ bởi AI dành cho tính năng Tìm kiếm thủ công (Manual Search) của NutriTrack. Khi người dùng truy vấn một món ăn, bữa ăn hoặc nguyên liệu thô không có sẵn trong cơ sở dữ liệu `food_database` cục bộ (ví dụ: "Há Cảo Tôm ngon ơi là ngon và trứng luộc tất cả là 500g"), prompt này sẽ chỉ thị Amazon Bedrock (Claude 3.5) tự động ước tính thành phần dinh dưỡng và các nguyên liệu cấu thành của nó.

**Các mục tiêu chính:**

- Ngăn chặn tình trạng ngõ cụt "trạng thái không" (zero-state) trong quá trình ghi chép thực phẩm thủ công.
- Tự động phân tách các bữa ăn phức tạp thành những nguyên liệu thô.
- Xuất ra một đối tượng JSON có định dạng nghiêm ngặt để tích hợp liền mạch với giao diện người dùng (UI) frontend và các lược đồ (schemas) `UserData` của backend hiện tại.

---

## 2. Vị trí tệp

- **Nguồn Prompt:** `docs/prompts/gen_food/gen_food_prompt.py`
- **Các lược đồ (Schemas) liên quan:** `docs/schemas/food_database/` (Khớp với cấu trúc cơ sở dữ liệu thực phẩm quốc tế tiêu chuẩn).

---

## 3. Kiến trúc & Yêu cầu

### 3.1 Lựa chọn Model

- **Model được đề xuất:** `apac.anthropic.claude-3-5-haiku-20241022-v1:0` (để tối ưu tốc độ và chi phí) hoặc `Sonnet` (để có độ chính xác cao hơn đối với các bữa ăn phức tạp, nhiều nguyên liệu).
- **Nhiệt độ (Temperature):** `0.3` (Nên dùng nhiệt độ thấp để đảm bảo đầu ra JSON mang tính xác định và nghiêm ngặt).
- **Số token tối đa (Max Tokens):** Mặc định là `1500` để đáp ứng các mảng `ingredients` (nguyên liệu) có thể kéo dài.

### 3.2 Các quy tắc cốt lõi được áp dụng bởi Prompt

1. **Phân tích nguyên liệu:** AI phải phân chia món ăn thành các thành phần thô (ví dụ: "Phở Bò" → Bánh phở, Thịt bò, Nước dùng).
2. **Ước tính khẩu phần:** Nếu người dùng không chỉ định trọng lượng, AI sẽ mặc định là một khẩu phần "vừa" (medium) tiêu chuẩn.
3. **Xác thực chỉ số đa lượng (Macro Validation):** AI được chỉ thị để đảm bảo rằng tổng số calo tính từ các chất đa lượng ($Protein \times 4 + Carbs \times 4 + Fat \times 9$) là hợp lý về mặt toán học.
4. **Tạo ID động:** Điểm quan trọng là AI sẽ tạo ra một ID `custom_gen_temp` (hoặc `custom_gen_...` dựa trên dấu thời gian). Điều này cho phép frontend tạm thời hiển thị thẻ thực phẩm được tạo ra và sau đó gửi `POST` lên backend để lưu vào nhật ký/tủ lạnh cố định của người dùng.
5. **Đầu ra song ngữ:** Tạo ra cả `name_vi` và `name_en` bất kể ngôn ngữ đầu vào là gì.
6. **JSON nghiêm ngặt:** Phản hồi được đảm bảo là một đối tượng JSON có thể phân tích cú pháp (parsable) mà không có định dạng Markdown hay các câu chữ giao tiếp thừa thãi.

### 3.3 Trường hợp ngoại lệ (Edge Cases)
Nếu từ khóa tìm kiếm của người dùng hoàn toàn phi lý, là một trò đùa, hoặc không phải là thức ăn/đồ uống (ví dụ: *"tìm cho tôi chiếc máy tính", "đau lưng quá"*), AI sẽ ngưng tính toán và trả về ngay JSON thông báo lỗi sau:
```json
{
  "error": "not_food",
  "message_vi": "Vui lòng nhập một món ăn hoặc nguyên liệu hợp lệ.",
  "message_en": "Please enter a valid food or ingredient."
}
```
*Frontend/Backend cần bắt key `error` này để Alert cho người dùng thay vì ghi log rác vào DB.*

---

## 4. Cấu trúc Đầu vào / Đầu ra

### 4.1 Định dạng Đầu vào

Prompt chấp nhận một chuỗi văn bản thô đại diện cho truy vấn của người dùng. Nó đủ linh hoạt để xử lý các lỗi chính tả, cách diễn đạt hội thoại và các khai báo trọng lượng hỗn hợp.
**Ví dụ Truy vấn:** `"Há Cảo Tôm ngon ơi là ngon và trứng luộc tất cả là 500g"`

### 4.2 Định dạng Đầu ra (Lược đồ JSON dự kiến)

Prompt bắt buộc tuân theo cấu trúc lược đồ sau, trả về một đối tượng JSON duy nhất:

```json
{
  "food_id": "custom_gen_temp",
  "name_vi": "Tên tiếng Việt",
  "name_en": "English Name",
  "macros": {
      "calories": 0,
      "protein_g": 0.0,
      "carbs_g": 0.0,
      "fat_g": 0.0,
      "saturated_fat_g": 0.0,
      "polyunsaturated_fat_g": 0.0,
      "monounsaturated_fat_g": 0.0,
      "fiber_g": 0.0,
      "sugar_g": 0.0,
      "sodium_mg": 0,
      "cholesterol_mg": 0,
      "potassium_mg": 0
  },
  "micronutrients": {
      "calcium_mg": 0,
      "iron_mg": 0.0,
      "vitamin_a_ug": 0,
      "vitamin_c_mg": 0.0
  },
  "serving": {
      "default_g": 0,
      "unit": "serving | bowl | plate | piece",
      "portions": {
          "small": 0.7,
          "medium": 1.0,
          "large": 1.3
      }
  },
  "ingredients": [
      {
          "name": "Tên nguyên liệu",
          "estimated_weight_g": 0
      }
  ],
  "verified": false,
  "source": "AI Generated"
}
```

---

## 5. Hướng dẫn Sử dụng (Dành cho Tích hợp Backend)

Để tích hợp prompt này vào hàm AWS Lambda, hãy sử dụng luồng thực thi sau:

1. **Tải System Prompt:** Lấy `GEN_FOOD_SYSTEM_PROMPT`.
2. **Định dạng Tin nhắn Người dùng:** Chèn `search_query` vào `GEN_FOOD_USER_PROMPT_TEMPLATE`.
3. **Gọi Bedrock:**

```python
import boto3
import json
from gen_food_prompt import GEN_FOOD_SYSTEM_PROMPT, GEN_FOOD_USER_PROMPT_TEMPLATE

bedrock = boto3.client('bedrock-runtime')
body = {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 1500,
    "temperature": 0.3,
    "system": GEN_FOOD_SYSTEM_PROMPT,
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": GEN_FOOD_USER_PROMPT_TEMPLATE.format(search_query=user_input)}
            ]
        }
    ]
}

response = bedrock.invoke_model(
    modelId='apac.anthropic.claude-3-5-haiku-20241022-v1:0',
    body=json.dumps(body)
)
```

4. **Làm sạch & Phân tích cú pháp Đầu ra:** Đảm bảo rằng mọi khối mã markdown vô tình sinh ra (ví dụ: ````json````) đều được loại bỏ trước khi chạy `json.loads()`.
