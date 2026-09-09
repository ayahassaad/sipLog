import { useCallback, useEffect, useState } from "react";
import { fetchConversations } from "../services/chatService";
import { useSocket } from "../context/useSocket";
import { useAuth } from "../context/useAuth";

// The chat inbox: every conversation the signed-in user is part of, kept
// live via the socket -- an incoming message bumps that conversation to
// the top and updates its preview/unread count without a manual refresh.
//
// Gated on `user` so this is safe to call unconditionally from anywhere --
// notably ChatFab, which renders (and needs an unread count) on every page
// including ones a logged-out visitor can see. Without the guard, a
// logged-out mount would still fire an authenticated-only request and get
// a 401 for no reason.
export function useConversations() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      const data = await fetchConversations();
      setConversations(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return undefined;
    }

    let ignore = false;
    setLoading(true);
    loadConversations().finally(() => {
      if (!ignore) {
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadConversations, user]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleNewMessage = (message) => {
      setConversations((prev) => {
        const index = prev.findIndex((conversation) => conversation.id === message.conversationId);
        if (index === -1) {
          // A brand new conversation someone just started with us -- the
          // simplest correct thing is to refetch the inbox for it rather
          // than trying to reconstruct the entry from just this message.
          loadConversations();
          return prev;
        }

        const updated = {
          ...prev[index],
          lastMessageAt: message.createdAt,
          lastMessageText: message.text,
          unreadCount: prev[index].unreadCount + 1,
        };
        const rest = prev.filter((_, i) => i !== index);
        return [updated, ...rest];
      });
    };

    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [socket, loadConversations]);

  const totalUnread = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);

  return { conversations, loading, error, totalUnread, refresh: loadConversations };
}
