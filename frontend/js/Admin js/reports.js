import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;
const token = localStorage.getItem('token') || sessionStorage.getItem('token');

if (!token) window.location.href = "../../pages/utils/login.html";

// Cấu hình chung cho tất cả các biểu đồ Chart.js cho đẹp
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#64748b';
Chart.defaults.scale.grid.color = '#f1f5f9';

// ================= HÀM KHỞI TẠO =================
async function initReports() {
  try {
    // Gọi đồng thời 3 API để tiết kiệm thời gian chờ
    const [usersRes, jobsRes, compRes] = await Promise.all([
      fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/jobs/admin/all`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_URL}/companies`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const users = await usersRes.json();
    
    const jobsData = await jobsRes.json();
    const jobs = Array.isArray(jobsData) ? jobsData : (jobsData.jobs || []);
    
    const compData = await compRes.json();
    const companies = Array.isArray(compData) ? compData : (compData.companies || []);

    // Tiến hành vẽ 4 biểu đồ
    renderUserChart(Array.isArray(users) ? users : []);
    renderCompanyChart(companies);
    renderJobStatusChart(jobs);
    renderCategoryChart(jobs);

  } catch (error) {
    console.error("Lỗi tải dữ liệu báo cáo:", error);
    alert("Không thể tải dữ liệu báo cáo từ máy chủ!");
  }
}

// ================= 1. BIỂU ĐỒ NGƯỜI DÙNG =================
function renderUserChart(users) {
  const candidateCount = users.filter(u => u.role === 'candidate').length;
  const hrCount = users.filter(u => u.role === 'hr').length;

  const ctx = document.getElementById('userPieChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Ứng viên', 'Nhà tuyển dụng (HR)'],
      datasets: [{
        data: [candidateCount, hrCount],
        backgroundColor: ['#3b82f6', '#8b5cf6'], // Xanh lam, Tím
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
      },
      cutout: '65%'
    }
  });
}

// ================= 2. BIỂU ĐỒ CÔNG TY =================
function renderCompanyChart(companies) {
  const activeCount = companies.filter(c => c.status === 'active').length;
  const pendingCount = companies.filter(c => c.status === 'inactive').length;

  const ctx = document.getElementById('companyPieChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Đang hoạt động', 'Chờ phê duyệt'],
      datasets: [{
        data: [activeCount, pendingCount],
        backgroundColor: ['#10b981', '#f59e0b'], // Xanh lá, Vàng
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
      },
      cutout: '65%'
    }
  });
}

// ================= 3. BIỂU ĐỒ TRẠNG THÁI VIỆC LÀM =================
function renderJobStatusChart(jobs) {
  const approved = jobs.filter(j => j.status === 'approved').length;
  const pending = jobs.filter(j => j.status === 'pending').length;
  const rejected = jobs.filter(j => j.status === 'rejected').length;
  const closed = jobs.filter(j => j.status === 'closed').length;

  const ctx = document.getElementById('jobStatusChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Đã duyệt', 'Chờ duyệt', 'Từ chối', 'Đã gỡ/Đóng'],
      datasets: [{
        data: [approved, pending, rejected, closed],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'], // Xanh lá, Vàng, Đỏ, Xám
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
      }
    }
  });
}

// ================= 4. BIỂU ĐỒ TOP LĨNH VỰC =================
function renderCategoryChart(jobs) {
  // Lọc và đếm số lượng việc làm theo từng Category
  const categoryCounts = {};
  jobs.forEach(job => {
    if (job.category) {
      categoryCounts[job.category] = (categoryCounts[job.category] || 0) + 1;
    }
  });

  // Chuyển object thành mảng, sắp xếp giảm dần và lấy top 10
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = sortedCategories.map(item => item[0]);
  const data = sortedCategories.map(item => item[1]);

  const ctx = document.getElementById('categoryBarChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Số lượng bài đăng',
        data: data,
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Xanh lam nhạt
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.raw} bài đăng`;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true, suggestedMax: Math.max(...data) + 5 },
        x: { grid: { display: false } }
      }
    }
  });
}

// Khởi chạy khi tải trang
initReports();