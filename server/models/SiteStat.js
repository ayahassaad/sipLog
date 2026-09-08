const mongoose = require("mongoose");

// A single small document (there's only ever one, _id: "site") used as a
// running counter -- currently just total visits, but a natural home for
// any other site-wide tally that doesn't belong to a specific user, wine,
// or tasting.
const siteStatSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  totalVisits: { type: Number, default: 0 },
});

module.exports = mongoose.model("SiteStat", siteStatSchema);
