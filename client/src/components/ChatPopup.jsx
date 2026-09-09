import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import FilterBar from "./FilterBar";
import ConversationRow from "./ConversationRow";
import ChatThread from "./ChatThread";
import { useAuth } from "../context/useAuth";
import { useConversations } from "../hooks/useConversations";
import { useUsers } from "../hooks/useUsers";
import { getOrCreateConversation } from "../services/chatService";

// The floating chat widget opened from the header's chat button (see
// ChatFab). It reads the same useConversations/ChatThread/ConversationRow
// as the full Messages page (/chat) -- same socket connection, same
// state -- so it's a second *view* onto that one inbox, not a separate
// chat feature. Starting or reading a conversation here shows up on the
// Messages page immediately, and vice versa. The header's "expand" link
// makes that connection explicit by jumping straight to /chat.
function ChatPopup({ onClose }) {
  const { user } = useAuth();
  const conversationsState = useConversations();
  const people = useUsers();
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startError, setStartError] = useState("");

  const matchedUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return [];
    }
    return people.users.filter(
      (person) =>
        person.id !== user?.id &&
        (person.name.toLowerCase().includes(term) || person.username.toLowerCase().includes(term))
    );
  }, [people.users, searchTerm, user]);

  const handleStartFromSearch = async (person) => {
    setSearchTerm("");
    setStartError("");
    try {
      const conversation = await getOrCreateConversation(person.id);
      setActiveConversation(conversation);
      conversationsState.refresh();
    } catch (err) {
      setStartError(err.message);
    }
  };

  const handleRead = () => conversationsState.refresh();

  return (
    <div className="chat-popup" role="dialog" aria-label="Messages">
      <div className="chat-popup-header">
        {activeConversation ? (
          <button
            type="button"
            className="chat-popup-back"
            onClick={() => setActiveConversation(null)}
            aria-label="Back to conversations"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5c-4 2-7 5-7 7s3 5 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <p className="chat-popup-title">Messages</p>
        )}
        <div className="chat-popup-header-actions">
          <Link
            to="/chat"
            className="chat-popup-expand"
            onClick={onClose}
            aria-label="Open in Messages"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 15 20 4M20 4h-6M20 4v6" />
              <path d="M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6" />
            </svg>
          </Link>
          <button type="button" className="chat-popup-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>

      {activeConversation ? (
        <ChatThread key={activeConversation.id} conversation={activeConversation} onRead={handleRead} />
      ) : (
        <div className="chat-popup-body">
          <div className="chat-search-row">
            <span className="chat-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <FilterBar
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              placeholder="Find someone to message..."
            />
          </div>

          {startError && <p className="status-message error" role="alert">{startError}</p>}

          {searchTerm.trim() && matchedUsers.length === 0 && (
            <p className="feed-empty">No users found.</p>
          )}

          {matchedUsers.length > 0 && (
            <div className="chat-search-results">
              {matchedUsers.map((person) => (
                <button
                  type="button"
                  key={person.id}
                  className="chat-search-result"
                  onClick={() => handleStartFromSearch(person)}
                >
                  <Avatar url={person.avatarUrl} name={person.name} size="sm" />
                  <span className="chat-conversation-name">{person.name}</span>
                </button>
              ))}
            </div>
          )}

          {!searchTerm.trim() && (
            <>
              {conversationsState.error && (
                <p className="status-message error" role="alert">{conversationsState.error}</p>
              )}
              {!conversationsState.loading &&
                !conversationsState.error &&
                conversationsState.conversations.length === 0 && (
                  <p className="feed-empty">No conversations yet.</p>
                )}
              {conversationsState.conversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  isActive={false}
                  onSelect={setActiveConversation}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatPopup;
