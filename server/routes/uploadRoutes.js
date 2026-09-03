const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");

router.get("/signature", uploadController.getUploadSignature);

module.exports = router;
