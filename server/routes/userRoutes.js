const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { accountChangeLimiter } = require("../middleware/rateLimit");

// Browsing the directory is public; actually following someone, or viewing/
// editing your own profile, requires an account.
router.get("/", optionalAuth, userController.listUsers);
router.get("/me", requireAuth, userController.getMyProfile);
router.patch("/me", requireAuth, userController.updateMyProfile);
router.patch("/me/email", requireAuth, accountChangeLimiter, userController.updateMyEmail);
router.patch("/me/password", requireAuth, accountChangeLimiter, userController.updateMyPassword);

// Public profile lookup by username -- placed after the /me routes above so
// a request for "/me" is never swallowed by this ":username" wildcard.
router.get("/:username", optionalAuth, userController.getUserProfile);

router.post("/:id/follow", requireAuth, userController.followUser);
router.post("/:id/unfollow", requireAuth, userController.unfollowUser);

module.exports = router;
