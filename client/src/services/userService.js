import api from "./api";

function extractMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export async function fetchUsers() {
  try {
    const res = await api.get("/users");
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load users"));
  }
}

export async function followUser(id) {
  try {
    const res = await api.post(`/users/${id}/follow`);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to follow user"));
  }
}

export async function unfollowUser(id) {
  try {
    const res = await api.post(`/users/${id}/unfollow`);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to unfollow user"));
  }
}
