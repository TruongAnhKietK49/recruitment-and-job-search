import express from "express";
import { recommendCandidates } from "../controllers/recommendCandidate.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:jobId/recommend-candidates", authMiddleware, recommendCandidates);

export default router;
