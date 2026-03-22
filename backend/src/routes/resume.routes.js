import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

import {
    getMyResume,
    getResumeById,
    createResume,
    updateResume,
    deleteResume,
  } from "../controllers/resume.controller.js";

const router = express.Router();

router.get("/me", authMiddleware, authorizeRoles("candidate"), getMyResume);
router.get("/:id", authMiddleware, getResumeById);
router.post("/", authMiddleware, authorizeRoles("candidate"), createResume);
router.put("/:id", authMiddleware, authorizeRoles("candidate"), updateResume);
router.delete("/:id", authMiddleware, authorizeRoles("candidate"), deleteResume);

export default router;