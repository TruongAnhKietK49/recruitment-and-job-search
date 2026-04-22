import User from "../models/user.js";
import candidateProfile from "../models/candidateProfile.js";
import hrProfile from "../models/hrProfile.js";
import bcrypt from "bcrypt";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let profileData = null;

    if (user.role === "candidate") {
      profileData = await candidateProfile.findOne({ userId: user._id }).populate("skills", "skillName");
    } else if (user.role === "hr") {
      profileData = await hrProfile.findOne({ userId: user._id }).populate("companyId", "companyName website address status");
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
      profileData = await candidateProfile.findOne({ userId: user._id }).populate("skills", "skillName");
    } else if (user.role === "hr") {
      profileData = await hrProfile.findOne({ userId: user._id }).populate("companyId", "companyName website address status");
    }

    res.status(200).json({ user, profileData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");

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
      returnDocument: "after",
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
      console.log("Hello");
      updatedProfile = await hrProfile.findOneAndUpdate({ userId }, req.body, {
        returnDocument: "after",
        runValidators: true,
        upsert: true,
      });
    }

    res.status(200).json({ updatedUser, updatedProfile });
  } catch (error) {
    console.error(error);
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

// Đổi mật khẩu
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

// Trạng thái tài khoản 
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body; 
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy User" });

    user.status = status;
    await user.save();
    res.status(200).json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
