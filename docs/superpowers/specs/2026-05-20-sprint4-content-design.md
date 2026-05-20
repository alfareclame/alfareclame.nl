# Sprint 4 — Nieuwe contentpagina's (design spec)

**Datum:** 2026-05-20
**Branch:** `feat/sprint-4-content`
**Status:** Goedgekeurd — klaar voor implementatieplan
**Plan-context:** `C:\Users\dogan\.claude\plans\tarayicida-goster-sparkling-shamir.md` (Sprint 4)

## Doel

Drie nieuwe indexeerbare pagina's + verdieping van `/materialen/`, gericht op
nieuwe zoekwoorden zonder kannibalisatie van bestaande pagina's. Onderdeel van
het 5-sprint "#1 in Rotterdam"-traject.

## Scope

### Wel in scope
1. `/havenreclame-rotterdam/` — haven/port-signage hub (blue-ocean)
2. `/horecabelettering-rotterdam/` — sectorlanding horeca
3. `/retailreclame-rotterdam/` — sectorlanding retail
4. `/materialen/` — verdieping (vinylmerken-tabel + wijksecties)

### Bewust NIET in scope (kannibalisatierisico)
- `/carwrap-rotterdam/` — gedekt door bestaande `/fleet-wrap-rotterdam/` + `/autoreclame-rotterdam/`
- `/transport-wagenpark-rotterdam/` — `/fleet-wrap-rotterdam/` dekt al "B2B wagenpark 5-25+ voertuigen"
- `raambelettering` wijksecties — al uitgevoerd (commit `0bf2e37`)

## Bestaande pagina's (geen wijziging, alleen inbound links toevoegen)

`/`, `/reclamebureau-rotterdam/`, `/raambelettering-rotterdam/`, `/autoreclame-rotterdam/`,
`/gevelreclame-rotterdam/`, `/lichtreclame-rotterdam/`, `/doosletters-rotterdam/`,
`/fleet-wrap-rotterdam/`, `/bestickering-rotterdam/`, `/silobelettering/`, `/offshore-belettering/`

## Sjabloon (alle 3 nieuwe pagina's)

Volgt het bestaande service-landing-sjabloon 1-op-1 (referentie: `fleet-wrap-rotterdam/index.njk`).

- **Layout:** `base.njk` (krijgt automatisch `wa-float` + scroll-reveal).
- **Bestand:** `<folder>/index.njk` met front-matter datamodel:
  `layout, title, description, keywords, canonical, og_*, twitter_*, color_scheme,
  geo_position, geo_icbm, article_published_time/modified_time/author/section,
  navActiveUrl ("/diensten/"), breadcrumbs[], hasFaqAccordion: true, pageStylesLabel, pageStyles`
- **Lengte:** 1800-2500 NL woorden.
- **JSON-LD:** `Service` + `FAQPage` + `BreadcrumbList` (inline, raw string via `jsonld | safe`).
- **Componenten:** hero, intro-prose, dienst-secties, `pricing-grid` met 3 `pricing-card`
  (een `--featured`), `usp-list` met 8 Rotterdamse zones/wijken, FAQ-accordion,
  related-cards naar bestaande servicepagina's, inline-CTA.
- **pageStyles:** per-page `<style>`-blok hergebruikt uit bestaande servicepagina's
  (`pricing-grid`, `pricing-card`, `usp-list`, `callout` etc.) — geen nieuwe CSS-architectuur.
- **a11y/SEO:** Lighthouse-budgets behouden (SEO >=95, a11y >=90, perf >=80); semantische
  koppen, `aria-labelledby` per sectie, afbeeldingen met width/height + WebP `<picture>`.

## Pagina-specificaties

### 1. `/havenreclame-rotterdam/`
- **Primair zoekwoord:** "havenreclame Rotterdam", "scheepsbelettering Rotterdam"
- **Rol:** hub die haven-niche bundelt; diepe interne links naar `/silobelettering/` en `/offshore-belettering/`
- **Dienst-secties:** scheepsbelettering, containerbelettering, kade/terminal-signage,
  veiligheidssignalering, silo (link), offshore (link)
- **FAQ:** 12 Q&A (vergunning haven, maritieme vinyl/duurzaamheid, ATEX/veiligheid, doorlooptijd, etc.)
- **Prijspakketten:** 3 tiers per projectomvang (klein / midden / groot havenproject)
- **8 haven-zones usp-list:** Maasvlakte, Botlek, Europoort, Waalhaven, Eemhaven,
  Vondelingenplaat, Pernis, Merwe-Vierhavens

### 2. `/horecabelettering-rotterdam/`
- **Primair zoekwoord:** "horecabelettering Rotterdam", "raambelettering horeca Rotterdam"
- **Rol:** sectorlanding horeca (restaurant/cafe/bar)
- **Dienst-secties:** raambelettering, menuborden, gevelreclame/uithangbord, lichtbak, terrasschotten
- **FAQ:** 11 Q&A (openingstijden-stickers, terrasvergunning, schoonmaakbestendige folie, etc.)
- **Prijspakketten:** 3 tiers (starter / compleet / premium horeca-pakket)
- **8 Rotterdamse wijken usp-list**

### 3. `/retailreclame-rotterdam/`
- **Primair zoekwoord:** "retailreclame Rotterdam", "winkelbelettering Rotterdam"
- **Rol:** sectorlanding retail/winkel
- **Dienst-secties:** etalagebelettering, gevelreclame, lichtreclame, winkelbestickering,
  openingstijden/sale-stickers
- **FAQ:** 11 Q&A (etalage seizoenswissels, RVO/winkelpui-regels, herpositioneerbare folie, etc.)
- **Prijspakketten:** 3 tiers
- **8 Rotterdamse wijken usp-list**

### 4. `/materialen/` verdieping (bestaande pagina bewerken)
- **Vinylmerken-vergelijkingstabel:** 3M vs Avery vs Hexis vs Orafol — kolommen:
  type (cast/calendered), duurzaamheid (jaren), toepassing, prijsklasse
- **Autoreclame-wijksecties:** 8 Rotterdamse wijken met welstand-/toepassingsprofielen
  (zelfde patroon als `gevelreclame`/`raambelettering` wijksecties)
- Bestaande visuele opzet behouden; alleen content + tabel + wijksectie toevoegen

## Sitewide wijzigingen

- `sitemap.xml`: +3 URL's (totaal 13 hub-URL's), `lastmod` 2026-05-20, hreflang-alternates
- `llms.txt`: +3 vermeldingen
- `reclamebureau-rotterdam/index.njk` (pillar): interne links naar de 3 nieuwe pagina's
- Gerelateerde bestaande servicepagina's: related-card/inline-link naar de nieuwe pagina's
  waar contextueel relevant (bv. silo/offshore -> havenreclame)
- IndexNow: de 3 nieuwe URL's pingen na deploy

## Navigatie

Hoofdnav heeft een 6-link-limiet (`navExtraLink`). De 3 nieuwe pagina's komen
NIET in de hoofdnav; ze zijn bereikbaar via interne links, de reclamebureau-pillar,
de sitemap en related-cards. `navActiveUrl: "/diensten/"` zodat de Diensten-link actief is.

## Verificatie

- `npx @11ty/eleventy` build schoon — 24 pagina's, 0 errors
- Elke nieuwe pagina: HTTP 200, JSON-LD valide (Google Rich Results Test), titel/meta/canonical/og correct
- Visuele smoke-test (desktop + mobile) via CDP — geen layout shift, pricing/usp/FAQ renderen
- GitHub Actions 6 quality gates groen (HTML-validatie, Lighthouse, Image Audit, Link Check,
  Deploy Readiness, SEO Gate)
- Geen kannibalisatie: nieuwe pagina's targeten andere zoekwoorden dan bestaande

## Levering

- Een branch `feat/sprint-4-content`, een commit per werkitem (4 commits)
- Een deploy aan het einde van de sprint (merge naar `main` -> CF Pages auto-build)
- Push: `gh auth switch --user alfareclame` voor push
- Na deploy: live-verificatie + IndexNow-ping voor de 3 nieuwe URL's

## Risico's

- **Laag** — alleen nieuwe bestanden + additieve bewerking van `materialen`; geen
  regressierisico voor bestaande pagina's.
- Kannibalisatie afgedekt door scope-keuze (carwrap/transport-wagenpark uitgesloten).
- Contentkwaliteit/NL-taal: pagina's volgen toon en diepgang van bestaande servicepagina's.
