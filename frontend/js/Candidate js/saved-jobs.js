import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;

let token = localStorage.getItem('token') || sessionStorage.getItem('token');

if (token === 'null' || token === 'undefined') {
  token = null;
}

if (!token) {
  window.location.href = '../../pages/utils/login.html';
}

function formatSalary(min, max) {
  if (!min && !max) return 'Thỏa thuận';
  const normalize = (num) => num >= 1000000 ? num / 1000000 : num;
  const minTrieu = normalize(min);
  const maxTrieu = normalize(max);

  if (minTrieu && maxTrieu) return `${minTrieu} - ${maxTrieu} triệu`;
  if (minTrieu) return `Từ ${minTrieu} triệu`;
  if (maxTrieu) return `Lên đến ${maxTrieu} triệu`;
  return 'Thỏa thuận';
}

function getDaysLeft(deadline) {
  if (!deadline) return 'Chưa cập nhật hạn';
  const diffTime = new Date(deadline) - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? `Còn ${diffDays} ngày` : 'Đã hết hạn';
}

async function fetchSavedJobs() {
  const container = document.getElementById('savedJobsList');
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

  try {
    const res = await fetch(`${API_URL}/jobs/save-job/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      renderSavedJobs(data);
    } else {
      container.innerHTML = '<div class="alert alert-danger">Lỗi khi tải dữ liệu việc làm đã lưu.</div>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="alert alert-danger">Lỗi kết nối: ${err.message}</div>`;
  }
}

function renderSavedJobs(savedJobs) {
  const container = document.getElementById('savedJobsList');
  
  if (!savedJobs || savedJobs.length === 0) {
    container.innerHTML = `
      <div class="alert bg-white border-0 shadow-sm text-center py-5 rounded-4 mt-3">
        <i class="bi bi-folder-x text-muted" style="font-size: 3rem;"></i>
        <h5 class="mt-3 text-muted">Bạn chưa lưu việc làm nào</h5>
        <a href="index.html" class="btn btn-primary mt-2 rounded-pill px-4">Tìm việc ngay</a>
      </div>`;
    return;
  }
  
  container.innerHTML = savedJobs.map(item => {
    const job = item.jobId;
    if (!job) return ''; 

    const companyName = job.companyId?.companyName || 'Công ty ẩn danh';
    const jobLocation = job.location || job.companyId?.address || 'Chưa cập nhật';
    
    return `
      <div class="card mb-3 shadow-sm border-0" style="border-radius: 16px; overflow: hidden; transition: 0.3s;" onmouseover="this.classList.add('shadow')" onmouseout="this.classList.remove('shadow')">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            
            <div class="d-flex align-items-center flex-grow-1" style="cursor: pointer; min-width: 300px;" onclick="window.location.href='job-detail.html?id=${job._id}'">
              <div class="me-3 rounded-3 bg-white d-flex align-items-center justify-content-center border shadow-sm fw-bold text-primary" style="width: 70px; height: 70px; overflow: hidden; padding: 4px; flex-shrink: 0;">
                ${job.companyId?.logoUrl 
                  ? `<img src="${job.companyId.logoUrl}" style="width:100%; height:100%; object-fit:contain;">` 
                  : `<span class="fs-4">${companyName.charAt(0)}</span>`}
              </div>
              
              <div>
                <h5 class="fw-bold mb-1 text-dark">${job.title}</h5>
                <p class="text-muted mb-2 small"><i class="bi bi-building"></i> ${companyName}</p>
                <div class="d-flex gap-2 flex-wrap" style="font-size: 0.85rem;">
                  <span class="badge bg-light text-success border px-2 py-1"><i class="bi bi-cash-coin me-1"></i>${formatSalary(job.salaryMin, job.salaryMax)}</span>
                  <span class="badge bg-light text-dark border px-2 py-1"><i class="bi bi-geo-alt me-1"></i>${jobLocation.split(',')[0]}</span>
                  <span class="badge bg-light text-dark border px-2 py-1"><i class="bi bi-briefcase me-1"></i>${job.experience || 'Không yêu cầu'}</span>
                  <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i class="bi bi-clock-history me-1"></i>${getDaysLeft(job.deadline)}</span>
                </div>
              </div>
            </div>

            <div class="d-flex gap-2 ms-auto mt-3 mt-md-0">
              <a href="job-detail.html?id=${job._id}" class="btn btn-primary px-4 shadow-sm" style="border-radius: 10px;">Ứng tuyển</a>
              <button class="btn btn-outline-danger btn-unsave shadow-sm" data-id="${job._id}" title="Bỏ lưu" style="border-radius: 10px;" onclick="event.stopPropagation(); window.unsaveJob('${job._id}');">
                <i class="bi bi-trash3"></i> Bỏ lưu
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.unsaveJob = async function(jobId) {
  if(confirm('Bạn có chắc chắn muốn bỏ lưu việc làm này?')) {
    try {
      const res = await fetch(`${API_URL}/jobs/save-job/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchSavedJobs(); 
      } else {
        const err = await res.json();
        alert('Lỗi: ' + (err.message || 'Không thể bỏ lưu'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  }
}

document.addEventListener('DOMContentLoaded', fetchSavedJobs);