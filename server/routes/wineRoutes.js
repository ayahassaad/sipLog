const express = require("express");
const router = express.Router();
const wineController = require("../controllers/wineController");

router.get("/", wineController.getAllWines);
router.get("/:id/tastings", wineController.getTastingsForWine);
router.get("/:id", wineController.getWineById);
router.post("/", wineController.createWine);
router.put("/:id", wineController.updateWine);
router.delete("/:id", wineController.deleteWine);

module.exports = router;
