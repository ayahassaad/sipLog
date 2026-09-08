import { useCallback, useEffect, useState } from "react";
import { fetchConversations } from "../services/chatService";
import { useSocket } from "../context/useSocket";

// The chat inbox: every conversation the signed-in user is part of, kept
// live via the socket -- an incoming message bumps that conversation to
// the top and updates its preview/unread count without a manual refresh.
export function useConversations() {
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations();
      setConversations(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    loadConversations().finally(() => {
      if (!ignore) {
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadConversations]);

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
