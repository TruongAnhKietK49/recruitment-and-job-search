import URL from "../utils/url.js";

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

async function loadInfo() {
  try {
    const res = await fetch(`${URL}/api/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
}

async function updateInfo(data) {
  try {
    const res = await fetch(`${URL}/api/users/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message);
    }
    alert("Câp nhat thông tin thành công!");
    return result;
  } catch (err) {
    console.log(err);
  }
}

async function handleUpdate() {
  const data = {
    fullName: document.querySelector(".edit-fullName").value.trim(),
    email: document.querySelector(".edit-email").value.trim(),
    phone: document.querySelector(".edit-phone").value.trim(),
    birthday: document.querySelector(".edit-birthday").value.trim(),
    gender: document.querySelector(".edit-gender").value.trim(),
    address: document.querySelector(".edit-address").value.trim(),
    header: document.querySelector(".edit-header").value.trim(),
    position: document.querySelector(".edit-position").value.trim(),
    avatar: tempAvatarUrl,
  };

  await updateInfo(data);
  fillInfo();
}

const changePhotoBtn = document.querySelector(".change-photo-btn");
const avatarInputBox = document.querySelector(".avatar-input-box");
const avatarInput = document.getElementById("avatarInput");
const previewBtn = document.getElementById("previewBtn");

const profileAvatar = document.querySelector(".profile-avatar");
let tempAvatarUrl = "";

changePhotoBtn.addEventListener("click", () => {
  if (avatarInputBox.style.display === "block") {
    avatarInputBox.style.display = "none";
  } else {
    avatarInputBox.style.display = "block";
    avatarInput.focus();
  }
});
previewBtn.addEventListener("click", () => {
  const url = avatarInput.value.trim();
  if (!url) return alert("Vui lòng nhập URL");

  tempAvatarUrl = url;

  profileAvatar.innerHTML = `
    <img src="${url}" alt="avatar"
    style="width:100%;height:100%;object-fit:cover;" />
  `;
});

async function fillInfo() {
  const data = await loadInfo();
  let status = data.profileData.verifiedStatus;
  if (status == "pending") {
    status = "Chưa xác thực";
    document.querySelector(".profile-verified").classList.add("badge-pending");
  } else if (status == "verified") {
    status = "Đã xác thực";
    document.querySelector(".profile-verified").classList.add("badge-verified");
  } else status = "Chưa xác thực";
  document.querySelector(".profile-verified").textContent = status;

  const avatarImg = document.getElementById("avatarImg");
  avatarImg.src = data.profileData.avatar;
  document.querySelector(".profile-name").textContent = data.user.fullName;
  document.querySelector(".profile-position").textContent = data.profileData?.position || "";
  document.querySelector(".profile-email").textContent = data.user.email;
  document.querySelector(".profile-phone").textContent = data.user.phone;
  document.querySelector(".profile-role").textContent = data.user.role ? "HR" : "defined";

  document.querySelector(".edit-fullName").value = data.user.fullName;
  document.querySelector(".edit-position").value = data.profileData?.position || "";
  document.querySelector(".edit-email").value = data.user.email;
  document.querySelector(".edit-phone").value = data.user.phone;
  document.querySelector(".edit-birthday").value = data.user.birthday.split("T")[0];
  document.querySelector(".edit-gender").value = data.user.gender;
  document.querySelector(".edit-address").value = data.profileData?.address || "";
  document.querySelector(".edit-header").value = data.profileData?.header || "";
}
document.getElementById("updateBtn").addEventListener("click", handleUpdate);
document.getElementById("recoverBtn").addEventListener("click", fillInfo);

document.addEventListener("DOMContentLoaded", () => {
  fillInfo();
});
