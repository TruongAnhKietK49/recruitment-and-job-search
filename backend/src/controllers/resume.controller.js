import Resume from "../models/resume.js";

// Create resume
export const createResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, fileUrl } = req.body;

    const newResume = new Resume({
      userId,
      title,
      fileUrl,
    });

    const savedResume = await newResume.save();

    res.status(201).json(savedResume);
  } catch (error) {
    res.status(500).json({
      message: "Error creating resume",
      error: error.message,
    });
  }
};

// Get all resumes of current candidate
export const getMyResume = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json(resumes);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching resumes",
      error: error.message,
    });
  }
};

// Get resume by ID
export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id).populate(
      "userId",
      "fullName email avatar",
    );

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (
      req.user.role === "candidate" &&
      resume.userId._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.status(200).json(resume);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching resume",
      error: error.message,
    });
  }
};

// Update resume
export const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (resume.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedResume = await Resume.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json(updatedResume);
  } catch (error) {
    res.status(500).json({
      message: "Error updating resume",
      error: error.message,
    });
  }
};

// Delete resume
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (resume.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Resume.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting resume",
      error: error.message,
    });
  }
};
