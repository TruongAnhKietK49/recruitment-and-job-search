export function showToast(message, type = "success") {
  const toastElement = document.getElementById("liveToast");
  const toastMessage = document.getElementById("toastMessage");

  if (!toastElement || !toastMessage) {
    console.error("Không tìm thấy phần tử toast trong HTML");
    return;
  }

  toastMessage.textContent = message;

  toastElement.classList.remove("text-bg-success", "text-bg-danger", "bg-success", "bg-danger");

  if (type === "success") {
    toastElement.classList.add("text-bg-success");
  } else if (type === "error") {
    toastElement.classList.add("text-bg-danger");
  } else {
    toastElement.classList.add("text-bg-success");
  }

  const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
  toast.show();
}