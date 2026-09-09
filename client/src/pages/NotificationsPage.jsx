import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import NotificationIcon from "../components/NotificationIcon";
import { notificationText, notificationTarget } from "../utils/notificationDisplay";
import { useNotifications } from "../hooks/useNotifications";
import { formatTimelineDate } from "../utils/formatTimelineDate";
import { usePageTitle } from "../hooks/usePageTitle";

// The full notification history behind the bell dropdown's "View all"
// link -- same data, same live socket updates (both come from
// useNotifications), just every notification instead of the dropdown's
// most-recent-4, paged in via "Load more" the same way Community's feed
// is.
function NotificationsPage() {
  usePageTitle("Notifications");
  const navigate = useNavigate();
  const { notifications, loading, error, hasMore, loadMore, markAllRead } = useNotifications();

  // Visiting this page directly (not through the bell) should still clear
  // the unread badge, same as opening the dropdown does.
  useEffect(() => {
    markAllRead();
    // Only ever meant to run once, on arrival -- markAllRead's own
    // identity changes whenever unreadCount does, which would otherwise
    // re-fire this on every read/unread change instead of just on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (notification) => {
    const target = notificationTarget(notification);
    if (target) {
      navigate(target);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="app-shell">
        <section className="panel list-panel">
          <div className="section-heading">
            <h1 className="brand-highlight">Notifications</h1>
          </div>

          {loading && <p className="feed-loading">Loading your notifications...</p>}
          {error && (
            <p className="status-message error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && notifications.length === 0 && (
            <p className="feed-empty">No notifications yet.</p>
          )}

          {notifications.length > 0 && (
            <div className="notification-history-list">
              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notification-item ${notification.readAt ? "" : "unread"}`}
                  onClick={() => handleSelect(notification)}
                >
                  <NotificationIcon type={notification.type} />
                  <span className="notification-text">{notificationText(notification)}</span>
                  <span className="notification-time">
                    {formatTimelineDate(notification.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="button-row">
              <button type="button" className="button-secondary" onClick={loadMore}>
                Load more
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default NotificationsPage;
