/**
 * CF Pages Function: POST /api/track-click
 *
 * Receives A/B click beacon events from the frontend (navigator.sendBeacon).
 * Because CF Pages Functions cannot write to static deployed assets at runtime,
 * events are logged to the CF Worker console (visible via `wrangler tail`).
 * Persistent storage (CF KV / D1) is out of scope for Sprint 11.
 *
 * Beacon response: 204 No Content (beacon ignores body/status).
 * CORS: open (*) for sendBeacon cross-origin.
 */

const ALLOWED_EVENTS = new Set([
  'hero_cta_click',
  'lead_magnet_click',
  'offerte_click',
  'calculator_click',
]);

const ALLOWED_VARIANTS = new Set(['A', 'B']);

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

export async function onRequestPost(context) {
  const corsHeaders = {
    'access-control-allow-origin': '*',
  };

  let payload;
  try {
    const text = await context.request.text();
    payload = JSON.parse(text);
  } catch {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const { event, variant, page, ts } = payload || {};

  // Validate fields — drop silently on invalid input
  if (
    typeof event !== 'string' ||
    !ALLOWED_EVENTS.has(event) ||
    typeof variant !== 'string' ||
    !ALLOWED_VARIANTS.has(variant) ||
    typeof page !== 'string' ||
    page.length > 512
  ) {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const record = {
    event,
    variant,
    page: page.slice(0, 512),
    ts: typeof ts === 'number' ? ts : Date.now(),
    logged_at: new Date().toISOString(),
    cf_country: (context.request.cf && context.request.cf.country) || null,
  };

  // Structured log — captured by `wrangler tail` or CF Logpush
  console.log(JSON.stringify({ type: 'ab_click', ...record }));

  return new Response(null, { status: 204, headers: corsHeaders });
}
