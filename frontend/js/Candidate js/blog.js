const blogPosts = [
  {
    id: 1,
    title: "Tổng hợp các câu hỏi phỏng vấn trợ giảng phổ biến nhất",
    excerpt: "Trợ giảng là vị trí đòi hỏi sự kết hợp hài hòa giữa nhiều yếu tố, từ kỹ năng giao tiếp, làm việc với con người cho đến kiến thức chuyên môn, học thuật. Dù mục đích của bạn là ứng tuyển vào vị trí trợ giảng part-time để có thêm thu nhập hay xem đây là bước đệm khởi đầu cho sự nghiệp trong lĩnh vực giáo dục, việc chuẩn bị kỹ lưỡng cho vòng phỏng vấn là rất cần thiết.",
    date: "13/02/2026, 16:56",
    // Ảnh về tuyển dụng / phỏng vấn
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop" 
  },
  {
    id: 2,
    title: "Tổng hợp các câu hỏi phỏng vấn trợ giảng phổ biến nhất",
    excerpt: "Trợ giảng là vị trí đòi hỏi sự kết hợp hài hòa giữa nhiều yếu tố, từ kỹ năng giao tiếp, làm việc với con người cho đến kiến thức chuyên môn, học thuật. Dù mục đích của bạn là ứng tuyển vào vị trí trợ giảng part-time để có thêm thu nhập hay xem đây là bước đệm khởi đầu cho sự nghiệp trong lĩnh vực giáo dục, việc chuẩn bị kỹ lưỡng cho vòng phỏng vấn là rất cần thiết.",
    date: "13/02/2026, 16:56",
    // Ảnh về bắt tay / hợp tác / deal
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop" 
  },
  {
    id: 3,
    title: "Cách trả lời thư mời phỏng vấn ấn tượng",
    excerpt: "Khi được nhà tuyển dụng trao cơ hội tham dự buổi phỏng vấn, việc trả lời thư mời phỏng vấn là một bước quan trọng và không thể thiếu. Tuy nhiên, phản hồi Email xác nhận tham gia phỏng vấn như thế nào cho chuyên nghiệp thì không phải ứng viên nào cũng biết. Bạn không chỉ đơn thuần viết vài dòng đồng ý tham gia, mà Email xác nhận của bạn cần phải...",
    date: "13/02/2026, 16:56",
    // Ảnh về gõ email / làm việc trên laptop
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800&auto=format&fit=crop" 
  }
];

let currentPage = 1;
const totalPages = 68; // Số trang giả lập theo hình

function renderBlog() {
  const container = document.getElementById('blogContainer');
  
  container.innerHTML = blogPosts.map(post => `
    <div class="blog-card" onclick="window.location.href='blog-detail.html?id=${post.id}'">
      <div class="blog-img-wrap">
        <img src="${post.image}" alt="${post.title}">
      </div>
      <div class="blog-content">
        <h3 class="blog-title">${post.title}</h3>
        <p class="blog-excerpt">${post.excerpt}</p>
        <div class="blog-meta">
          ${post.date}
        </div>
      </div>
    </div>
  `).join('');
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
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
        // Ở đây bạn có thể gọi fetch data bài viết mới thay vì chỉ render lại
        renderPagination(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

// Khởi chạy
renderBlog();
renderPagination();