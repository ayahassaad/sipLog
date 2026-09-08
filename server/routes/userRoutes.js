const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// Browsing the directory is public; actually following someone, or viewing/
// editing your own profile, requires an account.
router.get("/", optionalAuth, userController.listUsers);
router.get("/me", requireAuth, userController.getMyProfile);
router.patch("/me", requireAuth, userController.updateMyProfile);
router.patch("/me/email", requireAuth, userController.updateMyEmail);
router.patch("/me/password", requireAuth, userController.updateMyPassword);
router.post("/:id/follow", requireAuth, userController.followUser);
router.post("/:id/unfollow", requireAuth, userController.unfollowUser);

module.exports = router;
