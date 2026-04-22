import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
const currentUser = userStr ? JSON.parse(userStr) : null;

if (!token || currentUser?.role !== 'admin') {
  window.location.href = "../../pages/utils/login.html";
}

function updateHeaderInfo() {
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = `Hôm nay là ${new Date().toLocaleDateString('vi-VN', dateOptions)}`;

  if (currentUser && currentUser.fullName) {
    document.getElementById('adminNameDisplay').textContent = currentUser.fullName;
  }
}

async function fetchStats() {
  try {
    const usersRes = await fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
    if (usersRes.ok) {
      const users = await usersRes.json();
      const candidatesCount = users.filter(u => u.role === 'candidate').length;
      const employersCount = users.filter(u => u.role === 'hr').length;
      const lockedCount = users.filter(u => u.status === 'inactive').length;
      
      document.getElementById('statCandidates').innerText = candidatesCount;
      document.getElementById('statEmployers').innerText = employersCount;
      document.getElementById('statLocked').innerText = lockedCount;
    }

    const jobsRes = await fetch(`${API_URL}/jobs/admin/all`, { headers: { Authorization: `Bearer ${token}` } });
    if (jobsRes.ok) {
      const jobsData = await jobsRes.json();
      const jobsArray = Array.isArray(jobsData) ? jobsData : (jobsData.jobs || []);
      document.getElementById('statJobs').innerText = jobsArray.length;
    }

    const compRes = await fetch(`${API_URL}/companies`, { headers: { Authorization: `Bearer ${token}` } });
    if (compRes.ok) {
      const compData = await compRes.json();
      const companiesArray = Array.isArray(compData) ? compData : (compData.companies || []);
      document.getElementById('statCompanies').innerText = companiesArray.length;
    }

    try {
      const appRes = await fetch(`${API_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } });
      if (appRes.ok) {
        const appsData = await appRes.json();

        document.getElementById('statApplications').innerText = appsData.total || 0;
      } else {
        document.getElementById('statApplications').innerText = "0"; 
      }
    } catch (e) {
      console.error("Lỗi tải số lượng ứng tuyển:", e);
      document.getElementById('statApplications').innerText = "0";
    }

  } catch (err) {
    console.error("Lỗi tải thống kê:", err);
  }
}

function initChart() {
  const canvas = document.getElementById('systemChart');
  if (!canvas) return; 
  
  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
      datasets: [
        {
          label: 'Người dùng mới',
          data: [150, 230, 200, 320, 450, 500],
          borderColor: '#2f80ed',
          backgroundColor: 'rgba(47, 128, 237, 0.1)',
          fill: true, 
          tension: 0.4, 
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#2f80ed',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Bài đăng việc làm mới',
          data: [80, 120, 150, 200, 280, 310],
          borderColor: '#10b981', 
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#10b981',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, 
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { usePointStyle: true, boxWidth: 8, font: { size: 13, family: 'Inter' } }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
          padding: 12, 
          titleFont: { size: 13, family: 'Inter' }, 
          bodyFont: { size: 13, family: 'Inter' },
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          min: 0, 
          ticks: { color: '#64748b', font: { family: 'Inter' } },
          grid: { color: '#f1f5f9', borderDash: [5, 5] },
          border: { display: false } 
        },
        x: {
          ticks: { color: '#64748b', font: { family: 'Inter' } },
          grid: { display: false },
          border: { display: false }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateHeaderInfo();
  fetchStats();
  initChart();
});