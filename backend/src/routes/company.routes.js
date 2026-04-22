import {
  createCompany,
  getAllCompanies,
  getMyCompany,
  getCompanyById,
  updateCompany,
  deleteCompany,
  createJoinRequest,
  getMyCompanyJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  updateCompanyStatus,
} from "../controllers/company.controller.js";

import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("admin", "hr"), createCompany);
router.post("/:companyId/join-request", authMiddleware, createJoinRequest);
router.get("/my/join-requests", authMiddleware, getMyCompanyJoinRequests);
router.patch("/join-requests/:requestId/approve", authMiddleware, approveJoinRequest);
router.patch("/join-requests/:requestId/reject", authMiddleware, rejectJoinRequest);

router.get("/", getAllCompanies);
router.get("/me", authMiddleware, getMyCompany);
router.get("/:companyId", getCompanyById);

router.put("/:companyId", authMiddleware, authorizeRoles("admin", "hr"), updateCompany);
router.delete("/:companyId", authMiddleware, authorizeRoles("admin", "hr"), deleteCompany);

router.patch("/:companyId/status", authMiddleware, authorizeRoles("admin"), updateCompanyStatus);
export default router;