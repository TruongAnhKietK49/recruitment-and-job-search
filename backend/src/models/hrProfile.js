import mongoose from "mongoose";

const hrProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    avatar: {
      type: String,
    },
    address: {
      type: String,
    },
    header: {
      type: String,
    },
    position: {
      type: String,
      required: true,
    },
    verifiedStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("HrProfile", hrProfileSchema);
