import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES } from "../config/categories";

function splitCategoryName(name) {
  if (name === "Social Media") return ["SOCIAL", "MEDIA"];
  if (name === "Web Design") return ["WEB", "DESIGN"];
  return [name.toUpperCase()];
}

export default function ProjectsLanding() {
  const pageRef = useRef(null);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const nav = page.querySelector(".coded-nav");

    const updateNavHeight = () => {
      const navHeight = nav ? nav.offsetHeight : 90;
      page.style.setProperty("--projects-nav-height", `${navHeight}px`);
    };

    updateNavHeight();

    let observer;
    if (window.ResizeObserver && nav) {
      observer = new ResizeObserver(updateNavHeight);
      observer.observe(nav);
    }

    window.addEventListener("resize", updateNavHeight);

    return () => {
      window.removeEventListener("resize", updateNavHeight);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <main
      ref={pageRef}
      className="coded-projects-landing"
      style={{
        "--projects-bg-desktop": `url("${base}design/projects-bg.png")`,
        "--projects-bg-mobile": `url("${base}design/projects-bg-mobile.png")`,
      }}
    >
      <SiteNav />

      <section className="projects-hero-stage">
        <div className="projects-screen-bg" aria-hidden="true" />

        <h1 className="projects-table-title">
          WHAT I BRING TO
          <br />
          THE TABLE.
        </h1>

        <div className="category-tiles">
          {CATEGORIES.map((category, index) => (
            <Link
              className="category-tile magnetic-tile"
              key={category.slug}
              to={`/category/${category.slug}`}
            >
              <i className="tile-arrow" aria-hidden="true" />

              <span>{String(index + 1).padStart(2, "0")}</span>

              <strong>
                {splitCategoryName(category.name).map((part) => (
                  <small key={part}>{part}</small>
                ))}
              </strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}