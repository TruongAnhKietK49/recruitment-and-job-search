import dotenv from "dotenv";
import mongoose from "mongoose";
import { GoogleGenAI, Type } from "@google/genai";
import AIConversation from "../models/AIConversation.js";
import { executeTool } from "../services/aiTools.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Thiếu GEMINI_API_KEY trong .env");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function normalizePageContext(pageContext = {}) {
  return {
    jobId: pageContext.jobId && mongoose.Types.ObjectId.isValid(pageContext.jobId) ? pageContext.jobId : null,
    category: typeof pageContext.category === "string" ? pageContext.category.trim() : "",
    jobTitle: typeof pageContext.jobTitle === "string" ? pageContext.jobTitle.trim() : "",
  };
}

function buildHistory(messages = []) {
  return messages.slice(-12).map((m) => ({
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

    const first = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const functionCalls = first.functionCalls || [];
    let replyText = first.text || "";

    if (functionCalls.length) {
      const toolResponses = [];

      for (const call of functionCalls) {
        const result = await executeTool(call.name, call.args || {}, userId);
        toolResponses.push({
          functionResponse: {
            name: call.name,
            response: result,
          },
        });

        conversation.messages.push({
          role: "tool",
          toolName: call.name,
          content: JSON.stringify({ args: call.args || {}, result }),
        });
      }

      const second = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          ...contents,
          {
            role: "model",
            parts: first.candidates?.[0]?.content?.parts || [],
          },
          {
            role: "user",
            parts: toolResponses,
          },
        ],
      });

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
    return res.status(500).json({
      success: false,
      message: "Không thể xử lý AI chat.",
      error: error.message,
    });
  }
};
