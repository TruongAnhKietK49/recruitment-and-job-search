import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User"},

    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },

    salaryMin: {
      type: Number,
    },
    salaryMax: {
      type: Number,
    },

    experience: {
      type: String,
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "remote"],
    },

    // Thời gian làm việc
    workingTime: {
      type: String,
    },

    deadline: Date,

    // Địa điểm làm việc
    location: {
      type: String,
    },

    // Số lượng
    quantity: {
      type: Number,
    },

    // Yêu cầu
    requirements: {
      type: String,
    },

    // Quyền lợi
    benefits: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "closed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const Job = mongoose.model("Job", jobSchema);
export default Job;
