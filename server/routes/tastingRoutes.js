const express = require("express");
const router = express.Router();
const tastingController = require("../controllers/tastingController");

router.get("/stats/summary", tastingController.getTastingStats);
router.get("/", tastingController.getAllTastings);
router.get("/:id", tastingController.getTastingById);
router.post("/", tastingController.createTasting);
router.put("/:id", tastingController.updateTasting);
router.delete("/:id", tastingController.deleteTasting);

module.exports = router;
