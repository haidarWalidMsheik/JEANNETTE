import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";

const SKILLS = [
  { label: "Branding", slug: "branding" },
  { label: "Logo Design", slug: "branding" },
  { label: "Visual Identity", slug: "branding" },
  { label: "Illustrations", slug: "illustrations" },
  { label: "Web Design", slug: "web-design" },
  { label: "Campaigns", slug: "social-media" },
  { label: "Social Media", slug: "social-media" },
  { label: "Art Direction", slug: "branding" },
  { label: "Layouts", slug: "layouts" },
  { label: "Digital Drawings", slug: "illustrations" },
];

export default function Home() {
 const heroImage = `${import.meta.env.BASE_URL}design/girl-hero.png`;
const aboutImage = `${import.meta.env.BASE_URL}design/girl-about.png`;

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

      <section className="final-home-skills">
        <div className="final-home-skills-inner">
          <h2>WHAT I DO?</h2>
          <h3>I MEAN LOOOVE DOING...</h3>

          <div className="final-skill-pills">
            {SKILLS.map((skill) => (
              <Link key={skill.label} to={`/category/${skill.slug}`}>
                {skill.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="final-home-believe">
        <div className="final-home-believe-inner">
          <h2>
            I PERSONALLY BELIEVE,
            <br />
            A DESIGNER CAN MAKE OR BREAK A BRAND.
          </h2>

          <p className="brand-accident">Brands don’t become iconic by accident.</p>

          <p className="brand-story">
            They are built with intention, strategy, and design that knows exactly what it’s trying to say.
            <br />
            If you’re looking for someone to help shape that story, you’re in the right place.
          </p>

          <Link className="red-pill-button magnetic-button final-home-cta" to="/projects">
            Let’s Collaborate
          </Link>
        </div>
      </section>
    </main>
  );
}