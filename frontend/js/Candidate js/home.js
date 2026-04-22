import BASE_URL from '../utils/url.js';
const API_URL = `${BASE_URL}/api`;

let jobsData = [];
let savedJobIds = [];
let currentPage = 1;
let totalPages = 1;

const token = sessionStorage.getItem('token') || localStorage.getItem('token') || null;
const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
const currentUser = userStr ? JSON.parse(userStr) : null;
const isCandidate = currentUser && currentUser.role === 'candidate';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => parent.querySelectorAll(selector);

const apiHeaders = {
  "Content-Type": "application/json",
  ...(token && { Authorization: `Bearer ${token}` })
};

async function requestApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: apiHeaders,
      ...options,
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) throw new Error(data?.message || "Có lỗi xảy ra");
    return data;
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}

function formatSalary(min, max) {
  if (!min && !max) return 'Thỏa thuận';
  const normalize = (num) => num >= 1000000 ? num / 1000000 : num;
  const minTrieu = normalize(min);
  const maxTrieu = normalize(max);

  if (minTrieu && maxTrieu) return `${minTrieu} - ${maxTrieu} triệu`;
  if (minTrieu) return `Từ ${minTrieu} triệu`;
  if (maxTrieu) return `Lên đến ${maxTrieu} triệu`;
  return 'Thỏa thuận';
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function loadSavedJobs() {
  if (!token || !isCandidate) return [];
  try {
    const data = await requestApi("/jobs/save-job/me");
    return Array.isArray(data) ? data.map(item => item.jobId?._id || item.jobId) : [];
  } catch {
    return [];
  }
}

async function loadJobs() {
  const params = new URLSearchParams({ page: currentPage, limit: 12 });

  const filters = {
    keyword: $("#heroSearchInput")?.value.trim(),
    location: $("#locationFilter")?.value,
    category: $("#categoryFilter")?.value,
    jobType: $("#typeFilter")?.value,
    salaryRange: $("#salaryFilter")?.value,
    experience: $("#expFilter")?.value,
  };

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  try {
    const data = await requestApi(`/jobs?${params.toString()}`);
    return data;
  } catch {
    return null;
  }
}

function renderJobCard(job) {
  const companyName = job.companyId?.companyName || 'Công ty ẩn danh';
  const companyLogo = job.companyId?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=random`;
  const jobLocation = job.location || job.companyId?.address || 'Chưa cập nhật địa chỉ';

  const jobTypeMap = {
    'full-time': 'Toàn thời gian',
    'part-time': 'Bán thời gian',
    'internship': 'Thực tập sinh',
    'remote': 'Làm từ xa'
  };
  const displayJobType = jobTypeMap[job.jobType] || job.jobType || 'Chưa cập nhật';

  const jobIdStr = job._id?.toString() || "";
  const isSaved = savedJobIds.map(id => id.toString()).includes(jobIdStr);
  const heartClass = isSaved ? 'bi-heart-fill text-danger' : 'bi-heart text-muted';

  return `
  <div class="col-lg-4 col-md-6 mb-4"> 
    <div class="job-card cursor-pointer h-100 p-4 border rounded-4 shadow-sm position-relative bg-white d-flex flex-column" 
         style="transition: all 0.3s;" 
         onmouseover="this.classList.add('shadow-lg'); this.style.transform='translateY(-5px)';" 
         onmouseout="this.classList.remove('shadow-lg'); this.style.transform='translateY(0)';" 
         onclick="window.location.href='job-detail.html?id=${job._id}'">
      
      <button class="btn btn-light position-absolute top-0 end-0 m-3 rounded-circle border-0 d-flex align-items-center justify-content-center p-0" 
              style="width: 40px; height: 40px; z-index: 2; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" 
              onclick="event.stopPropagation(); window.toggleSaveJob('${job._id}', this);">
        <i class="${heartClass} fs-5" style="margin-top: 2px;"></i>
      </button>

      <div class="d-flex align-items-center mb-3">
        <img src="${companyLogo}" alt="${companyName}" class="rounded border p-1 me-3 bg-white flex-shrink-0" style="width: 60px; height: 60px; object-fit: contain;">
        
        <div style="width: calc(100% - 75px); padding-right: 40px;">
          <h5 class="job-title text-truncate mb-1 fw-bold text-dark" title="${job.title}">${job.title}</h5>
          <div class="company-name text-muted small text-truncate" title="${companyName}">${companyName}</div>
        </div>
      </div>
      
      <div class="job-info text-muted small mb-3">
        <div class="mb-2 text-truncate" title="${jobLocation}"><i class="bi bi-geo-alt text-primary me-2"></i>${jobLocation}</div>
        <div class="mb-2"><i class="bi bi-briefcase text-primary me-2"></i>Kinh nghiệm: ${job.experience || 'Không yêu cầu'}</div>
        <div class="mb-2"><i class="bi bi-clock text-primary me-2"></i>${displayJobType}</div>
      </div>
      
      <div class="salary fw-bold text-success border-top pt-3 mt-auto fs-5">
        <i class="bi bi-cash-coin me-1"></i> ${formatSalary(job.salaryMin, job.salaryMax)}
      </div>
    </div>
  </div>
  `;
}

async function refreshJobsView() {
  const jobsGrid = $('#jobsGrid');
  const noJobsFound = $('#noJobsFound');

  jobsGrid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
  noJobsFound.classList.add('d-none');

  const responseData = await loadJobs();

  if (responseData === null) {
    jobsGrid.innerHTML = `<div class="col-12 alert alert-danger">Không thể tải dữ liệu việc làm. Vui lòng thử lại.</div>`;
    $('#jobsPagination').innerHTML = '';
    return;
  }

  jobsData = responseData.jobs || [];
  totalPages = responseData.totalPages || 1;

  if (!jobsData.length) {
    jobsGrid.innerHTML = '';
    noJobsFound.classList.remove('d-none');
    $('#jobsPagination').innerHTML = '';
    return;
  }

  jobsData = shuffleArray(jobsData);

  jobsGrid.innerHTML = jobsData.map(renderJobCard).join('');
  renderJobsPagination();
}


window.toggleSaveJob = async function (jobId, btnElement) {
  if (!token) {
    alert('Vui lòng đăng nhập để lưu việc làm!');
    window.location.href = '../../pages/utils/login.html';
    return;
  }

  if (!isCandidate) {
    alert('Chỉ tài khoản Ứng viên mới có thể lưu việc làm!');
    return;
  }

  const icon = btnElement.querySelector('i');
  const isCurrentlySaved = savedJobIds.includes(jobId);

  try {
    if (isCurrentlySaved) {
      await requestApi(`/jobs/save-job/${jobId}`, { method: 'DELETE' });
      savedJobIds = savedJobIds.filter(id => id !== jobId);

      icon.className = 'bi bi-heart text-muted fs-5';
    } else {
      await requestApi(`/jobs/save-job`, {
        method: 'POST',
        body: JSON.stringify({ jobId })
      });
      savedJobIds.push(jobId);
      icon.className = 'bi bi-heart-fill text-danger fs-5';
    }
  } catch (err) {
    alert('Lỗi: Không thể cập nhật trạng thái lưu việc làm.');
  }
};

function syncCategoryCards(activeCategory) {
  $$('.category-card').forEach(card => {
    card.classList.remove('active');
    const span = card.querySelector('span');
    if (span) span.classList.add('text-dark');

    if (card.getAttribute('data-category') === activeCategory) {
      card.classList.add('active');
      if (span) span.classList.remove('text-dark');
    }
  });
}

// 5. GẮN SỰ KIỆN (BIND EVENTS)
function bindStaticEvents() {
  $('#heroSearchBtn')?.addEventListener('click', () => {
    currentPage = 1;
    refreshJobsView();
  });

  let searchTimeout;
  $('#heroSearchInput')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout); 

    searchTimeout = setTimeout(() => {
      currentPage = 1;

      const jobsGrid = $('#jobsGrid');
      if(jobsGrid) jobsGrid.style.opacity = '0.5'; 
      
      refreshJobsView().then(() => {
        if(jobsGrid) jobsGrid.style.opacity = '1';
      });
    }, 500); 
  });

  $('#heroSearchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      refreshJobsView();
    }
  });

  const filterSelectors = ['#categoryFilter', '#typeFilter', '#salaryFilter', '#expFilter', '#locationFilter'];
  filterSelectors.forEach(selector => {
    $(selector)?.addEventListener('change', (e) => {
      if (selector === '#categoryFilter') syncCategoryCards(e.target.value);
      currentPage = 1;
      refreshJobsView();
    });
  });

  $('#clearFiltersBtn')?.addEventListener('click', () => {
    if ($('#heroSearchInput')) $('#heroSearchInput').value = '';
    if ($('#locationFilter')) $('#locationFilter').value = '';
    filterSelectors.forEach(selector => {
      if ($(selector)) $(selector).value = '';
    });

    syncCategoryCards('');

    currentPage = 1;
    refreshJobsView();
  });

  $$('.category-card').forEach(card => {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      const selectedCategory = this.getAttribute('data-category') || '';
      const categorySelect = $('#categoryFilter');
      if (categorySelect) categorySelect.value = selectedCategory;

      syncCategoryCards(selectedCategory);
      currentPage = 1;
      refreshJobsView();
    });
  });
  bindAiRefreshEvent();
}

// ================= AI RECOMMENDATION LOGIC  =================
const getCacheKey = () => {
  const uid = currentUser?._id || currentUser?.userId || 'guest';
  return `ai_jobs_cache_${uid}`;
};
const CLIENT_CACHE_TTL = 2 * 60 * 60 * 1000;

function getClientCache() {
  try {
    const raw = localStorage.getItem(getCacheKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.expiredAt) { localStorage.removeItem(getCacheKey()); return null; }
    return parsed.data;
  } catch { return null; }
}

function setClientCache(data) {
  try { localStorage.setItem(getCacheKey(), JSON.stringify({ data, expiredAt: Date.now() + CLIENT_CACHE_TTL })); } catch {}
}

function clearClientCache() {
  try { localStorage.removeItem(getCacheKey()); } catch {}
}

let aiLoading = false;

async function loadAiRecommendations(isForceReload = false) {
  const section   = $('#ai-recommendation-section');
  const container = $('#ai-jobs-container');
  const loading   = $('#ai-loading');

  if (!token || !isCandidate) { if (section) section.style.display = 'none'; return; }
  if (section) section.style.display = 'block';
  if (aiLoading && !isForceReload) return;

  if (isForceReload) { clearClientCache(); if (container) container.innerHTML = ''; }

  if (!isForceReload) {
    const cached = getClientCache();
    if (cached?.length > 0) { renderAiCards(cached, container, loading); return; }
  }

  if (loading) loading.classList.remove('d-none');
  if (container) container.innerHTML = '';
  aiLoading = true;

  try {
    let data = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        data = await requestApi('/ai/recommendations');
        break;
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes("cập nhật Profile")) {
          if (loading) loading.classList.add('d-none');
          if (container) container.innerHTML = `
            <div class="col-12 text-center py-4">
              <div class="alert alert-info d-inline-block shadow-sm" style="border-radius:15px;">
                <i class="bi bi-person-vcard me-2"></i> Bạn cần <a href="profile.html" class="fw-bold text-info">cập nhật Hồ sơ (Kỹ năng)</a> để AI gợi ý việc làm nhé!
              </div>
            </div>`;
          return;
        }
        if (msg.includes("quota") || msg.includes("Quota") || msg.includes("timeout")) throw err;
        if (attempt < 2) await new Promise(r => setTimeout(r, 15000)); 
        else throw err;
      }
    }

    if (!data || data.length === 0) {
      if (loading) loading.classList.add('d-none');
      if (container) container.innerHTML = `
        <div class="col-12 text-center py-4">
          <div class="alert alert-warning d-inline-block shadow-sm" style="border-radius:15px;">
            <i class="bi bi-robot me-2"></i> AI chưa tìm thấy việc phù hợp. Hãy cập nhật thêm kỹ năng nhé!
          </div>
        </div>`;
      return;
    }

    setClientCache(data);
    renderAiCards(data, container, loading);

  } catch (err) {
    console.error("Lỗi AI Recommend:", err);
    if (loading) loading.classList.add('d-none');
    const msg = err.message || '';
    const errText = msg.includes("quota") || msg.includes("Quota")
      ? 'Hệ thống AI đang hết lượt gọi. Vui lòng thử lại sau vài phút!'
      : msg.includes("timeout") ? 'AI phân tích quá lâu. Vui lòng thử lại!'
      : 'Không thể kết nối AI. Vui lòng thử lại!';
    if (container) container.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="alert alert-danger d-inline-block shadow-sm" style="border-radius:15px;">
          <i class="bi bi-exclamation-triangle-fill me-2"></i> ${errText}
          <div class="mt-2">
            <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="loadAiRecommendations(true)">
              <i class="bi bi-arrow-clockwise me-1"></i> Thử lại
            </button>
          </div>
        </div>
      </div>`;
  } finally {
    aiLoading = false;
  }
}

window.loadAiRecommendations = loadAiRecommendations;

function bindAiRefreshEvent() {
  const btnRefresh = $('#btnRefreshAi');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async function () {
      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang cập nhật...';
      await loadAiRecommendations(true);
      this.disabled = false;
      this.innerHTML = '<i class="bi bi-arrow-clockwise me-1" id="refreshAiIcon"></i> Gợi ý';
    });
  }
}


async function initHomePage() {
  bindStaticEvents();
  savedJobIds = await loadSavedJobs();
  await Promise.all([
    refreshJobsView(),
    loadAiRecommendations()
  ]);
}

function renderJobsPagination() {
  const pagination = $('#jobsPagination');
  if (!pagination) return;
  
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

  $$('.page-link', pagination).forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(link.getAttribute('data-page'));
      if (!isNaN(page) && page !== currentPage) {
        currentPage = page;
        refreshJobsView(); 

        const jobsSection = $('#jobsContainer');
        if (jobsSection) {
          const y = jobsSection.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    });
  });
}


document.addEventListener('DOMContentLoaded', initHomePage);