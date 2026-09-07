import { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import RoseGlassLogo from "./RoseGlassLogo";

function navLinkClassName({ isActive }) {
  return isActive ? "nav-link active" : "nav-link";
}

function SiteHeader() {
  const { user, logout } = useAuth();
  const headerRef = useRef(null);

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

      {user ? (
        <button
          type="button"
          className="logout-button"
          onClick={logout}
          data-tooltip="Don't leave!"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 4h-4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
            <path d="M10 12h10m0 0-3-3m3 3-3 3" />
          </svg>
          Log out
        </button>
      ) : (
        <Link to="/login" className="logout-button" data-tooltip="Come on in!">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9" />
            <path d="M14 12H4m0 0 3-3m-3 3 3 3" />
          </svg>
          Log in
        </Link>
      )}
    </header>
  );
}

export default SiteHeader;
