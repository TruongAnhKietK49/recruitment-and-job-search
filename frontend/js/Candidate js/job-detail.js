import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;

let token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token === 'null' || token === 'undefined') {
  token = null;
}

const urlParams = new URLSearchParams(window.location.search);
const jobId = urlParams.get('id');

let savedJobIds = [];
let appliedJobIds = [];

// --- CÁC HÀM HELPER FORMAT ---
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
  const formatNum = (num) => num >= 1000000 ? (num / 1000000) + ' triệu' : num.toLocaleString();
  if (min && max) return `${formatNum(min)} - ${formatNum(max)}`;
  if (min) return `Từ ${formatNum(min)}`;
  if (max) return `Lên đến ${formatNum(max)}`;
  return 'Thỏa thuận';
}

function getDaysLeft(deadline) {
  if (!deadline) return 'Chưa cập nhật';
  const diffTime = new Date(deadline) - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? `${diffDays} ngày tới` : 'Đã hết hạn';
}

function formatTextToList(text) {
  if (!text) return '<p>Đang cập nhật...</p>';
  if (text.includes('<ul>') || text.includes('<p>')) return text;
  const items = text.split('\n').filter(item => item.trim() !== '');
  return `<ul class="desc-list">` + items.map(item => `<li>${item.replace(/^- /, '').trim()}</li>`).join('') + `</ul>`;
}

// --- LOGIC CHÍNH ---
async function initPage() {
  if (token) {
    await fetchUserSavedJobs();
    await fetchUserAppliedJobs();
  }

  if (jobId) {
    fetchJobDetail();
  } else {
    document.getElementById('jobDetailContainer').innerHTML = '<div class="alert alert-warning text-center py-5">Không tìm thấy mã công việc.</div>';
  }
}

async function fetchUserSavedJobs() {
  try {
    const res = await fetch(`${API_URL}/jobs/save-job/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      savedJobIds = data.map(item => item.jobId?._id || item.jobId);
    }
  } catch (err) {
    console.error("Lỗi lấy danh sách việc đã lưu:", err);
  }
}

async function fetchJobDetail() {
  try {
    const res = await fetch(`${API_URL}/jobs/${jobId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const job = await res.json();
    renderJobDetail(job);

    if (token) {
      fetch(`${API_URL}/jobs/view-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ jobId })
      }).catch(console.error);
    }

    fetchSimilarJobs(job.category, job._id);
  } catch (err) {
    console.error(err);
    document.getElementById('jobDetailContainer').innerHTML = '<div class="alert alert-danger text-center py-5">Lỗi tải dữ liệu chi tiết công việc.</div>';
  }
}

function renderJobDetail(job) {
  const container = document.getElementById('jobDetailContainer');
  const postDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString('vi-VN') : 'Đang cập nhật';

  const isSaved = savedJobIds.includes(job._id);
  const heartIconClass = isSaved ? 'bi-heart-fill text-danger' : 'bi-heart';
  const saveBtnText = isSaved ? 'Đã lưu' : 'Lưu';
  const saveBtnStyle = isSaved ? 'color: #dc3545; border-color: #dc3545; background-color: #fff5f5;' : '';

  const jobLocation = job.location || job.companyId?.address || 'Chưa cập nhật địa chỉ';
  const quantityText = job.quantity ? `${job.quantity} người` : 'Không giới hạn';
  const workingTimeText = job.workingTime || 'Giờ hành chính';
  const companyDesc = job.companyId?.description || 'Chưa có thông tin giới thiệu công ty.';

  const isApplied = appliedJobIds.includes(String(job._id));

  let isExpired = false;
  if (job.deadline) {
    const diffDays = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    isExpired = diffDays <= 0;
  }

  let actionButton = '';
  if (isApplied) {
    actionButton = `<button class="btn btn-success disabled" style="padding: 10px 30px; border-radius: 8px; font-weight: bold;"><i class="bi bi-check-circle me-2"></i>Đã ứng tuyển</button>`;
  } else if (isExpired) {
    actionButton = `<button class="btn btn-secondary disabled" style="padding: 10px 30px; border-radius: 8px; font-weight: bold;"><i class="bi bi-clock-history me-2"></i>Đã hết hạn</button>`;
  } else {
    actionButton = `<button class="btn-apply" id="applyBtn">Ứng tuyển ngay</button>`;
  }

  container.innerHTML = `
    <div class="job-detail-card">
      <div class="job-header-pattern"></div>
      
      <div class="job-header-content">
        <div class="company-logo bg-white shadow-sm d-flex align-items-center justify-content-center" style="border-radius: 12px; overflow: hidden; padding: 5px;">
          ${job.companyId?.logoUrl
      ? `<img src="${job.companyId.logoUrl}" alt="Logo" style="width:100%; height:100%; object-fit:contain;">`
      : `<span class="fs-2 fw-bold text-primary">${job.companyId?.companyName?.charAt(0) || 'C'}</span>`}
        </div>
        <h1 class="job-title">${job.title || 'Đang cập nhật...'}</h1>
        <div class="company-name">${job.companyId?.companyName || 'Công ty'}</div>
        
        <ul class="meta-list">
          <li><i class="bi bi-geo-alt"></i> ${jobLocation}</li>
          <li><i class="bi bi-currency-dollar"></i> <span class="salary-text">${formatSalary(job.salaryMin, job.salaryMax)}</span></li>
          <li><i class="bi bi-briefcase"></i> ${job.experience || 'Không yêu cầu'}</li>
          <li><i class="bi bi-people"></i> Số lượng: ${quantityText}</li>
          <li><i class="bi bi-clock"></i> Thời gian: ${workingTimeText}</li>
          <li class="w-100 mt-2">
            <i class="bi bi-calendar"></i> 
            Ngày đăng tuyển: ${postDate} 
            <span class="divider">|</span> 
            Hết hạn trong: <span class="deadline-text ms-1">${getDaysLeft(job.deadline)}</span>
          </li>
        </ul>

        <div class="action-buttons d-flex gap-3" id="actionBtnWrapper">
          ${actionButton}
          <button class="btn-save" id="saveBtn" style="${saveBtnStyle}">
            <i class="${heartIconClass}" id="mainHeartIcon"></i> <span id="mainSaveText">${saveBtnText}</span>
          </button>
        </div>
      </div>

      <ul class="nav nav-tabs custom-tabs" id="jobTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#desc" type="button" role="tab">Mô tả công việc</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#req" type="button" role="tab">Yêu cầu ứng viên</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#benefit" type="button" role="tab">Quyền lợi</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#company" type="button" role="tab">Về công ty</button>
        </li>
      </ul>
      
      <div class="tab-content mt-4">
        <div class="tab-pane fade show active" id="desc">
          <h4>Mô tả công việc</h4>
          ${formatTextToList(job.description)}
        </div>
        <div class="tab-pane fade" id="req">
          <h4>Yêu cầu ứng viên</h4>
          ${formatTextToList(job.requirements)}
        </div>
        <div class="tab-pane fade" id="benefit">
          <h4>Quyền lợi</h4>
          ${formatTextToList(job.benefits)}
        </div>
        <div class="tab-pane fade" id="company">
          <h4>Giới thiệu công ty</h4>
          ${formatTextToList(companyDesc)}
        </div>
      </div>
    </div>
  `;

  const applyBtnElement = document.getElementById('applyBtn');
  if (applyBtnElement) {
    applyBtnElement.onclick = () => {
      window.openApplyModal(job._id);
    };
  }

  document.getElementById('saveBtn').onclick = function () {
    window.toggleSaveJob(job._id, this, true);
  };
}

async function fetchSimilarJobs(category, currentJobId) {
  try {
    const url = `${API_URL}/jobs?category=${encodeURIComponent(category)}&limit=5`;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const data = await res.json();
    const similarJobs = data.jobs.filter(job => job._id !== currentJobId).slice(0, 4);
    renderSimilarJobs(similarJobs);
  } catch (err) {
    console.error(err);
  }
}

function renderSimilarJobs(jobs) {
  const container = document.getElementById('similarJobsContainer');
  if (!jobs || jobs.length === 0) {
    container.innerHTML = '<div class="col-12 text-muted">Không có việc làm tương tự.</div>';
    return;
  }

  container.innerHTML = jobs.map(job => {
    const isSaved = savedJobIds.includes(job._id);
    const heartClass = isSaved ? 'bi-heart-fill text-danger' : 'bi-heart';

    return `
      <div class="col-lg-3 col-md-6">
        <div class="similar-job-card cursor-pointer position-relative h-100 p-3 border rounded shadow-sm bg-white" onclick="window.location.href='job-detail.html?id=${job._id}'">
          <button class="btn btn-light position-absolute top-0 end-0 m-2 rounded-circle border-0 btn-save-similar" data-id="${job._id}" style="width: 35px; height: 35px; z-index: 2;" onclick="event.stopPropagation(); window.toggleSaveJob('${job._id}', this, false);">
            <i class="${heartClass}"></i>
          </button>
          <div class="d-flex align-items-center mb-3">
            <div class="sim-logo me-2 rounded-3 bg-white d-flex align-items-center justify-content-center border shadow-sm fw-bold text-primary" style="width: 50px; height: 50px; overflow: hidden; padding: 3px;">
              ${job.companyId?.logoUrl
        ? `<img src="${job.companyId.logoUrl}" style="width:100%; height:100%; object-fit:contain;">`
        : (job.companyId?.companyName?.charAt(0) || 'C')}
            </div>
            <div style="width: calc(100% - 60px);">
              <div class="fw-bold fs-6 text-truncate" title="${job.title}">${job.title}</div>
              <div class="text-muted text-truncate" style="font-size: 0.8rem" title="${job.companyId?.companyName || 'Công ty'}">${job.companyId?.companyName || 'Công ty'}</div>
            </div>
          </div>
          <div class="text-muted mb-2 text-truncate" style="font-size: 0.85rem"><i class="bi bi-geo-alt"></i> ${job.location || job.companyId?.address || 'Hà Nội'}</div>
          <div class="text-success fw-bold" style="font-size: 0.9rem"><i class="bi bi-cash-coin me-1"></i>${formatSalary(job.salaryMin, job.salaryMax)}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.toggleSaveJob = async function (id, btnElement, isMainDetail = false) {
  if (!token) {
    alert('Vui lòng đăng nhập để lưu việc làm!');
    window.location.href = '../../pages/utils/login.html';
    return;
  }

  const isCurrentlySaved = savedJobIds.includes(id);

  try {
    if (isCurrentlySaved) {
      // BỎ LƯU
      const res = await fetch(`${API_URL}/jobs/save-job/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        savedJobIds = savedJobIds.filter(savedId => savedId !== id);

        if (isMainDetail) {
          document.getElementById('mainHeartIcon').className = 'bi-heart';
          document.getElementById('mainSaveText').innerText = 'Lưu';
          btnElement.style = '';
        } else {
          const icon = btnElement.querySelector('i');
          icon.classList.remove('bi-heart-fill', 'text-danger');
          icon.classList.add('bi-heart');
        }
      }
    } else {
      // LƯU MỚI
      const res = await fetch(`${API_URL}/jobs/save-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId: id })
      });

      if (res.ok) {
        savedJobIds.push(id);

        if (isMainDetail) {
          document.getElementById('mainHeartIcon').className = 'bi-heart-fill text-danger';
          document.getElementById('mainSaveText').innerText = 'Đã lưu';
          btnElement.style = 'color: #dc3545; border-color: #dc3545; background-color: #fff5f5;';
        } else {
          const icon = btnElement.querySelector('i');
          icon.classList.remove('bi-heart');
          icon.classList.add('bi-heart-fill', 'text-danger');
        }
      } else {
        alert('Lỗi: Không thể lưu việc làm');
      }
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

// ================= LOGIC XỬ LÝ NỘP HỒ SƠ =================
let currentApplyJobId = null;

window.openApplyModal = async function (jobId) {
  if (!token) {
    alert('Vui lòng đăng nhập để ứng tuyển!');
    window.location.href = '../../pages/utils/login.html';
    return;
  }
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
  const uploadInput = document.getElementById('uploadCvInput');
  const existingSelect = document.getElementById('existingCvSelect');
  const submitBtn = document.getElementById('submitApplicationBtn');

  if (uploadInput) {
    uploadInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        document.getElementById('uploadCvName').innerHTML = `<i class="bi bi-file-earmark-check me-1"></i> Đã chọn: ${this.files[0].name}`;
        if (existingSelect) existingSelect.value = "";
      }
    });
  }

  if (existingSelect) {
    existingSelect.addEventListener('change', function () {
      if (this.value) {
        if (uploadInput) uploadInput.value = "";
        document.getElementById('uploadCvName').innerText = "";
      }
    });
  }

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

        const applyBtn = document.getElementById('applyBtn');
        if (applyBtn) {
          applyBtn.outerHTML = `<button class="btn btn-success disabled" style="padding: 10px 30px; border-radius: 8px; font-weight: bold;"><i class="bi bi-check-circle me-2"></i>Đã ứng tuyển</button>`;
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

initPage();