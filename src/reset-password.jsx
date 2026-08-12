import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

const recoveryParams = new URLSearchParams(window.location.hash.slice(1));
const isRecoveryRedirect = recoveryParams.get("type") === "recovery";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const hasSupabase = url.includes(".supabase.co") && anonKey.length > 40;
const recoveryClient = hasSupabase ? createClient(url, anonKey) : null;

function isStrongPassword(value) {
  return (
    value.length >= 12 &&
    value.length <= 128 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

function PasswordReset() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function initializeRecovery() {
      if (!recoveryClient || !isRecoveryRedirect) {
        if (active) setError("This recovery link is invalid or has expired.");
        return;
      }

      const { data, error: sessionError } =
        await recoveryClient.auth.getSession();

      if (!active) return;

      if (sessionError || !data?.session) {
        setError("This recovery link is invalid or has expired.");
        return;
      }

      setReady(true);
    }

    initializeRecovery();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!isStrongPassword(password)) {
      setError(
        "Use 12–128 characters with uppercase, lowercase, a number, and a symbol."
      );
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { error: updateError } = await recoveryClient.auth.updateUser({
        password,
      });

      if (updateError) {
        setError("The password could not be changed. Request a new recovery email.");
        return;
      }

      await recoveryClient.auth.signOut({ scope: "global" });
      setPassword("");
      setConfirmation("");
      setComplete(true);
    } catch {
      setError("The password could not be changed. Request a new recovery email.");
    } finally {
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <p className="admin-kicker">Jeannette Portfolio</p>
          <h1>Password changed</h1>
          <p className="admin-success-text">
            Your password was updated. Sign in again and complete authenticator verification.
          </p>
          <a className="admin-primary-link" href="/#/admin-login">
            Return to Admin Login
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-login-page">
      <form
        className="admin-login-card"
        onSubmit={handleSubmit}
        autoComplete="off"
        spellCheck="false"
      >
        <p className="admin-kicker">Jeannette Portfolio</p>
        <h1>Create new password</h1>

        {ready && (
          <>
            <p className="admin-password-rules">
              Use at least 12 characters with uppercase, lowercase, a number, and a symbol.
            </p>

            <label>
              New password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                maxLength={128}
                disabled={loading}
                required
              />
            </label>

            <label>
              Confirm new password
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                type="password"
                autoComplete="new-password"
                maxLength={128}
                disabled={loading}
                required
              />
            </label>
          </>
        )}

        {error && <p className="error-text">{error}</p>}

        {ready && (
          <button disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </button>
        )}

        {!ready && (
          <a className="admin-primary-link" href="/#/admin-login">
            Return to Admin Login
          </a>
        )}
      </form>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PasswordReset />
  </React.StrictMode>
);
