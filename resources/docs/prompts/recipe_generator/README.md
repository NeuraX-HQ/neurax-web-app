# Recipe Generator Prompt (Tợi mở Công thức Bếp thông minh)

Thư mục này chứa mẫu prompt gốc (raw prompt template) được sử dụng cho tính năng Tạo công thức nấu ăn dựa trên nguyên liệu sẵn có trong tủ lạnh của người dùng.

## 1. Mục đích
Trợ lý AI (Coach Ollie) sẽ nhận danh sách thực phẩm hiện có trong kho, ưu tiên các thực phẩm sắp hết hạn, và mục tiêu dinh dưỡng hiện tại (ví dụ: Tăng cơ bắp, giảm mỡ). Từ đó, AI sẽ tư duy và trả về từ 1-3 công thức nấu ăn phù hợp nhất.

## 2. Các file trong thư mục
- `recipe_generator_prompt.py`: 
  - `RECIPE_SYSTEM_PROMPT`: Thiết lập tính cách Coach Ollie và quy tắc lựa chọn món ăn (Tối đa 45 phút, ưu tiên đồ ăn Việt Nam).
  - `RECIPE_USER_PROMPT_TEMPLATE`: Mẫu cung cấp context danh sách thực phẩm hiện tại thay đổi linh hoạt theo biến số.

## 3. Định dạng Output 
API sẽ ưu tiên trả về Data dạng JSON nghiêm ngặt để có thể render thành các Card Món Ăn (Recipe Card) trực quan trên mobile app. Nội dung JSON gồm List `recipes` bao gồm:
- Tên món ăn (`dish_name`)
- Lý do đề xuất món này (`why_this`)
- Danh mục nguyên liệu (`ingredients_from_fridge` & `need_to_buy`)
- Thông số Macro (`macros`)
- Các bước thực hiện (`steps`)

## 4. Trường hợp ngoại lệ (Edge Cases)
Nếu người dùng cố tình nhập những thông tin không liên quan tới thực phẩm (ví dụ Mục tiêu là "tìm cái máy tính" hoặc Nguyên liệu toàn rác), prompt đã được chặn sẵn ở cấp độ Hệ thống (System) để trả về JSON với mảng `recipes` trống và cờ `error`:
```json
{
  "recipes": [],
  "overall_tip": "Hmm, có vẻ bạn nhập nhầm nguyên liệu hoặc mục tiêu rồi. Mình chỉ giúp tạo công thức nấu ăn được thôi nha! 🍳",
  "error": "not_food"
}
```
*Frontend sử dụng key `error` hoặc check `recipes.length === 0` để xử lý trạng thái Empty State và show Toast Error cho người dùng.*
