import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { buildWhatsAppLink, jeannettePhoneDisplay } from "../lib/supabase";
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
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="detail-page">
        <p>Opening project...</p>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="detail-page">
        <p className="error-text">{error || "Project not found."}</p>
        <Link to="/projects" className="detail-link">Back to projects</Link>
      </main>
    );
  }

  return (
    <main className="detail-page">
      <SiteNav />

      <section className="detail-hero">
        <div className="detail-copy">
          <p className="admin-kicker">{project.category}</p>
          <h1>{project.name}</h1>
          <div className="detail-meta">
            <span>{project.type || "Project item"}</span>
            <strong>${Number(project.price || 0).toFixed(2)}</strong>
          </div>
          <p>{project.description || "This item was added from the admin CRUD page."}</p>
          <div className="detail-actions">
            <a href={buildWhatsAppLink(project)} target="_blank" rel="noreferrer">Contact Jeannette</a>
            <a href={`tel:${jeannettePhoneDisplay.replace(/\s/g, "")}`} className="secondary-action">Call {jeannettePhoneDisplay}</a>
          </div>
        </div>
        <div className="detail-image-card">
          {project.image_url ? <img src={project.image_url} alt={project.name} /> : <div>No project image yet</div>}
        </div>
      </section>

      <Link to={`/category/${String(project.category || "branding").toLowerCase().replace(/\s+/g, "-")}`} className="detail-link">Back to {project.category}</Link>
    </main>
  );
}
