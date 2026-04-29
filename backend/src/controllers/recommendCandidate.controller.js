import { recommendCandidatesForJob } from "../services/candidateRecommendation.js";

export const recommendCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;
    const limit = req.query.limit || 10;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu jobId",
      });
    }

    const result = await recommendCandidatesForJob(jobId, limit);

    return res.status(200).json({
      success: true,
      job: {
        _id: result.job._id,
        title: result.job.title,
        category: result.job.category,
        experience: result.job.experience,
      },
      total: result.candidates.length,
      candidates: result.candidates,
    });
  } catch (error) {
    console.error("recommendCandidates error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể gợi ý ứng viên tiềm năng.",
      error: error.message,
    });
  }
};
