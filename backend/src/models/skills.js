import mongoose from "mongoose";

const SkillSchema = new mongoose.Schema({
  skillName: {
    type: String,
  },
});

export default mongoose.model("Skill", SkillSchema);
