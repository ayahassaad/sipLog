import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import FilterBar from "./FilterBar";

// The pop-up shown when someone clicks "Following" or "Followers" on a
// profile page (their own, or anyone else's -- both pass the same shape of
// user list, see toConnectionUser on the backend). A search bar narrows the
// list by name or username; clicking a person navigates to their profile
// and closes the pop-up.
function FollowListModal({ title, users, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return users;
    }
    return users.filter(
      (person) =>
        person.name.toLowerCase().includes(term) || person.username.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel follow-list-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <FilterBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          placeholder="Search by name or username..."
        />

        {filteredUsers.length === 0 ? (
          <p className="feed-empty">No matches.</p>
        ) : (
          <div className="follow-list-results">
            {filteredUsers.map((person) => (
              <Link
                key={person.id}
                to={`/users/${person.username}`}
                className="chat-search-result"
                onClick={onClose}
              >
                <Avatar url={person.avatarUrl} name={person.name} size="sm" />
                <span className="chat-conversation-name">{person.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FollowListModal;
