import URL from "../utils/url.js";

let dataCompanies = [];
let myCompanyData = null;
let companyJoinRequests = [];

const token = sessionStorage.getItem("token") || localStorage.getItem("token") || null;
const user = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "null");

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

const apiHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

function showEmptyState(container, icon, title, text) {
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state mt-4">
      <div class="empty-icon">
        <i class="bi ${icon}"></i>
      </div>
      <div class="empty-title">${title}</div>
      <div class="empty-text">${text}</div>
    </div>
  `;
}

async function requestApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${URL}${endpoint}`, {
      headers: apiHeaders,
      ...options,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || "Có lỗi xảy ra");
    }

    return data;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function loadCompanies() {
  try {
    const data = await requestApi("/api/companies/");
    return Array.isArray(data.companies) ? data.companies : [];
  } catch {
    return [];
  }
}

async function getMyCompany() {
  try {
    const res = await fetch(`${URL}/api/companies/me`, {
      headers: apiHeaders,
    });
    if (res.status === 404) return null;
    
    const data = await res.json().catch(() => null);

    if (!res.ok) throw new Error(data?.message || "Không thể tải công ty");

    return data;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function createCompany(data) {
  try {
    return await requestApi("/api/companies/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err) {
    alert(err.message || "Tạo công ty thất bại");
    return null;
  }
}

async function updateMyCompany(companyId, data) {
  try {
    return await requestApi(`/api/companies/${companyId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (err) {
    alert(err.message || "Cập nhật công ty thất bại");
    return null;
  }
}

async function deleteCompany(companyId) {
  try {
    return await requestApi(`/api/companies/${companyId}`, {
      method: "DELETE",
    });
  } catch (err) {
    alert(err.message || "Không thể xoá / rời công ty");
    return null;
  }
}

async function sendJoinRequest(companyId, requestedRole = "member") {
  try {
    return await requestApi(`/api/companies/${companyId}/join-request`, {
      method: "POST",
      body: JSON.stringify({ requestedRole }),
    });
  } catch (err) {
    alert(err.message || "Không thể gửi yêu cầu tham gia công ty");
    return null;
  }
}

async function getMyCompanyJoinRequests() {
  try {
    const result = await requestApi("/api/companies/my/join-requests");
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

async function approveJoinRequest(requestId) {
  try {
    return await requestApi(`/api/companies/join-requests/${requestId}/approve`, {
      method: "PATCH",
    });
  } catch (err) {
    alert(err.message || "Không thể duyệt yêu cầu");
    return null;
  }
}

async function rejectJoinRequest(requestId) {
  try {
    return await requestApi(`/api/companies/join-requests/${requestId}/reject`, {
      method: "PATCH",
    });
  } catch (err) {
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
  return getMyMemberInfo(company)?.role === "owner";
}

function isAdminOrOwner(company) {
  return ["owner", "admin"].includes(getMyMemberInfo(company)?.role);
}

function getRequestedRoleText(role) {
  return (
    {
      member: "Thành viên",
      admin: "HR / Admin",
    }[role] || role
  );
}

function getRoleText(role) {
  if (!role) return "Chưa xác định";

  return (
    {
      hr: "HR",
      admin: "Quản trị viên",
      owner: "Owner",
      member: "Thành viên",
    }[role.toLowerCase()] || role
  );
}

function getStatusText(status) {
  return status === "active" ? "Đang hoạt động" : "Không hoạt động";
}

function formatDate(dateString) {
  return dateString ? dateString.split("T")[0] : "";
}

function getLogoText(companyName = "") {
  return companyName
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getCompanySearchFields(company) {
  return [
    company.companyName,
    company.companyCode || company._id?.slice(-6),
    company.address,
    company.category,
    company.description,
  ]
    .map(normalizeText)
    .join(" ");
}

function getJoinRequestSearchFields(request) {
  return [request.user?.fullName, request.user?.email].map(normalizeText).join(" ");
}

function validateCompanyForm(data) {
  return data.companyName && data.category && data.website && data.phoneCompany && data.address && data.description;
}

function getCompanyFormData(prefix = "") {
  const byId = (id) => document.getElementById(`${prefix}${id}`)?.value.trim() || "";
  const byClass = (className) => $(`.${className}`)?.value.trim() || "";

  if (prefix === "edit") {
    return {
      companyName: byId("CompanyName"),
      category: byId("CompanyCategory"),
      website: byId("CompanyWebsite"),
      phoneCompany: byId("CompanyPhone"),
      address: byId("CompanyAddress"),
      logoUrl: byId("CompanyLogo"),
      description: byId("CompanyDescription"),
    };
  }

  return {
    companyName: byClass("companyName"),
    category: byClass("companyCategory"),
    website: byClass("companyWebsite"),
    phoneCompany: byClass("companyPhone"),
    address: byClass("companyAddress"),
    logoUrl: byClass("companyLogo"),
    description: byClass("companyDescription"),
  };
}

function resetCreateCompanyForm() {
  [
    ".companyName",
    ".companyCategory",
    ".companyWebsite",
    ".companyPhone",
    ".companyAddress",
    ".companyLogo",
    ".companyDescription",
  ].forEach((selector) => {
    const el = $(selector);
    if (el) el.value = "";
  });
}

function renderCompanyCard(company) {
  const memberCount = Array.isArray(company.members) ? company.members.length : 0;
  const companyIdText = company.companyCode || company._id?.slice(-6).toUpperCase() || "N/A";
  const logo = company.logoUrl
    ? `<img src="${company.logoUrl}" alt="${company.companyName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
    : getLogoText(company.companyName);

  return `
    <div class="join-card">
      <div class="join-header">
        <div class="join-logo">${logo}</div>
        <div>
          <div class="join-name">${company.companyName || ""}</div>
          <div class="join-sub">Mã công ty: ${companyIdText}</div>
        </div>
      </div>
      <div class="join-desc">${company.description || "Chưa có mô tả công ty."}</div>
      <div class="tag-list">
        <span class="tag-item"><i class="bi bi-geo-alt"></i>${company.address || "Chưa cập nhật"}</span>
        <span class="tag-item"><i class="bi bi-briefcase"></i>${company.category || "Chưa cập nhật"}</span>
        <span class="tag-item"><i class="bi bi-people"></i>${memberCount} thành viên</span>
      </div>
      <button class="btn btn-primary-soft w-100 btn-join-company" data-id="${company._id}">
        <i class="bi bi-person-plus me-2"></i>
        Gửi yêu cầu tham gia
      </button>
    </div>
  `;
}

function renderJoinRequestCard(request) {
  const isAdminRequest = request.requestedRole === "admin";
  const canApproveAdmin = isOwner(myCompanyData);

  return `
    <div class="join-card">
      <div class="join-header col-6">
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
    </div>
  `;
}

function renderCompanyList(companies = []) {
  const container = $("#join-company-pane .company-list");
  if (!container) return;

  if (!companies.length) {
    return showEmptyState(
      container,
      "bi-search",
      "Không tìm thấy công ty",
      "Không có công ty nào phù hợp với từ khóa bạn nhập.",
    );
  }

  container.innerHTML = companies.map(renderCompanyCard).join("");
}

function renderJoinRequestList(requests = []) {
  const container = $(".company-join-request-list");
  if (!container) return;

  if (!requests.length) {
    return showEmptyState(
      container,
      "bi-search",
      "Không tìm thấy yêu cầu",
      "Không có yêu cầu nào phù hợp với từ khóa tìm kiếm.",
    );
  }

  container.innerHTML = requests.map(renderJoinRequestCard).join("");
}

async function renderCompanies() {
  const container = $("#join-company-pane .company-list");
  if (!container) return;

  dataCompanies = await loadCompanies();

  if (!dataCompanies.length) {
    return showEmptyState(
      container,
      "bi-buildings",
      "Chưa có công ty nào",
      "Hiện tại chưa có dữ liệu công ty để tham gia.",
    );
  }

  renderCompanyList(dataCompanies);
}

async function renderCompanyJoinRequests() {
  const container = $(".company-join-request-list");
  if (!container) return;

  if (!myCompanyData || !isAdminOrOwner(myCompanyData)) {
    return showEmptyState(
      container,
      "bi-shield-lock",
      "Không có quyền truy cập",
      "Chỉ owner hoặc admin mới xem được yêu cầu gia nhập.",
    );
  }

  companyJoinRequests = await getMyCompanyJoinRequests();

  if (!companyJoinRequests.length) {
    return showEmptyState(
      container,
      "bi-inbox",
      "Chưa có yêu cầu gia nhập",
      "Hiện chưa có ai gửi yêu cầu vào công ty.",
    );
  }

  renderJoinRequestList(companyJoinRequests);
}

async function handleCheckCompany() {
  myCompanyData = await getMyCompany();

  const myCompanyBox = $(".showMyCompany");
  const notifyBox = $(".showNotification");

  if (!myCompanyData) {
    if (myCompanyBox) myCompanyBox.style.display = "none";
    if (notifyBox) notifyBox.style.display = "block";
    return;
  }

  await renderMyCompany(myCompanyData);

  if (notifyBox) notifyBox.style.display = "none";
  if (myCompanyBox) myCompanyBox.style.display = "block";
}

async function renderMyCompany(data) {
  if (!data) return;

  const myMember = getMyMemberInfo(data);
  const requests = await getMyCompanyJoinRequests();
  const owner = Array.isArray(data.members) ? data.members.find((m) => m.role === "owner") : null;
  const ownerUser = owner?.user && typeof owner.user === "object" ? owner.user : data.createdBy;

  const mappings = [
    [".company-name", data.companyName || ""],
    [".company-address", data.address || ""],
    [".company-category", data.category || ""],
    [".company-website", data.website || ""],
    [".company-role", getRoleText(myMember?.role || "")],
    [".company-description", data.description || ""],
    [".company-email", ownerUser?.email || ""],
    [".company-phone", data.phoneCompany || ""],
    [".company-addressDetail", data.address || ""],
    [".company-founded", formatDate(data.createdAt)],
    [".company-status", getStatusText(data.status)],
    [".employees-count", `${data.members?.length || 0} nhân viên`],
    [".requests-count", `${requests.length} yêu cầu`],
  ];

  mappings.forEach(([selector, value]) => {
    const el = $(selector);
    if (el) el.textContent = value;
  });

  const deleteBtn = $(".deleteCompany");
  if (deleteBtn) {
    deleteBtn.textContent = isOwner(data) ? "Xoá công ty" : "Rời công ty!";
  }

  const logo = $(".company-logo");
  if (logo) {
    logo.innerHTML = data.logoUrl
      ? `<img src="${data.logoUrl}" alt="${data.companyName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 20%;" />`
      : getLogoText(data.companyName);
  }

  const editBtn = $("#openEditCompanyModalBtn");
  if (editBtn) {
    editBtn.style.display = isOwner(data) ? "inline-block" : "none";
  }
}

async function refreshAllCompanyViews() {
  await handleCheckCompany();
  await renderCompanies();
  await renderCompanyJoinRequests();
}

async function handleCreateCompany() {
  const companyData = getCompanyFormData();

  if (!validateCompanyForm(companyData)) {
    alert("Vui lòng nhập đầy đủ thông tin công ty!");
    return;
  }

  const result = await createCompany(companyData);
  if (!result) return;

  alert("Tạo công ty thành công!");
  resetCreateCompanyForm();
  await refreshAllCompanyViews();

  const myCompanyTab = $("#my-company-tab");
  if (myCompanyTab) bootstrap.Tab.getOrCreateInstance(myCompanyTab).show();
}

function fillEditCompanyModal(data) {
  if (!data) return;

  const fields = {
    editCompanyName: data.companyName || "",
    editCompanyCategory: data.category || "",
    editCompanyWebsite: data.website || "",
    editCompanyPhone: data.phoneCompany || "",
    editCompanyAddress: data.address || "",
    editCompanyLogo: data.logoUrl || "",
    editCompanyDescription: data.description || "",
  };

  Object.entries(fields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
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

  const updateData = getCompanyFormData("edit");

  if (!validateCompanyForm(updateData)) {
    alert("Vui lòng nhập đầy đủ thông tin công ty!");
    return;
  }

  const result = await updateMyCompany(myCompanyData._id, updateData);
  if (!result) return;

  alert("Cập nhật thông tin công ty thành công!");

  const modalElement = document.getElementById("editCompanyModal");
  const modalInstance = bootstrap.Modal.getInstance(modalElement);
  if (modalInstance) modalInstance.hide();

  await refreshAllCompanyViews();
}

function searchCompanies(keyword = "") {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) {
    renderCompanyList(dataCompanies);
    return;
  }

  renderCompanyList(dataCompanies.filter((company) => getCompanySearchFields(company).includes(normalizedKeyword)));
}

function searchCompanyJoinRequests(keyword = "") {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) {
    renderJoinRequestList(companyJoinRequests);
    return;
  }

  renderJoinRequestList(
    companyJoinRequests.filter((request) => getJoinRequestSearchFields(request).includes(normalizedKeyword)),
  );
}

function bindLiveSearch({ inputSelector, buttonSelector, onSearch }) {
  const input = $(inputSelector);
  const button = $(buttonSelector);

  if (input) {
    input.addEventListener("input", () => onSearch(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") onSearch(input.value);
    });
  }

  if (button) {
    button.addEventListener("click", () => onSearch(input?.value || ""));
  }
}

function bindStaticEvents() {
  $("#createCompanyBtn")?.addEventListener("click", handleCreateCompany);
  $("#saveEditCompanyBtn")?.addEventListener("click", handleUpdateCompany);

  $("#deleteCompanyBtn")?.addEventListener("click", async () => {
    if (!myCompanyData) return;

    const ok = confirm(
      isOwner(myCompanyData) ? "Bạn có thật sự muốn xoá công ty?" : "Bạn có muốn rời khỏi công ty này không?",
    );
    if (!ok) return;

    const result = await deleteCompany(myCompanyData._id);
    if (result) window.location.reload();
  });

  $("#openEditCompanyModalBtn")?.addEventListener("click", () => {
    if (!myCompanyData) {
      alert("Bạn chưa có công ty để chỉnh sửa.");
      return;
    }

    if (!isOwner(myCompanyData)) {
      alert("Chỉ owner mới được chỉnh sửa công ty.");
      return;
    }

    fillEditCompanyModal(myCompanyData);
    new bootstrap.Modal(document.getElementById("editCompanyModal")).show();
  });

  $("#join-company-tab")?.addEventListener("show.bs.tab", (e) => {
    if (!myCompanyData) return;

    e.preventDefault();
    alert("Bạn đang thuộc một công ty. Vui lòng rời khỏi công ty hiện tại trước khi tham gia công ty khác.");

    const myCompanyTab = $("#my-company-tab");
    if (myCompanyTab) bootstrap.Tab.getOrCreateInstance(myCompanyTab).show();
  });

  bindLiveSearch({
    inputSelector: "#company-search-input",
    buttonSelector: "#btn-search-company",
    onSearch: searchCompanies,
  });

  bindLiveSearch({
    inputSelector: "#join-request-search-input",
    buttonSelector: "#btn-filter-join-request",
    onSearch: searchCompanyJoinRequests,
  });

  $("#join-company-pane .company-list")?.addEventListener("click", async (e) => {
    const button = e.target.closest(".btn-join-company");
    if (!button) return;

    if (myCompanyData) {
      alert("Bạn đang thuộc một công ty. Vui lòng rời khỏi công ty hiện tại trước khi tham gia công ty khác.");
      const myCompanyTab = $("#my-company-tab");
      if (myCompanyTab) bootstrap.Tab.getOrCreateInstance(myCompanyTab).show();
      return;
    }

    const result = await sendJoinRequest(button.dataset.id);
    if (result) alert("Đã gửi yêu cầu tham gia công ty thành công!");
  });

  $(".company-join-request-list")?.addEventListener("click", async (e) => {
    const approveBtn = e.target.closest(".btn-approve-request");
    const rejectBtn = e.target.closest(".btn-reject-request");

    if (approveBtn) {
      const ok = confirm("Bạn có chắc muốn duyệt yêu cầu này không?");
      if (!ok) return;

      const result = await approveJoinRequest(approveBtn.dataset.id);
      if (result) {
        alert("Duyệt yêu cầu thành công!");
        await refreshAllCompanyViews();
      }
      return;
    }

    if (rejectBtn) {
      const ok = confirm("Bạn có chắc muốn từ chối yêu cầu này không?");
      if (!ok) return;

      const result = await rejectJoinRequest(rejectBtn.dataset.id);
      if (result) {
        alert("Từ chối yêu cầu thành công!");
        await renderCompanyJoinRequests();
      }
    }
  });
}

async function initCompanyManagementPage() {
  bindStaticEvents();
  await refreshAllCompanyViews();
}

initCompanyManagementPage();
