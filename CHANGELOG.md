# Changelog

Alle noemenswaardige wijzigingen aan deze website worden hier gedocumenteerd.

Het format volgt [Keep a Changelog](https://keepachangelog.com/nl/1.1.0/), en deze website volgt [Semantic Versioning](https://semver.org/lang/nl/).

---

## [Unreleased]

### Added
- (voeg hier toe wat in de volgende release komt)

### Changed

### Fixed


---

## [1.0.0] — 2026-04-20

Eerste productie-release van alfareclame.nl.

### Added

**Site-structuur**
- Hero sectie met "Signage & Digital Partner" positionering
- 22 content-secties inclusief Signage, Digital & AI, Industrieel & Havengebied
- Interactieve prijscalculator (4-staps)
- Portfolio carousel met 15 echte projecten + 14 extra foto's
- Rich footer met 4 kolommen (contact, diensten, werkgebied, bedrijfsinfo)

**Content**
- Raambelettering service (vanaf €149)
- Autoreclame / carwrap service (vanaf €175)
- Gevelreclame service (vanaf €89)
- Digital & AI sectie: webontwikkeling, AI, automatisering, maatwerk-software
- Industrieel & Havengebied sectie met 30m hoogte emphasis
- Materialen overzicht: 3M, Avery Dennison, Hexis, Orafol
- 12 veelgestelde vragen (FAQ schema)
- 18 werkgebied neighborhoods + regio
- 8-staps werkwijze sectie

**SEO & Schema**
- Uitgebreide `sitemap.xml` met image sitemap (29 portfolio images)
- Gedetailleerde `robots.txt` (28+ bots expliciet allowed)
- `llms.txt` voor AI-crawlers (GPTBot, ClaudeBot, Perplexity, etc.)
- `manifest.json` (PWA)
- `humans.txt` voor transparantie
- `.well-known/security.txt` (RFC 9116)
- 87 Schema.org @type entries: Organization, Person, WebSite, LocalBusiness, ProfessionalService, 7x Service, BreadcrumbList, FAQPage, AggregateRating
- Complete Open Graph + Twitter Card meta
- Hreflang (nl-NL + x-default)
- Geo meta tags (Rotterdam: 51.9244, 4.4777)

**Performance & security**
- `_headers` met HSTS (2 jaar, preload), X-Frame-Options, Permissions-Policy
- Cache-Control per bestandstype
- Logo preload via Link header
- Font-display: swap
- DNS prefetch voor externe resources
- Preconnect naar fonts.googleapis.com

**Infrastructure / CI/CD**
- Cloudflare Pages deployment via GitHub integratie
- 6 GitHub Actions quality gates (Lighthouse, HTML, SEO, images, links, deploy readiness)
- Lighthouse CI budgets: SEO ≥95, a11y ≥90, best practices ≥90, performance ≥80
- Dependabot voor automatische workflow updates (weekly)
- Issue templates (bug, feature)
- PR template met checklist
- Branch strategy: main / staging / feature-* / hotfix-*

### Security
- HSTS 63072000 (2 jaar) + preload
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera, microphone, geolocation allemaal geblokkeerd
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Resource-Policy: same-site

---

## Versie-richtlijnen

**Major** (1.x.x → 2.0.0): Breaking changes — URL-structuur, ingrijpende redesigns, domeinmigratie.

**Minor** (1.0.x → 1.1.0): Nieuwe secties, services, features zonder bestaande te breken.

**Patch** (1.0.0 → 1.0.1): Bugfixes, tekstwijzigingen, portfolio updates, kleine UI tweaks.

Release tags in GitHub volgen `vX.Y.Z` format (bv. `v1.0.0`).
