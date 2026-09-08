// One-off maintenance script: grants the single super-admin flag to one
// account. Deliberately not reachable through the API at all -- the only
// way to make (or move) the super admin is to run this directly against
// the database. isSuperAdmin implies admin access on its own (see
// middleware/adminAuth.js), so this also gives ayahassaad the admin tab
// without needing isAdmin set separately.
//
// Usage:
//   node scripts/setSuperAdmin.js [username]
// Defaults to "ayahassaad" when no username is given.
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  const [, , usernameArg] = process.argv;
  const username = (usernameArg || "ayahassaad").trim().toLowerCase();

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const user = await User.findOneAndUpdate(
      { username },
      { isSuperAdmin: true, isAdmin: true },
      { returnDocument: "after", runValidators: true }
    );

    if (!user) {
      console.error(`No user found with username "${username}"`);
      process.exitCode = 1;
      return;
    }

    console.log(`${user.username} (${user.email}) is now the super admin.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exitCode = 1;
});
