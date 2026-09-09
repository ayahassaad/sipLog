import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import { fetchUserProfile } from "../services/userService";

// Shared across every instance of this component for the page's lifetime,
// so hovering the same person more than once doesn't refetch their profile
// every time.
const profileCache = new Map();

const OPEN_DELAY = 350;
const CLOSE_DELAY = 150;
const CARD_WIDTH = 220;
const VIEWPORT_MARGIN = 12;
const ANCHOR_GAP = 8;

// Drop-in replacement for a <Link to={`/users/${username}`}>...</Link> to
// someone's profile -- same link, same children, same className -- that
// also shows a small preview card (avatar, name, follow counts) after a
// brief hover or keyboard focus, so you don't have to leave the page just
// to see who someone is. Used anywhere a user's name/avatar links to their
// profile: community cards, connection lists, admin tables, the carousel,
// the Following/Followers pop-up, and so on.
//
// The preview card itself is rendered through a portal straight into
// document.body instead of as a child of the link. Several of the places
// this shows up sit inside a container with its own overflow/scroll
// (the carousel, the Following/Followers list) or its own z-index (the
// follow-list modal) -- a normal absolutely-positioned child would get
// clipped by the first and could still lose to the second. Portaling it
// out, and positioning it in JS from the link's own on-screen position,
// keeps it floating above everything else no matter where the link lives.
function UserHoverCard({ username, className, children, onClick }) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(() => profileCache.get(username) || null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [position, setPosition] = useState(null);
  const anchorRef = useRef(null);
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

  const updatePosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const maxLeft = window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN;
    const left = Math.min(rect.left, Math.max(VIEWPORT_MARGIN, maxLeft));
    setPosition({ top: rect.bottom + ANCHOR_GAP, left });
  };

  const handleOpen = () => {
    clearTimers();
    openTimer.current = setTimeout(() => {
      updatePosition();
      loadProfile();
      setOpen(true);
    }, OPEN_DELAY);
  };

  const handleClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  // While the card is showing, keep it lined up with its anchor if the
  // page scrolls or resizes underneath it -- most notably the scrollable
  // Following/Followers list, whose own scroll wouldn't otherwise move a
  // portaled, position: fixed card at all.
  useEffect(() => {
    if (!open) return undefined;

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  return (
    <>
      <Link
        ref={anchorRef}
        to={`/users/${username}`}
        className={className}
        onClick={onClick}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
      >
        {children}
      </Link>

      {open &&
        !loadFailed &&
        profile &&
        position &&
        createPortal(
          <div
            className="user-hover-card"
            role="tooltip"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            onMouseEnter={clearTimers}
            onMouseLeave={handleClose}
          >
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
          </div>,
          document.body
        )}
    </>
  );
}

export default UserHoverCard;
