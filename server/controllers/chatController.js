const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { emitToUser } = require("../socket");
const { notify } = require("../notifications");

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function buildParticipantsKey(idA, idB) {
  return [idA, idB].map(String).sort().join("_");
}

// Minimal, non-sensitive shape of "the other person" in a conversation --
// same fields as the rest of the app's user summaries (toDirectoryUser,
// toConnectionUser in userController).
function toOtherParticipant(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl || "",
  };
}

// Ids explicitly stringified here (rather than left as ObjectIds) so a
// message looks identical whether it reaches the client via the REST
// response or the socket push below.
function toMessage(message) {
  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    senderId: message.senderId.toString(),
    text: message.text,
    createdAt: message.createdAt,
    readAt: message.readAt,
  };
}

// Confirms `userId` is actually one of the two participants on this
// conversation before any other chat action proceeds -- every route below
// calls this first.
async function loadOwnConversation(conversationId, userId) {
  if (!isValidObjectId(conversationId)) {
    return { error: { status: 400, message: "Invalid conversation id" } };
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return { error: { status: 404, message: "Conversation not found" } };
  }

  const isParticipant = conversation.participants.some(
    (id) => id.toString() === userId
  );
  if (!isParticipant) {
    return { error: { status: 403, message: "Not part of this conversation" } };
  }

  return { conversation };
}

// -- Inbox: every conversation the signed-in user is part of, newest first,
// with the other person's info and an unread count for the badge.
exports.listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "name username avatarUrl");

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversations.map((conversation) => conversation._id) },
          senderId: { $ne: req.user._id },
          readAt: null,
        },
      },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]);
    const unreadByConversation = new Map(
      unreadCounts.map((entry) => [entry._id.toString(), entry.count])
    );

    res.json(
      conversations.map((conversation) => {
        const otherUser = conversation.participants.find(
          (participant) => participant._id.toString() !== req.user._id.toString()
        );

        return {
          id: conversation._id.toString(),
          otherUser: otherUser ? toOtherParticipant(otherUser) : null,
          lastMessageAt: conversation.lastMessageAt,
          lastMessageText: conversation.lastMessageText,
          unreadCount: unreadByConversation.get(conversation._id.toString()) || 0,
        };
      })
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -- Starts (or reuses) the one conversation between the signed-in user and
// another user, by that user's id. Idempotent, so a "Message" button on a
// profile can just call this every time rather than the frontend having to
// track conversation ids itself.
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't message yourself" });
    }

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const participantsKey = buildParticipantsKey(req.user._id, userId);

    let conversation = await Conversation.findOne({ participantsKey });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
        participantsKey,
      });
    }

    res.json({
      id: conversation._id.toString(),
      otherUser: toOtherParticipant(otherUser),
      lastMessageAt: conversation.lastMessageAt,
      lastMessageText: conversation.lastMessageText,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -- Messages in one conversation, oldest first. `page` counts back from
// the most recent page (page 1 == newest messages) -- same page/limit
// convention as the tasting feeds, just applied from the other end.
exports.listMessages = async (req, res) => {
  try {
    const { conversation, error } = await loadOwnConversation(
      req.params.id,
      req.user._id.toString()
    );
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

    const total = await Message.countDocuments({ conversationId: conversation._id });
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      messages: messages.map(toMessage).reverse(),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -- Sends a message into a conversation, updates its inbox preview, and
// pushes it over the socket to the other participant if they're online --
// their inbox/open thread updates live, no refresh needed.
exports.sendMessage = async (req, res) => {
  try {
    const { conversation, error } = await loadOwnConversation(
      req.params.id,
      req.user._id.toString()
    );
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    if (!text) {
      return res.status(400).json({ message: "Message can't be empty" });
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: "Message is too long" });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      text,
    });

    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessageText = text;
    await conversation.save();

    const payload = toMessage(message);

    const otherUserId = conversation.participants
      .find((id) => id.toString() !== req.user._id.toString())
      .toString();
    emitToUser(otherUserId, "message:new", payload);
    notify({
      userId: otherUserId,
      actorId: req.user._id,
      type: "message",
      conversationId: conversation._id,
    });

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -- Marks every message the *other* person sent in this conversation as
// read, once the signed-in user actually opens the thread.
exports.markConversationRead = async (req, res) => {
  try {
    const { conversation, error } = await loadOwnConversation(
      req.params.id,
      req.user._id.toString()
    );
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    await Message.updateMany(
      { conversationId: conversation._id, senderId: { $ne: req.user._id }, readAt: null },
      { readAt: new Date() }
    );

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
