import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { formatTimelineDate } from "../utils/formatTimelineDate";
import NotificationIcon from "./NotificationIcon";
import { notificationText, notificationTarget } from "../utils/notificationDisplay";

// How many of the most recent notifications the dropdown itself shows --
// it's meant as a quick glance, not the full history. "View all" below
// the list goes to /notifications for everything else.
const DROPDOWN_LIMIT = 4;

// The bell icon in the header: a live badge (via useNotifications, capped
// at "9+" the same way ChatFab caps its own unread count) that opens a
// dropdown of the most recent activity -- someone following/unfollowing
// you, favoriting one of your wines, commenting, or messaging you.
// Opening the dropdown marks everything read, same moment the badge
// clears; clicking an entry takes you to whoever triggered it (or
// straight into the conversation, for a message).
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

  const handleViewAll = () => {
    setOpen(false);
    navigate("/notifications");
  };

  const badgeLabel = unreadCount > 9 ? "9+" : unreadCount;
  const visibleNotifications = notifications.slice(0, DROPDOWN_LIMIT);

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
          {visibleNotifications.length === 0 ? (
            <p className="feed-empty">No notifications yet.</p>
          ) : (
            visibleNotifications.map((notification) => (
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
          <button
            type="button"
            className="notification-view-all"
            role="menuitem"
            onClick={handleViewAll}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
