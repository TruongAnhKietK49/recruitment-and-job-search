const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../utils/login.html';
}

let userData = null;

function fetchProfile() {
  fetch(`${API_URL}/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      userData = data;
      renderProfile(data);
    })
    .catch(err => console.error(err));
}

function renderProfile(data) {
  const container = document.getElementById('profileData');
  const user = data.user || {};
  const profile = data.profileData || {};

  document.getElementById('sidebarName').textContent = user.fullName || 'Chưa cập nhật';
  const avatarWrapper = document.getElementById('avatarWrapper');
  if (profile.avatar) {
    avatarWrapper.innerHTML = `
      <img src="${profile.avatar}" class="profile-avatar shadow-sm" alt="Avatar">
      <button class="btn-camera"><i class="bi bi-camera"></i></button>
    `;
  }

  // Render Cột Phải (Form)
  container.innerHTML = `
    <form id="profileForm">
      
      <h4 class="section-title">Cài đặt thông tin cá nhân</h4>
      
      <div class="mb-3">
        <label class="form-label">Username</label>
        <input type="text" class="form-control" name="username" value="${user.username || user.fullName || ''}">
      </div>

      <div class="mb-3">
        <label class="form-label">Họ và tên</label>
        <input type="text" class="form-control" name="fullName" value="${user.fullName || ''}">
      </div>

      <div class="mb-3">
        <label class="form-label">Số điện thoại</label>
        <input type="tel" class="form-control" name="phone" value="${user.phone || ''}">
      </div>

      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" value="${user.email || ''}" disabled>
      </div>

      <div class="mb-3">
        <label class="form-label">Ngày sinh</label>
        <input type="date" class="form-control text-muted" name="dob" value="${profile.dob || ''}">
      </div>

      <div class="mb-5">
        <label class="form-label d-block mb-2">Giới tính</label>
        <div class="form-check form-check-inline me-5">
          <input class="form-check-input" type="radio" name="gender" id="genderMale" value="male" ${user.gender === 'male' ? 'checked' : ''}>
          <label class="form-check-label" for="genderMale">Nam</label>
        </div>
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="radio" name="gender" id="genderFemale" value="female" ${user.gender === 'female' ? 'checked' : ''}>
          <label class="form-check-label" for="genderFemale">Nữ</label>
        </div>
      </div>

      <h4 class="section-title border-top pt-4 mt-4">Nhu cầu công việc</h4>

      <div class="mb-3">
        <label class="form-label">Vị trí chuyên môn</label>
        <select class="form-select" name="jobTitle">
          <option value="">Chọn vị trí...</option>
          <option value="Kỹ sư AI" ${profile.jobTitle === 'Kỹ sư AI' ? 'selected' : ''}>Kỹ sư AI</option>
          <option value="Frontend Developer" ${profile.jobTitle === 'Frontend Developer' ? 'selected' : ''}>Frontend Developer</option>
          <option value="Backend Developer" ${profile.jobTitle === 'Backend Developer' ? 'selected' : ''}>Backend Developer</option>
          <option value="Business Analyst" ${profile.jobTitle === 'Business Analyst' ? 'selected' : ''}>Business Analyst</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Kỹ năng</label>
        <input type="text" class="form-control" name="skills" placeholder="VD: Lập trình Python, C++, ..." value="${profile.skills ? profile.skills.join(', ') : ''}">
      </div>

      <div class="mb-3">
        <label class="form-label">Kinh nghiệm</label>
        <select class="form-select" name="experience">
          <option value="">Chọn kinh nghiệm...</option>
          <option value="Dưới 1 năm" ${profile.experience === 'Dưới 1 năm' ? 'selected' : ''}>Dưới 1 năm</option>
          <option value="1 - 3 năm" ${profile.experience === '1 - 3 năm' ? 'selected' : ''}>1 - 3 năm</option>
          <option value="3 - 5 năm" ${profile.experience === '3 - 5 năm' ? 'selected' : ''}>3 - 5 năm</option>
          <option value="Trên 5 năm" ${profile.experience === 'Trên 5 năm' ? 'selected' : ''}>Trên 5 năm</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Mức lương</label>
        <div class="input-group">
          <input type="text" class="form-control" name="expectedSalary" value="${profile.expectedSalary || ''}">
          <span class="input-group-text">VND</span>
        </div>
      </div>

      <div class="mb-4">
        <label class="form-label">Địa điểm làm việc</label>
        <select class="form-select" name="location">
          <option value="">Chọn địa điểm...</option>
          <option value="TP Hồ Chí Minh" ${profile.location === 'TP Hồ Chí Minh' || profile.address === 'TP Hồ Chí Minh' ? 'selected' : ''}>TP Hồ Chí Minh</option>
          <option value="Hà Nội" ${profile.location === 'Hà Nội' || profile.address === 'Hà Nội' ? 'selected' : ''}>Hà Nội</option>
          <option value="Đà Nẵng" ${profile.location === 'Đà Nẵng' || profile.address === 'Đà Nẵng' ? 'selected' : ''}>Đà Nẵng</option>
        </select>
      </div>

      <div class="text-end mt-5">
        <button type="submit" class="btn btn-save"><i class="bi bi-floppy"></i> Lưu</button>
      </div>
    </form>
  `;

  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    updateProfile();
  });
}

function updateProfile() {
  const form = document.getElementById('profileForm');
  const formData = new FormData(form);
  const data = {};
  
  for (let [key, value] of formData.entries()) {
    if (key === 'skills') {
      data[key] = value.split(',').map(s => s.trim()).filter(s => s);
    } else {
      data[key] = value;
    }
  }

  fetch(`${API_URL}/users`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(() => {
      alert('Cập nhật hồ sơ thành công!');
      fetchProfile(); 
    })
    .catch(err => alert('Lỗi: ' + err.message));
}

fetchProfile();