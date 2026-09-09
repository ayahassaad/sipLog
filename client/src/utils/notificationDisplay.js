// Plain, non-component helpers shared between NotificationBell (the
// dropdown) and NotificationsPage (the full history) -- split out of
// NotificationIcon.jsx because mixing component and non-component
// exports in one file breaks fast refresh.

export function notificationText(notification) {
  const name = notification.actor?.name || "Someone";
  switch (notification.type) {
    case "follow":
      return `${name} started following you`;
    case "unfollow":
      return `${name} unfollowed you`;
    case "favorite":
      return `${name} favorited one of your wines`;
    case "message":
      return `${name} sent you a message`;
    case "comment":
      return `${name} commented on one of your wines`;
    default:
      return `${name} did something`;
  }
}

export function notificationTarget(notification) {
  if (!notification.actor) {
    return null;
  }
  return notification.type === "message"
    ? `/chat/${notification.actor.username}`
    : `/users/${notification.actor.username}`;
}
