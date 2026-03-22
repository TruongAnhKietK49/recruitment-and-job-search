import express from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

import {
  createSkill,
  getMySkills,
  getSkillsByUserId,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
} from "../controllers/skill.controller.js";

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("admin"), createSkill);
router.get("/me", authMiddleware, getMySkills);
router.get("/", authMiddleware, getAllSkills);
router.get(
  "/user/:userId",
  authMiddleware,
  authorizeRoles("admin", "hr"),
  getSkillsByUserId,
);
router.get("/:id", authMiddleware, authorizeRoles("admin"), getSkillById);
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateSkill);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteSkill);

export default router;
