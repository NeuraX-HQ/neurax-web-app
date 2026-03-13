# Database Schema: Challenges

Bảng `Challenges` quản lý các thử thách xã hội (Gamification) của NutriTrack 2.0.

## 1. Vấn Đề Khóa (Vượt Hạn Mức 400KB)
Thiết kế cũ lưu danh sách những người tham gia (`participants`) dưới dạng mảng (Array) lồng bên trong một Document. Nếu thử thách có tính lan truyền cao (viral) và thu hút hàng nghìn người, record sẽ vượt quá giới hạn **400KB** của DynamoDB và gây lỗi ghi. Đồng thời, gây rủi ro cạnh tranh ghi (Write contention) rất lớn khi nhiều user cùng cập nhật tiến độ.

## 2. Giải Pháp: Single-Table Design (Adjacency List Pattern)
Bảng Challenges được thiết kế lại thành **Adjacency List**:
Thay vì 1 record chứa tất cả, bảng dùng `pk` và `sk` để cấu trúc phân cấp:
- **Dữ liệu chung của thử thách (Metadata):** Có `sk` là `METADATA`.
- **Dữ liệu người tham gia (Participants):** Mỗi người tham gia là **1 row riêng biệt**, với `sk` là `PARTICIPANT#<user_id>`.

## 3. Cấu Trúc Bảng

- **Tên bảng:** `NutriTrack-Challenges`
- **Partition Key (PK):** `pk` (String) - Ví dụ: `CHALLENGE#123`
- **Sort Key (SK):** `sk` (String) - Ví dụ: `METADATA` hoặc `PARTICIPANT#user456`

### Item 1: Challenge Metadata
Trường hợp `sk` = `METADATA` và `type` = `ChallengeMetadata`
- `title`, `description`, `challenge_type`, `status`, `target_value`, `start_date`, `end_date`, `creator_id`.

### Item 2: Participant Record
Trường hợp `sk` = `PARTICIPANT#<user_id>` và `type` = `Participant`
- `user_id`: Tương ứng với id người tham gia.
- `progress`: Điểm tiến độ hiện tại so với `target_value`.
- `joined_at`: Ngày tham gia.

## 4. Access Patterns (Query DynamoDB)
- **Lấy thông tin thử thách + Danh sách người tham gia:** 
  `Query PK = CHALLENGE#123`
- **Chỉ lấy thông tin chi tiết thử thách (không lấy danh sách user):** 
  `Query PK = CHALLENGE#123 AND SK = METADATA`
- **Cập nhật tiến độ 1 user (không side-effect):** 
  `UpdateItem PK = CHALLENGE#123, SK = PARTICIPANT#user456` (Không lo Write Contention với user khác).
