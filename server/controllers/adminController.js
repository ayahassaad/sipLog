const mongoose = require("mongoose");
const User = require("../models/User");
const Wine = require("../models/Wine");
const Tasting = require("../models/Tasting");
const SiteStat = require("../models/SiteStat");

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

// Same escaping as the Community search -- lets an admin search the user
// directory without a name like "O'Brien" or "test (2)" breaking the regex.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// No email here (matches how users are shown everywhere else in the app --
// Community, profiles -- email is never displayed, even to admins).
function toAdminUser(user) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl || "",
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin,
    createdAt: user.createdAt,
  };
}

// GET /api/admin/users?search=&page=&limit= -- the full user directory for
// the admin tab, newest first, with an optional name/username search.
exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const search = (req.query.search || "").trim();

    const query = {};
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: pattern }, { username: pattern }];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      users: users.map(toAdminUser),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/users/:id/admin { isAdmin: true|false } -- grant or
// revoke admin access. Restricted to the super admin by the
// requireSuperAdmin middleware on this route, not by anything in here.
exports.setAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof req.body.isAdmin !== "boolean") {
      return res.status(400).json({ message: "isAdmin must be true or false" });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't change your own admin access" });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // The super admin's access isn't managed through this toggle at all --
    // it only ever comes from isSuperAdmin, which this route never touches.
    if (targetUser.isSuperAdmin) {
      return res.status(400).json({ message: "Can't change admin access for the super admin" });
    }

    // findByIdAndUpdate rather than load-then-save: targetUser above was
    // fetched without passwordHash (it's select: false on the schema), and
    // calling .save() on a partial document like that trips the field's
    // own "required" validator even though nothing here touches it.
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isAdmin: req.body.isAdmin },
      { returnDocument: "after" }
    );

    res.json({ user: toAdminUser(updatedUser) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/stats -- the numbers shown at the top of the admin tab.
exports.getStats = async (_req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalWines,
      totalTastings,
      siteStat,
      newUsersThisWeek,
      newUsersThisMonth,
      topByFollowers,
      topByTastings,
    ] = await Promise.all([
      User.countDocuments(),
      Wine.countDocuments(),
      Tasting.countDocuments(),
      SiteStat.findById("site"),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      // "Followers" isn't stored directly -- it's however many other users
      // have you in their own `following` list -- so tallying the top few
      // means unwinding everyone's following array and counting by target.
      User.aggregate([
        { $unwind: "$following" },
        { $group: { _id: "$following", followersCount: { $sum: 1 } } },
        { $sort: { followersCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            id: "$user._id",
            name: "$user.name",
            username: "$user.username",
            avatarUrl: "$user.avatarUrl",
            followersCount: 1,
          },
        },
      ]),
      Tasting.aggregate([
        { $group: { _id: "$userId", tastingsCount: { $sum: 1 } } },
        { $sort: { tastingsCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            id: "$user._id",
            name: "$user.name",
            username: "$user.username",
            avatarUrl: "$user.avatarUrl",
            tastingsCount: 1,
          },
        },
      ]),
    ]);

    res.json({
      totalUsers,
      totalWines,
      totalTastings,
      totalVisits: siteStat?.totalVisits || 0,
      newUsersThisWeek,
      newUsersThisMonth,
      topByFollowers,
      topByTastings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/tastings/:id -- lets any admin (not just the super
// admin; this is content moderation, not access control) remove someone
// else's post from Community, regardless of who posted it. Unlike the
// regular delete (tastingController.deleteTasting), this never checks
// ownership on purpose.
exports.deleteTasting = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid tasting id" });
    }

    const deletedTasting = await Tasting.findByIdAndDelete(id);
    if (!deletedTasting) {
      return res.status(404).json({ message: "Tasting not found" });
    }

    // Same cleanup as scripts/removeSeedUsers.js -- anyone who'd favorited
    // this tasting shouldn't keep a reference to something that's gone.
    await User.updateMany({}, { $pull: { favorites: deletedTasting._id } });

    res.json({ message: "Tasting removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
