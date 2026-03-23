# Macro Calculator Prompt

Thư mục này chứa System Prompt và User Prompt Template dùng để Tính toán và Lên mục tiêu Dinh dưỡng (Daily Targets) cho người dùng sau bước Onboarding hoặc khi họ cập nhật hồ sơ cá nhân.

## 1. Mục Đích (Purpose)

Thay vì dùng các công thức hardcode phức tạp trên Frontend/Backend (như Mifflin-St Jeor) và phải viết các hàm if-else chằng chịt cho từng chế độ ăn kiêng (Keto, Low-Carb, High-Protein), chúng ta uỷ quyền toàn bộ logic tính toán này cho AI.
Ollie (AI) sẽ đọc toàn bộ JSON của `UserData` (bao gồm `biometrics`, `goals`, `dietary_profile`) và ói ra 4 con số chính xác nhất về Calories và Macros dựa trên kiến thức dinh dưỡng chuẩn y khoa.

## 2. Các Biến Có Thể Điền (Variables)

- `{user_profile_json}`: Một string JSON dump trực tiếp từ table `UserData` (hoặc payload từ màn hình Onboarding). Bao gồm các thông số cân nặng, chiều cao, mục tiêu, và sở thích ăn kiêng.

## 3. Cấu Trúc JSON Đầu Ra (Output Structure)

```json
{
  "daily_calories": 2000,
  "daily_protein_g": 150,
  "daily_carbs_g": 150,
  "daily_fat_g": 65,
  "reasoning_vi": "Câu giải thích bằng tiếng Việt với giọng điệu thân thiện.",
  "reasoning_en": "The reasoning translated to English."
}
```

## 4. Đặc Điểm Nổi Bật
- **Linh hoạt tuyệt đối:** Nếu tương lai App có thêm mode ăn chay "Vegan" hay "DASH diet", Dev không cần viết thêm hàm tính toán macro nào cả. LLM tự hiểu tỉ lệ macro cho Vegan là gì.
- **Có tính tương tác:** Trả về câu `reasoning` giải thích cho User tại sao lại ra con số đó, tạo niềm tin cho người dùng ngay từ lúc vừa đăng ký vào App.
- **Phòng hờ lỗi:** Có xử lý Edge Case nếu thông số đầu vào bị lỗi (tuổi = 0, cân nặng = 0) thì AI vẫn cấp mức 2000 Calo tiêu chuẩn để App không bị Crash.
