const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

const urlParams = new URLSearchParams(window.location.search);
const companyId = urlParams.get('id');

if (!companyId) {
  window.location.href = 'companies.html';
}

function formatSalary(min, max) {
  const formatNum = (num) => num >= 1000000 ? (num / 1000000) + ' triệu' : num.toLocaleString();
  if (min && max) return `${formatNum(min)} - ${formatNum(max)}`;
  if (min) return `Từ ${formatNum(min)}`;
  if (max) return `Lên đến ${formatNum(max)}`;
  return 'Thương lượng';
}

function formatTextToParagraphs(text) {
  if (!text) return '<p>Đang cập nhật...</p>';
  return text.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p.trim()}</p>`).join('');
}

function fetchCompanyDetail() {
  fetch(`${API_URL}/companies/${companyId}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
    .then(res => res.json())
    .then(data => {
      renderCompanyAndJobs(data.company, data.jobs || []);
    })
    .catch(err => {
      console.error(err);
      document.getElementById('companyDetailWrapper').innerHTML = '<div class="alert alert-danger text-center">Lỗi tải dữ liệu</div>';
    });
}

function renderCompanyAndJobs(company, jobs) {
  const wrapper = document.getElementById('companyDetailWrapper');
  
  const logoContent = company.logo 
      ? `<img src="${company.logo}" alt="Logo">` 
      : `${company.companyName?.charAt(0) || 'C'}`;

  let jobsHtml = '';
  if (jobs.length === 0) {
    jobsHtml = '<p class="text-muted">Công ty hiện chưa có vị trí nào đang tuyển dụng.</p>';
  } else {
    jobsHtml = jobs.map(job => {
      const postDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString('vi-VN') : 'Mới đây';
      return `
        <div class="job-card-h" onclick="window.location.href='job-detail.html?id=${job._id}'">
          <button class="btn-save-job" onclick="event.stopPropagation(); alert('Đã lưu!');"><i class="bi bi-heart"></i></button>
          
          <div class="job-logo-box">
            ${logoContent}
          </div>
          
          <div class="job-info">
            <h4 class="job-title">${job.title}</h4>
            <div class="job-company-name">${company.companyName}</div>
            <div class="job-meta-line">${company.address || 'Đang cập nhật'}</div>
            <div class="job-meta-line">${job.jobType === 'full-time' ? 'Nhân viên' : (job.jobType || 'Nhân viên')}</div>
            <div class="job-meta-line">${job.experience || 'Không yêu cầu kinh nghiệm'}</div>
            <div class="job-salary">${formatSalary(job.salaryMin, job.salaryMax)}</div>
          </div>
          
          <div class="job-date">Ngày đăng tuyển: ${postDate}</div>
        </div>
      `;
    }).join('');
  }

  wrapper.innerHTML = `
    <div class="company-main-card">
      <div class="company-cover-pattern"></div>
      
      <div class="company-content-inner">
        <div class="company-header-row">
          <div class="company-logo-box">${logoContent}</div>
          <h1 class="company-title">${company.companyName}</h1>
        </div>

        <ul class="meta-info-list">
          <li><i class="bi bi-geo-alt"></i> ${company.address || 'Chưa cập nhật địa chỉ'}</li>
          <li><i class="bi bi-people"></i> ${company.employeeCount || '150 - 200'} nhân viên</li>
          <li><i class="bi bi-calendar3"></i> Thành lập: ${company.establishedYear || 'Đang cập nhật'}</li>
        </ul>

        <div class="about-section mb-5">
          <h3 class="section-title">Về công ty</h3>
          <div class="about-text">
            ${formatTextToParagraphs(company.description)}
          </div>
        </div>

        <div class="jobs-section">
          <h3 class="section-title mb-0">Việc đang tuyển</h3>
          <span class="job-count-label">${jobs.length} việc làm</span>
          
          <div class="jobs-list mt-4">
            ${jobsHtml}
          </div>
        </div>
        
      </div>
    </div>
  `;
}

fetchCompanyDetail();