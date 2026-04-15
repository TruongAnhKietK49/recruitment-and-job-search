const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

function fetchPendingJobs() {
  // Lấy các job đang chờ duyệt
  fetch(`${API_URL}/jobs/pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(jobs => renderJobs(jobs))
    .catch(err => console.error(err));
}

function renderJobs(jobs) {
  const tbody = document.getElementById('jobsTableBody');
  if (!jobs.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-success"><i class="bi bi-check-circle"></i> Không có bài đăng nào cần duyệt.</td></tr>';
    return;
  }

  tbody.innerHTML = jobs.map(job => `
    <tr>
      <td class="px-4 py-3 fw-medium">${job.title}</td>
      <td class="py-3"><span class="badge bg-warning text-dark">Chờ duyệt</span></td>
      <td class="px-4 py-3 text-end">
        <button class="btn btn-sm btn-success me-1" onclick="updateJob('${job._id}', 'approve')">
          <i class="bi bi-check-lg"></i> Duyệt
        </button>
        <button class="btn btn-sm btn-danger" onclick="updateJob('${job._id}', 'reject')">
          <i class="bi bi-x-lg"></i> Từ chối
        </button>
      </td>
    </tr>
  `).join('');
}

function updateJob(id, action) {
  const note = action === 'approve' ? 'Đã duyệt' : 'Không đạt yêu cầu';
  fetch(`${API_URL}/jobs/${id}/${action}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reviewNote: note })
  })
    .then(res => res.json())
    .then(() => {
      alert(`Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} thành công!`);
      fetchPendingJobs();
    })
    .catch(err => alert('Lỗi: ' + err.message));
}

fetchPendingJobs();