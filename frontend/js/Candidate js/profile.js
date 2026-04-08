const API_URL = 'http://localhost:5000/api';

let token = localStorage.getItem('token') || sessionStorage.getItem('token');

if (token === 'null' || token === 'undefined') {
  token = null;
}

if (!token) {
  window.location.href = '../utils/login.html';
}

let userData = null;
let allSkills = []; 

async function initData() {
  try {
    const [profileRes, skillsRes] = await Promise.all([
      fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/skills`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const profileData = await profileRes.json();
    allSkills = await skillsRes.json(); // Array chứa các object { _id, skillName }

    userData = profileData;
    renderProfile(profileData);
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu:', err);
  }
}

// 2. Render Form 
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

  let dobString = '';
  if (user.birthday) {
    dobString = new Date(user.birthday).toISOString().split('T')[0];
  }

  // Render Checkbox Kỹ Năng từ Database
  const savedSkills = profile.skills ? profile.skills.map(s => typeof s === 'object' ? s._id : s) : [];
  const skillsHtml = allSkills.map(s => {
    const isChecked = savedSkills.includes(s._id) ? 'checked' : '';
    return `
      <div class="form-check form-check-inline mb-2">
        <input class="form-check-input" type="checkbox" name="skill" value="${s._id}" id="skill_${s._id}" ${isChecked}>
        <label class="form-check-label" for="skill_${s._id}">${s.skillName}</label>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <form id="profileForm">
      <h4 class="section-title">Cài đặt thông tin cơ bản</h4>
      
      <div class="mb-3">
        <label class="form-label">Họ và tên</label>
        <input type="text" class="form-control" name="fullName" value="${user.fullName || ''}" required>
      </div>

      <div class="mb-3">
        <label class="form-label">Số điện thoại</label>
        <input type="tel" class="form-control" name="phone" value="${user.phone || ''}" required>
      </div>

      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" value="${user.email || ''}" disabled>
      </div>

      <div class="mb-3">
        <label class="form-label">Ngày sinh</label>
        <input type="date" class="form-control text-muted" name="birthday" value="${dobString}" required>
      </div>

      <div class="mb-5">
        <label class="form-label d-block mb-2">Giới tính</label>
        <div class="form-check form-check-inline me-5">
          <input class="form-check-input" type="radio" name="gender" id="genderMale" value="male" ${user.gender !== 'female' ? 'checked' : ''}>
          <label class="form-check-label" for="genderMale">Nam</label>
        </div>
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="radio" name="gender" id="genderFemale" value="female" ${user.gender === 'female' ? 'checked' : ''}>
          <label class="form-check-label" for="genderFemale">Nữ</label>
        </div>
      </div>

      <h4 class="section-title border-top pt-4 mt-4">Thông tin & nhu cầu công việc</h4>

      <div class="mb-3">
        <label class="form-label">Học vấn / Trường học</label>
        <input type="text" class="form-control" name="education" placeholder="VD: Đại học Khoa học Tự nhiên..." value="${profile.education || ''}">
      </div>

      <div class="mb-3">
        <label class="form-label">Tóm tắt kinh nghiệm</label>
        <textarea class="form-control" name="expSummary" rows="3" placeholder="VD: 2 năm làm Frontend Developer...">${profile.expSummary || ''}</textarea>
      </div>

      <div class="mb-3 border p-3 rounded">
        <label class="form-label fw-bold">Kỹ năng chuyên môn</label>
        <div class="mt-2">
          ${skillsHtml || '<span class="text-muted fst-italic">Hệ thống chưa có dữ liệu kỹ năng. Cần Admin thêm vào trước.</span>'}
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Mức lương mong muốn</label>
        <div class="input-group">
          <input type="number" class="form-control" name="expectedSalary" value="${profile.expectedSalary || ''}">
          <span class="input-group-text">VND</span>
        </div>
      </div>

      <div class="mb-4">
        <label class="form-label">Khu vực làm việc</label>
        <input type="text" class="form-control" name="address" placeholder="VD: TP Hồ Chí Minh" value="${profile.address || ''}">
      </div>

      <div class="text-end mt-5">
        <button type="submit" class="btn btn-primary px-4 py-2"><i class="bi bi-floppy"></i> Lưu thay đổi</button>
      </div>
    </form>
  `;

  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    updateProfile();
  });
}

// 3. Xử lý logic Gửi dữ liệu về Backend
async function updateProfile() {
  const form = document.getElementById('profileForm');
  const formData = new FormData(form);

  const userPayload = {
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    gender: formData.get('gender'),
    birthday: formData.get('birthday')
  };

  const profilePayload = {
    education: formData.get('education'),
    expSummary: formData.get('expSummary'),
    expectedSalary: Number(formData.get('expectedSalary')) || 0,
    address: formData.get('address'),
    // getAll('skill')
    skill: formData.getAll('skill') 
  };

  try {
    // 1. Lưu thông tin cơ bản
    const userRes = await fetch(`${API_URL}/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userPayload)
    });

    if (!userRes.ok) throw new Error('Lỗi cập nhật User');

    // 2. Lưu thông tin CV
    const profileRes = await fetch(`${API_URL}/users/candidate-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profilePayload)
    });

    if (!profileRes.ok) throw new Error('Lỗi cập nhật Hồ sơ Candidate');

    alert('Cập nhật thông tin thành công!');
    initData(); 
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra: ' + err.message);
  }
}

// Xử lý Đổi mật khẩu
const btnChangePassword = document.querySelector('.change-password-link');
if (btnChangePassword) {
  btnChangePassword.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Tính năng đổi mật khẩu đang được phát triển. Vui lòng quay lại sau!');
  });
}

initData();