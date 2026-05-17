export function showPageLoading() {
  document.body.classList.add("page-loading");

  const pageLoader = document.getElementById("pageLoader");
  if (pageLoader) {
    pageLoader.classList.remove("is-hidden");
  }
}

export function hidePageLoading() {
  document.body.classList.remove("page-loading");

  const pageLoader = document.getElementById("pageLoader");
  if (pageLoader) {
    pageLoader.classList.add("is-hidden");
  }
}
