import express from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

import {
  getAllJobs,
  getJobsByCompany,
  getJobById,
  getPendingJobs,
  createJob,
  updateJob,
  approveJob,
  rejectJob,
  deleteJob,
  getJobSummary,
  getAdminAllJobs,
  closeJob,
} from "../controllers/job.controller.js";

import {
  addJobViewHistory,
  getMyJobViewHistory,
  deleteJobViewHistory,
} from "../controllers/jobViewHistory.controller.js";

import { saveJob, getMySavedJobs, removeSavedJob } from "../controllers/saveJob.controller.js";

const router = express.Router();
router.get("/", getAllJobs);
router.get("/pending", authMiddleware, authorizeRoles("admin"), getPendingJobs);
router.get("/:id", getJobById);

router.post("/", authMiddleware, authorizeRoles("admin", "hr"), createJob);
router.put("/:jobId", authMiddleware, authorizeRoles("admin", "hr"), updateJob);
router.delete("/:jobId", authMiddleware, authorizeRoles("admin", "hr"), deleteJob);

router.patch("/:id/approve", authMiddleware, authorizeRoles("admin"), approveJob);
router.patch("/:id/reject", authMiddleware, authorizeRoles("admin"), rejectJob);

router.post("/view-history", authMiddleware, authorizeRoles("candidate"), addJobViewHistory);
router.get("/view-history/me", authMiddleware, authorizeRoles("candidate"), getMyJobViewHistory);
router.delete("/view-history/:id", authMiddleware, authorizeRoles("candidate"), deleteJobViewHistory);

router.get("/save-job/me", authMiddleware, authorizeRoles("candidate"), getMySavedJobs);

router.post("/save-job", authMiddleware, authorizeRoles("candidate"), saveJob);

router.delete("/save-job/:id", authMiddleware, authorizeRoles("candidate"), removeSavedJob);

router.get("/admin/all", authMiddleware, authorizeRoles("admin"), getAdminAllJobs);
router.patch("/:id/close", authMiddleware, authorizeRoles("admin"), closeJob);

export default router;
