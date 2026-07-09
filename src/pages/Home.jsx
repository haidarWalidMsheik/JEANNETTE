import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";

export default function Home() {
  const base = import.meta.env.BASE_URL;

  return (
    <main className="photo-home-page">
      <section className="photo-home-section hero-photo-section" id="about">
        <img
          className="photo-section-image"
          src={`${base}design/home-hero-bg.jpeg`}
          alt="Jeannette portfolio hero"
        />

        <div className="hero-load-line" aria-hidden="true" />

        <div className="hero-nav-layer">
          <SiteNav />
        </div>
      </section>

      <section className="photo-home-section about-photo-only-section">
        <img
          className="photo-section-image"
          src={`${base}design/home-hero-bg.jpeg`}
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

        <Link className="red-pill-button magnetic-button photo-collab-button" to="/projects">
          Let’s Collaborate
        </Link>
      </section>
    </main>
  );
}