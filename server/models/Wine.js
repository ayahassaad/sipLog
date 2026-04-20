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
  },
  region: {
    type: String,
    required: true,
  },
  grape: {
    type: String,
    required: true,
  },
  vintage: {
    type: Number,
    min: 1900,
    max: 2100,
  },
  type: {
    type: String,
    required: true,
    enum: ["Red", "White", "Rose", "Sparkling", "Dessert"],
  },
});

module.exports = mongoose.model("Wine", wineSchema);