import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

import { aiChat, recommendSmartJobs } from "../controllers/AI.controller.js";

const router = express.Router();

router.post("/chat", authMiddleware, aiChat);

router.get("/recommendations", authMiddleware, authorizeRoles("candidate"), recommendSmartJobs);

export default router;