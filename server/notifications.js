const Notification = require("./models/Notification");
const User = require("./models/User");
const { emitToUser } = require("./socket");

function toNotification(notification, actor) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    actor: {
      id: actor._id.toString(),
      name: actor.name,
      username: actor.username,
      avatarUrl: actor.avatarUrl || "",
    },
    conversationId: notification.conversationId ? notification.conversationId.toString() : null,
    createdAt: notification.createdAt,
    readAt: notification.readAt,
  };
}

// Creates (or, for a message, refreshes) a notification for `userId` and
// pushes it to them live over the socket if they're online -- the same
// fire-and-forget pattern chat's emitToUser already uses, so a
// notification failing never blocks the follow/favorite/message action
// that triggered it. Called without awaiting from every place below.
async function notify({ userId, actorId, type, conversationId = null }) {
  try {
    if (String(userId) === String(actorId)) {
      // Never notify someone about their own action (e.g. favoriting your
      // own wine, if that's ever reachable).
      return;
    }

    let notification = null;

    if (type === "message" && conversationId) {
      // Rapid-fire messages shouldn't each spawn their own notification --
      // bump the existing unread one for this conversation instead of
      // piling up duplicates.
      notification = await Notification.findOneAndUpdate(
        { userId, actorId, type, conversationId, readAt: null },
        { $set: { createdAt: new Date() } },
        { new: true }
      );
    }

    if (!notification) {
      notification = await Notification.create({ userId, actorId, type, conversationId });
    }

    const actor = await User.findById(actorId);
    if (!actor) {
      return;
    }

    emitToUser(userId, "notification:new", toNotification(notification, actor));
  } catch (error) {
    // Notifications are a nice-to-have layered on top of the actions that
    // trigger them -- never let a failure here surface as a failure of
    // the request itself.
    console.error("Failed to create notification:", error.message);
  }
}

module.exports = { notify };
