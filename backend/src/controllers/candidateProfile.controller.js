import CandidateProfile from "../models/candidateProfile.js";

export const upsertCandidateProfile = async (req, res) => {
  try {
    const { education, avatar, expectedSalary, expSummary, address, skill } = req.body;

    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user.userId },
      {
        userId: req.user.userId,
        education,
        avatar,
        expectedSalary,
        expSummary,
        address,
        skills: skill,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Error saving candidate profile",
      error: error.message,
    });
  }
};

export const getMyCandidateProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({
      userId: req.user.userId,
    }).populate("userId", "fullName email avatar status");

    if (!profile) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching candidate profile",
      error: error.message,
    });
  }
};

export const deleteCandidateProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({
      userId: req.user.userId,
    });

    if (!profile) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    await CandidateProfile.findByIdAndDelete(profile._id);

    res.status(200).json({ message: "Candidate profile deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting candidate profile",
      error: error.message,
    });
  }
};
