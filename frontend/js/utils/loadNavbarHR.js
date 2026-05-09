import URL from "../utils/url.js";
import { initAiChatbox } from "./AIChatBox.js";

const user = sessionStorage.getItem("user")
  ? JSON.parse(sessionStorage.getItem("user"))
  : localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

const token = sessionStorage.getItem("token") || localStorage.getItem("token") || null;

if (!token) {
  window.location.href = "../../pages/utils/login.html";
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

    const data = await res.json();
    return data;
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
    renderSidebarUser();

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        logOut();
      });
    }

    const notificationBtn = document.getElementById("notificationBtn");
    const notificationDropdown = document.getElementById("notificationDropdown");
    const notificationList = document.getElementById("notificationList");
    const markAllReadBtn = document.getElementById("markAllReadBtn");

    if (notificationBtn && notificationDropdown) {
      notificationBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle("active");

        if (notificationDropdown.classList.contains("active")) {
          await loadNotifications();
        }
      });

      document.addEventListener("click", (e) => {
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
          notificationDropdown.classList.remove("active");
        }
      });
    }

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await markAllNotificationsAsRead();
      });
    }

    if (notificationList) {
      notificationList.addEventListener("click", async (e) => {
        const item = e.target.closest(".notification-item");
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

    setActiveSidebar();
    await loadNotifications();
    initAiChatbox();
  } catch (error) {
    console.error("Lỗi load navbar:", error);
  }
}

loadNavbar();

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

  const hrProfilePromise = await getHRProfile();

  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserRole = document.getElementById("sidebarUserRole");
  const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");

  const fullName = user.fullName || user.name || "HR User";
  const roleLabel = getRoleLabel(user.role);
  const avatarUrl = hrProfilePromise.profileData.avatar || "";

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
    if (!res.ok) throw new Error(data.message || "Không thể tải công ty");

    return data;
  } catch (err) {
    console.log(err);
    return null;
  }
}

function disableManagePostsMenu(message = "Bạn cần tạo hoặc tham gia công ty trước") {
  const menuManagePosts = document.getElementById("menu-manage-posts");
  if (!menuManagePosts) return;

  menuManagePosts.classList.add("disabled-menu");
  menuManagePosts.setAttribute("aria-disabled", "true");
  menuManagePosts.setAttribute("title", message);

  menuManagePosts.onclick = function (e) {
    e.preventDefault();
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
