import mongoose from "mongoose";

const JobViewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  viewDate: { type: Date, default: Date.now },
});

export default mongoose.model("JobView", JobViewSchema);
