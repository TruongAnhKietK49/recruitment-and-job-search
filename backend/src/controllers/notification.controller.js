import Notification from "../models/notification.js";

// Create notification
export const createNotification = async (req, res) => {
  try {
    const { userId, content } = req.body;

    const newNotification = new Notification({
      userId,
      content,
      isRead: false,
    });

    const savedNotification = await newNotification.save();

    res.status(201).json(savedNotification);
  } catch (error) {
    res.status(500).json({
      message: "Error creating notification",
      error: error.message,
    });
  }
};

// Get my notifications
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20);

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải thông báo",
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating notification",
      error: error.message,
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting notification",
      error: error.message,
    });
  }
};
