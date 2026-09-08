const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // The public handle -- shown to other people instead of your email
    // (on your profile, in the Community feed, in follow lists), and what
    // a future "find someone" search will match against. Kept separate
    // from `name`, which stays a free-text display name.
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    following: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    favorites: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tasting" }],
      default: [],
    },
    // Grants access to the admin tab (user directory + site stats).
    // Anyone with isSuperAdmin is implicitly an admin too (see the
    // requireAdmin middleware) even if this flag were somehow unset.
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // The one account (ayahassaad, set via scripts/setSuperAdmin.js) that's
    // allowed to grant or revoke isAdmin on other users. Never settable
    // through the API -- only ever changed by running that script directly
    // against the database.
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
