import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasSupabase, isCurrentUserFixedAdmin, supabase } from "../lib/supabase";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!hasSupabase || !supabase) {
      setMessage("Supabase is not connected yet. Add your Supabase URL and anon key, then run the SQL file.");
      return;
    }

    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    const allowed = await isCurrentUserFixedAdmin();
    setLoading(false);

    if (!allowed) {
      await supabase.auth.signOut();
      setMessage("This account is not the fixed admin account in the database.");
      return;
    }

    navigate("/crud");
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <p className="admin-kicker">Jeannette Portfolio</p>
        <h1>Admin Login</h1>
        <p className="admin-muted">
          The email and password are checked by Supabase Auth. The admin email is verified from the database server only.
        </p>
        <div className="security-note">
          <strong>Database protected:</strong>
          <span>Only the admin email saved in Supabase can enter the CRUD page. Project photos are stored in Supabase Storage.</span>
        </div>
        {!hasSupabase && (
          <div className="setup-warning">
            Supabase is not connected. Add the environment variables and run the SQL setup before using admin.
          </div>
        )}
        <label>
          Admin email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required />
        </label>
        {message && <p className="error-text">{message}</p>}
        <button disabled={loading || !hasSupabase}>{loading ? "Checking..." : "Login"}</button>
      </form>
    </main>
  );
}
