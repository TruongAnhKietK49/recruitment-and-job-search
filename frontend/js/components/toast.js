function getToastContainer() {
  let container = document.getElementById("appToastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "appToastContainer";
    container.className = "toast-container position-fixed top-0 end-0 p-3";
    container.style.zIndex = "1080";
    document.body.appendChild(container);
  }

  return container;
}

function getToastClass(type = "success") {
  const classMap = {
    success: "text-bg-success",
    error: "text-bg-danger",
    danger: "text-bg-danger",
    warning: "text-bg-warning",
    info: "text-bg-info",
  };

  return classMap[type] || classMap.success;
}

function escapeHTML(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function removeToast(toastElement) {
  toastElement.addEventListener("hidden.bs.toast", () => toastElement.remove(), { once: true });
}

export function showToast(message, type = "success", options = {}) {
  const container = getToastContainer();
  const delay = options.delay || 3500;
  const toastElement = document.createElement("div");

  toastElement.className = `toast align-items-center border-0 shadow ${getToastClass(type)}`;
  toastElement.setAttribute("role", "status");
  toastElement.setAttribute("aria-live", "polite");
  toastElement.setAttribute("aria-atomic", "true");
  toastElement.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHTML(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Đóng"></button>
    </div>
  `;

  container.appendChild(toastElement);

  if (!window.bootstrap?.Toast) {
    setTimeout(() => toastElement.remove(), delay);
    return;
  }

  removeToast(toastElement);
  bootstrap.Toast.getOrCreateInstance(toastElement, { delay }).show();
}

export function showConfirmToast(message, options = {}) {
  const {
    title = "Xác nhận thao tác",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    type = "warning",
  } = options;

  if (!window.bootstrap?.Toast) {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise((resolve) => {
    const container = getToastContainer();
    const toastElement = document.createElement("div");
    let settled = false;

    toastElement.className = "toast border-0 shadow";
    toastElement.setAttribute("role", "alert");
    toastElement.setAttribute("aria-live", "assertive");
    toastElement.setAttribute("aria-atomic", "true");
    toastElement.innerHTML = `
      <div class="toast-header ${getToastClass(type)}">
        <strong class="me-auto">${escapeHTML(title)}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Đóng"></button>
      </div>
      <div class="toast-body bg-white text-dark">
        <div class="mb-3">${escapeHTML(message)}</div>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-sm btn-light border" data-toast-action="cancel">${escapeHTML(cancelText)}</button>
          <button type="button" class="btn btn-sm btn-danger" data-toast-action="confirm">${escapeHTML(confirmText)}</button>
        </div>
      </div>
    `;

    container.appendChild(toastElement);

    const toast = bootstrap.Toast.getOrCreateInstance(toastElement, { autohide: false });

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
      toast.hide();
    };

    toastElement.querySelector('[data-toast-action="confirm"]')?.addEventListener("click", () => finish(true));
    toastElement.querySelector('[data-toast-action="cancel"]')?.addEventListener("click", () => finish(false));
    toastElement.addEventListener(
      "hidden.bs.toast",
      () => {
        if (!settled) resolve(false);
        toastElement.remove();
      },
      { once: true },
    );

    toast.show();
  });
}

if (typeof window !== "undefined") {
  window.showToast = showToast;
  window.showConfirmToast = showConfirmToast;
}
