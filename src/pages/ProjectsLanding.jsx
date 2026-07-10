import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES } from "../config/categories";

export default function ProjectsLanding() {
  const pageRef = useRef(null);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const nav = page.querySelector(".coded-nav");
    if (!nav) return;

    const updateNavHeight = () => {
      page.style.setProperty("--projects-nav-real-height", `${nav.offsetHeight}px`);
    };

    updateNavHeight();

    let observer;
    if (window.ResizeObserver) {
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
    <main className="coded-projects-landing" ref={pageRef}>
      <div
        className="projects-screen-bg"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${base}design/projects-bg.jpeg")`,
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