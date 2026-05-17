const getStoredUser = () => {
  const sessionUser = sessionStorage.getItem("user");
  const localUser = localStorage.getItem("user");

  const userStr = sessionUser || localUser;

  if (!userStr || userStr === "null" || userStr === "undefined") {
    return null;
  }

  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Lỗi parse admin user:", error);
    return null;
  }
};

const getStoredToken = () => {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  if (!token || token === "null" || token === "undefined") {
    return null;
  }

  return token;
};

const user = getStoredUser();
const token = getStoredToken();

if (!token) {
  window.location.href = "../utils/login.html";
} else if (user && user.role !== "admin") {
  alert("Bạn không có quyền truy cập trang admin.");
  window.location.href = "../Candidate Pages/index.html";
}

function normalizePagePath(path = "") {
  return decodeURIComponent(path).toLowerCase().split("?")[0].split("#")[0].split("/").filter(Boolean).pop()?.replace(".html", "").trim() || "";
}

function setActiveSidebar() {
  const currentPage = normalizePagePath(window.location.pathname);

  document.querySelectorAll(".sidebar .menu-link").forEach((link) => {
    const href = link.getAttribute("href");
    const linkPage = normalizePagePath(href);

    link.classList.toggle("active", Boolean(linkPage) && linkPage === currentPage);
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

    setActiveSidebar();
    bindLogoutEvent();
  } catch (error) {
    console.error("Lỗi load navbar:", error);
  }
}

loadNavbar();
