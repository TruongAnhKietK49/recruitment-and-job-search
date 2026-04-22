import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (!token) window.location.href = "../../pages/utils/login.html";

let allUsers = [], allCompanies = [];
let userPage = 1, companyPage = 1;
const itemsPerPage = 8;
let selectedUserIds = new Set(); 

async function init() {
  await Promise.all([fetchUsers(), fetchCompanies()]);
  renderUsers();
  renderCompanies();
  attachEvents();
}

async function fetchUsers() {
  try {
    const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) allUsers = await res.json();
  } catch (err) { console.error("Lỗi User:", err); }
}

async function fetchCompanies() {
  try {
    const res = await fetch(`${API_URL}/companies`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      allCompanies = Array.isArray(data) ? data : (data.companies || []);
    }
  } catch (err) { console.error("Lỗi Company:", err); }
}

// ================== RENDER USERS & PAGINATION ==================
function renderUsers() {
  const search = document.getElementById('globalSearch').value.toLowerCase();
  const role = document.getElementById('roleFilter').value;
  let status = document.getElementById('statusFilter').value;

  let filtered = allUsers.filter(u => 
    u.role !== 'admin' &&
    (u.fullName.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)) &&
    (!role || u.role === role) &&
    (!status || u.status === status)
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  if (userPage > totalPages) userPage = totalPages;
  const start = (userPage - 1) * itemsPerPage;
  const paginatedList = filtered.slice(start, start + itemsPerPage);

  const list = document.getElementById('userList');
  list.innerHTML = paginatedList.map(u => {
    const isChecked = selectedUserIds.has(u._id) ? 'checked' : '';
    const badgeStatus = u.status === 'active' 
      ? '<span class="badge bg-success-subtle text-success">Hoạt động</span>' 
      : '<span class="badge bg-danger-subtle text-danger">Bị khóa</span>';
    
    return `
    <tr>
      <td><input type="checkbox" class="form-check-input user-checkbox" value="${u._id}" ${isChecked}></td>
      <td>
        <div class="fw-bold text-dark">${u.fullName}</div>
        <div class="small text-muted">${u.email}</div>
      </td>
      <td><span class="badge bg-light text-dark border">${u.role.toUpperCase()}</span></td>
      <td>${badgeStatus}</td>
      <td class="text-end pe-4">
        <button class="btn btn-sm btn-info text-white me-1 shadow-sm" onclick="viewUserDetail('${u._id}')" title="Xem chi tiết">
          <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-sm btn-light text-primary me-1 shadow-sm" onclick="toggleStatus('${u._id}', '${u.status === 'active' ? 'inactive' : 'active'}')" title="Khóa/Mở khóa">
          <i class="bi bi-${u.status === 'active' ? 'lock' : 'unlock'}"></i>
        </button>
        <button class="btn btn-sm btn-light text-danger shadow-sm" onclick="deleteSingleUser('${u._id}')" title="Xóa">
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    </tr>
  `}).join('');

  if (paginatedList.length === 0) list.innerHTML = `<tr><td colspan="5" class="text-center py-4">Không tìm thấy dữ liệu</td></tr>`;

  document.getElementById('userPageInfo').innerText = `Trang ${userPage} / ${totalPages} (Tổng: ${filtered.length})`;
  let pageHtml = '';
  for(let i = 1; i <= totalPages; i++) {
    pageHtml += `<li class="page-item ${i === userPage ? 'active' : ''}"><button class="page-link" onclick="changeUserPage(${i})">${i}</button></li>`;
  }
  document.getElementById('userPagination').innerHTML = pageHtml;

  document.querySelectorAll('.user-checkbox').forEach(cb => {
    cb.addEventListener('change', handleCheckboxChange);
  });

  const selectAllBtn = document.getElementById('selectAllUsers');
  selectAllBtn.checked = paginatedList.length > 0 && paginatedList.every(u => selectedUserIds.has(u._id));
}

window.changeUserPage = (page) => { userPage = page; renderUsers(); }

// ================== CHECKBOX & BULK ACTIONS ==================
function handleCheckboxChange(e) {
  if (e.target.checked) selectedUserIds.add(e.target.value);
  else selectedUserIds.delete(e.target.value);
  updateBulkActionBar();
}

document.getElementById('selectAllUsers').addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  document.querySelectorAll('.user-checkbox').forEach(cb => {
    cb.checked = isChecked;
    if (isChecked) selectedUserIds.add(cb.value);
    else selectedUserIds.delete(cb.value);
  });
  updateBulkActionBar();
});

function updateBulkActionBar() {
  const bar = document.getElementById('bulkActionBar');
  if (selectedUserIds.size > 0) {
    bar.classList.remove('d-none');
    document.getElementById('selectedCount').innerText = selectedUserIds.size;
  } else {
    bar.classList.add('d-none');
  }
}

window.bulkDeleteUsers = async () => {
  if (!confirm(`Bạn chắc chắn muốn xóa ${selectedUserIds.size} tài khoản này vĩnh viễn?`)) return;
  const ids = Array.from(selectedUserIds);
  await Promise.all(ids.map(id => fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })));
  selectedUserIds.clear();
  updateBulkActionBar();
  init();
}

window.bulkLockUsers = async () => {
  if (!confirm(`Bạn muốn khóa ${selectedUserIds.size} tài khoản này?`)) return;
  const ids = Array.from(selectedUserIds);
  await Promise.all(ids.map(id => fetch(`${API_URL}/users/${id}/status`, { 
    method: 'PUT', 
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },

    body: JSON.stringify({ status: 'inactive' })
  })));
  selectedUserIds.clear();
  updateBulkActionBar();
  init();
}

window.bulkUnlockUsers = async () => {
  if (!confirm(`Bạn chắc chắn muốn MỞ KHÓA cho ${selectedUserIds.size} tài khoản này?`)) return;
  const ids = Array.from(selectedUserIds);
  await Promise.all(ids.map(id => fetch(`${API_URL}/users/${id}/status`, { 
    method: 'PUT', 
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },

    body: JSON.stringify({ status: 'active' })
  })));
  selectedUserIds.clear();
  updateBulkActionBar();
  init();
}

// ================== SINGLE ACTIONS ==================
window.deleteSingleUser = async (id) => {
  if(!confirm("Xác nhận xóa vĩnh viễn?")) return;
  await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
  init();
};

window.toggleStatus = async (id, status) => {
  await fetch(`${API_URL}/users/${id}/status`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  init();
};

// ================== RENDER COMPANIES ==================
function renderCompanies() {
  const search = document.getElementById('globalSearch').value.toLowerCase();
  let statusFilter = document.getElementById('statusFilter').value;

  // Lọc thông minh: Chọn 'Chờ duyệt' sẽ tự tìm 'inactive'
  if (statusFilter === 'pending' || statusFilter === 'locked') statusFilter = 'inactive';

  let filtered = allCompanies.filter(c => {
    const matchSearch = c.companyName.toLowerCase().includes(search);
    let matchStatus = true;
    if (statusFilter) matchStatus = (c.status === statusFilter);
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  if (companyPage > totalPages) companyPage = totalPages;
  const start = (companyPage - 1) * itemsPerPage;
  const paginatedList = filtered.slice(start, start + itemsPerPage);

  const list = document.getElementById('companyList');
  list.innerHTML = paginatedList.map((c, index) => {
    
    // active = Đã duyệt, inactive = Chờ duyệt
    const isApproved = c.status === 'active';
    const badgeStatus = isApproved 
      ? '<span class="badge bg-success-subtle text-success"><i class="bi bi-check-circle me-1"></i>Đã duyệt</span>' 
      : '<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>Chờ duyệt</span>';
    
    
    const actionBtn = !isApproved 
      ? `<button class="btn btn-sm btn-success me-1 shadow-sm" onclick="approveCompany('${c._id}')" title="Duyệt nhanh">
            <i class="bi bi-check-lg"></i>
          </button>` 
      : ``;

    return `
    <tr>
      <td class="text-muted fw-bold">${start + index + 1}</td>
      <td>
        <div class="fw-bold text-primary">${c.companyName}</div>
      </td>
      <td>${c.createdBy?.fullName || 'N/A'}</td>
      <td>${badgeStatus}</td>
      <td class="text-end pe-4">
        <button class="btn btn-sm btn-info text-white me-1 shadow-sm" onclick="viewCompanyDetail('${c._id}')" title="Xem thông tin"><i class="bi bi-eye"></i></button>
        ${actionBtn}
        <button class="btn btn-sm btn-light text-danger shadow-sm" onclick="deleteCompany('${c._id}')" title="Xóa công ty">
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    </tr>
  `}).join('');

  if (paginatedList.length === 0) list.innerHTML = `<tr><td colspan="5" class="text-center py-4">Không tìm thấy công ty nào</td></tr>`;

  document.getElementById('companyPageInfo').innerText = `Trang ${companyPage} / ${totalPages}`;
  let pageHtml = '';
  for(let i = 1; i <= totalPages; i++) {
    pageHtml += `<li class="page-item ${i === companyPage ? 'active' : ''}"><button class="page-link" onclick="changeCompanyPage(${i})">${i}</button></li>`;
  }
  document.getElementById('companyPagination').innerHTML = pageHtml;
}

// ================== HÀM DUYỆT CÔNG TY ==================
window.approveCompany = async (id) => {
  if(!confirm("Xác nhận cấp phép cho công ty này hoạt động trên hệ thống?")) return;
  
  try {
    const res = await fetch(`${API_URL}/companies/${id}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' })
    });

    if (res.ok) {
      alert("Đã duyệt công ty thành công!");
      await fetchCompanies(); 
      renderCompanies();      
    } else {
      const err = await res.json();
      alert("Lỗi: " + err.message);
    }
  } catch (error) {
    alert("Lỗi kết nối máy chủ");
  }
};

window.changeCompanyPage = (page) => { companyPage = page; renderCompanies(); }

window.deleteCompany = async (id) => {
  if(!confirm("Xóa công ty sẽ xóa luôn toàn bộ việc làm của công ty đó. Tiếp tục?")) return;
  await fetch(`${API_URL}/companies/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
  init();
};

function attachEvents() {
  document.getElementById('globalSearch').addEventListener('input', () => { userPage = 1; companyPage = 1; renderUsers(); renderCompanies(); });
  document.getElementById('roleFilter').addEventListener('change', () => { userPage = 1; renderUsers(); });
  document.getElementById('statusFilter').addEventListener('change', () => { userPage = 1; companyPage = 1; renderUsers(); renderCompanies(); });
}

// ================== XEM CHI TIẾT CÔNG TY ==================
window.viewCompanyDetail = (id) => {
  const company = allCompanies.find(c => c._id === id);
  if(!company) return;

  const logoBox = document.getElementById('modalCompLogo');
  if(company.logoUrl) {
    logoBox.innerHTML = `<img src="${company.logoUrl}" style="width:100%; height:100%; object-fit:cover;">`;
  } else {
    logoBox.innerHTML = company.companyName.charAt(0).toUpperCase();
  }

  document.getElementById('modalCompName').innerText = company.companyName;
  document.getElementById('modalCompStatus').className = company.status === 'active' ? 'badge bg-success' : 'badge bg-warning text-dark';
  document.getElementById('modalCompStatus').innerText = company.status === 'active' ? 'Đã duyệt' : 'Chờ phê duyệt';
  
  document.getElementById('modalCompCat').innerText = company.category || 'N/A';
  document.getElementById('modalCompWeb').innerHTML = company.website ? `<a href="${company.website}" target="_blank">${company.website}</a>` : 'N/A';
  document.getElementById('modalCompPhone').innerText = company.phoneCompany || 'N/A';
  document.getElementById('modalCompOwner').innerText = company.createdBy?.fullName ? `${company.createdBy.fullName} (${company.createdBy.email})` : 'N/A';
  document.getElementById('modalCompAddress').innerText = company.address || 'N/A';
  document.getElementById('modalCompDesc').innerText = company.description || 'Không có mô tả.';

  const footer = document.getElementById('modalCompFooter');
  if(company.status === 'inactive') {
    footer.innerHTML = `
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
      <button type="button" class="btn btn-success" onclick="approveCompanyFromModal('${company._id}')"><i class="bi bi-check-circle me-1"></i> Phê duyệt Công ty này</button>
    `;
  } else {
    footer.innerHTML = `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>`;
  }

  const modal = new bootstrap.Modal(document.getElementById('companyDetailModal'));
  modal.show();
}

window.approveCompanyFromModal = async (id) => {
  const modalEl = document.getElementById('companyDetailModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if(modal) modal.hide();
  
  await approveCompany(id); 
}

// ================== XEM CHI TIẾT USER TỪ API ==================
window.viewUserDetail = async (id) => {
  const modalEl = document.getElementById('userDetailModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  document.getElementById('modalUserExtraInfo').innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm"></div> Đang tải hồ sơ...</div>';
  modal.show();

  try {
    const res = await fetch(`${API_URL}/users/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error("Không thể lấy dữ liệu chi tiết.");
    const data = await res.json();
    
    const user = data.user;
    const profileData = data.profileData; 

    const shortName = user.fullName ? user.fullName.split(' ').pop() : 'U';
    document.getElementById('modalUserAvatar').src = (profileData && profileData.avatar) ? profileData.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(shortName)}&background=random&color=fff`;
    
    document.getElementById('modalUserName').innerText = user.fullName;
    document.getElementById('modalUserRole').innerHTML = user.role === 'hr' ? '<span class="badge bg-warning text-dark">Nhà Tuyển Dụng</span>' : '<span class="badge bg-info text-dark">Ứng Viên</span>';
    document.getElementById('modalUserStatus').innerHTML = user.status === 'active' ? '<span class="badge bg-success-subtle text-success">Hoạt động</span>' : '<span class="badge bg-danger-subtle text-danger">Bị khóa</span>';
    document.getElementById('modalUserEmail').innerText = user.email;
    document.getElementById('modalUserPhone').innerText = user.phone || 'Chưa cập nhật';
    document.getElementById('modalUserGender').innerText = user.gender === 'female' ? 'Nữ' : (user.gender === 'male' ? 'Nam' : 'Khác');
    document.getElementById('modalUserDob').innerText = user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

    const extraBox = document.getElementById('modalUserExtraInfo');
    
    if (!profileData) {
      extraBox.innerHTML = '<div class="alert alert-light border text-center text-muted fst-italic">Người dùng này chưa cập nhật hồ sơ chi tiết.</div>';
    } 
    else if (user.role === 'candidate') {
      const skills = (Array.isArray(profileData.skills) && profileData.skills.length > 0) 
        ? profileData.skills.map(s => {
            const skillName = s.skillName ? s.skillName : s; 
            return `<span class="badge bg-secondary-subtle text-secondary border me-1">${skillName}</span>`;
          }).join('') 
        : '<span class="text-muted small">Chưa cập nhật</span>';
        
      extraBox.innerHTML = `
        <h6 class="fw-bold mb-3"><i class="bi bi-file-earmark-person me-2"></i>Chi tiết Ứng viên</h6>
        <div class="row g-3">
          <div class="col-12"><div class="text-muted small">Địa chỉ</div><div class="fw-medium">${profileData.address || 'Chưa cập nhật'}</div></div>
          <div class="col-12"><div class="text-muted small">Học vấn</div><div class="fw-medium">${profileData.education || 'Chưa cập nhật'}</div></div>
          <div class="col-12"><div class="text-muted small">Kinh nghiệm làm việc</div><div class="fw-medium" style="white-space: pre-wrap">${profileData.expSummary || 'Chưa cập nhật'}</div></div>
          <div class="col-12"><div class="text-muted small">Mức lương mong muốn</div><div class="fw-bold text-success">${profileData.expectedSalary ? profileData.expectedSalary.toLocaleString('vi-VN') + ' VNĐ' : 'Thỏa thuận'}</div></div>
          <div class="col-12"><div class="text-muted small mb-1">Kỹ năng</div><div>${skills}</div></div>
        </div>
      `;
    } 
    // Render Hồ sơ HR
    else if (user.role === 'hr') {
      const comp = profileData.companyId;
      let compHtml = '<span class="text-muted fst-italic">Chưa gia nhập công ty nào</span>';
      
      if (comp) {
        compHtml = `
          <div class="d-flex align-items-center bg-light p-3 rounded border">
            <div class="fs-1 text-primary me-3"><i class="bi bi-buildings"></i></div>
            <div>
              <div class="fw-bold fs-5">${comp.companyName}</div>
              ${comp.website ? `<a href="${comp.website}" target="_blank" class="small text-decoration-none">${comp.website}</a>` : ''}
              <div class="small text-muted mt-1"><i class="bi bi-geo-alt me-1"></i>${comp.address || 'Chưa có địa chỉ'}</div>
              <div class="small mt-1 badge ${comp.status === 'active' ? 'bg-success' : 'bg-warning text-dark'}">${comp.status === 'active' ? 'Đã duyệt' : 'Chờ duyệt'}</div>
            </div>
          </div>
        `;
      }
      
      extraBox.innerHTML = `
        <h6 class="fw-bold mb-3"><i class="bi bi-briefcase me-2"></i>Chi tiết Nhà tuyển dụng</h6>
        ${compHtml}
      `;
    }

  } catch (err) {
    document.getElementById('modalUserExtraInfo').innerHTML = `<div class="alert alert-danger">Lỗi tải dữ liệu: ${err.message}</div>`;
  }
}

// ================== HÀM TẠO USER (ADMIN) ==================
document.getElementById('adminAddUserForm').onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alert("Tạo tài khoản thành công!");
      bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
      e.target.reset();
      await fetchUsers();
      renderUsers();
    } else {
      const err = await res.json();
      alert("Lỗi: " + err.message);
    }
  } catch (error) { alert("Lỗi kết nối server"); }
};

// ================== HÀM TẠO CÔNG TY (ADMIN) ==================
document.getElementById('adminAddCompanyForm').onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`${API_URL}/companies`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      alert("Tạo công ty mới thành công!");
      bootstrap.Modal.getInstance(document.getElementById('addCompanyModal')).hide();
      e.target.reset();
      await fetchCompanies();
      renderCompanies();
    } else {
      const err = await res.json();
      alert("Lỗi: " + err.message);
    }
  } catch (error) { alert("Lỗi kết nối server"); }
};

init();