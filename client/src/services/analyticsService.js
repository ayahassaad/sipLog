import api from "./api";

// Fire-and-forget: a failed visit ping should never surface an error to
// whoever's just trying to use the app, so this deliberately swallows
// errors instead of throwing like the rest of the services.
export async function recordVisit() {
  try {
    await api.post("/analytics/visit");
  } catch {
    // Non-critical -- nothing to do if this fails.
  }
}
