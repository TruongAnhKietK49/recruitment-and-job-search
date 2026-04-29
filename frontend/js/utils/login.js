(function () {
  import URL from "./url.js";

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberMeInput = document.getElementById("rememberMe");

  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");

  const toastEl = document.getElementById("liveToast");
  const toastMsg = document.getElementById("toastMessage");

  const togglePasswordBtn = document.getElementById("togglePassword");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");

  let bsToast;

  function showToast(message, isSuccess = true) {
    if (!toastEl || !toastMsg) {
      console.error("Không tìm thấy phần tử toast.");
      return;
    }

    toastMsg.innerHTML = message;
    toastEl.style.display = "flex";
    toastEl.style.borderLeftColor = isSuccess ? "#2f80ed" : "#e55353";

    toastEl.classList.remove("text-bg-success", "text-bg-danger");
    toastEl.classList.add(isSuccess ? "text-bg-success" : "text-bg-danger");

    if (!bsToast) {
      bsToast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3800,
      });
    }

    bsToast.show();

    toastEl.addEventListener(
      "hidden.bs.toast",
      function () {
        toastEl.style.display = "none";
      },
      { once: true },
    );
  }

  function showFieldError(input, errorEl, message = "") {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");

    if (errorEl) {
      if (message) errorEl.textContent = message;
      errorEl.style.display = "block";
    }
  }

  function showFieldSuccess(input, errorEl) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");

    if (errorEl) {
      errorEl.style.display = "none";
    }
  }

  function resetValidation() {
    [emailInput, passwordInput].forEach((input) => {
      input.classList.remove("is-invalid", "is-valid");
    });

    [emailError, passwordError].forEach((errorEl) => {
      if (errorEl) errorEl.style.display = "none";
    });
  }

  function validateEmail() {
    const email = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;

    if (email === "") {
      showFieldError(emailInput, emailError, "Vui lòng nhập email.");
      return false;
    }

    if (!emailPattern.test(email)) {
      showFieldError(emailInput, emailError, "Email không đúng định dạng.");
      return false;
    }

    showFieldSuccess(emailInput, emailError);
    return true;
  }

  function validatePassword() {
    const password = passwordInput.value;

    if (password.trim() === "") {
      showFieldError(passwordInput, passwordError, "Vui lòng nhập mật khẩu.");
      return false;
    }

    if (password.length < 6) {
      showFieldError(passwordInput, passwordError, "Mật khẩu phải có ít nhất 6 ký tự.");
      return false;
    }

    showFieldSuccess(passwordInput, passwordError);
    return true;
  }

  function validateForm() {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    return isEmailValid && isPasswordValid;
  }

  function saveAuth(data, rememberMe) {
    const storage = rememberMe ? localStorage : sessionStorage;
    if (data.token) {
      storage.setItem("token", data.token);
    }

    if (data.accessToken) {
      storage.setItem("token", data.accessToken);
    }

    if (data.refreshToken) {
      storage.setItem("refreshToken", data.refreshToken);
    }

    if (data.user) {
      storage.setItem("user", JSON.stringify(data.user));
    }

    if (data.role) {
      storage.setItem("role", data.role);
    } else if (data.user?.role) {
      storage.setItem("role", data.user.role);
    }
  }

  function redirectAfterLogin(data) {
    const role = data?.user?.role || data?.role || "";

    if (role.toLowerCase() === "hr") {
      window.location.href = "../../pages/HR Pages/candidateManagement.html";
      return;
    }

    if (role.toLowerCase() === "candidate") {
      window.location.href = "../../pages/Candidate Pages/index.html";
      return;
    }

    if (role.toLowerCase() === "admin") {
      window.location.href = "../../pages/Admin Pages/dashboard.html";
      return;
    }

    window.location.href = "";
  }

  async function handleLogin() {
    const loginData = {
      email: emailInput.value.trim(),
      password: passwordInput.value,
      rememberMe: rememberMeInput ? rememberMeInput.checked : false,
    };

    const res = await fetch(`${URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: loginData.email,
        password: loginData.password,
      }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch (err) {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data.message || "Đăng nhập thất bại.");
    }
    saveAuth(data, loginData.rememberMe);

    showToast("Đăng nhập thành công. Chào mừng bạn quay trở lại!", true);

    setTimeout(() => {
      redirectAfterLogin(data);
    }, 1000);
  }

  emailInput.addEventListener("blur", validateEmail);
  passwordInput.addEventListener("blur", validatePassword);

  emailInput.addEventListener("input", () => {
    if (emailInput.classList.contains("is-invalid")) validateEmail();
  });

  passwordInput.addEventListener("input", () => {
    if (passwordInput.classList.contains("is-invalid")) validatePassword();
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    resetValidation();

    const isValid = validateForm();
    if (!isValid) {
      showToast("Vui lòng kiểm tra lại thông tin đăng nhập!", false);
      return;
    }

    try {
      await handleLogin();
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message || "Có lỗi xảy ra khi đăng nhập.", false);
    }
  });

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", function () {
      const icon = this.querySelector("i");

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        if (icon) {
          icon.classList.remove("bi-eye-slash");
          icon.classList.add("bi-eye");
        }
      } else {
        passwordInput.type = "password";
        if (icon) {
          icon.classList.remove("bi-eye");
          icon.classList.add("bi-eye-slash");
        }
      }
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (e) {
      e.preventDefault();
      showToast("Chức năng quên mật khẩu sẽ sớm được cập nhật.", false);
    });
  }
})();
