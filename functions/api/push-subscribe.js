// functions/api/push-subscribe.js — Sprint 14 K3.2
// CF Pages Function — POST /api/push-subscribe
//
// Accepts a Web Push subscription object and sends a Telegram alert
// (MVP: no subscription store — Sprint 15 will integrate CF KV/D1).
//
// Expected body: { endpoint: string, keys: { p256dh: string, auth: string } }

const ALLOWED_ORIGINS = [
  'https://alfareclame.nl',
  'https://alfareclame-pages.pages.dev',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const headers = { 'Content-Type': 'application/json', ...corsHeaders(origin) };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400, headers,
    });
  }

  const { endpoint, keys } = body || {};

  if (
    typeof endpoint !== 'string' || !endpoint.startsWith('https://') ||
    typeof keys?.p256dh !== 'string' || !keys.p256dh ||
    typeof keys?.auth !== 'string' || !keys.auth
  ) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing or invalid subscription fields' }),
      { status: 400, headers }
    );
  }

  // Telegram alert (fire-and-forget; failure is non-fatal)
  const telegramToken = env?.TELEGRAM_BOT_TOKEN;
  const telegramChat = env?.TELEGRAM_CHAT_ID;
  if (telegramToken && telegramChat) {
    const short = endpoint.slice(-40);
    const msg = `[Alfa Reclame] Nieuwe push-subscriber\n...${short}\nts: ${new Date().toISOString()}`;
    fetch(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChat, text: msg }),
      }
    ).catch(() => {});
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
