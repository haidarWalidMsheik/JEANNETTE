import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES } from "../config/categories";

export default function ProjectsLanding() {
  const base = import.meta.env.BASE_URL;

  return (
    <main className="coded-projects-landing">
      <img
        className="projects-fixed-bg-image"
        src={`${base}design/projects-bg.jpeg`}
        alt=""
        aria-hidden="true"
      />

      <SiteNav />

      <section className="projects-landing-layout">
        <div className="projects-landing-copy">
          <p>What I bring to the table.</p>
          <h1>
            WHAT I BRING TO
            <br />
            THE TABLE.
          </h1>
          <span>
            Choose a category and see the work items added by the admin CRUD page.
          </span>
        </div>

        <div className="category-tiles">
          {CATEGORIES.map((category, index) => (
            <Link
              className="category-tile magnetic-tile"
              key={category.slug}
              to={`/category/${category.slug}`}
            >
              <i className="tile-triangle" aria-hidden="true" />
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}