import { NavLink } from "react-router-dom";

export default function SiteNav() {
  const navLinkClass = ({ isActive }) =>
    `animated-nav-link${isActive ? " is-active" : ""}`;

  return (
    <header className="coded-nav coded-nav-dark">
      <NavLink
        to="/"
        className="coded-logo"
        aria-label="Jeannette portfolio home"
      >
        <span>JEANNETTE'S</span>
        <strong>PORTFOLIO</strong>
      </NavLink>

      <nav className="coded-nav-links" aria-label="Main navigation">
        <NavLink to="/" className={navLinkClass}>
          ABOUT ME
        </NavLink>

        <NavLink to="/projects" className={navLinkClass}>
          PROJECTS
        </NavLink>

        <NavLink to="/collaborate" className={navLinkClass}>
          COLLABORATE
        </NavLink>

        <NavLink
          to="/admin-login"
          className="admin-access-pill"
          aria-label="Admin login"
        >
          <span aria-hidden="true">🔐</span>
          <b>ADMIN</b>
        </NavLink>
      </nav>
    </header>
  );
}