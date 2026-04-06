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

// Kiểm tra đăng nhập và role admin (Tạm thời comment để test giao diện)
if (!token) {
  window.location.href = "../../pages/utils/login.html";
} else if (user && user.role !== 'admin') {
  alert('Bạn không có quyền truy cập trang admin.');
  window.location.href = "../../pages/Admin Pages/index.html";
}

async function loadNavbar() {
  try {
    const res = await fetch("../../pages/utils/navbarAdmin.html");
    const data = await res.text();
    document.getElementById("navbar").innerHTML = data;
    
    if (user && user.fullName) {
      document.getElementById("adminName").innerText = user.fullName;
    }

    const currentPath = window.location.pathname.split("/").pop();
    
    document.querySelectorAll(".sidebar-nav .nav-link").forEach(link => {
      link.classList.remove("active");
      
      const href = link.getAttribute("href");
      if (href) {

        const linkPage = href.split("/").pop(); 
        
        if (linkPage === currentPath) {
          link.classList.add("active");
        }
      }
    });
    // --------------------------------------------------------

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "../../pages/utils/login.html";
      });
    }
  } catch (error) {
    console.error("Lỗi load navbar:", error);
  }
}

// Khởi chạy
loadNavbar();