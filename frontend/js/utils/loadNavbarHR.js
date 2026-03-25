let user = sessionStorage.getItem("user")
  ? JSON.parse(sessionStorage.getItem("user"))
  : localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
const token = sessionStorage.getItem("token")
  ? sessionStorage.getItem("token")
  : localStorage.getItem("token")
    ? localStorage.getItem("token")
    : null;
if (!token) {
  window.location.href = "../../pages/utils/login.html";
}

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
