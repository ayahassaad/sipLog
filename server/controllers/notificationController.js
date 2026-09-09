const Notification = require("../models/Notification");

function toNotification(notification) {
  const actor = notification.actorId;
  return {
    id: notification._id.toString(),
    type: notification.type,
    actor: actor
      ? {
          id: actor._id.toString(),
          name: actor.name,
          username: actor.username,
          avatarUrl: actor.avatarUrl || "",
        }
      : null,
    conversationId: notification.conversationId ? notification.conversationId.toString() : null,
    createdAt: notification.createdAt,
    readAt: notification.readAt,
  };
}

// -- The signed-in user's notifications, newest first, paginated --
// backs both the bell dropdown (page 1, shown capped to 4) and the full
// /notifications history page (which pages through everything via
// "Load more"). unreadCount always reflects the true total, not just
// what's on the current page, since it's what drives the "9+" badge.
exports.listNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

    const total = await Notification.countDocuments({ userId: req.user._id });

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("actorId", "name username avatarUrl");

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      readAt: null,
    });

    res.json({
      notifications: notifications.map(toNotification),
      unreadCount,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -- Marks every notification the signed-in user has as read, called once
// they open the bell dropdown.
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readAt: null },
      { readAt: new Date() }
    );
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
