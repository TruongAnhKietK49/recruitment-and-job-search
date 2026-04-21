// js/utils/applyModal.js
import BASE_URL from './url.js';
const API_URL = `${BASE_URL}/api`;

export function injectApplyModal() {
    const modalHtml = `
    <div class="modal fade" id="applyModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content shadow-lg" style="border-radius: 20px; border: none;">
          <div class="modal-header border-0 pb-0 px-4 pt-4">
            <h4 class="modal-title text-primary fw-bold">Nộp đơn ứng tuyển</h4>
            <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body px-4 pb-4">
            <div class="mb-4 mt-2">
              <h4 class="fw-bold mb-1 text-dark" id="applyUserName">Người dùng</h4>
              <p class="text-muted mb-0 fs-6" id="applyUserEmail">email@gmail.com</p>
            </div>
            <div class="mb-4">
              <label class="form-label text-danger fw-bold fs-6">Hồ sơ ứng tuyển *</label>
              <div class="card border bg-light" style="border-radius: 12px;">
                <div class="card-body p-3 d-flex align-items-center">
                  <select id="existingCvSelect" class="form-select border-0 shadow-sm bg-white py-2" style="border-radius: 8px;">
                    <option value="">Chọn từ danh sách CV của bạn</option>
                  </select>
                </div>
              </div>
              <div class="mt-2 text-end">
                <a href="my-cvs.html" class="text-decoration-none small text-primary"><i class="bi bi-plus-circle me-1"></i>Bạn chưa có CV? Tạo ngay!</a>
              </div>
            </div>
            <div class="mb-4">
              <label class="form-label text-primary fw-bold fs-6">Thư giới thiệu (nếu có)</label>
              <textarea id="coverLetter" class="form-control bg-light border p-3 shadow-none" rows="4" style="border-radius: 12px;" placeholder="Viết giới thiệu về bản thân..."></textarea>
            </div>
            <div class="d-flex justify-content-center gap-3 mt-5">
              <button type="button" class="btn btn-outline-secondary px-5 py-2 rounded-pill fw-medium bg-white" data-bs-dismiss="modal">Hủy</button>
              <button type="button" class="btn btn-primary px-5 py-2 rounded-pill fw-medium shadow" id="submitApplicationBtn">
                <i class="bi bi-send me-2"></i> Nộp hồ sơ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="successApplyModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content text-center shadow-lg" style="border-radius: 20px; border: none; padding: 40px 20px;">
          <div class="modal-body">
            <div class="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow mb-4" style="width: 90px; height: 90px;">
              <i class="bi bi-check-lg" style="font-size: 3.5rem;"></i>
            </div>
            <h2 class="fw-bold text-success mb-3">Đã nộp!</h2>
            <p class="text-muted mb-4 fs-6">Hồ sơ của bạn đã được gửi đi.</p>
            <button type="button" class="btn btn-danger px-5 py-2 rounded-pill fw-bold shadow-sm" data-bs-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Logic mở Modal và xử lý nộp đơn
 */
let currentJobId = null;

export async function setupApplyModal(jobId, token) {
    if (!token) {
        alert("Vui lòng đăng nhập để ứng tuyển!");
        window.location.href = '../../pages/utils/login.html';
        return;
    }

    currentJobId = jobId;

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
    } catch (err) { console.error("Lỗi load CV:", err); }

    const applyModal = new bootstrap.Modal(document.getElementById('applyModal'));
    applyModal.show();

    const submitBtn = document.getElementById('submitApplicationBtn');
    submitBtn.onclick = async () => {
        const selectedCvId = document.getElementById('existingCvSelect').value;
        const coverLetter = document.getElementById('coverLetter').value;

        if (!selectedCvId) {
            alert("Vui lòng chọn một bản CV!");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Đang nộp...';

        try {
            const res = await fetch(`${API_URL}/applications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ jobId: currentJobId, resumeId: selectedCvId, coverLetter })
            });

            if (res.ok) {
                applyModal.hide();
                new bootstrap.Modal(document.getElementById('successApplyModal')).show();
                window.dispatchEvent(new CustomEvent('applySuccess', { detail: { jobId: currentJobId } }));
            } else {
                const data = await res.json();
                alert(data.message || "Lỗi ứng tuyển");
            }
        } catch (err) { alert("Lỗi kết nối"); }
        finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-send me-2"></i> Nộp hồ sơ';
        }
    };
}
document.addEventListener('hide.bs.modal', function (event) {
    if (document.activeElement) {
        document.activeElement.blur(); 
    }
});