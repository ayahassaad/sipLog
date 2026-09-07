const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth");

// Browsing the directory is public; actually following someone requires
// an account, so requireAuth is applied per-route instead of to the whole
// router.
router.get("/", userController.listUsers);
router.post("/:id/follow", requireAuth, userController.followUser);
router.post("/:id/unfollow", requireAuth, userController.unfollowUser);

module.exports = router;
