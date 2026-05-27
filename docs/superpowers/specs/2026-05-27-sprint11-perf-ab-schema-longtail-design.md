# Sprint 11 — Performance + A/B + schema cascade + multi-lang long-tail + internal-link graph (H1+H2+H3+H7+H9)

**Date:** 2026-05-27
**Trigger:** Sprint 10 deployed. 5-lang site + multi-sitemap + lead-magnet live. Next: long-tail multi-lang (TR/PL × wijk), CWV push, A/B conversion, schema cascade (Event/Course/HowTo), internal-link semantic-graph.
**Scope:** H1 wijk×lang TR/PL / H2 performance / H3 A/B framework / H7 schema cascade / H9 internal-link graph
**User-aksiyonu:** 0 voor alle 5 tracks.

## Baseline (post-Sprint 10)
- 185 sitemap URLs, ~195 .njk pages, 476-line llms.txt
- 4 sitemaps (main+index+video+image)
- 5-lang (NL/EN/DE/TR/PL hubs + 5 dienst each)
- 2 API endpoints (prijs-calculator, lead-magnet)
- 12-page PDF lead-magnet live

## H1. Wijk×lang long-tail (10 nieuwe pagina's)

### H1.1 Turkish wijk×dienst (5, each ~700w)
- `/tr/cam-yazisi-rotterdam-centrum/` — Coolsingel/Markthal, welstand-zone-1 strict
- `/tr/cam-yazisi-rotterdam-noord/` — Blijdorp/Provenierswijk
- `/tr/arac-reklami-rotterdam-zuid/` — Charlois/Tarwewijk/Maashaven
- `/tr/cephe-reklami-rotterdam-kralingen/` — villas-conservatief
- `/tr/isikli-tabela-rotterdam-prins-alexander/` — Alexandrium/Brainpark

### H1.2 Polish wijk×dienst (5, each ~700w)
- `/pl/reklama-okienna-rotterdam-centrum/`
- `/pl/reklama-samochodowa-rotterdam-noord/`
- `/pl/reklama-elewacyjna-rotterdam-zuid/`
- `/pl/podswietlenie-rotterdam-kralingen/`
- `/pl/litery-3d-rotterdam-prins-alexander/`

Each: BLUF prijs+levertijd+garantie + wijk-spesifik, 3 unique facts (geo/sector/materiaal/welstand), micro-FAQ 3Q, link naar parent dienst-page TR/PL + Rotterdam pillar, JSON-LD WebPage+Service(areaServed wijk)+LocalBusiness-parent+BreadcrumbList+FAQPage+Speakable.

## H2. Performance push (CWV)

### H2.1 AVIF + WebP dual og-images
`scripts/generate-avif-images.js` — convert top 30 hero/og images to AVIF. Dual `<picture>` AVIF→WebP→JPG fallback. Apply 10 high-traffic pages first.

### H2.2 LCP preload per page
`_includes/head.njk` extend: `<link rel="preload" as="image" fetchpriority="high" href="{{ heroImage }}" type="image/avif">`. Per-page `heroImage` front-matter var (default = og_image).

### H2.3 Critical CSS extraction
Inline above-fold CSS for homepage + dienst-template in head.njk. Below-fold async via `media=print + onload=this.media=all` pattern.

### H2.4 Resource hints audit
`_includes/head.njk` preconnect: wa.me, telegram.org, maps.google.com, github.com. dns-prefetch audit fonts.googleapis if used. Remove unused.

### H2.5 Header verify
`_headers` Brotli/gzip + `Vary: Accept-Encoding` presence.

### H2.6 Image lazy-load audit
Spot-check main pages: `loading="lazy"` below-fold, `loading="eager" fetchpriority="high"` LCP image, width/height attrs (CLS).

## H3. A/B test framework (CF Workers split-test)

### H3.1 Cookie-based 50/50 split
`functions/_middleware.js` extend (existing 410-cleanup middleware) — homepage GET, check `ab_variant` cookie, if absent random A|B 50/50 + 30-day cookie, pass `x-ab-variant` header. Skip /api/* /admin/* /data/* + bot User-Agents.

### H3.2 Homepage hero CTA variant
`index.njk`: 2 hero CTA variant HTML, inline JS reads cookie → display:none inactive variant. Pre-render both avoid layout shift.
- A: "Vraag offerte aan" → /offerte/
- B: "Bereken zelf je prijs" → /prijs-calculator/

### H3.3 Click tracking
`functions/api/track-click.js` — POST `{event,variant,page,ts}` → append `data/ab-test-results.jsonl`. Frontend: on CTA click `navigator.sendBeacon('/api/track-click', JSON)`.

### H3.4 Report template
`examples/ab-test-report-template.md` — weekly diff template. Impressions/variant, CTR, conversion delta.

## H7. Schema cascade (Event/Course/HowTo)

### H7.1 Event schema on portfolio
`portfolio/index.njk` — for each portfolio.json item render `Event` JSON-LD: name, startDate (datum field or "2024-01-01" fallback), location Rotterdam, organizer @id #business, eventStatus EventScheduled, eventAttendanceMode OfflineEventAttendanceMode.

### H7.2 Course schema on kennisbank
`kennisbank-rotterdam-signage/index.njk` — add Course + CourseInstance: name "Signage Rotterdam Kennisbank", provider @id #business, learningResourceType DataDocument, educationalLevel professional.

### H7.3 HowTo schema cascade
10 blog + 10 video transcript pages: HowTo JSON-LD (name, description, totalTime, supply[], tool[], step[] with HowToStep name+text+url anchor). Where logical (tutorial-style); skip explainer-only.

## H9. Internal-link graph (semantic similarity)

### H9.1 `scripts/internal-link-builder.js`
Pure Node, no extra deps. Glob all .njk root+subdirs (exclude _includes/_site/node_modules). Extract slug, title, description, pageLang. TF-IDF over title+description+H1 per language. Cosine similarity all-pairs same pageLang. Top-5 per page. Output `_data/relatedPages.json`.

### H9.2 `_includes/related-pages.njk` partial
Reads `relatedPages` data, current-page lookup top-5, render `<aside class="related-pages">` with `<h2>Gerelateerde pagina's</h2>` + 5 link items. NL/EN/DE/TR/PL aware (pageLang heading translation).

### H9.3 Inject into article.njk
Add `{% include "related-pages.njk" %}` near end of article body (before FAQ). Conditional: only if 3+ related.

### H9.4 Build-time
npm script `"build:related": "node scripts/internal-link-builder.js"`. Add to `"build"` pre-step. GH Actions run before 11ty build.

## Architecture / Risk

- H1 same 11ty `.njk` pattern as existing TR/PL
- H2.1 AVIF gen requires `sharp` dep — script falls back if absent
- H2.3 critical CSS risk FOUC — start conservative
- H3 bot User-Agent skip mandatory (Googlebot must NOT see variant flicker)
- H3 cookie consent — functional cookie classification OK without consent gate
- H7.1 use `EventScheduled` + past startDate (custom EventCompleted is non-standard)
- H9 O(n²) cosine; ~200 pages → 40K comparisons, fast <5s

## Done Definition

- 10 new pages (H1) + 30 AVIF (H2) + middleware extend + tracking API + results JSONL (H3) + schema cascade 20+ pages (H7) + `_data/relatedPages.json` + partial (H9)
- Build clean, JSON-LD valid
- Sitemap 185→195+
- IndexNow + live smoke
- Memory updated

## Out of Scope (Sprint 12)

- WhatsApp Business API (Meta approval)
- HARO/HARP press-quote automation
- Newsletter Brevo integration
- Custom GPT publish (user-action)
- 50+ wijk×lang matrix expansion
- Image CDN migration (CF Images / Bunny)
