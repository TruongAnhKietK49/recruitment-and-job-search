import URL from "../utils/url.js";
const user = sessionStorage.getItem("user")
  ? JSON.parse(sessionStorage.getItem("user"))
  : localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
const token = sessionStorage.getItem("token") || localStorage.getItem("token") || null;
if (!token) {
  window.location.href = "../../pages/utils/login.html";
}

async function loadNavbar() {
  try {
    const res = await fetch("../../pages/utils/navbarHR.html");
    const data = await res.text();

    document.getElementById("navbar").innerHTML = data;
    document.getElementById("userName").innerHTML = user.fullName;

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        logOut();
      });
    }

    setTimeout(() => {
      setActiveSidebar();
    }, 0);
  } catch (error) {
    console.error("Lỗi load navbar:", error);
  }
}
loadNavbar();

function setActiveSidebar() {
  const currentPath = window.location.pathname.split("/").pop();

  document.querySelectorAll(".menu-link").forEach((link) => {
    const href = link.getAttribute("href");

    link.classList.remove("active");

    if (!href || href === "#") return;

    const linkPath = href.split("/").pop();

    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });
}

function logOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  window.location.href = "../../pages/utils/login.html";
}

async function loadMyCompany() {
  try {
    const res = await fetch(`${URL}/api/companies/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 404) return null;

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể tải công ty");

    return data;
  } catch (err) {
    console.log(err);
    return null;
  }
}

function disableManagePostsMenu(message = "Bạn cần tạo hoặc tham gia công ty trước") {
  const menuManagePosts = document.getElementById("menu-manage-posts");
  if (!menuManagePosts) return;

  menuManagePosts.classList.add("disabled-menu");
  menuManagePosts.setAttribute("aria-disabled", "true");
  menuManagePosts.setAttribute("title", message);

  menuManagePosts.onclick = function (e) {
    e.preventDefault();
    alert("Bạn chưa có công ty nên không thể truy cập mục Quản lý bài đăng.");
  };
}

function enableManagePostsMenu() {
  const menuManagePosts = document.getElementById("menu-manage-posts");
  if (!menuManagePosts) return;

  menuManagePosts.classList.remove("disabled-menu");
  menuManagePosts.removeAttribute("aria-disabled");
  menuManagePosts.removeAttribute("title");
  menuManagePosts.onclick = null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const cachedHasCompany = localStorage.getItem("hasCompany");

  if (cachedHasCompany === "true") {
    enableManagePostsMenu();
  } else if (cachedHasCompany === "false") {
    disableManagePostsMenu();
  } else {
    disableManagePostsMenu();
  }
  const company = await loadMyCompany();

  if (company) {
    localStorage.setItem("hasCompany", "true");
    enableManagePostsMenu();
  } else {
    localStorage.setItem("hasCompany", "false");
    disableManagePostsMenu();
  }
});
