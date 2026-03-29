const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');
const urlParams = new URLSearchParams(window.location.search);
const jobId = urlParams.get('id');

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
    document.getElementById('jobDetailContainer').innerHTML = '<div class="alert alert-danger">Lỗi tải dữ liệu</div>';
  }
}

function renderJobDetail(job) {
  const container = document.getElementById('jobDetailContainer');
  const postDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString('vi-VN') : 'Đang cập nhật';
  
  container.innerHTML = `
    <div class="job-detail-card">
      <div class="job-header-pattern"></div>
      
      <div class="job-header-content">
        <div class="company-logo">${job.companyId?.companyName?.charAt(0) || 'C'}</div>
        <h1 class="job-title">${job.title || 'Đang cập nhật...'}</h1>
        <div class="company-name">${job.companyId?.companyName || 'Công ty'}</div>
        
        <ul class="meta-list">
          <li><i class="bi bi-geo-alt"></i> ${job.companyId?.address || 'Hà Nội'}</li>
          <li><i class="bi bi-currency-dollar"></i> <span class="salary-text">${formatSalary(job.salaryMin, job.salaryMax)}</span></li>
          <li><i class="bi bi-briefcase"></i> ${job.experience || 'Không yêu cầu'} kinh nghiệm</li>
          <li>
            <i class="bi bi-calendar"></i> 
            Ngày đăng tuyển: ${postDate} 
            <span class="divider">|</span> 
            Hết hạn trong: <span class="deadline-text ms-1">${getDaysLeft(job.deadline)}</span>
          </li>
        </ul>

        <div class="action-buttons">
          <button class="btn-apply" id="applyBtn">Ứng tuyển ngay</button>
          <button class="btn-save" id="saveBtn"><i class="bi bi-heart"></i> Lưu</button>
        </div>
      </div>

      <ul class="nav nav-tabs custom-tabs" id="jobTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#desc" type="button" role="tab">Mô tả</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#req" type="button" role="tab">Kỹ năng yêu cầu</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#detail" type="button" role="tab">Chi tiết công việc</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#contact" type="button" role="tab">Liên hệ</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#benefit" type="button" role="tab">Về công ty</button>
        </li>
      </ul>
      
      <div class="tab-content">
        <div class="tab-pane fade show active" id="desc">
          <h4>Mô tả công việc</h4>
          ${formatTextToList(job.description)}
        </div>
        <div class="tab-pane fade" id="req">
          <h4>Kỹ năng yêu cầu</h4>
          ${formatTextToList(job.requirements)}
        </div>
        <div class="tab-pane fade" id="detail">
          <h4>Chi tiết công việc</h4>
          ${formatTextToList(job.details)}
        </div>
        <div class="tab-pane fade" id="contact">
          <h4>Thông tin liên hệ</h4>
          ${formatTextToList(job.contact)}
        </div>
        <div class="tab-pane fade" id="benefit">
          <h4>Về công ty</h4>
          ${formatTextToList(job.benefits)}
        </div>
      </div>
    </div>
  `;

  document.getElementById('applyBtn').onclick = () => {
    if (!token) {
      window.location.href = '../../pages/utils/login.html';
    } else {
      window.location.href = `apply.html?jobId=${job._id}`;
    }
  };

  document.getElementById('saveBtn').onclick = () => {
    if(!token) {
      window.location.href = '../../pages/utils/login.html';
    } else {
      // Logic gọi API lưu job
      alert('Đang gọi API lưu việc làm...');
    }
  };
}

async function fetchSimilarJobs(category, currentJobId) {
  try {
    const url = `${API_URL}/jobs?category=${encodeURIComponent(category)}&limit=4`;
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

  container.innerHTML = jobs.map(job => `
    <div class="col-lg-3 col-md-6">
      <div class="similar-job-card cursor-pointer" onclick="window.location.href='job-detail.html?id=${job._id}'">
        <button class="sim-heart btn-save-similar" data-id="${job._id}" onclick="event.stopPropagation();">
          <i class="bi bi-heart"></i>
        </button>
        <div class="d-flex align-items-center mb-3">
          <div class="sim-logo me-2">${job.companyId?.companyName?.charAt(0) || 'C'}</div>
          <div>
            <div class="fw-bold fs-6">${job.title}</div>
            <div class="text-muted" style="font-size: 0.8rem">${job.companyId?.companyName || 'Công ty'}</div>
          </div>
        </div>
        <div class="text-muted mb-2" style="font-size: 0.85rem"><i class="bi bi-geo-alt"></i> ${job.companyId?.address || 'Hà Nội'}</div>
        <div class="text-primary fw-bold" style="font-size: 0.9rem">${formatSalary(job.salaryMin, job.salaryMax)}</div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.btn-save-similar').forEach(btn => {
    btn.onclick = () => {
      if(!token) {
        window.location.href = '../../pages/utils/login.html';
      } else {
        const simJobId = btn.getAttribute('data-id');
        alert(`gọi API lưu việc làm tương tự có ID: ${simJobId}`);
      }
    };
  });
}

// Khởi chạy
fetchJobDetail();