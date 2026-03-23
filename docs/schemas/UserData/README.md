# Database Schema: UserData

Bảng `UserData` đóng vai trò là "trái tim" của hệ thống NutriTrack 2.0. Nó lưu trữ toàn bộ hồ sơ, mục tiêu dinh dưỡng, tình trạng thể chất, cấu hình AI, và tiến trình Gamification của người dùng trong một tài liệu JSON duy nhất.

## 1. Thông Tin Chung

- **Tên bảng:** `UserData`
- **Capacity Mode:** On-demand (PAY_PER_REQUEST)
- **Point-in-Time Recovery (PITR):** Enabled
- **Partition Key (PK):** `user_id` (String) - Sử dụng Cognito `sub`
- **Sort Key (SK):** None (1 user = 1 record)

## 2. Thiết Kế Kiến Trúc (JSON Document Pattern)

Thiết kế này gom toàn bộ trạng thái cá nhân hóa thành một item duy nhất, mang lại các lợi ích cho hệ thống AWS Serverless:

1. **Low Latency:** Gọi 1 lần `GetItem` khi user khởi động app là lấy được đủ context.
2. **AI Context Ready:** Khối `dietary_profile` và `goals` có thể nhúng trực tiếp vào Prompt của Amazon Bedrock để AI Coach hoặc Recipe Generator cung cấp gợi ý cá nhân hóa chính xác.
3. **Easy Partial Updates:** Sử dụng `UpdateExpression` của DynamoDB để dễ dàng update từng block nhỏ (như `gamification.current_streak`) mà không cần ghi lại toàn bộ bảng.

---

## 3. Cấu Trúc Các Trường (Schema Breakdown)

### 3.1 Thông tin định danh (Core Profile)

Lưu trữ thông tin cơ bản về định danh người dùng.

- `user_id` (String): Cognito UUID (Khóa chính).
- `email` (String): Email của user.
- `display_name` (String): Tên hiển thị trên leaderboard hoặc trong app.
- `avatar_url` (String): Link S3 public định dạng ảnh đại diện.
- `created_at` (String - ISO 8601): Thời điểm khởi tạo tài khoản.
- `last_active_at` (String - ISO 8601): Thời điểm user tương tác cuối cùng, dùng cho analytics và dọn dẹp data (clean inactive users).
- `onboarding_completed` (Boolean): Flag xác định user đã điền đủ thông tin thiết lập ban đầu hay chưa.
- `ai_context_summary` (String): Chuỗi văn bản tóm tắt profile user (vd: "24yo male, weight loss goal, allergic peanuts, prefers high protein"). Trường này được dùng để nhúng thẳng vào các AI Prompts nhằm tiết kiệm lượng Token Cost thay vì đẩy cả mảng JSON khổng lồ vào Bedrock.

### 3.2 Chỉ số sinh học (Biometrics)

Dùng để tính toán chỉ số BMR/TDEE cá nhân hóa.

- `biometrics.age` (Int): Tuổi.
- `biometrics.gender` (String): `male`, `female`, `other`.
- `biometrics.height_cm` (Float): Chiều cao theo cm.
- `biometrics.weight_kg` (Float): Cân nặng hiện tại.
- `biometrics.activity_level` (String): Mức độ hoạt động (`sedentary`, `lightly_active`, `moderately_active`, `very_active`, `extra_active`).

### 3.3 Mục tiêu vĩ mô (Goals)

Chỉ số mục tiêu để so sánh với lượng Logged Food mỗi ngày.

- `goals.daily_calories` (Float): Mục tiêu Calo một ngày.
- `goals.daily_protein_g` (Float): Mục tiêu Protein.
- `goals.daily_carbs_g` (Float): Mục tiêu Carbs.
- `goals.daily_fat_g` (Float): Mục tiêu Fat.
- `goals.target_weight_kg` (Float): Mục tiêu cân nặng hướng tới.

### 3.4 Hồ sơ ăn uống (Dietary Profile)

Rất quan trọng cho khâu tạo món (Recipe Generator) từ Inventory tủ lạnh để AI không gợi ý các nguyên liệu chết người do dị ứng.

- `dietary_profile.allergies` (List[String]): Danh sách thành phần dị ứng (vd: `["peanuts", "shellfish"]`).
- `dietary_profile.preferences` (List[String]): Danh sách chế độ ăn (vd: `["vegetarian", "keto", "low_carb"]`).

### 3.5 Gamification & AI Settings

Hệ thống streak và cấu hình AI Coach ảo.

- `gamification.current_streak` (Int): Số ngày liên tục log đồ ăn.
- `gamification.longest_streak` (Int): Chuỗi ngày dài nhất.
- `gamification.last_log_date` (String - YYYY-MM-DD): Ngày log thức ăn cuối cùng. Lambda chạy cron có thể dựa vào đây để reset `current_streak` về 0 nếu user bỏ qua 1 ngày.
- `gamification.total_points` (Int): Tổng điểm dùng để xếp hạng Leaderboard.
- `ai_preferences.coach_tone` (String): Chế độ tương tác của AI (vd: `friendly_genz`, `strict`, `analytical`).

---

## 4. Phân Tích Mở Rộng (Future Access Patterns)

Nếu sau này NutriTrack cần xây dựng Leaderboard cho Phase 3:

- **Tạo GSI (Global Secondary Index)**:
  - **Index Name:** `LeaderboardIndex`
  - **PK:** `shard_id` (Thêm 1 trường tĩnh như "global" để gom user, hoặc chia theo cấp "rank").
  - **SK:** `gamification.total_points` (DESC).
  - **Projection:** Chỉ chọn `user_id`, `display_name`, `avatar_url`, `total_points` để tối ưu Query.
