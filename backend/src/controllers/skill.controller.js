import Skill from "../models/skills.js";
import candidateProfile from "../models/candidateProfile.js";

// Create skill
export const createSkill = async (req, res) => {
  try {
    const { skillName } = req.body;

    const existingSkill = await Skill.findOne({
      skillName: { $regex: `^${skillName}$`, $options: "i" },
    });

    if (existingSkill) {
      return res.status(400).json({ message: "Skill already exists" });
    }

    const newSkill = new Skill({ skillName });
    const savedSkill = await newSkill.save();

    res.status(201).json(savedSkill);
  } catch (error) {
    res.status(500).json({
      message: "Error creating skill",
      error: error.message,
    });
  }
};

// Get my skills
export const getMySkills = async (req, res) => {
  try {
    const skills = await Skill.find({}).sort({ skillName: 1 });

    res.status(200).json(skills);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching skills",
      error: error.message,
    });
  }
};

// Get all skills
export const getAllSkills = async (req, res) => {
  try {
    const { keyword } = req.query;
    const query = {};

    if (keyword) {
      query.skillName = { $regex: keyword, $options: "i" };
    }

    const skills = await Skill.find(query).sort({ skillName: 1 });

    res.status(200).json(skills);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching skills",
      error: error.message,
    });
  }
};

// Get skill by UserId
export const getSkillsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await candidateProfile.findOne({ userId })
      .populate("skills"); 

    if (!profile) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    res.status(200).json(profile.skills);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user skills",
      error: error.message,
    });
  }
};

// Get skill by id
export const getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.status(200).json(skill);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching skill",
      error: error.message,
    });
  }
};

// Update skill
export const updateSkill = async (req, res) => {
  try {
    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedSkill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.status(200).json(updatedSkill);
  } catch (error) {
    res.status(500).json({
      message: "Error updating skill",
      error: error.message,
    });
  }
};

// Delete skill
export const deleteSkill = async (req, res) => {
  try {
    const deletedSkill = await Skill.findByIdAndDelete(req.params.id);

    if (!deletedSkill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.status(200).json({ message: "Skill deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting skill",
      error: error.message,
    });
  }
};
