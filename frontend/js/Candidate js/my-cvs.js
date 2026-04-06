const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

let cvs = [];

function fetchCVs() {
  // TEST GIAO DIỆN 
  cvs = [
    { _id: '1', title: 'CV AI Engineer', fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop', createdAt: '2026-02-19' },
    { _id: '2', title: 'CV AI Engineer', fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop', createdAt: '2026-02-19' }
  ];
  renderCVs();

  /* GỌI API
  fetch(`${API_URL}/resumes/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      cvs = data;
      renderCVs();
    })
    .catch(err => console.error(err));
  */
}

function renderCVs() {
  const container = document.getElementById('cvsList');
  if (!cvs.length) {
    container.innerHTML = '<div class="col-12"><div class="alert alert-info text-center py-4">Bạn chưa có CV nào. Hãy bấm "Tạo CV" để bắt đầu.</div></div>';
    return;
  }

  container.innerHTML = cvs.map(cv => {
    const uploadDate = cv.createdAt ? new Date(cv.createdAt).toLocaleDateString('vi-VN') : 'Mới đây';
    
    const isImage = cv.fileUrl && (cv.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || cv.fileUrl.includes('images.unsplash.com'));
    
    const thumbnailContent = isImage 
        ? `<img src="${cv.fileUrl}" class="cv-thumbnail" alt="CV Thumbnail" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="cv-placeholder" style="display: none;"><i class="bi bi-file-earmark-text"></i><span>CV Document</span></div>`
        : `<div class="cv-placeholder"><i class="bi bi-file-earmark-pdf"></i><span>PDF Document</span></div>`;

    return `
    <div class="col-md-6 col-lg-5 col-xl-4 mb-4">       <div class="cv-card">
        
        <div class="cv-thumbnail-wrap cursor-pointer" onclick="window.open('${cv.fileUrl}', '_blank')" title="Nhấp để xem chi tiết">
          ${thumbnailContent}
        </div>

        <div class="cv-info">
          <h3 class="cv-title">${cv.title}</h3>
          <span class="cv-date">Tải lên: ${uploadDate}</span>
        </div>

                <div class="cv-actions">
          <button class="btn-action btn-action-edit edit-cv" data-id="${cv._id}" data-title="${cv.title}" data-url="${cv.fileUrl}">
            <i class="bi bi-pencil-square"></i> Chỉnh sửa
          </button>
          <button class="btn-action btn-action-delete delete-cv" data-id="${cv._id}">
            <i class="bi bi-trash3"></i> Xóa
          </button>
        </div>
      </div>
    </div>
  `}).join('');

  document.querySelectorAll('.edit-cv').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      const url = btn.getAttribute('data-url');
      openEditModal(id, title, url);
    });
  });

  document.querySelectorAll('.delete-cv').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      if (confirm('Bạn có chắc muốn xóa CV này?')) {
        deleteCV(id);
      }
    });
  });
}

function createCV(data) {
  fetch(`${API_URL}/resumes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(() => {
      fetchCVs();
      const modal = bootstrap.Modal.getInstance(document.getElementById('createCVModal'));
      modal.hide();
      document.getElementById('createCVForm').reset();
      alert('Tạo CV thành công');
    })
    .catch(err => alert('Lỗi: ' + err.message));
}

function updateCV(id, data) {
  fetch(`${API_URL}/resumes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(() => {
      fetchCVs();
      const modal = bootstrap.Modal.getInstance(document.getElementById('editCVModal'));
      modal.hide();
      alert('Cập nhật CV thành công');
    })
    .catch(err => alert('Lỗi: ' + err.message));
}

function deleteCV(id) {
  fetch(`${API_URL}/resumes/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(() => {
      fetchCVs();
      alert('Xóa CV thành công');
    })
    .catch(err => alert('Lỗi: ' + err.message));
}

document.getElementById('saveCVBtn').addEventListener('click', () => {
  const form = document.getElementById('createCVForm');
  const title = form.title.value;
  const fileUrl = form.fileUrl.value;
  if (!title || !fileUrl) {
    alert('Vui lòng điền đầy đủ thông tin');
    return;
  }
  createCV({ title, fileUrl });
});

function openEditModal(id, title, url) {
  let modal = document.getElementById('editCVModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'editCVModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Sửa CV</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="editCVForm">
              <div class="mb-3">
                <label class="form-label fw-medium">Tiêu đề CV</label>
                <input type="text" class="form-control" name="title" required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-medium">URL file CV</label>
                <input type="url" class="form-control" name="fileUrl" required>
              </div>
            </form>
          </div>
          <div class="modal-footer border-top-0">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Hủy</button>
            <button type="button" class="btn btn-primary px-4" id="updateCVBtn">Cập nhật</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const updateBtn = modal.querySelector('#updateCVBtn');
    updateBtn.addEventListener('click', () => {
      const form = modal.querySelector('#editCVForm');
      const newTitle = form.title.value;
      const newUrl = form.fileUrl.value;
      if (!newTitle || !newUrl) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
      }
      updateCV(id, { title: newTitle, fileUrl: newUrl });
    });
  }
  const form = modal.querySelector('#editCVForm');
  form.title.value = title;
  form.fileUrl.value = url;
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

fetchCVs();