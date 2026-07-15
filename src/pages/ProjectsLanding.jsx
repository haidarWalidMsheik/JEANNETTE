import { useMemo } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES } from "../config/categories";

const DISPLAY_ORDER = [
  "Branding",
  "Social Media",
  "Illustrations",
  "Layouts",
  "Web Design",
];

export default function ProjectsLanding() {
  const base = import.meta.env.BASE_URL;

  const categories = useMemo(() => {
    return DISPLAY_ORDER.map((name) =>
      CATEGORIES.find((category) => category.name === name)
    ).filter(Boolean);
  }, []);

  return (
    <main
      className="coded-projects-landing project-reference-page"
      style={{
        "--projects-main-bg": `url("${base}design/projects-main-bg.png")`,
      }}
    >
      <SiteNav />

      <section className="project-reference-stage">
        <div className="project-reference-copy">
          <h1>
            <span>WHAT I BRING TO</span>
            <span>THE TABLE.</span>
          </h1>
        </div>

        <div className="project-reference-grid">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="project-reference-card"
            >
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <span>{category.name.toUpperCase()}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}