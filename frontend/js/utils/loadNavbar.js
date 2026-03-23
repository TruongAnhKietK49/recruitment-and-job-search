async function loadNavbar() {
  try {
    const res = await fetch("../../pages/utils/navbarCandidate.html");
    const data = await res.text();
    document.getElementById("navbar").innerHTML = data;
  } catch (error) {
    console.error("Lỗi load navbar:", error);
  }
}
loadNavbar();
