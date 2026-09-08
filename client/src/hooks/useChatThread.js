import { useCallback, useEffect, useState } from "react";
import {
  fetchMessages,
  markConversationRead,
  sendMessage as sendMessageRequest,
} from "../services/chatService";
import { useSocket } from "../context/useSocket";

// Messages in one open conversation. Opening a thread marks the other
// person's messages as read (and reports that back via onRead, so the
// caller can refresh the inbox's unread badges to match); an incoming
// message over the socket while the thread stays open is appended and
// immediately marked read too, since the user is actively looking at it.
export function useChatThread(conversationId, { onRead } = {}) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      return undefined;
    }

    let ignore = false;
    setLoading(true);

    fetchMessages(conversationId)
      .then((data) => {
        if (!ignore) {
          setMessages(data.messages);
          setError("");
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    markConversationRead(conversationId)
      .then(() => onRead?.(conversationId))
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [conversationId, onRead]);

  useEffect(() => {
    if (!socket || !conversationId) {
      return undefined;
    }

    const handleNewMessage = (message) => {
      if (message.conversationId !== conversationId) {
        return;
      }
      setMessages((prev) => [...prev, message]);
      markConversationRead(conversationId)
        .then(() => onRead?.(conversationId))
        .catch(() => {});
    };

    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [socket, conversationId, onRead]);

  const send = useCallback(
    async (text) => {
      setSending(true);
      try {
        const message = await sendMessageRequest(conversationId, text);
        setMessages((prev) => [...prev, message]);
        setError("");
        return message;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  return { messages, loading, error, sending, send };
}
