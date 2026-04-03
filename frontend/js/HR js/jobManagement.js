import URL from "../utils/url.js";

let dataJobs = [];
let dataCompany = null;

const token = sessionStorage.getItem("token") || localStorage.getItem("token") || null;

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

async function loadMyCompanyJobs(companyId) {
  try {
    if (!companyId) return [];

    const res = await fetch(`${URL}/api/jobs/company/${companyId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.log(err);
    return [];
  }
}

async function createJobAPI(data) {
  try {
    const res = await fetch(`${URL}/api/jobs/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function updateJobAPI(jobId, data) {
  try {
    const res = await fetch(`${URL}/api/jobs/${jobId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function deleteJobAPI(jobId) {
  try {
    const res = await fetch(`${URL}/api/jobs/${jobId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return await res.json();
  } catch (err) {
    console.log(err);
    return null;
  }
}

function setManagePostsMenuDisabled(disabled) {
  const menuManagePosts = document.getElementById("menu-manage-posts");
  if (!menuManagePosts) return;

  if (disabled) {
    menuManagePosts.classList.add("disabled-menu");
    menuManagePosts.setAttribute("aria-disabled", "true");
    menuManagePosts.setAttribute("title", "Bạn cần tạo hoặc tham gia công ty trước");
  } else {
    menuManagePosts.classList.remove("disabled-menu");
    menuManagePosts.removeAttribute("aria-disabled");
    menuManagePosts.removeAttribute("title");
  }
}

function renderNoCompanyState() {
  const jobList = document.getElementById("jobList");
  const approvalList = document.getElementById("approvalList");

  const html = `
    <div class="empty-state mt-4">
      <div class="empty-icon">
        <i class="bi bi-buildings"></i>
      </div>
      <div class="empty-title">Bạn chưa có công ty</div>
      <div class="empty-text">
        Vui lòng tạo hoặc tham gia công ty trước khi quản lý bài đăng tuyển dụng.
      </div>
    </div>
  `;

  if (jobList) jobList.innerHTML = html;
  if (approvalList) approvalList.innerHTML = html;

  document.querySelector(".no-approval-state")?.classList.add("d-none");
}

function formatSalary(value) {
  if (value === null || value === undefined || value === "") return "Thỏa thuận";
  return Number(value).toLocaleString("vi-VN") + " VNĐ";
}

function formatDate(dateString) {
  if (!dateString) return "Không có";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Không hợp lệ";
  return date.toLocaleDateString("vi-VN");
}

function getStatusInfo(status) {
  const map = {
    pending: { label: "Chờ duyệt", className: "status-pending" },
    approved: { label: "Đã duyệt", className: "status-approved" },
    rejected: { label: "Từ chối", className: "status-rejected" },
    closed: { label: "Đã đóng", className: "status-closed" },
  };
  return map[status] || { label: status || "Không rõ", className: "status-pending" };
}

function parseBenefits(benefits) {
  if (!benefits) return [];

  return benefits
    .split(/\n|•|;|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHTML(str = "") {
  return str.replace(/[&<>"']/g, function (match) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[match];
  });
}

function truncateText(text, maxLength = 120) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function renderBenefitsCompact(benefits) {
  const items = parseBenefits(benefits);

  if (!items.length) {
    return `<span class="benefit-empty">Không có</span>`;
  }

  const visible = items.slice(0, 3);
  const remain = items.length - visible.length;

  return `
    <div class="benefits-inline">
      ${visible
        .map(
          (item) => `
            <span class="benefit-chip" title="${escapeHTML(item)}">
              ${escapeHTML(truncateText(item, 28))}
            </span>
          `,
        )
        .join("")}
      ${remain > 0 ? `<span class="benefit-more">+${remain}</span>` : ""}
    </div>
  `;
}

function renderJobCard(job) {
  const company = job.companyId || {};
  const statusInfo = getStatusInfo(job.status);

  const website = company.website
    ? company.website.startsWith("http")
      ? company.website
      : "https://" + company.website
    : "";

  return `
    <div class="job-card compact">
      <div class="job-head">
        <div class="job-head-left">
          <img
            class="job-company-logo"
            src="${company.logoUrl || "https://via.placeholder.com/80x80?text=Logo"}"
            alt="${company.companyName || "company logo"}"
          />

          <div class="job-main">
            <div class="job-title-row">
              <h3 class="job-title">${job.title || "Chưa có tiêu đề"}</h3>
              <span class="job-status ${statusInfo.className}">
                ${statusInfo.label}
              </span>
            </div>

            <div class="job-company-name">${company.companyName || "Chưa có tên công ty"}</div>

            <div class="job-sub-meta">
              <span class="job-tag">${job.category || "Chưa phân loại"}</span>
              <span class="job-tag">${job.jobType || "Không rõ hình thức"}</span>
              <span class="job-inline-item">
                <i class="bi bi-cash-stack"></i>
                ${formatSalary(job.salaryMin)} - ${formatSalary(job.salaryMax)}
              </span>
              <span class="job-inline-item">
                <i class="bi bi-calendar-event"></i>
                ${formatDate(job.deadline)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="job-info-line">
        <span><strong>Kinh nghiệm:</strong> ${job.experience || "Không yêu cầu"}</span>
        <span><strong>Địa điểm:</strong> ${job.location || "Chưa cập nhật"}</span>
        <span><strong>Thời gian:</strong> ${job.workingTime || "Chưa cập nhật"}</span>
        <span><strong>Số lượng:</strong> ${job.quantity ?? 0}</span>
      </div>

      <div class="job-info-line">
        <span><strong>Yêu cầu:</strong> ${job.requirements || "Chưa cập nhật"}</span>
      </div>

      <div class="job-info-line">
        <span><strong>Mô tả:</strong> ${truncateText(job.description || "Chưa có mô tả", 120)}</span>
      </div>

      <div class="job-benefits-row">
        <strong>Quyền lợi:</strong>
        ${renderBenefitsCompact(job.benefits)}
      </div>

      <div class="job-footer">
        ${
          website
            ? `<a class="job-link" href="${website}" target="_blank">Website công ty</a>`
            : `<span class="job-link disabled">Chưa có website</span>`
        }

        <div class="job-actions">
          <button class="btn-action btn-edit" data-id="${job._id}">
            <i class="bi bi-pencil-square"></i>
            <span>Chỉnh sửa</span>
          </button>

          <button class="btn-action btn-delete" data-id="${job._id}">
            <i class="bi bi-trash"></i>
            <span>Xóa</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderJobs(jobs) {
  const jobList = document.getElementById("jobList");
  if (!jobList) return;

  if (!jobs || jobs.length === 0) {
    jobList.innerHTML = `<p>Không có công việc nào.</p>`;
    return;
  }

  jobList.innerHTML = jobs.map((job) => renderJobCard(job)).join("");
}

function renderApprovalCard(job) {
  const status = job.status || "pending";

  const statusMap = {
    pending: {
      cardClass: "pending",
      badgeClass: "text-bg-warning",
      label: "Chờ duyệt",
      metaLabel: "Gửi lúc",
      message: "Bài đăng đang được hệ thống hoặc quản trị viên kiểm tra nội dung trước khi hiển thị công khai.",
    },
    approved: {
      cardClass: "approved",
      badgeClass: "text-bg-success",
      label: "Đã duyệt",
      metaLabel: "Duyệt lúc",
      message: "Bài đăng đã được duyệt và hiện đang hiển thị trên hệ thống tuyển dụng.",
    },
    rejected: {
      cardClass: "rejected",
      badgeClass: "text-bg-danger",
      label: "Từ chối",
      metaLabel: "Từ chối lúc",
      message: job.rejectionReason || "Lý do: Nội dung chưa phù hợp. Vui lòng chỉnh sửa và gửi lại.",
    },
  };

  const info = statusMap[status] || statusMap.pending;
  const displayDate = formatDate(job.updatedAt || job.createdAt || job.submittedAt || job.date);

  return `
    <div class="approval-card ${info.cardClass}">
      <div class="approval-top">
        <div>
          <div class="approval-title">${job.title || "Chưa có tiêu đề"}</div>
          <div class="approval-meta">
            ${info.metaLabel}: ${displayDate} • Danh mục: ${job.category || "Chưa cập nhật"}
          </div>
        </div>
        <span class="badge ${info.badgeClass}">${info.label}</span>
      </div>

      <div class="approval-message">
        ${info.message}
      </div>

      ${
        status === "rejected"
          ? `
            <div class="post-actions mt-3">
              <button class="btn btn-primary-soft btn-sm btn-edit" data-id="${job._id}">
                <i class="bi bi-pencil-square me-1"></i>
                Chỉnh sửa và gửi lại
              </button>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function renderApprovalList(jobs) {
  const approvalList = document.getElementById("approvalList");
  if (!approvalList) return;

  const noApprovalState = document.querySelector(".no-approval-state");

  if (!jobs || jobs.length === 0) {
    approvalList.innerHTML = "";
    noApprovalState?.classList.remove("d-none");
    return;
  }

  noApprovalState?.classList.add("d-none");
  approvalList.innerHTML = jobs.map((job) => renderApprovalCard(job)).join("");
}

const editJobModalEl = document.getElementById("editJobModal");
const editJobModal = editJobModalEl ? new bootstrap.Modal(editJobModalEl) : null;

function fillEditJobForm(job) {
  document.getElementById("editJobId").value = job._id || "";
  document.getElementById("editJobTitle").value = job.title || "";
  document.getElementById("editJobDescription").value = job.description || "";
  document.getElementById("editJobCategory").value = job.category || "";
  document.getElementById("editJobExperience").value = job.experience || "";
  document.getElementById("editSalaryMin").value = job.salaryMin || "";
  document.getElementById("editSalaryMax").value = job.salaryMax || "";
  document.getElementById("editDeadline").value = job.deadline
    ? new Date(job.deadline).toISOString().split("T")[0]
    : "";
  document.getElementById("editJobType").value = job.jobType || "";
  document.getElementById("editWorkingTime").value = job.workingTime || "";
  document.getElementById("editQuantity").value = job.quantity ?? "";
  document.getElementById("editLocation").value = job.location || "";
  document.getElementById("editRequirements").value = job.requirements || "";
  document.getElementById("editBenefits").value = job.benefits || "";
}

async function reloadMyJobs() {
  if (!dataCompany?._id) {
    dataJobs = [];
    renderNoCompanyState();
    return;
  }

  dataJobs = await loadMyCompanyJobs(dataCompany._id);
  renderJobs(dataJobs);
  renderApprovalList(dataJobs);
}

async function handleCreateJob() {
  if (!dataCompany?._id) {
    alert("Bạn chưa có công ty nên không thể tạo bài đăng tuyển dụng.");
    return;
  }

  const form = document.getElementById("createJobForm");
  const data = {
    companyId: dataCompany._id,
    title: form.title.value,
    description: form.description.value,
    category: form.category.value,
    experience: form.experience.value,
    salaryMin: form.salaryMin.value,
    salaryMax: form.salaryMax.value,
    jobType: form.jobType.value,
    deadline: form.deadline.value,
    workingTime: form.workingTime.value,
    location: form.location.value,
    quantity: form.vacancyCount.value,
    requirements: form.requirements.value,
    benefits: form.benefits.value,
  };

  if (
    !data.title ||
    !data.description ||
    !data.category ||
    !data.experience ||
    !data.salaryMin ||
    !data.salaryMax ||
    !data.jobType ||
    !data.deadline ||
    !data.workingTime ||
    !data.location ||
    !data.quantity ||
    !data.requirements ||
    !data.benefits
  ) {
    alert("Vui lòng không để trống thông tin!");
    return;
  }

  if (Number(data.salaryMin) > Number(data.salaryMax)) {
    alert("Lương tối đa phải lớn hơn lương tối thiểu!");
    return;
  }

  const result = await createJobAPI(data);
  if (!result) {
    alert("Tạo bài đăng tuyển dụng thất bại!");
    return;
  }

  form.reset();
  await reloadMyJobs();
  alert("Tạo bài đăng tuyển dụng thành công!");
}

function bindEvents() {
  document.getElementById("createJobBtn")?.addEventListener("click", handleCreateJob);

  document.getElementById("saveEditJobBtn")?.addEventListener("click", async () => {
    if (!dataCompany?._id) {
      alert("Bạn chưa có công ty nên không thể cập nhật bài đăng.");
      return;
    }

    const form = document.getElementById("editJobForm");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const jobId = document.getElementById("editJobId").value;
    const payload = {
      title: document.getElementById("editJobTitle").value.trim(),
      description: document.getElementById("editJobDescription").value.trim(),
      category: document.getElementById("editJobCategory").value.trim(),
      experience: document.getElementById("editJobExperience").value.trim(),
      salaryMin: Number(document.getElementById("editSalaryMin").value) || 0,
      salaryMax: Number(document.getElementById("editSalaryMax").value) || 0,
      deadline: document.getElementById("editDeadline").value,
      jobType: document.getElementById("editJobType").value,
      workingTime: document.getElementById("editWorkingTime").value.trim(),
      quantity: Number(document.getElementById("editQuantity").value) || 0,
      location: document.getElementById("editLocation").value.trim(),
      requirements: document.getElementById("editRequirements").value.trim(),
      benefits: document.getElementById("editBenefits").value.trim(),
    };

    const result = await updateJobAPI(jobId, payload);
    if (!result) {
      alert("Cập nhật thất bại!");
      return;
    }

    editJobModal?.hide();
    await reloadMyJobs();

    const tab = document.getElementById("my-posts-tab");
    if (tab) bootstrap.Tab.getOrCreateInstance(tab).show();

    alert("Cập nhật bài đăng thành công!");
  });

  document.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".btn-edit");
    const deleteBtn = e.target.closest(".btn-delete");

    if (editBtn) {
      if (!dataCompany?._id) {
        alert("Bạn chưa có công ty nên không thể chỉnh sửa bài đăng.");
        return;
      }

      const jobId = editBtn.dataset.id;
      const job = dataJobs.find((item) => item._id === jobId);
      if (!job) return;

      fillEditJobForm(job);
      editJobModal?.show();
      return;
    }

    if (deleteBtn) {
      if (!dataCompany?._id) {
        alert("Bạn chưa có công ty nên không thể xóa bài đăng.");
        return;
      }

      const jobId = deleteBtn.dataset.id;
      const res = await deleteJobAPI(jobId);
      if (res?.message) alert(res.message);

      await reloadMyJobs();

      const tab = document.getElementById("my-posts-tab");
      if (tab) bootstrap.Tab.getOrCreateInstance(tab).show();
    }
  });
}

async function initPage() {
  guardManagePostsMenu();
  bindEvents();

  dataCompany = await loadMyCompany();
  setManagePostsMenuDisabled(!dataCompany?._id);

  if (!dataCompany?._id) {
    alert("Bạn chưa có công ty nên không thể truy cập mục Quản lý bài đăng.");
    window.location.href = "./companyManagement.html"; // hoặc dashboard.html
    return;
  }

  await reloadMyJobs();
}

initPage();
