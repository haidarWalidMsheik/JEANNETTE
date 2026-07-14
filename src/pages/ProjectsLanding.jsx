import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES } from "../config/categories";

const CATEGORY_DETAILS = {
  Branding: {
    title: "Brand Design",
    subtitle: "Identity, packaging and visual systems",
  },
  "Social Media": {
    title: "Social Media",
    subtitle: "Campaigns, posts and digital content",
  },
  "Web Design": {
    title: "Web Design",
    subtitle: "Responsive interfaces and web experiences",
  },
  Illustrations: {
    title: "Illustration Design",
    subtitle: "Original drawings and visual storytelling",
  },
  Layouts: {
    title: "Layout Design",
    subtitle: "Editorial, posters and balanced compositions",
  },
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

        <div className="projects-heading-block">
          <span className="projects-heading-kicker">Selected creative services</span>
          <h1 className="projects-table-title">
            WHAT I BRING TO
            <br />
            THE TABLE.
          </h1>
        </div>

        <div className="category-tiles">
          {CATEGORIES.map((category, index) => {
            const detail = CATEGORY_DETAILS[category.name] || {
              title: category.name,
              subtitle: "Creative design service",
            };

            return (
              <Link
                className="category-tile magnetic-tile"
                key={category.slug}
                to={`/category/${category.slug}`}
              >
                <span className="category-tile-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="category-tile-copy">
                  <strong>{detail.title}</strong>
                  <small>{detail.subtitle}</small>
                  <i aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
