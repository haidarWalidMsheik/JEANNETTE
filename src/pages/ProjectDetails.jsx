import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { getProjectById } from "../services/projectService";

export default function ProjectDetails() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);

    getProjectById(id)
      .then((item) => {
        if (!active) return;
        setProject(item);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Could not open this project.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="detail-page">
        <SiteNav />
        <p>Opening project...</p>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="detail-page">
        <SiteNav />
        <p className="error-text">{error || "Project not found."}</p>
        <Link to="/projects" className="detail-link">
          Back to projects
        </Link>
      </main>
    );
  }

  const categorySlug = String(project.category || "branding")
    .toLowerCase()
    .replace(/\s+/g, "-");

  const bigImage =
    project.detail_image_url ||
    project.image_url ||
    project.card_image_url;

  return (
    <main className="detail-page">
      <SiteNav />

      <section className="detail-hero">
        <div className="detail-copy">
          <p className="admin-kicker">{project.category}</p>
          <h1>{project.name}</h1>

          <div className="detail-meta">
            <span>{project.type || "Project item"}</span>
          </div>

          <p>
            {project.description ||
              "This item was added from the admin CRUD page."}
          </p>
        </div>

        <div className="detail-image-card">
          {bigImage ? (
            <img src={bigImage} alt={project.name} />
          ) : (
            <div>No big project image yet</div>
          )}
        </div>
      </section>

      <Link to={`/category/${categorySlug}`} className="detail-link">
        Back to {project.category}
      </Link>
    </main>
  );
}