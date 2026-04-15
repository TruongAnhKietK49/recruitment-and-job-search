const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

let allUsers = []; // Lưu trữ toàn bộ user
let filteredUsers = []; // Danh sách user sau khi lọc

// Biến lưu trạng thái lọc
let currentRoleFilter = '';
let currentStatusFilter = '';
let currentSearch = '';

// --- 1. XỬ LÝ SIDEBAR ACTIVE ---
// --- 1. XỬ LÝ SIDEBAR ACTIVE ---
function setActiveSidebar() {
  // Lấy tên file của trang hiện tại (VD: 'users.html' từ URL dài)
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop(); 

  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  
  // Lặp qua tất cả các menu trong sidebar
  navLinks.forEach(link => {
    link.classList.remove('active'); // Xóa màu đậm ở các tab khác
    
    const linkHref = link.getAttribute('href');
    if (linkHref) {
      // Lấy tên file của cái menu đó (VD: 'users.html')
      const linkPage = linkHref.split('/').pop(); 
      
      // Nếu tên file trên URL trùng với tên file của menu -> Tô màu đậm
      if (currentPage === linkPage) {
        link.classList.add('active');
      }
    }
  });
}

// --- 2. FETCH VÀ RENDER DỮ LIỆU ---
function fetchUsers() {
  fetch(`${API_URL}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(users => {
      allUsers = users;
      applyFilters(); // Gọi hàm lọc ngay sau khi có data
    })
    .catch(err => {
      console.error(err);
      document.getElementById('usersList').innerHTML = '<div class="alert alert-danger">Lỗi tải dữ liệu</div>';
    });
}

function applyFilters() {
  filteredUsers = allUsers.filter(user => {
    // 1. Lọc theo text search (tìm trong Tên hoặc Email)
    const matchSearch = user.fullName.toLowerCase().includes(currentSearch.toLowerCase()) || 
                        user.email.toLowerCase().includes(currentSearch.toLowerCase());
    // 2. Lọc theo Vai trò
    const matchRole = currentRoleFilter === '' || user.role === currentRoleFilter;
    // 3. Lọc theo Trạng thái
    const matchStatus = currentStatusFilter === '' || user.status === currentStatusFilter;
    
    return matchSearch && matchRole && matchStatus;
  });

  renderUsers(filteredUsers);
}

function renderUsers(users) {
  const container = document.getElementById('usersList');
  if (!users.length) {
    container.innerHTML = '<div class="text-center py-5 text-muted fs-5">Không tìm thấy người dùng phù hợp.</div>';
    return;
  }

  container.innerHTML = users.map(user => {
    const isAct = user.status === 'active';
    const statusText = isAct ? 'Đang hoạt động' : 'Bị khóa';
    const statusColor = isAct ? 'text-success' : 'text-danger';
    
    const roleText = user.role === 'hr' ? 'Nhà tuyển dụng' : (user.role === 'candidate' ? 'Ứng viên' : 'Admin');

    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&size=120`;

    const lockBtn = isAct 
      ? `<button class="btn btn-red btn-sm" onclick="toggleUserStatus('${user._id}', 'inactive')">Khóa TK</button>`
      : `<button class="btn btn-green btn-sm" onclick="toggleUserStatus('${user._id}', 'active')">Mở khóa</button>`;

    return `
      <div class="user-card d-flex gap-4 align-items-center ${isAct ? 'active-card' : ''}">
        <div class="status-text ${statusColor}">${statusText}</div>
        
        <div>
          <img src="${avatar}" class="user-avatar shadow-sm" alt="Avatar">
        </div>
        
        <div class="flex-grow-1">
          <h4 class="fw-bold mb-1">${user.fullName}</h4>
          <div class="text-muted small mb-2">${user.email}</div>
          
          <div class="fs-6 text-dark mt-3">
            <span class="fw-medium">Vai trò:</span> ${roleText} <br>
            <span class="fw-medium">SĐT:</span> ${user.phone || 'Chưa cập nhật'} <br>
            <span class="fw-medium">Giới tính:</span> ${user.gender === 'female' ? 'Nữ' : 'Nam'}
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-orange btn-sm" onclick="alert('Tính năng xem chi tiết đang phát triển')">Chi tiết</button>
          ${lockBtn}
          <button class="btn btn-dark btn-sm" onclick="deleteUser('${user._id}')">Xóa</button>
        </div>
      </div>
    `;
  }).join('');

  renderPagination();
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  currentSearch = e.target.value;
  applyFilters();
});

document.querySelectorAll('.filter-role').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    currentRoleFilter = e.target.getAttribute('data-value');
    document.getElementById('roleLabel').textContent = currentRoleFilter ? `(${e.target.textContent})` : '';
    applyFilters();
  });
});

document.querySelectorAll('.filter-status').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    currentStatusFilter = e.target.getAttribute('data-value');
    document.getElementById('statusLabel').textContent = currentStatusFilter ? `(${e.target.textContent})` : '';
    applyFilters();
  });
});

// --- 4. HÀM API CHỨC NĂNG ---
function deleteUser(id) {
  if (!confirm('Hành động này không thể hoàn tác. Chắc chắn xóa?')) return;
  fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    .then(() => { alert('Xóa thành công'); fetchUsers(); })
    .catch(err => alert('Lỗi: ' + err.message));
}

function toggleUserStatus(id, newStatus) {
  fetch(`${API_URL}/users`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status: newStatus }) 
  })
    .then(() => fetchUsers())
    .catch(err => console.error(err));
}

function renderPagination() {
  document.getElementById('pagination').innerHTML = `
    <li class="page-item active"><a class="page-link" href="#">1</a></li>
    <li class="page-item"><a class="page-link" href="#">2</a></li>
    <li class="page-item"><a class="page-link" href="#">3</a></li>
    <li class="page-item disabled"><a class="page-link" href="#">...</a></li>
    <li class="page-item"><a class="page-link" href="#">68</a></li>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setActiveSidebar, 200); 
  fetchUsers();
});