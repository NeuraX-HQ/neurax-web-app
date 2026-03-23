# Database Schema: FoodLogs

Bảng `FoodLogs` lưu trữ toàn bộ lịch sử ăn uống của người dùng (Nhật ký theo thời gian).

## 1. Thông Tin Chung

- **Tên bảng:** `NutriTrack-FoodLogs`
- **Partition Key (PK):** `user_id` (String) - Phân vùng dữ liệu theo người dùng.
- **Sort Key (SK):** `timestamp` (String) - Chuẩn ISO 8601 để ghi nhận thời điểm tạo Log.

## 2. Kiến Trúc Sự Kiện Bất Biến (Event Sourcing Pattern)

Điểm mạnh nhất trong kiến trúc `FoodLogs` là quyết định **Embedded (nhúng)** khối `macros` trực tiếp vào tài liệu (Document) mỗi khi có Log mới.
Mặc dù schema lưu trường `food_id` để tham chiếu lại nguồn ở `FoodData` nhưng tổng giá trị Macro ở thời điểm User ăn (dựa trên `portion` + `additions`) được đính luôn vào Log.
**Lợi ích:** Đảm bảo tính toàn vẹn (Immutable) của dữ liệu lịch sử. Lỡ 2 năm sau `FoodData` cập nhật lại Calo của quả Táo, thì lịch sử 2 năm trước của user vẫn giữ nguyên con số Calo lúc bấy giờ.

## 3. Cấu Trúc Các Trường Cơ Bản
- `log_id`: ID định danh riêng cho bản ghi.
- `meal_type`: Kiểu bữa (`breakfast`, `lunch`, `dinner`, `snack`).
- `input_method`: Nguồn ghi (`voice`, `photo`, `manual`, `barcode`). Thuộc tính này hỗ trợ Product Team đo lường (Analytics) người dùng thích dùng AI hay gõ tự động.

## 4. Phân loại cấu trúc dữ liệu theo 3 Luồng Ghi (Use Cases)
Giao diện `FoodLogs` sẽ tạo ra các Payload JSON khác nhau tùy thuộc vào hành vi người dùng (Giải thích dùng để thuyết trình):

### Luồng 1: Search (Tìm kiếm trực tiếp từ FoodDatabase)
- Khi user tìm món ăn và bấm chọn trực tiếp món đó từ Database chuẩn.
- Dữ liệu map thẳng vào Log sẽ **đầy đủ 100%**: Bao gồm cấu trúc `macros` cơ bản và **tất cả `micronutrients`** (Vitamin, Canxi, Sắt, v.v.) kéo từ FoodData.
- Có ID tham chiếu `food_id` rõ ràng.

### Luồng 2: Voice Logging (Ghi qua giọng nói AI)
Có 2 nhánh rẽ bên trong luồng này:
- **Nhánh 2.1 (Search/Match):** Giọng nói đọc đúng tên một món ăn đã có sẵn trong FoodDatabase -> App sẽ ngầm match ID và lưu Log y hệt như Luồng 1 (Có đủ cả Macro + Micronutrients, và KHÔNG CÓ `ingredients`).
- **Nhánh 2.2 (AI Gen):** Món ăn user nói quá lạ (vd: "Một cái bánh canh cua thêm nửa cái giò heo"). AI sẽ phải tự ước lượng (Generate).
  - Lúc này JSON lưu xuống **CHỈ CÓ `macros`** gồm 6 lõi cơ bản (Protein, Fat, Carbs, Calories, Fiber, Sugar, Sodium).
  - Đặc biệt: Sẽ kèm theo mảng **`ingredients`** (thành phần) mà AI bóc tách được từ câu nói (vì món này không tham chiếu được CSDL gốc nên phải lưu lại thành phần cấu tạo để user xem lại).
  - Tuyệt đối **KHÔNG CÓ `micronutrients`** vì quá rủi ro (AI không thể ảo giác "hallucinate" ra được lượng vitamin C hay Canxi chính xác của tô bánh canh đó).

### Luồng 3: Scan Logging (Quét hình ảnh bằng Camera)
- Luồng này hoạt động y hệt Nhánh 2.2 của Voice.
- Qwen3-VL/Bedrock nhận diện ảnh và tự bóc tách món ăn. Vì AI tự đoán nên kết quả lưu xuống DB cũng **CHỈ CÓ `macros`** cơ bản và mảng **`ingredients`** hiển thị các thứ nó nhìn thấy trong ảnh. Lược bỏ khối `micronutrients`.

---

## 5. Query & GSI (Tối Ưu Tương Lai)

- **Truy vấn Daily Dashboard:**
  - `Query PK = user_id AND SK begins_with("2026-03-12")` - Rất nhanh! (Lấy toàn bộ trong 1 ngày)
- **Hạn chế:** DynamoDB PK+SK hiện tại khó query theo dạng "Mọi nhật ký bữa sáng (breakfast) trong 1 tháng vừa qua".
- **Giải Pháp (GSI - Global Secondary Index):** Nếu có nghiệp vụ vẽ biểu đồ lọc riêng `meal_type`, ta dựng thêm 1 GSI:
  - **Index Name:** `MealTypeIndex`
  - **PK:** `user_id`
  - **SK:** `meal_type`
