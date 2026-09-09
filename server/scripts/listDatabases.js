// One-off diagnostic: lists every database that actually exists on the
// cluster this connection string points to, with sizes -- so we can see
// the real, exact name/casing of the one holding real data, instead of
// guessing.
//
// Usage:
//   MONGO_URI="<connection string, database name in the path doesn't matter here>" node server/scripts/listDatabases.js
const mongoose = require("mongoose");

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const admin = mongoose.connection.db.admin();
  const result = await admin.listDatabases();

  console.log("Databases visible on this cluster:");
  result.databases.forEach((db) => {
    console.log(` - ${db.name}  (${(db.sizeOnDisk / 1024).toFixed(1)} KB)`);
  });

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to list databases:", error.message);
  process.exit(1);
});
