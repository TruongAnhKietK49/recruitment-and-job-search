import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;

let token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token === 'null' || token === 'undefined') token = null;

if (!token) {
  window.location.href = '../../pages/utils/login.html';
}

let cvs = [];

async function fetchCVs() {
  const container = document.getElementById('cvsList');
  container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await fetch(`${API_URL}/resumes/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      cvs = await res.json();
      renderCVs();
    } else {
      throw new Error('Không thể tải danh sách CV');
    }
  } catch (err) {
    container.innerHTML = `<div class="col-12"><div class="alert alert-danger text-center">Lỗi: ${err.message}</div></div>`;
  }
}

function renderCVs() {
  const container = document.getElementById('cvsList');
  if (!cvs || !cvs.length) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-file-earmark-x text-muted" style="font-size: 3rem;"></i>
        <h5 class="mt-3 text-muted">Bạn chưa có CV nào</h5>
        <p class="text-muted">Hãy bấm "Tạo CV" để thêm hồ sơ của bạn nhé.</p>
      </div>`;
    return;
  }

  container.innerHTML = cvs.map(cv => {
    const uploadDate = cv.createdAt ? new Date(cv.createdAt).toLocaleDateString('vi-VN') : 'Mới đây';
    const isImage = cv.fileUrl && (cv.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null || cv.fileUrl.includes('unsplash.com'));

    const thumbnailContent = isImage 
        ? `<img src="${cv.fileUrl}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 12px 12px 0 0;" alt="CV Thumbnail" 
             onerror="this.classList.add('d-none'); this.nextElementSibling.classList.remove('d-none'); this.nextElementSibling.classList.add('d-flex');">
           <div class="bg-light d-none align-items-center justify-content-center text-primary" style="height: 160px; border-radius: 12px 12px 0 0; font-size: 3rem;">
             <i class="bi bi-file-earmark-text"></i>
           </div>`
        : `<div class="bg-light d-flex align-items-center justify-content-center text-danger" style="height: 160px; border-radius: 12px 12px 0 0; font-size: 3.5rem;">
             <i class="bi bi-filetype-pdf"></i>
           </div>`;
    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100 shadow-sm border-0" style="border-radius: 12px; transition: 0.3s;" onmouseover="this.classList.add('shadow')" onmouseout="this.classList.remove('shadow')">
          
          <div style="cursor: pointer;" onclick="window.open('${cv.fileUrl}', '_blank')" title="Nhấp để xem chi tiết">
            ${thumbnailContent}
          </div>

          <div class="card-body p-3">
            <h5 class="fw-bold text-dark text-truncate mb-1" title="${cv.title}">${cv.title}</h5>
            <p class="small text-muted mb-3"><i class="bi bi-clock-history me-1"></i>Tải lên: ${uploadDate}</p>
            
            <div class="d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm flex-grow-1" onclick="window.openEditModal('${cv._id}', '${cv.title}', '${cv.fileUrl}')"><i class="bi bi-pencil-square"></i> Sửa</button>
              <button class="btn btn-outline-danger btn-sm flex-grow-1" onclick="window.deleteCV('${cv._id}')"><i class="bi bi-trash3"></i> Xóa</button>
            </div>
          </div>

        </div>
      </div>
    `;
  }).join('');
}

window.createCV = async function(data) {
  try {
    const res = await fetch(`${API_URL}/resumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      fetchCVs();
      bootstrap.Modal.getInstance(document.getElementById('createCVModal')).hide();
      document.getElementById('createCVForm').reset();
    } else {
      alert("Lỗi khi tạo CV!");
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

window.updateCV = async function(id, data) {
  try {
    const res = await fetch(`${API_URL}/resumes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      fetchCVs();
      bootstrap.Modal.getInstance(document.getElementById('editCVModal')).hide();
    } else {
      alert("Lỗi khi cập nhật CV!");
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

window.deleteCV = async function(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa CV này?')) return;
  try {
    const res = await fetch(`${API_URL}/resumes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchCVs();
    } else {
      alert("Lỗi khi xóa CV!");
    }
  } catch (err) {
    alert('Lỗi kết nối: ' + err.message);
  }
}

document.getElementById('saveCVBtn').addEventListener('click', () => {
  const form = document.getElementById('createCVForm');
  const title = form.title.value;
  const fileUrl = form.fileUrl.value;
  if (!title || !fileUrl) return alert('Vui lòng điền đầy đủ thông tin');
  window.createCV({ title, fileUrl });
});

window.openEditModal = function(id, title, url) {
  let modal = document.getElementById('editCVModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'editCVModal';
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
          <div class="modal-header border-0 pb-0 pt-4 px-4">
            <h5 class="modal-title fw-bold text-primary">Sửa CV</h5>
            <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <form id="editCVForm">
              <div class="mb-3">
                <label class="form-label fw-bold">Tiêu đề CV</label>
                <input type="text" class="form-control" name="title" required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">URL file CV</label>
                <input type="url" class="form-control" name="fileUrl" required>
              </div>
            </form>
          </div>
          <div class="modal-footer border-0 pb-4 px-4 pt-0">
            <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Hủy</button>
            <button type="button" class="btn btn-primary rounded-pill px-4" id="updateCVBtn">Cập nhật</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('#updateCVBtn').addEventListener('click', () => {
      const form = modal.querySelector('#editCVForm');
      if (!form.title.value || !form.fileUrl.value) return alert('Vui lòng điền đủ thông tin');
      window.updateCV(id, { title: form.title.value, fileUrl: form.fileUrl.value });
    });
  }
  
  const form = modal.querySelector('#editCVForm');
  form.title.value = title;
  form.fileUrl.value = url;
  new bootstrap.Modal(modal).show();
}

document.addEventListener('DOMContentLoaded', fetchCVs);