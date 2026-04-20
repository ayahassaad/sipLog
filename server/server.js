const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const tastingRoutes = require("./routes/tastingRoutes");
const wineRoutes = require("./routes/wineRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use("/api/tastings", tastingRoutes);
app.use("/api/wines", wineRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5001, () => {
      console.log("Server running on port 5001");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
