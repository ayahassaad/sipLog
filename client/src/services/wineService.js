import api from "./api";

function extractMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export async function fetchWines() {
  try {
    const res = await api.get("/wines");
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load wines"));
  }
}

export async function createWine(payload) {
  try {
    const res = await api.post("/wines", payload);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to create wine"));
  }
}
