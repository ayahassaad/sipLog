import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useConversations } from "../hooks/useConversations";
import ChatPopup from "./ChatPopup";

// A shortcut to Messages, fixed in the same spot on every page -- only
// shown once someone's logged in, and hidden while already on the chat
// page itself. Carries a live unread-count badge (via useConversations,
// which is itself auth-gated) so a new message is noticeable no matter
// where in the site someone is. Clicking it opens a floating chat popup
// (see ChatPopup) instead of navigating away -- the popup is just another
// view onto the same conversations/threads as the full Messages page, not
// a separate chat system (see ChatPopup for how that's kept true).
function ChatFab() {
  const { user } = useAuth();
  const location = useLocation();
  const { totalUnread } = useConversations();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!user || location.pathname.startsWith("/chat")) {
    return null;
  }

  const badgeLabel = totalUnread > 10 ? "10+" : totalUnread;

  return (
    <div className="chat-fab-root" ref={rootRef}>
      <button
        type="button"
        className="chat-fab"
        aria-label="Messages"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {totalUnread > 0 && <span className="chat-fab-badge">{badgeLabel}</span>}
      </button>

      {open && <ChatPopup onClose={() => setOpen(false)} />}
    </div>
  );
}

export default ChatFab;
