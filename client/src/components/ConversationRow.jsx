import Avatar from "./Avatar";
import { formatTimelineDate } from "../utils/formatTimelineDate";

// One row in a conversation list -- used by both the full Messages page
// (ChatPage) and the floating chat popup (ChatPopup), so the two show the
// same inbox rendered the same way rather than duplicating this markup.
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

export default ConversationRow;
