import api from "./api";

function extractMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export async function registerUser({ name, username, email, password }) {
  try {
    const res = await api.post("/auth/register", { name, username, email, password });
    return res.data.user;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to register"));
  }
}

export async function loginUser({ email, password }) {
  try {
    const res = await api.post("/auth/login", { email, password });
    return res.data.user;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to log in"));
  }
}

export async function logoutUser() {
  await api.post("/auth/logout");
}

export async function fetchCurrentUser() {
  const res = await api.get("/auth/me");
  return res.data.user;
}
