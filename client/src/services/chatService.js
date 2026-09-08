import api from "./api";

function extractMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export async function fetchConversations() {
  try {
    const res = await api.get("/chat/conversations");
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load your conversations"));
  }
}

export async function getOrCreateConversation(userId) {
  try {
    const res = await api.post("/chat/conversations", { userId });
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to start this conversation"));
  }
}

export async function fetchMessages(conversationId, { page = 1, limit = 30 } = {}) {
  try {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load messages"));
  }
}

export async function sendMessage(conversationId, text) {
  try {
    const res = await api.post(`/chat/conversations/${conversationId}/messages`, { text });
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to send message"));
  }
}

export async function markConversationRead(conversationId) {
  try {
    const res = await api.post(`/chat/conversations/${conversationId}/read`);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to mark conversation as read"));
  }
}
