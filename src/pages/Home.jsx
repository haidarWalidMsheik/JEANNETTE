import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";

export default function Home() {
  const base = import.meta.env.BASE_URL;

  return (
    <main className="photo-home-page">
      <section className="photo-home-section hero-photo-section" id="about">
        <div className="hero-nav-layer">
          <SiteNav />
        </div>

        <div className="hero-load-line" aria-hidden="true" />

        <img
          className="photo-section-image"
          src={`${base}design/home-hero-bg.jpeg`}
          alt="Jeannette portfolio hero"
        />
      </section>

      <section className="photo-home-section about-photo-only-section">
        <img
          className="photo-section-image"
          src={`${base}design/about-bg-clean.png`}
          alt="Jeannette graphic designer section"
        />

        <Link className="red-pill-button magnetic-button photo-check-button" to="/projects">
          Check Ma Work
        </Link>
      </section>

      <section className="photo-home-section bottom-photo-only-section">
        <img
          className="photo-section-image"
          src={`${base}design/bottom-section-bg.png`}
          alt="Jeannette skills and belief section"
        />

        <Link className="red-pill-button magnetic-button photo-collab-button" to="/collaborate">
          Let’s Collaborate
        </Link>
      </section>
    </main>
  );
}
