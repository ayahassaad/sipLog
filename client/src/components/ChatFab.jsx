import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useConversations } from "../hooks/useConversations";

// A shortcut to Messages, fixed in the same spot on every page (previously
// a burger-menu item) -- only shown once someone's logged in, and hidden
// while already on the chat page itself. Carries a live unread-count badge
// (via useConversations, which is itself auth-gated) so a new message is
// noticeable no matter where in the site someone is.
function ChatFab() {
  const { user } = useAuth();
  const location = useLocation();
  const { totalUnread } = useConversations();

  if (!user || location.pathname.startsWith("/chat")) {
    return null;
  }

  const badgeLabel = totalUnread > 10 ? "10+" : totalUnread;

  return (
    <Link to="/chat" className="chat-fab" aria-label="Messages">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      {totalUnread > 0 && <span className="chat-fab-badge">{badgeLabel}</span>}
    </Link>
  );
}

export default ChatFab;
