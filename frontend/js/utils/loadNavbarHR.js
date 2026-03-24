async function loadNavbar() {
  try {
    const res = await fetch("../../pages/utils/navbarHR.html");
    const data = await res.text();

    document.getElementById("navbar").innerHTML = data;

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
