// One-off maintenance script: set (or fix) a single user's username directly
// in the database. Useful for accounts created before the username field
// existed, or to hand-correct one account without going through the app.
//
// Usage:
//   node scripts/setUsername.js <email> <newUsername>
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  const [, , email, username] = process.argv;

  if (!email || !username) {
    console.error("Usage: node scripts/setUsername.js <email> <newUsername>");
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const user = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { username: username.trim().toLowerCase() },
      { new: true, runValidators: true }
    );

    if (!user) {
      console.error(`No user found with email "${email}"`);
      process.exitCode = 1;
      return;
    }

    console.log(`Updated ${user.email} -> username "${user.username}"`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exitCode = 1;
});
