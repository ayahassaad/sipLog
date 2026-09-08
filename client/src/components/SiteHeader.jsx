import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import RoseGlassLogo from "./RoseGlassLogo";

function navLinkClassName({ isActive }) {
  return isActive ? "nav-link active" : "nav-link";
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
        <RoseGlassLogo />
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
                <Link
                  to="/profile"
                  className="burger-item"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  className="burger-item"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  className="burger-item"
                  role="menuitem"
                  onClick={handleLogout}
                >
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
  );
}

export default SiteHeader;
