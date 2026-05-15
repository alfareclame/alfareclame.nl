# alfareclame.nl

> Signage & Digital Partner uit Rotterdam — sinds 2012

Productie-website voor [Alfa Reclame](https://alfareclame.nl) — Rotterdams bedrijf voor raambelettering, autoreclame, gevelreclame, grootformaat industrieel werk én professionele websites, AI-oplossingen en automatisering.

---

## 🏗️ Architectuur

**Static site** — geen framework, geen build-step, geen database. Pure HTML/CSS/JS, direct deploybaar.

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
├── data/
│   ├── portfolio.json          # Portfolio items (JSON-driven)
│   └── reviews.json            # Klantreviews (JSON-driven)
├── public/
│   └── images/                 # Logo, favicons, portfolio foto's, og-image
├── _headers                    # Cloudflare security + cache headers
├── _redirects                  # URL redirects
├── .editorconfig               # Consistente formatting
├── .gitignore
├── .lighthouserc.json          # Lighthouse CI budgets
├── CHANGELOG.md                # Versie-geschiedenis
├── CONTRIBUTING.md             # Development workflow
├── LAUNCH-GUIDE.md             # GitHub + Cloudflare setup guide
├── SECURITY.md                 # Security disclosure policy
├── humans.txt                  # Transparantie
├── index.html                  # ⭐ Hoofdbestand (4000+ regels)
├── llms.txt                    # AI-crawler standaard
├── manifest.json               # PWA manifest
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
python3 -m http.server 8000
# of
npx serve .
```

Open `http://localhost:8000`

Voor exacte productie-simulatie inclusief headers:
```bash
npx wrangler pages dev . --port 8080
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

**Digital**
- `website laten maken rotterdam`
- `ai oplossingen mkb`
- `automatisering voor bedrijven`

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

- **WhatsApp:** [+31 6 27 24 64 29](https://wa.me/31627246429)
- **E-mail:** info@alfareclame.nl
- **KvK:** 88606902
- **Locatie:** Rotterdam, Zuid-Holland, Nederland
