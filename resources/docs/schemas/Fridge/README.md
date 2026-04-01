# Database Schema: Fridge (Inventory)

Bảng `Fridge` đóng vai trò là "Tủ Lạnh Cá Nhân" ảo, lưu trữ trực tiếp danh sách các nguyên liệu thực phẩm người dùng đã thêm (thông qua Scan barcode/hóa đơn hoặc nhập tay). Dữ liệu của bảng này là lõi đầu vào để Amazon Bedrock tính toán và sinh ra các kịch bản công thức món ăn cá nhân hoá (Recipe Generation).

## 1. Thông Tin Chung

- **Tên bảng:** `NutriTrack-Inventory`
- **Partition Key (PK):** `user_id` (String) - Phân vùng tủ lạnh theo cấp độ User.
- **Sort Key (SK):** `item_id` (String) - Định danh GUID riêng cho từng mặt hàng (Do 1 User có thể thêm 2 lần mua thịt bò vào 2 ngày khác nhau).

## 2. Thiết Kế NoSQL Tradeoffs

### Không Join Cứng (Soft-Reference)
Schema *lưu trực tiếp tên (name)* (Ví dụ: "Trứng gà") của sản phẩm thay vì làm Khóa Ngoại (Foreign Key) cứng tham chiếu 100% đến `food_id` trong FoodDatabase.
Trường hợp này giúp:
1. Khi dùng UI Recipe Generator, AI chỉ cần biết user có "Trứng gà", "5 quả" là có thể sinh ra công thức. AI không cần biết Macro của trứng. (Giảm chi phí Query Database).
2. Tủ lạnh có thể linh hoạt giữ những món chưa từng tồn tại trong DB, hoặc AI dự đoán từ hình ảnh. 

`food_id` là (Optional). Nó chỉ dùng khi user nhấn vào món ăn trong tủ để xem "Dữ Liệu Dinh Dưỡng" thì mới query ngược lại FoodDatabase. Đây là đánh đổi chuẩn xác của kiến trúc (Sacrificing Referential Integrity for AI Search Flexibility).

## 3. Quản Lý Ngày Hết Hạn & GSI (Tối Ưu Tương Lai)

Mục tiêu lớn nhất là tính năng: "Gợi ý các món ăn từ các thực phẩm sắp hết hạn trong tủ lạnh".

Cấu trúc PK theo `user_id` dùng Query sẽ bắt buộc phải kéo ra toàn bộ các dòng (items) của user vào Memory Server, rồi API (Lambda) chạy lệnh For loop tìm ra item nào `expiry_date` gần nhất.

**Giải Pháp Cho Production Thực Tế (Thiết Lập GSI):**
Để truy xuất nhanh nhất món nào sắp hỏng của một tủ lạnh nào đó mà không cần kéo toàn bộ Tủ (Scan):
  - **Index Name:** `ExpiryIndex`
  - **PK:** `user_id`
  - **SK:** `expiry_date`
  - **Query Pattern:** `Query PK=user_id AND SK BETWEEN (today) AND (today + 3 days)` -> Lambda lấy trực tiếp các món sắp hỏng.
