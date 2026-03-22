import { getProfile, getProfileById, getAllUsers, updateMyProfile, deleteUser } from "../controllers/user.controller.js";
import { upsertCandidateProfile, getMyCandidateProfile, deleteCandidateProfile } from "../controllers/candidateProfile.controller.js";
import { updateHrProfile, deleteHrProfile } from "../controllers/hrProfile.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";
import express from "express";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.get("/", authMiddleware, authorizeRoles("admin"), getAllUsers);
router.get("/:id", authMiddleware, authorizeRoles("admin", "hr"), getProfileById);
router.put("/", authMiddleware, updateMyProfile);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteUser);

router.post("/candidate-profile", authMiddleware, authorizeRoles("candidate"), upsertCandidateProfile);
router.delete("/candidate-profile", authMiddleware, authorizeRoles("candidate"), deleteCandidateProfile);

router.post("/hr-profile", authMiddleware, authorizeRoles("hr"), updateHrProfile);
router.delete("/hr-profile", authMiddleware, authorizeRoles("hr"), deleteHrProfile);

export default router;