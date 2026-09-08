import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Avatar from "../components/Avatar";
import { useConversations } from "../hooks/useConversations";
import { useChatThread } from "../hooks/useChatThread";
import { fetchUserProfile } from "../services/userService";
import { getOrCreateConversation } from "../services/chatService";
import { formatTimelineDate } from "../utils/formatTimelineDate";

function ConversationRow({ conversation, isActive, onSelect }) {
  const { otherUser, lastMessageText, lastMessageAt, unreadCount } = conversation;

  return (
    <button
      type="button"
      className={`chat-conversation-row ${isActive ? "active" : ""}`}
      onClick={() => onSelect(conversation)}
    >
      <Avatar url={otherUser?.avatarUrl} name={otherUser?.name} size="sm" />
      <div className="chat-conversation-info">
        <p className="chat-conversation-name">{otherUser?.name || "Unknown"}</p>
        <p className="chat-conversation-preview">{lastMessageText || "Say hello!"}</p>
      </div>
      <div className="chat-conversation-meta">
        {lastMessageAt && (
          <span className="chat-conversation-time">{formatTimelineDate(lastMessageAt)}</span>
        )}
        {unreadCount > 0 && <span className="chat-unread-badge">{unreadCount}</span>}
      </div>
    </button>
  );
}

function ChatThread({ conversation, onRead }) {
  const thread = useChatThread(conversation.id, { onRead });
  const [draft, setDraft] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }

    setDraft("");
    try {
      await thread.send(text);
    } catch {
      // thread.error already carries the message for display below --
      // nothing else to do here besides not clearing a message that failed.
    }
  };

  return (
    <div className="chat-thread">
      <div className="chat-thread-header">
        <Avatar url={conversation.otherUser?.avatarUrl} name={conversation.otherUser?.name} size="sm" />
        <p className="chat-thread-name">{conversation.otherUser?.name}</p>
      </div>

      <div className="chat-messages">
        {thread.loading && <p className="feed-loading">Loading messages...</p>}
        {thread.error && <p className="status-message error">{thread.error}</p>}
        {!thread.loading && !thread.error && thread.messages.length === 0 && (
          <p className="feed-empty">No messages yet -- say hello!</p>
        )}

        {thread.messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${
              message.senderId === conversation.otherUser?.id ? "theirs" : "own"
            }`}
          >
            <p>{message.text}</p>
          </div>
        ))}
      </div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message..."
          maxLength={2000}
          aria-label="Message"
        />
        <button type="submit" className="button-gold" disabled={thread.sending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

// Direct messages: an inbox on the left, the selected conversation's
// thread on the right. Visiting /chat/:username (from a profile's
// "Message" button) resolves that person to a conversation, selects it,
// then swaps the URL back to the plain /chat so refreshing doesn't repeat
// the lookup.
function ChatPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const conversationsState = useConversations();
  const [activeConversation, setActiveConversation] = useState(null);
  const [startingChat, setStartingChat] = useState(Boolean(username));
  const [startError, setStartError] = useState("");

  useEffect(() => {
    if (!username) {
      setStartingChat(false);
      return undefined;
    }

    let ignore = false;
    setStartingChat(true);
    setStartError("");

    fetchUserProfile(username)
      .then((profile) => getOrCreateConversation(profile.id))
      .then((conversation) => {
        if (!ignore) {
          setActiveConversation(conversation);
          navigate("/chat", { replace: true });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setStartError(err.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setStartingChat(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [username, navigate]);

  const handleRead = useCallback(() => {
    conversationsState.refresh();
  }, [conversationsState]);

  return (
    <>
      <SiteHeader />
      <div className="app-shell chat-layout">
        <section className="panel chat-list-panel">
          <div className="section-heading">
            <h2 className="brand-highlight">Messages</h2>
          </div>

          {conversationsState.loading && <p className="feed-loading">Loading conversations...</p>}
          {conversationsState.error && (
            <p className="status-message error">{conversationsState.error}</p>
          )}
          {!conversationsState.loading &&
            !conversationsState.error &&
            conversationsState.conversations.length === 0 && (
              <p className="feed-empty">
                No conversations yet -- visit someone's profile and hit Message.
              </p>
            )}

          {conversationsState.conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversation?.id === conversation.id}
              onSelect={setActiveConversation}
            />
          ))}
        </section>

        <section className="panel chat-thread-panel">
          {startingChat && <p className="feed-loading">Starting conversation...</p>}
          {startError && <p className="status-message error">{startError}</p>}
          {!startingChat && !startError && !activeConversation && (
            <p className="feed-empty">Select a conversation to start chatting.</p>
          )}
          {activeConversation && (
            <ChatThread key={activeConversation.id} conversation={activeConversation} onRead={handleRead} />
          )}
        </section>
      </div>
    </>
  );
}

export default ChatPage;
