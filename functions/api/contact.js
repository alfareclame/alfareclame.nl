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

const cors = {
  "Access-Control-Allow-Origin": "https://alfareclame.nl",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}

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
  await env.RATELIMIT_KV.put(key, String(cur + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SEC,
  });
  return true;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPost({ request, env }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json(500, { ok: false, error: "server_misconfigured" });
  }

  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";

  if (!(await rateLimit(env, ip))) {
    return json(429, { ok: false, error: "rate_limited" });
  }

  let data;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json(413, { ok: false, error: "payload_too_large" });
    }
    const ct = request.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) {
      data = JSON.parse(raw);
    } else {
      const params = new URLSearchParams(raw);
      data = Object.fromEntries(params.entries());
    }
  } catch {
    return json(400, { ok: false, error: "invalid_body" });
  }

  if (data._hp) {
    return json(200, { ok: true });
  }

  const name = clamp(data.name, 120);
  const email = clamp(data.email, 200);
  const phone = clamp(data.phone, 40);
  const subject = clamp(data.subject, 200);
  const message = clamp(data.message, 4000);
  const sourceUrl = clamp(data.source_url || request.headers.get("Referer"), 300);

  if (!name || !message || (!email && !phone)) {
    return json(400, { ok: false, error: "missing_fields" });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json(400, { ok: false, error: "invalid_email" });
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
      return json(502, { ok: false, error: "telegram_failed", detail: out.description });
    }
  } catch {
    return json(502, { ok: false, error: "telegram_unreachable" });
  }

  return json(200, { ok: true });
}

export async function onRequest() {
  return json(405, { ok: false, error: "method_not_allowed" });
}
