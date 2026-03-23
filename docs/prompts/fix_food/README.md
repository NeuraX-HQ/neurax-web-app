# Đặc tả Prompt "Fix Food"

## 1. Tổng quan
**Prompt "Fix Food"** đóng vai trò tự động sửa lỗi cho các món ăn đã được người dùng chọn lưu (hoặc đang xem Review). Khi người dùng đang xem chi tiết một món ăn (Food Detail) và phát hiện sai sót (sai tên nguyên liệu, định lượng, v.v.), tính năng này cho phép họ dùng lệnh thoại hoặc chat "Sửa lỗi bằng AI" (Easy Fix) bằng ngôn ngữ tự nhiên thay vì phải xóa Log cũ và nhập lại từ đầu.

**Use Case (Ví dụ thực tế):**
- **Hiển thị giao diện:** Món "Ức gà luộc" (250 kcal, 150g).
- **Lệnh của User:** *"Thịt heo mới đúng, với nó là 150g"*.
- **Kết quả trả về:** AI ném lại chuỗi JSON định dạng mới "Thịt heo" (150g, được scale lại toàn bộ macros của thịt heo).

---

## 2. Vị trí tệp
- **Nguồn Prompt:** `docs/prompts/fix_food/fix_food_prompt.py`

---

## 3. Cấu trúc Đầu vào / Đầu ra

### 3.1 Cấu trúc Đầu vào (Input)
Prompt yêu cầu 2 biến truyền vào từ Backend:
1. `current_food_json`: Định dạng chuỗi JSON nguyên bản của món ăn bị sai hiện tại mà người dùng đang nhìn thấy trên giao diện.
2. `user_correction_query`: Câu nói bắt lỗi/sửa lỗi của User.

### 3.2 Đầu ra (Output)
Một cấu trúc JSON hợp lệ hoàn toàn khớp với định dạng Cơ sở dữ liệu Thực phẩm tĩnh của dự án. AI sẽ không trả về giải thích dư thừa.

### 3.3 Trường hợp ngoại lệ (Edge Cases)
Nếu câu sửa lỗi của người dùng hoàn toàn phi lý, là một trò đùa, hoặc không liên quan đến thức ăn (ví dụ: *"Thêm cho tôi 2 chiếc máy bay", "Tôi buồn ngủ"*), AI sẽ ngưng tính toán và trả về ngay JSON thông báo lỗi sau:
```json
{
  "error": "not_food",
  "message_vi": "Vui lòng nhập một yêu cầu chỉnh sửa món ăn hợp lệ.",
  "message_en": "Please enter a valid food correction request."
}
```
*Frontend/Backend cần bắt key `error` này để Alert cho người dùng.*

---

## 4. Hướng dẫn Sử dụng (Dành cho Tích hợp Backend)

Để gọi prompt này vào hàm AWS Lambda (trên Bedrock), hãy dùng Python code cơ bản sau:

```python
import boto3
import json
from fix_food_prompt import FIX_FOOD_SYSTEM_PROMPT, FIX_FOOD_USER_PROMPT_TEMPLATE

bedrock = boto3.client('bedrock-runtime')

# Dữ liệu hiện tại đang hiển thị trên UI (ví dụ minh họa)
current_json_str = '{"name_vi": "Ức gà", "serving": {"default_g": 150}, ...}'
user_query = "Thịt heo ba chỉ mới đúng"

body = {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 1500,
    "temperature": 0.2, # Nên dùng 0.2 để lấy kết quả JSON có tính nguyên tắc cao
    "system": FIX_FOOD_SYSTEM_PROMPT,
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text", 
                    "text": FIX_FOOD_USER_PROMPT_TEMPLATE.format(
                        current_food_json=current_json_str,
                        user_correction_query=user_query
                    )
                }
            ]
        }
    ]
}

response = bedrock.invoke_model(
    modelId='apac.anthropic.claude-3-5-haiku-20241022-v1:0',
    body=json.dumps(body)
)
```

**Lưu ý:**
- Phải chắc chắn việc format string (xử lý escape characters) đối với `current_json_str` khi parse vào prompt Template để tránh lỗi JSON Decode quá trình gửi qua AWS Bedrock.
