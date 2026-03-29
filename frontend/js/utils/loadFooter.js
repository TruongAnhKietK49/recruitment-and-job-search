async function loadFooter() {
  try {
    const res = await fetch("../../pages/utils/footerCandidate.html");
    const data = await res.text();
    document.getElementById("footer").innerHTML = data;
  } catch (error) {
    console.error("Lỗi load footer:", error);
  }
}
loadFooter();