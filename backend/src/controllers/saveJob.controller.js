import SavedJob from "../models/saveJob.js";
import Job from "../models/job.js";

// Save a job
export const saveJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existingSavedJob = await SavedJob.findOne({
      userId: req.user.userId,
      jobId,
    });

    if (existingSavedJob) {
      return res.status(400).json({ message: "Job already saved" });
    }

    const newSavedJob = new SavedJob({
      userId: req.user.userId,
      jobId,
      savedDate: new Date(),
    });

    const savedJob = await newSavedJob.save();

    res.status(201).json(savedJob);
  } catch (error) {
    res.status(500).json({
      message: "Error saving job",
      error: error.message,
    });
  }
};

// Get my saved jobs
export const getMySavedJobs = async (req, res) => {
  try {
    const savedJobs = await SavedJob.find({ userId: req.user.userId })
      .populate({
        path: "jobId",
        populate: {
          path: "companyId",
          select: "companyName logoUrl",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(savedJobs);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching saved jobs",
      error: error.message,
    });
  }
};

// Remove saved job
export const removeSavedJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id; 

    const deletedJob = await SavedJob.findOneAndDelete({
      jobId: id,
      userId: userId,
    });

    if (!deletedJob) {
      return res.status(404).json({
        message: "Không tìm thấy bài lưu hoặc bạn không có quyền xóa",
      });
    }

    res.status(200).json({ message: "Đã bỏ lưu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};
