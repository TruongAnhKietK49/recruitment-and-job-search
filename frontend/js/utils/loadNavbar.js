function getStoredValue(key) {
  const sessionValue = sessionStorage.getItem(key);
  const localValue = localStorage.getItem(key);

  const value = sessionValue || localValue;

  if (!value || value === "null" || value === "undefined") {
    return null;
  }

  return value;
}

function getStoredUser() {
  const userStr = getStoredValue("user");

  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Lỗi parse user:", error);
    return null;
  }
}

function getStoredToken() {
  return getStoredValue("token");
}

function normalizePagePath(path = "") {
  return decodeURIComponent(path).toLowerCase().split("?")[0].split("#")[0].split("/").filter(Boolean).pop()?.replace(".html", "").trim() || "";
}

function getCandidateNavGroup(page = "") {
  const groups = {
    index: ["index", "job-detail", "search"],
    companies: ["companies", "company-detail"],
    "my-cvs": ["my-cvs"],
    blog: ["blog", "blog-detail"],
  };

  return Object.entries(groups).find(([, pages]) => pages.includes(page))?.[0] || page;
}

function setActiveCandidateNav() {
  const pathname = decodeURIComponent(window.location.pathname).toLowerCase();

  let currentPage = normalizePagePath(window.location.pathname);

  if (pathname.endsWith("/candidate pages/") || pathname.endsWith("/candidate pages") || currentPage === "candidate pages") {
    currentPage = "index";
  }

  const currentGroup = getCandidateNavGroup(currentPage);

  document.querySelectorAll(".job-navbar .nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    const linkPage = normalizePagePath(href);
    const linkGroup = getCandidateNavGroup(linkPage);

    link.classList.toggle("active", Boolean(linkGroup) && linkGroup === currentGroup);
  });
}

async function loadNavbar() {
  try {
    const res = await fetch("../../pages/utils/navbarCandidate.html");
    const data = await res.text();

    document.getElementById("navbar").innerHTML = data;

    setActiveCandidateNav();
    updateNavbarAuth();
  } catch (error) {
    console.error("Lỗi load navbar:", error);
  }
}

function updateNavbarAuth() {
  const token = getStoredToken();
  const user = getStoredUser();

  const authContainer = document.querySelector("#navbarNav .d-flex.align-items-center.gap-2");

  if (token && user && authContainer) {
    const shortName = user.fullName ? user.fullName.split(" ").pop() : "User";

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

    const btnLogout = document.getElementById("btnLogout");

    if (btnLogout) {
      btnLogout.addEventListener("click", (event) => {
        event.preventDefault();

        localStorage.clear();
        sessionStorage.clear();

        window.location.href = "../../pages/utils/login.html";
      });
    }
  }
}

loadNavbar();
