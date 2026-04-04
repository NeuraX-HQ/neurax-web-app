# Weekly Insight Prompt

Thư mục này chứa System Prompt và User Prompt Template dùng cho tính năng **AI Weekly Insight** (Báo cáo tổng kết tuần), được thiết kế dựa trên requirements tại `PROPOSAL.md` (Feature 11).

## 1. Mục Đích (Purpose)

Vào mỗi cuối tuần (hoặc khi User chủ động xem tab Analytics), hệ thống sẽ tổng hợp toàn bộ lịch sử ăn uống trong 7 ngày qua của người dùng để sinh ra một lời khuyên ngắn gọn, mang tính cá nhân hoá cao mang phong cách của Coach Ollie.

Thay vì bắt người dùng tự nhìn vào các biểu đồ khô khan, AI sẽ "phiên dịch" dữ liệu đó thành lời nói con người.

## 2. Các Biến Đặc Trưng (Variables)

- `{user_profile_json}`: Mục tiêu hiện tại của user (muốn giảm cân, tăng cơ, v.v).
- `{weekly_summary_json}`: Dữ liệu tổng hợp (VD: Trung bình nạp 1800 calo/ngày, đạt mục tiêu protein 4/7 ngày).
- `{notable_patterns}`: Các pattern do backend tự detect dọn đường sẵn cho AI (VD: "Hay ăn khuya", "Bỏ bữa sáng", "Ăn nhiều đồ chiên rán").

## 3. Cấu Trúc JSON Đầu Ra (Output Structure)

```json
{
  "insight_vi": "Tuần này bạn nạp protein đỉnh quá, đạt chỉ tiêu tận 5/7 ngày luôn! Tuy nhiên Ollie thấy bạn hay ăn vặt đồ ngọt vào ban đêm hơi nhiều đó nha. Tuần tới thử đổi bánh kẹo ăn đêm thành sữa chua không đường xem sao, đảm Olly fit liền!",
  "insight_en": "You crushed your protein goals...",
  "status": "success" // hoặc "insufficient_data" nếu user log < 3 ngày
}
```

## 4. Đặc Điểm Nổi Bật
- **Rất súc tích (Ngắn gọn):** Bắt buộc LLM chỉ trả về đúng **3 câu** (1 câu khen ngợi/tổng kết, 1 câu chỉ ra điểm yếu, 1 câu lời khuyên). Tránh viết văn dài dòng khiến user làm biếng đọc.
- **Xử lý Edge Case:** Nếu trong tuần đó User làm biếng, chỉ log có 1-2 ngày, AI sẽ không phân tích bừa bãi mà chuyển sang chế độ "nhắc nhở nhẹ nhàng" (`insufficient_data`).
