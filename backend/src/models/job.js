import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },

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

    deadline: Date,

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
