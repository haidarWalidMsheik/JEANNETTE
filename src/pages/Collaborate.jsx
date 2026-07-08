import { useState } from "react";
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
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

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
    <main className="coded-collaborate-page">
      <SiteNav />
      <section className="coded-collab-layout">
        <div className="contact-panel-left">
          <h1>LET’S COLLABORATE!</h1>
          <p>You may fill the form or reach me by phone or mail.</p>
          <h2>CONTACT J.</h2>
          <div className="contact-direct-links">
            <a href="tel:+96176818120">+961 76 818 120</a>
            <a href="mailto:jeannettekhoury012@gmail.com">jeannettekhoury012@gmail.com</a>
          </div>
          <div className="collab-red-orb" />
        </div>

        <form className="coded-contact-form" onSubmit={handleSubmit}>
          <label>
            <span>NAME*</span>
            <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Enter Name" autoComplete="name" required />
          </label>
          <label>
            <span>EMAIL*</span>
            <input value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Enter Email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>BUSINESS NAME</span>
            <input value={form.businessName} onChange={(event) => updateField("businessName", event.target.value)} placeholder="Enter company name" />
          </label>
          <label>
            <span>PROJECT TYPE</span>
            <input value={form.projectType} onChange={(event) => updateField("projectType", event.target.value)} placeholder="Project Type" />
          </label>
          <label>
            <span>HOW CAN J HELP*</span>
            <textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Send me a Message" required />
          </label>
          {error && <p className="contact-error-coded">{error}</p>}
          <button className="coded-send-button" type="submit">SEND</button>
        </form>
      </section>
    </main>
  );
}
