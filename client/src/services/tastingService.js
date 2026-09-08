import api from "./api";

function extractMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export async function fetchTastings({ page = 1, limit = 50 } = {}) {
  try {
    const res = await api.get("/tastings", { params: { page, limit } });
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load tastings"));
  }
}

export async function fetchCommunityFeed({ page = 1, limit = 50, search = "", author = "" } = {}) {
  try {
    const params = { page, limit };
    if (search) {
      params.search = search;
    }
    if (author) {
      params.author = author;
    }
    const res = await api.get("/tastings/feed", { params });
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load the community feed"));
  }
}

export async function fetchFavoriteTastings({ page = 1, limit = 50 } = {}) {
  try {
    const res = await api.get("/tastings/favorites", { params: { page, limit } });
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load your favorites"));
  }
}

export async function favoriteTasting(id) {
  try {
    const res = await api.post(`/tastings/${id}/favorite`);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to favorite tasting"));
  }
}

export async function unfavoriteTasting(id) {
  try {
    const res = await api.post(`/tastings/${id}/unfavorite`);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to unfavorite tasting"));
  }
}

export async function fetchTastingById(id) {
  try {
    const res = await api.get(`/tastings/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load tasting"));
  }
}

export async function createTasting(payload) {
  try {
    const res = await api.post("/tastings", payload);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to create tasting"));
  }
}

export async function updateTasting(id, payload) {
  try {
    const res = await api.put(`/tastings/${id}`, payload);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to update tasting"));
  }
}

export async function deleteTasting(id) {
  try {
    await api.delete(`/tastings/${id}`);
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to delete tasting"));
  }
}
