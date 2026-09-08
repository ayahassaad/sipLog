const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    // Set once the recipient has opened this conversation and this message
    // was included in that read -- drives the unread badge/count. Only
    // meaningful on messages sent by the *other* participant; a user's own
    // sent messages are never "unread" from their own point of view.
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Every message list/read/aggregate query below is scoped to one
// conversation and ordered by time -- this is the one index that matters.
messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
