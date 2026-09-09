import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import { fetchUserProfile } from "../services/userService";

// Shared across every instance of this component for the page's lifetime,
// so hovering the same person more than once doesn't refetch their profile
// every time.
const profileCache = new Map();

const OPEN_DELAY = 350;
const CLOSE_DELAY = 150;

// Drop-in replacement for a <Link to={`/users/${username}`}>...</Link> to
// someone's profile -- same link, same children, same className -- that
// also shows a small preview card (avatar, name, follow counts) after a
// brief hover or keyboard focus, so you don't have to leave the page just
// to see who someone is. Used anywhere a user's name/avatar links to their
// profile: community cards, connection lists, admin tables, and so on.
function UserHoverCard({ username, className, children, onClick }) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(() => profileCache.get(username) || null);
  const [loadFailed, setLoadFailed] = useState(false);
  const openTimer = useRef(null);
  const closeTimer = useRef(null);

  const clearTimers = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  };

  const loadProfile = () => {
    if (profileCache.has(username)) {
      setProfile(profileCache.get(username));
      return;
    }
    fetchUserProfile(username)
      .then((data) => {
        profileCache.set(username, data);
        setProfile(data);
      })
      .catch(() => setLoadFailed(true));
  };

  const handleOpen = () => {
    clearTimers();
    openTimer.current = setTimeout(() => {
      loadProfile();
      setOpen(true);
    }, OPEN_DELAY);
  };

  const handleClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  return (
    <Link
      to={`/users/${username}`}
      className={`user-hover-anchor ${className || ""}`}
      onClick={onClick}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      {children}

      {open && !loadFailed && profile && (
        <div className="user-hover-card" role="tooltip">
          <Avatar url={profile.avatarUrl} name={profile.name} size="md" />
          <p className="user-hover-name">{profile.name}</p>
          <p className="user-hover-handle">@{profile.username}</p>
          <div className="user-hover-stats">
            <span>
              <strong>{profile.followingCount}</strong> Following
            </span>
            <span>
              <strong>{profile.followersCount}</strong> Followers
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}

export default UserHoverCard;
