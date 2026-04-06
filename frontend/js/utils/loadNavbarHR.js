const user = sessionStorage.getItem("user")
  ? JSON.parse(sessionStorage.getItem("user"))
  : localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
const token = sessionStorage.getItem("token") || localStorage.getItem("token") || null;
if (!token) {
  window.location.href = "../../pages/utils/login.html";
}

console.log(user);
async function loadNavbar() {
  try {


    const res = await fetch("../../pages/utils/navbarHR.html");
    const data = await res.text();

    document.getElementById("navbar").innerHTML = data;
    document.getElementById("userName").innerHTML = user.fullName;
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

async function guardManagePostsMenuOnLogin() {
  const menuManagePosts = document.getElementById("menu-manage-posts");
  if (!menuManagePosts) return;

  const company = await loadMyCompany();

  if (company?._id) return;

  menuManagePosts.classList.add("disabled-menu");
  menuManagePosts.setAttribute("aria-disabled", "true");
  menuManagePosts.setAttribute("title", "Bạn cần tạo hoặc tham gia công ty trước");

  menuManagePosts.addEventListener("click", function (e) {
    e.preventDefault();
    alert("Bạn chưa có công ty nên không thể truy cập mục Quản lý bài đăng.");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  guardManagePostsMenuOnLogin();
});
