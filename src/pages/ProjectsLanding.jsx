import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES } from "../config/categories";

const CARD_COPY = {
  Branding: { title: "Brand Design", subtitle: "Identity and packaging" },
  "Social Media": { title: "Social Media", subtitle: "Campaigns and digital content" },
  "Web Design": { title: "Web Design", subtitle: "Responsive digital experiences" },
  Illustrations: { title: "Illustration Design", subtitle: "Original visual storytelling" },
  Layouts: { title: "Layout Design", subtitle: "Editorial and composition" },
};

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
          <span>WHAT I BRING TO</span>
          <span>THE TABLE.</span>
        </h1>

        <div className="category-tiles">
          {CATEGORIES.map((category, index) => {
            const copy = CARD_COPY[category.name] || {
              title: category.name,
              subtitle: "Creative design",
            };

            return (
              <Link
                className="category-tile magnetic-tile"
                key={category.slug}
                to={`/category/${category.slug}`}
              >
                <span className="project-card-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="project-card-copy">
                  <strong>{copy.title}</strong>
                  <small>{copy.subtitle}</small>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}