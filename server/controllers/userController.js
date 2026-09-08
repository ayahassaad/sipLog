const mongoose = require("mongoose");
const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/password");

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

// Shape used for the Following/Followers lists on your own profile page --
// same idea as toDirectoryUser, plus the avatar since the profile page shows
// a small picture next to each name.
function toConnectionUser(user, followingIds) {
  return {
    id: user._id,
    name: user.name,
    avatarUrl: user.avatarUrl || "",
    isFollowing: followingIds.has(user._id.toString()),
  };
}

function toOwnProfile(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || "",
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


// -- Your own profile: view (with connections), and edit name/avatar/email/
// password. Kept separate from followUser/unfollowUser above, which act on
// *other* users' ids instead of the signed-in user.

exports.getMyProfile = async (req, res) => {
  try {
    const [following, followers] = await Promise.all([
      User.find({ _id: { $in: req.user.following } }).sort({ name: 1 }),
      User.find({ following: req.user._id }).sort({ name: 1 }),
    ]);

    const followingIds = new Set(req.user.following.map((id) => id.toString()));

    res.json({
      ...toOwnProfile(req.user),
      following: following.map((user) => toConnectionUser(user, followingIds)),
      followers: followers.map((user) => toConnectionUser(user, followingIds)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const updates = {};

    if (typeof req.body.name === "string") {
      const trimmedName = req.body.name.trim();
      if (!trimmedName) {
        return res.status(400).json({ message: "Name can't be empty" });
      }
      updates.name = trimmedName;
    }

    if (typeof req.body.avatarUrl === "string") {
      updates.avatarUrl = req.body.avatarUrl;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

    res.json(toOwnProfile(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMyEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (typeof newEmail !== "string" || !newEmail.trim()) {
      return res.status(400).json({ message: "A new email is required" });
    }
    if (typeof currentPassword !== "string" || !currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    const passwordMatches = await comparePassword(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const email = newEmail.trim().toLowerCase();
    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }

    user.email = email;
    await user.save();

    res.json(toOwnProfile(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== "string" || !currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    const passwordMatches = await comparePassword(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
