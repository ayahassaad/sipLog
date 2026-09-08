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

// The visit counter is hit by anyone, logged in or not, so it can't rely
// on requireAuth's per-user identity the way the limiters above do -- this
// is purely about stopping someone from scripting a loop against a public,
// unauthenticated write endpoint to inflate the number. 30 per IP per
// minute is far more than a real person opening the app could ever hit.
const visitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { message: "Too many requests." },
});

// Chat is open to any logged-in user, so a message-send endpoint needs its
// own throttle the way the other write-heavy public-ish endpoints do --
// generous enough for a real conversation, tight enough to stop a script
// from hammering someone's inbox.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { message: "You're sending messages too quickly. Please slow down." },
});

module.exports = { authLimiter, accountChangeLimiter, visitLimiter, chatLimiter };
