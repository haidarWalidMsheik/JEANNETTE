import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES } from "../config/categories";
import { listProjects } from "../services/projectService";

const CATEGORY_TEXT = {
  Branding: {
    title: "MEET THE BRANDS.",
    text: "Logos, colors, typography, packaging, every detail has a job to do. Here's a collection of brands crafted to be bold, memorable, and impossible to ignore.",
  },
  "Social Media": {
    title: "SOCIAL THAT SPEAKS.",
    text: "Posts, campaigns, visuals, and digital stories designed to stop the scroll and make every brand feel alive online.",
  },
  "Web Design": {
    title: "DIGITAL FIRST IMPRESSIONS.",
    text: "Clean, expressive, and functional IMPRESSIONS.",
    text: "Clean web visuals created to guide the eye and make every click feel intentional.",
  },
  Illustrations: {
    title: "DRAWN WITH CHARACTER.",
    text: "Illustrations and digital drawings shaped with personality, emotion, and a strong visual identity.",
  },
  Layouts: {
    title: "EVERY DETAIL IN PLACE.",
    text: "Editorial layouts, posters, and compositions designed with balance, rhythm, and strong visual structure.",
  },
};

export default function CategoryPage() {
  const { slug } = useParams();

  const category = useMemo(() => {
    return CATEGORIES.find((item) => item.slug === slug) || CATEGORIES[0];
  }, [slug]);

  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);

    listProjects()
      .then((items) => {
        if (!active) return;

        const filtered = items.filter(
          (project) => project.category === category.name
        );

        setProjects(filtered);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Could not load projects.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category.name]);

  const copy = CATEGORY_TEXT[category.name] || {
    title: `MEET THE ${category.name}.`,
    text: "A curated selection of creative work added from the admin dashboard.",
  };

  return (
    <main className="coded-category-page">
      <SiteNav />

      <section className="category-type-hero" data-category={category.slug}>
        <p>{category.name}</p>
        <h1>{copy.title}</h1>
        <span>{copy.text}</span>
      </section>

      {loading && <p className="category-status">Loading projects...</p>}

      {error && <p className="category-status error-text">{error}</p>}

      {!loading && !error && (
        <section className="project-type-card-grid">
          {projects.length === 0 ? (
            <p className="category-status">
              No projects added yet in this category.
            </p>
          ) : (
            projects.map((project) => {
              const cardImage =
                project.card_image_url ||
                project.image_url ||
                project.detail_image_url;

              return (
                <Link
                  key={project.id}
                  className="project-type-card"
                  to={`/project/${project.id}`}
                >
                  <div className="project-type-photo">
                    {cardImage ? (
                      <img src={cardImage} alt={project.name} />
                    ) : (
                      <div className="project-type-empty">No Image</div>
                    )}
                  </div>

                  <div className="project-type-copy">
                    <h2>{project.name}</h2>

                    {project.description && (
                      <p>{project.description}</p>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </section>
      )}
    </main>
  );
}
