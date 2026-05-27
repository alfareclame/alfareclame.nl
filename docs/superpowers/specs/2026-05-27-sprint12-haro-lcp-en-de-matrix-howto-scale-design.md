# Sprint 12 — HARO engine + LCP fix + EN/DE wijk matrix + HowTo scale + sitemap-submit (I1+I2+I3+I4+I5)

**Date:** 2026-05-27
**Trigger:** Sprint 11 deployed. A/B framework live, schema cascade started, semantic-graph internal-link. Next: HARO press-quote automation, LCP fix deferred 4 pages, EN+DE × wijk matrix komple, HowTo cascade scale 20+ pages, sitemap submission automation.
**Scope:** I1 HARO engine / I2 LCP fix / I3 EN+DE × wijk matrix / I4 HowTo cascade scale / I5 sitemap-submit automation
**User-aksiyonu:** 0 voor alle 5 tracks. **WhatsApp Business expliciet out-of-scope per user.**

## Baseline (post-Sprint 11)
- 195 sitemap URLs, ~205 .njk pages, 514-line llms.txt
- A/B framework live (`x-ab-variant` header verified)
- 4 sitemaps (main+index+video+image)
- 5-lang (NL/EN/DE/TR/PL); wijk×lang TR+PL complete, EN+DE wijk-grid ontbreekt
- 9 HowTo entities deployed (Sprint 11)

## I1. HARO/HARP press-quote engine

### I1.1 `scripts/haro-monitor.js`
Pure Node. RSS poll: HARO/Qwoted/PressJunkie/SourceBottle feeds. Filter signage/reclame/Rotterdam/marketing regex. Generate draft NL answer from kennisbank.json + sectorprijslijst.json.

Output: `data/haro-queue.jsonl` (tracked, append-only). Each record: `{id, query_title, query_description, source_url, source, pubDate, draft_answer, status: "pending"}`.

### I1.2 GH Actions cron daily
`.github/workflows/haro-monitor.yml` — schedule `0 8 * * *` (08:00 UTC). Run script, commit updated queue.

### I1.3 Export script + docs
`scripts/haro-export.js {id}` — exports queued draft to `outreach/haro-drafts/{date}-{slug}.md`. `outreach/haro-engine-setup.md` instructions.

## I2. LCP `fetchpriority="high"` fix (4 pages)

Surgical attribute add:
1. `raambelettering-rotterdam/index.njk` — first gallery img
2. `autoreclame-rotterdam/index.njk` — first hero img
3. `portfolio/index.njk` — first img grid `loading="eager" fetchpriority="high"`
4. `over-ons/index.njk` — first hero img

No CSS/layout change.

## I3. EN+DE × wijk matrix (10 pages)

### I3.1 EN (5, ~700w each)
- `/en/window-graphics-rotterdam-centrum/`
- `/en/window-graphics-rotterdam-noord/`
- `/en/vehicle-wraps-rotterdam-zuid/`
- `/en/facade-signage-rotterdam-kralingen/`
- `/en/illuminated-signs-rotterdam-prins-alexander/`

### I3.2 DE (5, ~700w each)
- `/de/fensterbeschriftung-rotterdam-centrum/`
- `/de/fensterbeschriftung-rotterdam-noord/`
- `/de/fahrzeugbeschriftung-rotterdam-zuid/`
- `/de/fassadenwerbung-rotterdam-kralingen/`
- `/de/leuchtreklame-rotterdam-prins-alexander/`

Same micro-landing pattern as Sprint 11 H1.

## I4. HowTo schema cascade scale (20+ pages)

22 candidates listed. Each: HowTo @id `{page-url}#howto`, real step-content (read page first to extract), 4-6 HowToSteps. Skip if no clear procedural content.

Candidates: tarieven, materialen, werkwijze (extend), prijs-calculator, cheatsheet, kosten-raambelettering, kosten-autoreclame, kosten-gevelreclame, kies-uw-signage-partner, blog/levensduur-autobelettering, blog/rgb-vs-cmyk, blog/lichtreclame-kosten-2026, blog/spandoeken-prijzen, blog/duurzaam-vinyl, blog/carwrap-degradatie, blog/lichtbak-energie-besparing, blog/autoreclame-tco, blog/led-vs-neon-lichtbak, video/doosletters-led-front-vs-halo, video/wrap-folie-merken, video/fleet-wrap-kosten-berekenen.

## I5. Sitemap submission automation

### I5.1 `scripts/sitemap-submit.js`
Pure Node. Diff current vs `data/sitemap-history.jsonl` (URLs only, not lastmod). Submit deltas to Bing/Yandex IndexNow. Google Indexing API skip (needs service account).

### I5.2 GH Actions post-deploy
`.github/workflows/sitemap-submit.yml` — push to main + workflow_dispatch. Sleep 90s + run + commit history.

### I5.3 package.json
`"submit-sitemap": "node scripts/sitemap-submit.js"`

## Architecture / Risk

- I1 HARO feeds may paywall — script handles 403/401 gracefully
- I3 reuse Sprint 11 H1 micro-landing pattern
- I4 step-extraction must reflect REAL content; skip pages without clear steps
- I5 Google Indexing API needs service account; defer

## Done Definition

- HARO engine + cron workflow + queue file
- 4 LCP fixes
- 10 EN/DE × wijk pages
- 20+ HowTo entities
- sitemap-submit script + workflow
- Sitemap 195 → 205+
- llms.txt updated
- IndexNow + smoke
- Memory updated

## Out of Scope (Sprint 13)

- WhatsApp Business (user-excluded)
- A/B persistent storage (user-binding)
- Newsletter Brevo (creds)
- Custom GPT publish (user-action)
- HARO actual sending (user-action via drafts)
- Image CDN migration
