import api from "./api";

function extractMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export async function fetchNotifications() {
  try {
    const res = await api.get("/notifications");
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load notifications"));
  }
}

export async function markNotificationsRead() {
  try {
    const res = await api.post("/notifications/read");
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to mark notifications as read"));
  }
}
