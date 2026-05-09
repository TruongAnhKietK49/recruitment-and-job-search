import dotenv from "dotenv";
import mongoose from "mongoose";
import { GoogleGenAI, Type } from "@google/genai";
import AIConversation from "../models/AIConversation.js";
import { executeTool } from "../services/AITools.js";

import Job from "../models/job.js";
import CandidateProfile from "../models/candidateProfile.js";
import JobViewHistory from "../models/jobViewHistory.js";
import Application from "../models/application.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Thiếu GEMINI_API_KEY trong .env");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
const RECOMMEND_MODEL = process.env.GEMINI_RECOMMEND_MODEL || "gemini-2.5-flash";

const chatCache = new Map();
const CHAT_CACHE_TTL = Number(process.env.CHAT_CACHE_TTL || 30 * 60 * 1000);

const dailyAiUsage = new Map();
const DAILY_AI_LIMIT = Number(process.env.DAILY_AI_LIMIT || 15);

const serverRecommendCache = new Map();
const SERVER_CACHE_TTL = 2 * 60 * 60 * 1000;

function withTimeout(promise, ms = 25000, label = "AI call") {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout sau ${ms / 1000}s`)), ms));
  return Promise.race([promise, timeout]);
}

function normalizePageContext(pageContext = {}) {
  return {
    jobId: pageContext.jobId && mongoose.Types.ObjectId.isValid(pageContext.jobId) ? pageContext.jobId : null,
    category: typeof pageContext.category === "string" ? pageContext.category.trim() : "",
    jobTitle: typeof pageContext.jobTitle === "string" ? pageContext.jobTitle.trim() : "",
  };
}

function buildHistory(messages = []) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-4)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function canUseAi(userId, requestCount = 1) {
  const key = `${getTodayKey()}:${userId}`;
  const current = dailyAiUsage.get(key) || 0;

  if (current + requestCount > DAILY_AI_LIMIT) {
    return false;
  }

  dailyAiUsage.set(key, current + requestCount);
  return true;
}

function getChatCacheKey(userId, message, pageContext) {
  return JSON.stringify({
    userId: userId.toString(),
    message: message.toLowerCase().trim(),
    jobId: pageContext.jobId || "",
    category: pageContext.category || "",
    jobTitle: pageContext.jobTitle || "",
  });
}

function getLocalReply(message = "") {
  const text = message.toLowerCase().trim();

  if (["hi", "hello", "xin chào", "chào", "hey", "alo"].includes(text)) {
    return "Chào bạn, tôi có thể giúp bạn lọc ứng viên theo vị trí công việc, kỹ năng hoặc trạng thái ứng tuyển.";
  }

  if (
    text.includes("bạn làm được gì") ||
    text.includes("help") ||
    text.includes("hướng dẫn") ||
    text.includes("cách dùng") ||
    text.includes("sử dụng sao")
  ) {
    return [
      "Tôi có thể hỗ trợ HR các thao tác sau:",
      "",
      "1. Lọc ứng viên phù hợp với một vị trí công việc.",
      "2. Tìm ứng viên theo kỹ năng như React, NodeJS, Java, SQL.",
      "3. Gợi ý danh sách ứng viên nên xem xét.",
      "4. Hỗ trợ xem nhanh thông tin ứng viên nếu hệ thống có dữ liệu.",
      "",
      "Cách dùng đề xuất:",
      "Bạn vào Tab Quản lý ứng viên --> Danh sách ứng viên --> Chọn 1 vị trí công việc ---> Sau đó nhập số lượng ứng viên cần lọc.",
      "",
      "Ví dụ: Lọc 5 ứng viên phù hợp.",
    ].join("\n");
  }

  if (text.includes("lọc ứng viên như thế nào") || text.includes("cách lọc ứng viên") || text.includes("lọc candidate")) {
    return [
      "Để lọc ứng viên, bạn làm theo các bước sau:",
      "",
      "1. Vào Tab Quản lý ứng viên.",
      "2. Chọn Danh sách ứng viên.",
      "3. Chọn 1 vị trí công việc cụ thể.",
      "4. Mở AI chatbox.",
      "5. Nhập số lượng ứng viên bạn muốn lọc.",
      "",
      "Ví dụ: Lọc 5 ứng viên phù hợp cho vị trí này.",
    ].join("\n");
  }

  if (text.includes("chọn job ở đâu") || text.includes("chọn vị trí công việc ở đâu") || text.includes("tôi cần chọn job")) {
    return "Bạn vui lòng qua Tab Quản lý ứng viên --> Danh sách ứng viên --> Chọn 1 vị trí công việc ---> Sau đó yêu cầu số lượng ứng viên mà bạn cần tôi lọc!";
  }

  return null;
}

function isCandidateSearchIntent(message = "") {
  const text = message.toLowerCase();

  return (
    text.includes("lọc ứng viên") ||
    text.includes("tìm ứng viên") ||
    text.includes("ứng viên phù hợp") ||
    text.includes("candidate") ||
    text.includes("candidates")
  );
}

function shouldUseTools(message = "") {
  const text = message.toLowerCase();

  return (
    text.includes("ứng viên") ||
    text.includes("candidate") ||
    text.includes("job") ||
    text.includes("công việc") ||
    text.includes("hồ sơ") ||
    text.includes("shortlist") ||
    text.includes("danh sách rút gọn")
  );
}

function extractLimit(message = "", defaultLimit = 5) {
  const match = message.match(/\b(\d{1,2})\b/);
  const value = match ? Number(match[1]) : defaultLimit;

  if (!Number.isFinite(value)) return defaultLimit;
  return Math.min(Math.max(value, 1), 10);
}

function extractSkills(message = "") {
  const knownSkills = [
    "react",
    "node",
    "nodejs",
    "express",
    "mongodb",
    "sql",
    "javascript",
    "typescript",
    "html",
    "css",
    "java",
    "python",
    "php",
    "c#",
    ".net",
    "figma",
    "ui",
    "ux",
  ];

  const text = message.toLowerCase();
  return knownSkills.filter((skill) => text.includes(skill));
}

function formatCandidateSearchResult(result) {
  const candidates = Array.isArray(result)
    ? result
    : Array.isArray(result?.candidates)
      ? result.candidates
      : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.applications)
          ? result.applications
          : [];

  if (!candidates.length) {
    return "Hiện chưa tìm thấy ứng viên phù hợp với điều kiện này.";
  }

  return [
    `Tìm thấy ${candidates.length} ứng viên phù hợp:`,
    "",
    ...candidates.slice(0, 10).map((item, index) => {
      const candidate = item.candidate || item.candidateId || item.profile || item.user || item;

      const name =
        candidate.fullName ||
        candidate.name ||
        candidate.userId?.fullName ||
        item.fullName ||
        item.candidateName ||
        item.user?.fullName ||
        "Ứng viên chưa có tên";

      const email = candidate.email || candidate.userId?.email || item.email || item.user?.email || "";

      const status = item.status || candidate.status || "Chưa rõ";

      const skillsSource = candidate.skills || item.skills || [];
      const skills = Array.isArray(skillsSource)
        ? skillsSource
            .map((s) => s.skillName || s.name || s)
            .filter(Boolean)
            .join(", ")
        : "";

      return [`${index + 1}. ${name}${email ? ` (${email})` : ""}`, `- Trạng thái: ${status}`, `- Kỹ năng: ${skills || "Chưa cập nhật"}`].join("\n");
    }),
  ].join("\n");
}

async function saveConversationReply(conversation, message, replyText) {
  conversation.messages.push({ role: "user", content: message }, { role: "assistant", content: replyText || "Tôi chưa có phản hồi rõ ràng." });

  await conversation.save();
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
        jobId: { type: Type.STRING },
        category: { type: Type.STRING },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        status: { type: Type.STRING },
        limit: { type: Type.NUMBER },
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
        jobId: safePageContext.jobId ?? conversation.pageContext?.jobId ?? null,
        category: safePageContext.category || conversation.pageContext?.category || "",
        jobTitle: safePageContext.jobTitle || conversation.pageContext?.jobTitle || "",
      };
    }

    const localReply = getLocalReply(message);
    if (localReply) {
      await saveConversationReply(conversation, message, localReply);

      return res.json({
        success: true,
        conversationId: conversation._id,
        reply: localReply,
        provider: "local",
        model: "rule-based",
      });
    }

    if (isCandidateSearchIntent(message)) {
      const skills = extractSkills(message);
      const hasUsefulContext = safePageContext.jobId || safePageContext.category || skills.length > 0;

      if (hasUsefulContext) {
        const result = await executeTool(
          "search_candidates",
          {
            jobId: safePageContext.jobId || undefined,
            category: safePageContext.category || undefined,
            skills,
            limit: extractLimit(message, 5),
          },
          userId,
        );

        const reply = formatCandidateSearchResult(result);
        await saveConversationReply(conversation, message, reply);

        return res.json({
          success: true,
          conversationId: conversation._id,
          reply,
          provider: "local-db",
          model: "no-ai",
        });
      }

      const guideReply =
        "Bạn vui lòng qua Tab Quản lý ứng viên --> Danh sách ứng viên --> Chọn 1 vị trí công việc ---> Sau đó yêu cầu số lượng ứng viên mà bạn cần tôi lọc!";

      await saveConversationReply(conversation, message, guideReply);

      return res.json({
        success: true,
        conversationId: conversation._id,
        reply: guideReply,
        provider: "local",
        model: "rule-based",
      });
    }

    const cacheKey = getChatCacheKey(userId, message, safePageContext);
    const cached = chatCache.get(cacheKey);

    if (cached && Date.now() < cached.expiredAt) {
      await saveConversationReply(conversation, message, cached.reply);

      return res.json({
        success: true,
        conversationId: conversation._id,
        reply: cached.reply,
        provider: "cache",
        model: CHAT_MODEL,
      });
    }

    if (!canUseAi(userId, 1)) {
      return res.status(429).json({
        success: false,
        message: "Hôm nay AI đã hết lượt miễn phí. Bạn có thể thử lại vào ngày mai.",
      });
    }

    const needTool = shouldUseTools(message);

    const contents = [
      ...buildHistory(conversation.messages),
      {
        role: "user",
        parts: [
          {
            text:
              "Bạn là AI assistant cho recruiter trong job portal. " +
              "Luôn trả lời bằng tiếng Việt, ngắn gọn, đúng trọng tâm. " +
              "Khi cần dữ liệu thật từ hệ thống thì dùng function calling. " +
              "Nếu người dùng muốn lọc ứng viên nhưng chưa chọn vị trí công việc, không được yêu cầu nhập jobId thủ công. " +
              "Hãy hướng dẫn: Bạn vui lòng qua Tab Quản lý ứng viên --> Danh sách ứng viên --> Chọn 1 vị trí công việc ---> Sau đó yêu cầu số lượng ứng viên mà bạn cần tôi lọc! " +
              "Nếu không cần dữ liệu thật, hãy trả lời trực tiếp. " +
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
        config: needTool ? { tools: [{ functionDeclarations: toolDeclarations }] } : undefined,
      }),
      25000,
      "AI chat lần 1",
    );

    const functionCalls = first.functionCalls || [];
    let replyText = first.text || "";

    if (functionCalls.length) {
      if (!canUseAi(userId, 1)) {
        return res.status(429).json({
          success: false,
          message: "AI đã gần hết lượt miễn phí hôm nay. Vui lòng thử lại vào ngày mai.",
        });
      }

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
          contents: [...contents, { role: "model", parts: first.candidates?.[0]?.content?.parts || [] }, { role: "user", parts: toolResponses }],
        }),
        25000,
        "AI chat lần 2",
      );

      replyText = second.text || "Tôi đã xử lý xong yêu cầu.";
    }

    replyText = replyText || "Tôi chưa có phản hồi rõ ràng.";

    chatCache.set(cacheKey, {
      reply: replyText,
      expiredAt: Date.now() + CHAT_CACHE_TTL,
    });

    await saveConversationReply(conversation, message, replyText);

    return res.json({
      success: true,
      conversationId: conversation._id,
      reply: replyText,
      provider: "gemini",
      model: CHAT_MODEL,
    });
  } catch (error) {
    console.error("aiChat error:", error);

    const errorText = error.message || "";
    const isTimeout = errorText.includes("timeout");
    const isQuota =
      errorText.toLowerCase().includes("quota") ||
      errorText.toLowerCase().includes("rate limit") ||
      errorText.includes("RESOURCE_EXHAUSTED") ||
      error.status === 429;

    const isInvalidApiKey =
      errorText.includes("API key expired") ||
      errorText.includes("API_KEY_INVALID") ||
      errorText.includes("INVALID_ARGUMENT") ||
      error.status === 400;

    return res.status(500).json({
      success: false,
      message: isTimeout
        ? "AI phản hồi quá chậm, vui lòng thử lại."
        : isQuota
          ? "Hệ thống AI đang hết lượt miễn phí hoặc bị giới hạn tốc độ. Vui lòng thử lại sau."
          : isInvalidApiKey
            ? "Gemini API key đã hết hạn hoặc không hợp lệ. Vui lòng cập nhật lại API key."
            : "Không thể xử lý AI chat.",
      error: error.message,
    });
  }
};

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

    const appliedJobIds = applications.map((app) => app.jobId?._id?.toString()).filter(Boolean);
    const viewedJobsText = viewHistory
      .map((v) => v.jobId?.title)
      .filter(Boolean)
      .join(", ");
    const appliedJobsText = applications
      .map((app) => app.jobId?.title)
      .filter(Boolean)
      .join(", ");

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
      id: job._id.toString(),
      title: job.title,
      category: job.category || "",
      jobType: job.jobType || "",
      experience: job.experience || "",
      salary: `${job.salaryMin || 0} - ${job.salaryMax || 0}`,
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

    if (!canUseAi(userId, 1)) {
      return res.status(429).json({
        message: "Hôm nay AI đã hết lượt miễn phí. Bạn có thể thử lại vào ngày mai.",
      });
    }

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
                jobId: { type: Type.STRING },
                matchScore: { type: Type.STRING, description: "Ví dụ: 92%" },
                reason: { type: Type.STRING, description: "Lý do phù hợp ngắn gọn (1-2 câu)" },
              },
              required: ["jobId", "matchScore", "reason"],
            },
          },
        },
      }),
      20000,
      "AI recommend",
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
        return fullJobData ? { job: fullJobData, matchScore: aiMatch.matchScore, aiReason: aiMatch.reason } : null;
      })
      .filter(Boolean)
      .slice(0, 3);

    serverRecommendCache.set(userId.toString(), {
      data: finalRecommendations,
      expiredAt: Date.now() + SERVER_CACHE_TTL,
    });

    return res.status(200).json(finalRecommendations);
  } catch (error) {
    console.error("Lỗi AI Recommend:", error);

    const errorText = error.message || "";
    const isTimeout = errorText.includes("timeout");
    const isQuota =
      errorText.toLowerCase().includes("quota") ||
      errorText.toLowerCase().includes("rate limit") ||
      errorText.includes("RESOURCE_EXHAUSTED") ||
      error.status === 429;

    const isInvalidApiKey =
      errorText.includes("API key expired") ||
      errorText.includes("API_KEY_INVALID") ||
      errorText.includes("INVALID_ARGUMENT") ||
      error.status === 400;

    return res.status(500).json({
      message: isTimeout
        ? "AI phân tích quá chậm, vui lòng thử lại."
        : isQuota
          ? "Hệ thống AI đang hết lượt gọi miễn phí, vui lòng thử lại sau."
          : isInvalidApiKey
            ? "Gemini API key đã hết hạn hoặc không hợp lệ. Vui lòng cập nhật lại API key."
            : "Lỗi kết nối AI",
      error: error.message,
    });
  }
};
