# Challenges Prompt (Quản lý Thử thách Gamification)

Thư mục này chứa mẫu prompt hỗ trợ tính năng Tính điểm / Đánh giá Thử Thách theo hình thức tổng kết nhóm (Leaderboard).

## 1. Mục đích
Dựa theo persona "Ollie - Huấn luyện viên AI", Ollie sẽ phân tích Context gồm thông tin mô tả chi tiết của Thử thách đó (vd: Không đường 7 ngày) kèm Bảng xếp hạng tiến độ (Leaderboard string) của toàn bộ user tham gia. AI sẽ động viên bằng cách nhắc tên người dẫn đầu và gợi ý người đang xem app cố gắng hơn.

## 2. File trong thư mục
- `challenges_prompt.py`: Dữ liệu gốc ở `neurax-ai-core/src/nutritrack/challenges.py` được extract sang.
  - `CHALLENGE_SYSTEM_PROMPT`: Giới hạn phong cách (Gen-Z) và số lượng từ ngữ trả ra (tối đa 3 câu). Đảm bảo xuất JSON.
  - `CHALLENGE_USER_PROMPT_TEMPLATE`: Template động điền các thông số Leaderboard theo cơ sở dữ liệu mỗi khi Backend Lambda chạy.

## 3. Định dạng Output
```json
{
  "summary": "Tóm tắt tiến độ vui vẻ (VD: 'Ê, Hùng đang dẫn đầu kìa, Minh cố lên 2 ngày nữa nha! 🔥')",
  "leader": "user_id_dang_dan_dau",
  "mood": "celebrate"
}
```

## 4. Trường hợp ngoại lệ (Edge Cases)
Nếu Bảng xếp hạng truy xuất từ DynamoDB bị rỗng (Chưa có ai tham gia Challenge này), System prompt yêu cầu AI không hoảng loạn hoặc báo lỗi. Thay vào đó, AI sẽ coi đây là "Mở màn" và trả về Text rủ rê User đầu tiên:
```json
{
  "summary": "Chà, thử thách này chưa có ai tham gia cả! Bạn có muốn trở thành người tiên phong dẫn đầu bảng xếp hạng không nè? Tham gia ngay nha! ✨",
  "leader": null,
  "mood": "encourage"
}
```
