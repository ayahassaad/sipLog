const COOKIE_NAME = "siplog_token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// In production (deployed) the frontend and backend live on different domains,
// so the cookie needs SameSite=None + Secure to be sent cross-site at all.
// Locally (http://localhost) that combination is rejected by browsers, so we
// fall back to Lax + non-Secure there.
function cookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: SEVEN_DAYS_MS,
    path: "/",
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}

module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie };
