import Job from "../models/job.js";
import Company from "../models/company.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

export const getAllJobs = async (req, res) => {
  try {
    const pageNumber = Number.parseInt(req.query.page, 10) || 1;
    const limitNumber = Number.parseInt(req.query.limit, 10) || 10;
    const { keyword, category, status, jobType, companyId, salaryRange, experience, location } = req.query;

    const query = {};

    query.status = "approved";

    if (keyword) {
      query.title = { $regex: keyword, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (companyId) {
      query.companyId = companyId;
    }
    

    if (experience) {
      if (experience === "0-1") query.experience = { $regex: /dưới 1|0|không|chưa/i };
      else if (experience === "1-3") query.experience = { $regex: /1|2|3/i };
      else if (experience === "3-5") query.experience = { $regex: /3|4|5/i };
      else if (experience === "5+") query.experience = { $regex: /trên 5|5|6|7|8|9|10/i };
    }

    const activeCompanies = await Company.find({ status: "active" }).select("_id");
    const activeCompanyIds = activeCompanies.map(c => c._id);

    if (companyId) {
      if (!activeCompanyIds.some(id => id.toString() === companyId)) {
        return res.status(200).json({ total: 0, page: 1, totalPages: 0, jobs: [] });
      }
      query.companyId = companyId;
    } else {
      query.companyId = { $in: activeCompanyIds };
    }

    // Xử lý lọc theo Mức lương
    if (salaryRange) {
      if (salaryRange === "50+") {
        query.salaryMin = { $gte: 50000000 }; 
      } else {
        const [min, max] = salaryRange.split("-");
        if (min && max) {
          query.salaryMin = { 
            $gte: Number(min) * 1000000, 
            $lt: Number(max) * 1000000 
          };
        }
      }
    }

    // Xử lý lọc theo Địa điểm 
    if (location) {
      let locString = "";
      if (location === "HN") locString = "Hà Nội";
      else if (location === "HCM") locString = "Hồ Chí Minh";

      if (locString) {
        const companiesInLocation = await Company.find({
          address: { $regex: locString, $options: "i" }
        }).select("_id");
        
        const companyIds = companiesInLocation.map(c => c._id);
        
        query.$or = [
          { location: { $regex: locString, $options: "i" } },
          { companyId: { $in: companyIds } }
        ];
      }
    }

    const jobs = await Job.find(query)
      .populate("companyId", "companyName logoUrl address website")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    const total = await Job.countDocuments(query);

    res.status(200).json({
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};

export const getJobsByCompany = async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.params.companyId, status: "approved" }).populate("companyId", "companyName logoUrl address website");
    if (!jobs) {
      return res.status(404).json({ message: "Jobs not found" });
    }
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("companyId", "companyName logoUrl address website");
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching job",
      error: error.message,
    });
  }
};

export const getPendingJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "pending" }).populate("companyId", "companyName logoUrl").sort({ createdAt: -1 });

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching pending jobs",
      error: error.message,
    });
  }
};

export const createJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      companyId,
      title,
      description,
      category,
      salaryMin,
      salaryMax,
      experience,
      jobType,
      deadline,
      workingTime,
      location,
      quantity,
      requirements,
      benefits,
    } = req.body;

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!["hr", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only HR or Admin can create jobs" });
    }

    const isOwner = company.createdBy.toString() === req.user.userId;
    const isMember = company.members?.some((member) => member.toString() === req.user.userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "You are not a member of this company" });
    }

    const newJob = new Job({
      companyId,
      title,
      description,
      category,
      salaryMin,
      salaryMax,
      experience,
      jobType,
      deadline,
      workingTime,
      location,
      quantity,
      requirements,
      benefits,
      status: "pending",
      createdBy: userId,
    });

    const savedJob = await newJob.save();

    const admins = await User.find({ role: "admin", status: "active" }).select("_id");

    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        userId: admin._id,
        content: `Job "${title}" from company "${company.companyName}" is waiting for approval`,
        isRead: false,
        type: "job_approval",
        jobId: savedJob._id,
      }));

      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      message: "Job submitted successfully and is waiting for admin approval",
      job: savedJob,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating job",
      error: error.message,
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const updatedJob = await Job.findByIdAndUpdate(jobId, req.body, {
      new: true,
    });
    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json(updatedJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const approveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const allowedStatuses = ["pending", "rejected", "closed"];
    
    if (!allowedStatuses.includes(job.status)) {
      return res.status(400).json({
        message: "Trạng thái hiện tại không thể thực hiện thao tác duyệt/khôi phục",
      });
    }

    const company = await Company.findById(job.companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    job.status = "approved";
    job.reviewedBy = req.user.userId;
    job.reviewNote = req.body?.reviewNote || "Đã duyệt/khôi phục bởi Admin";

    await job.save();

    await Notification.create({
      userId: company.createdBy,
      content: `Your job "${job.title}" has been approved`,
      isRead: false,
      type: "job_approved",
      jobId: job._id,
    });

    res.status(200).json({
      message: "Job approved successfully",
      job,
    });
  } catch (error) {
    console.error("Lỗi tại approveJob:", error);
    res.status(500).json({
      message: "Error approving job",
      error: error.message,
    });
  }
};

export const rejectJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("companyId", "companyName");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "pending") {
      return res.status(400).json({
        message: "Only pending jobs can be rejected",
      });
    }
    job.status = "rejected";
    job.reviewedBy = req.user.userId;
    job.reviewNote = req.body.reviewNote || "";

    await job.save();

    res.status(200).json({
      message: "Job rejected successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error rejecting job",
      error: error.message,
    });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const deletedJob = await Job.findByIdAndDelete(jobId);
    console.log(deletedJob);
    if (!deletedJob) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getJobSummary = async (req, res) => {
  try {
    const { companyId } = req.query;

    const matchStage = {};
    if (companyId) {
      matchStage.companyId = companyId;
    }

    const result = await Job.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalPosts: 1,
          approved: 1,
          pending: 1,
          rejected: 1,
        },
      },
    ]);

    const summary = result[0] || {
      totalPosts: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching job summary",
      error: error.message,
    });
  }
};

// Lấy TẤT CẢ việc làm cho Admin
export const getAdminAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("companyId", "companyName logoUrl")
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách việc làm", error: error.message });
  }
};

// Admin gỡ bài đăng đang hoạt động
export const closeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.status !== "approved") {
      return res.status(400).json({ message: "Chỉ có thể gỡ các bài đang hoạt động (approved)" });
    }

    job.status = "closed"; 
    job.reviewedBy = req.user.userId;
    await job.save();

    res.status(200).json({ message: "Đã gỡ bài đăng thành công", job });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi gỡ bài", error: error.message });
  }
};