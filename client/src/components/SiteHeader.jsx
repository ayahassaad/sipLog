import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import RoseGlassLogo from "./RoseGlassLogo";

function navLinkClassName({ isActive }) {
  return isActive ? "nav-link active" : "nav-link";
}

function SiteHeader() {
  const { logout } = useAuth();

  return (
    <header className="site-header">
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
