import URL from "../utils/url.js";

const dashboardState = {
  companyName: "Công ty của bạn",
  summary: {
    totalEmployees: 0,
    activeRecruitments: 0,
    newCandidates: 0,
    turnoverRate: 0,
  },
  trend: [],
  recruitmentOverview: [],
  departments: [],
  activities: [],
};

document.addEventListener("DOMContentLoaded", async () => {
  setCurrentDate();
  bindEvents();
  await loadDashboard();
});

function bindEvents() {
  document.getElementById("refreshDashboardBtn")?.addEventListener("click", loadDashboard);
  document.getElementById("timeRangeFilter")?.addEventListener("change", loadDashboard);
}

function setCurrentDate() {
  const el = document.getElementById("currentDateText");
  const now = new Date();
  el.textContent = now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function loadDashboard() {
  try {
    const token = localStorage.getItem("token");
    const range = document.getElementById("timeRangeFilter")?.value || "12";

    const response = await fetch(`${API_BASE}/hr/dashboard?range=${range}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu dashboard");
    }

    const result = await response.json();
    normalizeDashboardData(result?.data || result);

    renderSummaryCards();
    renderTrendChart();
    renderRecruitmentOverview();
    renderDepartmentBreakdown();
    renderActivities();
  } catch (error) {
    console.error("loadDashboard error:", error);

    loadMockData();
    renderSummaryCards();
    renderTrendChart();
    renderRecruitmentOverview();
    renderDepartmentBreakdown();
    renderActivities();
  }
}

function normalizeDashboardData(data = {}) {
  dashboardState.companyName = data.companyName || "Dữ liệu công ty";
  dashboardState.summary = {
    totalEmployees: Number(data.summary?.totalEmployees || 0),
    activeRecruitments: Number(data.summary?.activeRecruitments || 0),
    newCandidates: Number(data.summary?.newCandidates || 0),
    turnoverRate: Number(data.summary?.turnoverRate || 0),
  };

  dashboardState.trend = Array.isArray(data.trend) ? data.trend : [];
  dashboardState.recruitmentOverview = Array.isArray(data.recruitmentOverview) ? data.recruitmentOverview : [];
  dashboardState.departments = Array.isArray(data.departments) ? data.departments : [];
  dashboardState.activities = Array.isArray(data.activities) ? data.activities : [];

  document.getElementById("companyNameText").textContent = dashboardState.companyName;
}

function loadMockData() {
  dashboardState.companyName = "Công ty ABC";
  dashboardState.summary = {
    totalEmployees: 128,
    activeRecruitments: 12,
    newCandidates: 46,
    turnoverRate: 4.8,
  };

  dashboardState.trend = [
    { label: "T5", hires: 4, resignations: 1 },
    { label: "T6", hires: 6, resignations: 2 },
    { label: "T7", hires: 5, resignations: 1 },
    { label: "T8", hires: 8, resignations: 3 },
    { label: "T9", hires: 7, resignations: 2 },
    { label: "T10", hires: 9, resignations: 4 },
    { label: "T11", hires: 6, resignations: 2 },
    { label: "T12", hires: 10, resignations: 3 },
    { label: "T1", hires: 11, resignations: 2 },
    { label: "T2", hires: 7, resignations: 1 },
    { label: "T3", hires: 8, resignations: 2 },
    { label: "T4", hires: 9, resignations: 2 },
  ];

  dashboardState.recruitmentOverview = [
    { label: "Bài đăng đang mở", value: 12, sub: "Tăng 2 bài so với kỳ trước", type: "primary", icon: "bi-megaphone" },
    { label: "Ứng viên mới", value: 46, sub: "Trong 30 ngày gần nhất", type: "warning", icon: "bi-people" },
    { label: "Phỏng vấn đã lên lịch", value: 15, sub: "Cần theo dõi trong tuần này", type: "success", icon: "bi-calendar-check" },
    { label: "Offer đã gửi", value: 6, sub: "3 ứng viên đã phản hồi", type: "danger", icon: "bi-send-check" },
  ];

  dashboardState.departments = [
    { name: "Kỹ thuật", count: 42 },
    { name: "Kinh doanh", count: 28 },
    { name: "Marketing", count: 18 },
    { name: "Nhân sự", count: 12 },
    { name: "Vận hành", count: 16 },
    { name: "Tài chính", count: 12 },
  ];

  dashboardState.activities = [
    {
      time: "09:20 10/04",
      content: "Ứng viên Nguyễn Văn A được chuyển sang vòng phỏng vấn cho vị trí Backend Developer",
      owner: "Anh Kiệt",
      status: "Đang xử lý",
    },
    {
      time: "14:15 09/04",
      content: "Đăng mới bài tuyển dụng UI/UX Designer",
      owner: "Phòng HR",
      status: "Hoàn tất",
    },
    {
      time: "11:40 09/04",
      content: "Nhân sự phòng Kinh doanh tăng thêm 2 người trong kỳ",
      owner: "Phòng HR",
      status: "Cập nhật",
    },
    {
      time: "16:00 08/04",
      content: "Ứng viên Trần Minh B từ chối offer vị trí Sales Executive",
      owner: "Anh Kiệt",
      status: "Cảnh báo",
    },
  ];

  document.getElementById("companyNameText").textContent = dashboardState.companyName;
}

function renderSummaryCards() {
  const container = document.getElementById("summaryCardsRow");
  const items = [
    {
      label: "Tổng nhân sự",
      value: dashboardState.summary.totalEmployees,
      icon: "bi-people-fill",
      cls: "primary",
    },
    {
      label: "Tin tuyển dụng đang mở",
      value: dashboardState.summary.activeRecruitments,
      icon: "bi-briefcase-fill",
      cls: "success",
    },
    {
      label: "Ứng viên mới",
      value: dashboardState.summary.newCandidates,
      icon: "bi-person-plus-fill",
      cls: "warning",
    },
    {
      label: "Tỷ lệ nghỉ việc",
      value: `${dashboardState.summary.turnoverRate}%`,
      icon: "bi-arrow-left-right",
      cls: "danger",
    },
  ];

  container.innerHTML = items
    .map(
      (item) => `
    <div class="col-12 col-sm-6 col-xl-3">
      <div class="card summary-card">
        <div class="card-body d-flex align-items-start justify-content-between">
          <div>
            <p class="text-secondary mb-2">${escapeHTML(item.label)}</p>
            <h3 class="fw-bold mb-0">${escapeHTML(item.value)}</h3>
          </div>
          <span class="summary-icon ${item.cls}">
            <i class="bi ${item.icon}"></i>
          </span>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderRecruitmentOverview() {
  const container = document.getElementById("recruitmentOverviewList");

  if (!dashboardState.recruitmentOverview.length) {
    container.innerHTML = `<div class="empty-state">Chưa có dữ liệu tuyển dụng.</div>`;
    return;
  }

  container.innerHTML = dashboardState.recruitmentOverview
    .map(
      (item) => `
    <div class="overview-metric d-flex align-items-start justify-content-between gap-3">
      <div>
        <div class="overview-metric-label">${escapeHTML(item.label)}</div>
        <div class="overview-metric-value">${escapeHTML(item.value)}</div>
        <div class="overview-metric-sub">${escapeHTML(item.sub || "")}</div>
      </div>
      <div class="summary-icon ${mapMetricType(item.type)} flex-shrink-0">
        <i class="bi ${item.icon || "bi-bar-chart"}"></i>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderDepartmentBreakdown() {
  const container = document.getElementById("departmentBreakdown");

  if (!dashboardState.departments.length) {
    container.innerHTML = `<div class="empty-state">Chưa có dữ liệu phòng ban.</div>`;
    return;
  }

  const total = dashboardState.departments.reduce((sum, item) => sum + Number(item.count || 0), 0) || 1;

  container.innerHTML = dashboardState.departments
    .map((dept, index) => {
      const percent = Math.round((Number(dept.count || 0) / total) * 100);
      return `
      <div class="dept-item py-3 ${index === 0 ? "pt-0" : ""}">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="fw-semibold">${escapeHTML(dept.name)}</div>
          <div class="small text-secondary">${dept.count} người • ${percent}%</div>
        </div>
        <div class="dept-bar-wrap">
          <div class="dept-bar" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderActivities() {
  const tbody = document.getElementById("activityTableBody");

  if (!dashboardState.activities.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">Chưa có hoạt động gần đây.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dashboardState.activities
    .map(
      (item) => `
    <tr>
      <td class="text-nowrap">${escapeHTML(item.time)}</td>
      <td>${escapeHTML(item.content)}</td>
      <td class="text-nowrap">${escapeHTML(item.owner)}</td>
      <td class="text-nowrap">${renderActivityStatus(item.status)}</td>
    </tr>
  `,
    )
    .join("");
}

function renderActivityStatus(status) {
  const map = {
    "Hoàn tất": "badge-soft-success",
    "Đang xử lý": "badge-soft-primary",
    "Cập nhật": "badge-soft-warning",
    "Cảnh báo": "badge-soft-danger",
  };

  const cls = map[status] || "badge-soft-primary";
  return `<span class="activity-badge ${cls}">${escapeHTML(status)}</span>`;
}

function renderTrendChart() {
  const svg = document.getElementById("staffTrendChart");
  const tooltip = document.getElementById("chartTooltip");
  svg.innerHTML = "";

  const data = dashboardState.trend;
  if (!data.length) {
    svg.innerHTML = `
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="18">
        Chưa có dữ liệu biểu đồ
      </text>
    `;
    return;
  }

  const width = 900;
  const height = 320;
  const padding = { top: 30, right: 30, bottom: 45, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => Math.max(Number(d.hires || 0), Number(d.resignations || 0))), 1);

  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const yScale = (value) => padding.top + chartH - (value / maxValue) * chartH;
  const xScale = (index) => padding.left + index * xStep;

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    const value = Math.round(maxValue - (maxValue / 4) * i);

    svg.innerHTML += `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e5e7eb" stroke-width="1" />
      <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#94a3b8" font-size="12">${value}</text>
    `;
  }

  const hiresPath = buildLinePath(data, xScale, yScale, "hires");
  const resignPath = buildLinePath(data, xScale, yScale, "resignations");

  svg.innerHTML += `
    <path d="${hiresPath}" fill="none" stroke="#0d6efd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path d="${resignPath}" fill="none" stroke="#f59f00" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  `;

  data.forEach((item, index) => {
    const x = xScale(index);
    const yHires = yScale(Number(item.hires || 0));
    const yResign = yScale(Number(item.resignations || 0));

    svg.innerHTML += `
      <text x="${x}" y="${height - 15}" text-anchor="middle" fill="#94a3b8" font-size="12">${escapeHTML(item.label)}</text>

      <circle cx="${x}" cy="${yHires}" r="5" fill="#0d6efd" data-label="${escapeHTML(item.label)}" data-hires="${item.hires}" data-resignations="${item.resignations}"></circle>
      <circle cx="${x}" cy="${yResign}" r="5" fill="#f59f00" data-label="${escapeHTML(item.label)}" data-hires="${item.hires}" data-resignations="${item.resignations}"></circle>
    `;
  });

  svg.querySelectorAll("circle").forEach((circle) => {
    circle.addEventListener("mousemove", (e) => {
      const label = circle.getAttribute("data-label");
      const hires = circle.getAttribute("data-hires");
      const resignations = circle.getAttribute("data-resignations");

      tooltip.style.display = "block";
      tooltip.innerHTML = `
        <div><strong>${label}</strong></div>
        <div>Tiếp nhận: ${hires}</div>
        <div>Nghỉ việc: ${resignations}</div>
      `;

      const rect = svg.getBoundingClientRect();
      tooltip.style.left = `${e.clientX - rect.left + 14}px`;
      tooltip.style.top = `${e.clientY - rect.top - 10}px`;
    });

    circle.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });
}

function buildLinePath(data, xScale, yScale, key) {
  return data
    .map((item, index) => {
      const x = xScale(index);
      const y = yScale(Number(item[key] || 0));
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function mapMetricType(type) {
  switch (type) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    case "primary":
    default:
      return "primary";
  }
}

function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
