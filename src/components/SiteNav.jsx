import { NavLink, useLocation } from "react-router-dom";

export default function SiteNav({ dark = true }) {
  const location = useLocation();

  const navLinkClass = ({ isActive }) =>
    `animated-nav-link${isActive ? " is-active" : ""}`;

  const isProjectSurface =
    location.pathname.startsWith("/category/") ||
    location.pathname.startsWith("/project/");

  const topLogo = ["J", "E", "A", "N", "N", "E", "T", "T", "E", "'", "S"];
  const bottomLogo = ["P", "O", "R", "T", "F", "O", "L", "I", "O"];

  return (
    <header
      className={`coded-nav ${dark ? "coded-nav-dark" : "coded-nav-light"}${
        isProjectSurface ? " coded-nav-glass" : ""
      }`}
    >
      <NavLink
        to="/"
        className="coded-logo"
        aria-label="Jeannette portfolio home"
      >
        <span className="logo-line logo-line-top" aria-hidden="true">
          {topLogo.map((letter, index) => (
            <span key={index}>{letter}</span>
          ))}
        </span>

        <span className="logo-line logo-line-bottom" aria-hidden="true">
          {bottomLogo.map((letter, index) => (
            <span key={index}>{letter}</span>
          ))}
        </span>
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