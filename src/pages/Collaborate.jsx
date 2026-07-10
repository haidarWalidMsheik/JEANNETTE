import { useEffect, useRef, useState } from "react";
import SiteNav from "../components/SiteNav";
import { buildContactWhatsAppLink } from "../lib/supabase";

const initialForm = {
  name: "",
  email: "",
  businessName: "",
  projectType: "",
  message: "",
};

export default function Collaborate() {
  const pageRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const nav = page.querySelector(".coded-nav");

    const updateNavHeight = () => {
      const navHeight = nav ? nav.offsetHeight : 120;
      page.style.setProperty("--collab-nav-height", `${navHeight}px`);
    };

    updateNavHeight();

    let observer;
    if (window.ResizeObserver && nav) {
      observer = new ResizeObserver(updateNavHeight);
      observer.observe(nav);
    }

    window.addEventListener("resize", updateNavHeight);

    return () => {
      window.removeEventListener("resize", updateNavHeight);
      if (observer) observer.disconnect();
    };
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill your name, email, and message before sending.");
      return;
    }

    window.open(buildContactWhatsAppLink(form), "_blank", "noopener,noreferrer");
  }

  return (
    <main
      ref={pageRef}
      className="coded-collaborate-page"
      style={{
        "--collab-bg": `url("${base}design/collaborate.png")`,
      }}
    >
      <SiteNav />

      <section className="coded-collab-layout">
        <form className="coded-contact-form" onSubmit={handleSubmit}>
          <label>
            <span>NAME*</span>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Enter Name"
              autoComplete="name"
              required
            />
          </label>

          <label>
            <span>EMAIL*</span>
            <input
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="Enter Email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>BUSINESS NAME</span>
            <input
              value={form.businessName}
              onChange={(event) => updateField("businessName", event.target.value)}
              placeholder="Enter company name"
            />
          </label>

          <label>
            <span>PROJECT TYPE</span>
            <input
              value={form.projectType}
              onChange={(event) => updateField("projectType", event.target.value)}
              placeholder="Project Type"
            />
          </label>

          <label>
            <span>HOW CAN J HELP*</span>
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Send me a Message"
              required
            />
          </label>

          {error && <p className="contact-error-coded">{error}</p>}

          <button className="coded-send-button" type="submit">
            SEND
          </button>
        </form>
      </section>
    </main>
  );
}