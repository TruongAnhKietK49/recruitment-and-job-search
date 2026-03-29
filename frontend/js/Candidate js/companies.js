const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

let currentPage = 1;
let totalPages = 1;
let keyword = '';
let locationFilter = ''; 

function fetchCompanies() {
  let url = `${API_URL}/companies?page=${currentPage}&limit=9&keyword=${encodeURIComponent(keyword)}`;
  if(locationFilter) {
    url += `&location=${encodeURIComponent(locationFilter)}`;
  }

  fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
    .then(res => res.json())
    .then(data => {
      totalPages = data.totalPages || 1;
      renderCompanies(data.companies);
      renderPagination();
    })
    .catch(err => {
      console.error(err);
      document.getElementById('companiesContainer').innerHTML = '<div class="col-12 text-center text-danger">Lỗi kết nối máy chủ</div>';
    });
}

function renderCompanies(companies) {
  const container = document.getElementById('companiesContainer');
  if (!companies || companies.length === 0) {
    container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">Không tìm thấy công ty nào phù hợp.</p></div>';
    return;
  }
  
  container.innerHTML = companies.map(company => {
    const logoContent = company.logo 
        ? `<img src="${company.logo}" alt="${company.companyName}">`
        : `<div class="company-logo-text">${company.companyName?.charAt(0) || 'C'}</div>`;
    
    const activeJobs = company.activeJobs || 0;

    return `
      <div class="col-md-4 col-sm-6 mb-2">
        <div class="company-card" onclick="window.location.href='company-detail.html?id=${company._id}'">
          
          <div class="company-logo-wrapper">
            ${logoContent}
          </div>
          
          <h3 class="company-name">${company.companyName}</h3>
          
          <div class="job-count">${activeJobs} việc đang tuyển</div>
          
          <div class="company-location">${company.address || 'Chưa cập nhật'}</div>
          
        </div>
      </div>
    `;
  }).join('');
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let html = '';

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 5) {
      if (i === 4 && currentPage < totalPages - 2) {
        html += `<li class="page-item disabled"><a class="page-link" href="#">...</a></li>`;
        continue;
      }
      if (i > 3 && i < totalPages - 1 && i !== currentPage) {
        continue;
      }
    }

    html += `<li class="page-item ${currentPage === i ? 'active' : ''}">
              <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>`;
  }
  
  pagination.innerHTML = html;

  pagination.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(link.getAttribute('data-page'));
      if (!isNaN(page) && page !== currentPage) {
        currentPage = page;
        fetchCompanies();
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Tự động cuộn lên đầu khi đổi trang
      }
    });
  });
}

document.getElementById('searchBtn').addEventListener('click', () => {
  keyword = document.getElementById('searchInput').value;
  locationFilter = document.getElementById('locationSelect').value;
  currentPage = 1;
  fetchCompanies();
});

fetchCompanies();