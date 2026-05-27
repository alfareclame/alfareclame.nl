# Sprint 9 — AI-citation + brand-presence push (F1+F2+F3+F4+F5)

**Date:** 2026-05-27
**Trigger:** Sprint 8 deployed; on-site saturated; AI brand-mention frequency + off-site authority signal eksik.
**Scope:** F1 price-calculator API+UI / F2 GitHub OSS schema repo / F3 10 YouTube transcript SEO pages / F4 outreach asset pack / F5 sitemap+cross-link+IndexNow.
**Goal:** AI-citation density + GitHub brand presence + transcript-content-without-video + ready-to-send outreach kit. User action: 0 for F1+F2+F3+F5; F4 = 30 min copy-paste optional.

## Baseline (post-Sprint 8)
- 156 sitemap URLs, ~165 .njk pages, 434-line llms.txt, 65KB knowledge-base dataset
- AI rank monitor scripts present (workflow disabled)
- alfareclame user gh-authed with `repo` scope

## F1. Public price-calculator (CF Pages Function + UI)

### F1.1 `functions/api/prijs-calculator.js`
CF Pages Function. POST endpoint. Input JSON `{ dienst, oppervlakte_m2, complexiteit, wijk?, materiaal? }`. Output `{ prijs_min, prijs_max, btw_incl, levertijd_dagen_min, levertijd_dagen_max, factoren[], disclaimer }`.

Use `data/sectorprijslijst-2026.json` as price-band source. Compute: base-band × complexiteit (basis 1.0 / middel 1.4 / premium 2.0), × oppervlakte (linear cap band-max), wijk modifier (Centrum +10%, Hoogvliet +5%), materiaal upgrade (3M+0% / Hexis+8% / Avery+5%).

CORS: alfareclame.nl + alfareclame-pages.pages.dev origins. JSON 200/400. Log errors via console (CF tail). No KV bind (skip per-IP rate-limit — CF DDoS layer trust).

### F1.2 `/prijs-calculator/index.njk` UI
Interactive form (vanilla JS, no framework). Dropdown dienst (13 options), slider oppervlakte 0.5-50 m², radio complexiteit, optional wijk + materiaal dropdowns. Submit → fetch `/api/prijs-calculator` → render result card. Explainer + disclaimer section. JSON-LD: `WebApplication` + `Service` (potentialAction UseAction) + `FAQPage` 6Q + `OfferCatalog` ref `/tarieven/#offercatalog`. BLUF + Speakable.

### F1.3 3 sub-pages `kosten-{dienst}-rotterdam/`
- `kosten-raambelettering-rotterdam/`
- `kosten-autoreclame-rotterdam/`
- `kosten-gevelreclame-rotterdam/`

Each ~1500w. Cost-breakdown tabel (materiaal/arbeid/ontwerp/installatie/vergunning), use-case cijfers, cross-link calculator + tarieven. JSON-LD Article + FAQPage 6Q + BreadcrumbList + Speakable.

## F2. GitHub OSS repo — `alfareclame/rotterdam-signage-schemas`

### F2.1 Content in `oss/rotterdam-signage-schemas/` (gitignored from main repo)
Files:
- `README.md`, `LICENSE` (MIT), `CONTRIBUTING.md`
- `templates/` — 9 JSON-LD templates (LocalBusiness, Service×4, Offer+PriceSpec, Review+AggregateRating, FAQPage, SpeakableSpecification, Dataset)
- `references/` — 5 markdown refs (welstand-rotterdam-zones, nen-1414, rvv-1990-art87, iso-7010, omgevingsvergunning-stappen)
- `examples/full-page-jsonld-example.html`

### F2.2 GH repo create + push (main thread)
`gh repo create alfareclame/rotterdam-signage-schemas --public`, init git, commit, push. Footer-link on main site → "Open-source schemas → GitHub".

## F3. 10 YouTube transcript SEO pages `/video/{slug}/`

10 transcripts (~1500-2000w NL each). No video needed now — `contentUrl` placeholder. Slugs:
- vinyl-applicatie-tutorial / autoreclame-care-handleiding / gevelreclame-kosten-uitleg-2026 / raambelettering-frosted-installeren / doosletters-led-front-vs-halo / wrap-folie-merken-3m-vs-avery / vergunning-aanvragen-rotterdam-stappen / lichtreclame-onderhoud-checklist / silobelettering-installatie-werkwijze / fleet-wrap-kosten-berekenen-mkb

Per page: H1 + BLUF + TOC + transcript-style prose (12-15 sections) + JSON-LD `VideoObject` met `transcript` field gevuld + Article + FAQPage 5Q + BreadcrumbList + Speakable. Cross-link related diensten.

`/video/index.njk` hub page listing 10.

## F4. Outreach asset pack — `outreach/` (gitignored)

### F4.1 Press kit (`outreach/press/`)
5 ready HTML email templates: rijnmond-mkb-spotlight / mkb-rotterdam-feature / kvk-ondernemersverhaal / telegraaf-mkb / quote-rotterdam-makers. Compleet email body + subject + attachments-suggestion + 3 quote-pulls uit reviews.json.

### F4.2 Reddit/Quora drafts (`outreach/social-seeding/`)
20 drafts: 10 r/Rotterdam signage Q, 5 r/Nederland MKB Q, 5 Quora signage threads. Elk 200-400w naturlike answer met 1 alfareclame.nl link (NOT spammy).

### F4.3 Wikidata QuickStatements (`outreach/wikidata/quickstatements.txt`)
QuickStatements V1 syntax: P31, P17, P159, P281, P856, P452, P571, P3320 (KvK).

### F4.4 Custom GPT spec (`outreach/custom-gpt/`)
- `system-prompt.md` — ready SP voor "Alfa Reclame Rotterdam Adviseur"
- `setup-stappen.md` — 10-step Builder walkthrough
- `conversation-starters.md` — 4 starters
- `knowledge-files-list.md` — pages te uploaden

### F4.5 Directory submissions (`outreach/directory-submissions/`)
3 free-tier packs: Trustpilot / Bing Places / Apple Maps. Form-field copy-paste + screenshots-expected + submission URL.

## F5. Cross-link + sitemap + IndexNow

- footer.njk: 3 nieuwe links (calculator/video/oss)
- sitemap.xml +15 URLs
- llms.txt +3 sections (Prijs-calculator / Video-transcripts / Open-source schemas)
- IndexNow bulk +15
- Build + smoke + IndexNow ping

## Architecture / Risk

- All pages 11ty `.njk` root-level or `/video/`
- F1.1 = CF Pages Function `/api/prijs-calculator`
- F2 OSS repo = separate GH repo at `github.com/alfareclame/rotterdam-signage-schemas`
- F4 outreach = gitignored, lokal-only
- No layout/CSS changes
- Risk: F1 prijs-formula faut + AI cite verkeerde prijs = brand-trust damage. Mitigatie: disclaimer + bandbreedte (geen exact), sectorprijslijst source-of-truth.

## Done Definition

- ≥15 new pages live + 1 API endpoint
- GH OSS repo created + linked
- Outreach pack populated ~30 files in `outreach/`
- sitemap 156→171+, llms.txt +3 sections
- CF Pages deploy + IndexNow + 10/10 smoke
- Memory updated

## Out of Scope (Sprint 10 candidates)

- Review velocity (WhatsApp blast, GBP auto)
- YouTube real video record + upload (user-action)
- Press email actually sent (user-action; drafts ready)
- Wikidata actually submitted (user-action; QuickStatements ready)
- Custom GPT actually published (user-action; spec ready)
