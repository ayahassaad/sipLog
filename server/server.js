const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { requireAuth } = require("./middleware/auth");

const authRoutes = require("./routes/authRoutes");
const tastingRoutes = require("./routes/tastingRoutes");
const wineRoutes = require("./routes/wineRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// Render (and most hosts) put the app behind one reverse-proxy hop. Without
// this, every request looks like it comes from that proxy's IP to Express,
// which breaks both real client IPs in logs and the rate limiters below
// (everyone would share one bucket). Only trusted in production, where
// that single hop is actually true -- not in local dev, where there isn't
// a proxy to trust.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Sensible default security headers (X-Content-Type-Options, a baseline
// Content-Security-Policy, no X-Powered-By, etc.) -- cheap, standard
// hardening for an API that a browser talks to directly.
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
// Tastings and users each have a couple of public read routes (the
// community feed, the user directory), so they apply requireAuth per-route
// internally instead of here. Wines and uploads stay fully private.
app.use("/api/tastings", tastingRoutes);
app.use("/api/wines", requireAuth, wineRoutes);
app.use("/api/uploads", requireAuth, uploadRoutes);
app.use("/api/users", userRoutes);
// Auth + admin checks happen inside adminRoutes itself (every route there
// needs both), same pattern as tastings/users above.
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

// Tests import `app` directly and manage their own DB connection, so only
// auto-start the server when this file is run directly (`node server.js`).
if (require.main === module) {
  start();
}

module.exports = app;
