const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

function fetchCompanies() {
  fetch(`${API_URL}/companies`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => renderCompanies(data.companies || []))
    .catch(err => console.error(err));
}

function renderCompanies(companies) {
  const tbody = document.getElementById('companiesTableBody');
  if (!companies.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Không có công ty nào.</td></tr>';
    return;
  }

  tbody.innerHTML = companies.map(comp => `
    <tr>
      <td class="px-4 py-3 fw-bold text-primary">${comp.companyName}</td>
      <td class="py-3 text-truncate" style="max-width: 200px;">${comp.address || 'N/A'}</td>
      <td class="py-3"><a href="${comp.website}" target="_blank">${comp.website || 'N/A'}</a></td>
      <td class="py-3"><span class="badge ${comp.status === 'active' ? 'bg-success' : 'bg-warning'}">${comp.status === 'active' ? 'Đang HĐ' : 'Tạm ngưng'}</span></td>
    </tr>
  `).join('');
}

fetchCompanies();