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
});

module.exports = mongoose.model("Wine", wineSchema);
