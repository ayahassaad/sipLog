const mongoose = require("mongoose");

// A conversation is always between exactly two people -- group chat isn't
// in scope yet. `participantsKey` is the two participant ids (as strings)
// sorted and joined together, giving a single canonical value per pair;
// the unique index on it is what stops two conversations ever being
// created between the same two people. A unique index directly on the
// `participants` array wouldn't do that -- array indexes are multikey, so
// it would enforce uniqueness per *element* (no user could appear in more
// than one conversation at all), not per pair.
const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (value) => value.length === 2,
        message: "A conversation needs exactly two participants",
      },
    },
    participantsKey: {
      type: String,
      required: true,
      unique: true,
    },
    // Denormalized preview shown in the inbox list, updated every time a
    // message is sent -- avoids an extra lookup/aggregation just to render
    // the conversation list.
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageText: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
