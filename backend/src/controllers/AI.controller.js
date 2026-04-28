import dotenv from "dotenv";
import mongoose from "mongoose";
import { GoogleGenAI, Type } from "@google/genai";
import AIConversation from "../models/AIConversation.js";
import { executeTool } from "../services/AITools.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Thiếu GEMINI_API_KEY trong .env");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARS = 700;
const MAX_TOOL_RESPONSE_CHARS = 3000;

const SYSTEM_PROMPT = [
  "Bạn là AI assistant cho recruiter trong job portal.",
  "Luôn trả lời bằng tiếng Việt, ngắn gọn, đúng trọng tâm.",
  "Chỉ gọi function khi cần dữ liệu thật từ hệ thống.",
  "Khi có đủ dữ liệu, ưu tiên trả lời trực tiếp thay vì gọi thêm function.",
].join(" ");

function withTimeout(promise, ms = 25000, label = "AI call") {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout sau ${ms / 1000}s`)), ms));
  return Promise.race([promise, timeout]);
}

function truncateText(text, maxChars) {
  if (!text) return "";
  const value = String(text);
  return value.length > maxChars ? `${value.slice(0, maxChars)}…` : value;
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
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: truncateText(m.content, MAX_HISTORY_CHARS) }],
    }));
}

function compactToolResult(result) {
  const raw = JSON.stringify(result);
  return truncateText(raw, MAX_TOOL_RESPONSE_CHARS);
}

const toolDeclarations = [
  {
    name: "get_job_detail",
    description: "Lấy thông tin chi tiết một job theo jobId",
    parameters: {
      type: Type.OBJECT,
      properties: {
        jobId: { type: Type.STRING },
      },
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
        skills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
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
      properties: {
        candidateId: { type: Type.STRING },
      },
      required: ["candidateId"],
    },
  },
  {
    name: "shortlist_candidate",
    description: "Đưa ứng viên vào shortlist theo applicationId",
    parameters: {
      type: Type.OBJECT,
      properties: {
        applicationId: { type: Type.STRING },
      },
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

    const userPrompt = [
      `Page context: ${JSON.stringify(conversation.pageContext)}`,
      `Yêu cầu người dùng: ${message}`,
    ].join("\n\n");

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      ...buildHistory(conversation.messages),
      { role: "user", parts: [{ text: userPrompt }] },
    ];

    const first = await withTimeout(
      ai.models.generateContent({
        model: MODEL_NAME,
        contents,
        config: {
          tools: [{ functionDeclarations: toolDeclarations }],
          maxOutputTokens: 700,
          temperature: 0.3,
        },
      }),
      25000,
      "AI chat lần 1",
    );

    const functionCalls = first.functionCalls || [];
    let replyText = first.text || "";

    if (functionCalls.length) {
      const toolResponses = [];

      for (const call of functionCalls) {
        const result = await executeTool(call.name, call.args || {}, userId);
        const compactResult = compactToolResult(result);

        toolResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: compactResult },
          },
        });

        conversation.messages.push({
          role: "tool",
          toolName: call.name,
          content: compactResult,
        });
      }

      const second = await withTimeout(
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            ...buildHistory(conversation.messages),
            { role: "model", parts: first.candidates?.[0]?.content?.parts || [] },
            { role: "user", parts: toolResponses },
            { role: "user", parts: [{ text: "Tóm tắt kết quả rõ ràng, tối đa 8 gạch đầu dòng." }] },
          ],
          config: {
            maxOutputTokens: 700,
            temperature: 0.2,
          },
        }),
        25000,
        "AI chat lần 2",
      );

      replyText = second.text || "Tôi đã xử lý xong yêu cầu.";
    }

    conversation.messages.push({ role: "user", content: message }, { role: "assistant", content: replyText || "Tôi chưa có phản hồi rõ ràng." });

    await conversation.save();

    return res.json({
      success: true,
      conversationId: conversation._id,
      reply: replyText || "Tôi chưa có phản hồi rõ ràng.",
      provider: "gemini",
      model: MODEL_NAME,
    });
  } catch (error) {
    console.error("aiChat error:", error);

    const isTimeout = error.message?.includes("timeout");
    const isQuota = error.message?.includes("quota") || error.status === 429;

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
