import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { hasSupabase, isCurrentUserFixedAdmin, supabase } from "../lib/supabase";
import { CATEGORY_NAMES, categoryOrder } from "../config/categories";
import { deleteProject, listProjects, saveProject } from "../services/projectService";

function fileSizeLabel(bytes) {
  if (!bytes) return "";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const blankProject = {
  id: "",
  name: "",
  category: "Branding",
  description: "",
  sort_order: 0,

  image_url: "",
  image_path: "",

  card_image_url: "",
  card_image_path: "",

  detail_image_url: "",
  detail_image_path: "",
};

const emptyVisitorStats = {
  total_visits: 0,
  unique_visitors: 0,
  last_24_hours: 0,
};

function sortedProjects(projects) {
  return [...projects].sort((a, b) => {
    const byCategory = categoryOrder(a.category) - categoryOrder(b.category);
    if (byCategory !== 0) return byCategory;

    const bySort = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    if (bySort !== 0) return bySort;

    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export default function Admin() {
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(blankProject);

  const [cardImageFile, setCardImageFile] = useState(null);
  const [detailImageFile, setDetailImageFile] = useState(null);

  const [cardImageInfo, setCardImageInfo] = useState("");
  const [detailImageInfo, setDetailImageInfo] = useState("");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [visitorStats, setVisitorStats] = useState(emptyVisitorStats);
  const [visitorStatsLoading, setVisitorStatsLoading] = useState(true);
  const [visitorStatsError, setVisitorStatsError] = useState("");
  const [visitorRealtimeConnected, setVisitorRealtimeConnected] =
    useState(false);

  async function checkAdmin() {
    if (!hasSupabase || !supabase) {
      setError(
        "Supabase is not connected. Add your Supabase environment variables first."
      );
      return;
    }

    const allowed = await isCurrentUserFixedAdmin();

    if (!allowed) {
      navigate("/admin-login");
      return;
    }

    setReady(true);
  }

  async function load() {
    try {
      setError("");
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message || "Could not load projects.");
    }
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  useEffect(() => {
    if (!ready || !hasSupabase || !supabase) return undefined;

    let componentActive = true;

    async function loadVisitorStats(showLoading = false) {
      if (showLoading && componentActive) {
        setVisitorStatsLoading(true);
      }

      const { data, error: statsError } = await supabase.rpc(
        "get_website_stats"
      );

      if (!componentActive) return;

      if (statsError) {
        console.error("Could not load visitor statistics:", statsError);
        setVisitorStatsError(
          statsError.message || "Could not load visitor statistics."
        );
        setVisitorStatsLoading(false);
        return;
      }

      setVisitorStats(data?.[0] ?? emptyVisitorStats);
      setVisitorStatsError("");
      setVisitorStatsLoading(false);
    }

    // Load current totals immediately when the Admin page opens.
    loadVisitorStats(true);

    // Receive every new visit while the Admin page stays open.
    const visitorChannel = supabase
      .channel("admin-live-website-visits")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "website_visits",
        },
        () => {
          loadVisitorStats(false);
        }
      )
      .subscribe((channelStatus) => {
        if (!componentActive) return;

        setVisitorRealtimeConnected(channelStatus === "SUBSCRIBED");

        if (
          channelStatus === "CHANNEL_ERROR" ||
          channelStatus === "TIMED_OUT"
        ) {
          console.error("Visitor Realtime status:", channelStatus);
        }
      });

    return () => {
      componentActive = false;
      setVisitorRealtimeConnected(false);
      supabase.removeChannel(visitorChannel);
    };
  }, [ready]);

  const groupedProjects = useMemo(() => {
    const groups = {};

    for (const category of CATEGORY_NAMES) groups[category] = [];

    for (const project of sortedProjects(projects)) {
      if (!groups[project.category]) groups[project.category] = [];
      groups[project.category].push(project);
    }

    return groups;
  }, [projects]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function editProject(project) {
    setForm({
      ...blankProject,
      ...project,
      card_image_url: project.card_image_url || project.image_url || "",
      card_image_path: project.card_image_path || project.image_path || "",
      detail_image_url: project.detail_image_url || project.image_url || "",
      detail_image_path: project.detail_image_path || project.image_path || "",
    });

    setCardImageFile(null);
    setDetailImageFile(null);
    setCardImageInfo("");
    setDetailImageInfo("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(blankProject);
    setCardImageFile(null);
    setDetailImageFile(null);
    setCardImageInfo("");
    setDetailImageInfo("");
  }

  function handleCardImageChange(file) {
    setCardImageFile(file || null);

    if (!file) {
      setCardImageInfo("");
      return;
    }

    const size = fileSizeLabel(file.size);

    if (file.size > 5 * 1024 * 1024) {
      setCardImageInfo(
        `Selected card photo is ${size}. The website will auto-compress it before upload.`
      );
    } else {
      setCardImageInfo(`Selected card photo is ${size}. Ready to upload.`);
    }
  }

  function handleDetailImageChange(file) {
    setDetailImageFile(file || null);

    if (!file) {
      setDetailImageInfo("");
      return;
    }

    const size = fileSizeLabel(file.size);

    if (file.size > 5 * 1024 * 1024) {
      setDetailImageInfo(
        `Selected big project photo is ${size}. The website will auto-compress it before upload.`
      );
    } else {
      setDetailImageInfo(
        `Selected big project photo is ${size}. Ready to upload.`
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setStatus("");
      setError("");

      await saveProject(form, cardImageFile, detailImageFile);

      setStatus(
        form.id
          ? "Item updated and resorted."
          : "Item added to the correct category."
      );
      resetForm();
      await load();
    } catch (err) {
      setError(err.message || "Could not save project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project) {
    if (!confirm(`Delete ${project.name}?`)) return;

    try {
      setError("");
      await deleteProject(project);
      await load();
    } catch (err) {
      setError(err.message || "Could not delete project.");
    }
  }

  async function logout() {
    if (hasSupabase && supabase) {
      await supabase.auth.signOut();
    }

    navigate("/admin-login", { replace: true });
  }

  if (!ready) {
    return (
      <main className="admin-page">
        <p>Checking admin...</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Jeannette Portfolio</p>
          <h1>CRUD</h1>
          <p>
            Add a card photo for the category card, and a big project photo for
            the project details page.
          </p>
        </div>

        <div className="admin-header-actions">
          <Link to="/guest">View guest page</Link>
          <Link to="/projects">View projects</Link>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {!hasSupabase && (
        <div className="setup-warning">
          Supabase is not connected. CRUD is disabled until the database server
          is connected.
        </div>
      )}

      <section className="visitor-dashboard-box">
        <div className="visitor-dashboard-heading">
          <div>
            <span>WEBSITE ANALYTICS</span>
            <h2>Visitor Overview</h2>
          </div>

          <div
            className={`visitor-live-status ${
              visitorRealtimeConnected ? "is-connected" : ""
            }`}
          >
            <i aria-hidden="true" />
            {visitorRealtimeConnected ? "LIVE" : "CONNECTING"}
          </div>
        </div>

        {visitorStatsLoading ? (
          <p className="visitor-loading">Loading visitor statistics...</p>
        ) : visitorStatsError ? (
          <p className="visitor-stats-error">{visitorStatsError}</p>
        ) : (
          <div className="visitor-stat-grid">
            <article className="visitor-stat-card">
              <small>UNIQUE VISITORS</small>
              <strong>{visitorStats.unique_visitors}</strong>
              <p>Different browsers that visited the website</p>
            </article>

            <article className="visitor-stat-card">
              <small>TOTAL VISITS</small>
              <strong>{visitorStats.total_visits}</strong>
              <p>Total website sessions recorded</p>
            </article>

            <article className="visitor-stat-card">
              <small>LAST 24 HOURS</small>
              <strong>{visitorStats.last_24_hours}</strong>
              <p>Visits recorded during the last day</p>
            </article>
          </div>
        )}
      </section>

      <form className="crud-form" onSubmit={handleSubmit}>
        <h2>{form.id ? "Edit item" : "Add item"}</h2>

        <div className="form-grid">
          <label>
            Item name
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </label>

          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              {CATEGORY_NAMES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            Sort order
            <input
              value={form.sort_order}
              onChange={(e) => updateField("sort_order", e.target.value)}
              type="number"
            />
          </label>

          <label>
            Card photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) =>
                handleCardImageChange(e.target.files?.[0] || null)
              }
            />
            <small className="image-upload-note">
              This photo appears on the project card.
            </small>
          </label>

          <label>
            Big project photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) =>
                handleDetailImageChange(e.target.files?.[0] || null)
              }
            />
            <small className="image-upload-note">
              This photo appears when the user opens the project.
            </small>
          </label>
        </div>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows="4"
          />
        </label>

        {cardImageInfo && (
          <p className="image-upload-info">{cardImageInfo}</p>
        )}
        {detailImageInfo && (
          <p className="image-upload-info">{detailImageInfo}</p>
        )}

        <div className="admin-preview-grid">
          {(form.card_image_url || form.image_url) && (
            <div className="current-image-preview">
              <span>Current card photo:</span>
              <img
                src={form.card_image_url || form.image_url}
                alt="Current card"
              />
            </div>
          )}

          {(form.detail_image_url || form.image_url) && (
            <div className="current-image-preview">
              <span>Current big photo:</span>
              <img
                src={form.detail_image_url || form.image_url}
                alt="Current detail"
              />
            </div>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}
        {status && <p className="success-text">{status}</p>}

        <div className="form-actions">
          <button disabled={saving}>
            {saving
              ? "Saving..."
              : form.id
                ? "Update item"
                : "Add item"}
          </button>
          <button type="button" onClick={resetForm}>
            Clear
          </button>
        </div>
      </form>

      <section className="admin-list">
        <h2>CRUD items sorted by category</h2>

        {CATEGORY_NAMES.map((category) => (
          <div className="admin-category" key={category}>
            <h3>{category}</h3>

            {groupedProjects[category]?.length ? (
              groupedProjects[category].map((project) => (
                <article className="admin-project-row" key={project.id}>
                  <div className="row-image">
                    {project.card_image_url || project.image_url ? (
                      <img
                        src={project.card_image_url || project.image_url}
                        alt={project.name}
                      />
                    ) : (
                      <span>No card image</span>
                    )}
                  </div>

                  <div>
                    <strong>{project.name}</strong>
                    <p>Order: {Number(project.sort_order || 0)}</p>
                    <small>{project.description}</small>
                  </div>

                  <div className="row-actions">
                    <button onClick={() => editProject(project)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => handleDelete(project)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="admin-muted">No items yet.</p>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}