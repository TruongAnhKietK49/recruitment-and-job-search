import URL from "../utils/url.js";

const token = localStorage.getItem("token") || sessionStorage.getItem("token") || null;
const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");

let company = [];
let allCandidates = [];
let filteredCandidates = [];
let selectedCandidate = null;

document.addEventListener("DOMContentLoaded", async () => {
  await initCandidateManagement();
  initBtnOverviewActions();
  initCandidateDetailActions();
  initStatusBoardActions();
  bindFilterEvents();
});

// Load company
async function loadMyCompany() {
  try {
    const res = await fetch(`${URL}/api/companies/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Lỗi load company:", error);
  }
}

// Get my company applications
async function getMyCompanyApplications(companyId) {
  try {
    const res = await fetch(`${URL}/api/applications/company/${companyId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Lỗi load applications:", error);
  }
}

// Update application status
async function updateApplicationStatus(applicationId, newStatus) {
  try {
    const res = await fetch(`${URL}/api/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Lỗi update status:", error);
  }
}

async function initCandidateManagement() {
  try {
    company = await loadMyCompany();

    if (!company || !company._id) {
      throw new Error("Không tải được thông tin công ty");
    }

    const response = await getMyCompanyApplications(company._id);

    const applicationList = Array.isArray(response) ? response : Array.isArray(response?.applications) ? response.applications : [];

    allCandidates = applicationList.map(mapApplicationToCandidate);
    filteredCandidates = [...allCandidates];

    renderJobFilterOptions();
    renderOverview();
    renderRecentCandidates();
    renderCandidateList();
    renderStatusBoard();

    if (filteredCandidates.length) {
      selectedCandidate = filteredCandidates[0];
      renderCandidateDetail(selectedCandidate);
    } else {
      renderCandidateDetail(null);
    }
  } catch (error) {
    console.error("Lỗi khởi tạo trang ứng viên:", error);
    allCandidates = [];
    filteredCandidates = [];
    renderOverview();
    renderRecentCandidates();
    renderCandidateList();
    renderStatusBoard();
    renderCandidateDetail(null);
  }
}

function mapApplicationToCandidate(application) {
  const user = application?.userId || {};
  const profile = application?.candidateProfileId || {};
  const job = application?.jobId || {};
  const resume = application?.resumeId || {};

  return {
    applicationId: application?._id || "",
    status: application?.status || "pending",
    appliedAt: application?.createdAt || application?.applyDate || null,

    fullName: user?.fullName || "Chưa có tên",
    email: user?.email || "Chưa có email",
    phone: user?.phoneNumber || user?.phone || "Chưa có số điện thoại",
    gender: user?.gender || "Chưa cập nhật",

    address: profile?.address || "Chưa cập nhật",
    avatar: profile?.avatar || "",
    expSummary: profile?.expSummary || "Chưa cập nhật",
    education: profile?.education || "Chưa cập nhật",
    expectedSalary: profile?.expectedSalary || "Chưa cập nhật",
    skills: Array.isArray(profile?.skills) ? profile.skills.map((s) => s.skillName) : [],

    jobId: job?._id || "",
    jobTitle: job?.title || "Chưa có vị trí",
    category: job?.category || "",
    createdBy: job?.createdBy || "",

    cvTitle: resume?.title || "CV",
    cvUrl: resume?.fileUrl || "",

    updatedAt: application?.updatedAt || application?.updatedDate || null,
    createdAt: application?.createdAt || application?.createdDate || null,
  };
}

function bindFilterEvents() {
  const applicationFilter = document.getElementById("applicantsFilter");
  const searchInput = document.getElementById("searchCandidateInput");
  const jobFilter = document.getElementById("jobFilter");
  const statusFilter = document.getElementById("statusFilter");
  const sortFilter = document.getElementById("sortFilter");

  if (applicationFilter) applicationFilter.addEventListener("change", applyCandidateFilters);
  if (searchInput) searchInput.addEventListener("input", applyCandidateFilters);
  if (jobFilter) jobFilter.addEventListener("change", applyCandidateFilters);
  if (statusFilter) statusFilter.addEventListener("change", applyCandidateFilters);
  if (sortFilter) sortFilter.addEventListener("change", applyCandidateFilters);
}

function renderJobFilterOptions() {
  const jobFilter = document.getElementById("jobFilter");
  if (!jobFilter) return;

  const uniqueJobs = [
    ...new Map(allCandidates.filter((candidate) => candidate.jobId).map((candidate) => [candidate.jobId, candidate.jobTitle])).entries(),
  ];

  jobFilter.innerHTML = `
    <option value="">Tất cả vị trí</option>
    ${uniqueJobs.map(([jobId, jobTitle]) => `<option value="${escapeHTML(jobId)}">${escapeHTML(jobTitle)}</option>`).join("")}
  `;
}

function applyCandidateFilters() {
  const selectedApplication = document.getElementById("applicantsFilter")?.value || "allApplicants";
  const searchValue = document.getElementById("searchCandidateInput")?.value?.trim().toLowerCase() || "";
  const selectedJobId = document.getElementById("jobFilter")?.value || "";
  const selectedStatus = document.getElementById("statusFilter")?.value || "";
  const selectedSort = document.getElementById("sortFilter")?.value || "newest";

  let result = [...allCandidates];

  // Tìm ứng viên ứng vào job có cùng Id của bạn
  if (selectedApplication === "myApplications") {
    result = result.filter((candidate) => candidate.createdBy === user.id);
  }

  if (searchValue) {
    result = result.filter((candidate) => {
      const fullName = (candidate.fullName || "").toLowerCase();
      const email = (candidate.email || "").toLowerCase();
      const phone = (candidate.phone || "").toLowerCase();

      return fullName.includes(searchValue) || email.includes(searchValue) || phone.includes(searchValue);
    });
  }

  if (selectedJobId) {
    result = result.filter((candidate) => candidate.jobId === selectedJobId);
  }

  if (selectedStatus) {
    result = result.filter((candidate) => candidate.status === selectedStatus);
  }

  result.sort((a, b) => {
    const dateA = new Date(a.appliedAt || 0).getTime();
    const dateB = new Date(b.appliedAt || 0).getTime();

    switch (selectedSort) {
      case "oldest":
        return dateA - dateB;
      case "name_asc":
        return (a.fullName || "").localeCompare(b.fullName || "", "vi");
      case "name_desc":
        return (b.fullName || "").localeCompare(a.fullName || "", "vi");
      case "newest":
      default:
        return dateB - dateA;
    }
  });

  filteredCandidates = result;

  if (selectedCandidate && !filteredCandidates.some((candidate) => candidate._id === selectedCandidate._id)) {
    selectedCandidate = filteredCandidates[0] || null;
  }

  renderCandidateList();
  renderCandidateDetail(selectedCandidate || null);
}

function renderOverview() {
  const total = allCandidates.length;
  const pending = allCandidates.filter((c) => ["pending", "reviewing", "interview"].includes(c.status)).length;
  const accepted = allCandidates.filter((c) => c.status === "accepted").length;
  const rejected = allCandidates.filter((c) => c.status === "rejected").length;

  document.getElementById("totalCandidates").textContent = total;
  document.getElementById("pendingCandidates").textContent = pending;
  document.getElementById("acceptedCandidates").textContent = accepted;
  document.getElementById("rejectedCandidates").textContent = rejected;
}

function renderRecentCandidates() {
  const container = document.getElementById("recentCandidates");
  container.innerHTML = "";

  const recent = [...allCandidates].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)).slice(0, 5);

  if (!recent.length) {
    container.innerHTML = `<div class="empty-state">Chưa có ứng viên nào.</div>`;
    return;
  }

  recent.forEach((candidate) => {
    const div = document.createElement("div");
    div.className = "recent-item";
    div.innerHTML = `
      <div class="recent-title">${escapeHTML(candidate.fullName)}</div>
      <div class="recent-sub">
        ${escapeHTML(candidate.jobTitle)} • ${escapeHTML(candidate.email)} • Nộp ngày: ${formatDate(candidate.appliedAt)}
      </div>
      <span class="badge rounded-pill px-3 py-2 status-badge ${candidate.status}">${getStatusLabel(candidate.status)}</span>
    `;
    container.appendChild(div);
  });
}

function renderCandidateList() {
  const container = document.getElementById("candidateList");
  container.innerHTML = "";

  if (!filteredCandidates.length) {
    container.innerHTML = `
      <div class="card border-0 shadow-sm empty-candidate-card">
        <div class="card-body text-center py-5">
          <i class="bi bi-people fs-1 text-secondary mb-3 d-block"></i>
          <h5 class="fw-bold text-muted mb-2">Không tìm thấy ứng viên phù hợp</h5>
          <p class="text-secondary mb-0">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      </div>
    `;
    return;
  }

  filteredCandidates.forEach((candidate) => {
    const isActive = selectedCandidate && selectedCandidate._id === candidate._id;

    let avatarDefault = "";
    if (candidate.gender == "female")
      avatarDefault =
        "https://static.vecteezy.com/system/resources/thumbnails/016/766/342/small_2x/happy-smiling-young-man-avatar-3d-portrait-of-a-man-cartoon-character-people-illustration-isolated-on-transparent-background-png.png";
    else avatarDefault = "https://png.pngtree.com/png-vector/20241211/ourlarge/pngtree-cartoon-character-wearing-glasses-png-image_14714365.png";

    const avatar = candidate?.avatar || avatarDefault;

    const item = document.createElement("div");
    item.className = `card candidate-card border-0 shadow-sm mb-3 ${isActive ? "active-candidate" : ""}`;

    item.innerHTML = `
      <div class="card-body p-3 p-md-4">
        <div class="row align-items-start g-3">
          
          <div class="col-lg-8">
            <div class="d-flex align-items-start gap-3">
              <img
                src="${avatar}"
                alt="${escapeHTML(candidate.fullName || "Avatar")}"
                class="candidate-avatar"
                onerror="this.src='https://static.vecteezy.com/system/resources/thumbnails/016/766/342/small_2x/happy-smiling-young-man-avatar-3d-portrait-of-a-man-cartoon-character-people-illustration-isolated-on-transparent-background-png.png'"
              />

              <div class="flex-grow-1">
                <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                  <h5 class="mb-0 fw-bold candidate-name">
                    ${escapeHTML(candidate.fullName || "Chưa có tên")}
                  </h5>
                </div>

                <div class="candidate-job mb-2">
                  <i class="bi bi-briefcase me-1"></i>
                  ${escapeHTML(candidate.jobTitle || "Chưa có vị trí")}
                </div>

                <div class="candidate-meta-list d-flex flex-column gap-1">
                  <div>
                    <i class="bi bi-envelope me-2"></i>${escapeHTML(candidate.email || "Chưa có email")}
                  </div>
                  <div>
                    <i class="bi bi-telephone me-2"></i>${escapeHTML(candidate.phone || "Chưa có số điện thoại")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="candidate-side-panel d-flex flex-column justify-content-between">
              <div class="d-flex justify-content-lg-end justify-content-start mb-2">
                <span class="badge rounded-pill px-3 py-2 status-badge ${candidate.status}">
                  ${getStatusLabel(candidate.status)}
                </span>
              </div>

              <div class="candidate-date text-lg-end text-start mb-3">
                <i class="bi bi-calendar-event me-1"></i>
                Nộp ngày: ${formatDate(candidate.appliedAt)}
              </div>

              <div class="d-flex justify-content-lg-end justify-content-start">
                <button class="btn btn-sm btn-outline-primary px-3 candidate-view-btn">
                  <i class="bi bi-eye me-1"></i>Xem chi tiết
                </button>
              </div>
            </div>
          </div>

          <div class="col-12">
            <div class="candidate-tags-row d-flex flex-wrap gap-2">
              <span class="badge rounded-pill location-badge px-3 py-2">
                <i class="bi bi-geo-alt me-1"></i>${escapeHTML(candidate.address || "Chưa cập nhật")}
              </span>

              ${
                Array.isArray(candidate.skills) && candidate.skills.length
                  ? candidate.skills
                      .slice(0, 4)
                      .map(
                        (skill) => `
                          <span class="badge rounded-pill skill-badge px-3 py-2">
                            ${escapeHTML(skill)}
                          </span>
                        `,
                      )
                      .join("")
                  : `<span class="badge rounded-pill bg-secondary-subtle text-secondary px-3 py-2">Chưa có kỹ năng</span>`
              }
            </div>
          </div>

        </div>
      </div>
    `;

    item.addEventListener("click", () => {
      selectedCandidate = candidate;
      renderCandidateList();
      renderCandidateDetail(candidate);
    });

    container.appendChild(item);
  });
}

function renderCandidateDetail(candidate) {
  const container = document.getElementById("candidateDetail");

  if (!candidate) {
    selectedCandidate = null;
    container.innerHTML = `
      <div class="card border-0 shadow-sm candidate-detail-card">
        <div class="card-body text-center py-5">
          <div class="detail-empty-icon mb-3">
            <i class="bi bi-person-vcard"></i>
          </div>
          <h5 class="fw-bold text-muted mb-2">Chọn một ứng viên để xem chi tiết</h5>
          <p class="text-secondary mb-0">Thông tin hồ sơ, kỹ năng, CV và trạng thái sẽ hiển thị tại đây.</p>
        </div>
      </div>
    `;
    return;
  }

  selectedCandidate = candidate;
  let avatarDefault = "";
  if (candidate.gender == "female")
    avatarDefault =
      "https://static.vecteezy.com/system/resources/thumbnails/016/766/342/small_2x/happy-smiling-young-man-avatar-3d-portrait-of-a-man-cartoon-character-people-illustration-isolated-on-transparent-background-png.png";
  else avatarDefault = "https://png.pngtree.com/png-vector/20241211/ourlarge/pngtree-cartoon-character-wearing-glasses-png-image_14714365.png";

  const avatarUrl = candidate?.avatar || avatarDefault;

  container.innerHTML = `
    <div class="card border-0 shadow-sm candidate-detail-card">
      <div class="card-body p-4 p-lg-5">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 detail-header-bootstrap position-relative">
          <div class="d-flex align-items-start gap-3">
            <div class="detail-avatar-wrap">
              <img
                src="${avatarUrl}"
                alt="${escapeHTML(candidate.fullName || "Avatar")}"
                class="detail-avatar"
                onerror="this.src='https://static.vecteezy.com/system/resources/thumbnails/016/766/342/small_2x/happy-smiling-young-man-avatar-3d-portrait-of-a-man-cartoon-character-people-illustration-isolated-on-transparent-background-png.png'"
              />
            </div>

            <div>
              <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
                <h3 class="mb-0 fw-bold detail-name">
                  ${escapeHTML(candidate.fullName || "Chưa có tên")}
                </h3>
                <span class="badge rounded-pill px-3 py-2 status-badge ${candidate.status}">
                  ${getStatusLabel(candidate.status)}
                </span>
              </div>

              <div class="text-muted detail-sub">
                <div class="mb-1">
                  <i class="bi bi-briefcase me-2"></i>${escapeHTML(candidate.jobTitle || "Chưa có vị trí")}
                </div>
                <div class="mb-1">
                  <i class="bi bi-envelope me-2"></i>${escapeHTML(candidate.email || "Chưa có email")}
                </div>
                <div>
                  <i class="bi bi-telephone me-2"></i>${escapeHTML(candidate.phone || "Chưa có số điện thoại")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr class="my-4"/>

        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <div class="info-card">
              <label>Ngày ứng tuyển</label>
              <p><i class="bi bi-calendar-event me-2"></i>${formatDate(candidate.appliedAt)}</p>
            </div>
          </div>

          <div class="col-md-6">
            <div class="info-card">
              <label>Khu vực</label>
              <p><i class="bi bi-geo-alt me-2"></i>${escapeHTML(candidate.address || "Chưa cập nhật")}</p>
            </div>
          </div>

          <div class="col-md-6">
            <div class="info-card">
              <label>Kinh nghiệm</label>
              <p><i class="bi bi-briefcase-fill me-2"></i>${escapeHTML(candidate.expSummary || "Chưa cập nhật")}</p>
            </div>
          </div>

          <div class="col-md-6">
            <div class="info-card">
              <label>Học vấn</label>
              <p><i class="bi bi-mortarboard me-2"></i>${escapeHTML(candidate.education || "Chưa cập nhật")}</p>
            </div>
          </div>
        </div>

        <div class="detail-section mb-4">
          <h5 class="section-title">
            <i class="bi bi-stars me-2"></i>Kỹ năng
          </h5>
          <div class="d-flex flex-wrap gap-2">
            ${
              Array.isArray(candidate.skills) && candidate.skills.length
                ? candidate.skills
                    .map(
                      (skill) => `
                        <span class="badge rounded-pill skill-badge px-3 py-2">
                          ${escapeHTML(skill)}
                        </span>
                      `,
                    )
                    .join("")
                : `<span class="badge rounded-pill bg-secondary-subtle text-secondary px-3 py-2">Chưa cập nhật</span>`
            }
          </div>
        </div>

        <div class="detail-section mb-4">
          <h5 class="section-title">
            <i class="bi bi-card-text me-2"></i>Thư giới thiệu / Ghi chú ứng tuyển
          </h5>
          <div class="content-box">
            ${escapeHTML(candidate.coverLetter || "Không có nội dung.")}
          </div>
        </div>

        <div class="detail-section mb-4">
          <h5 class="section-title">
            <i class="bi bi-file-earmark-person me-2"></i>Tệp CV
          </h5>
          <div class="d-flex flex-wrap gap-2">
            ${
              candidate.cvUrl
                ? `
                  <a class="btn btn-primary px-4" href="${candidate.cvUrl}" target="_blank" rel="noopener noreferrer">
                    <i class="bi bi-box-arrow-up-right me-2"></i>Xem CV
                  </a>
                `
                : `
                  <button class="btn btn-outline-secondary px-4" disabled>
                    <i class="bi bi-file-earmark-x me-2"></i>Chưa có CV
                  </button>
                `
            }
          </div>
        </div>

        <div class="detail-section">
          <h5 class="section-title">
            <i class="bi bi-arrow-repeat me-2"></i>Cập nhật trạng thái
          </h5>

          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-outline-info status-action-btn" data-id="${candidate.applicationId}" data-status="reviewing">
              <i class="bi bi-search me-1"></i>Đang xem
            </button>

            <button class="btn btn-outline-primary status-action-btn" data-id="${candidate.applicationId}" data-status="interview">
              <i class="bi bi-camera-video me-1"></i>Phỏng vấn
            </button>

            <button class="btn btn-outline-success status-action-btn" data-id="${candidate.applicationId}" data-status="accepted">
              <i class="bi bi-check-circle me-1"></i>Nhận việc
            </button>

            <button class="btn btn-outline-danger status-action-btn" data-id="${candidate.applicationId}" data-status="rejected">
              <i class="bi bi-x-circle me-1"></i>Từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initBtnOverviewActions() {
  const btnViewAll = document.getElementById("goToCandidateListBtn");
  const btnViewStatusBoard = document.getElementById("goToStatusBtn");
  const btnRefesh = document.getElementById("refreshCandidatesBtn");

  if (btnViewAll) {
    btnViewAll.addEventListener("click", () => {
      const triggerEl = document.querySelector('[data-bs-target="#candidate-list-tab"]');
      if (triggerEl) {
        const tab = new bootstrap.Tab(triggerEl);
        tab.show();
      }
    });
  }

  if (btnViewStatusBoard) {
    btnViewStatusBoard.addEventListener("click", () => {
      const triggerEl = document.querySelector('[data-bs-target="#status-tab"]');
      if (triggerEl) {
        const tab = new bootstrap.Tab(triggerEl);
        tab.show();
      }
    });
  }

  if (btnRefesh) {
    btnRefesh.addEventListener("click", () => {
      initCandidateManagement();
    });
  }
}

function initCandidateDetailActions() {
  const candidateDetail = document.getElementById("candidateDetail");
  if (!candidateDetail) return;

  candidateDetail.addEventListener("click", async (e) => {
    const btn = e.target.closest(".status-action-btn");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const applicationId = btn.dataset.id;
    const newStatus = btn.dataset.status;

    if (!applicationId || !newStatus) return;

    await updateStatus(applicationId, newStatus);
  });
}

function initStatusBoardActions() {
  const refeshBtn = document.getElementById("refreshBtn");
  if (!refeshBtn) return;

  refeshBtn.addEventListener("click", () => {
    renderStatusBoard();
    alert("Đã cập nhật lại trạng thái");
  });
}

function renderStatusBoard() {
  const container = document.getElementById("statusBoard");

  const statuses = [
    { key: "pending", label: "Chờ xử lý", className: "status-pending" },
    { key: "reviewing", label: "Đang xem", className: "status-reviewing" },
    { key: "interview", label: "Phỏng vấn", className: "status-interview" },
    { key: "accepted", label: "Đã nhận", className: "status-accepted" },
    { key: "rejected", label: "Từ chối", className: "status-rejected" },
  ];

  container.innerHTML = statuses
    .map((status) => {
      const list = allCandidates.filter((candidate) => candidate.status === status.key);

      return `
      <div class="col-12 col-md-6 col-xl">
        <div class="kanban-col p-3 h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="h5 fw-bold mb-0">${status.label}</h3>
            <span class="status-pill ${status.className}">${list.length}</span>
          </div>

          ${
            list.length
              ? list
                  .map((candidate) => {
                    const interviewUI =
                      status.key === "interview"
                        ? `
                        <div class="small text-muted mb-3">
                          <i class="bi bi-calendar-event me-1"></i>
                          ${candidate.interviewTime ? formatInterviewTime(candidate.interviewTime) : "Chưa có lịch"}
                        </div>
                        <button class="btn btn-outline-secondary btn-sm w-100">
                          Lịch phỏng vấn
                        </button>
                      `
                        : "";

                    return `
                      <div class="mini-card bg-white p-3 mb-3">
                        <div class="fw-bold mb-1">${escapeHTML(candidate.fullName)}</div>
                        <div class="text-secondary small mb-2">${escapeHTML(candidate.jobTitle)}</div>
                        <div class="small text-muted">
                          Cập nhật: ${formatDate(candidate.updatedAt)}
                        </div>
                        ${interviewUI}
                      </div>
                    `;
                  })
                  .join("")
              : `
                <div class="text-secondary small py-2">
                  Chưa có ứng viên
                </div>
              `
          }
        </div>
      </div>
    `;
    })
    .join("");
}

async function updateStatus(applicationId, newStatus) {
  try {
    const res = await updateApplicationStatus(applicationId, newStatus);

    const updatedApplication = res.application || res.data?.application;

    if (!updatedApplication) {
      throw new Error("Không nhận được dữ liệu application từ server");
    }

    // Cập nhật allCandidates
    const index = allCandidates.findIndex((c) => c.applicationId === applicationId);
    if (index !== -1) {
      allCandidates[index] = {
        ...allCandidates[index],
        ...updatedApplication,
      };
    }

    // Cập nhật filteredCandidates
    const filteredIndex = filteredCandidates.findIndex((c) => c.applicationId === applicationId);
    if (filteredIndex !== -1) {
      filteredCandidates[filteredIndex] = {
        ...filteredCandidates[filteredIndex],
        ...updatedApplication,
      };

      renderCandidateDetail(filteredCandidates[filteredIndex]);
    }

    // renderOverview();
    renderCandidateList();
    // renderRecentCandidates();
    renderStatusBoard();

    alert("Cập nhật trạng thái thành công!");
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);

    const message = error?.response?.data?.message || error?.message || "Cập nhật trạng thái thất bại!";

    alert(message);
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "pending":
      return "Chờ xử lý";
    case "reviewing":
      return "Đang xem";
    case "interview":
      return "Phỏng vấn";
    case "accepted":
      return "Đã nhận";
    case "rejected":
      return "Từ chối";
    default:
      return "Chờ xử lý";
  }
}

function formatDate(dateString) {
  if (!dateString) return "Không xác định";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatInterviewTime(date) {
  const d = new Date(date);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} - ${d.toLocaleDateString("vi-VN")}`;
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
