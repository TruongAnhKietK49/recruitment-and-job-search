const getStoredUser = () => {
  const sessionUser = sessionStorage.getItem("user");
  const localUser = localStorage.getItem("user");

  if (sessionUser) return JSON.parse(sessionUser);
  if (localUser) return JSON.parse(localUser);

  return null;
};

const getStoredToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

const user = getStoredUser();
const token = getStoredToken();

if (!token) {
  window.location.href = "../utils/login.html";
} else if (user && user.role !== "admin") {
  alert("Bạn không có quyền truy cập trang admin.");
  window.location.href = "../Candidate Pages/index.html";
}

function setActiveSidebarLink() {
  const currentPage = window.location.pathname.split("/").pop();

  document.querySelectorAll(".sidebar .menu-link").forEach((link) => {
    const href = link.getAttribute("href");
    const linkPage = href?.split("/").pop();

    link.classList.toggle("active", linkPage === currentPage);
  });
}

function bindLogoutEvent() {
  const logoutBtn = document.getElementById("logoutBtn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", (event) => {
    event.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    window.location.href = "../utils/login.html";
  });
}

async function loadNavbar() {
  try {
    const res = await fetch("../utils/navbarAdmin.html");
    const html = await res.text();

    document.getElementById("navbar").innerHTML = html;

    const adminName = document.getElementById("adminName");
    if (adminName && user?.fullName) {
      adminName.innerText = user.fullName;
    }

    setActiveSidebarLink();
    bindLogoutEvent();
  } catch (error) {
    console.error("Lỗi load navbar:", error);
  }
}

loadNavbar();
