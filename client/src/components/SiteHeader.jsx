import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import RoseGlassLogo from "./RoseGlassLogo";

function navLinkClassName({ isActive }) {
  return isActive ? "nav-link active" : "nav-link";
}

function SiteHeader() {
  const { logout } = useAuth();
  const headerRef = useRef(null);

  // Keep --header-height in sync with the header's real rendered height so
  // the sticky mode-toggle tabs further down the page can pin themselves
  // flush against it instead of relying on a guessed pixel value (which
  // also drifts once the heading webfont finishes loading).
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    const syncHeaderHeight = () => {
      // Also fold in the app-shell's own top padding, which is the small
      // remaining gap between the header and the sticky mode-toggle tabs.
      // Without it, the tabs would still travel that extra gap before
      // locking in place instead of holding their original position from
      // the very first frame.
      const appShell = document.querySelector(".app-shell");
      const extraGap = appShell
        ? parseFloat(getComputedStyle(appShell).paddingTop) || 0
        : 0;
      document.documentElement.style.setProperty(
        "--header-height",
        `${header.offsetHeight + extraGap}px`
      );
    };

    syncHeaderHeight();

    const resizeObserver = new ResizeObserver(syncHeaderHeight);
    resizeObserver.observe(header);
    document.fonts?.ready?.then(syncHeaderHeight);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
      <nav className="main-nav">
        <NavLink to="/" end className={navLinkClassName}>
          My Journal
        </NavLink>
        <NavLink to="/community" className={navLinkClassName}>
          Community
        </NavLink>
      </nav>

      <div className="site-header-logo">
        <RoseGlassLogo />
        <p className="site-header-title">SipLog</p>
      </div>

      <button type="button" className="logout-button" onClick={logout}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 4h-4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
          <path d="M10 12h10m0 0-3-3m3 3-3 3" />
        </svg>
        Log out
      </button>
    </header>
  );
}

export default SiteHeader;
