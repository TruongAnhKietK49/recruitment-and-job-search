import Job from "../models/job.js";
import Application from "../models/application.js";
import User from "../models/user.js";

function normalizeText(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function candidateFromApplication(app) {
  const user = app.userId;
  if (!user) return null;

  return {
    applicationId: String(app._id),
    candidateId: String(user._id),
    fullName: user.fullName || user.name || "Ứng viên chưa rõ tên",
    email: user.email || "",
    phone: user.phone || user.phoneNumber || "",
    skills: user.skills || [],
    experience: normalizeText(user.experience),
    education: normalizeText(user.education),
    summary: normalizeText(user.summary || user.description || user.about),
    category: user.category || "",
    cvUrl: user.cvUrl || user.resumeUrl || "",
    applicationStatus: app.status || "",
    appliedAt: app.createdAt,
    jobId: app.jobId?._id ? String(app.jobId._id) : "",
    jobTitle: app.jobId?.title || "",
  };
}

export const toolDefinitions = [
  {
    type: "function",
    name: "get_job_detail",
    description: "Lấy thông tin chi tiết một job theo jobId.",
    parameters: {
      type: "object",
      properties: {
        jobId: { type: "string" },
      },
      required: ["jobId"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "search_candidates",
    description: "Tìm ứng viên theo jobId, jobTitle, category, skills hoặc status. Dùng tool này khi cần xem dữ liệu ứng viên thực từ database.",
    parameters: {
      type: "object",
      properties: {
        jobId: { type: "string" },
        jobTitle: { type: "string" },
        category: { type: "string" },
        skills: {
          type: "array",
          items: { type: "string" },
        },
        status: { type: "string" },
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_candidate_profile",
    description: "Lấy hồ sơ chi tiết của một ứng viên theo candidateId.",
    parameters: {
      type: "object",
      properties: {
        candidateId: { type: "string" },
      },
      required: ["candidateId"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "shortlist_candidate",
    description: "Đưa ứng viên vào shortlist theo applicationId. Chỉ dùng khi recruiter yêu cầu rõ ràng.",
    parameters: {
      type: "object",
      properties: {
        applicationId: { type: "string" },
      },
      required: ["applicationId"],
      additionalProperties: false,
    },
  },
];

export async function executeTool(name, args, currentUserId) {
  switch (name) {
    case "get_job_detail": {
      const job = await Job.findById(args.jobId).lean();
      if (!job) return { found: false, message: "Không tìm thấy job." };

      return {
        found: true,
        job: {
          id: String(job._id),
          title: job.title || "",
          category: job.category || "",
          description: normalizeText(job.description),
          requirements: normalizeText(job.requirements),
          skillsRequired: job.skillsRequired || job.skills || [],
          level: job.level || "",
          location: job.location || "",
          salary: job.salary || "",
        },
      };
    }

    case "search_candidates": {
      const query = {};
      if (args.jobId) query.jobId = args.jobId;
      if (args.status) query.status = args.status;

      const applications = await Application.find(query)
        .populate("userId", "fullName name email phone phoneNumber skills experience education summary description about category cvUrl resumeUrl")
        .populate("jobId", "title")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      let candidates = applications.map(candidateFromApplication).filter(Boolean);

      if (args.jobTitle) {
        const jobTitle = String(args.jobTitle).toLowerCase().trim();

        candidates = candidates.filter((c) =>
          String(c.jobTitle || "")
            .toLowerCase()
            .includes(jobTitle),
        );
      }

      if (args.category) {
        const category = String(args.category).toLowerCase().trim();

        candidates = candidates.filter((c) => {
          const skillText = (c.skills || []).join(" ").toLowerCase();
          return (
            String(c.category || "")
              .toLowerCase()
              .includes(category) ||
            String(c.jobTitle || "")
              .toLowerCase()
              .includes(category) ||
            String(c.summary || "")
              .toLowerCase()
              .includes(category) ||
            skillText.includes(category)
          );
        });
      }

      if (Array.isArray(args.skills) && args.skills.length) {
        const requestedSkills = args.skills.map((s) => String(s).toLowerCase());

        candidates = candidates.filter((c) => {
          const skillText = (c.skills || []).join(" ").toLowerCase();
          return requestedSkills.some((s) => skillText.includes(s));
        });
      }

      const uniqueMap = new Map();
      for (const candidate of candidates) {
        if (!uniqueMap.has(candidate.candidateId)) {
          uniqueMap.set(candidate.candidateId, candidate);
        }
      }

      const limit = Math.min(Number(args.limit) || 8, 20);

      return {
        total: uniqueMap.size,
        candidates: Array.from(uniqueMap.values()).slice(0, limit),
      };
    }

    case "get_candidate_profile": {
      const user = await User.findById(args.candidateId).lean();
      if (!user) {
        return { found: false, message: "Không tìm thấy ứng viên." };
      }

      return {
        found: true,
        candidate: {
          id: String(user._id),
          fullName: user.fullName || user.name || "",
          email: user.email || "",
          phone: user.phone || user.phoneNumber || "",
          skills: user.skills || [],
          experience: normalizeText(user.experience),
          education: normalizeText(user.education),
          summary: normalizeText(user.summary || user.description || user.about),
          category: user.category || "",
          cvUrl: user.cvUrl || user.resumeUrl || "",
        },
      };
    }

    case "shortlist_candidate": {
      const updated = await Application.findByIdAndUpdate(args.applicationId, { status: "shortlisted" }, { new: true }).lean();

      if (!updated) {
        return { success: false, message: "Không tìm thấy application." };
      }

      return {
        success: true,
        message: "Đã thêm ứng viên vào shortlist.",
        applicationId: String(updated._id),
        status: updated.status,
      };
    }

    default:
      return { error: `Tool không được hỗ trợ: ${name}` };
  }
}
