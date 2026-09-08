import api from "./api";

function extractMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export async function fetchAdminUsers({ page = 1, limit = 25, search = "" } = {}) {
  try {
    const params = { page, limit };
    if (search) {
      params.search = search;
    }
    const res = await api.get("/admin/users", { params });
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load the user directory"));
  }
}

export async function setUserAdminStatus(id, isAdmin) {
  try {
    const res = await api.patch(`/admin/users/${id}/admin`, { isAdmin });
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to update admin access"));
  }
}

export async function fetchAdminStats() {
  try {
    const res = await api.get("/admin/stats");
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to load site stats"));
  }
}

export async function deleteAdminTasting(id) {
  try {
    const res = await api.delete(`/admin/tastings/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(extractMessage(error, "Failed to remove this tasting"));
  }
}
