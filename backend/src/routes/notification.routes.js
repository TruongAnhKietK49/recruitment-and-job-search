import express from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

import {
  getMyNotifications,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyNotifications);
router.post("/", authMiddleware, authorizeRoles("admin", "hr"), createNotification);
router.patch("/:id/read", authMiddleware, markNotificationAsRead);
router.delete("/:id", authMiddleware, deleteNotification);

export default router;