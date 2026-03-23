# Hệ Thống AI Prompts - NutriTrack 2.0

Thư mục này chứa toàn bộ các **System Prompts** và **User Prompt Templates** làm nên linh hồn của Hệ thống Trí Tuệ Nhân Tạo (AI) trong NutriTrack 2.0. Tất cả prompt ở đây đều được thiết kế để kết nối trực tiếp với **Amazon Bedrock**.

---

## 📅 Tiến Độ & Lộ Trình (Prompt Status & Roadmap)

Dưới đây là danh sách tổng hợp tất cả các luồng AI hiện có trong dự án, bao gồm cả các Prompt đã hoàn thiện (MVP Phase 1) và các Prompt sẽ được phát triển trong tương lai (Phase 2 - Spec 2).

| Tính năng (Feature) | Thư mục (Path) | Trạng thái | AI Scope | Chuẩn Đầu Ra (Schema Base) |
|---|---|---|---|---|
| **Voice Logging** | `voice_logging/` | ✅ Hoàn thành | MVP (Phase 1) | `food_logs.json` (Kết hợp FoodData) |
| **Gen Food** (Fallback) | `gen_food/` | ✅ Hoàn thành | MVP (Phase 1) | `FoodData` (Sinh lượng Calo/Macro) |
| **Fix Food Log** | `fix_food/` | ✅ Hoàn thành | MVP (Phase 1) | `food_logs.json` (Modify món cũ) |
| **Macro Calculator** | `macro_calculator/` | ✅ Hoàn thành | MVP (Phase 1) | `user_data.json` (Tính TDEE & Goals) |
| **Recipe Generator** | `recipe_generator/` | ✅ Hoàn thành | MVP (Phase 1) | Gợi ý món từ Tủ lạnh ảo (Fridge) |
| **AI Ollie Coach** | `ollie_coach/` | ✅ Hoàn thành | MVP (Phase 1) | Chat tương tác hằng ngày |
| **Micro Challenges** | `challenges/` | ✅ Hoàn thành | MVP (Phase 1) | Cập nhật Status & Trash Talk |
| **Weekly Insight** | `weekly_insight/` | ✅ Hoàn thành | MVP (Phase 1) | `food_logs.json` (Review sức khoẻ tuần) |
| **Food Detection** (Quét đĩa ăn) | `food_detection/` | ⏳ Chờ xử lý | Phát Phase 2 | Yêu cầu Amazon Bedrock Qwen3 VL |
| **Grocery / Bill Scanner** | `label_reader/` | ⏳ Chờ xử lý | Phát Phase 2 | OCR quét nhãn/hoá đơn (Amazon Textract) |

---

## 🛠 Nguyên Tắc Thiết Kế Prompts (Core Rules)

Tất cả các Prompt trong dự án bắt buộc phải tuân theo tiêu chuẩn kỹ thuật sau để Backend và Mobile không bị lỗi Crash JSON parsing:

1. **Strict JSON:** 100% các prompt đều có Rule cực nghiêm: `Output STRICT JSON format only. NO markdown blocks (```json), no conversational text.`
2. **Xử lý Ngoại Lệ (Edge Cases):** Nếu User nhập dữ liệu tạp nham ("Cho cái máy bay", "Trời hôm nay đẹp quá"), AI tuyệt đối không bị đơ hoặc trả về Data rác. Thay vào đó, nó phải trả về field `action="clarify"` hoặc Error Message phù hợp.
3. **Đa ngôn ngữ (Bilingual Support):** Tất cả Output Message trả về UI / App đều phải hỗ trợ ít nhất 2 keys (ví dụ: `reasoning_vi` và `reasoning_en`) để hệ thống Hỗ trợ Đa ngữ hóa.
4. **Nhất quán Persona (Ollie):** Mọi system prompt của AI Chat đều dùng chung định danh `You are Ollie, an expert AI nutritionist...`. Style phải luôn "đời thường", hòa đồng, thân thiện tích cực.

---

📖 **Dành cho Dev / Kỹ sư (Developer Note):**
- Khi thêm một flow AI mới có giao tiếp JSON với Service Backend, vui lòng kiểm tra kĩ **Schema JSON Đầu Ra** bên trong các file `_prompt.py` để code TypeScript mapping type cho đúng.
- Không sửa file trực tiếp trên production lambda mà bắt buộc phải Commit vào repo `.agent` và review qua Architect.
