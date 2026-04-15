const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

function loadReportData() {
  fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.json())
    .then(users => {
      let candidateCount = users.filter(u => u.role === 'candidate').length;
      let hrCount = users.filter(u => u.role === 'hr').length;

      const ctx = document.getElementById('userPieChart').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Ứng viên', 'Nhà tuyển dụng'],
          datasets: [{
            data: [candidateCount, hrCount],
            backgroundColor: ['#2f80ed', '#f2994a']
          }]
        }
      });
    })
    .catch(err => console.error(err));
}

loadReportData();