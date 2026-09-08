const express = require("express");
const adminController = require("../controllers/adminController");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin, requireSuperAdmin } = require("../middleware/adminAuth");

const router = express.Router();

// Every route here needs to be logged in and an admin -- applied once at
// the router level rather than per-route.
router.use(requireAuth, requireAdmin);

router.get("/users", adminController.listUsers);
router.get("/stats", adminController.getStats);

// Only the super admin can flip someone else's admin access -- a tighter
// gate stacked on top of the router-level requireAdmin above.
router.patch("/users/:id/admin", requireSuperAdmin, adminController.setAdminStatus);

module.exports = router;
