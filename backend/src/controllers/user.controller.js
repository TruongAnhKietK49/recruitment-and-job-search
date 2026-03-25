import User from "../models/user.js";
import candidateProfile from "../models/candidateProfile.js";
import hrProfile from "../models/hrProfile.js";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let profileData = null;

    if (user.role === "candidate") {
      profileData = await candidateProfile.findOne({ userId: user._id });
    } else if (user.role === "hr") {
      profileData = await hrProfile
        .findOne({ userId: user._id })
        .populate("companyId", "companyName website address status");
    }

    res.status(200).json({ user, profileData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let profileData = null;

    if (user.role === "candidate") {
      profileData = await candidateProfile.findOne({ userId: user._id });
    } else if (user.role === "hr") {
      profileData = await hrProfile
        .findOne({ userId: user._id })
        .populate("companyId", "companyName website address status");
    }

    res.status(200).json({ user, profileData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select(
      "-password",
    );

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const updatedUser = await User.findByIdAndUpdate(userId, req.body, {
      new: true,
    });

    let updatedProfile = null;
    if (userRole === "candidate") {
      updatedProfile = await candidateProfile
        .findOneAndUpdate({ userId }, req.body, {
          returnDocument: "after",
          runValidators: true,
          upsert: true,
        })
        .populate("skills", "skillName");
    } else if (userRole === "hr") {
      updatedProfile = await hrProfile.findOneAndUpdate({ userId }, req.body, {
        returnDocument: "after",
        runValidators: true,
        upsert: true,
      });
    }

    res.status(200).json({ updatedUser, updatedProfile });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
