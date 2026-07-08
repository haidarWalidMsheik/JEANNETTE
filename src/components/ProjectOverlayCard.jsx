import { Link } from "react-router-dom";
import { buildWhatsAppLink } from "../lib/supabase";

export default function ProjectOverlayCard({ project, left, top, width, height }) {
  if (!project) return null;

  return (
    <article
      className="project-overlay-card"
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
    >
      <Link className="project-card-main" to={`/project/${project.id}`} title={`Open ${project.name}`}>
        <div className="project-image-wrap">
          {project.image_url ? (
            <img src={project.image_url} alt={project.name} />
          ) : (
            <div className="project-empty-image">Add image</div>
          )}
          <span className="project-shine" />
        </div>
        <div className="project-card-info">
          <div>
            <small>{project.category}</small>
            <strong>{project.name}</strong>
            <em>{project.type || "Project item"}</em>
          </div>
          <span className="price-badge">${Number(project.price || 0).toFixed(2)}</span>
        </div>
      </Link>

      <a
        className="quick-contact"
        href={buildWhatsAppLink(project)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Contact Jeannette about ${project.name}`}
      >
        Contact J
      </a>
    </article>
  );
}
