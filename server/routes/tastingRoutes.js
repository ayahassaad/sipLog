const express = require("express");
const router = express.Router();
const tastingController = require("../controllers/tastingController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// The community feed is the one tasting route that's public -- everything
// else here is private (your own journal, favorites, and any writes), so
// requireAuth is applied per-route instead of to the whole router.
router.get("/feed", optionalAuth, tastingController.getCommunityFeed);
router.get("/stats/summary", requireAuth, tastingController.getTastingStats);
router.get("/favorites", requireAuth, tastingController.getFavoriteTastings);
router.get("/", requireAuth, tastingController.getAllTastings);
router.get("/:id", requireAuth, tastingController.getTastingById);
router.post("/", requireAuth, tastingController.createTasting);
router.post("/:id/favorite", requireAuth, tastingController.favoriteTasting);
router.post("/:id/unfavorite", requireAuth, tastingController.unfavoriteTasting);
router.put("/:id", requireAuth, tastingController.updateTasting);
router.delete("/:id", requireAuth, tastingController.deleteTasting);

module.exports = router;
