const mongoose = require("mongoose");
const User = require("../models/User");

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

// Minimal, non-sensitive shape for browsing other users (no email exposed).
function toDirectoryUser(user, followingIds) {
  return {
    id: user._id,
    name: user.name,
    isFollowing: followingIds.has(user._id.toString()),
  };
}

exports.listUsers = async (req, res) => {
  try {
    // The user directory is public -- browsing "People to Follow" doesn't
    // require an account, only actually following someone does. A logged-out
    // visitor sees everyone (no self to exclude, nothing followed yet).
    const query = req.user ? { _id: { $ne: req.user._id } } : {};
    const users = await User.find(query).sort({ name: 1 });
    const followingIds = new Set((req.user?.following || []).map((id) => id.toString()));

    res.json(users.map((user) => toDirectoryUser(user, followingIds)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const targetExists = await User.exists({ _id: id });
    if (!targetExists) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.updateOne({ _id: req.user._id }, { $addToSet: { following: id } });

    res.json({ message: "Followed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    await User.updateOne({ _id: req.user._id }, { $pull: { following: id } });

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
