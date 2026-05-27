// functions/api/push-send.js — Sprint 14 K3.3
// CF Pages Function — POST /api/push-send (admin-only)
//
// MVP placeholder: no subscription store is implemented yet.
// Sprint 15 will integrate CF KV or D1 for subscriber persistence,
// at which point this function will iterate subscriptions and call
// the Web Push protocol (RFC 8291) using VAPID (RFC 8292).
//
// Authentication: X-Admin-Token header must match env ADMIN_TOKEN.
// Body: { title: string, body: string, url?: string }

export async function onRequestPost({ request, env }) {
  const headers = { 'Content-Type': 'application/json' };

  // Auth check
  const adminToken = env?.ADMIN_TOKEN;
  if (adminToken) {
    const provided = request.headers.get('X-Admin-Token') || '';
    if (provided !== adminToken) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401, headers,
      });
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400, headers,
    });
  }

  const { title, body: msgBody, url } = body || {};

  if (typeof title !== 'string' || !title.trim()) {
    return new Response(
      JSON.stringify({ ok: false, error: 'title is required' }),
      { status: 400, headers }
    );
  }

  if (typeof msgBody !== 'string' || !msgBody.trim()) {
    return new Response(
      JSON.stringify({ ok: false, error: 'body is required' }),
      { status: 400, headers }
    );
  }

  // MVP response -- no subscriptions stored yet
  return new Response(
    JSON.stringify({
      ok: true,
      sent_to: 0,
      note: 'Subscription store not implemented; MVP only -- Sprint 15 will integrate CF KV/D1',
      payload: { title, body: msgBody, url: url || '/' },
    }),
    { status: 200, headers }
  );
}
