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

// -- The bell dropdown's contents: the signed-in user's most recent
// notifications (capped, newest first) plus how many are unread, which is
// what drives the "9+" badge.
exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("actorId", "name username avatarUrl");

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      readAt: null,
    });

    res.json({
      notifications: notifications.map(toNotification),
      unreadCount,
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
