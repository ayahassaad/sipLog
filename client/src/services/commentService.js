import api from "./api";

function extractMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export async function fetchComments(tastingId) {
  try {
    const res = await api.get(`/tastings/${tastingId}/comments`);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load comments"));
  }
}

export async function postComment(tastingId, text) {
  try {
    const res = await api.post(`/tastings/${tastingId}/comments`, { text });
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to post comment"));
  }
}

export async function deleteComment(tastingId, commentId) {
  try {
    await api.delete(`/tastings/${tastingId}/comments/${commentId}`);
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to delete comment"));
  }
}
