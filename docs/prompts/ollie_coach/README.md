# Coach Ollie Prompt (Huấn Luyện Viên AI)

Thư mục này chứa mẫu prompt gốc (raw prompt template) được sử dụng cho tính năng AI Coach (Ollie). Đây là bộ prompt mang tính định hướng tính cách cao nhất trong hệ thống NutriTrack.

## 1. Mục đích
Ollie là mô hình AI (thường dùng Claude 3.5 Haiku để tiết kiệm chi phí) được thiết kế với "Personality Định Dạng" như một người bạn thân thiết. Nhiệm vụ của Ollie là theo dõi dữ liệu của User và đưa ra những lời khuyên kịp thời, đúng lúc trong 3 chế độ (Mode) chính:
- Sáng sớm (Morning): Khích lệ bắt đầu hành trình hằng ngày.
- Sau bữa ăn (After Meal): Góp ý/cập nhật thông số Macro calo, protein dựa theo bữa ăn vừa nạp.
- Cuối ngày (End of Day): Tổng kết ngày và vỗ về khen ngợi/tạo động lực cho ngày mai.

## 2. Các file trong thư mục
- `ollie_coach_prompt.py`: Chứa các mẫu Prompt:
  - `OLLIE_SYSTEM_PROMPT`: Thiết lập tính cách Gen-Z, giới hạn số câu trả lời (max 2), và phong cách viết vui vẻ, casual.
  - `MORNING_PROMPT`, `AFTER_MEAL_PROMPT`, `END_OF_DAY_PROMPT`: Mẫu truyền dữ liệu (Context) gồm User Name, Số ngày duy trì Streak, Tỉ lệ % Calo/Protein đã hoàn thành... để AI tham khảo khi đưa ra lời khuyên.

## 3. Định dạng Output
Dữ liệu được trả về bắt buộc theo định dạng JSON gồm các trường:
- `tip`: Lời khuyên/lời chào chính của Ollie (Hiển thị nổi bật trên UI).
- `mood`: Cảm xúc hiện tại ("celebrate", "encourage", "suggest", "neutral") để hiển thị ảnh động/Biểu cảm tương ứng của Mascot Ollie trên App.
- `suggested_food`: Món ăn AI suggest thêm cho bữa sau nếu User đang thiếu dinh dưỡng (nếu có null).

## 4. Trường hợp ngoại lệ (Edge Cases)
Prompt này khá an toàn (Low Risk) do tất cả thông số đều được API truyền vào dưới dạng Context kỹ thuật. 
- Nhưng nếu User bị thiếu các biến số nội bộ (vd: `last_meal_calories` = null, hay `streak_days` = 0) thì Ollie được cấp quyền bỏ qua thống kê con số, chuyển sang lời khích lệ chung (Generic motivation message) để hạn chế lỗi hiển thị.
- Tính tự chữa lỗi JSON: Hệ thống Regex chạy nền ở server sẽ bóc tách mọi chuỗi JSON trả ra (thậm chí khi AI lỡ bao JSON vào markdown block) để tránh sập Front-End.
