/**
 * POST /api/eleven-call
 * Receives ElevenLabs ConvAI post-call webhook, verifies HMAC, forwards summary to Telegram.
 *
 * Env vars (Cloudflare Pages dashboard):
 *   - TELEGRAM_BOT_TOKEN          (required)
 *   - TELEGRAM_CHAT_ID            (required)
 *   - ELEVENLABS_WEBHOOK_SECRET   (required) — shared secret from ElevenLabs dashboard
 *
 * Header format (ElevenLabs / Svix-style):
 *   elevenlabs-signature: t=<unix_ts>,v0=<hex_hmac_sha256(`${ts}.${rawBody}`, secret)>
 *
 * Webhook event types handled:
 *   - post_call_transcription  → full transcript + analysis → Telegram summary
 *   - post_call_audio          → audio-only (ignored, ack 200)
 *   - call_initiation          → telephony attempt log (ignored, ack 200)
 */

const TIMESTAMP_TOLERANCE_SEC = 1800;

function hexToBytes(hex) {
  if (!hex || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const b = parseInt(hex.substr(i * 2, 2), 16);
    if (Number.isNaN(b)) return null;
    out[i] = b;
  }
  return out;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(sig));
}

function parseSigHeader(header) {
  if (!header) return null;
  const parts = {};
  for (const seg of header.split(",")) {
    const idx = seg.indexOf("=");
    if (idx < 0) continue;
    parts[seg.slice(0, idx).trim()] = seg.slice(idx + 1).trim();
  }
  if (!parts.t || !parts.v0) return null;
  return { ts: parseInt(parts.t, 10), v0: parts.v0 };
}

async function verifySignature(rawBody, header, secret) {
  const parsed = parseSigHeader(header);
  if (!parsed || Number.isNaN(parsed.ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.ts) > TIMESTAMP_TOLERANCE_SEC) return false;
  const expectedHex = await hmacSha256Hex(secret, `${parsed.ts}.${rawBody}`);
  const a = hexToBytes(expectedHex);
  const b = hexToBytes(parsed.v0);
  return timingSafeEqual(a, b);
}

function escapeMd(text) {
  if (text == null) return "";
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (m) => "\\" + m);
}

function clamp(s, max) {
  if (!s) return "";
  const t = String(s);
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function fmtDuration(secs) {
  if (!secs || Number.isNaN(secs)) return "?";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}m ${s}s`;
}

function buildTelegramMessage(payload) {
  const data = payload.data || {};
  const meta = data.metadata || {};
  const analysis = data.analysis || {};
  const transcript = Array.isArray(data.transcript) ? data.transcript : [];

  const title = clamp(analysis.call_summary_title || "Onbekend onderwerp", 200);
  const summary = clamp(analysis.transcript_summary || "(geen samenvatting)", 2000);
  const duration = fmtDuration(meta.call_duration_secs);
  const startTs = meta.start_time_unix_secs
    ? new Date(meta.start_time_unix_secs * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC"
    : "?";
  const cost = meta.cost != null ? `$${Number(meta.cost).toFixed(3)}` : "?";
  const status = clamp(data.status || "?", 40);
  const convId = clamp(data.conversation_id || "?", 80);

  const userTurns = transcript.filter((t) => t.role === "user").length;
  const agentTurns = transcript.filter((t) => t.role === "agent").length;

  const collected = analysis.data_collection_results || {};
  const collectedKeys = Object.keys(collected).slice(0, 8);
  const collectedLines = collectedKeys
    .map((k) => {
      const v = collected[k];
      const val =
        v && typeof v === "object" ? clamp(v.value ?? JSON.stringify(v), 200) : clamp(v, 200);
      return `• ${escapeMd(k)}: ${escapeMd(val)}`;
    })
    .join("\n");

  const lastUserMsg = [...transcript].reverse().find((t) => t.role === "user");
  const lastUserText = lastUserMsg ? clamp(lastUserMsg.message, 300) : "";

  return [
    "*📞 Nieuw gesprek \\(ElevenLabs Marco\\)*",
    "",
    `*Onderwerp:* ${escapeMd(title)}`,
    `*Duur:* ${escapeMd(duration)}  \\|  *Beurten:* ${userTurns}/${agentTurns}  \\|  *Kosten:* ${escapeMd(cost)}`,
    `*Status:* ${escapeMd(status)}  \\|  ${escapeMd(startTs)}`,
    "",
    "*Samenvatting:*",
    escapeMd(summary),
    collectedLines ? "\n*Verzamelde data:*\n" + collectedLines : "",
    lastUserText ? `\n*Laatste vraag bezoeker:*\n_${escapeMd(lastUserText)}_` : "",
    "",
    `_conv: ${escapeMd(convId)}_`,
  ]
    .filter(Boolean)
    .join("\n");
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID || !env.ELEVENLABS_WEBHOOK_SECRET) {
    return json(500, { ok: false, error: "server_misconfigured" });
  }

  const rawBody = await request.text();
  const sigHeader =
    request.headers.get("elevenlabs-signature") || request.headers.get("ElevenLabs-Signature");

  const verified = await verifySignature(rawBody, sigHeader, env.ELEVENLABS_WEBHOOK_SECRET);
  if (!verified) {
    return json(401, { ok: false, error: "invalid_signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const type = payload.type || "unknown";

  if (type !== "post_call_transcription") {
    return json(200, { ok: true, ignored: type });
  }

  const text = buildTelegramMessage(payload);

  try {
    const tg = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
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
