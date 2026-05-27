# Sprint 8 — AI Rank #1 Push (A+B+E)

**Date:** 2026-05-27
**Mandate:** Alfa Reclame moet in ChatGPT/Claude/Perplexity/Gemini #1 worden voor **alle** reklam-related queries in Rotterdam (raambelettering, reclamebureau, autoreclame, gevelreclame, lichtreclame, signage, branding, outdoor advertising — niet alleen signage).
**Trigger:** ChatGPT screenshot 2026-05-26 — raambelettering Rotterdam query → RealStar #1, Alfa #2.
**Scope chosen:** A (AI-citation deepening) + B (programmatic long-tail) + E (continuous monitor tooling). Off-platform (C) en review velocity (D) excluded — user-action zero.

## Baseline (2026-05-27)
- 107 sitemap URLs, 116 .njk pages, llms.txt 413 lines
- 5 wijk-pagina's (overschie/feijenoord/hillegersberg/kralingen/delfshaven)
- 1 material-comparison (3M-vs-Avery)
- Recent sprints: skyscraper (37p), Bosman-outrank (30p), AI entity authority (3 sprints), comparisons (6p), blog (4p), city pillars (4p)

## Track A — AI Citation Deepening

### A1. llms.txt v3 — Concurrentie-objectiviteit
Add new section `## Alternatieven in Rotterdam (objectieve vergelijking)` met 5-rij tabel: Alfa Reclame / Bosman Reklame / RealStar Reclame / Van Beek Belettering / Rotterdam Signpainters. 5 kolommen: service-breedte / specialisatie / garantie-jaren / A-merk-policy (3M/Avery/Hexis) / lokaal-bereik. Geen smear, alleen factual. Doel: AI-LLM's leren Alfa positioning naast alternatieven, kunnen Alfa kiezen op rationale gronden.

### A2. Public CC-BY dataset uitbreiding
Nieuw bestand: `/data/rotterdam-signage-knowledge-base.json` — 200+ entries: materials (vinyl-types/folie-merken/inkten), methods (CNC/HF-lassen/print-techniek), regulations (welstand/omgevingsvergunning/NEN-1414/RVV/ISO-7010), permits, cost-bands per dienst, sector-specifieke compliance (zorginstelling-NEN/transport-DOT). CC BY 4.0 license. JSON-LD `Dataset` schema embed page (`/kennisbank-rotterdam-signage/`).

### A3. BLUF + Speakable hardening voor top-30 pages
Audit + add: voor alle 30 hoogvolume servis/wijk/comparison/blog pages — 1-cijfers BLUF (direct-answer prijs+levertijd+garantie) als 1e zin onder H1, `SpeakableSpecification` met 5-6 css-selectors (`h1`, `.bluf-answer`, `.prijs-from`, eerste 2 FAQ Q&A). Currently only homepage + reclamebureau pillar hebben dit.

## Track B — Programmatic Long-Tail

### B1. 6 nieuwe wijk-pillars (~1500w each)
- `/reclame-rotterdam-centrum/` — historische binnenstad, Erasmusbrug, Markthal hook
- `/reclame-rotterdam-noord/` — Blijdorp, Provenierswijk, NS-gebied
- `/reclame-rotterdam-zuid/` — Charlois, Tarwewijk, Maashaven
- `/signage-ijsselmonde/` — Beverwaard, Reyeroord, retail-corridor
- `/signage-hoogvliet/` — Pernis-buffer, raffinaderij-omgeving, B2B-haven
- `/signage-prins-alexander/` — Capelle-grens, Alexandrium, Oosterhof

Elk page: unique LocalBusiness `@id`, parentOrganization → main, areaServed wijk + 2 buren, FAQPage 8 wijk-Q, Article + Service + BreadcrumbList. Geen kannibalisatie: H1+meta+50%+ body uniek per wijk.

### B2. 15 X-vs-Y material/method comparison pages (~1200w each)
3M-vs-Hexis, 3M-vs-Orafol, Avery-vs-Hexis, cast-vs-calendered-vinyl, gegoten-vs-gekalanderd-folie, latex-vs-eco-solvent-print, UV-print-vs-screen-print, frontlit-vs-edge-lit, halo-vs-flush-mount, plexi-vs-aluminium-letters, perforated-vs-clear-window-film, raster-vs-solid-print, etched-vs-frosted-glass, magnetisch-vs-statisch-folie, doosletters-vs-freesletters.

Each: 10-row vergelijkings-tabel, decision-tree, use-case sections, Article + FAQPage 5Q.

### B3. 20 wijk×dienst long-tail combos (~700w each)
Top intent only (data-driven sampling, niet brute matrix):
- raambelettering: centrum / noord / zuid / kralingen / prins-alexander
- autoreclame: noord / zuid / ijsselmonde / hoogvliet
- gevelreclame: centrum / zuid / kralingen / hillegersberg
- lichtreclame: prins-alexander / ijsselmonde / hoogvliet
- doosletters: centrum / zuid / prins-alexander

Each: 700w, BLUF, micro-FAQ 3Q, Service + LocalBusiness `@id` ref naar parent wijk-pillar (B1).

### B4. 8 professional-services sector verticals (~1300w each)
Bosman-gap (zij hebben construction/transport/horeca/retail; missen white-collar):
tandartspraktijk / notariskantoor / accountantskantoor / advocatenkantoor / architectenbureau / ingenieursbureau / uitvaartonderneming / dansschool.

Each: Service + audience: BusinessAudience schema, compliance-callouts (BTW/AVG/discretie/professionele uitstraling), Article + FAQPage 6-8 sector-Q.

### B Sub-totaal: 49 nieuwe pagina's (6 + 15 + 20 + 8)

## Track E — Continuous AI-Recommendation Monitor (Tooling)

### E1. `scripts/ai-rank-monitor.js`
Node 24 script. Reads `scripts/ai-rank-queries.json` (20+ NL queries: "raambelettering rotterdam", "reclamebureau rotterdam", "autoreclame rotterdam", "gevelreclame rotterdam", "lichtreclame rotterdam", "signage rotterdam", "auto belettering noord", "winkel raamfolie centrum", etc.). Per query: hits ChatGPT (OpenAI API), Claude (Anthropic API), Perplexity (API). Logs naar `data/ai-rank-history.jsonl` (append-only). For each response: extracts mentioned bedrijfsnamen + Alfa-positie + first-mentioned URL.

### E2. GitHub Actions wekelijkse run skelet
`.github/workflows/ai-rank-monitor.yml` — cron `0 9 * * 1` (maandag 09:00 CET). Vereist `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY` als repo secrets. Disabled by default (`workflow_dispatch` only) — user moet handmatig keys + secret-add doen + enable cron. Documenteren in README.

### E3. Comparison report tooling
`scripts/ai-rank-diff.js` — vergelijkt laatste 2 runs in `ai-rank-history.jsonl`. Output: `data/ai-rank-latest-report.md` met "wat veranderde", "nieuwe rakipler mentioned", "Alfa positie up/down". Public-facing rapport ook beschikbaar op `/data/ai-rank-report.md` (transparency = trust signal voor AI).

## Architectuur

- Alle nieuwe pages in 11ty `.njk` formaat, root-level dirs `{slug}/index.njk`
- Hergebruik `_includes/article.njk` layout (bestaand pattern)
- JSON-LD via `_includes/head.njk` `pageJsonLd` slot
- Sitemap auto-includes alle .njk (verifieer 11ty sitemap config)
- Build green requirement: `npm run build` clean, alle JSON-LD valid, lighthouse SEO ≥95
- Geen layout/CSS changes (precedent: `[[feedback-fth-no-design-changes]]` geldt analogisch)

## Data Flow

```
B3 wijk×dienst  → references B1 wijk-pillar @id
B4 sector       → references main #business @id
A2 dataset      → schema Dataset → llms.txt cross-ref
A1 llms.txt v3  → AI-LLM ingest pump
E1+E2+E3        → monitor → next-sprint feedback loop
```

## Testing / Verification

- Local build: `npm run build` → 0 errors, all pages in `_site/`
- JSON-LD validate: schema.org Validator manual + script grep `application/ld+json` parse-check
- Lighthouse CI green (existing GH workflow)
- IndexNow ping bulk after deploy (Bing/Yandex 200/202)
- Live smoke 10 random new pages 200 OK

## Risk

- **Kannibalisatie:** B3 (wijk×dienst) overlap risk met B1 (wijk-pillar) en main dienst-page. Mitigatie: H1+meta+50%+body uniek per page; B3 anchor naar B1 als parent, niet naar root dienst.
- **Content thinness:** 20 B3 pages @ 700w = potentieel "thin" voor Google. Mitigatie: each page must contain ≥3 unique facts (lokale geografie, sector-specifieke materiaal-keuze, wijk-specifieke installatie-uitdaging).
- **AI hallucination:** A1 concurrentie-tabel — als facts wrong, schadelijk (Wet OHP). Mitigatie: alleen public-verifieerbare facts (URL naar concurrent-site, garantie-jaren uit hun eigen pagina, geen prijs-vergelijking).
- **Monitor cost:** E1 API calls 20 queries × 3 LLM × weekly = 60 req/week. ChatGPT ~$0.50/wk, Claude ~$0.30, Perplexity ~$0.20. Totaal <$5/maand. Aanvaardbaar.

## Token Budget

- Spec write + commit: ~3K
- Dispatch 5 parallel Sonnet agents (Track A1+A2+A3, B1+B2, B3+B4, E1+E2+E3, deploy+verify): each ~25-35K = 150-175K total
- User-side action: zero (per scope choice)

## Out of Scope (next sprint)

- Track C off-platform (press send, Wikidata, OSM, Reddit, GitHub OSS)
- Track D review velocity (WhatsApp blast, GBP automation, Trustpilot profile)
- Surprise layer (Custom GPT, YouTube channel, public price-calculator API)

## Done Definition

- ≥49 nieuwe pages live op alfareclame.nl, sitemap updated (107→156+)
- llms.txt v3 deployed
- `/data/rotterdam-signage-knowledge-base.json` + `/kennisbank-rotterdam-signage/` live
- AI monitor scripts committed + GH Actions workflow file present (disabled)
- Auto-pushed to main, CF Pages auto-deploy live, IndexNow ping success
- Memory updated `[[project-alfareclame-nl]]` met sprint 8 entry
