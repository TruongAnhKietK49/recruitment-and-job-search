import {
  createCompany,
  getAllCompanies,
  getCompanyById,
} from "../controllers/company.controller.js";

import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("admin", "hr"), createCompany);
router.get("/", authMiddleware, getAllCompanies);
router.get("/:id", authMiddleware, getCompanyById);

export default router;