import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedRole: {
      type: String,
      enum: ["admin", "hr", "candidate", "member"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

joinRequestSchema.index(
  { company: 1, user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);
export default JoinRequest;
