const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { visitLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// Public and unauthenticated on purpose -- anonymous browsing (Community,
// public profiles) should count as a visit too, not just logged-in use.
router.post("/visit", visitLimiter, analyticsController.recordVisit);

module.exports = router;
