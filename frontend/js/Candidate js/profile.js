import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;

let token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token === 'null' || token === 'undefined') token = null;

if (!token) {
  window.location.href = '../../pages/utils/login.html';
}

let userData = null;
let allSkills = []; 
let currentAvatarUrl = null; 

async function initData() {
  try {
    const [profileRes, skillsRes] = await Promise.all([
      fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/skills`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const profileData = await profileRes.json();
    allSkills = await skillsRes.json();

    userData = profileData;
    renderProfile(profileData);
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu:', err);
  }
}

function updateAvatarUI(url) {
  const avatarWrapper = document.getElementById('avatarWrapper');
  if (url) {
    avatarWrapper.innerHTML = `
      <img src="${url}" class="profile-avatar shadow-sm" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover;" alt="Avatar" onerror="this.src='https://ui-avatars.com/api/?name=User&background=random'; alert('Đường dẫn ảnh bị lỗi hoặc không truy cập được!');">
      <button type="button" class="btn-camera" id="btnTriggerCamera"><i class="bi bi-camera"></i></button>
    `;
  } else {
    avatarWrapper.innerHTML = `
      <div class="profile-avatar d-flex align-items-center justify-content-center text-muted fs-1 shadow-sm" style="width: 120px; height: 120px; border-radius: 50%; background: #fff;">
        <i class="bi bi-person"></i>
      </div>
      <button type="button" class="btn-camera" id="btnTriggerCamera"><i class="bi bi-camera"></i></button>
    `;
  }

  document.getElementById('btnTriggerCamera').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('inputAvatarUrl').value = currentAvatarUrl || '';
    new bootstrap.Modal(document.getElementById('avatarUrlModal')).show();
  });
}

function renderProfile(data) {
  const container = document.getElementById('profileData');
  const user = data.user || {};
  const profile = data.profileData || {};

  currentAvatarUrl = profile.avatar || null;
  document.getElementById('sidebarName').textContent = user.fullName || 'Chưa cập nhật';
  
  updateAvatarUI(currentAvatarUrl);

  let dobString = '';
  if (user.birthday) {
    dobString = new Date(user.birthday).toISOString().split('T')[0];
  }

  const savedSkills = profile.skills ? profile.skills.map(s => typeof s === 'object' ? s._id : s) : [];
  const skillsHtml = allSkills.map(s => {
    const isChecked = savedSkills.includes(s._id) ? 'checked' : '';
    return `
      <div class="form-check form-check-inline mb-2">
        <input class="form-check-input border-secondary" type="checkbox" name="skill" value="${s._id}" id="skill_${s._id}" ${isChecked}>
        <label class="form-check-label" for="skill_${s._id}">${s.skillName}</label>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <form id="profileForm">
      <h4 class="section-title"><i class="bi bi-person-badge me-2"></i>Cài đặt thông tin cơ bản</h4>
      
      <div class="mb-3">
        <label class="form-label fw-medium">Họ và tên</label>
        <input type="text" class="form-control" name="fullName" value="${user.fullName || ''}" required>
      </div>

      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label fw-medium">Số điện thoại</label>
          <input type="tel" class="form-control" name="phone" value="${user.phone || ''}" required>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label fw-medium">Email</label>
          <input type="email" class="form-control bg-light" value="${user.email || ''}" disabled>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label fw-medium">Ngày sinh</label>
          <input type="date" class="form-control text-muted" name="birthday" value="${dobString}" required>
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label d-block fw-medium mb-2">Giới tính</label>
          <div class="form-check form-check-inline mt-1">
            <input class="form-check-input" type="radio" name="gender" id="genderMale" value="male" ${user.gender !== 'female' ? 'checked' : ''}>
            <label class="form-check-label" for="genderMale">Nam</label>
          </div>
          <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="gender" id="genderFemale" value="female" ${user.gender === 'female' ? 'checked' : ''}>
            <label class="form-check-label" for="genderFemale">Nữ</label>
          </div>
        </div>
      </div>

      <h4 class="section-title border-top pt-4 mt-4"><i class="bi bi-briefcase me-2"></i>Thông tin chuyên môn</h4>

      <div class="mb-3">
        <label class="form-label fw-medium">Học vấn / Trường học</label>
        <input type="text" class="form-control" name="education" placeholder="VD: Đại học Khoa học Tự nhiên..." value="${profile.education || ''}">
      </div>

      <div class="mb-3">
        <label class="form-label fw-medium">Tóm tắt kinh nghiệm</label>
        <textarea class="form-control" name="expSummary" rows="3" placeholder="VD: 2 năm làm Frontend Developer...">${profile.expSummary || ''}</textarea>
      </div>

      <div class="mb-3 border p-3 rounded-3 bg-white shadow-sm">
        <label class="form-label fw-bold text-primary">Kỹ năng chuyên môn</label>
        <div class="mt-2">
          ${skillsHtml || '<span class="text-muted fst-italic">Hệ thống chưa có dữ liệu kỹ năng.</span>'}
        </div>
      </div>

      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label fw-medium">Mức lương mong muốn</label>
          <div class="input-group">
            <input type="number" class="form-control" name="expectedSalary" value="${profile.expectedSalary || ''}">
            <span class="input-group-text bg-light">VND</span>
          </div>
        </div>
        <div class="col-md-6 mb-4">
          <label class="form-label fw-medium">Khu vực làm việc</label>
          <input type="text" class="form-control" name="address" placeholder="VD: TP Hồ Chí Minh" value="${profile.address || ''}">
        </div>
      </div>

      <div class="text-end mt-4">
        <button type="submit" id="btnSaveProfile" class="btn btn-primary px-5 py-2 shadow-sm" style="border-radius: 10px;">
          <i class="bi bi-floppy me-2"></i> Lưu thay đổi
        </button>
      </div>
    </form>
  `;

  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    updateProfile();
  });
}

// XỬ LÝ LƯU LINK ẢNH TỪ MODAL
document.getElementById('btnSaveAvatarUrl').addEventListener('click', () => {
  const urlInput = document.getElementById('inputAvatarUrl').value.trim();
  
  if (!urlInput) {
    return alert('Vui lòng nhập đường dẫn ảnh!');
  }

  currentAvatarUrl = urlInput;
  updateAvatarUI(currentAvatarUrl);

  const modalEl = document.getElementById('avatarUrlModal');
  bootstrap.Modal.getInstance(modalEl).hide();

  updateProfile();
});

async function updateProfile() {
  const form = document.getElementById('profileForm');
  const btn = document.getElementById('btnSaveProfile');
  const formData = new FormData(form);

  const payload = {
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    gender: formData.get('gender'),
    birthday: formData.get('birthday'),
    education: formData.get('education'),
    expSummary: formData.get('expSummary'),
    expectedSalary: Number(formData.get('expectedSalary')) || 0,
    address: formData.get('address'),
    skills: formData.getAll('skill'),
    avatar: currentAvatarUrl 
  };

  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Lỗi cập nhật hệ thống');

    alert('Cập nhật hồ sơ thành công!');

    const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
    const sessionUser = JSON.parse(storage.getItem('user') || '{}');
    
    sessionUser.fullName = payload.fullName;
    sessionUser.avatar = payload.avatar;
    
    storage.setItem('user', JSON.stringify(sessionUser));

    window.location.reload();
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra: ' + err.message);
  } finally {
    btn.innerHTML = '<i class="bi bi-floppy me-2"></i> Lưu thay đổi';
    btn.disabled = false;
  }
}

// ĐỔI MẬT KHẨU
document.querySelector('.change-password-link').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('changePasswordForm').reset();
  new bootstrap.Modal(document.getElementById('changePasswordModal')).show();
});

document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const currentPassword = form.currentPassword.value;
  const newPassword = form.newPassword.value;
  const confirmPassword = form.confirmPassword.value;

  if (newPassword !== confirmPassword) {
    return alert('Mật khẩu xác nhận không khớp!');
  }

  const btn = document.getElementById('btnSubmitPassword');
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/users/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();
    if (res.ok) {
      alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '../../pages/utils/login.html';
    } else {
      alert(data.message || 'Lỗi đổi mật khẩu');
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  } finally {
    btn.innerHTML = 'Xác nhận đổi';
    btn.disabled = false;
  }
});

document.addEventListener('DOMContentLoaded', initData);