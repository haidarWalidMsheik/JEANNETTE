import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES, getCategoryBySlug } from "../config/categories";
import { buildWhatsAppLink } from "../lib/supabase";
import { listProjects } from "../services/projectService";

const categoryCopy = {
  "branding": {
    title: "MEET THE BRANDS.",
    text: "Logos, colors, typography, packaging, every detail has a job to do. Here's a collection of brands crafted to be bold, memorable, and impossible to ignore.",
  },
  "social-media": {
    title: "FEED WORTHY.",
    text: "From static posts and carousels to reels, stories, and campaigns, every piece is designed to grab attention and spark engagement.",
  },
  "web-design": {
    title: "CLICK AROUND.",
    text: "Every screen is designed with intention, balancing aesthetics, usability, and seamless experiences that look great and feel even better.",
  },
  "illustrations": {
    title: "DRAWN TO CREATE.",
    text: "From playful sketches to polished illustrations, every piece starts with a blank canvas and ends with more personality, color, and imagination.",
  },
  "layouts": {
    title: "PAGE BY PAGE.",
    text: "Behind every great publication is a thoughtful layout, bringing typography, imagery, and composition into pages that flow effortlessly.",
  },
};

function ProjectTypeOrbit({ activeSlug }) {
  const activeIndex = Math.max(0, CATEGORIES.findIndex((item) => item.slug === activeSlug));
  const activeAngle = CATEGORIES[activeIndex]?.angle ?? -90;
  return (
    <nav
      className="project-type-orbit"
      aria-label="Project types"
      style={{ "--active-angle": `${activeAngle}deg`, "--from-angle": `${activeAngle}deg` }}
    >
      <span className="orbit-glow" aria-hidden="true" />
      <span className="orbit-ring" aria-hidden="true" />
      <span className="orbit-track-light" aria-hidden="true" />
      <span className="orbit-needle" aria-hidden="true" />
      <span className="orbit-active-dot" aria-hidden="true" />
      <span className="orbit-top-triangle" aria-hidden="true" />
      <Link className="orbit-center" to="/projects" aria-label="Open projects overview">
        <small>PROJECT</small>
        <strong>TYPE</strong>
      </Link>
      {CATEGORIES.map((item) => (
        <Link
          key={item.slug}
          to={`/category/${item.slug}`}
          className={`orbit-category${item.slug === activeSlug ? " active" : ""}`}
          style={{ "--angle": `${item.angle}deg`, "--counter-angle": `${-item.angle}deg` }}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const category = getCategoryBySlug(slug);
  const copy = categoryCopy[category.slug] || categoryCopy.branding;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    listProjects()
      .then((items) => {
        if (!active) return;
        setProjects(items);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Could not load projects.");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const categoryProjects = useMemo(
    () => projects.filter((project) => project.category === category.name),
    [projects, category.name]
  );

  return (
    <main className={`coded-category-page category-theme-${category.slug}`}>
      <SiteNav dark={false} />
      <section className="coded-category-layout">
        <aside className="category-intro-copy">
          <p className="category-kicker">{category.name}</p>
          <h1>{copy.title}</h1>
          <p>{copy.text}</p>
        </aside>

        <div className="category-work-area">
          <ProjectTypeOrbit activeSlug={category.slug} />

          {loading && <p className="category-message">Loading projects...</p>}
          {error && <p className="category-message error-text">{error}</p>}
          {!loading && !error && categoryProjects.length === 0 && (
            <div className="category-empty-state">
              <strong>No items yet.</strong>
              <span>The design is ready. Add items from the admin CRUD page and they will appear here automatically.</span>
            </div>
          )}

          <div className="coded-project-grid">
            {categoryProjects.map((project) => (
              <article className="coded-project-card" key={project.id}>
                <Link className="coded-project-image" to={`/project/${project.id}`}>
                  {project.image_url ? <img src={project.image_url} alt={project.name} /> : <span>Add image from CRUD</span>}
                  <i />
                </Link>
                <div className="coded-project-info">
                  <small>{project.type || "Project item"}</small>
                  <h2>{project.name}</h2>
                  <div>
                    <strong>${Number(project.price || 0).toFixed(2)}</strong>
                    <a href={buildWhatsAppLink(project)} target="_blank" rel="noreferrer">Contact J</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
