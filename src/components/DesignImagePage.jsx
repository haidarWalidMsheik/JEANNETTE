import { Link } from "react-router-dom";

export default function DesignImagePage({ image, alt, children, className = "" }) {
  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty("--mx", `${x}%`);
    event.currentTarget.style.setProperty("--my", `${y}%`);
  }

  return (
    <main className={`design-shell ${className}`}>
      <div className="design-canvas" onPointerMove={handlePointerMove}>
        <img className="design-image" src={image} alt={alt} draggable="false" />
        {children}
      </div>
    </main>
  );
}

export function Hotspot({ to, href, label, left, top, width, height, className = "" }) {
  const style = {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };

  const classes = `hotspot ${className}`.trim();

  if (href) {
    return (
      <a className={classes} style={style} href={href} aria-label={label}>
        <span>{label}</span>
      </a>
    );
  }

  return (
    <Link className={classes} style={style} to={to} aria-label={label}>
      <span>{label}</span>
    </Link>
  );
}
