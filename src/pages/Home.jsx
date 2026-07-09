import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";

export default function Home() {
  const heroImage = `${import.meta.env.BASE_URL}design/home-hero-bg.jpeg`;
  const aboutImage = `${import.meta.env.BASE_URL}design/about-bg-clean.png`;
  const bottomImage = `${import.meta.env.BASE_URL}design/bottom-section-bg.png`;

  return (
    <main className="coded-home-page">
      <section className="coded-hero-section home-photo-hero" id="about">
        <div
          className="home-hero-bg-image"
          style={{ backgroundImage: `url("${heroImage}")` }}
          aria-hidden="true"
        />

        <div className="hero-load-line" aria-hidden="true" />

        <SiteNav />
      </section>

      <section className="coded-about-section about-photo-section">
        <div
          className="about-photo-bg"
          style={{ backgroundImage: `url("${aboutImage}")` }}
          aria-hidden="true"
        />

        <Link className="red-pill-button magnetic-button about-photo-button" to="/projects">
          Check Ma Work
        </Link>
      </section>

      <section className="bottom-photo-section">
        <div
          className="bottom-photo-bg"
          style={{ backgroundImage: `url("${bottomImage}")` }}
          aria-hidden="true"
        />

        <Link className="red-pill-button magnetic-button bottom-photo-cta" to="/projects">
          Let’s Collaborate
        </Link>
      </section>
    </main>
  );
}