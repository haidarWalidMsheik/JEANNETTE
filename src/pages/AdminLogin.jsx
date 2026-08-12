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
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");

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
    setMfaCode("");
    setMfaFactorId("");
    setMfaQrCode("");
    setMfaSecret("");
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
      setMfaCode("");
      setMfaFactorId("");
      setMfaQrCode("");
      setMfaSecret("");
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

    if (mfaFactorId) {
      if (!/^\d{6}$/.test(mfaCode.trim())) {
        setError("Enter the 6-digit authenticator code.");
        return;
      }

      try {
        setLoading(true);

        const { error: mfaError } = await supabase.auth.mfa.challengeAndVerify({
          factorId: mfaFactorId,
          code: mfaCode.trim(),
        });

        if (mfaError) {
          setMfaCode("");
          setError("Wrong or expired authenticator code.");
          return;
        }

        const { data: verifiedAssurance, error: assuranceError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (
          assuranceError ||
          verifiedAssurance?.currentLevel !== "aal2"
        ) {
          await supabase.auth.signOut();
          setMfaCode("");
          setMfaFactorId("");
          setMfaQrCode("");
          setMfaSecret("");
          setError("Second-factor verification did not complete.");
          return;
        }

        setEmail("");
        setPassword("");
        setMfaCode("");
        setMfaFactorId("");
        setMfaQrCode("");
        setMfaSecret("");
        setTriesLeft(5);
        setLockedUntil(0);
        navigate("/crud", { replace: true });
      } catch {
        setMfaCode("");
        setError("Could not verify the authenticator code.");
      } finally {
        setLoading(false);
      }

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

      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assuranceError) {
        await supabase.auth.signOut();
        setPassword("");
        setError("Could not verify login security level.");
        return;
      }

      if (assurance?.currentLevel !== "aal2") {
        const { data: factors, error: factorsError } =
          await supabase.auth.mfa.listFactors();
        const totpFactors = (factors?.all || []).filter(
          (factor) => factor.factor_type === "totp"
        );
        const verifiedFactor = totpFactors.find(
          (factor) => factor.status === "verified"
        );

        if (factorsError) {
          await supabase.auth.signOut();
          setPassword("");
          setError("Your second authentication factor is unavailable.");
          return;
        }

        if (!verifiedFactor) {
          for (const factor of totpFactors) {
            if (factor.status !== "verified") {
              const { error: unenrollError } =
                await supabase.auth.mfa.unenroll({ factorId: factor.id });

              if (unenrollError) {
                await supabase.auth.signOut();
                setPassword("");
                setError("Could not restart authenticator setup.");
                return;
              }
            }
          }

          const { data: enrollment, error: enrollmentError } =
            await supabase.auth.mfa.enroll({
              factorType: "totp",
              friendlyName: "Jeannette Portfolio Admin",
            });

          if (enrollmentError || !enrollment?.id || !enrollment?.totp) {
            await supabase.auth.signOut();
            setPassword("");
            setError("Could not start authenticator setup.");
            return;
          }

          setMfaQrCode(enrollment.totp.qr_code || "");
          setMfaSecret(enrollment.totp.secret || "");
          setMfaFactorId(enrollment.id);
        } else {
          setMfaQrCode("");
          setMfaSecret("");
          setMfaFactorId(verifiedFactor.id);
        }

        setPassword("");
        setMfaCode("");
        setError("");
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

        {mfaFactorId && (
          <p className="admin-muted">
            {mfaQrCode
              ? "Scan this code once, then enter the 6-digit code from your authenticator app."
              : "Enter the 6-digit code from your authenticator app."}
          </p>
        )}

        {mfaQrCode && (
          <div className="admin-mfa-setup">
            <img src={mfaQrCode} alt="Authenticator setup QR code" />
            {mfaSecret && <code>{mfaSecret}</code>}
          </div>
        )}

        {!mfaFactorId && isLocked ? (
          <p className="error-text">
            Locked. Try again after {formatLockTime(remainingMs)}.
          </p>
        ) : !mfaFactorId ? (
          <p className="admin-muted">
            You have {triesLeft} login tries.
          </p>
        ) : null}

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
            disabled={loading || isLocked || Boolean(mfaFactorId)}
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
            disabled={loading || isLocked || Boolean(mfaFactorId)}
            required={!mfaFactorId}
          />
        </label>

        {mfaFactorId && (
          <label>
            Authenticator code
            <input
              value={mfaCode}
              onChange={(event) =>
                setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              disabled={loading}
              required
            />
          </label>
        )}

        {error && <p className="error-text">{error}</p>}

        <button disabled={loading || (!mfaFactorId && isLocked)}>
          {loading
            ? "Checking..."
            : mfaFactorId
              ? "Verify code"
              : isLocked
                ? "Locked"
                : "Login"}
        </button>
      </form>
    </main>
  );
}
