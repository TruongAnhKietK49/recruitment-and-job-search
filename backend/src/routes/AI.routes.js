import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

import { aiChat } from "../controllers/AI.controller.js";

const router = express.Router();

router.post("/chat", authMiddleware, aiChat);

export default router;