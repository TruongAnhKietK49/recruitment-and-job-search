import URL from "../utils/url.js";
import { initAiChatbox } from "./AIChatBox.js";

function getStoredUser() {
  const sessionUser = sessionStorage.getItem("user");
  const localUser = localStorage.getItem("user");

  const userStr = sessionUser || localUser;

  if (!userStr || userStr === "null" || userStr === "undefined") {
    return null;
  }

  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Lỗi parse HR user:", error);
    return null;
  }
}

function getStoredToken() {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  if (!token || token === "null" || token === "undefined") {
    return null;
  }

  return token;
}

const user = getStoredUser();
const token = getStoredToken();

if (!token) {
  window.location.href = "../../pages/utils/login.html";
}

function normalizePagePath(path = "") {
  return decodeURIComponent(path).toLowerCase().split("?")[0].split("#")[0].split("/").filter(Boolean).pop()?.replace(".html", "").trim() || "";
}

function setActiveSidebar() {
  const currentPage = normalizePagePath(window.location.pathname);

  document.querySelectorAll(".menu-link").forEach((link) => {
    const href = link.getAttribute("href");
    const linkPage = normalizePagePath(href);

    link.classList.toggle("active", Boolean(linkPage) && linkPage === currentPage);
  });
}

async function getHRProfile() {
  try {
    const res = await fetch(`${URL}/api/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Không thể tải thông tin HR");
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi khi tải thông tin HR:", error);
    throw error;
  }
}

async function loadNavbar() {
  try {
    const res = await fetch("../../pages/utils/navbarHR.html");
    const data = await res.text();

    document.getElementById("navbar").innerHTML = data;

    const userName = document.getElementById("userName");
    if (userName && user) {
      userName.innerHTML = user.fullName;
    }

    await renderSidebarUser();
    bindLogoutEvent();
    bindNotificationEvents();

    setActiveSidebar();
    await loadNotifications();
    initAiChatbox();
  } catch (error) {
    console.error("Lỗi load navbar:", error);
  }
}

function bindLogoutEvent() {
  const logoutBtn = document.getElementById("logoutBtn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", function (event) {
    event.preventDefault();
    logOut();
  });
}

function bindNotificationEvents() {
  const notificationBtn = document.getElementById("notificationBtn");
  const notificationDropdown = document.getElementById("notificationDropdown");
  const notificationList = document.getElementById("notificationList");
  const markAllReadBtn = document.getElementById("markAllReadBtn");

  if (notificationBtn && notificationDropdown) {
    notificationBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      notificationDropdown.classList.toggle("active");

      if (notificationDropdown.classList.contains("active")) {
        await loadNotifications();
      }
    });

    document.addEventListener("click", (event) => {
      if (!notificationBtn.contains(event.target) && !notificationDropdown.contains(event.target)) {
        notificationDropdown.classList.remove("active");
      }
    });
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await markAllNotificationsAsRead();
    });
  }

  if (notificationList) {
    notificationList.addEventListener("click", async (event) => {
      const item = event.target.closest(".notification-item");
      if (!item) return;

      const notificationId = item.dataset.id;
      const link = item.dataset.link;

      const success = await markNotificationAsRead(notificationId);

      if (success) {
        item.classList.remove("unread");

        const currentBadge = document.getElementById("notificationCount");
        if (currentBadge && currentBadge.style.display !== "none") {
          let currentCount = parseInt(currentBadge.textContent, 10) || 0;
          currentCount = Math.max(0, currentCount - 1);
          updateNotificationBadge(currentCount);
        }

        if (link) {
          window.location.href = link;
        }
      }
    });
  }
}

async function loadNotifications() {
  try {
    const res = await fetch(`${URL}/api/notifications/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Không thể tải thông báo");
    }

    renderNotifications(data.notifications || []);
    updateNotificationBadge(data.unreadCount || 0);
  } catch (error) {
    console.error("Lỗi load notifications:", error);

    const notificationList = document.getElementById("notificationList");
    if (notificationList) {
      notificationList.innerHTML = `
        <li class="notification-empty">Không thể tải thông báo</li>
      `;
    }
  }
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function getUserAvatarUrl(user = {}) {
  const avatar = user.avatarUrl || user.avatar || user.profileImage || user.image || user.photoUrl || "";

  if (!avatar) return "";

  if (avatar.startsWith("http")) {
    return avatar;
  }

  return `${URL}/${avatar}`;
}

function getRoleLabel(role = "") {
  const normalizedRole = String(role).trim().toLowerCase();

  const roleMap = {
    hr: "HR",
    recruiter: "Recruiter",
    admin: "Admin",
    owner: "Owner",
    member: "Thành viên",
    candidate: "Ứng viên",
    user: "Người dùng",
  };

  return roleMap[normalizedRole] || "HR / Recruiter";
}

async function renderSidebarUser() {
  if (!user) return;

  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserRole = document.getElementById("sidebarUserRole");
  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");

  const fullName = user.fullName || user.name || "HR User";
  const roleLabel = getRoleLabel(user.role);

  let avatarUrl = getUserAvatarUrl(user);

  try {
    const hrProfile = await getHRProfile();
    avatarUrl = hrProfile?.profileData?.avatar || avatarUrl;
  } catch (error) {
    console.warn("Không thể lấy avatar mới nhất, dùng avatar từ storage nếu có.");
  }

  if (sidebarUserName) {
    sidebarUserName.textContent = fullName;
  }

  if (sidebarUserRole) {
    sidebarUserRole.textContent = roleLabel;
  }

  if (sidebarUserAvatar) {
    sidebarUserAvatar.innerHTML = avatarUrl ? `<img src="${avatarUrl}" alt="${fullName}" />` : `<span>${getInitials(fullName) || "HR"}</span>`;
  }
}

async function markNotificationAsRead(notificationId) {
  try {
    const res = await fetch(`${URL}/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Không thể cập nhật thông báo");
    }

    return true;
  } catch (error) {
    console.error("Lỗi mark notification:", error);
    return false;
  }
}

async function markAllNotificationsAsRead() {
  try {
    const res = await fetch(`${URL}/api/notifications/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Không thể đánh dấu tất cả thông báo đã đọc");
    }

    await loadNotifications();
    return true;
  } catch (error) {
    console.error("Lỗi mark all notifications:", error);
    return false;
  }
}

function formatNotificationTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
}

function renderNotifications(notifications = []) {
  const notificationList = document.getElementById("notificationList");
  if (!notificationList) return;

  if (!notifications.length) {
    notificationList.innerHTML = `
      <li class="notification-empty">Chưa có thông báo nào</li>
    `;
    return;
  }

  notificationList.innerHTML = notifications
    .map(
      (item) => `
        <li 
          class="notification-item ${item.isRead ? "" : "unread"}"
          data-id="${item._id}"
          data-link="${item.link || ""}"
        >
          <div class="notification-item-title">${item.type}</div>
          <div class="notification-item-message">${item.content}</div>
          <div class="notification-item-time">${formatNotificationTime(item.createdAt)}</div>
        </li>
      `,
    )
    .join("");
}

function updateNotificationBadge(unreadCount = 0) {
  const badge = document.getElementById("notificationCount");
  if (!badge) return;

  if (unreadCount > 0) {
    badge.style.display = "flex";
    badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
  } else {
    badge.style.display = "none";
  }
}

function logOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  localStorage.removeItem("hasCompany");

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

    if (!res.ok) {
      throw new Error(data.message || "Không thể tải công ty");
    }

    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

function disableManagePostsMenu(message = "Bạn cần tạo hoặc tham gia công ty trước") {
  const menuManagePosts = document.getElementById("menu-manage-posts");
  if (!menuManagePosts) return;

  menuManagePosts.classList.add("disabled-menu");
  menuManagePosts.setAttribute("aria-disabled", "true");
  menuManagePosts.setAttribute("title", message);

  menuManagePosts.onclick = function (event) {
    event.preventDefault();
    alert("Bạn chưa có công ty nên không thể truy cập mục Quản lý bài đăng.");
  };
}

function enableManagePostsMenu() {
  const menuManagePosts = document.getElementById("menu-manage-posts");
  if (!menuManagePosts) return;

  menuManagePosts.classList.remove("disabled-menu");
  menuManagePosts.removeAttribute("aria-disabled");
  menuManagePosts.removeAttribute("title");
  menuManagePosts.onclick = null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const cachedHasCompany = localStorage.getItem("hasCompany");

  if (cachedHasCompany === "true") {
    enableManagePostsMenu();
  } else {
    disableManagePostsMenu();
  }

  const company = await loadMyCompany();

  if (company) {
    localStorage.setItem("hasCompany", "true");
    enableManagePostsMenu();
  } else {
    localStorage.setItem("hasCompany", "false");
    disableManagePostsMenu();
  }
});

loadNavbar();
