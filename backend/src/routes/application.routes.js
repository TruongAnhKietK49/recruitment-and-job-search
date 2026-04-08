import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

import {
  createApplication,
  getAllApplications,
  getCompanyApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
} from "../controllers/application.controller.js";

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("candidate"), createApplication);

router.get("/", authMiddleware, getAllApplications);
router.get("/company/:companyId", authMiddleware, authorizeRoles("admin", "hr"), getCompanyApplications);
router.get("/:id", authMiddleware, getApplicationById);


router.patch("/:id/status", authMiddleware, authorizeRoles("admin", "hr"), updateApplicationStatus);
router.delete("/:id", authMiddleware, authorizeRoles("admin", "candidate"), deleteApplication);

export default router;