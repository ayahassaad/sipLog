import { useCallback, useEffect, useState } from "react";
import { fetchNotifications, markNotificationsRead } from "../services/notificationService";
import { useSocket } from "../context/useSocket";
import { useAuth } from "../context/useAuth";

const PAGE_SIZE = 30;

// The notification bell's data -- and, via loadMore/hasMore, the full
// /notifications history page's too. Kept live via the socket the same
// way useConversations keeps the chat inbox live -- an incoming
// notification is pushed to the top and bumps the unread count without a
// manual refresh, on both surfaces at once since they share this hook.
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      const data = await fetchNotifications({ page: 1, limit: PAGE_SIZE });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setPage(data.page);
      setTotalPages(data.totalPages);
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

  // Pages through the rest of the history for /notifications -- the bell
  // dropdown never calls this, it just shows the first few of whatever
  // this has already loaded.
  const loadMore = useCallback(async () => {
    if (page >= totalPages) {
      return;
    }
    try {
      const nextPage = page + 1;
      const data = await fetchNotifications({ page: nextPage, limit: PAGE_SIZE });
      setNotifications((prev) => [...prev, ...data.notifications]);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    }
  }, [page, totalPages]);

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

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAllRead,
    refresh: load,
    hasMore: page < totalPages,
    loadMore,
  };
}
