// One-off diagnostic: confirms which database a given MONGO_URI actually
// connects to, and lists what's in the users collection there (emails only
// -- never prints password hashes).
//
// Usage:
//   MONGO_URI="<connection string>" node server/scripts/debugConnection.js
const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log("Connected host:", mongoose.connection.host);
  console.log("Connected database name:", mongoose.connection.name);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections in this database:", collections.map((c) => c.name));

  const count = await User.countDocuments();
  console.log("Total documents in users collection:", count);

  const users = await User.find().select("email username _id").limit(20);
  console.log("Users found:");
  users.forEach((u) => console.log(` - ${u.email} (${u.username}) id=${u._id}`));

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Debug connection failed:", error.message);
  process.exit(1);
});
