const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { requireAuth } = require("../middleware/auth");
const { chatLimiter } = require("../middleware/rateLimit");

// Chat is open to any logged-in user (messaging isn't restricted to
// followers), so every route here just needs a valid session.
router.use(requireAuth);

router.get("/conversations", chatController.listConversations);
router.post("/conversations", chatController.getOrCreateConversation);
router.get("/conversations/:id/messages", chatController.listMessages);
router.post("/conversations/:id/messages", chatLimiter, chatController.sendMessage);
router.post("/conversations/:id/read", chatController.markConversationRead);

module.exports = router;
