import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Avatar from "../components/Avatar";
import FilterBar from "../components/FilterBar";
import ConversationRow from "../components/ConversationRow";
import ChatThread from "../components/ChatThread";
import { useAuth } from "../context/useAuth";
import { useConversations } from "../hooks/useConversations";
import { useUsers } from "../hooks/useUsers";
import { fetchUserProfile } from "../services/userService";
import { usePageTitle } from "../hooks/usePageTitle";
import { getOrCreateConversation } from "../services/chatService";

// Direct messages: an inbox on the left (with an always-visible search to
// find someone new to message), the selected conversation's thread on the
// right. Visiting /chat/:username (from a profile's "Message" button)
// resolves that person to a conversation, selects it, then swaps the URL
// back to the plain /chat so refreshing doesn't repeat the lookup.
function ChatPage() {
  usePageTitle("Messages");
  const { user } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const conversationsState = useConversations();
  const people = useUsers();
  const [activeConversation, setActiveConversation] = useState(null);
  const [startError, setStartError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!username) {
      return undefined;
    }

    let ignore = false;
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
      });

    return () => {
      ignore = true;
    };
  }, [username, navigate]);

  const handleRead = useCallback(() => {
    conversationsState.refresh();
  }, [conversationsState]);

  // Client-side filter over the same user directory Community's search
  // draws from -- the app's user base is small enough that fetching
  // everyone once and filtering locally is simpler than a dedicated search
  // endpoint, and avoids yet another debounced-search round trip.
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
    try {
      const conversation = await getOrCreateConversation(person.id);
      setActiveConversation(conversation);
      conversationsState.refresh();
    } catch (err) {
      setStartError(err.message);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="app-shell chat-layout">
        <section className="panel chat-list-panel">
          <div className="section-heading chat-list-heading">
            <h1 className="brand-highlight">Messages</h1>
          </div>

          <div className="chat-search-panel">
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
          </div>

          {conversationsState.error && (
            <p className="status-message error" role="alert">{conversationsState.error}</p>
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
          {startError && <p className="status-message error" role="alert">{startError}</p>}
          {!startError && !activeConversation && (
            <p className="feed-empty">Select a conversation to start chatting.</p>
          )}
          {activeConversation && (
            <ChatThread key={activeConversation.id} conversation={activeConversation} onRead={handleRead} />
          )}
        </section>
      </main>
    </>
  );
}

export default ChatPage;
