import URL from "../utils/url.js";

let allCandidates = [];
let filteredCandidates = [];
let selectedCandidate = null;

document.addEventListener("DOMContentLoaded", async () => {

});

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
      <span class="badge ${candidate.status}">${getStatusLabel(candidate.status)}</span>
    `;
    container.appendChild(div);
  });
}

function renderCandidateList() {
  const container = document.getElementById("candidateList");
  container.innerHTML = "";

  if (!filteredCandidates.length) {
    container.innerHTML = `<div class="empty-state">Không tìm thấy ứng viên phù hợp.</div>`;
    return;
  }

  filteredCandidates.forEach((candidate) => {
    const item = document.createElement("div");
    item.className = `candidate-item ${selectedCandidate && selectedCandidate._id === candidate._id ? "active" : ""}`;

    item.innerHTML = `
      <div class="candidate-top">
        <div>
          <div class="candidate-name">${escapeHTML(candidate.fullName)}</div>
          <div class="candidate-meta">
            ${escapeHTML(candidate.jobTitle)}<br/>
            ${escapeHTML(candidate.email)} • ${escapeHTML(candidate.phone)}<br/>
            Nộp ngày: ${formatDate(candidate.appliedAt)}
          </div>
        </div>
        <span class="badge ${candidate.status}">${getStatusLabel(candidate.status)}</span>
      </div>

      <div class="candidate-tags">
        <span class="mini-tag">${escapeHTML(candidate.location)}</span>
        ${
          Array.isArray(candidate.skills) && candidate.skills.length
            ? candidate.skills
                .slice(0, 3)
                .map((skill) => `<span class="mini-tag">${escapeHTML(skill)}</span>`)
                .join("")
            : `<span class="mini-tag">Chưa có kỹ năng</span>`
        }
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
    container.innerHTML = `<div class="detail-empty">Chọn một ứng viên để xem chi tiết.</div>`;
    return;
  }

  selectedCandidate = candidate;

  container.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-name">${escapeHTML(candidate.fullName)}</div>
        <div class="detail-sub">
          ${escapeHTML(candidate.jobTitle)}<br/>
          ${escapeHTML(candidate.email)} • ${escapeHTML(candidate.phone)}
        </div>
      </div>
      <span class="badge ${candidate.status}">${getStatusLabel(candidate.status)}</span>
    </div>

    <div class="detail-grid">
      <div class="detail-field">
        <label>Ngày ứng tuyển</label>
        <p>${formatDate(candidate.appliedAt)}</p>
      </div>
      <div class="detail-field">
        <label>Khu vực</label>
        <p>${escapeHTML(candidate.location)}</p>
      </div>
      <div class="detail-field">
        <label>Kinh nghiệm</label>
        <p>${escapeHTML(candidate.experience)}</p>
      </div>
      <div class="detail-field">
        <label>Học vấn</label>
        <p>${escapeHTML(candidate.education)}</p>
      </div>
    </div>

    <div class="detail-block">
      <h4>Kỹ năng</h4>
      <div class="candidate-tags">
        ${
          Array.isArray(candidate.skills) && candidate.skills.length
            ? candidate.skills.map((skill) => `<span class="mini-tag">${escapeHTML(skill)}</span>`).join("")
            : `<span class="mini-tag">Chưa cập nhật</span>`
        }
      </div>
    </div>

    <div class="detail-block">
      <h4>Thư giới thiệu / Ghi chú ứng tuyển</h4>
      <p style="line-height: 1.7; color: #4b5563;">
        ${escapeHTML(candidate.coverLetter || "Không có nội dung.")}
      </p>
    </div>

    <div class="detail-block">
      <h4>Tệp CV</h4>
      <div class="detail-actions">
        ${
          candidate.cvUrl
            ? `<a class="btn-primary" href="${candidate.cvUrl}" target="_blank" rel="noopener noreferrer">Xem CV</a>`
            : `<button class="btn-secondary" disabled>Chưa có CV</button>`
        }
      </div>
    </div>

    <div class="detail-block">
      <h4>Cập nhật trạng thái</h4>
      <div class="status-actions">
        <button class="status-btn" onclick="updateCandidateStatus('${candidate._id}', 'reviewing')">Đang xem</button>
        <button class="status-btn" onclick="updateCandidateStatus('${candidate._id}', 'interview')">Phỏng vấn</button>
        <button class="status-btn" onclick="updateCandidateStatus('${candidate._id}', 'accepted')">Nhận việc</button>
        <button class="status-btn" onclick="updateCandidateStatus('${candidate._id}', 'rejected')">Từ chối</button>
      </div>
    </div>
  `;
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
                  .map(
                    (candidate) => `
                <div class="mini-card bg-white p-3 mb-3">
                  <div class="fw-bold mb-1">${escapeHTML(candidate.fullName)}</div>
                  <div class="text-secondary small mb-2">${escapeHTML(candidate.jobTitle)}</div>
                  <div class="small text-muted">
                    ${formatDate(candidate.appliedAt)}
                  </div>
                </div>
              `,
                  )
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

async function updateCandidateStatus(candidateId, newStatus) {
  try {
    const token = localStorage.getItem("token");

    // Gợi ý endpoint:
    // PATCH /api/applications/:id/status
    const response = await fetch(`${API_BASE}/applications/${candidateId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      throw new Error("Cập nhật trạng thái thất bại");
    }

    const index = allCandidates.findIndex((c) => c._id === candidateId);
    if (index !== -1) {
      allCandidates[index].status = newStatus;
    }

    const filteredIndex = filteredCandidates.findIndex((c) => c._id === candidateId);
    if (filteredIndex !== -1) {
      filteredCandidates[filteredIndex].status = newStatus;
      renderCandidateDetail(filteredCandidates[filteredIndex]);
    }

    renderOverview();
    renderCandidateList();
    renderRecentCandidates();
    renderStatusBoard();

    alert("Cập nhật trạng thái thành công!");
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);
    alert(error.message || "Có lỗi xảy ra khi cập nhật trạng thái.");
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

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
