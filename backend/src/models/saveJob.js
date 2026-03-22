import mongoose from "mongoose";

const SavedJobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  },
  { timestamps: true },
);

export default mongoose.model("SavedJob", SavedJobSchema);