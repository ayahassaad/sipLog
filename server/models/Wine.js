const mongoose = require("mongoose");

const wineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  producer: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  region: {
    type: String,
    default: "",
    trim: true,
  },
  grape: {
    type: String,
    required: true,
    trim: true,
  },
  vintage: {
    type: Number,
    required: true,
  },
  // Drives the rating-bottle illustration on the frontend (see
  // BottleRating.jsx): liquid color and bottle silhouette both vary by type.
  type: {
    type: String,
    enum: ["red", "white", "sparkling", "sweet"],
    default: "red",
    required: true,
  },
});

module.exports = mongoose.model("Wine", wineSchema);
