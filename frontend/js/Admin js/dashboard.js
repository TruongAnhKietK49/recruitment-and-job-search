const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

// --- 1. CẬP NHẬT HEADER (Ngày tháng & Tên Admin) ---
function updateHeaderInfo() {
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
  document.getElementById('currentDate').textContent = `Hôm nay là ${new Date().toLocaleDateString('vi-VN', dateOptions)}`;
  
  // Tạm thời hiển thị tên admin giả lập
  const adminName = "Nguyễn Thị B"; 
  document.getElementById('adminNameDisplay').textContent = adminName;
  const sidebarName = document.getElementById('adminName');
  if(sidebarName) sidebarName.textContent = adminName;
}

// --- 2. GỌI API LẤY THỐNG KÊ ---
async function fetchStats() {
  try {
    const usersRes = await fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
    if (usersRes.ok) {
      const users = await usersRes.json();
      
      // Lọc dữ liệu dựa theo Schema của bạn
      const candidatesCount = users.filter(u => u.role === 'candidate').length;
      const employersCount = users.filter(u => u.role === 'hr').length;
      const lockedCount = users.filter(u => u.status === 'inactive').length;
      
      document.getElementById('statCandidates').innerText = candidatesCount;
      document.getElementById('statEmployers').innerText = employersCount;
      document.getElementById('statLocked').innerText = lockedCount;
    }

    // 2. Thống kê Tin tuyển dụng
    const jobsRes = await fetch(`${API_URL}/jobs?limit=1`, { headers: { Authorization: `Bearer ${token}` } });
    if (jobsRes.ok) {
      const jobsData = await jobsRes.json();
      document.getElementById('statJobs').innerText = jobsData.total || 0;
    }

    // 3. Thống kê Công ty
    const compRes = await fetch(`${API_URL}/companies?limit=1`, { headers: { Authorization: `Bearer ${token}` } });
    if (compRes.ok) {
      const compData = await compRes.json();
      document.getElementById('statCompanies').innerText = compData.total || 0;
    }

    // 4. Thống kê Hồ sơ ứng tuyển (Giả lập hoặc lấy từ API nếu có)
    try {
      const appRes = await fetch(`${API_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } });
      if (appRes.ok) {
        const apps = await appRes.json();
        document.getElementById('statApplications').innerText = apps.length || 0;
      } else {
        document.getElementById('statApplications').innerText = 1900; // Số giả lập nếu API chưa sẵn sàng
      }
    } catch (e) {
      document.getElementById('statApplications').innerText = 1900;
    }

  } catch (err) {
    console.error("Lỗi tải thống kê:", err);
  }
}

// --- 3. VẼ BIỂU ĐỒ (Chart.js) ---
function initChart() {
  const canvas = document.getElementById('hrChart');
  if (!canvas) return; 
  
  const ctx = canvas.getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['2016', '2017', '2018', '2019', '2020'],
      datasets: [
        {
          label: 'Tiếp nhận',
          data: [40, 80, 100, 120, 180],
          borderColor: '#2f80ed',
          backgroundColor: '#2f80ed',
          tension: 0.4, 
          borderWidth: 2,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#2f80ed',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Nghỉ việc',
          data: [25, 40, 70, 75, 90],
          borderColor: '#f2994a',
          backgroundColor: '#f2994a',
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#f2994a',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { usePointStyle: true, boxWidth: 8, font: { size: 14, weight: '500' } }
        },
        tooltip: {
          backgroundColor: '#1a202c', padding: 10, titleFont: { size: 14 }, bodyFont: { size: 14 }
        }
      },
      scales: {
        y: {
          min: 0, max: 200,
          ticks: { stepSize: 50, color: '#718096' },
          grid: { borderDash: [5, 5] } 
        },
        x: {
          ticks: { color: '#718096' },
          grid: { display: false } 
        }
      }
    }
  });
}

// --- 4. KHỞI CHẠY KHI TRANG TẢI XONG ---
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderInfo();
  fetchStats();
  initChart();
});