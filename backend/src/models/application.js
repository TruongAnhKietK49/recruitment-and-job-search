import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },

    status: {
      type: String,
      enum: ["pending", "reviewing", "accepted", "rejected"],
      default: "pending",
    },

    applyDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Application", ApplicationSchema);
