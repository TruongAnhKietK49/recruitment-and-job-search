import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;

let token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token === 'null' || token === 'undefined') token = null;

const urlParams = new URLSearchParams(window.location.search);
const companyId = urlParams.get('id');

let savedJobIds = [];

if (!companyId) {
  window.location.href = 'companies.html';
}

async function initPage() {
  if (token) {
    await fetchUserSavedJobs();
  }
  fetchCompanyDetail();
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

function formatSalary(min, max) {
  const formatNum = (num) => num >= 1000000 ? (num / 1000000) + ' triệu' : num.toLocaleString();
  if (min && max) return `${formatNum(min)} - ${formatNum(max)}`;
  if (min) return `Từ ${formatNum(min)}`;
  if (max) return `Lên đến ${formatNum(max)}`;
  return 'Thỏa thuận';
}

function formatTextToParagraphs(text) {
  if (!text) return '<p>Đang cập nhật...</p>';
  return text.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p.trim()}</p>`).join('');
}

function fetchCompanyDetail() {
  fetch(`${API_URL}/companies/${companyId}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không tìm thấy thông tin công ty');
      }
      return data;
    })
    .then(data => {
      renderCompanyAndJobs(data.company, data.jobs || []);
    })
    .catch(err => {
      console.error(err);
      document.getElementById('companyDetailWrapper').innerHTML = `
        <div class="alert bg-white border-0 shadow-sm text-center py-5 rounded-4 mt-3">
          <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3.5rem;"></i>
          <h4 class="mt-3 text-dark fw-bold">Oops! Đã có lỗi xảy ra</h4>
          <p class="text-muted">${err.message}</p>
          <button class="btn btn-primary mt-2 rounded-pill px-4 shadow-sm" onclick="window.location.href='companies.html'">Quay lại danh sách</button>
        </div>`;
    });
}

function renderCompanyAndJobs(company, jobs) {
  const wrapper = document.getElementById('companyDetailWrapper');

  const logoContent = company.logoUrl
    ? `<img src="${company.logoUrl}" alt="Logo" style="width:100%; height:100%; object-fit:contain;">`
    : `${company.companyName?.charAt(0) || 'C'}`;

  const foundedDate = company.createdAt ? new Date(company.createdAt).toLocaleDateString('vi-VN') : 'Đang cập nhật';
  const memberCount = company.members ? company.members.length : 0;
  const ownerName = company.createdBy?.fullName || 'Đang cập nhật';
  const ownerEmail = company.createdBy?.email || 'Đang cập nhật';
  const category = company.category || 'Chưa phân loại';
  const website = company.website || 'Chưa cập nhật';
  const phone = company.phoneCompany || 'Chưa cập nhật';

  let jobsHtml = '';
  if (jobs.length === 0) {
    jobsHtml = '<p class="text-muted py-3">Công ty hiện chưa có vị trí nào đang tuyển dụng.</p>';
  } else {
    jobsHtml = jobs.map(job => {
      const postDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString('vi-VN') : 'Mới đây';
      const isSaved = savedJobIds.includes(job._id);
      const heartClass = isSaved ? 'bi-heart-fill text-danger' : 'bi-heart text-muted';
      const jobTypeMap = { 'full-time': 'Toàn thời gian', 'part-time': 'Bán thời gian', 'internship': 'Thực tập sinh', 'remote': 'Làm từ xa' };
      const displayJobType = jobTypeMap[job.jobType] || job.jobType || 'Không rõ';

      return `
        <div class="job-card-h flex-column flex-md-row position-relative p-4 border rounded-4 shadow-sm mb-3 bg-white d-flex align-items-md-center" onclick="window.location.href='job-detail.html?id=${job._id}'" style="cursor: pointer; transition: 0.3s;" onmouseover="this.classList.add('shadow')" onmouseout="this.classList.remove('shadow')">

          <button class="btn-save-job btn btn-light rounded-circle border-0 d-flex align-items-center justify-content-center shadow-sm" style="position: absolute; right: 12px; top: 12px; z-index: 2; width: 40px; height: 40px;" onclick="event.stopPropagation(); window.toggleSaveJob('${job._id}', this);">
            <i class="${heartClass} fs-5" style="margin-top: 2px;"></i>
          </button>

          <div class="job-logo-box bg-white rounded-3 d-flex justify-content-center align-items-center border shadow-sm me-md-4 mb-3 mb-md-0" style="width: 80px; height: 80px; overflow: hidden; flex-shrink: 0; padding: 5px; color: #0d6efd; font-size: 2.5rem; font-weight: bold;">
            ${logoContent}
          </div>

          <div class="job-info flex-grow-1" style="padding-right: 20px;">
            <h4 class="job-title text-dark fw-bold mb-1 fs-5 text-truncate" title="${job.title}">${job.title}</h4>
            <div class="job-company-name text-muted small text-uppercase mb-2 text-truncate" title="${company.companyName}">${company.companyName}</div>

            <div class="d-flex gap-2 flex-wrap" style="font-size: 0.85rem;">
              <span class="badge bg-light text-dark border fw-normal"><i class="bi bi-geo-alt text-secondary me-1"></i>${company.address?.split(',')[0] || 'Đang cập nhật'}</span>
              <span class="badge bg-light text-dark border fw-normal"><i class="bi bi-briefcase text-secondary me-1"></i>${displayJobType}</span>
              <span class="badge bg-light text-dark border fw-normal">${job.experience || 'Không yêu cầu'}</span>
            </div>
          </div>

          <div class="text-end d-flex flex-column justify-content-between mt-3 mt-md-0 pe-4 pt-2" style="min-width: 170px; min-height: 80px;">
            <div class="job-salary text-success fw-bold fs-6 mb-2"><i class="bi bi-cash-coin me-1"></i>${formatSalary(job.salaryMin, job.salaryMax)}</div>
            <div class="job-date text-muted small mt-auto">Ngày đăng: ${postDate}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  wrapper.innerHTML = `
    <div class="company-main-card">
      <div class="company-cover-pattern" style="height: 200px; background: linear-gradient(135deg, #3182ce 0%, #63b3ed 100%);"></div>

      <div class="company-content-inner position-relative px-4 pb-4 bg-white">
        
        <div class="company-header-row d-flex flex-column flex-md-row align-items-center align-items-md-end mb-4" style="margin-top: -70px;">
          <div class="company-logo-box bg-white p-2 rounded-4 shadow me-md-4 mb-3 mb-md-0" style="width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; font-size: 4rem; font-weight: bold; color: #0d6efd; border: 4px solid white; z-index: 2;">
            ${logoContent}
          </div>
          <div class="text-center text-md-start pb-2">
            <h1 class="company-title fs-2 fw-bold mb-2 text-dark">${company.companyName}</h1>
            <div class="d-flex flex-wrap justify-content-center justify-content-md-start gap-2">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fs-6 fw-medium"><i class="bi bi-tag me-1"></i>${category}</span>
              <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fs-6 fw-medium"><i class="bi bi-people me-1"></i>Quy mô: ${memberCount} nhân sự</span>
              <span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 fs-6 fw-medium"><i class="bi bi-calendar-check me-1"></i>Thành lập: ${foundedDate}</span>
            </div>
          </div>
        </div>

        <div class="row mt-5">
          
          <div class="col-lg-7 col-xl-8 mb-4">
            <div class="about-section h-100">
              <h3 class="section-title border-bottom pb-2 mb-4"><i class="bi bi-info-circle me-2"></i>Về công ty</h3>
              <div class="about-text text-muted" style="line-height: 1.8; font-size: 1.05rem;">
                ${formatTextToParagraphs(company.description)}
              </div>
            </div>
          </div>

          <div class="col-lg-5 col-xl-4 mb-4">
            <h3 class="section-title border-bottom pb-2 mb-4"><i class="bi bi-person-lines-fill me-2"></i>Thông tin liên hệ</h3>
            <div class="contact-info-grid" style="display: flex; flex-direction: column; gap: 1.2rem; background: #f8f9fa; padding: 1.8rem; border-radius: 16px; border: 1px solid #edf2f7;">

              <div class="contact-item d-flex align-items-center">
                <div class="contact-icon bg-white shadow-sm rounded-circle d-flex align-items-center justify-content-center text-primary" style="width: 45px; height: 45px; font-size: 1.2rem; flex-shrink: 0; margin-right: 15px;">
                  <i class="bi bi-geo-alt-fill"></i>
                </div>
                <div>
                  <div class="contact-text-label text-muted small mb-1">Địa chỉ văn phòng</div>
                  <div class="contact-text-value fw-semibold text-dark">${company.address || 'Chưa cập nhật'}</div>
                </div>
              </div>

              <div class="contact-item d-flex align-items-center">
                <div class="contact-icon bg-white shadow-sm rounded-circle d-flex align-items-center justify-content-center text-success" style="width: 45px; height: 45px; font-size: 1.2rem; flex-shrink: 0; margin-right: 15px;">
                  <i class="bi bi-telephone-fill"></i>
                </div>
                <div>
                  <div class="contact-text-label text-muted small mb-1">Điện thoại</div>
                  <div class="contact-text-value fw-semibold text-dark">${phone}</div>
                </div>
              </div>

              <div class="contact-item d-flex align-items-center">
                <div class="contact-icon bg-white shadow-sm rounded-circle d-flex align-items-center justify-content-center text-danger" style="width: 45px; height: 45px; font-size: 1.2rem; flex-shrink: 0; margin-right: 15px;">
                  <i class="bi bi-envelope-fill"></i>
                </div>
                <div>
                  <div class="contact-text-label text-muted small mb-1">Email HR / Owner</div>
                  <div class="contact-text-value fw-semibold text-dark">${ownerEmail}</div>
                </div>
              </div>

              <div class="contact-item d-flex align-items-center">
                <div class="contact-icon bg-white shadow-sm rounded-circle d-flex align-items-center justify-content-center text-info" style="width: 45px; height: 45px; font-size: 1.2rem; flex-shrink: 0; margin-right: 15px;">
                  <i class="bi bi-globe"></i>
                </div>
                <div>
                  <div class="contact-text-label text-muted small mb-1">Website</div>
                  <div class="contact-text-value fw-semibold text-dark">
                    ${website !== 'Chưa cập nhật' ? `<a href="${website.includes('http') ? website : `http://${website}`}" target="_blank" class="text-decoration-none">${website}</a>` : website}
                  </div>
                </div>
              </div>

              <div class="contact-item d-flex align-items-center">
                <div class="contact-icon bg-white shadow-sm rounded-circle d-flex align-items-center justify-content-center text-warning" style="width: 45px; height: 45px; font-size: 1.2rem; flex-shrink: 0; margin-right: 15px;">
                  <i class="bi bi-person-badge-fill"></i>
                </div>
                <div>
                  <div class="contact-text-label text-muted small mb-1">Người đại diện</div>
                  <div class="contact-text-value fw-semibold text-dark">${ownerName}</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div class="jobs-section mt-5 pt-4 border-top">
          <h3 class="section-title mb-4"><i class="bi bi-briefcase-fill me-2"></i>Việc đang tuyển <span class="badge bg-primary ms-2 rounded-pill fs-6 align-middle">${jobs.length}</span></h3>
          <div class="jobs-list">
            ${jobsHtml}
          </div>
        </div>

      </div>
    </div>
  `;
}

window.toggleSaveJob = async function (jobId, btnElement) {
  if (!token) {
    alert('Vui lòng đăng nhập để lưu việc làm!');
    window.location.href = '../../pages/utils/login.html';
    return;
  }

  const icon = btnElement.querySelector('i');
  const isCurrentlySaved = savedJobIds.includes(jobId);

  try {
    if (isCurrentlySaved) {
      const res = await fetch(`${API_URL}/jobs/save-job/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        savedJobIds = savedJobIds.filter(id => id !== jobId);
        icon.classList.remove('bi-heart-fill', 'text-danger');
        icon.classList.add('bi-heart', 'text-muted');
      }
    } else {
      const res = await fetch(`${API_URL}/jobs/save-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId })
      });

      if (res.ok) {
        savedJobIds.push(jobId);
        icon.classList.remove('bi-heart', 'text-muted');
        icon.classList.add('bi-heart-fill', 'text-danger');
      } else {
        alert('Lỗi: Không thể lưu việc làm');
      }
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

initPage();