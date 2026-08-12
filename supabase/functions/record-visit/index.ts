import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_REQUEST_BYTES = 2048;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PUBLIC_PATH =
  /^\/(?:guest|projects|collaborate|category\/[a-z0-9-]{1,80}|project\/[0-9a-f-]{1,80})?$/i;

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const allowedOrigins = [
  "https://jeannettekhouryportfolio.com",
  "https://www.jeannettekhouryportfolio.com",
  "https://haidarwalidmsheik.github.io",
  "http://localhost:5173",
  "http://localhost:5174",
];

function responseHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : "https://jeannettekhouryportfolio.com",
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(request),
  });
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    forwardedFor?.split(",")[0]?.trim() ||
    "unknown-ip"
  );
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function readLimitedBody(request: Request, maxBytes: number) {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return null;
    }

    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(body);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: responseHeaders(request) });
  }

  if (request.method !== "POST") {
    return json(request, { error: "Method not allowed." }, 405);
  }

  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return json(request, { error: "Origin not allowed." }, 403);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Visit recorder is missing Supabase secrets.");
    return json(request, { error: "Visit service unavailable." }, 503);
  }

  try {
    const rawBody = await readLimitedBody(request, MAX_REQUEST_BYTES);
    if (rawBody === null) {
      return json(request, { error: "Request is too large." }, 413);
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json(request, { error: "Invalid JSON request." }, 400);
    }

    const visitorId = String(body?.visitorId || "").trim();
    const path = String(body?.path || "").trim();

    if (!UUID_V4.test(visitorId) || !PUBLIC_PATH.test(path)) {
      return json(request, { error: "Invalid visit data." }, 400);
    }

    const ipHash = await sha256(getClientIp(request));
    const { data: accepted, error } = await db.rpc("record_website_visit", {
      p_ip_hash: ipHash,
      p_visitor_id: visitorId,
      p_path: path,
    });

    if (error) throw error;

    if (accepted !== true) {
      return json(request, { recorded: false }, 429);
    }

    return json(request, { recorded: true }, 201);
  } catch (error) {
    console.error("Visit recording failed internally:", error);
    return json(request, { error: "Visit service unavailable." }, 503);
  }
});
