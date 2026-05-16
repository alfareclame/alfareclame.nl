/**
 * POST /api/contact
 * Receives contact form submission, validates, forwards to Telegram.
 *
 * Env vars (Cloudflare Pages dashboard):
 *   - TELEGRAM_BOT_TOKEN  (required)
 *   - TELEGRAM_CHAT_ID    (required)
 *   - RATELIMIT_KV        (optional KV binding for per-IP rate limit)
 */

const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SEC = 600;

// Multi-origin CORS: apex + www + Pages preview deploys.
const ALLOWED_ORIGINS = [
  "https://alfareclame.nl",
  "https://www.alfareclame.nl",
];
const PREVIEW_ORIGIN_RE = /^https:\/\/[a-z0-9-]+\.alfareclame-(pages|nl)\.pages\.dev$/i;

function corsHeaders(origin) {
  const ok = origin && (ALLOWED_ORIGINS.includes(origin) || PREVIEW_ORIGIN_RE.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin : "https://alfareclame.nl",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) },
  });
}

// MarkdownV2 escape — backslash MUST escape these chars per Telegram spec.
// Regex-with-callback (NOT a loop): each match prepended with a literal `\\`.
function escapeMd(text) {
  if (text == null) return "";
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (m) => "\\" + m);
}

function clamp(s, max) {
  if (!s) return "";
  const t = String(s).trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

async function rateLimit(env, ip) {
  if (!env.RATELIMIT_KV) return true;
  const key = `cf:contact:${ip}`;
  const cur = parseInt((await env.RATELIMIT_KV.get(key)) || "0", 10);
  if (cur >= RATE_LIMIT_MAX) return false;
  // TTL set only on first write so the window does not slide forward
  // every time a slow spammer pings the endpoint.
  const putOpts = cur === 0 ? { expirationTtl: RATE_LIMIT_WINDOW_SEC } : undefined;
  await env.RATELIMIT_KV.put(key, String(cur + 1), putOpts);
  return true;
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("Origin")) });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json(500, { ok: false, error: "server_misconfigured" }, origin);
  }

  // CF Pages always sets CF-Connecting-IP. Refuse if absent — X-Forwarded-For
  // is client-controlled and would enable per-IP rate-limit bypass.
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) {
    return json(400, { ok: false, error: "client_ip_missing" }, origin);
  }

  if (!(await rateLimit(env, ip))) {
    return json(429, { ok: false, error: "rate_limited" }, origin);
  }

  // Pre-check Content-Length to avoid buffering oversized bodies.
  const declaredLen = parseInt(request.headers.get("Content-Length") || "0", 10);
  if (declaredLen && declaredLen > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: "payload_too_large" }, origin);
  }

  let data;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json(413, { ok: false, error: "payload_too_large" }, origin);
    }
    const ct = request.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) {
      data = JSON.parse(raw);
    } else {
      const params = new URLSearchParams(raw);
      data = Object.fromEntries(params.entries());
    }
  } catch {
    return json(400, { ok: false, error: "invalid_body" }, origin);
  }

  if (data._hp) {
    return json(200, { ok: true }, origin);
  }

  const name = clamp(data.name, 120);
  const email = clamp(data.email, 200);
  const phone = clamp(data.phone, 40);
  const subject = clamp(data.subject, 200);
  const message = clamp(data.message, 4000);
  const sourceUrl = clamp(data.source_url || request.headers.get("Referer"), 300);

  if (!name || !message || (!email && !phone)) {
    return json(400, { ok: false, error: "missing_fields" }, origin);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json(400, { ok: false, error: "invalid_email" }, origin);
  }

  const country = request.headers.get("CF-IPCountry") || "??";
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const lines = [
    "*🔔 Nieuwe contact\\-aanvraag*",
    "",
    `*Naam:* ${escapeMd(name)}`,
    email ? `*E\\-mail:* ${escapeMd(email)}` : null,
    phone ? `*Telefoon:* ${escapeMd(phone)}` : null,
    subject ? `*Onderwerp:* ${escapeMd(subject)}` : null,
    "",
    "*Bericht:*",
    escapeMd(message),
    "",
    `_${escapeMd(ts)} \\| ${escapeMd(country)} \\| ${escapeMd(ip)}_`,
    sourceUrl ? `_${escapeMd(sourceUrl)}_` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const tg = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: lines,
          parse_mode: "MarkdownV2",
          disable_web_page_preview: true,
        }),
      },
    );
    const out = await tg.json();
    if (!out.ok) {
      return json(502, { ok: false, error: "telegram_failed" }, origin);
    }
  } catch {
    return json(502, { ok: false, error: "telegram_unreachable" }, origin);
  }

  return json(200, { ok: true }, origin);
}

export async function onRequest({ request }) {
  return json(405, { ok: false, error: "method_not_allowed" }, request.headers.get("Origin"));
}
