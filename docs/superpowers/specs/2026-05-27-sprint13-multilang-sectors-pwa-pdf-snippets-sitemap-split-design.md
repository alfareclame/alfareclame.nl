# Sprint 13 — multi-lang sectors + PWA + multi-lang PDF + featured snippets + sitemap split (J1+J2+J3+J4+J5)

**Date:** 2026-05-27
**Trigger:** Sprint 12 deployed. 5-lang wijk-grid komple. Next: depth on sector verticals (NL-only), PWA installability, multi-lang lead-magnet PDFs (4 langs), Position-Zero/snippet optimization, sitemap-per-language.
**Scope:** J1 multi-lang sectors / J2 PWA + service-worker / J3 multi-lang PDF / J4 featured snippets / J5 sitemap split
**User-aksiyonu:** 0. WhatsApp Business + paid services excluded.

## Baseline (post-Sprint 12)
- 205 sitemap URLs, ~215 .njk pages, 546-line llms.txt
- 5-lang site komple
- 8 NL sector pages (Sprint 8)
- 4 sitemap, HARO + sitemap-submit cron live, 1 NL lead-magnet PDF

## J1. Multi-lang sector verticals (10 pages)

### J1.1 TR sector pages (5, ~1300w each)
- `/tr/dis-hekimi-reklam/` — KNMT-equivalent privacy, AVG-folie
- `/tr/noter-burosu-reklam/` — KNB-art-22 discreet
- `/tr/avukatlik-burosu-reklam/` — NOvA-regel-28
- `/tr/kuafor-salonu-reklam/` — trendy vinyl + raamfolie + lichtbak
- `/tr/restoran-reklam/` — horeca + spandoek + HACCP

### J1.2 PL sector pages (5)
- `/pl/gabinet-stomatologiczny-reklama/`
- `/pl/kancelaria-notarialna-reklama/`
- `/pl/kancelaria-adwokacka-reklama/`
- `/pl/fryzjer-reklama/`
- `/pl/restauracja-reklama/`

Each: pageLang TR/PL, layout article.njk, hreflang full matrix, JSON-LD WebPage + Service (audience BusinessAudience + sector-specific) + LocalBusiness + BreadcrumbList + FAQPage 6Q + Speakable.

## J2. PWA + Service Worker

### J2.1 `service-worker.js` root
Precache shell (/, manifest.json, huisstijl.css, logo.webp). Runtime: HTML stale-while-revalidate 7d, images cache-first 30d, CSS/JS cache-first 30d, /api/* network-only. Skip external. CACHE_VERSION v1.

### J2.2 SW registration
Inline JS in `_includes/base.njk` end-of-body.

### J2.3 `manifest.json` extend
share_target API, shortcuts (calculator/contact/portfolio), display_override, categories.

### J2.4 Apple mobile web-app meta
head: apple-mobile-web-app-capable, status-bar-style, title, apple-touch-icon (skip if asset absent).

### J2.5 `_headers` SW
`/service-worker.js`: Service-Worker-Allowed: / + Cache-Control: no-cache.

## J3. Multi-lang lead-magnet PDF

### J3.1 Extend `scripts/generate-cheatsheet-pdf.js` (CommonJS)
`--lang nl|en|de|tr|pl` flag. Generate `data/cheatsheet-rotterdam-signage-2026-{lang}.pdf` per lang. Translate cover/ToC/headings per lang dictionary.

### J3.2 UI lang-select
`cheatsheet-signage-rotterdam-2026/index.njk`: `<select name="lang">` 5 options + navigator.language auto-detect. Form posts lang.

### J3.3 `functions/api/lead-magnet.js` extend
Accept lang field. Validate `[nl,en,de,tr,pl]`. Response download_url lang-specific.

### J3.4 NPM script
`cheatsheet:all` loops 5 langs.

## J4. Featured snippets / Position-Zero

### J4.1 Top 10 FAQ restructure
Pages: faq/, vraag-en-antwoord/ (if exists), 5 main dienst, tarieven, kennisbank, kies-uw-signage-partner.

Per FAQ Q&A: first sentence 40-60w direct-answer. `<dl><dt><dd>` for Q&A blocks. Tabular Q → `<table>`. Comparison Q → 2-col `<table>`.

### J4.2 Comparison pages semantic table
3m-vs-avery / cast-vs-calendered / etc. — verify `<table><thead><th>` not div-styled.

### J4.3 HowTo pages ordered-list
Verify visible step-content `<ol><li>` not div-styled.

## J5. Sitemap split per language

### J5.1 `scripts/generate-lang-sitemaps.mjs`
Read sitemap.xml, group by lang prefix (`/en/*` → EN, `/de/*` → DE, `/tr/*` → TR, `/pl/*` → PL, root → NL). Output 5 lang sitemaps. Build pre-step.

### J5.2 Update `sitemap-index.xml`
5 lang + video + image.

### J5.3 `.eleventy.js` passthrough
Add 5 lang sitemaps.

### J5.4 hreflang in sitemap
Optional xhtml:link per url (skip if complexity high).

## Architecture / Risk

- J2 SW bad cache = stale forever. skipWaiting() + version bump
- J3 PDF gen 4 langs ~2-3 min
- J4 preserve styling while adding semantic markup
- J5 verify total URL count preserved

## Done Definition

- 10 sector pages live (J1)
- SW + manifest extended (J2)
- 4 new PDFs + lang-select UI (J3)
- 10 FAQ snippet-optimized (J4)
- 5 lang sitemaps + index updated (J5)
- Sitemap 205→215+
- Smoke 10/10
- IndexNow + memory

## Out of Scope (Sprint 14)

- WhatsApp Business
- A/B persistent CF D1
- Image CDN
- Newsletter Brevo
- Custom GPT publish
- Real review-velocity automation
- Full content translation per lang
