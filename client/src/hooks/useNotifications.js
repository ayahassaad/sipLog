import { useCallback, useEffect, useState } from "react";
import { fetchNotifications, markNotificationsRead } from "../services/notificationService";
import { useSocket } from "../context/useSocket";
import { useAuth } from "../context/useAuth";

// The notification bell's data: the signed-in user's recent activity
// (follows, unfollows, favorites, messages), kept live via the socket the
// same way useConversations keeps the chat inbox live -- an incoming
// notification is pushed to the top and bumps the unread count without a
// manual refresh.
//
// Gated on `user` so this is safe to call unconditionally, the same
// reasoning useConversations documents for ChatFab.
export function useNotifications() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return undefined;
    }

    let ignore = false;
    setLoading(true);
    load().finally(() => {
      if (!ignore) {
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [load, user]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleNew = (notification) => {
      // The backend bumps (rather than duplicates) a repeated unread
      // "message" notification for the same conversation -- it arrives
      // here with the same id, so replacing any existing entry with that
      // id before prepending keeps this list in sync with that behavior
      // instead of showing the same conversation twice.
      setNotifications((prev) => [
        notification,
        ...prev.filter((existing) => existing.id !== notification.id),
      ]);
      setUnreadCount((count) => count + 1);
    };

    socket.on("notification:new", handleNew);
    return () => socket.off("notification:new", handleNew);
  }, [socket]);

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) {
      return;
    }
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        readAt: notification.readAt || new Date().toISOString(),
      }))
    );
    try {
      await markNotificationsRead();
    } catch {
      // Not worth surfacing an error for -- worst case the badge is off
      // until the next refetch.
    }
  }, [unreadCount]);

  return { notifications, unreadCount, loading, error, markAllRead, refresh: load };
}
