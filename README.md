# Recruitment and Job Search

Website tuyển dụng và tìm kiếm việc làm với 3 nhóm người dùng chính: **Candidate**, **HR** và **Admin**. Dự án gồm frontend HTML/CSS/JavaScript thuần và backend Node.js/Express kết nối MongoDB.

## Link Deploy

- Backend/API: https://recruitment-and-job-search.onrender.com
- Frontend/UI: https://viechub.netlify.app/

> Lưu ý: phần hướng dẫn bên dưới chỉ dành cho chạy local.

## Tính năng chính

### Candidate

- Đăng ký, đăng nhập tài khoản ứng viên.
- Xem danh sách việc làm, tìm kiếm theo từ khóa và lọc theo địa điểm, ngành nghề, hình thức làm việc, mức lương, kinh nghiệm.
- Xem chi tiết công việc và công ty.
- Lưu việc làm yêu thích.
- Quản lý CV/hồ sơ ứng tuyển.
- Nộp đơn ứng tuyển.
- Nhận gợi ý việc làm bằng AI dựa trên hồ sơ, kỹ năng và lịch sử tương tác.

### HR

- Quản lý thông tin công ty.
- Đăng và quản lý tin tuyển dụng.
- Theo dõi ứng viên và hồ sơ ứng tuyển.
- Sử dụng AI để hỗ trợ tìm/lọc ứng viên phù hợp.

### Admin

- Quản lý người dùng.
- Quản lý việc làm trong hệ thống.
- Theo dõi báo cáo/tổng quan hệ thống.

## Công nghệ sử dụng

### Frontend

- HTML5
- CSS3
- JavaScript ES Modules
- Bootstrap 5
- Bootstrap Icons

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt/bcryptjs
- Google Gemini AI API
- dotenv
- CORS

## Cấu trúc thư mục

```txt
recruitment-and-job-search/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       └── services/
└── frontend/
    ├── css/
    ├── images/
    ├── js/
    │   ├── Admin js/
    │   ├── Candidate js/
    │   ├── HR js/
    │   └── utils/
    └── pages/
        ├── Admin Pages/
        ├── Candidate Pages/
        ├── HR Pages/
        └── utils/
```

## Chạy project ở local

### 1. Clone repository

```bash
git clone https://github.com/TruongAnhKietK49/recruitment-and-job-search.git
cd recruitment-and-job-search
```

### 2. Cài đặt backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key

# Optional
GEMINI_CHAT_MODEL=gemini-2.0-flash
GEMINI_RECOMMEND_MODEL=gemini-2.0-flash
```

Chạy backend:

```bash
npm run dev
```

Backend local sẽ chạy tại:

```txt
http://localhost:5000
```

### 3. Cấu hình frontend dùng backend local

Mở file:

```txt
frontend/js/utils/url.js
```

Đổi URL API thành local:

```js
const URL = "http://localhost:5000";
export default URL;
```

### 4. Chạy frontend local

Vì frontend là HTML/CSS/JS thuần, có thể chạy bằng extension **Live Server** trong VS Code.

Mở trang ứng viên:

```txt
frontend/pages/Candidate Pages/index.html
```

Một số trang khác:

```txt
frontend/pages/utils/login.html
frontend/pages/HR Pages/candidateManagement.html
frontend/pages/Admin Pages/dashboard.html
```

## Tạo tài khoản admin local

Nếu cần tạo nhanh tài khoản admin mẫu, chạy trong thư mục `backend/`:

```bash
node src/config/seedAdmin.js
```

Thông tin mặc định được seed:

```txt
Email: admin@example.com
Password: 123456
```

## API chính

Backend đang mount các nhóm API sau:

```txt
/api/auth
/api/users
/api/companies
/api/jobs
/api/resumes
/api/applications
/api/skills
/api/notifications
/api/ai
/api/recommend
```

## Scripts backend

```bash
npm run dev      # chạy backend với nodemon
npm start        # chạy backend bằng node
```

## Ghi chú khi chạy local

- Cần bật MongoDB trước khi chạy backend.
- Cần cấu hình đúng `MONGO_URI`, `JWT_SECRET` và `GEMINI_API_KEY` trong `backend/.env`.
- Nếu frontend không gọi được API, kiểm tra lại `frontend/js/utils/url.js` đã trỏ về `http://localhost:5000` chưa.
- Không commit file `.env` lên GitHub.
