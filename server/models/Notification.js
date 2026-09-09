const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Who this notification is for.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Who did the thing that triggered it.
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["follow", "unfollow", "favorite", "message", "comment"],
      required: true,
    },
    // Only set for "message" notifications -- lets a click jump straight
    // into the right conversation, and is what notify() in
    // ../notifications.js matches on to bump an existing unread
    // notification instead of creating one per message.
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Every list/unread-count query is "this user's notifications, newest
// first" -- the one index that matters.
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
