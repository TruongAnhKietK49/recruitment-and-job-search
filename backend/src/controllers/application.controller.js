import Application from "../models/application.js";
import CandidateProfile from "../models/candidateProfile.js";
import Job from "../models/job.js";
import Resume from "../models/resume.js";
import Notification from "../models/notification.js";

// Create application
export const createApplication = async (req, res) => {
  try {
    const {jobId, resumeId } = req.body;

    let candidateProfile = await CandidateProfile.findOne({ userId: req.user.userId });
    if (!candidateProfile) {
      candidateProfile = await CandidateProfile.findOne({ user: req.user.userId });
    }
    if (!candidateProfile) {
      return res.status(404).json({ message: "Vui lòng cập nhật Hồ sơ cá nhân trước khi ứng tuyển!" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Không tìm thấy CV" });
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
        message: "Bạn đã ứng tuyển công việc này rồi!",
      });
    }

    const newApplication = new Application({
      jobId,
      userId: req.user.userId,
      candidateProfileId: candidateProfile._id, 
      resumeId,
      applyDate: new Date(),
      status: "pending",
    });

    const savedApplication = await newApplication.save();

    const populatedApplication = await Application.findById(savedApplication._id)
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
      .populate({
        path: "jobId",
        select: "title category status companyId",
        populate: {
          path: "companyId",
          select: "companyName logoUrl",
        },
      })
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

// Get company applications
export const getCompanyApplications = async (req, res) => {
  try {
    const pageNumber = Number.parseInt(req.query.page, 10) || 1;
    const isGetAll = req.query.limit === "all";
    const limitNumber = isGetAll ? 0 : Number.parseInt(req.query.limit, 10) || 10;

    const { status, jobId } = req.query;
    const companyId = req.params.companyId;

    if (!req.user || !["hr", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!companyId) {
      return res.status(400).json({ message: "User does not belong to any company" });
    }

    const companyJobs = await Job.find({ companyId }).select("_id");
    const companyJobIds = companyJobs.map((job) => job._id.toString());

    if (jobId && !companyJobIds.includes(jobId)) {
      return res.status(403).json({ message: "You cannot access applications for this job" });
    }

    const query = {
      jobId: {
        $in: jobId ? [jobId] : companyJobIds,
      },
    };

    if (status) {
      query.status = status;
    }

    let applicationQuery = Application.find(query)
      .populate("jobId", "title category status companyId createdBy")
      .populate("userId", "fullName email phone gender")
      .populate({
        path: "candidateProfileId",
        select: "avatar education expSummary expectedSalary address skills",
        populate: {
          path: "skills",
          select: "skillName",
        },
      })
      .populate("resumeId", "title fileUrl")
      .sort({ createdAt: -1 });

    if (!isGetAll) {
      applicationQuery = applicationQuery.skip((pageNumber - 1) * limitNumber).limit(limitNumber);
    }

    const applications = await applicationQuery;
    const total = await Application.countDocuments(query);

    res.status(200).json({
      total,
      page: isGetAll ? 1 : pageNumber,
      limit: isGetAll ? total : limitNumber,
      totalPages: isGetAll ? 1 : Math.ceil(total / limitNumber),
      applications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching company applications",
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

    if (req.user.role === "candidate" && application.userId._id.toString() !== req.user.userId) {
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

    const validStatus = ["pending", "reviewing", "interview", "accepted", "rejected"];

    const application = await Application.findById(id).populate({
      path: "jobId",
      select: "title companyId createdBy",
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const job = application.jobId;
    if (!job || !job.companyId) {
      return res.status(400).json({ message: "Job or Company data is missing" });
    }

    if (job.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "You are not authorized to update this" });
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

    if (req.user.role === "candidate" && application.userId.toString() !== req.user.userId) {
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
