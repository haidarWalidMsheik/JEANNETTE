import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES } from "../config/categories";

export default function ProjectsLanding() {
  return (
    <main className="coded-projects-landing">
      <div className="projects-screen-bg" aria-hidden="true" />

      <SiteNav />

      <section className="projects-landing-layout">
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