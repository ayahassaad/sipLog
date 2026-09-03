import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// withCredentials is what lets the browser send/receive the httpOnly auth
// cookie on cross-origin requests (frontend and backend live on different
// domains once deployed).
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default api;
