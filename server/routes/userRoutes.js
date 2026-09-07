const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/", userController.listUsers);
router.post("/:id/follow", userController.followUser);
router.post("/:id/unfollow", userController.unfollowUser);

module.exports = router;
