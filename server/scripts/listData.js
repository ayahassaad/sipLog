require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const Tasting = require("../models/Tasting");
// Not used directly, but Tasting.wineId refs "Wine" -- populate() below
// needs that schema registered on this connection first.
require("../models/Wine");

// Read-only -- prints every user and every tasting so we can see what's
// actually in the database before deciding what (if anything) to remove.

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({}).sort({ createdAt: 1 });
  console.log(`\n=== Users (${users.length}) ===`);
  users.forEach((user) => {
    console.log(
      `- id=${user._id}  username=@${user.username}  email=${user.email}  name="${user.name}"  createdAt=${user.createdAt?.toISOString?.() || "n/a"}`
    );
  });

  const tastings = await Tasting.find({})
    .sort({ createdAt: 1 })
    .populate("userId", "username email")
    .populate("wineId", "name producer");
  console.log(`\n=== Tastings (${tastings.length}) ===`);
  tastings.forEach((tasting) => {
    const author = tasting.userId ? `@${tasting.userId.username}` : "(no author)";
    const wine = tasting.wineId ? tasting.wineId.name : "(no wine)";
    console.log(
      `- id=${tasting._id}  author=${author}  wine="${wine}"  createdAt=${tasting.createdAt?.toISOString?.() || "n/a"}`
    );
  });

  console.log("");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Listing failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
