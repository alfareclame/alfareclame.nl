/**
 * POST /api/contact
 * Receives contact form submission, validates, forwards to Telegram and
 * (optionally) sends a copy via Brevo transactional email to info@alfareclame.nl.
 *
 * Env vars (Cloudflare Pages dashboard):
 *   - TELEGRAM_BOT_TOKEN   (required)
 *   - TELEGRAM_CHAT_ID     (required)
 *   - BREVO_API_KEY        (optional — when set, also emails info@alfareclame.nl)
 *   - BREVO_TO_EMAIL       (optional — overrides info@alfareclame.nl as recipient)
 *   - BREVO_FROM_EMAIL     (optional — overrides noreply@alfareclame.nl as sender)
 *   - RATELIMIT_KV         (optional KV binding for per-IP rate limit)
 */

const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT_MAX = 15;
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

  if (!name || !message || !email || !phone) {
    return json(400, { ok: false, error: "missing_fields" }, origin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json(400, { ok: false, error: "invalid_email" }, origin);
  }
  // Phone validation: digits-only count must be >= 8 (handles +31 6 ..., 06-..., spaces, parens).
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 8 || phoneDigits.length > 18) {
    return json(400, { ok: false, error: "invalid_phone" }, origin);
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

  // Plain-text and HTML bodies for the email copy (no Telegram MarkdownV2 escapes).
  const plainLines = [
    "Nieuwe offerte-aanvraag via website",
    "",
    `Naam:      ${name}`,
    email ? `E-mail:    ${email}` : null,
    phone ? `Telefoon:  ${phone}` : null,
    subject ? `Onderwerp: ${subject}` : null,
    "",
    "Bericht:",
    message,
    "",
    `${ts} | ${country} | ${ip}`,
    sourceUrl ? `Bron: ${sourceUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const htmlEscape = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const htmlBody = `
<!doctype html>
<html lang="nl"><body style="font-family: -apple-system, Segoe UI, Inter, sans-serif; color:#1D1D1F; max-width:640px; margin:0 auto; padding:24px;">
  <h2 style="margin:0 0 16px 0;">Nieuwe offerte-aanvraag</h2>
  <table style="border-collapse:collapse; width:100%;">
    <tr><td style="padding:6px 12px 6px 0; color:#6E6E73; vertical-align:top; width:120px;">Naam</td><td style="padding:6px 0; font-weight:600;">${htmlEscape(name)}</td></tr>
    ${email ? `<tr><td style="padding:6px 12px 6px 0; color:#6E6E73; vertical-align:top;">E-mail</td><td style="padding:6px 0;"><a href="mailto:${htmlEscape(email)}">${htmlEscape(email)}</a></td></tr>` : ""}
    ${phone ? `<tr><td style="padding:6px 12px 6px 0; color:#6E6E73; vertical-align:top;">Telefoon</td><td style="padding:6px 0;"><a href="tel:${htmlEscape(phone)}">${htmlEscape(phone)}</a></td></tr>` : ""}
    ${subject ? `<tr><td style="padding:6px 12px 6px 0; color:#6E6E73; vertical-align:top;">Onderwerp</td><td style="padding:6px 0;">${htmlEscape(subject)}</td></tr>` : ""}
  </table>
  <h3 style="margin:24px 0 8px 0;">Bericht</h3>
  <div style="white-space:pre-wrap; background:#FAFAFA; border:1px solid rgba(0,0,0,0.06); border-radius:8px; padding:16px;">${htmlEscape(message)}</div>
  <p style="margin-top:24px; color:#86868B; font-size:13px;">
    ${htmlEscape(ts)} &middot; ${htmlEscape(country)} &middot; ${htmlEscape(ip)}<br>
    ${sourceUrl ? `Bron: <a href="${htmlEscape(sourceUrl)}">${htmlEscape(sourceUrl)}</a>` : ""}
  </p>
</body></html>`;

  async function sendTelegram() {
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
      throw new Error("telegram_failed");
    }
  }

  async function sendBrevoEmail() {
    if (!env.BREVO_API_KEY) return; // silent skip when not configured
    const to = env.BREVO_TO_EMAIL || "info@alfareclame.nl";
    const from = env.BREVO_FROM_EMAIL || "noreply@alfareclame.nl";
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Alfa Reclame Website", email: from },
        to: [{ email: to, name: "Marco" }],
        replyTo: email ? { email, name: name || "Website bezoeker" } : undefined,
        subject: `Offerte-aanvraag — ${name}${subject ? " · " + subject : ""}`,
        textContent: plainLines,
        htmlContent: htmlBody,
      }),
    });
    if (!res.ok) {
      // Don't fail the request — Telegram is primary, email is best-effort.
      // Brevo error body intentionally swallowed; spam logs aren't useful here.
      return;
    }
  }

  try {
    // Telegram is primary; Brevo is best-effort and runs in parallel.
    const [tgResult] = await Promise.allSettled([sendTelegram(), sendBrevoEmail()]);
    if (tgResult.status === "rejected") {
      const err = tgResult.reason?.message === "telegram_failed" ? "telegram_failed" : "telegram_unreachable";
      return json(502, { ok: false, error: err }, origin);
    }
  } catch {
    return json(502, { ok: false, error: "telegram_unreachable" }, origin);
  }

  return json(200, { ok: true }, origin);
}

export async function onRequest({ request }) {
  return json(405, { ok: false, error: "method_not_allowed" }, request.headers.get("Origin"));
}
