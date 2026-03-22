import mongoose from "mongoose";

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    avatar: {
      type: String,
    },
    education: {
      type: String,
    },
    expSummary: {
      type: String,
    },
    expectedSalary: {
      type: Number,
    },
    address: {
      type: String,
    },
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("CandidateProfile", candidateProfileSchema);
