const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../utils/login.html';
}

let currentFilter = '';

function fetchApplications() {
  let url = `${API_URL}/applications?`;
  if (currentFilter) {
    url += `status=${currentFilter}`;
  }
  fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      renderApplications(data.applications);
    })
    .catch(err => console.error(err));
}

function renderApplications(apps) {
  const container = document.getElementById('applicationsList');
  if (!apps.length) {
    container.innerHTML = '<div class="alert alert-info">Bạn chưa ứng tuyển công việc nào.</div>';
    return;
  }
  container.innerHTML = apps.map(app => `
    <div class="application-card">
      <div class="d-flex justify-content-between align-items-start flex-wrap">
        <div>
          <h4>${app.jobId?.title || 'Không xác định'}</h4>
          <div class="text-muted">Công ty: ${app.jobId?.companyId?.companyName || 'Không xác định'}</div>
          <div class="mt-2">Ngày ứng tuyển: ${new Date(app.applyDate).toLocaleString()}</div>
          <div class="mt-1">
            <span class="status-badge status-${app.status}">${getStatusText(app.status)}</span>
          </div>
        </div>
        <div>
          <a href="job-detail.html?id=${app.jobId._id}" class="btn btn-sm btn-outline-primary">Xem việc</a>
          <button class="btn btn-sm btn-outline-danger ms-2 delete-application" data-id="${app._id}">Xóa</button>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.delete-application').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const appId = btn.getAttribute('data-id');
      if (confirm('Bạn có chắc muốn xóa đơn ứng tuyển này?')) {
        deleteApplication(appId);
      }
    });
  });
}

function getStatusText(status) {
  switch(status) {
    case 'pending': return 'Chờ duyệt';
    case 'reviewing': return 'Đang xem xét';
    case 'accepted': return 'Đã chấp nhận';
    case 'rejected': return 'Đã từ chối';
    default: return status;
  }
}

function deleteApplication(appId) {
  fetch(`${API_URL}/applications/${appId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(() => {
      alert('Xóa đơn thành công');
      fetchApplications();
    })
    .catch(err => alert('Lỗi: ' + err.message));
}

document.getElementById('statusFilter').addEventListener('change', (e) => {
  currentFilter = e.target.value;
  fetchApplications();
});

fetchApplications();