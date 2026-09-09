import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { useChatThread } from "../hooks/useChatThread";

// One open conversation's messages plus its composer -- used by both the
// full Messages page (ChatPage) and the floating chat popup (ChatPopup).
// Both read the same conversation via useChatThread (and so the same
// socket connection), so reading or sending a message here shows up in
// the other view immediately -- they're two windows onto one thread, not
// two separate chat systems.
function ChatThread({ conversation, onRead }) {
  const thread = useChatThread(conversation.id, { onRead });
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef(null);

  // The composer stays fixed in place (see .chat-messages' bounded height
  // in App.css) -- this is what keeps the newest message in view instead,
  // scrolling the messages list itself rather than the whole page.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [thread.messages]);

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
        {thread.error && <p className="status-message error" role="alert">{thread.error}</p>}
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
        <div ref={messagesEndRef} />
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

export default ChatThread;
