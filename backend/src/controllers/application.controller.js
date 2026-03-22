import Application from "../models/application.js";
import Job from "../models/job.js";
import Resume from "../models/resume.js";
import Notification from "../models/notification.js";

// Create application
export const createApplication = async (req, res) => {
  try {
    const { jobId, resumeId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (resume.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existingApplication = await Application.findOne({
      jobId,
      userId: req.user.userId,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job",
      });
    }

    const newApplication = new Application({
      jobId,
      userId: req.user.userId,
      resumeId,
      applyDate: new Date(),
      status: "pending",
    });

    const savedApplication = await newApplication.save();

    const populatedApplication = await Application.findById(
      savedApplication._id,
    )
      .populate("jobId", "title category status")
      .populate("userId", "fullName email")
      .populate("resumeId", "title fileUrl");

    res.status(201).json(populatedApplication);
  } catch (error) {
    res.status(500).json({
      message: "Error applying for job",
      error: error.message,
    });
  }
};

// Get all applications
export const getAllApplications = async (req, res) => {
  try {
    const pageNumber = Number.parseInt(req.query.page, 10) || 1;
    const limitNumber = Number.parseInt(req.query.limit, 10) || 10;
    const { status, jobId } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (jobId) {
      query.jobId = jobId;
    }

    if (req.user.role === "candidate") {
      query.userId = req.user.userId;
    }

    const applications = await Application.find(query)
      .populate("jobId", "title category status companyId")
      .populate("userId", "fullName email avatar")
      .populate("resumeId", "title fileUrl")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    const total = await Application.countDocuments(query);

    res.status(200).json({
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      applications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching applications",
      error: error.message,
    });
  }
};

// Get application by ID
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("jobId", "title category status companyId")
      .populate("userId", "fullName email avatar")
      .populate("resumeId", "title fileUrl");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (
      req.user.role === "candidate" &&
      application.userId._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching application",
      error: error.message,
    });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const application = await Application.findById(id).populate({
      path: "jobId",
      select: "title companyId", // Lấy title để làm nội dung thông báo
      populate: {
        path: "companyId",
        select: "createdBy",
      },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = application.jobId;
    if (!job || !job.companyId) {
      return res
        .status(400)
        .json({ message: "Job or Company data is missing" });
    }

    if (job.companyId.createdBy.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this" });
    }

    application.status = status;
    await application.save();

    await Notification.create({
      userId: application.userId,
      content: `Your application for "${job.title}" has been ${status}`,
      isRead: false,
      type: "application_status_update",
      jobId: job._id,
    });

    res.status(200).json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({
      message: "Error updating application",
      error: error.message,
    });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (
      req.user.role === "candidate" &&
      application.userId.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Application.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Application deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting application",
      error: error.message,
    });
  }
};
