const express = require("express");
const router = express.Router();
const tastingController = require("../controllers/tastingController");

router.get("/stats/summary", tastingController.getTastingStats);
router.get("/feed", tastingController.getCommunityFeed);
router.get("/favorites", tastingController.getFavoriteTastings);
router.get("/", tastingController.getAllTastings);
router.get("/:id", tastingController.getTastingById);
router.post("/", tastingController.createTasting);
router.post("/:id/favorite", tastingController.favoriteTasting);
router.post("/:id/unfavorite", tastingController.unfavoriteTasting);
router.put("/:id", tastingController.updateTasting);
router.delete("/:id", tastingController.deleteTasting);

module.exports = router;
