// Gate for the admin tab itself -- the user directory and site stats.
// isSuperAdmin implies admin access too, so the one super-admin account
// never loses its own dashboard access even if isAdmin were somehow unset.
function requireAdmin(req, res, next) {
  if (!req.user || !(req.user.isAdmin || req.user.isSuperAdmin)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Tighter gate for the one action that's more sensitive than browsing the
// admin tab: granting or revoking someone else's admin access. Only the
// account with isSuperAdmin (set by running scripts/setSuperAdmin.js
// directly against the database, never through the API) can do this.
function requireSuperAdmin(req, res, next) {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
}

module.exports = { requireAdmin, requireSuperAdmin };
