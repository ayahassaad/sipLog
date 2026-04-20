const express = require("express");
const router = express.Router();
const wineController = require("../controllers/wineController");

router.get("/", wineController.getAllWines);
router.post("/", wineController.createWine);

module.exports = router;
