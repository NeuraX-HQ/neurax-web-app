# Bách Khoa Toàn Thư Lược Đồ Cơ Sở Dữ Liệu (Database Schemas)
Dự án **NutriTrack 2.0**

Thư mục này là tổng hợp toàn bộ các Document Designs và Schema Blueprints dùng cho hệ thống Cơ sở Dữ liệu của NutriTrack. Kiến trúc của project áp dụng 100% dịch vụ AWS Serverless NoSQL (**Amazon DynamoDB**) cho mục đích Persistence Data, không sử dụng SQL truyền thống.  

Dưới đây là 5 Module cơ sở dữ liệu (Bảng) được triển khai:

---

## 🏛 Cấu Trúc Bảng Dữ Liệu (5 Databases)

### 1. UserData (`/UserData`) - Lõi Hệ Thống 🌟
- **Chức Năng:** Hồ sơ người dùng, thông tin Olly mật, trạng thái Gamification, mục tiêu vĩnh viễn, tiểu sử ăn uống cá nhân hoá (dị ứng).
- **Thiết Kế:** DynamoDB Document - Tập trung mọi context vào 1 Document cho tốc độ Load (Read) siêu việt khi App khởi động.

### 2. FoodDatabase (`/FoodData`) - Bách Khoa Thực Phẩm
- **Chức Năng:** Bảng tra cứu dữ liệu gốc cho hàng vạn nguyên liệu tại Việt Nam và Thế giới (hút từ USDA và Crawl Việt).
- **Thiết Kế:** Read-Heavy Table, sử dụng Document nested cho Macro & Micronutrient. Chịu trách nhiệm cung cấp dữ liệu nền tảng. 

### 3. Fridge (`/Fridge`) - Tủ Lạnh Ảo
- **Chức Năng:** Quản lý kho nguyên liệu người dùng đang sở hữu thông qua Camera hoặc Invoice. 
- **Thiết Kế:** User `PK` + Item UUID `SK`. Được tối ưu để giao tiếp và làm ngữ cảnh (Context) trực tiếp cho prompt của Amazon Bedrock tạo ra Món Ăn (Recipes Generator).

### 4. FoodLogs (`/FoodLogs`) - Nhật Ký & Thống Kê
- **Chức Năng:** Lưu trữ biến động tiêu thụ Calo của bản thân hệ thống qua trục Thời gian.
- **Thiết Kế:** **Event Sourcing Pattern**. Nhấn chìm/nhúng macro của thức ăn vào lịch sử Log ngay thời điểm tạo sự kiện (hỗ trợ lưu bền chặt lịch sử dù DB gốc có thay đổi Macro).

### 5. Challenges (`/Challenges`) - Mạng Lưới Xã Hội Mở Rộng
- **Chức Năng:** Cấu hình thông tin sự kiện và xử lý lưu vết quá trình thi đua người với người.
- **Thiết Kế:** **Adjacency List Pattern (Single-Table Design).** Dùng Partition Keys lưu thông tin Thử Thách và lưu thông tin chi tiết Thành viên trải ra từng hàng khác nhau (Rows / Items) để thoát khỏi rào cản 400KB của Amazon DynamoDB.

---

## ❓ Câu Hỏi Thường Gặp

**Q: Cấu trúc cơ sở dữ liệu Công Thức Nấu Ăn (Recipe Database) nằm ở đâu?**
> **A:** Trong kiến trúc NutriTrack 2.0 có tab tính năng Recipes ở màn hình **Kitchen** của User Interface (Sơ đồ `SCREEN_FLOW.md`). 
Tuy nhiên, **Recipes hoàn toàn không sở hữu một Database riêng biệt**. Nó được Amazon Bedrock (AI) mô phỏng động trực tiếp trong không gian máy chủ Serverless (tính toán Runtime - On-the-fly) từ nguồn nguyên liệu của bảng tủ lạnh (`/Fridge`), sau đó trả kết quả về bộ nhớ App mà không cần Persistence.
