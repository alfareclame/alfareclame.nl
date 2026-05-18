# Bijdragen aan alfareclame.nl

Dit document beschrijft de branch-strategie, het development-proces en de quality gates voor wijzigingen aan de Alfa Reclame website.

---

## 📐 Branch-strategie

```
main              ──●────●────●────●──►  production (alfareclame.nl)
                    │    │    │    │
staging           ──┴●───┴●───┴●───┴●─►  pre-production
                     │    │    │    │
feature/*         ───┘    │    │    │    feature branches
hotfix/*          ────────┘    │    │    urgent bugfixes
content/*         ─────────────┘    │    portfolio, tekst, reviews
design/*          ──────────────────┘    UI/UX wijzigingen
```

### Branches

**`main`** — Altijd deploybaar. Cloudflare Pages deployt dit naar `alfareclame.nl`. Alleen merges via reviewed PR.

**`staging`** — Pre-production. Cloudflare Pages deployt dit naar `staging.alfareclame.pages.dev`. Gebruik voor grote wijzigingen voordat ze naar production gaan.

**`feature/korte-naam`** — Nieuwe functionaliteit. Cloudflare Pages maakt automatisch een preview URL (bv. `feature-korte-naam.alfareclame.pages.dev`).

**`content/korte-naam`** — Content updates (portfolio items, reviews, tekstwijzigingen).

**`design/korte-naam`** — Visuele/UX wijzigingen zonder functionaliteit-impact.

**`hotfix/korte-naam`** — Urgente bugfixes die direct naar production moeten.

### Naming conventie

- Gebruik kleine letters, streepjes tussen woorden
- Korte, beschrijvende naam: `feature/whatsapp-button`, `content/nieuwe-portfolio-item`, `design/hero-typography`
- Geen spaties, underscores of hoofdletters

---

## 🔄 Workflow

### 1. Start vanuit `main`
```bash
git checkout main
git pull origin main
git checkout -b feature/mijn-nieuwe-feature
```

### 2. Maak wijzigingen

Volg de style van bestaande code. Commit in logische brokken met duidelijke berichten:

```bash
git add .
git commit -m "feat: voeg WhatsApp sticky button toe"
```

**Commit message conventies** (Conventional Commits):
- `feat:` nieuwe functionaliteit
- `fix:` bugfix
- `style:` CSS/visueel zonder gedragsverandering
- `content:` tekst, portfolio, reviews
- `refactor:` code herstructurering
- `perf:` performance verbetering
- `docs:` documentatie
- `chore:` tooling, config, dependencies
- `ci:` workflow changes

### 3. Push naar GitHub
```bash
git push origin feature/mijn-nieuwe-feature
```

Cloudflare Pages maakt automatisch een preview deployment. De URL verschijnt als status-check op je PR.

### 4. Open een Pull Request
- Basis: `main` (of `staging` voor grote wijzigingen)
- Vul het PR-template in
- Wacht op quality gates (~3 minuten)

### 5. Quality Gates

Elke PR doorloopt **zes automatische controles**:

| Check | Wat doet het | Blokkeert merge? |
|-------|--------------|------------------|
| 🚦 Lighthouse CI | Performance, SEO, a11y, best practices | Ja (bij SEO < 95 of a11y < 90) |
| ✅ HTML Validation | W3C HTML5 compliance | Ja (bij errors) |
| 🔍 SEO Quality Gate | Sitemap, robots, schema, meta | Ja |
| 🖼️ Image Audit | Waarschuwt voor afbeeldingen > 500 KB, blokkeert > 2.5 MB | Alleen bij > 2.5 MB |
| 🔗 Link Check | Scant broken links | Ja |
| 📦 Deploy Readiness | JSON validatie, kritieke assets | Ja |

### 6. Review & merge

Na groene checks: review de preview URL van Cloudflare. Alles goed? Merge naar `main`.

Cloudflare Pages deployt automatisch binnen 2-3 minuten naar productie.

---

## 🛠️ Lokale development

### Snelle preview (geen build step)

Dit is een statische HTML site — geen framework, geen build. Alles is direct zichtbaar.

```bash
# Python (elke machine)
python3 -m http.server 8000

# Of Node.js
npx serve . -p 8000
```

Open `http://localhost:8000` in je browser.

### Voor exact dezelfde preview als productie

```bash
# Installeer Cloudflare Wrangler
npm install -g wrangler

# Start lokaal met headers/redirects
wrangler pages dev . --port 8080
```

Dit gebruikt je `_headers` en `_redirects` bestanden, net als in productie.

---

## 📝 Content wijzigingen

De meeste updates zijn puur content. Hoef niks te coderen.

### Portfolio items toevoegen

`data/portfolio.json` bewerken, afbeelding naar `public/images/portfolio/` uploaden.

```json
{
  "id": "nieuw-project",
  "name": "Bedrijfsnaam",
  "category": "Raambelettering",
  "scope": "Etalage + deur",
  "image": "/public/images/portfolio/bedrijfsnaam.jpg",
  "theme": "pf-theme-ink"
}
```

**Belangrijk:**
- Afbeelding **max 500 KB** (image audit waarschuwt erboven)
- Max 1600px breed
- Hernoem bestand beschrijvend: `bedrijfsnaam-raambelettering.jpg`

### Review toevoegen

`data/reviews.json` bewerken:

```json
{
  "id": "review-8",
  "quote": "Korte quote van klant.",
  "name": "Initialen of generieke naam",
  "company": "Sector, Rotterdam",
  "stars": 5
}
```

Gebruik initialen of anonimiseer voor privacy.

### Tekst wijzigen

Direct in `index.html`. Zoek op de exacte zin, pas aan, commit met `content:` prefix.

---

## 🎨 Design-wijzigingen

CSS zit allemaal inline in `<style>` in `index.html`. Gebruik CSS custom properties (`--ink`, `--white`) waar mogelijk.

Test altijd in:
- Chrome (desktop)
- Safari (iPhone)
- Firefox (minimum)
- Viewport 375px (mobile) + 1440px (desktop)

---

## 🚨 Hotfix procedure

Voor urgente productieproblemen:

```bash
git checkout main
git pull
git checkout -b hotfix/korte-beschrijving
# ... fix ...
git push origin hotfix/korte-beschrijving
```

Open PR direct tegen `main`. Quality gates moeten nog steeds passen — dit duurt ~3 min en beschermt production.

---

## 📚 Nuttige commando's

```bash
# Laatste status zien
git status

# Wijzigingen bekijken
git diff

# Huidige branch zien
git branch --show-current

# Terug naar main en ophalen
git checkout main && git pull

# Een branch hernoemen (nog niet gepusht)
git branch -m nieuwe-naam

# Laatste commit ongedaan maken (lokaal)
git reset --soft HEAD~1

# Oeps, laatste deploy is kapot — rollback
git revert HEAD
git push origin main
```

---

## ❓ Vragen

- **Over code / workflow:** open een issue met label `question`
- **Over business / klant:** WhatsApp +31 6 24 74 15 97
- **Security issue:** zie `SECURITY.md` (niet via issues)
