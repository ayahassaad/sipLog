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


export async function fetchUserProfile(username) {
  try {
    const res = await api.get(`/users/${username}`);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load this profile"));
  }
}

export async function fetchMyProfile() {
  try {
    const res = await api.get("/users/me");
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load your profile"));
  }
}

export async function updateMyProfile(updates) {
  try {
    const res = await api.patch("/users/me", updates);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to update your profile"));
  }
}

export async function updateMyEmail(payload) {
  try {
    const res = await api.patch("/users/me/email", payload);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to update your email"));
  }
}

export async function updateMyPassword(payload) {
  try {
    const res = await api.patch("/users/me/password", payload);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to update your password"));
  }
}
