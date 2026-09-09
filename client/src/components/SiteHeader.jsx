import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Avatar from "./Avatar";
import ChatFab from "./ChatFab";

function navLinkClassName({ isActive }) {
  return isActive ? "nav-link active" : "nav-link";
}

function MenuIcon({ name }) {
  const icons = {
    profile: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c0-3.9 3.4-6.2 7.5-6.2s7.5 2.3 7.5 6.2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.1h-3v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.06 15a1.7 1.7 0 0 0-1.56-1.03h-.1v-3h.1A1.7 1.7 0 0 0 7.06 9.94a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.1-2.1.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56v-.1h3v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z" /></>,
    admin: <path d="M12 3.5 20 7.8v4.6c0 4.7-3.3 7.2-8 8.6-4.7-1.4-8-3.9-8-8.6V7.8l8-4.3Z" />,
    logout: <><path d="M10.5 4.5H17a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-6.5" /><path d="M13 12H4m0 0 3-3m-3 3 3 3" /></>,
  };

  return <svg className="burger-icon" viewBox="0 0 24 24" aria-hidden="true">{icons[name]}</svg>;
}

function SiteHeader() {
  const { user, logout } = useAuth();
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep --header-height in sync with the header's real rendered height so
  // the sticky mode-toggle tabs further down the page can pin themselves
  // flush against it instead of relying on a guessed pixel value (which
  // also drifts once the heading webfont finishes loading). The tabs
  // themselves close the small app-shell padding gap with a matching
  // negative margin, so this only needs the header's own height.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${header.offsetHeight}px`
      );
    };

    syncHeaderHeight();
    document.fonts?.ready?.then(syncHeaderHeight);

    // jsdom (used by the component tests) doesn't implement
    // ResizeObserver, so guard against it instead of assuming it exists.
    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(syncHeaderHeight);
    resizeObserver.observe(header);

    return () => resizeObserver.disconnect();
  }, []);

  // Close the burger menu on an outside click or Escape, same as any other
  // dropdown -- only wired up while the menu is actually open.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <>
      <header className="site-header" ref={headerRef}>
        <nav className="main-nav">
          <NavLink to="/" end className={navLinkClassName}>
            Community
          </NavLink>
          <NavLink to="/journal" className={navLinkClassName}>
            My Journal
          </NavLink>
        </nav>

        <div className="site-header-logo">
          <p className="site-header-title">SipLog</p>
        </div>

        <div className="site-header-right">
          {user ? (
            <div className="burger-menu" ref={menuRef}>
              <button
                type="button"
                className="burger-button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label="Open menu"
              >
                <span className="burger-bar" />
                <span className="burger-bar" />
                <span className="burger-bar" />
              </button>

              {menuOpen && (
                <div className="burger-dropdown" role="menu">
                  <div className="burger-profile">
                    <Avatar url={user.avatarUrl} name={user.name} size="sm" />
                    <div>
                      <p className="burger-profile-name">{user.name}</p>
                      {user.username && <p className="burger-profile-handle">@{user.username}</p>}
                    </div>
                  </div>

                  <div className="burger-group">
                    <Link
                      to="/profile"
                      className="burger-item"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      <MenuIcon name="profile" />
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="burger-item"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      <MenuIcon name="settings" />
                      Settings
                    </Link>
                  </div>
                  {user.isAdmin && (
                    <div className="burger-group burger-admin-group">
                    <Link
                      to="/admin"
                      className="burger-item"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      <MenuIcon name="admin" />
                      Admin Panel
                    </Link>
                    </div>
                  )}
                  <button
                    type="button"
                    className="burger-item burger-logout"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <MenuIcon name="logout" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="logout-button" data-tooltip="Come on in!">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9" />
                <path d="M14 12H4m0 0 3-3m-3 3 3 3" />
              </svg>
              Log in
            </Link>
          )}
        </div>
      </header>
      {/* Fixed in the same spot on every page (instead of a burger-menu
          item) so chat is always one tap away -- hidden on the chat page
          itself, see ChatFab. */}
      <ChatFab />
    </>
  );
}

export default SiteHeader;
