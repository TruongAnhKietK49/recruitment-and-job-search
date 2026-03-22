import hrProfile from "../models/hrProfile.js";

export const updateHrProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updatedHrProfile = await hrProfile.findByIdAndUpdate(
      userId,
      req.body,
      { new: true, runValidators: true },
    );
    if (!updatedHrProfile) {
      return res.status(404).json({ message: "HrProfile not found" });
    }
    res.status(200).json(updatedHrProfile);
  } catch (error) {
    res.status(500).json({
      message: "Error updating HrProfile",
      error: error.message,
    });
  }
};

export const deleteHrProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const deletedHrProfile = await hrProfile.findByIdAndDelete(userId);
    if (!deletedHrProfile) {
      return res.status(404).json({ message: "HrProfile not found" });
    }
    res.status(200).json({ message: "HrProfile deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting HrProfile",
      error: error.message,
    });
  }
};
