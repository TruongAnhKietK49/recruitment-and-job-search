async function loadNavbar() {
  try {
    const res = await fetch("../../pages/utils/navbarCandidate.html");
    const data = await res.text();
    document.getElementById("navbar").innerHTML = data;

    updateNavbarAuth();
  } catch (error) {
    console.error("Lỗi load navbar:", error);
  }
}

function updateNavbarAuth() {
  let token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token === 'null' || token === 'undefined') token = null;

  let userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userStr === 'null' || userStr === 'undefined') userStr = null;

  const authContainer = document.querySelector('#navbarNav .d-flex.align-items-center.gap-2');

  if (token && userStr && authContainer) {
    const user = JSON.parse(userStr);
    const shortName = user.fullName ? user.fullName.split(' ').pop() : "User";

    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(shortName)}&background=2f80ed&color=fff`;

    authContainer.innerHTML = `
      <div class="dropdown">
        <a class="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="text-decoration: none;">
          <img src="${avatarUrl}" alt="Avatar" class="rounded-circle border border-2 border-white shadow-sm bg-white" style="width: 38px; height: 38px; object-fit: cover;">
          <span class="fw-bold text-white">${shortName}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end shadow" style="border-radius: 10px; border: none; margin-top: 12px;">
          <li><a class="dropdown-item py-2" href="../../pages/Candidate Pages/profile.html"><i class="bi bi-person-lines-fill me-2 text-muted"></i>Hồ sơ cá nhân</a></li>
          <li><a class="dropdown-item py-2" href="../../pages/Candidate Pages/my-cvs.html"><i class="bi bi-file-earmark-text me-2 text-muted"></i>Quản lý CV</a></li>
          <li><a class="dropdown-item py-2" href="../../pages/Candidate Pages/saved-jobs.html"><i class="bi bi-bookmark-heart me-2 text-muted"></i>Việc làm đã lưu</a></li>
          <li><a class="dropdown-item py-2" href="../../pages/Candidate Pages/applications.html"><i class="bi bi-send-check me-2 text-muted"></i>Việc làm đã ứng tuyển</a></li>
          <li><a class="dropdown-item py-2" href="../../pages/Candidate Pages/viewed-jobs.html"><i class="bi bi-clock-history me-2 text-muted"></i>Việc làm đã xem</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item py-2 text-danger" href="../../pages/utils/login.html" id="btnLogout"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</a></li>
        </ul>
      </div>
    `;

    //đăng xuất
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../../pages/utils/login.html'; 
      });
    }
  }
}

loadNavbar();