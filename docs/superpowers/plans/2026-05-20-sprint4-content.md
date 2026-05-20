# Sprint 4 — Nieuwe contentpagina's — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drie nieuwe SEO-contentpagina's (haven-hub, horeca, retail) bouwen + `/materialen/` verdiepen, zonder kannibalisatie van bestaande pagina's.

**Architecture:** Statische site, Eleventy 11ty, Nunjucks-templates. Elke nieuwe pagina is een `<folder>/index.njk` met front-matter + body, layout `base.njk`. Body-structuur wordt 1-op-1 overgenomen van de referentiepagina `fleet-wrap-rotterdam/index.njk` (hero -> intro -> dienst-secties -> pricing-grid -> wijken -> FAQ -> related -> dark CTA). Geen nieuwe CSS-architectuur; bestaande componentklassen en `pageStyles`-patroon hergebruiken.

**Tech Stack:** Eleventy 3.1.5, Nunjucks (`.njk`), HTML/CSS, JSON-LD (Schema.org), Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-05-20-sprint4-content-design.md`

---

**Referentiepagina (kopieer body-structuur hiervan):** `fleet-wrap-rotterdam/index.njk`
- hero (`<section class="hero">`, regel ~173)
- intro/pillar-sectie (`section-soft stripe-top`, ~217)
- dienst-secties (`section` / `section-soft`, ~244-415)
- prijzen (`pricing-grid` met 3 `pricing-card`, een `pricing-card--featured`, ~416)
- werkgebied (`usp-list` met 8 wijken/zones, ~460)
- FAQ (`section-soft`, `aria-labelledby="faq-title"`, `hasFaqAccordion: true`, ~552)
- related (related-cards, ~688)
- dark CTA (`section section-dark`, ~723)

**Algemene regels:**
- NL-taal, toon en diepgang gelijk aan `fleet-wrap-rotterdam`. Per pagina 1800-2500 woorden.
- Push: voer `gh auth switch --user alfareclame` uit voor elke push.
- Build: `npx @11ty/eleventy` vanuit repo-root `C:\Users\dogan\code\alfareclame.nl`.
- Branch: `feat/sprint-4-content` (bestaat al, spec is daar gecommit).
- Een deploy aan het einde (Task 7), niet per pagina.
- Geen wijziging aan bestaande pagina's behalve het toevoegen van inbound links (Task 5).

---

## Task 1: `/havenreclame-rotterdam/` — haven-signage hub

**Files:**
- Create: `havenreclame-rotterdam/index.njk`

**Front-matter (exacte waarden):**
```yaml
---
layout: base.njk
title: "Havenreclame Rotterdam — Scheeps- & Containerbelettering | Alfa Reclame"
description: "Havenreclame Rotterdam: scheepsbelettering, containerbelettering, kade- en terminal-signage. Maritieme A-merk vinyl, ATEX-bewust. Vanaf 2950 euro."
keywords: "havenreclame Rotterdam, scheepsbelettering Rotterdam, containerbelettering Rotterdam, terminal signage Rotterdam, kade belettering, maritieme belettering Rotterdam, haven signage, offshore belettering Rotterdam, silobelettering haven"
canonical: "https://alfareclame.nl/havenreclame-rotterdam/"
og_title: "Havenreclame Rotterdam — scheeps- & containerbelettering vanaf 2950 euro"
og_description: "Signage voor de haven van Rotterdam: scheepsbelettering, containers, kade- en terminal-signage, veiligheidssignalering. Maritieme A-merk vinyl."
og_type: "article"
og_image: "https://alfareclame.nl/public/images/portfolio/i-bo-warmte-techniek.jpg"
og_image_width: "1280"
og_image_height: "853"
og_image_type: "image/jpeg"
og_image_alt: ""
twitter_title: "Havenreclame Rotterdam — scheeps- & containerbelettering | Alfa Reclame"
twitter_description: "Signage voor de haven van Rotterdam: scheepsbelettering, containers, kade- en terminal-signage. Maritieme A-merk vinyl."
color_scheme: "light"
geo_position: "51.9225;4.47917"
geo_icbm: "51.9225, 4.47917"
article_published_time: "2026-05-20T12:00:00+02:00"
article_modified_time: "2026-05-20T12:00:00+02:00"
article_author: "Alfa Reclame"
article_section: "Havenreclame"
navActiveUrl: "/diensten/"
breadcrumbs:
  - label: "Home"
    url: "/"
  - label: "Diensten"
    url: "/diensten/"
  - label: "Havenreclame Rotterdam"
hasFaqAccordion: true
pageStylesLabel: "PAGE-SPECIFIC CSS (< 100 lines)"
pageStyles: |
  (kopieer het pageStyles-blok van fleet-wrap-rotterdam/index.njk; bevat pricing-grid,
   pricing-card(+--featured), pc-name/pc-price/pc-desc. Voeg niets nieuws toe.)
jsonld: |
  (zie Step 3)
---
```

**Body-secties (kopieer HTML-structuur van fleet-wrap, vul NL-content):**
1. hero — eyebrow "Haven van Rotterdam, signage", h1 "Havenreclame Rotterdam", lead 2 zinnen, CTA-rij (offerte + WhatsApp). Hero-visual: hergebruik bestaande portfolio-afbeeldingen via `<picture>` met width/height (kopieer markup-patroon van fleet-wrap hero__visual).
2. intro/pillar (~250 w) — Rotterdam grootste haven van Europa; wat havenreclame omvat.
3. dienst-sectie "Scheepsbelettering" (~220 w)
4. dienst-sectie "Containerbelettering" (~220 w)
5. dienst-sectie "Kade- & terminal-signage" (~220 w)
6. dienst-sectie "Veiligheidssignalering & ATEX-bewuste uitvoering" (~200 w)
7. `usp-list` "Silo- en offshore-belettering" (~150 w) — met interne links naar
   `/silobelettering/` en `/offshore-belettering/`
8. prijzen — `pricing-grid`, 3 `pricing-card`:
   - "Klein havenproject" — vanaf 2950 euro
   - "Midden havenproject" — vanaf 5950 euro — `pricing-card--featured`
   - "Groot havenproject" — vanaf 12500 euro
9. werkgebied `usp-list` — 8 haven-zones (een `<li>` elk, korte omschrijving):
   Maasvlakte, Botlek, Europoort, Waalhaven, Eemhaven, Vondelingenplaat, Pernis, Merwe-Vierhavens
10. FAQ — 12 Q&A in accordion-markup (kopieer FAQ-markup van fleet-wrap). Vragen:
    1. Welke vergunningen zijn nodig voor havenreclame in Rotterdam?
    2. Hoe lang gaat maritieme belettering mee op zout/zilt milieu?
    3. Werken jullie ATEX-bewust in Botlek/Pernis?
    4. Kunnen jullie op locatie aan kade of terminal werken?
    5. Welke vinyl gebruiken jullie voor containers en scheepsrompen?
    6. Wat kost havenreclame gemiddeld?
    7. Hoe snel kan een havenproject starten?
    8. Doen jullie ook IMO-/rederij-conforme markeringen?
    9. Kunnen jullie hele containervloten van logo voorzien?
    10. Verzorgen jullie ook silobelettering in de haven?
    11. Werken jullie samen met terminals en logistieke dienstverleners?
    12. Wat is het verschil tussen havenreclame en offshore-belettering?
11. related — related-cards naar `/silobelettering/`, `/offshore-belettering/`, `/fleet-wrap-rotterdam/`
12. dark CTA — kopieer van fleet-wrap (`section section-dark`).

- [ ] **Step 1: Maak het bestand met front-matter + body**

Maak `havenreclame-rotterdam/index.njk`. Kopieer de body-HTML-structuur van
`fleet-wrap-rotterdam/index.njk` en vervang de content met de NL-content hierboven.
Behoud alle componentklassen, `aria-labelledby`, `<picture>`-markup met width/height.
Kopieer het `pageStyles`-blok ongewijzigd van fleet-wrap.

- [ ] **Step 2: Schrijf de NL-content per sectie**

Vul elke sectie met NL-prose (toon = fleet-wrap). Totaal 1900-2200 woorden.
Geen lorem ipsum, geen placeholders — volledige verkoopklare tekst.

- [ ] **Step 3: Voeg JSON-LD toe (`jsonld` front-matter, raw string)**

Drie objecten, gerenderd via `{{ jsonld | safe }}`:
- `Service` — `serviceType: "Havenreclame"`, `areaServed: "Rotterdam"`, `provider` = Alfa Reclame (kopieer provider-blok uit fleet-wrap JSON-LD).
- `FAQPage` — `mainEntity` met exact dezelfde 12 vragen/antwoorden als de zichtbare FAQ-accordion (tekst moet matchen).
- `BreadcrumbList` — Home -> Diensten -> Havenreclame Rotterdam.
Kopieer de exacte JSON-LD-vorm/escaping van `fleet-wrap-rotterdam/index.njk`.

- [ ] **Step 4: Build en verifieer**

Run: `npx @11ty/eleventy`
Expected: `Wrote 22 files` (21 + deze), 0 errors. Controleer dat
`_site/havenreclame-rotterdam/index.html` bestaat.

- [ ] **Step 5: Commit**

```bash
git add havenreclame-rotterdam/index.njk
git commit -m "feat: havenreclame Rotterdam hub page"
```

---

## Task 2: `/horecabelettering-rotterdam/` — sectorlanding horeca

**Files:**
- Create: `horecabelettering-rotterdam/index.njk`

**Front-matter (exacte waarden):**
```yaml
---
layout: base.njk
title: "Horecabelettering Rotterdam — Raam, Gevel & Menubord | Alfa Reclame"
description: "Horecabelettering Rotterdam voor restaurant, cafe en bar: raambelettering, menuborden, gevelreclame, lichtbak, terrasschotten. Vanaf 495 euro."
keywords: "horecabelettering Rotterdam, raambelettering horeca Rotterdam, menubord Rotterdam, restaurant belettering, cafe belettering Rotterdam, terrasschotten Rotterdam, gevelreclame horeca, lichtbak horeca Rotterdam"
canonical: "https://alfareclame.nl/horecabelettering-rotterdam/"
og_title: "Horecabelettering Rotterdam — raam, gevel & menubord vanaf 495 euro"
og_description: "Signage voor de Rotterdamse horeca: raambelettering, menuborden, gevelreclame, lichtbak en terrasschotten. Schoonmaakbestendig, snel geplaatst."
og_type: "article"
og_image: "https://alfareclame.nl/public/images/portfolio/i-bo-warmte-techniek.jpg"
og_image_width: "1280"
og_image_height: "853"
og_image_type: "image/jpeg"
og_image_alt: ""
twitter_title: "Horecabelettering Rotterdam — raam, gevel & menubord | Alfa Reclame"
twitter_description: "Signage voor de Rotterdamse horeca: raambelettering, menuborden, gevelreclame, lichtbak en terrasschotten."
color_scheme: "light"
geo_position: "51.9225;4.47917"
geo_icbm: "51.9225, 4.47917"
article_published_time: "2026-05-20T12:00:00+02:00"
article_modified_time: "2026-05-20T12:00:00+02:00"
article_author: "Alfa Reclame"
article_section: "Horecabelettering"
navActiveUrl: "/diensten/"
breadcrumbs:
  - label: "Home"
    url: "/"
  - label: "Diensten"
    url: "/diensten/"
  - label: "Horecabelettering Rotterdam"
hasFaqAccordion: true
pageStylesLabel: "PAGE-SPECIFIC CSS (< 100 lines)"
pageStyles: |
  (kopieer het pageStyles-blok van fleet-wrap-rotterdam/index.njk)
jsonld: |
  (zie Step 3)
---
```

**Body-secties (zelfde structuur als Task 1):**
1. hero — eyebrow "Horeca, Rotterdam", h1 "Horecabelettering Rotterdam".
2. intro (~250 w) — waarom signage cruciaal is voor horeca-zichtbaarheid.
3. dienst-sectie "Raambelettering & openingstijden-stickers" (~220 w) — link naar `/raambelettering-rotterdam/`.
4. dienst-sectie "Menuborden & krijtbord-stijl" (~200 w)
5. dienst-sectie "Gevelreclame & uithangborden" (~210 w) — link naar `/gevelreclame-rotterdam/`.
6. dienst-sectie "Lichtbak & verlichte uitingen" (~200 w) — link naar `/lichtreclame-rotterdam/`.
7. dienst-sectie "Terrasschotten & terrasreclame" (~200 w)
8. prijzen — `pricing-grid`, 3 `pricing-card`:
   - "Starter horeca-pakket" — vanaf 495 euro
   - "Compleet horeca-pakket" — vanaf 1450 euro — `pricing-card--featured`
   - "Premium horeca-pakket" — vanaf 2950 euro
9. werkgebied `usp-list` — 8 Rotterdamse wijken: Centrum, Witte de Withstraat, Kralingen,
   Hillegersberg, Delfshaven, Noord, Katendrecht, Nesselande
10. FAQ — 11 Q&A. Vragen:
    1. Welke folie gebruiken jullie voor horeca-ramen (schoonmaakbestendig)?
    2. Mag ik mijn openingstijden op de pui plakken — zijn er regels?
    3. Hebben terrasschotten een vergunning nodig in Rotterdam?
    4. Hoe snel kan een cafe of restaurant beletterd worden?
    5. Kunnen jullie seizoens- of actie-uitingen tijdelijk plaatsen?
    6. Wat kost horecabelettering gemiddeld?
    7. Plaatsen jullie ook menuborden en krijtbord-stijl uitingen?
    8. Kunnen jullie buiten openingstijden / 's ochtends werken?
    9. Doen jullie ook lichtbakken en verlichte uithangborden?
    10. Is raamfolie geschikt voor privacy op een terras of lunchroom?
    11. Verzorgen jullie ook de gevelreclame bij een nieuwe horecazaak?
11. related — related-cards naar `/raambelettering-rotterdam/`, `/gevelreclame-rotterdam/`, `/lichtreclame-rotterdam/`.
12. dark CTA.

- [ ] **Step 1: Maak het bestand met front-matter + body**

Maak `horecabelettering-rotterdam/index.njk`, body-structuur gekopieerd van
`fleet-wrap-rotterdam/index.njk`, content vervangen volgens bovenstaande secties.

- [ ] **Step 2: Schrijf de NL-content per sectie**

Totaal 1800-2100 woorden, volledige verkoopklare NL-tekst.

- [ ] **Step 3: Voeg JSON-LD toe**

`Service` (`serviceType: "Horecabelettering"`) + `FAQPage` (exact de 11 vragen/antwoorden
hierboven, tekst matcht de zichtbare accordion) + `BreadcrumbList`. Vorm = fleet-wrap.

- [ ] **Step 4: Build en verifieer**

Run: `npx @11ty/eleventy`
Expected: `Wrote 23 files`, 0 errors. `_site/horecabelettering-rotterdam/index.html` bestaat.

- [ ] **Step 5: Commit**

```bash
git add horecabelettering-rotterdam/index.njk
git commit -m "feat: horecabelettering Rotterdam sector landing"
```

---

## Task 3: `/retailreclame-rotterdam/` — sectorlanding retail

**Files:**
- Create: `retailreclame-rotterdam/index.njk`

**Front-matter (exacte waarden):**
```yaml
---
layout: base.njk
title: "Retailreclame Rotterdam — Etalage, Gevel & Winkelbelettering | Alfa Reclame"
description: "Retailreclame Rotterdam: etalagebelettering, gevelreclame, lichtreclame, winkelbestickering en sale-stickers. Snel geplaatst. Vanaf 595 euro."
keywords: "retailreclame Rotterdam, winkelbelettering Rotterdam, etalagebelettering Rotterdam, winkel gevelreclame Rotterdam, winkelbestickering, sale stickers Rotterdam, retail signage Rotterdam, lichtreclame winkel"
canonical: "https://alfareclame.nl/retailreclame-rotterdam/"
og_title: "Retailreclame Rotterdam — etalage, gevel & winkelbelettering vanaf 595 euro"
og_description: "Signage voor Rotterdamse winkels: etalagebelettering, gevelreclame, lichtreclame, winkelbestickering en sale-stickers."
og_type: "article"
og_image: "https://alfareclame.nl/public/images/portfolio/i-bo-warmte-techniek.jpg"
og_image_width: "1280"
og_image_height: "853"
og_image_type: "image/jpeg"
og_image_alt: ""
twitter_title: "Retailreclame Rotterdam — etalage, gevel & winkelbelettering | Alfa Reclame"
twitter_description: "Signage voor Rotterdamse winkels: etalagebelettering, gevelreclame, lichtreclame, winkelbestickering en sale-stickers."
color_scheme: "light"
geo_position: "51.9225;4.47917"
geo_icbm: "51.9225, 4.47917"
article_published_time: "2026-05-20T12:00:00+02:00"
article_modified_time: "2026-05-20T12:00:00+02:00"
article_author: "Alfa Reclame"
article_section: "Retailreclame"
navActiveUrl: "/diensten/"
breadcrumbs:
  - label: "Home"
    url: "/"
  - label: "Diensten"
    url: "/diensten/"
  - label: "Retailreclame Rotterdam"
hasFaqAccordion: true
pageStylesLabel: "PAGE-SPECIFIC CSS (< 100 lines)"
pageStyles: |
  (kopieer het pageStyles-blok van fleet-wrap-rotterdam/index.njk)
jsonld: |
  (zie Step 3)
---
```

**Body-secties (zelfde structuur):**
1. hero — eyebrow "Retail, Rotterdam", h1 "Retailreclame Rotterdam".
2. intro (~250 w) — etalage en gevel als verkoopinstrument.
3. dienst-sectie "Etalagebelettering & seizoenswissels" (~220 w) — link `/raambelettering-rotterdam/`.
4. dienst-sectie "Gevelreclame & winkelpui" (~210 w) — link `/gevelreclame-rotterdam/`.
5. dienst-sectie "Lichtreclame & verlichte logo's" (~200 w) — link `/lichtreclame-rotterdam/`.
6. dienst-sectie "Winkelbestickering & vloer/wand" (~200 w) — link `/bestickering-rotterdam/`.
7. dienst-sectie "Sale- & actie-stickers" (~190 w)
8. prijzen — `pricing-grid`, 3 `pricing-card`:
   - "Starter retail-pakket" — vanaf 595 euro
   - "Compleet retail-pakket" — vanaf 1750 euro — `pricing-card--featured`
   - "Premium retail-pakket" — vanaf 3950 euro
9. werkgebied `usp-list` — 8 Rotterdamse winkelgebieden: Centrum/Koopgoot, Lijnbaan,
   Alexandrium, Zuidplein, Hillegersberg, Nesselande, Kralingen, Witte de Withstraat
10. FAQ — 11 Q&A. Vragen:
    1. Hoe vaak kan ik mijn etalage laten wisselen?
    2. Gebruiken jullie herpositioneerbare folie voor tijdelijke acties?
    3. Zijn er regels voor winkelpui-reclame in Rotterdam?
    4. Hoe snel kan een winkel beletterd worden?
    5. Kunnen jullie hele winkelketens uniform uitvoeren?
    6. Wat kost retailreclame gemiddeld?
    7. Plaatsen jullie ook vloer- en wandstickers in de winkel?
    8. Doen jullie verlichte logo's en lichtbakken voor winkels?
    9. Kunnen jullie buiten openingstijden plaatsen?
    10. Verzorgen jullie sale- en seizoensstickers terugkerend?
    11. Wat is het verschil tussen etalagebelettering en raambelettering?
11. related — related-cards naar `/raambelettering-rotterdam/`, `/gevelreclame-rotterdam/`, `/bestickering-rotterdam/`.
12. dark CTA.

- [ ] **Step 1: Maak het bestand met front-matter + body**

Maak `retailreclame-rotterdam/index.njk`, body-structuur van `fleet-wrap-rotterdam/index.njk`.

- [ ] **Step 2: Schrijf de NL-content per sectie**

Totaal 1800-2100 woorden, volledige NL-tekst.

- [ ] **Step 3: Voeg JSON-LD toe**

`Service` (`serviceType: "Retailreclame"`) + `FAQPage` (exact 11 vragen/antwoorden) +
`BreadcrumbList`. Vorm = fleet-wrap.

- [ ] **Step 4: Build en verifieer**

Run: `npx @11ty/eleventy`
Expected: `Wrote 24 files`, 0 errors. `_site/retailreclame-rotterdam/index.html` bestaat.

- [ ] **Step 5: Commit**

```bash
git add retailreclame-rotterdam/index.njk
git commit -m "feat: retailreclame Rotterdam sector landing"
```

---

## Task 4: `/materialen/` verdieping

**Files:**
- Modify: `materialen/index.njk`

**Wijzigingen:**
A. **Vinylmerken-vergelijkingstabel** — voeg een nieuwe sectie toe met een `<table>`
   (hergebruik bestaande tabel-klasse uit `materialen/index.njk`; als die `spec-table`/
   `data-table` heet, gebruik dezelfde). Kolommen: Merk | Type | Duurzaamheid | Toepassing | Prijsklasse.
   Rijen:
   - 3M (o.a. IJ180/2080) — cast — 7-10 jaar — premium wraps, langdurig — hoog
   - Avery (o.a. MPI/SWF) — cast — 7-9 jaar — wraps, gevel, premium — hoog
   - Hexis — cast — 6-8 jaar — wraps, voertuig, gevel — midden-hoog
   - Orafol (Oracal) — cast & calendered — 3-8 jaar — belettering, etalage, breed inzetbaar — midden
   Voeg ~150 w toelichtende prose toe boven de tabel (cast vs calendered uitleg).
B. **Autoreclame-wijksecties** — voeg een `usp-list`-sectie toe met 8 Rotterdamse wijken
   en per wijk een korte toepassings-/welstand-notitie (zelfde patroon als de wijksecties
   in `gevelreclame-rotterdam/index.njk`). Wijken: Centrum, Noord, Kralingen-Crooswijk,
   Hillegersberg-Schiebroek, Delfshaven, Feijenoord, IJsselmonde, Prins Alexander.
   ~200 w. Met interne link naar `/autoreclame-rotterdam/`.

- [ ] **Step 1: Inspecteer de huidige `materialen/index.njk`**

Lees `materialen/index.njk` — noteer de bestaande tabel-klasse en de wijksectie-markup
indien aanwezig, en kies een logische invoegpositie (na de bestaande materialen-content,
voor FAQ/CTA indien aanwezig).

- [ ] **Step 2: Voeg de vinylmerken-tabel toe**

Voeg sectie A toe met `<section>` + `aria-labelledby`, prose + `<table>` met de 4 rijen
hierboven. Behoud de bestaande visuele opzet; geen nieuwe CSS tenzij de tabelklasse ontbreekt
(hergebruik dan `spec-table` uit `offshore-belettering/index.njk`).

- [ ] **Step 3: Voeg de autoreclame-wijksecties toe**

Voeg sectie B toe met `usp-list` + 8 `<li>` wijken + interne link naar `/autoreclame-rotterdam/`.

- [ ] **Step 4: Build en verifieer**

Run: `npx @11ty/eleventy`
Expected: `Wrote 24 files`, 0 errors. `_site/materialen/index.html` bevat de tabel + wijksectie.

- [ ] **Step 5: Commit**

```bash
git add materialen/index.njk
git commit -m "feat: materialen — vinylmerken-tabel + autoreclame wijksecties"
```

---

## Task 5: Sitewide — sitemap, llms.txt, interne links

**Files:**
- Modify: `sitemap.xml`
- Modify: `llms.txt`
- Modify: `reclamebureau-rotterdam/index.njk`
- Modify: `silobelettering/index.njk`, `offshore-belettering/index.njk`

- [ ] **Step 1: Voeg 3 URL's toe aan `sitemap.xml`**

Kopieer een bestaand `<url>`-blok als sjabloon. Voeg toe (voor de afsluitende `</urlset>`):
`havenreclame-rotterdam/`, `horecabelettering-rotterdam/`, `retailreclame-rotterdam/`.
Elke entry: `<loc>`, `<lastmod>2026-05-20</lastmod>`, `<changefreq>monthly</changefreq>`,
`<priority>0.8</priority>`, en de twee `<xhtml:link rel="alternate">` (nl-NL + x-default).

- [ ] **Step 2: Voeg 3 vermeldingen toe aan `llms.txt`**

In de dienst-/pagina-lijst, zelfde regelvorm als bestaande entries:
```
- [Havenreclame Rotterdam](https://alfareclame.nl/havenreclame-rotterdam/) — scheeps-, container-, kade- en terminal-signage in de haven
- [Horecabelettering Rotterdam](https://alfareclame.nl/horecabelettering-rotterdam/) — raam, gevel, menubord, lichtbak en terrasschotten voor horeca
- [Retailreclame Rotterdam](https://alfareclame.nl/retailreclame-rotterdam/) — etalage, gevel, lichtreclame en winkelbestickering voor retail
```

- [ ] **Step 3: Voeg interne links toe in de reclamebureau-pillar**

In `reclamebureau-rotterdam/index.njk` — voeg in de relevante dienst-/linksectie
links toe naar de 3 nieuwe pagina's (zelfde markup als bestaande pillar-links).

- [ ] **Step 4: Voeg related-link naar havenreclame toe in silo + offshore**

In `silobelettering/index.njk` en `offshore-belettering/index.njk` — voeg in de
related-cards-sectie (of een contextuele inline-link) een verwijzing toe naar
`/havenreclame-rotterdam/`. Geen layout-wijziging, alleen een kaart/link erbij.

- [ ] **Step 5: Build en verifieer**

Run: `npx @11ty/eleventy`
Expected: 0 errors. `grep` `_site/sitemap.xml` op de 3 nieuwe URL's -> 3 hits.

- [ ] **Step 6: Commit**

```bash
git add sitemap.xml llms.txt reclamebureau-rotterdam/index.njk silobelettering/index.njk offshore-belettering/index.njk
git commit -m "feat: sitemap + llms.txt + internal links for Sprint 4 pages"
```

---

## Task 6: Volledige verificatie

**Files:** geen (alleen verificatie)

- [ ] **Step 1: Schone build**

Run: `npx @11ty/eleventy`
Expected: `Wrote 24 files`, 0 errors.

- [ ] **Step 2: Lokale server + statuscheck 3 nieuwe pagina's**

Start `npx http-server _site -p 8803 -c-1 --silent` (achtergrond).
Controleer HTTP 200 voor `/havenreclame-rotterdam/`, `/horecabelettering-rotterdam/`,
`/retailreclame-rotterdam/` en dat `/materialen/` de tabel + wijksectie bevat.

- [ ] **Step 3: Visuele smoke-test (CDP)**

Met Chrome op `--remote-debugging-port=9222`: maak desktop- (1366) en mobile- (390)
screenshots van de 3 nieuwe pagina's. Controleer: hero, pricing-grid (3 kaarten),
usp-list (8 items), FAQ-accordion, related-cards, dark CTA — geen layout shift,
geen ongestylede elementen.

- [ ] **Step 4: JSON-LD-validatie**

Voor elke nieuwe pagina: kopieer de JSON-LD en valideer via Google Rich Results Test
(of een lokale JSON-validatie). `Service` + `FAQPage` + `BreadcrumbList` foutloos;
FAQ-vragen in JSON-LD matchen de zichtbare accordion exact.

- [ ] **Step 5: Meta/canonical/og spot-check**

`curl -s` elke nieuwe pagina (lokaal) -> controleer `<title>`, `<meta name="description">`,
`<link rel="canonical">`, `og:*` tegen de front-matter uit Tasks 1-3.

- [ ] **Step 6: Geen commit** (verificatietaak; los gevonden problemen op in de betreffende task).

---

## Task 7: Merge, deploy, live-verificatie

**Files:** geen broncode

- [ ] **Step 1: Merge naar `main`**

```bash
gh auth switch --user alfareclame
git checkout main
git merge --ff-only feat/sprint-4-content
```

- [ ] **Step 2: Push (triggert CF Pages auto-build + GitHub Actions)**

```bash
git push origin main
```

- [ ] **Step 3: Wacht op CI en CF Pages**

Run: `gh run list -L 6` — verwacht 6 quality gates `success` (HTML Validation,
Lighthouse CI, Image Audit, Link Check, Deploy Readiness, SEO Quality Gate).

- [ ] **Step 4: Live-verificatie**

`curl -s -I` de 3 nieuwe URL's op `https://alfareclame.nl/` -> HTTP 200.
Controleer dat `sitemap.xml` live de 3 URL's bevat.

- [ ] **Step 5: IndexNow-ping voor de 3 nieuwe URL's**

Gebruik de bestaande IndexNow-key (zie repo IndexNow key-bestand). Ping
`havenreclame-rotterdam/`, `horecabelettering-rotterdam/`, `retailreclame-rotterdam/`
via de IndexNow-API (zelfde aanpak als eerdere sprints — HTTP 200/202 verwacht).

- [ ] **Step 6: Branch opruimen**

```bash
git branch -d feat/sprint-4-content
```

---

## Self-Review (uitgevoerd door planschrijver)

**Spec-dekking:**
- 3 nieuwe pagina's -> Tasks 1-3.
- `/materialen/` verdieping (vinyltabel + wijksecties) -> Task 4.
- sitemap +3 / llms.txt +3 / pillar-links / related-links -> Task 5.
- Verificatie (build, schema, visueel, Lighthouse) -> Tasks 6 + 7.
- Een deploy aan sprint-einde + IndexNow -> Task 7.
- Service-landing-sjabloon, JSON-LD `Service`+`FAQPage`+`BreadcrumbList` -> Tasks 1-3 Steps 1+3.
- Navigatie: nieuwe pagina's niet in hoofdnav, `navActiveUrl: "/diensten/"` -> front-matter Tasks 1-3.

**Placeholder-scan:** Geen TBD/TODO. De "kopieer ..."-aanwijzingen verwijzen naar een
concreet bronbestand (`fleet-wrap-rotterdam/index.njk`) — expliciete instructie, geen
placeholder. NL-prose wordt tijdens implementatie geschreven; alle SEO-kritische exacte
waarden (titel, meta, keywords, canonical, FAQ-vragen, prijstiers, zones) staan volledig
in het plan.

**Type-/naamconsistentie:** Bestandspaden, componentklassen (`pricing-grid`, `pricing-card`,
`pricing-card--featured`, `usp-list`), front-matter-velden en `serviceType`-waarden
consistent over Tasks 1-3. Build-bestandstellingen lopen op: 22 -> 23 -> 24.

**Scope:** Een samenhangende contentsprint, geschikt voor een plan.
