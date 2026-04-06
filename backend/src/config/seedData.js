import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import User from "../models/user.js";
import Company from "../models/company.js";
import Job from "../models/job.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 Đã kết nối Database thành công!");

    // Xóa dữ liệu cũ của Job và Company (Tùy chọn: Nếu muốn làm sạch DB trước khi seed)
    // await Job.deleteMany();
    // await Company.deleteMany();

    // 2. Tạo một tài khoản HR ảo để làm chủ công ty
    const hashedPassword = await bcrypt.hash("123456", 10);
    let hrUser = await User.findOne({ email: "hr_seed@example.com" });
    
    if (!hrUser) {
      hrUser = await User.create({
        fullName: "HR Tech Company",
        email: "hr_seed@example.com",
        password: hashedPassword,
        phone: "0999999999",
        gender: "male",
        birthday: new Date("1990-01-01"),
        role: "hr",
        status: "active",
      });
      console.log("👤 Đã tạo tài khoản HR giả lập.");
    }

    // 3. Tạo 2 Công ty giả lập
    const company1 = await Company.create({
      companyName: "TechCorp Global",
      address: "Quận 1, TP Hồ Chí Minh",
      category: "IT",
      phoneCompany: "0123456789",
      website: "https://techcorp.com",
      description: "Công ty công nghệ đa quốc gia hàng đầu.",
      createdBy: hrUser._id,
      logoUrl: "https://ui-avatars.com/api/?name=TechCorp&background=0D8ABC&color=fff",
      members: [{ user: hrUser._id, role: "owner" }]
    });

    const company2 = await Company.create({
      companyName: "Creative Design VN",
      address: "Cầu Giấy, Hà Nội",
      category: "Design",
      phoneCompany: "0987654321",
      website: "https://creativedesign.vn",
      description: "Agency thiết kế và Marketing số 1 Việt Nam.",
      createdBy: hrUser._id,
      logoUrl: "https://ui-avatars.com/api/?name=Creative&background=28a745&color=fff",
      members: [{ user: hrUser._id, role: "owner" }]
    });
    console.log("🏢 Đã tạo 2 công ty mẫu.");

    const jobsData = [
      {
        companyId: company1._id,
        title: "Senior ReactJS Developer",
        description: "Yêu cầu 3 năm kinh nghiệm React, Redux...",
        category: "Programming and Tech", // <
        salaryMin: 25,
        salaryMax: 40,
        experience: "3 - 5 năm",
        jobType: "full-time",
        status: "approved" 
      },
      {
        companyId: company1._id,
        title: "Node.js Backend Engineer",
        description: "Xây dựng hệ thống API với Express và MongoDB...",
        category: "Programming and Tech",
        salaryMin: 20,
        salaryMax: 35,
        experience: "1 - 3 năm",
        jobType: "full-time",
        status: "approved"
      },
      {
        companyId: company2._id,
        title: "Chuyên viên UI/UX Design",
        description: "Thiết kế giao diện app mobile bằng Figma...",
        category: "Graphics and Design",
        salaryMin: 15,
        salaryMax: 25,
        experience: "1 - 3 năm",
        jobType: "full-time",
        status: "approved"
      },
      {
        companyId: company2._id,
        title: "Trưởng nhóm Digital Marketing",
        description: "Chạy ads Facebook, Google, lên plan marketing...",
        category: "Digital Marketing",
        salaryMin: 30,
        salaryMax: 50,
        experience: "Trên 5 năm",
        jobType: "full-time",
        status: "approved"
      },
      {
        companyId: company1._id,
        title: "Data Analyst / Business Intelligence",
        description: "Phân tích dữ liệu bằng SQL, Python, PowerBI...",
        category: "Business",
        salaryMin: 18,
        salaryMax: 30,
        experience: "1 - 3 năm",
        jobType: "remote",
        status: "approved"
      }
    ];

    await Job.insertMany(jobsData);
    console.log(`💼 Đã chèn thành công ${jobsData.length} việc làm vào Database!`);

    process.exit(); 
  } catch (error) {
    console.error("❌ Lỗi khi seed data:", error);
    process.exit(1);
  }
};

seedDatabase();