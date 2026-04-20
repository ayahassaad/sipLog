const mongoose = require("mongoose");

const tastingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wine",
      required: true,
    },
    appearance: {
      type: String,
      required: true,
      trim: true,
    },
    noseNotes: {
      type: [String],
      default: [],
    },
    palateNotes: {
      type: [String],
      default: [],
    },
    sweetness: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    acidity: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    body: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    tannin: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    wouldBuyAgain: {
      type: Boolean,
      default: false,
    },
    moodTags: {
      type: [String],
      default: [],
    },
    personalThoughts: {
      type: String,
      maxlength: 500,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    tastedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tasting", tastingSchema);
