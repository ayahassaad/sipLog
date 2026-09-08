const rateLimit = require("express-rate-limit");

// Jest sets NODE_ENV=test automatically, and the test suites register/log
// in dozens of times per run (fresh users for isolation) -- without this,
// the suite itself would trip its own rate limit well before real traffic
// ever could.
const skipInTests = () => process.env.NODE_ENV === "test";

// Login and register are the classic brute-force / credential-stuffing
// surface. 20 attempts per 15 minutes per IP is generous for a real person
// fumbling a password, but throttles automated guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

// Changing your email or password re-checks your current password
// server-side, which is also a guessing surface -- its own (tighter) limit
// so it doesn't share a budget with plain login attempts.
const accountChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

module.exports = { authLimiter, accountChangeLimiter };
