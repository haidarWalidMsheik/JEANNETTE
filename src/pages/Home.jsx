import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { CATEGORIES } from "../config/categories";

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
  return (
    <main className="coded-home-page">
      <section className="coded-hero-section" id="about">
        <div className="motion-street-bg" aria-hidden="true" />
        <SiteNav />
        <p className="landing-note note-right">You've now landed in my small creative space.</p>
        <p className="landing-note note-left">It’s Jeannette.</p>
        <h1 className="big-hi-text">HI THERE</h1>
        <img className="girl-face-fixed" src= {`${import.meta.env.BASE_URL}design/girl-hero.png`}  alt="Jeannette portrait" />
        <p className="landing-note note-bottom">Take a look around. You might find a few brands, some ideas, and maybe a glimpse of serenity along the way!</p>
      </section>

     



      <section className="coded-about-section">
        <div className="about-copy-block">
          <span>I’m J</span>
          <h2>GRAPHIC DESIGNER, PUBLICIST AND VISUAL COMMUNICATOR.</h2>
          <p>
            Over the past five years, I've had the opportunity to lead creative departments and collaborate with agencies,
            consultancies, and businesses across Lebanon, Qatar, Saudi Arabia, and the UK, delivering work that blends
            strategy with creativity.
          </p>
          <Link className="red-pill-button magnetic-button" to="/projects">Check Ma Work</Link>
        </div>
        <div className="about-girl-stage" aria-label="Second Jeannette photo">
          <div className="red-sun" />
          <img
            className="girl-second-photo"
            src=   {`${import.meta.env.BASE_URL}design/girl-about.png`}
            alt="Jeannette seated portrait"
          />
        </div>
      </section>

      <section className="coded-skills-section">
        <h2>WHAT I DO?</h2>
        <h3>I MEAN LOOOVE DOING...</h3>
        <div className="skill-pills">
          {SKILLS.map((skill) => (
            <Link key={skill.label} to={`/category/${skill.slug}`}>
              {skill.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="coded-believe-section">
        <div className="belief-content">
          <h2>I PERSONALLY BELIEVE,<br />A DESIGNER CAN MAKE OR BREAK A BRAND.</h2>
          <p>
            Brands don't become iconic by accident. They are built with intention, strategy, and design that knows exactly what it's trying to say.
            If you're looking for someone to help shape that story, you're in the right place.
          </p>
          <Link className="red-pill-button magnetic-button" to="/projects">Let’s Collaborate</Link>
        </div>
      </section>

      <footer className="coded-footer">
        <Link to="/" className="coded-logo footer-logo"><span>JEANNETTE'S</span><strong>PORTFOLIO</strong></Link>
        <div className="footer-contact-line">
          <a href="tel:+96176818120">+961 76 818 120</a>
          <a href="mailto:jeannettekhoury012@gmail.com">jeannettekhoury012@gmail.com</a>
        </div>
        <div className="footer-links">
          <Link to="/">ABOUT ME</Link>
          <Link to="/projects">PROJECTS</Link>
          <Link to="/collaborate">COLLABORATE</Link>
        </div>
      </footer>
    </main>
  );
}
