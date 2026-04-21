import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;

let token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token === 'null' || token === 'undefined') token = null;

let currentPage = 1;
let totalPages = 1;
let keyword = '';
let locationFilter = ''; 

async function fetchCompanies() {
  const container = document.getElementById('companiesContainer');
  container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';

  let url = `${API_URL}/companies?page=${currentPage}&limit=9&keyword=${encodeURIComponent(keyword)}`;
  if(locationFilter) {
    url += `&location=${encodeURIComponent(locationFilter)}`;
  }

  try {
    const res = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    const data = await res.json();
    
    if (res.ok) {
      totalPages = data.totalPages || 1;
      renderCompanies(data.companies);
      renderPagination();
    } else {
      throw new Error(data.message || 'Lỗi server');
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="col-12 text-center text-danger">Lỗi kết nối máy chủ</div>';
  }
}

function renderCompanies(companies) {
  const container = document.getElementById('companiesContainer');
  
  if (!companies || companies.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-buildings text-muted" style="font-size: 3rem;"></i>
        <p class="text-muted mt-3">Không tìm thấy công ty nào phù hợp.</p>
      </div>`;
    return;
  }
  
  container.innerHTML = companies.map(company => {
    const logoContent = company.logoUrl 
        ? `<img src="${company.logoUrl}" alt="${company.companyName}">`
        : `<div class="d-flex align-items-center justify-content-center h-100 bg-light text-primary" style="font-size: 4rem; font-weight: bold;">${company.companyName?.charAt(0) || 'C'}</div>`;

    const activeJobs = company.activeJobsCount > 0 
      ? `<span class="text-success fw-bold">${company.activeJobsCount} việc làm đang tuyển</span>` 
      : `<span class="text-muted fst-italic">Chưa có vị trí tuyển dụng</span>`;

    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="company-card" onclick="window.location.href='company-detail.html?id=${company._id}'">
          
          <div class="company-logo-wrapper">
            ${logoContent}
          </div>
          
          <div class="px-1">
            <h5 class="company-name text-truncate" title="${company.companyName}">${company.companyName}</h5>
            <div class="job-count"><i class="bi bi-briefcase me-1"></i>${activeJobs}</div>
            <div class="company-location text-truncate" title="${company.address}"><i class="bi bi-geo-alt me-1"></i>${company.address || 'Chưa cập nhật'}</div>
          </div>
          
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
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
      }
    });
  });
}

let searchTimeout;
document.getElementById('searchInput')?.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    keyword = e.target.value.trim();
    currentPage = 1;
    fetchCompanies();
  }, 500);
});

document.getElementById('locationSelect')?.addEventListener('change', (e) => {
  locationFilter = e.target.value;
  currentPage = 1;
  fetchCompanies();
});

document.getElementById('searchBtn')?.addEventListener('click', () => {
  currentPage = 1;
  fetchCompanies();
});

document.addEventListener('DOMContentLoaded', fetchCompanies);