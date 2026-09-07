import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function navLinkClassName({ isActive }) {
  return isActive ? "nav-link active" : "nav-link";
}

function NavBar() {
  const { user, logout } = useAuth();

  return (
    <div className="top-bar">
      <nav className="main-nav">
        <NavLink to="/" end className={navLinkClassName}>
          My Journal
        </NavLink>
        <NavLink to="/community" className={navLinkClassName}>
          Community
        </NavLink>
      </nav>

      <div className="top-bar-user">
        <span className="user-name">Hi, {user?.name}</span>
        <button type="button" className="button-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}

export default NavBar;
