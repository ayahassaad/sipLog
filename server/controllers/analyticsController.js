const SiteStat = require("../models/SiteStat");

// Fire-and-forget from the client once per app load (see App.jsx) -- counts
// as a "visit" whether or not anyone is logged in. Deliberately just a
// running total (no per-visitor identity, no per-day buckets) rather than
// a full analytics system.
exports.recordVisit = async (_req, res) => {
  try {
    await SiteStat.findByIdAndUpdate(
      "site",
      { $inc: { totalVisits: 1 } },
      { upsert: true }
    );
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
