# alfareclame.nl

> Reclamebureau Rotterdam — raambelettering, autoreclame, gevelreclame en grootformaat-signage. Sinds 2012.

Productie-website voor [Alfa Reclame](https://alfareclame.nl) — Rotterdams reclamebureau voor raambelettering, autoreclame, gevelreclame en grootformaat industrieel signage-werk in het havengebied.

---

## 🏗️ Architectuur

**Static site** — Build: Eleventy (npm run build → _site/). Pure HTML/CSS/JS via Eleventy templates, direct deploybaar.

**Hosting:** Cloudflare Pages met GitHub-integratie  
**CDN + DNS:** Cloudflare  
**Forms:** Native `mailto:` fallback + WhatsApp deep link  
**Analytics:** (later toegevoegd — privacy-friendly alternatief)

### Waarom statisch?

- ⚡ **Performance** — geen server-side rendering, directe HTML delivery via CDN
- 🔒 **Veiligheid** — geen attack surface (geen database, geen login)
- 💰 **Kosten** — Cloudflare Pages is gratis
- 🚀 **Schaalbaarheid** — miljoenen bezoekers per maand mogelijk zonder kostenstijging
- 🧠 **Eenvoud** — elke developer kan het onderhouden

---

## 📂 Projectstructuur

```
alfareclame-site/
├── .github/
│   ├── workflows/              # GitHub Actions quality gates
│   │   ├── lighthouse.yml      # Performance/SEO/a11y scores
│   │   ├── html-validate.yml   # W3C HTML5 compliance
│   │   ├── seo-check.yml       # Sitemap/robots/schema validatie
│   │   ├── image-audit.yml     # Afbeeldingsgrootte controle
│   │   ├── link-check.yml      # Broken link scanner
│   │   └── deploy-check.yml    # JSON + asset validatie
│   ├── ISSUE_TEMPLATE/         # Bug report + feature request
│   ├── dependabot.yml          # Automatische workflow updates
│   └── PULL_REQUEST_TEMPLATE.md
├── .well-known/
│   └── security.txt            # RFC 9116 security disclosure
├── _includes/                  # Eleventy partial templates
├── _site/                      # Build output (gegenereerd door Eleventy, niet committen)
├── data/
│   ├── portfolio.json          # Portfolio items (JSON-driven)
│   └── reviews.json            # Klantreviews (JSON-driven)
├── public/
│   └── images/                 # Logo, favicons, portfolio foto's, og-image
├── _headers                    # Cloudflare security + cache headers
├── _redirects                  # URL redirects
├── .editorconfig               # Consistente formatting
├── .eleventy.js                # Eleventy configuratie
├── .gitignore
├── .lighthouserc.json          # Lighthouse CI budgets
├── CHANGELOG.md                # Versie-geschiedenis
├── CONTRIBUTING.md             # Development workflow
├── LAUNCH-GUIDE.md             # GitHub + Cloudflare setup guide
├── SECURITY.md                 # Security disclosure policy
├── humans.txt                  # Transparantie
├── index.njk                   # ⭐ Homepage template (Eleventy)
├── llms.txt                    # AI-crawler standaard
├── manifest.json               # PWA manifest
├── package.json                # Node dependencies + build scripts
├── robots.txt                  # Search/AI bot directives
└── sitemap.xml                 # XML sitemap + image sitemap
```

---

## 🚀 Deployment

### Productie
`main` branch → automatisch naar `alfareclame.nl` (2-3 minuten)

### Staging
`staging` branch → automatisch naar `staging.alfareclame.pages.dev`

### Feature previews
Elke feature branch → automatische preview URL

Zie [`LAUNCH-GUIDE.md`](./LAUNCH-GUIDE.md) voor volledige setup-instructies.

---

## 🛠️ Lokaal draaien

```bash
npm install && npm run serve
```

Open `http://localhost:8080`

Of gebouwde site serveren:
```bash
npm run build
npx serve _site -p 8000
```

Voor exacte productie-simulatie inclusief headers:
```bash
npx wrangler pages dev _site --port 8080
```

---

## 🔍 Quality Gates

Elke pull request doorloopt zes automatische controles:

| Check | Budget | Status |
|-------|--------|--------|
| Lighthouse Performance | ≥ 80 | warning at lower |
| Lighthouse Accessibility | ≥ 90 | ❌ bij lower |
| Lighthouse Best Practices | ≥ 90 | ❌ bij lower |
| Lighthouse SEO | ≥ 95 | ❌ bij lower |
| HTML5 W3C Validation | 0 errors | ❌ bij errors |
| Schema.org JSON-LD | Valid | ❌ bij invalid |
| Image sizes | ≤ 2.5 MB hard | ❌ bij > 2.5 MB |
| JSON files | Valid syntax | ❌ bij errors |
| Broken links | Geen 404 | ❌ bij broken |

---

## 📊 SEO-strategie

De site is geoptimaliseerd voor:

**Primary keywords (Rotterdam)**
- `raambelettering rotterdam`
- `autoreclame rotterdam`
- `gevelreclame rotterdam`
- `carwrap rotterdam`

**Long-tail**
- `scheepsbelettering havengebied rotterdam`
- `silobelettering industrie`
- `offshore crane platform belettering`

**Lichtreclame & overig**
- `lichtreclame rotterdam`
- `spandoeken rotterdam`
- `reclameborden rotterdam`
- `doosletters rotterdam`
- `bewegwijzering rotterdam`

**SEO-inventaris**
- 87 Schema.org `@type` entries
- Image sitemap met 29 portfolio foto's
- FAQ schema (12 vragen voor Rich Snippets)
- AggregateRating (4.9★)
- `llms.txt` voor AI-crawler discovery
- Hreflang + geo meta
- Complete Open Graph + Twitter Card

---

## 🤝 Bijdragen

Zie [`CONTRIBUTING.md`](./CONTRIBUTING.md) voor:
- Branch strategy
- Commit conventies
- Content-update workflow
- Lokale development

---

## 🔒 Security

Meld kwetsbaarheden volgens [`SECURITY.md`](./SECURITY.md) — niet via publieke issues.

---

## 📄 Licentie

© 2012–2026 Alfa Reclame. Alle rechten voorbehouden.

Deze repository is private en propriëtair. De inhoud (content, afbeeldingen, portfolio) is eigendom van Alfa Reclame.

---

## 📞 Contact

- **WhatsApp:** [+31 6 24 74 15 97](https://wa.me/31624741597)
- **E-mail:** info@alfareclame.nl
- **KvK:** 88606902
- **Locatie:** Rotterdam, Zuid-Holland, Nederland


---

## Backend & Environment

Naast de statische pagina's draaien er twee Cloudflare Pages Functions onder `functions/api/`:

- `POST /api/contact` — contactformulier → Telegram (validatie + per-IP rate-limit)
- `POST /api/eleven-call` — ElevenLabs post-call webhook (HMAC-gevalideerd) → Telegram

### Required environment variables

Cloudflare Pages → Settings → Variables and Secrets:

| Naam | Type | Beschrijving |
|------|------|--------------|
| `TELEGRAM_BOT_TOKEN` | Secret | Bot token van @BotFather |
| `TELEGRAM_CHAT_ID` | Plaintext | Chat-ID waar leads naartoe gestuurd worden |
| `ELEVENLABS_WEBHOOK_SECRET` | Secret | Shared secret voor ElevenLabs webhook HMAC |

### KV bindings

| Binding | Namespace | Doel |
|---------|-----------|------|
| `RATELIMIT_KV` | `alfareclame-ratelimit` | Per-IP rate-limit voor `/api/contact` (5 req / 10 min) |

### Secret rotation

- `ELEVENLABS_WEBHOOK_SECRET`: rouleren elke 6–12 maanden, of direct na vermoeden van compromittering. Synchroniseren met ElevenLabs Agent → Security → Post-call webhook.
- `TELEGRAM_BOT_TOKEN`: alleen rouleren via @BotFather indien gelekt.

### Lokaal testen van Functions

```bash
npx wrangler pages dev . --port 8080
```

Met binding-vlaggen voor lokale env vars; zie Wrangler docs.
