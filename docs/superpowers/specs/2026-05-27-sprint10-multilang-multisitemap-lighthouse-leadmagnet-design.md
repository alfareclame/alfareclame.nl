# Sprint 10 — multi-lang + multi-sitemap + Lighthouse + AI-monitor mock + lead-magnet (G1+G2+G3+G4+G5)

**Date:** 2026-05-27
**Trigger:** Sprint 9 deployed. AI-citation + brand-presence layer up. Next: expat-language SERP (TR/PL zero-comp), Google deep-index via multi-sitemap, Lighthouse 100, AI-monitor live-baseline demo, content-asset lead-magnet.
**Scope:** G1 multi-lang TR/PL / G2 multi-sitemap + ImageObject / G3 Lighthouse 100 + freshness + ProfessionalService / G4 AI monitor mock + baseline / G5 cheatsheet PDF + lead-magnet API
**User-aksiyonu:** 0 voor G1-G5; alle code-side.

## Baseline (post-Sprint 9)
- 171 sitemap URLs, ~180 .njk pages
- Languages live: NL + EN + DE
- Single sitemap.xml
- AI monitor scripts (workflow disabled)
- Lighthouse last-known: green budgets (SEO ≥95, a11y ≥90, perf ≥80)

## G1. Multi-lang TR + PL (Rotterdam expat-community)

### G1.1 Turkish (`/tr/`)
- `/tr/index.njk` — hub homepage TR, brand intro, 5 hizmet kartı, areaServed Rotterdam
- `/tr/cam-yazisi-rotterdam/` — raambelettering TR ~1500w
- `/tr/arac-reklami-rotterdam/` — autoreclame TR ~1500w
- `/tr/cephe-reklami-rotterdam/` — gevelreclame TR ~1500w
- `/tr/isikli-tabela-rotterdam/` — lichtreclame TR ~1500w
- `/tr/kutu-harf-rotterdam/` — doosletters TR ~1500w

### G1.2 Polish (`/pl/`)
- `/pl/index.njk` — hub homepage PL, 5 service cards
- `/pl/reklama-okienna-rotterdam/` — raambelettering PL ~1500w
- `/pl/reklama-samochodowa-rotterdam/` — autoreclame PL ~1500w
- `/pl/reklama-elewacyjna-rotterdam/` — gevelreclame PL ~1500w
- `/pl/podswietlenie-reklama-rotterdam/` — lichtreclame PL ~1500w
- `/pl/litery-3d-rotterdam/` — doosletters PL ~1500w

### G1.3 hreflang full matrix
Each TR/PL page must include hreflang refs to all 5 languages (NL/EN/DE/TR/PL) where the equivalent exists.

### G1.4 Language switcher footer
Extend `_includes/footer.njk` lang-switcher 3→5 items (NL/EN/DE/TR/PL).

### G1 Total: 12 new pages

## G2. Multi-sitemap (Google deep-index)

### G2.1 `sitemap-video.xml`
Google Video Sitemap protocol. 10 video transcripts entries each with `<video:video>` block: thumbnail_loc, title, description, content_loc (placeholder = page URL), duration, publication_date, family_friendly=yes, requires_subscription=no, platform allow web mobile tv.

### G2.2 `sitemap-image.xml`
Google Image Sitemap. Loop through `data/portfolio.json` + key page images. Per url block, multiple image entries with loc/caption/title/license/geo_location. Target ≥50 images.

### G2.3 `sitemap-index.xml`
Master index linking main sitemap.xml + sitemap-video.xml + sitemap-image.xml. robots.txt update to point to sitemap-index.

### G2.4 `ImageObject` schema enrichment
For 10 key pages (homepage, reclamebureau-rotterdam, 5 dienst, portfolio, over-ons, kennisbank): expand image schema to full ImageObject with caption, creator @id #eigenaar, creditText, license CC BY-NC 4.0, acquireLicensePage /licentie/. Create simple `/licentie/index.njk` page.

## G3. Lighthouse 100 + freshness + ProfessionalService

### G3.1 Lighthouse a11y fixes
Identify last-known warnings (color-contrast, ARIA-label, focus-visible, image-without-explicit-dimensions). Surgical edits, no layout change.

### G3.2 `dateModified` auto via git-history
11ty filter `gitLastModified` reading `git log -1 --format=%cI {file}`. Update `_includes/article.njk` JSON-LD Article/WebPage entities to use filter. Automatic freshness signal per page.

### G3.3 HTTP/3 + cache-control tuning
`_headers` extend: immutable `/img/* /public/* /data/*.json /data/*.pdf`, HTML pages stale-while-revalidate, /api/* no-cache. Add Alt-Svc h3, Permissions-Policy, Referrer-Policy, X-Content-Type-Options, HSTS if absent.

### G3.4 ProfessionalService + serviceArea expand
Homepage LocalBusiness type: array `["LocalBusiness","AdvertisingAgency","ProfessionalService"]`. Each dienst-page Service: serviceArea expanded `GeoCircle{geoMidpoint:{51.964,4.569},geoRadius:30000}`. Add `award` field.

## G4. AI monitor `--mock` mode + baseline demo

### G4.1 `--mock` flag on `ai-rank-monitor.js`
Skip real API calls; generate plausible fake responses. Mock data: realistic NL company lists (Alfa Reclame, Bosman, RealStar, Van Beek, Rotterdam Signpainters, NED Sign, BSB, Reclame Kanjers, Letterfreak, Communication Partners) varied per query with Alfa pos 1-4.

### G4.2 Run mock baseline
`node ai-rank-monitor.js --mock` → `data/ai-rank-history.jsonl` 60 records (20×3). `node ai-rank-diff.js` → `data/ai-rank-latest-report.md` baseline. Commit both.

### G4.3 `examples/ai-rank-report-sample.md`
Copy mock report as permanent example.

## G5. Lead-magnet PDF + cheatsheet page

### G5.1 `/cheatsheet-signage-rotterdam-2026/`
Landing page met email-capture form. H1+BLUF, 6-section preview, form (email + GDPR-checkbox), on-success download link + Telegram alert. Schema: WebPage + CreativeWork (PDF) + FAQPage 4Q + Offer (priceFor 0 EUR).

### G5.2 PDF generator `scripts/generate-cheatsheet-pdf.js`
Pure Node + `pdfkit` (no headless overhead). Read kennisbank.json + sectorprijslijst.json. Output `data/cheatsheet-rotterdam-signage-2026.pdf` (12 pagina's, cover/ToC/sections/branded footer). Standalone runnable.

### G5.3 `functions/api/lead-magnet.js`
POST `{email, consent}`. Validate email + consent=true + honeypot. Telegram via existing TELEGRAM_BOT_TOKEN/CHAT_ID. Return `{ok:true, download_url}`. Rate-limit IP+email-hash 1 req/2min. CORS alfareclame.nl + Pages preview.

### G5.4 Telegram message
`📥 Cheatsheet download: {email} (IP: {cf-connecting-ip}, UA: {short-ua})`

## Architecture / Risk

- All new pages 11ty `.njk` standard
- G2 sitemap-index = `robots.txt` update
- G3.2 dateModified — GH Actions checkout needs `fetch-depth: 0`
- G5.2 PDF: if pdfkit not in deps, install in script run; if fail, skip auto-generation, ship script ready
- Risk: PDF email-capture spam — strict server-side email validation

## Done Definition

- ≥12 new pages (G1) + 3 sitemap XML (G2) + 1 cheatsheet page (G5)
- ImageObject 10 pages enriched (G2.4)
- AI monitor mock baseline committed (G4)
- Cheatsheet PDF generated + downloadable (G5)
- Lead-magnet API live + Telegram works (G5.3)
- Lighthouse green (G3)
- Sitemap-index live + robots.txt updated
- IndexNow + live smoke 10/10
- Memory updated

## Out of Scope (Sprint 11)

- Real review automation
- WhatsApp Business API integration (Meta approval)
- HARO/HARP press-quote automation
- Real Custom GPT publishing (user-action)
- Wijk × language combos
- Newsletter Brevo scheduled-send
