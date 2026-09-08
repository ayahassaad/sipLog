const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { requireAuth } = require("./middleware/auth");

const authRoutes = require("./routes/authRoutes");
const tastingRoutes = require("./routes/tastingRoutes");
const wineRoutes = require("./routes/wineRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

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
