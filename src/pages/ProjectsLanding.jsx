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

  const categories = DISPLAY_ORDER.map((name) =>
    CATEGORIES.find((category) => category.name === name)
  ).filter(Boolean);

  return (
    <main
      className="coded-projects-landing reference-projects-page"
      style={{
        "--projects-bg-desktop": `url("${base}design/projects-bg.png")`,
        "--projects-bg-mobile": `url("${base}design/projects-bg-mobile.png")`,
      }}
    >
      <SiteNav />

      <section className="reference-projects-stage">
        <h1 className="reference-projects-title">
          <span>WHAT I BRING TO</span>
          <span>THE TABLE.</span>
        </h1>

        <div className="reference-projects-grid">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              className="reference-project-card"
              to={`/category/${category.slug}`}
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