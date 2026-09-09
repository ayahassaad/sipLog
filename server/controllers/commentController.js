const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Tasting = require("../models/Tasting");
const { notify } = require("../notifications");

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function toComment(comment) {
  const author = comment.userId;
  return {
    id: comment._id.toString(),
    text: comment.text,
    createdAt: comment.createdAt,
    author: author
      ? {
          id: author._id.toString(),
          name: author.name,
          username: author.username,
          avatarUrl: author.avatarUrl || "",
        }
      : null,
  };
}

// Public: anyone can read a tasting's comment thread, same as the feed
// itself -- no login needed to browse, only to post. Capped well above
// what any real thread here is likely to reach, so this never needs its
// own pagination.
exports.listComments = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid tasting id" });
    }

    const comments = await Comment.find({ tastingId: id })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate("userId", "name username avatarUrl");

    res.json({ comments: comments.map(toComment) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid tasting id" });
    }

    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    if (text.length > 500) {
      return res.status(400).json({ message: "Comment must be 500 characters or fewer" });
    }

    const tasting = await Tasting.findById(id).select("userId");
    if (!tasting) {
      return res.status(404).json({ message: "Tasting not found" });
    }

    const comment = await Comment.create({ tastingId: id, userId: req.user._id, text });
    await comment.populate("userId", "name username avatarUrl");

    // Same fire-and-forget pattern as follow/favorite/message -- a failed
    // notification never blocks the comment itself from being saved.
    notify({ userId: tasting.userId, actorId: req.user._id, type: "comment" });

    res.status(201).json(toComment(comment));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Only the person who wrote a comment can delete it -- no moderation-by-
// tasting-owner path for now, matching how a favorite can only be undone
// by whoever favorited it.
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const deleted = await Comment.findOneAndDelete({ _id: commentId, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
