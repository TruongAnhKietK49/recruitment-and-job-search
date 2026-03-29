const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../utils/login.html';
}

function fetchSavedJobs() {
  fetch(`${API_URL}/jobs/save-job/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      renderSavedJobs(data);
    })
    .catch(err => console.error(err));
}

function renderSavedJobs(savedJobs) {
  const container = document.getElementById('savedJobsList');
  if (!savedJobs.length) {
    container.innerHTML = '<div class="alert alert-info">Bạn chưa lưu việc làm nào.</div>';
    return;
  }
  container.innerHTML = savedJobs.map(item => `
    <div class="saved-job-card">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h4>${item.jobId.title}</h4>
          <div class="text-muted">${item.jobId.companyId?.companyName || 'Công ty'}</div>
          <div class="mt-2">
            <span class="badge bg-light text-dark">${item.jobId.category}</span>
            <span class="badge bg-light text-dark">${item.jobId.jobType}</span>
          </div>
          <div class="mt-2">Mức lương: ${item.jobId.salaryMin?.toLocaleString()} - ${item.jobId.salaryMax?.toLocaleString()} VND</div>
        </div>
        <div>
          <button class="btn btn-sm btn-danger" data-id="${item.jobId._id}">Bỏ lưu</button>
          <a href="job-detail.html?id=${item.jobId._id}" class="btn btn-sm btn-outline-primary ms-2">Xem chi tiết</a>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.btn-danger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const jobId = btn.getAttribute('data-id');
      unsaveJob(jobId);
    });
  });
}

function unsaveJob(jobId) {
  fetch(`${API_URL}/jobs/save-job/${jobId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(() => {
      alert('Đã bỏ lưu');
      fetchSavedJobs(); // reload
    })
    .catch(err => alert('Lỗi: ' + err.message));
}

fetchSavedJobs();