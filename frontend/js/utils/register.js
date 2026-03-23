import { showToast } from "../components/toast.js";

const URL = "http://localhost:5000";

showToast("Vui lòng đăng ký!", "success");

const registerForm = document.getElementById("registerForm");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const phoneInput = document.getElementById("phone");

const fullNameError = document.getElementById("fullNameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const phoneError = document.getElementById("phoneError");
const genderError = document.getElementById("genderError");

const roleInputs = document.querySelectorAll('input[name="role"]');
const genderInputs = document.querySelectorAll('input[name="gender"]');

let selectedRole = document.querySelector('input[name="role"]:checked')?.value || "candidate";
let selectedGender = "";

// --------------------
// Realtime validate
// --------------------
fullNameInput.addEventListener("input", validateFullName);
emailInput.addEventListener("input", validateEmail);
passwordInput.addEventListener("input", validatePassword);
phoneInput.addEventListener("input", validatePhone);

roleInputs.forEach((input) => {
  input.addEventListener("change", () => {
    selectedRole = document.querySelector('input[name="role"]:checked')?.value || "candidate";
  });
});

genderInputs.forEach((input) => {
  input.addEventListener("change", (e) => {
    selectedGender = normalizeGenderValue(e.target.value);
    clearGenderError();
  });
});

// --------------------
// Submit
// --------------------
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const isValid = validateForm();

  if (!isValid) {
    showToast("Vui lòng kiểm tra lại thông tin đăng ký!", "error");
    return;
  }

  const formData = {
    fullName: fullNameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value.trim(),
    phone: phoneInput.value.trim(),
    role: selectedRole,
    gender: selectedGender,
  };

  console.log("Form data:", formData);

  try {
    const res = await fetch(`${URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Đăng ký thất bại");
    }

    showToast("Đăng ký thành công!", "success");

    registerForm.reset();
    resetFormState();
  } catch (error) {
    console.error("Register error:", error);
    showToast(error.message || "Có lỗi xảy ra!", "error");
  }
});

// --------------------
// Validate form
// --------------------
function validateForm() {
  const isFullNameValid = validateFullName();
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isPhoneValid = validatePhone();
  const isGenderValid = validateGender();

  return isFullNameValid && isEmailValid && isPasswordValid && isPhoneValid && isGenderValid;
}

function validateFullName() {
  const value = fullNameInput.value.trim();

  if (value === "") {
    showFieldError(fullNameInput, fullNameError, "Vui lòng nhập họ và tên.");
    return false;
  }

  if (value.length < 2) {
    showFieldError(fullNameInput, fullNameError, "Họ và tên phải có ít nhất 2 ký tự.");
    return false;
  }

  showFieldSuccess(fullNameInput, fullNameError);
  return true;
}

function validateEmail() {
  const value = emailInput.value.trim();
  const emailPattern = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;

  if (value === "") {
    showFieldError(emailInput, emailError, "Vui lòng nhập email.");
    return false;
  }

  if (!emailPattern.test(value)) {
    showFieldError(emailInput, emailError, "Email không đúng định dạng.");
    return false;
  }

  showFieldSuccess(emailInput, emailError);
  return true;
}

function validatePassword() {
  const value = passwordInput.value.trim();

  if (value === "") {
    showFieldError(passwordInput, passwordError, "Vui lòng nhập mật khẩu.");
    return false;
  }

  if (value.length < 6) {
    showFieldError(passwordInput, passwordError, "Mật khẩu phải có ít nhất 6 ký tự.");
    return false;
  }

  showFieldSuccess(passwordInput, passwordError);
  return true;
}

function validatePhone() {
  const value = phoneInput.value.trim();
  const phonePattern = /^(0|\+84)[0-9]{9,10}$/;

  if (value === "") {
    showFieldError(phoneInput, phoneError, "Vui lòng nhập số điện thoại.");
    return false;
  }

  if (!phonePattern.test(value)) {
    showFieldError(phoneInput, phoneError, "Số điện thoại không hợp lệ.");
    return false;
  }

  showFieldSuccess(phoneInput, phoneError);
  return true;
}

function validateGender() {
  const checkedGender = document.querySelector('input[name="gender"]:checked');

  if (!checkedGender) {
    if (genderError) {
      genderError.textContent = "Vui lòng chọn giới tính.";
      genderError.style.display = "block";
    }
    return false;
  }

  selectedGender = normalizeGenderValue(checkedGender.value);
  clearGenderError();
  return true;
}

// --------------------
// Helpers
// --------------------
function normalizeGenderValue(value) {
  if (!value) return "";

  const normalized = value.toUpperCase();

  if (normalized === "MALE") return "MALE";
  if (normalized === "FEMALE") return "FEMALE";
  if (normalized === "OTHER") return "OTHER";

  return normalized;
}

function showFieldError(inputElement, errorElement, message = "") {
  inputElement.classList.add("is-invalid");
  inputElement.classList.remove("is-valid");

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }
}

function showFieldSuccess(inputElement, errorElement) {
  inputElement.classList.remove("is-invalid");
  inputElement.classList.add("is-valid");

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.style.display = "none";
  }
}

function clearGenderError() {
  if (genderError) {
    genderError.textContent = "";
    genderError.style.display = "none";
  }
}

function resetFormState() {
  selectedRole = document.querySelector('input[name="role"]:checked')?.value || "candidate";
  selectedGender = "";

  [fullNameInput, emailInput, passwordInput, phoneInput].forEach((input) => {
    input.classList.remove("is-valid", "is-invalid");
  });

  [fullNameError, emailError, passwordError, phoneError, genderError].forEach((errorEl) => {
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.style.display = "none";
    }
  });
}
