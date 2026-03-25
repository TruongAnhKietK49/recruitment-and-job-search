# API Documentation

## Base URL

`http://localhost:{PORT}/api`

Ví dụ nếu `PORT=5000` thì base URL là:

`http://localhost:5000/api`

## Authentication

Hầu hết API yêu cầu JWT token trong header:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

## Response lỗi thường gặp

- `401`: Không có token hoặc token không hợp lệ
- `403`: Không đủ quyền
- `404`: Không tìm thấy dữ liệu
- `500`: Lỗi server

## 1. Auth

### POST `/auth/register`

Quyền: Public

Body:

```json
{
  "email": "candidate@example.com",
  "password": "123456",
  "fullName": "Nguyen Van A",
  "phone": "0900000000",
  "gender": "male",
  "role": "candidate"
}
```

Ghi chú:

- `role` chỉ nhận `hr` hoặc `candidate`
- `gender` nhận `male` hoặc `female`

Response `201`:

```json
{
  "message": "User registered successfully"
}
```

### POST `/auth/login`

Quyền: Public

Body:

```json
{
  "email": "candidate@example.com",
  "password": "123456"
}
```

Response `200`:

```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "candidate@example.com",
    "fullName": "Nguyen Van A",
    "role": "candidate"
  }
}
```

## 2. Users

### GET `/users/profile`

Quyền: Đã đăng nhập

Input:

- Không có body

Response `200`:

```json
{
  "user": {
    "_id": "user_id",
    "email": "candidate@example.com",
    "fullName": "Nguyen Van A",
    "phone": "0900000000",
    "gender": "male",
    "role": "candidate",
    "status": "active"
  },
  "profileData": {
    "_id": "profile_id",
    "userId": "user_id",
    "education": "FPT University",
    "avatar": "https://...",
    "expectedSalary": 1500,
    "expSummary": "2 years FE",
    "address": "HCM",
    "skills": ["skill_id"]
  }
}
```

### GET `/users`

Quyền: `admin`

Response `200`:

```json
[
  {
    "_id": "user_id",
    "email": "hr@example.com",
    "fullName": "HR Name",
    "phone": "0900000000",
    "gender": "female",
    "role": "hr",
    "status": "active"
  }
]
```

### GET `/users/:id`

Quyền: `admin`, `hr`

Params:

- `id`: user id

Response `200`: giống `GET /users/profile`

### PUT `/users`

Quyền: Đã đăng nhập

Body:

- API này nhận trực tiếp các field update từ `User`
- Nếu user là `candidate` hoặc `hr`, controller cũng dùng cùng `req.body` để update profile tương ứng

Ví dụ:

```json
{
  "fullName": "Nguyen Van B",
  "phone": "0911111111",
  "education": "UIT",
  "address": "Da Nang",
  "expectedSalary": 2000
}
```

Response `200`:

```json
{
  "updatedUser": {
    "_id": "user_id",
    "fullName": "Nguyen Van B",
    "phone": "0911111111"
  },
  "updatedProfile": {
    "_id": "profile_id",
    "userId": "user_id",
    "education": "UIT",
    "address": "Da Nang",
    "expectedSalary": 2000
  }
}
```

### DELETE `/users/:id`

Quyền: `admin`

Response `200`:

```json
{
  "message": "User deleted successfully"
}
```

## 3. Candidate Profile

### POST `/users/candidate-profile`

Quyền: `candidate`

Body:

```json
{
  "education": "FPT University",
  "avatar": "https://...",
  "expectedSalary": 1200,
  "expSummary": "1 year React",
  "address": "HCM",
  "skill": ["skill_id_1", "skill_id_2"]
}
```

Ghi chú:

- Field request là `skill` nhưng dữ liệu lưu xuống DB là `skills`

Response `200`:

```json
{
  "_id": "profile_id",
  "userId": "user_id",
  "education": "FPT University",
  "avatar": "https://...",
  "expectedSalary": 1200,
  "expSummary": "1 year React",
  "address": "HCM",
  "skills": ["skill_id_1", "skill_id_2"]
}
```

### DELETE `/users/candidate-profile`

Quyền: `candidate`

Response `200`:

```json
{
  "message": "Candidate profile deleted successfully"
}
```

## 4. HR Profile

### POST `/users/hr-profile`

Quyền: `hr`

Body:

```json
{
  "companyId": "company_id",
  "position": "Recruiter",
  "verifiedStatus": "pending"
}
```

Response `200`:

```json
{
  "_id": "hr_profile_id",
  "userId": "user_id",
  "companyId": "company_id",
  "position": "Recruiter",
  "verifiedStatus": "pending"
}
```

Lưu ý:

- Controller hiện đang dùng `findByIdAndUpdate(userId, req.body)`, nên endpoint này có thể không hoạt động đúng nếu `_id` của `HrProfile` khác `userId`

### DELETE `/users/hr-profile`

Quyền: `hr`

Response `200`:

```json
{
  "message": "HrProfile deleted successfully"
}
```

## 5. Companies

### POST `/companies`

Quyền: `admin`, `hr`

Body:

```json
{
  "companyName": "Open Tech",
  "address": "HCM City",
  "website": "https://opentech.vn",
  "description": "Software company",
  "logoUrl": "https://..."
}
```

Response `201`:

```json
{
  "_id": "company_id",
  "companyName": "Open Tech",
  "address": "HCM City",
  "website": "https://opentech.vn",
  "description": "Software company",
  "logoUrl": "https://...",
  "status": "active",
  "createdBy": {
    "_id": "user_id",
    "fullName": "HR Name",
    "email": "hr@example.com",
    "role": "hr"
  },
  "members": ["user_id"]
}
```

### GET `/companies`

Quyền: Đã đăng nhập

Query:

- `page`: số trang, mặc định `1`
- `limit`: số bản ghi, mặc định `10`
- `keyword`: tìm theo `companyName`
- `status`: `active` hoặc `inactive`

Ghi chú:

- Nếu user là `hr` thì chỉ lấy công ty do chính HR đó tạo

Response `200`:

```json
{
  "total": 1,
  "page": 1,
  "totalPages": 1,
  "companies": [
    {
      "_id": "company_id",
      "companyName": "Open Tech",
      "address": "HCM City",
      "website": "https://opentech.vn",
      "status": "active"
    }
  ]
}
```

### GET `/companies/:id`

Quyền: Đã đăng nhập

Params:

- `id`: company id

Response `200`:

```json
{
  "company": {
    "_id": "company_id",
    "companyName": "Open Tech"
  },
  "jobs": [
    {
      "_id": "job_id",
      "title": "Frontend Developer",
      "category": "IT",
      "salaryMin": 1000,
      "salaryMax": 2000,
      "experience": "2 years",
      "jobType": "full-time",
      "deadline": "2026-04-30T00:00:00.000Z",
      "status": "approved"
    }
  ]
}
```

## 6. Jobs

### GET `/jobs`

Quyền: Đã đăng nhập

Query:

- `page`
- `limit`
- `keyword`: tìm theo `title`
- `category`
- `status`
- `jobType`: `full-time`, `part-time`, `internship`, `remote`
- `companyId`

Ghi chú:

- Nếu user là `candidate` thì backend tự ép `status = approved`

Response `200`:

```json
{
  "total": 2,
  "page": 1,
  "totalPages": 1,
  "jobs": [
    {
      "_id": "job_id",
      "title": "Frontend Developer",
      "description": "React developer",
      "category": "IT",
      "salaryMin": 1000,
      "salaryMax": 2000,
      "experience": "2 years",
      "jobType": "full-time",
      "deadline": "2026-04-30T00:00:00.000Z",
      "status": "approved",
      "companyId": {
        "_id": "company_id",
        "companyName": "Open Tech",
        "logoUrl": "https://..."
      }
    }
  ]
}
```

### GET `/jobs/pending`

Quyền: `admin`

Response `200`:

```json
[
  {
    "_id": "job_id",
    "title": "Frontend Developer",
    "status": "pending"
  }
]
```

### GET `/jobs/:id`

Quyền: `admin`, `hr`

Params:

- `id`: job id

Response `200`:

```json
{
  "_id": "job_id",
  "companyId": {
    "_id": "company_id",
    "companyName": "Open Tech"
  },
  "title": "Frontend Developer",
  "description": "React developer",
  "category": "IT",
  "salaryMin": 1000,
  "salaryMax": 2000,
  "experience": "2 years",
  "jobType": "full-time",
  "deadline": "2026-04-30T00:00:00.000Z",
  "status": "pending"
}
```

### POST `/jobs`

Quyền: `admin`, `hr`

Body:

```json
{
  "companyId": "company_id",
  "title": "Frontend Developer",
  "description": "React developer",
  "category": "IT",
  "salaryMin": 1000,
  "salaryMax": 2000,
  "experience": "2 years",
  "jobType": "full-time",
  "deadline": "2026-04-30T00:00:00.000Z"
}
```

Ghi chú:

- Khi tạo mới, `status` luôn là `pending`

Response `201`:

```json
{
  "message": "Job submitted successfully and is waiting for admin approval",
  "job": {
    "_id": "job_id",
    "companyId": "company_id",
    "title": "Frontend Developer",
    "status": "pending"
  }
}
```

### PUT `/jobs/:id`

Quyền: `admin`, `hr`

Params:

- `id`: job id

Body:

- Gửi các field muốn update của `Job`

Ví dụ:

```json
{
  "title": "Senior Frontend Developer",
  "salaryMin": 1500,
  "salaryMax": 2500,
  "status": "closed"
}
```

Response `200`:

```json
{
  "_id": "job_id",
  "title": "Senior Frontend Developer",
  "salaryMin": 1500,
  "salaryMax": 2500,
  "status": "closed"
}
```

### DELETE `/jobs/:id`

Quyền: `admin`, `hr`

Response `200`:

```json
{
  "message": "Job deleted successfully"
}
```

### PATCH `/jobs/:id/approve`

Quyền: `admin`

Body:

```json
{
  "reviewNote": "Approved"
}
```

Response `200`:

```json
{
  "message": "Job approved successfully",
  "job": {
    "_id": "job_id",
    "status": "approved",
    "reviewedBy": "admin_user_id",
    "reviewNote": "Approved"
  }
}
```

### PATCH `/jobs/:id/reject`

Quyền: `admin`

Body:

```json
{
  "reviewNote": "Missing information"
}
```

Response `200`:

```json
{
  "message": "Job rejected successfully",
  "job": {
    "_id": "job_id",
    "status": "rejected",
    "reviewedBy": "admin_user_id",
    "reviewNote": "Missing information"
  }
}
```

## 7. Job View History

### POST `/jobs/view-history`

Quyền: `candidate`

Body:

```json
{
  "jobId": "job_id"
}
```

Response `201` hoặc `200`:

```json
{
  "_id": "history_id",
  "userId": "user_id",
  "jobId": "job_id",
  "viewDate": "2026-03-24T00:00:00.000Z"
}
```

### GET `/jobs/view-history/me`

Quyền: `candidate`

Response `200`:

```json
[
  {
    "_id": "history_id",
    "userId": "user_id",
    "jobId": {
      "_id": "job_id",
      "title": "Frontend Developer",
      "companyId": {
        "_id": "company_id",
        "companyName": "Open Tech",
        "logoUrl": "https://..."
      }
    },
    "viewDate": "2026-03-24T00:00:00.000Z"
  }
]
```

### DELETE `/jobs/view-history/:id`

Quyền: `candidate`

Response `200`:

```json
{
  "message": "History deleted successfully"
}
```

## 8. Saved Jobs

### GET `/jobs/save-job/me`

Quyền: `candidate`

Response `200`:

```json
[
  {
    "_id": "saved_id",
    "userId": "user_id",
    "jobId": {
      "_id": "job_id",
      "title": "Frontend Developer",
      "companyId": {
        "_id": "company_id",
        "companyName": "Open Tech",
        "logoUrl": "https://..."
      }
    }
  }
]
```

### POST `/jobs/save-job`

Quyền: `candidate`

Body:

```json
{
  "jobId": "job_id"
}
```

Response `201`:

```json
{
  "_id": "saved_id",
  "userId": "user_id",
  "jobId": "job_id"
}
```

### DELETE `/jobs/save-job/:id`

Quyền: `candidate`

Params:

- `id`: thực tế là `jobId`, không phải `_id` của bảng saved job

Response `200`:

```json
{
  "message": "Đã bỏ lưu thành công"
}
```

## 9. Resumes

### GET `/resumes/me`

Quyền: `candidate`

Response `200`:

```json
[
  {
    "_id": "resume_id",
    "userId": "user_id",
    "title": "CV React",
    "fileUrl": "https://..."
  }
]
```

### GET `/resumes/:id`

Quyền: Đã đăng nhập

Params:

- `id`: resume id

Ghi chú:

- `candidate` chỉ xem được resume của chính mình
- `admin` và `hr` có thể xem resume theo id

Response `200`:

```json
{
  "_id": "resume_id",
  "userId": {
    "_id": "user_id",
    "fullName": "Nguyen Van A",
    "email": "candidate@example.com",
    "avatar": "https://..."
  },
  "title": "CV React",
  "fileUrl": "https://..."
}
```

### POST `/resumes`

Quyền: `candidate`

Body:

```json
{
  "title": "CV React",
  "fileUrl": "https://..."
}
```

Response `201`:

```json
{
  "_id": "resume_id",
  "userId": "user_id",
  "title": "CV React",
  "fileUrl": "https://..."
}
```

### PUT `/resumes/:id`

Quyền: `candidate`

Body:

```json
{
  "title": "CV React Updated",
  "fileUrl": "https://new-file-url"
}
```

Response `200`:

```json
{
  "_id": "resume_id",
  "title": "CV React Updated",
  "fileUrl": "https://new-file-url"
}
```

### DELETE `/resumes/:id`

Quyền: `candidate`

Response `200`:

```json
{
  "message": "Resume deleted successfully"
}
```

## 10. Applications

### POST `/applications`

Quyền: `candidate`

Body:

```json
{
  "jobId": "job_id",
  "resumeId": "resume_id"
}
```

Response `201`:

```json
{
  "_id": "application_id",
  "jobId": {
    "_id": "job_id",
    "title": "Frontend Developer",
    "category": "IT",
    "status": "approved"
  },
  "userId": {
    "_id": "user_id",
    "fullName": "Nguyen Van A",
    "email": "candidate@example.com"
  },
  "resumeId": {
    "_id": "resume_id",
    "title": "CV React",
    "fileUrl": "https://..."
  },
  "status": "pending",
  "applyDate": "2026-03-24T00:00:00.000Z"
}
```

### GET `/applications`

Quyền: Đã đăng nhập

Query:

- `page`
- `limit`
- `status`: `pending`, `reviewing`, `accepted`, `rejected`
- `jobId`

Ghi chú:

- Nếu user là `candidate` thì chỉ lấy application của chính user đó

Response `200`:

```json
{
  "total": 1,
  "page": 1,
  "totalPages": 1,
  "applications": [
    {
      "_id": "application_id",
      "status": "pending"
    }
  ]
}
```

### GET `/applications/:id`

Quyền: Đã đăng nhập

Params:

- `id`: application id

Ghi chú:

- `candidate` chỉ xem được application của chính mình

Response `200`: object application chi tiết

### PATCH `/applications/:id/status`

Quyền: `admin`, `hr`

Body:

```json
{
  "status": "accepted"
}
```

Giá trị hợp lệ:

- `pending`
- `reviewing`
- `accepted`
- `rejected`

Response `200`:

```json
{
  "message": "Application status updated successfully",
  "application": {
    "_id": "application_id",
    "status": "accepted"
  }
}
```

Ghi chú:

- Với role `hr`, chỉ HR là người tạo company của job đó mới update được

### DELETE `/applications/:id`

Quyền: `admin`, `candidate`

Ghi chú:

- `candidate` chỉ xóa được application của chính mình

Response `200`:

```json
{
  "message": "Application deleted successfully"
}
```

## 11. Skills

### POST `/skills`

Quyền: `admin`

Body:

```json
{
  "skillName": "ReactJS"
}
```

Response `201`:

```json
{
  "_id": "skill_id",
  "skillName": "ReactJS"
}
```

### GET `/skills/me`

Quyền: Đã đăng nhập

Ghi chú:

- Hiện tại API này trả về toàn bộ skill, không lọc theo user

Response `200`:

```json
[
  {
    "_id": "skill_id",
    "skillName": "ReactJS"
  }
]
```

### GET `/skills`

Quyền: Đã đăng nhập

Query:

- `keyword`: tìm theo `skillName`

Response `200`:

```json
[
  {
    "_id": "skill_id",
    "skillName": "ReactJS"
  }
]
```

### GET `/skills/user/:userId`

Quyền: `admin`, `hr`

Response `200`:

```json
[
  {
    "_id": "skill_id",
    "skillName": "ReactJS"
  }
]
```

### GET `/skills/:id`

Quyền: `admin`

Response `200`:

```json
{
  "_id": "skill_id",
  "skillName": "ReactJS"
}
```

### PUT `/skills/:id`

Quyền: `admin`

Body:

```json
{
  "skillName": "Next.js"
}
```

Response `200`:

```json
{
  "_id": "skill_id",
  "skillName": "Next.js"
}
```

### DELETE `/skills/:id`

Quyền: `admin`

Response `200`:

```json
{
  "message": "Skill deleted successfully"
}
```

## 12. Notifications

### GET `/notifications/me`

Quyền: Đã đăng nhập

Response `200`:

```json
[
  {
    "_id": "notification_id",
    "userId": "user_id",
    "type": "job_approval",
    "content": "Job is waiting for approval",
    "isRead": false,
    "jobId": "job_id"
  }
]
```

### POST `/notifications`

Quyền: `admin`, `hr`

Body:

```json
{
  "userId": "user_id",
  "content": "Bạn có thông báo mới"
}
```

Response `201`:

```json
{
  "_id": "notification_id",
  "userId": "user_id",
  "content": "Bạn có thông báo mới",
  "isRead": false
}
```

### PATCH `/notifications/:id/read`

Quyền: Đã đăng nhập

Ghi chú:

- Chỉ user sở hữu notification mới được đánh dấu đã đọc

Response `200`:

```json
{
  "message": "Notification marked as read",
  "notification": {
    "_id": "notification_id",
    "isRead": true
  }
}
```

### DELETE `/notifications/:id`

Quyền: Đã đăng nhập

Ghi chú:

- Chỉ user sở hữu notification mới được xóa

Response `200`:

```json
{
  "message": "Notification deleted successfully"
}
```

## 13. Data Models tổng quát

### User

```json
{
  "_id": "ObjectId",
  "email": "string",
  "password": "string",
  "fullName": "string",
  "phone": "string",
  "gender": "male | female",
  "role": "candidate | hr | admin",
  "status": "active | inactive"
}
```

### Company

```json
{
  "_id": "ObjectId",
  "companyName": "string",
  "address": "string",
  "website": "string",
  "description": "string",
  "createdBy": "user_id",
  "logoUrl": "string",
  "status": "active | inactive",
  "members": ["user_id"]
}
```

### Job

```json
{
  "_id": "ObjectId",
  "companyId": "company_id",
  "title": "string",
  "description": "string",
  "category": "string",
  "salaryMin": 1000,
  "salaryMax": 2000,
  "experience": "string",
  "jobType": "full-time | part-time | internship | remote",
  "deadline": "date",
  "status": "pending | approved | rejected | closed"
}
```

### Resume

```json
{
  "_id": "ObjectId",
  "userId": "user_id",
  "title": "string",
  "fileUrl": "string"
}
```

### Application

```json
{
  "_id": "ObjectId",
  "jobId": "job_id",
  "userId": "user_id",
  "resumeId": "resume_id",
  "status": "pending | reviewing | accepted | rejected",
  "applyDate": "date"
}
```

### CandidateProfile

```json
{
  "_id": "ObjectId",
  "userId": "user_id",
  "avatar": "string",
  "education": "string",
  "expSummary": "string",
  "expectedSalary": 1200,
  "address": "string",
  "skills": ["skill_id"]
}
```

### HrProfile

```json
{
  "_id": "ObjectId",
  "userId": "user_id",
  "companyId": "company_id",
  "position": "string",
  "verifiedStatus": "pending | verified | rejected"
}
```

### Skill

```json
{
  "_id": "ObjectId",
  "skillName": "string"
}
```

### Notification

```json
{
  "_id": "ObjectId",
  "userId": "user_id",
  "type": "string",
  "content": "string",
  "isRead": false,
  "jobId": "job_id"
}
```
