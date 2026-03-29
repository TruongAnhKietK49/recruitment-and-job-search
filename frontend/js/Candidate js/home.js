const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

let currentPage = 1;
let jobs = [];

async function fetchJobs() {
  const search = document.getElementById('heroSearchInput')?.value || document.getElementById('searchInput')?.value || '';
  const category = document.getElementById('categoryFilter').value;
  const jobType = document.getElementById('typeFilter').value;
  const salary = document.getElementById('salaryFilter').value;
  const experience = document.getElementById('expFilter').value;

  let url = `${API_URL}/jobs?page=${currentPage}&limit=12&keyword=${encodeURIComponent(search)}&category=${category}&jobType=${jobType}`;
  if (salary) url += `&salaryRange=${salary}`;
  if (experience) url += `&experience=${experience}`;

  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const data = await res.json();
    jobs = data.jobs;
    renderJobs();
  } catch (err) {
    console.error(err);
    document.getElementById('jobsContainer').innerHTML = '<div class="alert alert-danger">Không thể tải dữ liệu</div>';
  }
}

function renderJobs() {
  const container = document.getElementById('jobsContainer');
  if (!jobs || jobs.length === 0) {
    container.innerHTML = '<div class="alert alert-info text-center">Không tìm thấy việc làm phù hợp.</div>';
    return;
  }
  
  container.innerHTML = '<div class="row">' + jobs.map(job => `
    <div class="col-lg-4 col-md-6 mb-4"> <div class="job-card cursor-pointer" onclick="window.location.href='job-detail.html?id=${job._id}'">
        
        <button class="save-btn save-job" data-id="${job._id}" onclick="event.stopPropagation();">
          <i class="bi bi-heart"></i>
        </button>

        <div class="d-flex align-items-center mb-3">
          <div class="company-logo me-3">
            ${job.companyId?.companyName?.charAt(0) || 'C'}
          </div>
          <div>
            <h3 class="job-title">${job.title}</h3>
            <div class="company-name">${job.companyId?.companyName || 'Công ty'}</div>
          </div>
        </div>
        
        <div class="text-muted small mb-2">
          <i class="bi bi-geo-alt"></i> ${job.companyId?.address || 'Hà Nội'}
        </div>
        
        <div class="salary">
          ${job.salaryMin ? job.salaryMin.toLocaleString() + ' triệu' : ''} - 
          ${job.salaryMax ? job.salaryMax.toLocaleString() + ' triệu' : 'Thỏa thuận'}
        </div>
        
      </div>
    </div>
  `).join('') + '</div>';

  // Gắn sự kiện cho nút lưu
  document.querySelectorAll('.save-job').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const jobId = btn.getAttribute('data-id');
      if (!token) {
        alert('Vui lòng đăng nhập để lưu việc làm');
        window.location.href = '../../pages/utils/login.html';
        return;
      }
      saveJob(jobId);
    });
  });
}

async function saveJob(jobId) {
  try {
    const res = await fetch(`${API_URL}/jobs/save-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ jobId })
    });
    if (res.ok) {
      alert('Đã lưu việc làm!');
    } else {
      const err = await res.json();
      alert('Lỗi: ' + (err.message || 'Không thể lưu'));
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

// Event listeners
document.getElementById('heroSearchBtn').addEventListener('click', () => {
  currentPage = 1;
  fetchJobs();
});
document.getElementById('categoryFilter').addEventListener('change', () => {
  currentPage = 1;
  fetchJobs();
});
document.getElementById('typeFilter').addEventListener('change', () => {
  currentPage = 1;
  fetchJobs();
});
document.getElementById('salaryFilter').addEventListener('change', () => {
  currentPage = 1;
  fetchJobs();
});
document.getElementById('expFilter').addEventListener('change', () => {
  currentPage = 1;
  fetchJobs();
});

// Initial load
fetchJobs();