import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: String,
    content: String,
    isRead: { type: Boolean, default: false },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Notification", NotificationSchema);
