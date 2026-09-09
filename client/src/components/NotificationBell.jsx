import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { formatTimelineDate } from "../utils/formatTimelineDate";

const TYPE_ICON = {
  follow: (
    <>
      <circle cx="10" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.6 3-5.7 6.5-5.7s6.5 2.1 6.5 5.7" />
      <path d="M17.5 8h4M19.5 6v4" />
    </>
  ),
  unfollow: (
    <>
      <circle cx="10" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.6 3-5.7 6.5-5.7s6.5 2.1 6.5 5.7" />
      <path d="M17.5 8h4" />
    </>
  ),
  favorite: (
    <path d="M12 20s-7-4.4-9.5-8.8C.8 8 2.3 4.5 5.6 4c2-.3 3.7.7 4.9 2.4L12 8l1.5-1.6C14.7 4.7 16.4 3.7 18.4 4c3.3.5 4.8 4 3.1 7.2C19 15.6 12 20 12 20Z" />
  ),
  message: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  comment: (
    <path d="M4 4h16v11H9l-5 4V4Z" />
  ),
};

function NotificationIcon({ type }) {
  return (
    <svg className="notification-icon" viewBox="0 0 24 24" aria-hidden="true">
      {TYPE_ICON[type] || TYPE_ICON.follow}
    </svg>
  );
}

function notificationText(notification) {
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

function notificationTarget(notification) {
  if (!notification.actor) {
    return null;
  }
  return notification.type === "message"
    ? `/chat/${notification.actor.username}`
    : `/users/${notification.actor.username}`;
}

// The bell icon in the header: a live badge (via useNotifications, capped
// at "9+" the same way ChatFab caps its own unread count) that opens a
// dropdown of recent activity -- someone following/unfollowing you,
// favoriting one of your wines, or messaging you. Opening the dropdown
// marks everything read, same moment the badge clears; clicking an entry
// takes you to whoever triggered it (or straight into the conversation,
// for a message).
function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleToggle = () => {
    setOpen((wasOpen) => {
      const willOpen = !wasOpen;
      if (willOpen) {
        markAllRead();
      }
      return willOpen;
    });
  };

  const handleSelect = (notification) => {
    setOpen(false);
    const target = notificationTarget(notification);
    if (target) {
      navigate(target);
    }
  };

  const badgeLabel = unreadCount > 9 ? "9+" : unreadCount;

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="notification-bell-button"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a5.5 5.5 0 0 0-5.5 5.5v2.6c0 .8-.3 1.6-.8 2.2L4 15.5c-.6.8 0 2 1 2h14c1 0 1.6-1.2 1-2l-1.7-2.2c-.5-.6-.8-1.4-.8-2.2V8.5A5.5 5.5 0 0 0 12 3Z" />
          <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
        </svg>
        {unreadCount > 0 && <span className="notification-bell-badge">{badgeLabel}</span>}
      </button>

      {open && (
        <div className="notification-dropdown" role="menu" aria-label="Notifications">
          {notifications.length === 0 ? (
            <p className="feed-empty">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                className={`notification-item ${notification.readAt ? "" : "unread"}`}
                role="menuitem"
                onClick={() => handleSelect(notification)}
              >
                <NotificationIcon type={notification.type} />
                <span className="notification-text">{notificationText(notification)}</span>
                <span className="notification-time">{formatTimelineDate(notification.createdAt)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
