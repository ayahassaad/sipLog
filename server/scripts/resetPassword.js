// One-off dev utility: reset a single user's password directly in the
// database. Useful when the app's own password-change flow isn't
// accessible (e.g. you're locked out of the account you need).
//
// Usage:
//   MONGO_URI="<your current connection string>" node server/scripts/resetPassword.js <email> <newPassword>
//
// Passing MONGO_URI inline like this (rather than relying on server/.env)
// guarantees it uses the exact connection string you know currently works,
// even if server/.env has gone stale from earlier troubleshooting.
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { hashPassword } = require("../utils/password");

async function main() {
  const [, , email, newPassword] = process.argv;

  if (!email || !newPassword) {
    console.error("Usage: node resetPassword.js <email> <newPassword>");
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Pass it inline, e.g.:");
    console.error('  MONGO_URI="mongodb+srv://..." node server/scripts/resetPassword.js <email> <newPassword>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    console.error(`No user found with email ${normalizedEmail}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  console.log(`Password updated for ${user.email} (${user.username}).`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to reset password:", error.message);
  process.exit(1);
});
