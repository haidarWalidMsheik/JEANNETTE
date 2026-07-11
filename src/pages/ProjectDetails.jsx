import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

  const bigImage =
    project?.detail_image_url ||
    project?.image_url ||
    project?.card_image_url;

  return (
    <main className="detail-page project-photo-only-page">
      <SiteNav />

      {loading && <p className="project-photo-status">Opening project...</p>}

      {error && <p className="project-photo-status error-text">{error}</p>}

      {!loading && !error && (
        <section className="project-photo-only-stage">
          {bigImage ? (
            <img src={bigImage} alt={project.name} />
          ) : (
            <p className="project-photo-status">No big project image yet.</p>
          )}
        </section>
      )}
    </main>
  );
}