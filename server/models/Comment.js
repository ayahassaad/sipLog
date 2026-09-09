const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    tastingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tasting",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Every comment list is "this tasting's comments, oldest first" -- the one
// index that matters, same reasoning as Notification's userId/createdAt one.
commentSchema.index({ tastingId: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
