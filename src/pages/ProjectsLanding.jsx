import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES } from "../config/categories";

export default function ProjectsLanding() {
  const base = import.meta.env.BASE_URL;

  return (
    <main className="coded-projects-landing">
      <div
        className="projects-screen-bg"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${base}design/projects-bg.png")`,
        }}
      />

      <SiteNav />

      <section className="projects-landing-layout">
        <div className="category-tiles">
          {CATEGORIES.map((category, index) => (
            <Link
              className="category-tile magnetic-tile"
              key={category.slug}
              to={`/category/${category.slug}`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{category.name}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}