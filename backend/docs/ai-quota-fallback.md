# AI fallback khi hết quota (không set được billing)

## Mục tiêu
Khi tài khoản Gemini/OpenAI hết quota và chưa thể bật billing, hệ thống vẫn cần trả lời:
- Chat recruiter
- Truy vấn dữ liệu nội bộ qua tool/function calling
- Recommendation cơ bản

## Ưu tiên đề xuất

### 1) Ollama (chạy local, miễn phí) — khuyến nghị số 1
- Dùng khi: có máy/server chạy được GPU hoặc CPU mạnh.
- Ưu điểm:
  - Không phụ thuộc billing cloud.
  - Dữ liệu nội bộ không ra ngoài internet (tốt cho privacy).
  - Ổn định để xử lý luồng có tool calling ở backend.
- Model gợi ý:
  - `qwen2.5:7b-instruct` (chất lượng/tốc độ tốt)
  - `llama3.1:8b-instruct` (ổn định, dễ dùng)
  - `mistral:7b-instruct` (nhẹ, nhanh)

### 2) Groq free tier (cloud, có free usage)
- Dùng khi: cần tốc độ cao, không có hạ tầng local.
- Model hay cho tiếng Việt/assistant:
  - `llama-3.1-8b-instant`
  - `qwen/qwen3-32b` (nếu còn free quota theo thời điểm)
- Lưu ý: free tier thay đổi theo thời gian.

### 3) OpenRouter free models
- Dùng khi: muốn đổi provider linh hoạt qua API gateway.
- Có thể test nhanh nhiều model mà không khóa vào một hãng.
- Lưu ý: độ ổn định free model không đồng đều.

## Kiến trúc fallback khuyến nghị

1. Giữ `executeTool` ở backend như hiện tại (DB là nguồn sự thật).
2. Tách lớp gọi model thành `AIProvider`:
   - `GeminiProvider`
   - `OllamaProvider`
   - `GroqProvider`
3. Dùng thứ tự fallback:
   - Primary: Gemini
   - Fallback 1: Ollama
   - Fallback 2: Groq/OpenRouter
4. Chuẩn hóa output JSON schema để giảm lỗi parse và giảm token.

## Cấu hình gợi ý để giảm token/quota
- `maxOutputTokens`: 400–700
- Giới hạn history: 6–8 messages
- Truncate tool response: 2–3KB
- Query DB giới hạn nhỏ trước khi đưa cho model

## Kết luận ngắn
Nếu bạn không thể bật billing ngay, lựa chọn thực dụng nhất là **Ollama local + model Qwen/Llama 7B–8B** để duy trì hệ thống ổn định. Cloud free tier (Groq/OpenRouter) phù hợp làm dự phòng.
