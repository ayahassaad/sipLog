require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const Tasting = require("../models/Tasting");

// The placeholder accounts scripts/seed.js creates for local development --
// never real signups. Deliberately does NOT touch "ayah"/"ayahassaad": that
// seed account was later turned into a real login (see scripts/setUsername.js)
// and should be left alone.
const FAKE_USERNAMES = ["sara", "leila", "emma", "nora"];
const PROTECTED_USERNAMES = ["ayah", "ayahassaad"];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const targetUsernames = FAKE_USERNAMES.filter(
    (username) => !PROTECTED_USERNAMES.includes(username)
  );

  const fakeUsers = await User.find({ username: { $in: targetUsernames } });

  if (fakeUsers.length === 0) {
    console.log("No matching seed accounts found -- nothing to remove.");
    await mongoose.disconnect();
    return;
  }

  console.log("Found these seed accounts to remove:");
  fakeUsers.forEach((user) => console.log(`- @${user.username}  (${user.email})`));

  const fakeUserIds = fakeUsers.map((user) => user._id);

  const fakeTastings = await Tasting.find({ userId: { $in: fakeUserIds } }).select("_id");
  const fakeTastingIds = fakeTastings.map((tasting) => tasting._id);

  const deletedTastings = await Tasting.deleteMany({ _id: { $in: fakeTastingIds } });
  const deletedUsers = await User.deleteMany({ _id: { $in: fakeUserIds } });

  // Clean up dangling references left on real accounts: anyone who followed
  // a fake account, or favorited one of its tastings.
  await User.updateMany({}, { $pull: { following: { $in: fakeUserIds } } });
  await User.updateMany({}, { $pull: { favorites: { $in: fakeTastingIds } } });

  console.log(
    `\nDeleted ${deletedUsers.deletedCount} user(s) and ${deletedTastings.deletedCount} tasting(s).`
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Cleanup failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
