require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const Tasting = require("../models/Tasting");

// The placeholder accounts scripts/seed.js creates for local development --
// never real signups. These predate the username field, so their username
// is undefined in the database; matched by email instead. Deliberately does
// NOT touch ayah@siplog.app: that seed account was later turned into a real
// login (see scripts/setUsername.js) and should be left alone.
const FAKE_EMAILS = ["sara@siplog.app", "leila@siplog.app", "emma@siplog.app", "nora@siplog.app"];
const PROTECTED_EMAILS = ["ayah@siplog.app"];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const targetEmails = FAKE_EMAILS.filter((email) => !PROTECTED_EMAILS.includes(email));

  const fakeUsers = await User.find({ email: { $in: targetEmails } });

  if (fakeUsers.length === 0) {
    console.log("No matching seed accounts found -- nothing to remove.");
    await mongoose.disconnect();
    return;
  }

  console.log("Found these seed accounts to remove:");
  fakeUsers.forEach((user) => console.log(`- ${user.name}  (${user.email})`));

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
