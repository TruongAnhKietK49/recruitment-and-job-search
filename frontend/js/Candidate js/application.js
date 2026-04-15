import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;

let token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token === 'null' || token === 'undefined') token = null;

if (!token) {
  window.location.href = '../../pages/utils/login.html';
}

let currentFilter = '';

async function fetchApplications() {
  const container = document.getElementById('applicationsList');
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

  let url = `${API_URL}/applications?`;
  if (currentFilter) {
    url += `status=${currentFilter}`;
  }

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      renderApplications(data.applications);
    } else {
      throw new Error('Lỗi khi tải dữ liệu ứng tuyển');
    }
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger text-center">Lỗi: ${err.message}</div>`;
  }
}

function renderApplications(apps) {
  const container = document.getElementById('applicationsList');
  if (!apps || !apps.length) {
    container.innerHTML = `
      <div class="alert bg-white border-0 shadow-sm text-center py-5 rounded-4 mt-3">
        <i class="bi bi-send-x text-muted" style="font-size: 3rem;"></i>
        <h5 class="mt-3 text-muted">Bạn chưa có đơn ứng tuyển nào</h5>
        <a href="index.html" class="btn btn-primary mt-2 rounded-pill px-4">Tìm việc ngay</a>
      </div>`;
    return;
  }

  container.innerHTML = apps.map(app => {

    const jobTitle = app.jobId?.title || 'Việc làm đã bị xóa';
    const companyName = app.jobId?.companyId?.companyName || 'Công ty ẩn danh';
    const companyLogo = app.jobId?.companyId?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=random`;
    const applyDate = app.applyDate ? new Date(app.applyDate).toLocaleDateString('vi-VN') : 'Không rõ';

    let statusConfig = { text: 'Chờ duyệt', class: 'bg-warning text-dark border-warning' };
    if (app.status === 'reviewing') statusConfig = { text: 'Đang xem xét', class: 'bg-info text-white border-info' };
    if (app.status === 'interview') statusConfig = { text: 'Phỏng vấn', class: 'bg-primary text-white border-primary' };
    if (app.status === 'accepted') statusConfig = { text: 'Trúng tuyển', class: 'bg-success text-white border-success' };
    if (app.status === 'rejected') statusConfig = { text: 'Đã từ chối', class: 'bg-danger text-white border-danger' };

    return `
      <div class="card mb-3 shadow-sm border-0" style="border-radius: 16px; transition: 0.3s;" onmouseover="this.classList.add('shadow')" onmouseout="this.classList.remove('shadow')">
        <div class="card-body p-4">
          <div class="d-flex flex-column flex-md-row justify-content-between gap-3">
            
            <div class="d-flex align-items-center flex-grow-1">
              <div class="me-3 rounded-3 bg-white d-flex align-items-center justify-content-center border shadow-sm" style="width: 70px; height: 70px; overflow: hidden; padding: 4px; flex-shrink: 0;">
                <img src="${companyLogo}" style="width:100%; height:100%; object-fit:contain;" alt="Logo">
              </div>
              
              <div>
                <h5 class="fw-bold mb-1 text-dark">${jobTitle}</h5>
                <p class="text-muted small mb-2"><i class="bi bi-building me-1"></i>${companyName}</p>
                <div class="d-flex align-items-center gap-3" style="font-size: 0.85rem;">
                  <span class="text-muted"><i class="bi bi-calendar-check me-1"></i>Nộp lúc: ${applyDate}</span>
                  <span class="badge ${statusConfig.class} border px-2 py-1"><i class="bi bi-info-circle me-1"></i>${statusConfig.text}</span>
                </div>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2 mt-3 mt-md-0">
              ${app.jobId ? `<a href="job-detail.html?id=${app.jobId._id}" class="btn btn-outline-primary shadow-sm" style="border-radius: 10px;">Xem việc</a>` : ''}
              <button class="btn btn-outline-danger shadow-sm" onclick="window.deleteApplication('${app._id}')" style="border-radius: 10px;">
                <i class="bi bi-trash3"></i>
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.deleteApplication = async function(appId) {
  if (!confirm('Bạn có chắc muốn hủy/xóa đơn ứng tuyển này?')) return;
  try {
    const res = await fetch(`${API_URL}/applications/${appId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchApplications();
    } else {
      alert('Không thể xóa đơn ứng tuyển này');
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

const statusFilterEl = document.getElementById('statusFilter');
if (statusFilterEl) {
  statusFilterEl.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    fetchApplications();
  });
}

document.addEventListener('DOMContentLoaded', fetchApplications);