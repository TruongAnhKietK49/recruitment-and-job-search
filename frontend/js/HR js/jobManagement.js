const URL = "http://localhost:5000";

let dataJobs = [];

const token = localStorage.getItem("token");
const user = localStorage.getItem("user");

async function createJobAPI(data) {
    const res = await fetcj(`${URL}/api/jobs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    })
}

document.getElementById("createJobBtn").addEventListener("click", () => {
  handleCreateJob();
});
function handleCreateJob() {
  const form = document.getElementById("createJobForm");

  const data = {
    title: form.title.value,
    description: form.description.value,
    category: form.category.value,
    experience: form.experience.value,
    salaryMin: form.salaryMin.value,
    salaryMax: form.salaryMax.value,
    jobType: form.jobType.value,
  };

  // validate
  if (
    data.title == "" ||
    data.description == "" ||
    data.category == "" ||
    data.experience == "" ||
    data.salaryMin == "" ||
    data.salaryMax == "" ||
    data.jobType == ""
  ) {
    alert("Vui lòng không để trống thông tin! ", "error");
    return;
  }
  if (data.salaryMin > data.salaryMax) {
    alert("Lương tối đa phải lớn hơn lương tối thểu!", "error");
    return;
  }

  // req server

  const modalEl = document.getElementById("createJobModal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();

  form.reset();
  alert("Tạo bài đăng tuyển dụng thành công!");
}
