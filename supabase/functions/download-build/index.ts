const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_DOMAINS = [
  "cartelpr.com",
  "sharks.agency",
  "gray.com.pk",
  "jbnjaws.com",
  "jahanz.com",
];

const PLATFORM_PATHS: Record<string, string> = {
  mac: "latest/mac/NEO_universal.dmg",
  windows: "latest/windows/NEO_x64-setup.exe",
  windowsMsi: "latest/windows/NEO_x64_en-US.msi",
  android: "latest/android/NEO_debug.apk",
};

const BUCKET = "neo-builds";
const SIGNED_TTL_SECONDS = 120;
const BUILD_LABEL = "8.2";
const VERSION = "0.1.0";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function emailDomain(email: string): string {
  const at = email.toLowerCase().lastIndexOf("@");
  return at >= 0 ? email.toLowerCase().slice(at + 1) : "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ ok: false, error: "POST required." }, 405);

  const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const auth = request.headers.get("Authorization") ?? "";

  if (!supabaseUrl || !anon || !service || !auth.toLowerCase().startsWith("bearer ")) {
    return json({ ok: false, error: "Sign in with Google to download NEO." }, 401);
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: anon },
  });
  if (!userResponse.ok) {
    return json({ ok: false, error: "Sign in again. That session was rejected." }, 401);
  }

  const user = (await userResponse.json()) as {
    email?: string;
    email_confirmed_at?: string | null;
  };
  const email = (user.email ?? "").toLowerCase();
  if (!email || !user.email_confirmed_at) {
    return json({ ok: false, error: "Google did not confirm this email." }, 401);
  }

  const domain = emailDomain(email);
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return json({ ok: false, error: "Company accounts only." }, 403);
  }

  let body: { platform?: string } = {};
  try {
    body = (await request.json()) as { platform?: string };
  } catch {
    body = {};
  }

  const platform = (body.platform ?? "").toLowerCase();
  const objectPath = PLATFORM_PATHS[platform];
  if (!objectPath) {
    return json({ ok: false, error: "Choose mac, windows, windowsMsi, or android." }, 400);
  }

  const signUrl = `${supabaseUrl}/storage/v1/object/sign/${BUCKET}/${objectPath}`;
  const signResponse = await fetch(signUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${service}`,
      apikey: service,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: SIGNED_TTL_SECONDS }),
  });

  if (!signResponse.ok) {
    const detail = await signResponse.text();
    console.error("sign failed", signResponse.status, detail.slice(0, 200));
    return json({ ok: false, error: "The build file is not available yet." }, 503);
  }

  const signed = (await signResponse.json()) as { signedURL?: string; signedUrl?: string };
  const path = signed.signedURL || signed.signedUrl;
  if (!path) return json({ ok: false, error: "Could not create a download link." }, 503);

  const url = path.startsWith("http") ? path : `${supabaseUrl}/storage/v1${path}`;
  return json({
    ok: true,
    platform,
    url,
    expiresIn: SIGNED_TTL_SECONDS,
    file: objectPath.split("/").pop(),
    build: BUILD_LABEL,
    version: VERSION,
  });
});
