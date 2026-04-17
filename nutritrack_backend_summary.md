# NutriTrack Backend Infrastructure Summary

Tài liệu này tổng hợp toàn bộ cấu trúc hạ tầng Backend của ứng dụng NutriTrack dựa trên kiến trúc AWS Amplify Gen 2 (CDK-based).

## 1. Cơ sở dữ liệu (Database - DynamoDB)
Hệ thống sử dụng **Amazon DynamoDB** làm cơ sở dữ liệu chính với 6 Table quan trọng phục vụ các tính năng khác nhau:

| Tên Table | Chức năng chính | Ghi chú |
| :--- | :--- | :--- |
| **`Food`** | Danh mục thực phẩm & Dinh dưỡng | Chứa thông tin Macro/Micro của hàng ngàn loại thực phẩm. |
| **`user`** | Hồ sơ người dùng | Lưu trữ Biometric (chiều cao, cân nặng), Goal (mục tiêu calo), AI Preferences. |
| **`FoodLog`** | Nhật ký ăn uống | Lưu lại lịch sử bữa ăn, thành phần, và các chỉ số dinh dưỡng đã nạp. |
| **`FridgeItem`** | Quản lý tủ lạnh | Theo dõi thực phẩm tồn kho, số lượng và ngày hết hạn. |
| **`Friendship`** | Hệ thống mạng xã hội | Quản lý lời mời kết bạn, trạng thái (pending/accepted/blocked). |
| **`UserPublicStats`** | Chỉ số công khai | Lưu trữ Streak, Pet Level, Pet Score để bạn bè có thể xem được. |

---

## 2. Các hàm xử lý (Lambda Functions)
Có 5 Function Lambda chính điều phối logic nghiệp vụ:

1.  **`aiEngine`**: "Bộ não" trung tâm. Chịu trách nhiệm gọi Bedrock (AI) và điều phối Transcribe (Voice).
2.  **`scanImage`**: Proxy kết nối với cụm ECS Fargate để xử lý phân tích hình ảnh bữa ăn.
3.  **`processNutrition`**: Tính toán dinh dưỡng, truy vấn DB và xử lý fallback nếu không tìm thấy món ăn.
4.  **`friendRequest`**: Xử lý logic kết bạn, cập nhật trạng thái và đảm bảo tính nhất quán của quan hệ 2 chiều.
5.  **`resizeImage`**: Tự động kích hoạt khi có ảnh tải lên S3 để tối ưu dung lượng và bộ nhớ.

---

## 3. Khả năng của AI (AI Capabilities)
Ứng dụng tích hợp AI sâu rộng để tối ưu trải nghiệm người dùng:

*   **Voice Logging (Ghi âm món ăn)**: 
    *   Sử dụng **AWS Transcribe** để chuyển ghi âm thành văn bản.
    *   Sử dụng **Amazon Bedrock (Model: Qwen3-VL)** để bóc tách các món ăn và khối lượng từ câu nói tự nhiên.
*   **Photo Analysis (Phân tích ảnh)**: 
    *   Chụp ảnh bữa ăn, AI sẽ tự động nhận diện các thành phần có trong đĩa và ước lượng khối lượng.
*   **AI Coach**: 
    *   Tư vấn chế độ ăn uống cá nhân hóa dựa trên dữ liệu lịch sử và mục tiêu của người dùng.
*   **Auto Nutrition Estimation**: 
    *   Tự động tính toán Calo/Macros cho các món ăn phức tạp hoặc không có sẵn trong DB truyền thống.

---

## 4. Lưu trữ (Storage - S3)
Một S3 Bucket duy nhất (`nutritrack_media_bucket`) được phân vùng thông minh:

*   **`incoming/`**: Landing zone cho ảnh raw mới tải lên (tự động xóa sau 24h).
*   **`voice/`**: Lưu trữ tạm thời các file ghi âm `.m4a` để AI xử lý.
*   **`avatar/`**: Lưu trữ ảnh đại diện người dùng.
*   **`media/`**: Lưu trữ vĩnh viễn các ảnh bữa ăn đã qua xử lý.

---

## 5. Xác thực (Cognito & OAuth2)
*   **Amazon Cognito**: Quản lý User Pool, xác thực email/password.
*   **OAuth2 Google**: Tích hợp đăng nhập nhanh qua tài khoản Google.
*   **JWT Scope**: `email`, `profile`, `openid`.

---

## 6. Xử lý giọng nói (Transcribe)
*   Tích hợp trực tiếp vào luồng ghi âm món ăn.
*   Quyền truy cập được cấu hình chặt chẽ (Service Principal) để Transcribe có thể đọc file trực tiếp từ S3 bucket mà không qua trung gian.

---

## 7. Xử lý hiệu năng cao (ECS Fargate)
*   Chạy cụm **ECS Fargate** với ứng dụng **FastAPI (Python)**.
*   **Chức năng**: Xử lý các tác vụ nặng về CPU/GPU (như quét ảnh qua model Vision AI) mà Lambda không thể xử lý hiệu quả.
*   **Bảo mật**: Nằm sau Application Load Balancer (ALB), xác thực qua Custom Header và API Key từ Secrets Manager.
