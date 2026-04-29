import dotenv from "dotenv";
import mongoose from "mongoose";
import { GoogleGenAI, Type } from "@google/genai";
import AIConversation from "../models/AIConversation.js";
import { executeTool } from "../services/AITools.js";

import Job from "../models/job.js";
import CandidateProfile from "../models/candidateProfile.js";
import JobViewHistory from "../models/jobViewHistory.js";
import Application from "../models/application.js";

import Job from "../models/job.js";
import CandidateProfile from "../models/candidateProfile.js";
import JobViewHistory from "../models/jobViewHistory.js";
import Application from "../models/application.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Thiếu GEMINI_API_KEY trong .env");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CHAT_MODEL    = process.env.GEMINI_CHAT_MODEL    || "gemini-2.0-flash";
const RECOMMEND_MODEL = process.env.GEMINI_RECOMMEND_MODEL || "gemini-2.0-flash";

function withTimeout(promise, ms = 25000, label = "AI call") {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timeout sau ${ms / 1000}s`)), ms)
  );
  return Promise.race([promise, timeout]);
}

function normalizePageContext(pageContext = {}) {
  return {
    jobId:
      pageContext.jobId && mongoose.Types.ObjectId.isValid(pageContext.jobId)
        ? pageContext.jobId
        : null,
    category:
      typeof pageContext.category === "string" ? pageContext.category.trim() : "",
    jobTitle:
      typeof pageContext.jobTitle === "string" ? pageContext.jobTitle.trim() : "",
  };
}

function buildHistory(messages = []) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-12)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

const toolDeclarations = [
  {
    name: "get_job_detail",
    description: "Lấy thông tin chi tiết một job theo jobId",
    parameters: {
      type: Type.OBJECT,
      properties: { jobId: { type: Type.STRING } },
      required: ["jobId"],
    },
  },
  {
    name: "search_candidates",
    description: "Tìm ứng viên theo jobId, category, skills hoặc status",
    parameters: {
      type: Type.OBJECT,
      properties: {
        jobId:     { type: Type.STRING },
        category:  { type: Type.STRING },
        skills:    { type: Type.ARRAY, items: { type: Type.STRING } },
        status:    { type: Type.STRING },
        limit:     { type: Type.NUMBER },
      },
    },
  },
  {
    name: "get_candidate_profile",
    description: "Lấy hồ sơ chi tiết ứng viên theo candidateId",
    parameters: {
      type: Type.OBJECT,
      properties: { candidateId: { type: Type.STRING } },
      required: ["candidateId"],
    },
  },
  {
    name: "shortlist_candidate",
    description: "Đưa ứng viên vào shortlist theo applicationId",
    parameters: {
      type: Type.OBJECT,
      properties: { applicationId: { type: Type.STRING } },
      required: ["applicationId"],
    },
  },
];

export const aiChat = async (req, res) => {
  try {
    const { message, conversationId, pageContext = {} } = req.body;
    const userId = req.user.userId;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Thiếu nội dung chat." });
    }

    const safePageContext = normalizePageContext(pageContext);

    let conversation = null;
    if (conversationId) {
      conversation = await AIConversation.findOne({ _id: conversationId, userId });
    }

    if (!conversation) {
      conversation = await AIConversation.create({
        userId,
        pageContext: safePageContext,
        messages: [],
      });
    } else {
      conversation.pageContext = {
        jobId:     safePageContext.jobId ?? conversation.pageContext?.jobId ?? null,
        category:  safePageContext.category || conversation.pageContext?.category || "",
        jobTitle:  safePageContext.jobTitle || conversation.pageContext?.jobTitle || "",
      };
    }

    const contents = [
      ...buildHistory(conversation.messages),
      {
        role: "user",
        parts: [
          {
            text:
              "Bạn là AI assistant cho recruiter trong job portal. " +
              "Khi lọc ứng viên, bạn có thể dùng jobId, title (tên job), category, skills, status." +
              "Luôn trả lời bằng tiếng Việt. " +
              "Khi cần dữ liệu thật từ hệ thống, phải dùng function calling. " +
              `Page context: ${JSON.stringify(conversation.pageContext)}\n\n` +
              `Yêu cầu người dùng: ${message}`,
          },
        ],
      },
    ];

    const first = await withTimeout(
      ai.models.generateContent({
        model: CHAT_MODEL,
        contents,
        config: { tools: [{ functionDeclarations: toolDeclarations }] },
      }),
      25000,
      "AI chat lần 1"
    );

    const functionCalls = first.functionCalls || [];
    let replyText = first.text || "";

    if (functionCalls.length) {
      const toolResponses = [];

      for (const call of functionCalls) {
        const result = await executeTool(call.name, call.args || {}, userId);
        toolResponses.push({
          functionResponse: { name: call.name, response: result },
        });

        conversation.messages.push({
          role: "tool",
          toolName: call.name,
          content: JSON.stringify({ args: call.args || {}, result }),
        });
      }

      const second = await withTimeout(
        ai.models.generateContent({
          model: CHAT_MODEL,
          contents: [
            ...contents,
            { role: "model", parts: first.candidates?.[0]?.content?.parts || [] },
            { role: "user",  parts: toolResponses },
          ],
        }),
        25000,
        "AI chat lần 2"
      );

      replyText = second.text || "Tôi đã xử lý xong yêu cầu.";
    }

    conversation.messages.push(
      { role: "user",      content: message },
      { role: "assistant", content: replyText || "Tôi chưa có phản hồi rõ ràng." }
    );

    await conversation.save();

    return res.json({
      success: true,
      conversationId: conversation._id,
      reply: replyText || "Tôi chưa có phản hồi rõ ràng.",
      provider: "gemini",
      model: CHAT_MODEL,
    });
  } catch (error) {
    console.error("aiChat error:", error);

    const isTimeout = error.message?.includes("timeout");
    const isQuota   = error.message?.includes("quota") || error.status === 429;

    return res.status(500).json({
      success: false,
      message: isTimeout
        ? "AI phản hồi quá chậm, vui lòng thử lại."
        : isQuota
        ? "Hệ thống AI đang quá tải, vui lòng thử lại sau."
        : "Không thể xử lý AI chat.",
      error: error.message,
    });
  }
};

const serverRecommendCache = new Map(); 
const SERVER_CACHE_TTL = 2 * 60 * 60 * 1000;

export const recommendSmartJobs = async (req, res) => {
  try {
    const userId = req.user.userId;


    const cached = serverRecommendCache.get(userId.toString());
    if (cached && Date.now() < cached.expiredAt) {
      return res.status(200).json({ ...cached.data, fromCache: true });
    }

    const profile = await CandidateProfile.findOne({ userId }).populate("skills", "skillName");
    if (!profile) {
      return res.status(404).json({ message: "Vui lòng cập nhật Profile" });
    }
    const userSkills = profile.skills.map((s) => s.skillName).join(", ");

    const [viewHistory, applications] = await Promise.all([
      JobViewHistory.find({ userId }).sort({ viewDate: -1 }).limit(5).populate("jobId", "title category"),
      Application.find({ userId }).populate("jobId", "title"),
    ]);

    const appliedJobIds    = applications.map((app) => app.jobId?._id?.toString()).filter(Boolean);
    const viewedJobsText   = viewHistory.map((v) => v.jobId?.title).filter(Boolean).join(", ");
    const appliedJobsText  = applications.map((app) => app.jobId?.title).filter(Boolean).join(", ");

    const potentialJobs = await Job.find({
      _id: { $nin: appliedJobIds },
      status: "approved",
    })
      .limit(20)
      .populate("companyId", "companyName")
      .select("_id title category salaryMin salaryMax requirements jobType experience location");

    if (potentialJobs.length === 0) {
      return res.status(200).json([]);
    }

    const jobPool = potentialJobs.map((job) => ({
      id:           job._id.toString(),
      title:        job.title,
      category:     job.category || "",
      jobType:      job.jobType || "",
      experience:   job.experience || "",
      salary:       `${job.salaryMin || 0} - ${job.salaryMax || 0}`,
      requirements: job.requirements ? job.requirements.substring(0, 100) : "",
    }));

    const promptText = `
Ứng viên:
- Kỹ năng: ${userSkills || "Chưa cập nhật"}
- Lương mong muốn: ${profile.expectedSalary || "Không rõ"}
- Đã xem: ${viewedJobsText || "Không có"}
- Đã ứng tuyển: ${appliedJobsText || "Không có"}

Danh sách ${jobPool.length} công việc (JSON):
${JSON.stringify(jobPool)}

Chọn đúng 3 công việc phù hợp nhất với ứng viên. Trả về JSON array.
`.trim();

    const aiResponse = await withTimeout(
      ai.models.generateContent({
        model: RECOMMEND_MODEL,
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                jobId:      { type: Type.STRING },
                matchScore: { type: Type.STRING, description: "Ví dụ: 92%" },
                reason:     { type: Type.STRING, description: "Lý do phù hợp ngắn gọn (1-2 câu)" },
              },
              required: ["jobId", "matchScore", "reason"],
            },
          },
        },
      }),
      20000,
      "AI recommend"
    );

    let recommendedData = [];
    try {
      recommendedData = JSON.parse(aiResponse.text);
      if (!Array.isArray(recommendedData)) recommendedData = [];
    } catch (parseError) {
      console.error("Lỗi parse JSON AI recommend:", parseError);
      return res.status(500).json({ message: "Lỗi đọc dữ liệu AI" });
    }

    const finalRecommendations = recommendedData
      .map((aiMatch) => {
        const fullJobData = potentialJobs.find((j) => j._id.toString() === aiMatch.jobId);
        return fullJobData
          ? { job: fullJobData, matchScore: aiMatch.matchScore, aiReason: aiMatch.reason }
          : null;
      })
      .filter(Boolean)
      .slice(0, 3); 

    serverRecommendCache.set(userId.toString(), {
      data:      finalRecommendations,
      expiredAt: Date.now() + SERVER_CACHE_TTL,
    });

    return res.status(200).json(finalRecommendations);
  } catch (error) {
    console.error("Lỗi AI Recommend:", error);

    const isTimeout = error.message?.includes("timeout");
    const isQuota   = error.message?.includes("quota") || error.status === 429;

    return res.status(500).json({
      message: isTimeout
        ? "AI phân tích quá chậm, vui lòng thử lại."
        : isQuota
        ? "Hệ thống AI đang hết lượt gọi (Quota), vui lòng thử lại sau vài phút."
        : "Lỗi kết nối AI",
      error: error.message,
    });
  }
};
