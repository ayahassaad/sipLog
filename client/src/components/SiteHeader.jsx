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
      </div>

      <button type="button" className="button-secondary" onClick={logout}>
        Log out
      </button>
    </header>
  );
}

export default SiteHeader;
