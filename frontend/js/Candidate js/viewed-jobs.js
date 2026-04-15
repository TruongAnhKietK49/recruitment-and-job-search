import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;

let token = localStorage.getItem('token') || sessionStorage.getItem('token');

if (token === 'null' || token === 'undefined') {
  token = null;
}

if (!token) {
  window.location.href = '../../pages/utils/login.html';
}

let appliedJobIds = [];

async function fetchUserAppliedJobs() {
  try {
    const res = await fetch(`${API_URL}/applications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      appliedJobIds = data.applications.map(app => String(app.jobId?._id || app.jobId));
    }
  } catch (err) {
    console.error("Lỗi lấy danh sách ứng tuyển:", err);
  }
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

// Lấy lịch sử xem
async function fetchViewedJobs() {
  const container = document.getElementById('viewedJobsList');
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

  try {
    await fetchUserAppliedJobs();
    const res = await fetch(`${API_URL}/jobs/view-history/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      renderViewedJobs(data);
    } else {
      container.innerHTML = '<div class="alert alert-danger">Lỗi khi tải dữ liệu lịch sử xem.</div>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="alert alert-danger">Lỗi kết nối: ${err.message}</div>`;
  }
}

function renderViewedJobs(historyData) {
  const container = document.getElementById('viewedJobsList');
  
  if (!historyData || historyData.length === 0) {
    container.innerHTML = `
      <div class="alert bg-white border-0 shadow-sm text-center py-5 rounded-4 mt-3">
        <i class="bi bi-eye-slash text-muted" style="font-size: 3rem;"></i>
        <h5 class="mt-3 text-muted">Bạn chưa xem việc làm nào gần đây</h5>
        <a href="index.html" class="btn btn-primary mt-2 rounded-pill px-4">Tìm việc ngay</a>
      </div>`;
    return;
  }
  
  container.innerHTML = historyData.map(item => {
    const job = item.jobId;
    if (!job) return ''; 

    const companyName = job.companyId?.companyName || 'Công ty ẩn danh';
    const jobLocation = job.location || job.companyId?.address || 'Chưa cập nhật';
    const viewDateFormatted = new Date(item.viewDate).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

    const isApplied = appliedJobIds.includes(String(job._id));
    let isExpired = false;
    if (job.deadline) {
      const diffDays = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      isExpired = diffDays <= 0;
    }

    let actionButton = '';
    if (isApplied) {
      actionButton = `<button class="btn btn-success disabled px-4 shadow-sm" style="border-radius: 10px;"><i class="bi bi-check-circle me-1"></i>Đã ứng tuyển</button>`;
    } else if (isExpired) {
      actionButton = `<button class="btn btn-secondary disabled px-4 shadow-sm" style="border-radius: 10px;"><i class="bi bi-clock-history me-1"></i>Đã hết hạn</button>`;
    } else {
      actionButton = `<button class="btn btn-primary px-4 shadow-sm" id="btnApply_${job._id}" style="border-radius: 10px;" onclick="event.stopPropagation(); window.openApplyModal('${job._id}');">Ứng tuyển</button>`;
    }

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
                  <span class="badge bg-light text-muted border px-2 py-1"><i class="bi bi-eye me-1"></i>Xem lúc: ${viewDateFormatted}</span>
                </div>
              </div>
            </div>

            <div class="d-flex gap-2 ms-auto mt-3 mt-md-0">
              ${actionButton}
              <button class="btn btn-outline-secondary shadow-sm" title="Xóa khỏi lịch sử" style="border-radius: 10px;" onclick="event.stopPropagation(); window.deleteViewHistory('${item._id}');">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.deleteViewHistory = async function(historyId) {
  if(confirm('Xóa công việc này khỏi lịch sử xem?')) {
    try {
      const res = await fetch(`${API_URL}/jobs/view-history/${historyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchViewedJobs(); 
      } else {
        const err = await res.json();
        alert('Lỗi: ' + (err.message || 'Không thể xóa lịch sử'));
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  }
}

let currentApplyJobId = null;

window.openApplyModal = async function(jobId) {
  if (!token) return;
  currentApplyJobId = jobId;

  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    document.getElementById('applyUserName').innerText = user.fullName || 'Người dùng';
    document.getElementById('applyUserEmail').innerText = user.email || '';
  }

  try {
    const res = await fetch(`${API_URL}/resumes/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const resumes = await res.json();
      const select = document.getElementById('existingCvSelect');
      
      let optionsHtml = '<option value="">Chọn từ danh sách CV của bạn</option>';
      resumes.forEach(cv => {
        optionsHtml += `<option value="${cv._id}">${cv.title} (${new Date(cv.createdAt).toLocaleDateString('vi-VN')})</option>`;
      });
      select.innerHTML = optionsHtml;
    }
  } catch (err) {
    console.error("Lỗi lấy danh sách CV", err);
  }

  new bootstrap.Modal(document.getElementById('applyModal')).show();
}

document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submitApplicationBtn');

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const selectedCvId = document.getElementById('existingCvSelect').value;
      const coverLetter = document.getElementById('coverLetter')?.value || "";

      if (!selectedCvId) {
        alert("Vui lòng chọn một bản CV từ danh sách!");
        return;
      }

      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang nộp...';
      submitBtn.disabled = true;

      try {
        const payload = {
          jobId: currentApplyJobId,
          resumeId: selectedCvId,
          coverLetter: coverLetter
        };

        const res = await fetch(`${API_URL}/applications`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Có lỗi xảy ra khi nộp đơn');
        }

        const applyModalEl = document.getElementById('applyModal');
        bootstrap.Modal.getInstance(applyModalEl).hide();
        
        const successModalEl = document.getElementById('successApplyModal');
        new bootstrap.Modal(successModalEl).show();

        const applyBtn = document.getElementById(`btnApply_${currentApplyJobId}`);
        if (applyBtn) {
          applyBtn.outerHTML = `<button class="btn btn-success disabled px-4 shadow-sm" style="border-radius: 10px;"><i class="bi bi-check-circle me-1"></i>Đã ứng tuyển</button>`;
        }

      } catch (err) {
        alert("Lỗi ứng tuyển: " + err.message);
      } finally {
        submitBtn.innerHTML = '<i class="bi bi-send me-2"></i> Nộp hồ sơ';
        submitBtn.disabled = false;
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', fetchViewedJobs);