import URL from "../utils/url.js";

let dataCompanies = [];
let myCompanyData = null;

const token = sessionStorage.getItem("token")
  ? sessionStorage.getItem("token")
  : localStorage.getItem("token")
    ? localStorage.getItem("token")
    : null;

const user = sessionStorage.getItem("user")
  ? JSON.parse(sessionStorage.getItem("user"))
  : localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

async function loadCompanies() {
  try {
    const res = await fetch(`${URL}/api/companies/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể tải danh sách công ty");

    return Array.isArray(data.companies) ? data.companies : [];
  } catch (err) {
    console.log(err);
    return [];
  }
}

async function getMyCompany() {
  try {
    const res = await fetch(`${URL}/api/companies/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return null;
    }

    return data;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function createCompany(data) {
  try {
    const res = await fetch(`${URL}/api/companies/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Tạo công ty thất bại");
    }
    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function updateMyCompany(companyId, data) {
  try {
    const res = await fetch(`${URL}/api/companies/${companyId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Cập nhật công ty thất bại");
    }

    return result;
  } catch (err) {
    console.log(err);
    alert(err.message || "Không thể cập nhật công ty");
    return null;
  }
}

async function deleteCompany(params) {
  try {
    const res = await fetch(`${URL}/api/companies/${params}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.log(err);
  }
}

// Nếu sau này bạn có API join request thì thay hàm này bằng endpoint thật
async function sendJoinRequest(companyId, requestedRole = "member") {
  try {
    const res = await fetch(`${URL}/api/companies/${companyId}/join-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestedRole }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Gửi yêu cầu tham gia thất bại");
    }

    return result;
  } catch (err) {
    console.log(err);
    alert(err.message || "Không thể gửi yêu cầu tham gia công ty");
    return null;
  }
}

async function getMyCompanyJoinRequests() {
  try {
    const res = await fetch(`${URL}/api/companies/my/join-requests`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể tải danh sách yêu cầu gia nhập");
    }

    return result;
  } catch (err) {
    console.log(err);
    return [];
  }
}

async function approveJoinRequest(requestId) {
  try {
    const res = await fetch(`${URL}/api/join-requests/${requestId}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Duyệt yêu cầu thất bại");
    }

    return result;
  } catch (err) {
    console.log(err);
    alert(err.message || "Không thể duyệt yêu cầu");
    return null;
  }
}

async function rejectJoinRequest(requestId) {
  try {
    const res = await fetch(`${URL}/api/join-requests/${requestId}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Từ chối yêu cầu thất bại");
    }

    return result;
  } catch (err) {
    console.log(err);
    alert(err.message || "Không thể từ chối yêu cầu");
    return null;
  }
}

function getMyMemberInfo(company) {
  if (!company || !Array.isArray(company.members) || !user) return null;

  return (
    company.members.find((m) => {
      const memberUserId = typeof m.user === "object" ? m.user?._id : m.user;
      return memberUserId === user.id;
    }) || null
  );
}

function isOwner(company) {
  const myMember = getMyMemberInfo(company);
  return myMember?.role === "owner";
}

function isAdminOrOwner(company) {
  const myMember = getMyMemberInfo(company);
  return ["owner", "admin"].includes(myMember?.role);
}

function getRequestedRoleText(role) {
  const map = {
    member: "Thành viên",
    admin: "HR / Admin",
  };
  return map[role] || role;
}

function getJoinRequestStatusText(status) {
  const map = {
    pending: "Đang chờ",
    approved: "Đã duyệt",
    rejected: "Đã từ chối",
  };
  return map[status] || status;
}

function formatDate(dateString) {
  if (!dateString) return "";
  return dateString.split("T")[0];
}

function getRoleText(role) {
  if (!role) return "Chưa xác định";

  const roleMap = {
    hr: "HR",
    recruiter: "Recruiter",
    founder: "Founder",
    admin: "Quản trị viên",
  };

  return roleMap[role.toLowerCase()] || role;
}

function getStatusText(status) {
  return status === "active" ? "Đang hoạt động" : "Không hoạt động";
}

function getLogoText(companyName = "") {
  return companyName
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

async function renderCompanies() {
  try {
    const companyList = document.querySelector("#join-company-pane .company-list");
    if (!companyList) return;

    companyList.innerHTML = "";

    dataCompanies = await loadCompanies();

    if (!Array.isArray(dataCompanies) || dataCompanies.length === 0) {
      companyList.innerHTML = `
        <div class="empty-state mt-4">
          <div class="empty-icon">
            <i class="bi bi-buildings"></i>
          </div>
          <div class="empty-title">Chưa có công ty nào</div>
          <div class="empty-text">Hiện tại chưa có dữ liệu công ty để tham gia.</div>
        </div>
      `;
      return;
    }

    dataCompanies.forEach((company) => {
      const companyCard = document.createElement("div");
      companyCard.className = "join-card";

      const memberCount = Array.isArray(company.members) ? company.members.length : 0;
      const companyIdText = company.companyCode || company._id?.slice(-6).toUpperCase() || "N/A";
      const addressShort = company.address || "Chưa cập nhật";
      const category = company.category || "Chưa cập nhật";
      const logoText = company.logoUrl
        ? `<img src="${company.logoUrl}" alt="${company.companyName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
        : getLogoText(company.companyName);

      companyCard.innerHTML = `
        <div class="join-header">
          <div class="join-logo">${logoText}</div>
          <div>
            <div class="join-name">${company.companyName || ""}</div>
            <div class="join-sub">Mã công ty: ${companyIdText}</div>
          </div>
        </div>
        <div class="join-desc">
          ${company.description || "Chưa có mô tả công ty."}
        </div>
        <div class="tag-list">
          <span class="tag-item">
            <i class="bi bi-geo-alt"></i>
            ${addressShort}
          </span>
          <span class="tag-item">
            <i class="bi bi-briefcase"></i>
            ${category}
          </span>
          <span class="tag-item">
            <i class="bi bi-people"></i>
            ${memberCount} thành viên
          </span>
        </div>
        <button class="btn btn-primary-soft w-100 btn-join-company" data-id="${company._id}">
          <i class="bi bi-person-plus me-2"></i>
          Gửi yêu cầu tham gia
        </button>
      `;

      companyList.appendChild(companyCard);
    });

    document.querySelectorAll(".btn-join-company").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const companyId = e.currentTarget.dataset.id;

        if (myCompanyData) {
          alert("Bạn đang thuộc một công ty. Vui lòng rời khỏi công ty hiện tại trước khi tham gia công ty khác.");
          const myCompanyTab = document.querySelector("#my-company-tab");
          if (myCompanyTab) {
            bootstrap.Tab.getOrCreateInstance(myCompanyTab).show();
          }
          return;
        }

        const result = await sendJoinRequest(companyId);
        if (result) {
          alert("Đã gửi yêu cầu tham gia công ty thành công!");
        }
      });
    });
  } catch (err) {
    console.log(err);
  }
}

document.getElementById("deleteCompanyBtn")?.addEventListener("click", async () => {
  if (!myCompanyData) return;

  const ok = confirm(
    isOwner(myCompanyData) ? "Bạn có thật sự muốn xoá công ty?" : "Bạn có muốn rời khỏi công ty này không?",
  );

  if (!ok) return;

  await deleteCompany(myCompanyData._id);
  window.location.reload();
});

async function handleCheckCompany() {
  try {
    myCompanyData = await getMyCompany();
    if (!myCompanyData) {
      document.querySelector(".showMyCompany").style.display = "none";
      document.querySelector(".showNotification").style.display = "block";
    } else {
      renderMyCompany(myCompanyData);
      document.querySelector(".showNotification").style.display = "none";
      document.querySelector(".showMyCompany").style.display = "block";
    }
  } catch (err) {
    console.log(err);
  }
}

function renderMyCompany(data) {
  try {
    if (!data) return;

    const myMember = getMyMemberInfo(data);
    const owner = Array.isArray(data.members) ? data.members.find((m) => m.role === "owner") : null;

    const ownerUser = owner?.user && typeof owner.user === "object" ? owner.user : data.createdBy;

    if (!isOwner(data)) {
      document.querySelector(".deleteCompany").textContent = "Rời công ty!";
    } else {
      document.querySelector(".deleteCompany").textContent = "Xoá công ty";
    }

    document.querySelector(".company-name").textContent = data.companyName || "";
    document.querySelector(".company-address").textContent = data.address || "";
    document.querySelector(".company-category").textContent = data.category || "";
    document.querySelector(".company-website").textContent = data.website || "";
    document.querySelector(".company-role").textContent = getRoleText(myMember?.role || "");
    document.querySelector(".company-description").textContent = data.description || "";

    document.querySelector(".company-email").textContent = ownerUser?.email || "";
    document.querySelector(".company-phone").textContent = data.phoneCompany || "";
    document.querySelector(".company-addressDetail").textContent = data.address || "";
    document.querySelector(".company-founded").textContent = formatDate(data.createdAt);
    document.querySelector(".company-status").textContent = getStatusText(data.status);

    const companyLogo = document.querySelector(".company-logo");
    if (companyLogo) {
      if (data.logoUrl) {
        companyLogo.innerHTML = `<img src="${data.logoUrl}" alt="${data.companyName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 20%;" />`;
      } else {
        companyLogo.textContent = getLogoText(data.companyName);
      }
    }

    const editBtn = document.getElementById("openEditCompanyModalBtn");
    if (editBtn) {
      editBtn.style.display = isOwner(data) ? "inline-block" : "none";
    }
  } catch (err) {
    console.log(err);
  }
}

async function handleCreateCompany() {
  const companyData = {
    companyName: document.querySelector(".companyName").value.trim(),
    category: document.querySelector(".companyCategory").value.trim(),
    website: document.querySelector(".companyWebsite").value.trim(),
    phoneCompany: document.querySelector(".companyPhone").value.trim(),
    address: document.querySelector(".companyAddress").value.trim(),
    logoUrl: document.querySelector(".companyLogo").value.trim(),
    description: document.querySelector(".companyDescription").value.trim(),
  };

  if (
    !companyData.companyName ||
    !companyData.category ||
    !companyData.website ||
    !companyData.phoneCompany ||
    !companyData.address ||
    !companyData.description
  ) {
    alert("Vui lòng nhập đầy đủ thông tin công ty!");
    return;
  }

  const result = await createCompany(companyData);
  if (!result) {
    alert("Thất bại khi tạo công ty!");
    return;
  }

  alert("Tạo công ty thành công!");

  document.querySelector(".companyName").value = "";
  document.querySelector(".companyCategory").value = "";
  document.querySelector(".companyWebsite").value = "";
  document.querySelector(".companyPhone").value = "";
  document.querySelector(".companyAddress").value = "";
  document.querySelector(".companyLogo").value = "";
  document.querySelector(".companyDescription").value = "";

  await handleCheckCompany();
  await renderCompanies();

  const myCompanyTab = document.querySelector("#my-company-tab");
  if (myCompanyTab) {
    bootstrap.Tab.getOrCreateInstance(myCompanyTab).show();
  }
}

function fillEditCompanyModal(data) {
  if (!data) return;

  document.getElementById("editCompanyName").value = data.companyName || "";
  document.getElementById("editCompanyCategory").value = data.category || "";
  document.getElementById("editCompanyWebsite").value = data.website || "";
  document.getElementById("editCompanyPhone").value = data.phoneCompany || "";
  document.getElementById("editCompanyAddress").value = data.address || "";
  document.getElementById("editCompanyLogo").value = data.logoUrl || "";
  document.getElementById("editCompanyDescription").value = data.description || "";
}

async function handleUpdateCompany() {
  if (!myCompanyData?._id) {
    alert("Không tìm thấy công ty để cập nhật!");
    return;
  }

  if (!isOwner(myCompanyData)) {
    alert("Chỉ owner mới được cập nhật thông tin công ty!");
    return;
  }

  const updateData = {
    companyName: document.getElementById("editCompanyName").value.trim(),
    category: document.getElementById("editCompanyCategory").value.trim(),
    website: document.getElementById("editCompanyWebsite").value.trim(),
    phoneCompany: document.getElementById("editCompanyPhone").value.trim(),
    address: document.getElementById("editCompanyAddress").value.trim(),
    logoUrl: document.getElementById("editCompanyLogo").value.trim(),
    description: document.getElementById("editCompanyDescription").value.trim(),
  };

  if (
    !updateData.companyName ||
    !updateData.category ||
    !updateData.website ||
    !updateData.phoneCompany ||
    !updateData.address ||
    !updateData.description
  ) {
    alert("Vui lòng nhập đầy đủ thông tin công ty!");
    return;
  }

  const result = await updateMyCompany(myCompanyData._id, updateData);
  if (!result) {
    alert("Cập nhật công ty thất bại!");
    return;
  }

  alert("Cập nhật thông tin công ty thành công!");

  const modalElement = document.getElementById("editCompanyModal");
  const modalInstance = bootstrap.Modal.getInstance(modalElement);
  if (modalInstance) modalInstance.hide();

  await handleCheckCompany();
  await renderCompanies();
}

function handleJoinCompanyTabGuard() {
  const joinCompanyTab = document.getElementById("join-company-tab");
  if (!joinCompanyTab) return;

  joinCompanyTab.addEventListener("show.bs.tab", function (e) {
    if (myCompanyData) {
      e.preventDefault();
      alert("Bạn đang thuộc một công ty. Vui lòng rời khỏi công ty hiện tại trước khi tham gia công ty khác.");

      const myCompanyTab = document.querySelector("#my-company-tab");
      if (myCompanyTab) {
        bootstrap.Tab.getOrCreateInstance(myCompanyTab).show();
      }
    }
  });
}

function handleOpenEditModal() {
  const editButton = document.getElementById("openEditCompanyModalBtn");
  if (!editButton) return;

  editButton.addEventListener("click", () => {
    if (!myCompanyData) {
      alert("Bạn chưa có công ty để chỉnh sửa.");
      return;
    }

    if (!isOwner(myCompanyData)) {
      alert("Chỉ owner mới được chỉnh sửa công ty.");
      return;
    }

    fillEditCompanyModal(myCompanyData);

    const modal = new bootstrap.Modal(document.getElementById("editCompanyModal"));
    modal.show();
  });
}

async function renderCompanyJoinRequests() {
  const container = document.querySelector(".company-join-request-list");
  if (!container) return;

  container.innerHTML = "";

  if (!myCompanyData || !isAdminOrOwner(myCompanyData)) {
    container.innerHTML = `
      <div class="empty-state mt-4">
        <div class="empty-icon">
          <i class="bi bi-shield-lock"></i>
        </div>
        <div class="empty-title">Không có quyền truy cập</div>
        <div class="empty-text">Chỉ owner hoặc admin mới xem được yêu cầu gia nhập.</div>
      </div>
    `;
    return;
  }

  const requests = await getMyCompanyJoinRequests();

  if (!Array.isArray(requests) || requests.length === 0) {
    container.innerHTML = `
      <div class="empty-state mt-4">
        <div class="empty-icon">
          <i class="bi bi-inbox"></i>
        </div>
        <div class="empty-title">Chưa có yêu cầu gia nhập</div>
        <div class="empty-text">Hiện chưa có ai gửi yêu cầu vào công ty.</div>
      </div>
    `;
    return;
  }

  requests.forEach((request) => {
    const isAdminRequest = request.requestedRole === "admin";
    const canApproveAdmin = isOwner(myCompanyData);

    const card = document.createElement("div");
    card.className = "join-card";

    card.innerHTML = `
      <div class="join-header">
        <div class="join-logo">${(request.user?.fullName || "U").charAt(0).toUpperCase()}</div>
        <div>
          <div class="join-name">${request.user?.fullName || "Người dùng"}</div>
          <div class="join-sub">${request.user?.email || ""}</div>
        </div>
      </div>

      <div class="tag-list mt-2">
        <span class="tag-item">
          <i class="bi bi-person-badge"></i>
          ${getRequestedRoleText(request.requestedRole)}
        </span>
        <span class="tag-item">
          <i class="bi bi-calendar-event"></i>
          ${formatDate(request.createdAt)}
        </span>
      </div>

      ${
        isAdminRequest
          ? `<div class="alert alert-warning mt-3 mb-2">Yêu cầu quyền HR / Admin - chỉ owner được duyệt.</div>`
          : ""
      }

      <div class="d-flex gap-2 mt-3">
        <button
          class="btn btn-success flex-fill btn-approve-request"
          data-id="${request._id}"
          ${isAdminRequest && !canApproveAdmin ? "disabled" : ""}
        >
          Duyệt
        </button>

        <button
          class="btn btn-outline-danger flex-fill btn-reject-request"
          data-id="${request._id}"
          ${isAdminRequest && !canApproveAdmin ? "disabled" : ""}
        >
          Từ chối
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll(".btn-approve-request").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const requestId = e.currentTarget.dataset.id;
      const ok = confirm("Bạn có chắc muốn duyệt yêu cầu này không?");
      if (!ok) return;

      const result = await approveJoinRequest(requestId);
      if (result) {
        alert("Duyệt yêu cầu thành công!");
        await handleCheckCompany();
        await renderCompanies();
        await renderCompanyJoinRequests();
      }
    });
  });

  document.querySelectorAll(".btn-reject-request").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const requestId = e.currentTarget.dataset.id;
      const ok = confirm("Bạn có chắc muốn từ chối yêu cầu này không?");
      if (!ok) return;

      const result = await rejectJoinRequest(requestId);
      if (result) {
        alert("Từ chối yêu cầu thành công!");
        await renderCompanyJoinRequests();
      }
    });
  });
}

function handleSearchCompanies() {
  const searchInput = document.querySelector("#join-company-pane .search-input");
  const searchButton = document.querySelector("#join-company-pane .btn.btn-primary-soft.w-100");

  if (!searchInput || !searchButton) return;

  searchButton.addEventListener("click", () => {
    const keyword = searchInput.value.trim().toLowerCase();
    const companyList = document.querySelector("#join-company-pane .company-list");

    if (!companyList) return;

    const filteredCompanies = dataCompanies.filter((company) => {
      const companyName = company.companyName?.toLowerCase() || "";
      const category = company.category?.toLowerCase() || "";
      const address = company.address?.toLowerCase() || "";
      const description = company.description?.toLowerCase() || "";
      const code = company.companyCode?.toLowerCase() || company._id?.slice(-6).toLowerCase() || "";

      return (
        companyName.includes(keyword) ||
        category.includes(keyword) ||
        address.includes(keyword) ||
        description.includes(keyword) ||
        code.includes(keyword)
      );
    });

    companyList.innerHTML = "";

    if (filteredCompanies.length === 0) {
      companyList.innerHTML = `
        <div class="empty-state mt-4">
          <div class="empty-icon">
            <i class="bi bi-search"></i>
          </div>
          <div class="empty-title">Không tìm thấy công ty phù hợp</div>
          <div class="empty-text">Hãy thử từ khóa khác.</div>
        </div>
      `;
      return;
    }

    filteredCompanies.forEach((company) => {
      const companyCard = document.createElement("div");
      companyCard.className = "join-card";

      const memberCount = Array.isArray(company.members) ? company.members.length : 0;
      const companyIdText = company.companyCode || company._id?.slice(-6).toUpperCase() || "N/A";
      const addressShort = company.address || "Chưa cập nhật";
      const category = company.category || "Chưa cập nhật";
      const logoText = company.logoUrl
        ? `<img src="${company.logoUrl}" alt="${company.companyName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
        : getLogoText(company.companyName);

      companyCard.innerHTML = `
        <div class="join-header">
          <div class="join-logo">${logoText}</div>
          <div>
            <div class="join-name">${company.companyName || ""}</div>
            <div class="join-sub">Mã công ty: ${companyIdText}</div>
          </div>
        </div>
        <div class="join-desc">
          ${company.description || "Chưa có mô tả công ty."}
        </div>
        <div class="tag-list">
          <span class="tag-item">
            <i class="bi bi-geo-alt"></i>
            ${addressShort}
          </span>
          <span class="tag-item">
            <i class="bi bi-briefcase"></i>
            ${category}
          </span>
          <span class="tag-item">
            <i class="bi bi-people"></i>
            ${memberCount} thành viên
          </span>
        </div>
        <button class="btn btn-primary-soft w-100 btn-join-company" data-id="${company._id}">
          <i class="bi bi-person-plus me-2"></i>
          Gửi yêu cầu tham gia
        </button>
      `;

      companyList.appendChild(companyCard);
    });

    document.querySelectorAll(".btn-join-company").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const companyId = e.currentTarget.dataset.id;

        if (myCompanyData) {
          alert("Bạn đang thuộc một công ty. Vui lòng rời khỏi công ty hiện tại trước khi tham gia công ty khác.");
          const myCompanyTab = document.querySelector("#my-company-tab");
          if (myCompanyTab) {
            bootstrap.Tab.getOrCreateInstance(myCompanyTab).show();
          }
          return;
        }

        const result = await sendJoinRequest(companyId);
        if (result) {
          alert("Đã gửi yêu cầu tham gia công ty thành công!");
        }
      });
    });
  });
}

document.getElementById("createCompanyBtn").addEventListener("click", () => {
  handleCreateCompany();
});

document.getElementById("saveEditCompanyBtn")?.addEventListener("click", () => {
  handleUpdateCompany();
});

async function initCompanyManagementPage() {
  await handleCheckCompany();
  await renderCompanies();
  await renderCompanyJoinRequests();

  handleJoinCompanyTabGuard();
  handleOpenEditModal();
  handleSearchCompanies();
}

initCompanyManagementPage();
