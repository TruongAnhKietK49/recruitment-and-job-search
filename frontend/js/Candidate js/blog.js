const blogPosts = [
  {
    id: 1,
    title: "Cách viết CV IT chuẩn và thu hút nhà tuyển dụng",
    excerpt: "Lập trình viên viết CV như thế nào để vượt qua vòng CV screening? Tham khảo ngay các mẫu CV IT chuẩn, cách trình bày kỹ năng công nghệ (Tech Stack) và dự án (Side Projects) sao cho ấn tượng nhất.",
    date: "10/04/2026, 09:00",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop",
    url: "https://vn.joboko.com/blog/cach-viet-cv-nwi5592"
  },
  {
    id: 2,
    title: "Lộ trình trở thành Data Analyst (Chuyên viên phân tích dữ liệu)",
    excerpt: "Data Analyst đang là một trong những ngành hot nhất hiện nay. Bài viết cung cấp lộ trình chi tiết từ con số 0, các công cụ cần học như SQL, Python, PowerBI và cách xây dựng Portfolio.",
    date: "08/04/2026, 14:30",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
    url: "https://www.topcv.vn/chuyen-vien-phan-tich-du-lieu-la-gi"
  },
  {
    id: 3,
    title: "Tổng hợp 50 câu hỏi phỏng vấn ReactJS thường gặp nhất",
    excerpt: "Bạn sắp có buổi phỏng vấn Frontend? Hãy ôn tập ngay bộ câu hỏi thực chiến từ cơ bản (Virtual DOM, Hooks) đến nâng cao (Performance, State Management) để tự tin ghi điểm.",
    date: "05/04/2026, 10:15",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop",
    url: "https://bizflycloud.vn/tin-tuc/50-cau-hoi-phong-van-reactjs-tu-co-ban-den-nang-cao-pho-bien-nhat-20241216165234194.htm"
  },
  {
    id: 4,
    title: "Nghệ thuật Deal Lương khéo léo khi phỏng vấn",
    excerpt: "Đừng để bản thân bị thiệt thòi chỉ vì không biết cách thương lượng. Khám phá những 'câu thần chú' để thỏa thuận mức lương đúng với năng lực mà vẫn làm hài lòng nhà tuyển dụng.",
    date: "28/03/2026, 16:20",
    image: "https://th.bing.com/th/id/R.1f1fffd9e422687ed16f42c7777e1b9e?rik=IFDi9Hr3UbeUQg&pid=ImgRaw&r=0",
    url: "https://www.careerlink.vn/cam-nang-luong/cach-deal-luong-kheo-leo/"
  },
  {
    id: 5,
    title: "Top 5 kỹ năng mềm định hình sự nghiệp của dân IT",
    excerpt: "Kỹ năng code giỏi là chưa đủ! Để tiến xa hơn trên con đường trở thành Tech Lead hay PM, lập trình viên cần trang bị ngay 5 kỹ năng mềm cốt lõi (Giao tiếp, Quản lý thời gian, Giải quyết vấn đề...).",
    date: "20/03/2026, 08:45",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop",
    url: "https://vn.joboko.com/blog/ngoai-chuyen-mon-nhan-vien-it-phai-nam-ro-ca-nhung-ky-nang-mem-nay-nwi30"
  },
  {
    id: 6,
    title: "Câu hỏi phỏng vấn Machine Learning & AI thường gặp",
    excerpt: "Tổng hợp các kiến thức cốt lõi thường bị hỏi xoáy đáp xoay trong các buổi phỏng vấn vị trí AI Engineer, từ thuật toán Supervised Learning, Deep Learning đến xử lý Overfitting.",
    date: "15/03/2026, 11:10",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop",
    url: "https://viblo.asia/p/tong-hop-cau-hoi-phong-van-machine-learning-AI-aWj53pLQ56m"
  },
  {
    id: 7,
    title: "Cách tạo Portfolio (Hồ sơ năng lực) ấn tượng",
    excerpt: "Với đặc thù ngành thiết kế, UI/UX hoặc lập trình, Portfolio đóng vai trò quan trọng hơn cả CV. Hướng dẫn cách chọn lọc dự án và show off kỹ năng qua Portfolio online.",
    date: "10/03/2026, 15:00",
    image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&auto=format&fit=crop",
    url: "https://glints.com/vn/blog/cach-tao-portfolio-an-tuong/"
  },
  {
    id: 8,
    title: "Cách viết Email xin việc (Cover Letter) chuẩn nhất",
    excerpt: "Đừng gửi CV trống không! Một email xin việc ngắn gọn, súc tích và thể hiện rõ thiện chí sẽ giúp bạn ăn điểm tuyệt đối trước bộ phận HR. Xem ngay các mẫu email chuẩn.",
    date: "05/03/2026, 09:30",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop",
    url: "https://www.topcv.vn/cach-viet-email-xin-viec-chuan-nhat"
  },
  {
    id: 9,
    title: "Các câu hỏi phỏng vấn Node.js Backend Developer",
    excerpt: "Event Loop hoạt động thế nào? Sự khác nhau giữa process.nextTick và setImmediate? Ôn luyện ngay những câu hỏi phỏng vấn Node.js 'nhức não' nhất.",
    date: "01/03/2026, 14:00",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop",
    url: "https://topdev.vn/blog/cau-hoi-phong-van-nodejs/"
  },
  {
    id: 10,
    title: "Cách trả lời thư mời phỏng vấn ấn tượng",
    excerpt: "Khi được nhận email mời phỏng vấn, phản hồi sao cho chuyên nghiệp? Hướng dẫn cách viết email xác nhận tham gia, từ chối khéo léo hoặc xin dời lịch phỏng vấn.",
    date: "25/02/2026, 16:56",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop",
    url: "https://www.topcv.vn/cach-tra-loi-thu-moi-phong-van"
  }
];

const itemsPerPage = 5; 
let currentPage = 1;
const totalPages = Math.ceil(blogPosts.length / itemsPerPage);

function renderBlog() {
  const container = document.getElementById('blogContainer');

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentPosts = blogPosts.slice(startIndex, endIndex);

  container.innerHTML = currentPosts.map(post => `
    <div class="blog-card" style="cursor: pointer;" onclick="window.open('${post.url}', '_blank')">
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

        renderBlog(); 
        renderPagination(); 

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderBlog();
  renderPagination();
});