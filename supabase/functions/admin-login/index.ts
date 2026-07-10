import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 2 * 60 * 60 * 1000;

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const adminEmail = (
  Deno.env.get("ADMIN_EMAIL") || "jeannettekhoury012@gmail.com"
).toLowerCase();

const LOCK_EMAIL_KEY = "__admin_login__";

type LoginAttempt = {
  email: string;
  ip_hash: string;
  failed_count: number;
  locked_until: string | null;
};

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const allowedOrigins = [
  "https://jeannettekhouryportfolio.com",
  "https://www.jeannettekhouryportfolio.com",
  "https://haidarwalidmsheik.github.io",
  "http://localhost:5173",
  "http://localhost:5174",
];

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";

  const allowedOrigin = allowedOrigins.includes(origin)
    ? origin
    : "https://jeannettekhouryportfolio.com";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(request),
  });
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const cfIp = request.headers.get("cf-connecting-ip");
  const realIp = request.headers.get("x-real-ip");

  return (
    cfIp ||
    realIp ||
    forwardedFor?.split(",")[0]?.trim() ||
    "unknown-ip"
  );
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getAttempt(ipHash: string): Promise<LoginAttempt | null> {
  const { data, error } = await db
    .from("admin_login_locks")
    .select("email, ip_hash, failed_count, locked_until")
    .eq("email", LOCK_EMAIL_KEY)
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (error) throw error;

  return data as LoginAttempt | null;
}

async function clearAttempt(ipHash: string) {
  const { error } = await db
    .from("admin_login_locks")
    .delete()
    .eq("email", LOCK_EMAIL_KEY)
    .eq("ip_hash", ipHash);

  if (error) throw error;
}

async function registerFailedAttempt(
  ipHash: string,
  currentAttempt: LoginAttempt | null
) {
  const nextFailedCount = Number(currentAttempt?.failed_count || 0) + 1;
  const now = new Date();

  const lockedUntil =
    nextFailedCount >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCK_TIME_MS).toISOString()
      : null;

  const row = {
    email: LOCK_EMAIL_KEY,
    ip_hash: ipHash,
    failed_count: nextFailedCount,
    locked_until: lockedUntil,
    last_failed_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const { error } = await db
    .from("admin_login_locks")
    .upsert(row, {
      onConflict: "email,ip_hash",
    });

  if (error) throw error;

  return {
    failedCount: nextFailedCount,
    triesLeft: Math.max(0, MAX_FAILED_ATTEMPTS - nextFailedCount),
    locked: Boolean(lockedUntil),
    lockedUntil,
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders(request),
    });
  }

  if (request.method !== "POST") {
    return json(request, { error: "Method not allowed." }, 405);
  }

  try {
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return json(
        request,
        {
          error: "Server login function is missing Supabase secrets.",
        },
        500
      );
    }

    const body = await request.json().catch(() => null);

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return json(request, { error: "Email and password are required." }, 400);
    }

    const ip = getClientIp(request);
    const ipHash = await sha256(ip);

    let attempt = await getAttempt(ipHash);

    if (attempt?.locked_until) {
      const lockedUntilTime = new Date(attempt.locked_until).getTime();

      if (lockedUntilTime > Date.now()) {
        return json(
          request,
          {
            error: "Too many wrong login attempts. Please wait 2 hours.",
            locked: true,
            lockedUntil: attempt.locked_until,
            remainingMs: lockedUntilTime - Date.now(),
          },
          429
        );
      }

      await clearAttempt(ipHash);
      attempt = null;
    }

    if (email !== adminEmail) {
      const failed = await registerFailedAttempt(ipHash, attempt);

      return json(
        request,
        {
          error: failed.locked
            ? "Too many wrong login attempts. Please wait 2 hours."
            : "Wrong admin email or password.",
          locked: failed.locked,
          lockedUntil: failed.lockedUntil,
          triesLeft: failed.triesLeft,
        },
        failed.locked ? 429 : 401
      );
    }

    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const authData = await authResponse.json().catch(() => null);

    if (
      !authResponse.ok ||
      !authData?.access_token ||
      !authData?.refresh_token
    ) {
      const failed = await registerFailedAttempt(ipHash, attempt);

      return json(
        request,
        {
          error: failed.locked
            ? "Too many wrong login attempts. Please wait 2 hours."
            : "Wrong admin email or password.",
          locked: failed.locked,
          lockedUntil: failed.lockedUntil,
          triesLeft: failed.triesLeft,
        },
        failed.locked ? 429 : 401
      );
    }

    await clearAttempt(ipHash);

    return json(request, {
      success: true,
      session: {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error.";

    return json(
      request,
      {
        error: message,
      },
      500
    );
  }
});