/**
 * POST /api/lead-magnet
 * Receives cheatsheet lead-magnet form submission.
 * Validates email + consent + honeypot, forwards Telegram alert,
 * returns download URL for the PDF.
 *
 * Env vars (Cloudflare Pages dashboard):
 *   - TELEGRAM_BOT_TOKEN   (required — same as contact.js)
 *   - TELEGRAM_CHAT_ID     (required — same as contact.js)
 *
 * Rate-limit: in-memory Map, best-effort within Worker lifetime.
 * 1 request per 2 minutes per SHA-256(email) hash.
 */

const MAX_BODY_BYTES = 4 * 1024;
const RATE_LIMIT_MS  = 2 * 60 * 1000; // 2 minutes
const DOWNLOAD_URL   = '/data/cheatsheet-rotterdam-signage-2026.pdf';
const EMAIL_RE       = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
const VALID_LANGS    = ['nl', 'en', 'de', 'tr', 'pl'];

// In-memory rate-limit store (keyed by email-hash, value = last-request timestamp).
// Resets on Worker restart; good enough for spam deterrence.
const rateLimitStore = new Map();

// Multi-origin CORS: mirror contact.js conventions.
const ALLOWED_ORIGINS = [
  'https://alfareclame.nl',
  'https://www.alfareclame.nl',
];
const PREVIEW_ORIGIN_RE = /^https:\/\/[a-z0-9-]+\.alfareclame-(pages|nl)\.pages\.dev$/i;

function corsHeaders(origin) {
  const ok = origin && (ALLOWED_ORIGINS.includes(origin) || PREVIEW_ORIGIN_RE.test(origin));
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://alfareclame.nl',
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

// MarkdownV2 escape — mirror contact.js.
function escapeMd(text) {
  if (text == null) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (m) => '\\' + m);
}

function clamp(s, max) {
  if (!s) return '';
  const t = String(s).trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}

// Simple non-cryptographic fingerprint to avoid storing raw emails in memory.
async function hashEmail(email) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(email.toLowerCase()));
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
  }
  // Fallback djb2 (no subtle crypto — edge case on very old Workers)
  let h = 5381;
  for (let i = 0; i < email.length; i++) h = ((h << 5) + h) ^ email.charCodeAt(i);
  return String(h >>> 0);
}

// Prune entries older than 2× the window to keep Map size bounded.
function pruneRateLimitStore() {
  const now = Date.now();
  for (const [key, ts] of rateLimitStore.entries()) {
    if (now - ts > RATE_LIMIT_MS * 2) rateLimitStore.delete(key);
  }
}

async function checkRateLimit(emailHash) {
  pruneRateLimitStore();
  const last = rateLimitStore.get(emailHash);
  if (last && Date.now() - last < RATE_LIMIT_MS) return false;
  rateLimitStore.set(emailHash, Date.now());
  return true;
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('Origin')),
  });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin');

  // Require Telegram credentials.
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json(500, { ok: false, error: 'server_misconfigured' }, origin);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // Pre-check Content-Length to avoid buffering oversized bodies.
  const declaredLen = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (declaredLen && declaredLen > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: 'payload_too_large' }, origin);
  }

  // Parse body — support both JSON and form-encoded (form method="post" fallback).
  let data;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json(413, { ok: false, error: 'payload_too_large' }, origin);
    }
    const ct = request.headers.get('Content-Type') || '';
    if (ct.includes('application/json')) {
      data = JSON.parse(raw);
    } else {
      const params = new URLSearchParams(raw);
      data = Object.fromEntries(params.entries());
    }
  } catch {
    return json(400, { ok: false, error: 'invalid_body' }, origin);
  }

  // Honeypot check: bots fill hidden `website` field. Silently succeed.
  const honeypot = String(data.website || '').trim();
  if (honeypot) {
    return json(200, {
      ok: true,
      download_url: DOWNLOAD_URL,
      message: 'Bedankt! Klik op de download-link hieronder.',
    }, origin);
  }

  // Validate email.
  const email = clamp(data.email, 254);
  if (!email || !EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: 'invalid_email' }, origin);
  }

  // Validate consent — must be boolean true or string "true" / "on" / "1".
  const consentRaw = data.consent;
  const consentOk = consentRaw === true
    || consentRaw === 'true'
    || consentRaw === 'on'
    || consentRaw === '1';
  if (!consentOk) {
    return json(400, { ok: false, error: 'missing_consent' }, origin);
  }

  // Validate lang — default nl if absent; 400 if present but invalid.
  const langRaw = data.lang != null ? String(data.lang).trim().toLowerCase() : null;
  let lang = 'nl';
  if (langRaw !== null && langRaw !== '') {
    if (!VALID_LANGS.includes(langRaw)) {
      return json(400, { ok: false, error: 'invalid_lang' }, origin);
    }
    lang = langRaw;
  }

  // Rate-limit by email hash.
  const emailHash = await hashEmail(email);
  const allowed = await checkRateLimit(emailHash);
  if (!allowed) {
    return json(429, { ok: false, error: 'rate_limited' }, origin);
  }

  // Build Telegram message.
  const ua = clamp(request.headers.get('User-Agent'), 80);
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const country = request.headers.get('CF-IPCountry') || '??';

  const lines = [
    '*📥 Cheatsheet download aangevraagd*',
    '',
    `*E\\-mail:* ${escapeMd(email)}`,
    `*IP:* ${escapeMd(ip)}`,
    `*Land:* ${escapeMd(country)}`,
    `*Lang:* ${escapeMd(lang)}`,
    `*UA:* ${escapeMd(ua)}`,
    `_${escapeMd(ts)}_`,
  ].join('\n');

  // Send to Telegram — non-fatal if it fails (user still gets download).
  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: lines,
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true,
        }),
      }
    );
    const tgOut = await tgRes.json();
    if (!tgOut.ok) {
      console.error('[lead-magnet] Telegram error:', JSON.stringify(tgOut));
    }
  } catch (err) {
    console.error('[lead-magnet] Telegram unreachable:', err && err.message);
  }

  const downloadUrl = `/data/cheatsheet-rotterdam-signage-2026-${lang}.pdf`;

  return json(200, {
    ok: true,
    download_url: downloadUrl,
    message: 'Bedankt! Klik op de download-link hieronder.',
  }, origin);
}

// Catch-all for non-POST / non-OPTIONS methods.
export async function onRequest({ request }) {
  return json(405, { ok: false, error: 'method_not_allowed' }, request.headers.get('Origin'));
}
