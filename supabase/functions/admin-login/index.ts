import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_EMAIL_LENGTH = 320;
const MAX_PASSWORD_LENGTH = 1024;

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const adminEmail = (
  Deno.env.get("ADMIN_EMAIL") || "jeannettekhoury012@gmail.com"
).toLowerCase();

const LOCK_EMAIL_KEY = "__admin_login__";

type LoginReservation = {
  allowed: boolean;
  failed_count: number;
  tries_left: number;
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
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  };
}

function isAllowedBrowserOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || allowedOrigins.includes(origin);
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

async function reserveLoginAttempt(ipHash: string): Promise<LoginReservation> {
  const { data, error } = await db.rpc("reserve_admin_login_attempt", {
    p_ip_hash: ipHash,
  });

  if (error) throw error;

  const reservation = Array.isArray(data) ? data[0] : data;

  if (!reservation || typeof reservation.allowed !== "boolean") {
    throw new Error("Login limiter returned an invalid response.");
  }

  return reservation as LoginReservation;
}

async function clearAttempt(ipHash: string) {
  const { error } = await db
    .from("admin_login_locks")
    .delete()
    .eq("email", LOCK_EMAIL_KEY)
    .eq("ip_hash", ipHash);

  if (error) throw error;
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
    if (!isAllowedBrowserOrigin(request)) {
      return json(request, { error: "Origin not allowed." }, 403);
    }

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Admin login is missing required Supabase secrets.");
      return json(request, { error: "Login service unavailable." }, 503);
    }

    const requestBody = await request.text();
    if (new TextEncoder().encode(requestBody).byteLength > MAX_REQUEST_BYTES) {
      return json(request, { error: "Request is too large." }, 413);
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = JSON.parse(requestBody);
    } catch {
      return json(request, { error: "Invalid JSON request." }, 400);
    }

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (
      !email ||
      !password ||
      email.length > MAX_EMAIL_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      return json(request, { error: "Email and password are required." }, 400);
    }

    const ip = getClientIp(request);
    const ipHash = await sha256(ip);

    // The database function serializes reservations for this IP hash. Reserving
    // before password verification makes parallel requests consume distinct
    // attempts instead of overwriting one another after authentication.
    const reservation = await reserveLoginAttempt(ipHash);

    if (!reservation.allowed) {
      const lockedUntilTime = reservation.locked_until
        ? new Date(reservation.locked_until).getTime()
        : Date.now();

      return json(
        request,
        {
          error: "Too many wrong login attempts. Please wait 2 hours.",
          locked: true,
          lockedUntil: reservation.locked_until,
          remainingMs: Math.max(0, lockedUntilTime - Date.now()),
          triesLeft: 0,
        },
        429
      );
    }

    if (email !== adminEmail) {
      return json(
        request,
        {
          error: reservation.locked_until
            ? "Too many wrong login attempts. Please wait 2 hours."
            : "Wrong admin email or password.",
          locked: Boolean(reservation.locked_until),
          lockedUntil: reservation.locked_until,
          triesLeft: reservation.tries_left,
        },
        reservation.locked_until ? 429 : 401
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
      return json(
        request,
        {
          error: reservation.locked_until
            ? "Too many wrong login attempts. Please wait 2 hours."
            : "Wrong admin email or password.",
          locked: Boolean(reservation.locked_until),
          lockedUntil: reservation.locked_until,
          triesLeft: reservation.tries_left,
        },
        reservation.locked_until ? 429 : 401
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
    console.error("Admin login failed internally:", error);
    return json(request, { error: "Login service unavailable." }, 503);
  }
});
