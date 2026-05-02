// Hello world
import express from "express";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";

import companyRoutes from "./src/routes/company.routes.js";
import jobRoutes from "./src/routes/job.routes.js";
import resumeRoutes from "./src/routes/resume.routes.js";
import applicationRoutes from "./src/routes/application.routes.js";
import skillRoutes from "./src/routes/skill.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import AI from "./src/routes/AI.routes.js";
import recommendCandidateRoutes from "./src/routes/recommendCandidate.route.js";

const app = express();

app.use(cors());

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Success");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is healthy",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", AI);
app.use("/api/recommend", recommendCandidateRoutes);

await connectDB();
app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
