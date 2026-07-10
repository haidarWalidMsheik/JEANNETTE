import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasSupabase, supabase } from "../lib/supabase";

function formatLockTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function AdminLogin() {
  const navigate = useNavigate();

  const noSaveId = useMemo(() => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return String(Date.now());
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [triesLeft, setTriesLeft] = useState(5);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  const isLocked = lockedUntil && now < lockedUntil;
  const remainingMs = isLocked ? lockedUntil - now : 0;

  useEffect(() => {
    setEmail("");
    setPassword("");
    setError("");
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function resetFields() {
      setEmail("");
      setPassword("");
    }

    window.addEventListener("pageshow", resetFields);

    return () => {
      window.removeEventListener("pageshow", resetFields);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!hasSupabase || !supabase) {
      setError("Supabase is not connected.");
      return;
    }

    if (isLocked) {
      setError(`Too many wrong login attempts. Try again after ${formatLockTime(remainingMs)}.`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Enter admin Gmail and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (data?.lockedUntil) {
          setLockedUntil(new Date(data.lockedUntil).getTime());
        }

        if (Number.isFinite(Number(data?.triesLeft))) {
          setTriesLeft(Number(data.triesLeft));
        }

        setPassword("");
        setError(data?.error || "Wrong admin email or password.");
        return;
      }

      if (!data?.session?.access_token || !data?.session?.refresh_token) {
        setPassword("");
        setError("Login failed. Missing secure session.");
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        setPassword("");
        setError(sessionError.message || "Could not set admin session.");
        return;
      }

      setEmail("");
      setPassword("");
      setTriesLeft(5);
      setLockedUntil(0);

      navigate("/crud", { replace: true });
    } catch (err) {
      setPassword("");
      setError(err.message || "Could not login.");
    } finally {
      setLoading(false);
    }
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
        <h1>Admin Login</h1>

        {isLocked ? (
          <p className="error-text">
            Locked. Try again after {formatLockTime(remainingMs)}.
          </p>
        ) : (
          <p className="admin-muted">
            You have {triesLeft} login tries.
          </p>
        )}

        <label>
          Admin Gmail
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            inputMode="email"
            name={`admin-email-${noSaveId}`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            placeholder="Admin Gmail"
            disabled={loading || isLocked}
            required
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            name={`admin-password-${noSaveId}`}
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="none"
            placeholder="Password"
            disabled={loading || isLocked}
            required
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button disabled={loading || isLocked}>
          {loading ? "Checking..." : isLocked ? "Locked" : "Login"}
        </button>
      </form>
    </main>
  );
}