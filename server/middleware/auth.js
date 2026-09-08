const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");
const { COOKIE_NAME } = require("../utils/cookies");

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authenticated" });
  }
}

// For routes that are public but still personalize their response for a
// logged-in visitor (the community feed, the user directory): attach
// req.user when a valid session cookie is present, but never reject the
// request just because one isn't -- that's the whole point of these routes.
async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return next();
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
}

module.exports = { requireAuth, optionalAuth };
