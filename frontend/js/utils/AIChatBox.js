import URL from "../utils/url.js";

const token = sessionStorage.getItem("token") || localStorage.getItem("token") || null;
let currentConversationId = null;

function getCurrentJobId() {
  return document.getElementById("jobFilter")?.value || document.querySelector("[data-job-id]")?.dataset.jobId || null;
}

function getCurrentCategory() {
  return document.getElementById("categoryFilter")?.value || document.querySelector("[data-category]")?.dataset.category || null;
}

function getCurrentJobTitle() {
  return document.querySelector("[data-job-title]")?.dataset.jobTitle || document.querySelector(".job-title")?.textContent?.trim() || null;
}

function appendMessage(text, sender = "ai") {
  const body = document.getElementById("aiChatBody");
  if (!body) return null;

  const div = document.createElement("div");
  div.className = `ai-message ${sender}`;
  div.textContent = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  return div;
}

async function sendAiMessage() {
  const input = document.getElementById("aiChatInput");
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  input.value = "";

  const typing = appendMessage("AI đang xử lý...", "ai");

  try {
    const res = await fetch(`${URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        conversationId: currentConversationId,
        pageContext: {
          jobId: getCurrentJobId(),
          category: getCurrentCategory(),
          jobTitle: getCurrentJobTitle(),
        },
      }),
    });

    const data = await res.json();
    typing?.remove();

    if (!res.ok) {
      appendMessage(data.message || "Không thể xử lý AI chat.", "ai");
      return;
    }

    currentConversationId = data.conversationId || currentConversationId;
    appendMessage(data.reply || "Tôi chưa có phản hồi.", "ai");
  } catch (error) {
    typing?.remove();
    appendMessage("Có lỗi xảy ra khi kết nối AI.", "ai");
    console.error(error);
  }
}

export function initAiChatbox() {
  const toggleAiChat = document.getElementById("toggleAiChat");
  const closeAiChat = document.getElementById("closeAiChat");
  const aiChatbox = document.getElementById("aiChatbox");
  const sendBtn = document.getElementById("sendAiChat");
  const input = document.getElementById("aiChatInput");

  toggleAiChat?.addEventListener("click", () => {
    aiChatbox?.classList.toggle("d-none");
  });

  closeAiChat?.addEventListener("click", () => {
    aiChatbox?.classList.add("d-none");
  });

  sendBtn?.addEventListener("click", sendAiMessage);

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendAiMessage();
    }
  });
}
