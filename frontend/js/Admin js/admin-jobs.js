import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;
const token = localStorage.getItem('token') || sessionStorage.getItem('token');

let allJobs = [];
let currentPage = 1;
const itemsPerPage = 8;

// ================== INIT & FETCH ==================
async function init() {
  await fetchAllJobs();
  populateCategoryFilter();
  renderJobs();
  attachEvents();
}

async function fetchAllJobs() {
  const tbody = document.getElementById('jobsTableBody');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm"></div> Đang tải dữ liệu...</td></tr>';

  try {
    const res = await fetch(`${API_URL}/jobs/admin/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const response = await res.json();

    const jobs = Array.isArray(response) ? response : (response.jobs || []);

    allJobs = jobs;
    renderJobs();
  } catch (err) {
    console.error("Lỗi Job:", err);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Lỗi kết nối máy chủ!</td></tr>';
  }
}


// ================== HELPER FORMAT ==================
const formatSalary = (min, max) => {
  if (!min && !max) return 'Thỏa thuận';
  const format = (n) => n ? (n / 1000000).toLocaleString('vi-VN') + ' triệu' : '';
  if (min && max) return `${format(min)} - ${format(max)}`;
  if (min) return `Từ ${format(min)}`;
  return `Đến ${format(max)}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Chưa cập nhật';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

// ================== RENDER & PAGINATION ==================
function renderJobs() {
  const search = document.getElementById('searchJob').value.toLowerCase();
  const category = document.getElementById('filterCategory').value;
  const statusFilter = document.getElementById('filterStatus').value;

  let filtered = allJobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search) || (j.companyId?.companyName || '').toLowerCase().includes(search);
    const matchCat = !category || j.category === category;
    const matchStatus = !statusFilter || j.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedList = filtered.slice(start, start + itemsPerPage);

  const tbody = document.getElementById('jobsTableBody');
  if (paginatedList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1 d-block mb-3"></i>Không tìm thấy bài đăng nào phù hợp</td></tr>`;
    document.getElementById('pageInfo').innerText = '';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = paginatedList.map((job, index) => {
    const companyName = job.companyId?.companyName || 'Công ty ẩn danh';
    const hrName = job.createdBy?.fullName || 'Không rõ HR';
    const deadlineColor = (new Date(job.deadline) < new Date()) ? 'text-danger' : 'text-muted';

    let statusBadge = '';
    if (job.status === 'approved') statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle">Đã duyệt</span>';
    else if (job.status === 'rejected') statusBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Từ chối</span>';
    else if (job.status === 'closed') statusBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Đã gỡ (Đóng)</span>';
    else statusBadge = '<span class="badge bg-warning text-dark border border-warning">Chờ duyệt</span>';

    let actionBtns = '';
    if (job.status === 'pending') {
      actionBtns = `<button class="btn btn-sm btn-success me-1 shadow-sm" onclick="updateJobStatus('${job._id}', 'approve')" title="Duyệt bài"><i class="bi bi-check-lg"></i></button>
                    <button class="btn btn-sm btn-danger shadow-sm" onclick="updateJobStatus('${job._id}', 'reject')" title="Từ chối"><i class="bi bi-x-lg"></i></button>`;
    } else if (job.status === 'approved') {
      actionBtns = `<button class="btn btn-sm btn-outline-danger shadow-sm" onclick="updateJobStatus('${job._id}', 'close')" title="Gỡ bài xuống"><i class="bi bi-dash-circle"></i> Gỡ bài</button>`;
    } else if (job.status === 'closed' || job.status === 'rejected') {
      actionBtns = `<button class="btn btn-sm btn-outline-success shadow-sm" onclick="updateJobStatus('${job._id}', 'approve')" title="Khôi phục / Duyệt lại"><i class="bi bi-arrow-counterclockwise"></i> Khôi phục</button>`;
    }

    return `
    <tr>
      <td class="text-muted fw-bold text-center">${start + index + 1}</td>
      <td>
        <div class="fw-bold text-dark job-title-cell" title="${job.title}">${job.title}</div>
        <div class="small mt-1">
          ${statusBadge} <span class="badge bg-light text-dark border mx-1">${job.category}</span>
        </div>
      </td>
      <td>
        <div class="fw-medium text-primary text-truncate" style="max-width: 200px;" title="${companyName}"><i class="bi bi-building me-1"></i>${companyName}</div>
        <div class="small text-muted mt-1"><i class="bi bi-person me-1"></i>${hrName}</div>
      </td>
      <td>
        <div class="fw-bold text-success mb-1">${formatSalary(job.salaryMin, job.salaryMax)}</div>
        <div class="small ${deadlineColor}"><i class="bi bi-calendar-x me-1"></i>${formatDate(job.deadline)}</div>
      </td>
      <td class="text-end pe-4">
        <button class="btn btn-sm btn-info text-white me-1 shadow-sm" onclick="viewJobDetail('${job._id}')" title="Xem chi tiết">
          <i class="bi bi-eye"></i>
        </button>
        ${actionBtns}
      </td>
    </tr>
  `}).join('');

  document.getElementById('pageInfo').innerText = `Trang ${currentPage} / ${totalPages} (Tổng: ${filtered.length} bài đăng)`;
  let pageHtml = '';
  for (let i = 1; i <= totalPages; i++) {
    pageHtml += `<li class="page-item ${i === currentPage ? 'active' : ''}"><button class="page-link" onclick="changePage(${i})">${i}</button></li>`;
  }
  document.getElementById('pagination').innerHTML = pageHtml;
}

window.changePage = (page) => { currentPage = page; renderJobs(); }

function populateCategoryFilter() {
  const select = document.getElementById('filterCategory');
  const categories = [...new Set(allJobs.map(j => j.category).filter(Boolean))];
  categories.forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

// ================== XEM CHI TIẾT BÀI ĐĂNG ==================
window.viewJobDetail = (id) => {
  const job = allJobs.find(j => j._id === id); // Sửa lại thành allJobs
  if (!job) return;

  document.getElementById('modalJobTitle').innerText = job.title || 'N/A';
  document.getElementById('modalJobCategory').innerText = job.category || 'N/A';
  document.getElementById('modalJobType').innerText = job.jobType ? job.jobType.toUpperCase() : 'N/A';
  document.getElementById('modalCompanyName').innerText = job.companyId?.companyName || 'Công ty ẩn danh';
  document.getElementById('modalHrName').innerText = job.createdBy?.fullName || 'Không rõ HR';

  document.getElementById('modalJobSalary').innerText = formatSalary(job.salaryMin, job.salaryMax);
  document.getElementById('modalJobLocation').innerText = job.location || job.companyId?.address || 'N/A';
  document.getElementById('modalJobDeadline').innerText = formatDate(job.deadline);
  document.getElementById('modalJobQuantity').innerText = job.quantity ? `${job.quantity} người` : 'Không giới hạn';
  document.getElementById('modalJobExp').innerText = job.experience || 'Không yêu cầu';
  document.getElementById('modalJobTime').innerText = job.workingTime || 'Giờ hành chính';

  document.getElementById('modalJobDesc').innerText = job.description || 'Không có mô tả';
  document.getElementById('modalJobReq').innerText = job.requirements || 'Không có yêu cầu';
  document.getElementById('modalJobBenefits').innerText = job.benefits || 'Không có thông tin';

  const footer = document.getElementById('modalJobFooter');
  if(footer) {
      if (job.status === 'pending') {
        footer.innerHTML = `
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-danger" onclick="updateJobStatus('${job._id}', 'reject', true)"><i class="bi bi-x-circle me-1"></i>Từ chối</button>
          <button type="button" class="btn btn-success" onclick="updateJobStatus('${job._id}', 'approve', true)"><i class="bi bi-check-circle me-1"></i>Phê duyệt</button>
        `;
      } else if (job.status === 'approved') {
        footer.innerHTML = `
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-outline-danger" onclick="updateJobStatus('${job._id}', 'close', true)"><i class="bi bi-dash-circle me-1"></i>Gỡ bài xuống</button>
        `;
      } else {
        footer.innerHTML = `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>`;
      }
  }

  const modal = new bootstrap.Modal(document.getElementById('jobDetailModal'));
  modal.show();
}

// ================== DUYỆT / TỪ CHỐI /GỠ BÀI==================
window.updateJobStatus = async (id, action, fromModal = false) => {
  let actionText = '';
  if (action === 'approve') actionText = 'DUYỆT (Hoặc Khôi phục)';
  else if (action === 'reject') actionText = 'TỪ CHỐI';
  else if (action === 'close') actionText = 'GỠ BÀI';

  if(!confirm(`Xác nhận ${actionText} bài đăng này?`)) return;

  try {
    const res = await fetch(`${API_URL}/jobs/${id}/${action}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      alert(`Thao tác thành công!`);

      if (fromModal) {
        const modalEl = document.getElementById('jobDetailModal');
        if (modalEl) {
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();
        }
      }

      await fetchAllJobs(); 
      populateCategoryFilter();
      renderJobs();
    } else {
      const err = await res.json();
      alert("Lỗi: " + err.message);
    }
  } catch (error) {
    alert("Lỗi kết nối máy chủ");
  }
}

function attachEvents() {
  document.getElementById('searchJob')?.addEventListener('input', () => { currentPage = 1; renderJobs(); });
  document.getElementById('filterCategory')?.addEventListener('change', () => { currentPage = 1; renderJobs(); });
  document.getElementById('filterStatus')?.addEventListener('change', () => { currentPage = 1; renderJobs(); });
}

init();