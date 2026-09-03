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
