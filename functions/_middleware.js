/**
 * Cloudflare Pages middleware — true 410 Gone for dead legacy URLs.
 *
 * Old WordPress AI/digital blog posts and taxonomy URLs used to 301-redirect
 * cross-domain to aanloopai.nl. Cross-domain 301s leak crawl signals and the
 * URLs kept reappearing in Search Console. A 410 Gone tells Google the content
 * is permanently removed, so it drops the URL from the index for good.
 *
 * `_redirects` cannot emit a 410 (only 200/301/302/303/307/308), so this
 * middleware handles it. Only the paths listed in `_routes.json` invoke
 * Functions at all — every other request stays a pure static asset.
 *
 * Group B (genuinely relocated AI content: /ai/*, /prompt-engineering-nederland,
 * /article-*-preview.html) is intentionally NOT here — it still 301s to
 * aanloopai.nl via _redirects, because that content really moved there.
 */

// Dead root-level legacy slugs (normalised: lowercase, no trailing slash).
const GONE_EXACT = new Set([
  '/navigeren-door-de-uitdagingen-van-digitale-transformatie',
  '/grote-kortingsactie-30-korting-op-webdesign-en-digitale-marketing',
  '/mastering-user-experience',
  '/content-marketing-strategies-that-work-in-2024',
  '/verhoog-je-marketing-roi-met-slimme-data-gedreven-strategieen',
  '/maximaliseer-je-roi-met-data-gedreven-marketingcampagnes',
  '/how-to-use-ar-and-vr-in-digital-marketing',
  '/ar-en-vr-integratie',
  '/overcoming-digital-transformation-challenges',
  '/maximizing-roi-with-data-driven-marketing-campaigns',
  '/emerging-trends-in-web-design-2025',
]);

// Dead legacy taxonomy prefixes (WordPress remnants).
const GONE_PREFIXES = [
  '/category/',
  '/project/',
  '/portfolio_category/',
  '/index.php/',
  '/author/',
];

const HTML_410 = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <title>Pagina niet meer beschikbaar — Alfa Reclame Rotterdam</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;
      min-height:100vh;display:flex;align-items:center;justify-content:center;
      background:#0f1115;color:#f4f4f5;text-align:center;padding:2rem}
    .box{max-width:34rem}
    h1{font-size:1.6rem;margin:0 0 .75rem}
    p{color:#a1a1aa;line-height:1.6;margin:0 0 1.5rem}
    a{display:inline-block;background:#f4f4f5;color:#0f1115;text-decoration:none;
      padding:.7rem 1.4rem;border-radius:.5rem;font-weight:600}
  </style>
</head>
<body>
  <div class="box">
    <h1>Deze pagina is permanent verwijderd</h1>
    <p>De content die u zoekt is niet meer beschikbaar. Bekijk ons actuele
       aanbod reclame en belettering in Rotterdam op de homepage.</p>
    <a href="/">Naar de homepage</a>
  </div>
</body>
</html>`;

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);
  const normalised = pathname.replace(/\/+$/, '').toLowerCase() || '/';

  const isGone =
    GONE_EXACT.has(normalised) ||
    GONE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isGone) {
    return new Response(HTML_410, {
      status: 410,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-robots-tag': 'noindex',
        'cache-control': 'public, max-age=3600',
      },
    });
  }

  // Not a dead URL — fall through to the next function / static asset.
  return context.next();
}
