# 🚀 Launch Guide — alfareclame.nl

Deze gids leidt je van lokale files naar een productie-deploy op `alfareclame.nl` via GitHub + Cloudflare Pages.

**Totale tijd:** 30-45 minuten eerste keer, 30 seconden voor elke volgende deploy.

---

## 📋 Overzicht van het proces

```
┌────────────┐   push    ┌────────────┐   hook   ┌───────────────┐
│  Lokaal    │ ─────────►│   GitHub   │ ────────►│ Cloudflare    │
│  (jij)     │           │  (source   │          │    Pages      │
│            │           │  of truth) │          │  (deployment) │
└────────────┘           └────────────┘          └───────┬───────┘
                               │                         │
                               ▼                         ▼
                         ┌───────────┐            ┌──────────────┐
                         │  Actions  │            │ alfareclame  │
                         │  run CI   │            │     .nl      │
                         │  (gates)  │            │  (live site) │
                         └───────────┘            └──────────────┘
```

---

## Stap 1 — GitHub account & repository aanmaken

### 1.1. Als je nog geen GitHub account hebt:
- Ga naar https://github.com/signup
- Maak een account aan (gebruik een professioneel e-mailadres)
- Verifieer je e-mail

### 1.2. Nieuwe private repository aanmaken:
1. Klik rechtsboven op **+** → **New repository**
2. Vul in:
   - **Repository name:** `alfareclame-nl`
   - **Description:** `Productie website alfareclame.nl — signage & digital`
   - **Visibility:** 🔒 **Private** (belangrijk — niet public)
   - ❌ **GEEN** README, .gitignore of license toevoegen (die hebben we al)
3. Klik **Create repository**

GitHub laat je nu een scherm zien met setup-commando's. Laat dit tabblad open staan — we hebben die URL straks nodig.

---

## Stap 2 — Lokale Git repository initialiseren

### 2.1. Git installeren (als je het nog niet hebt)

**Mac:**
```bash
xcode-select --install
# Of via Homebrew:
brew install git
```

**Windows:**
Download van https://git-scm.com/download/win

**Linux:**
```bash
sudo apt install git   # Debian/Ubuntu
sudo dnf install git   # Fedora
```

Verifieer:
```bash
git --version
# Zou "git version 2.x.x" moeten tonen
```

### 2.2. Git configureren (eenmalig)

```bash
git config --global user.name "Jouw Naam"
git config --global user.email "info@alfareclame.nl"
git config --global init.defaultBranch main
git config --global core.autocrlf input   # Mac/Linux
# git config --global core.autocrlf true  # Windows
```

### 2.3. Lokale repo initialiseren

Ga naar de `alfareclame-site` folder (unzip eerst als het nog een zip is):

```bash
cd /pad/naar/alfareclame-site
ls
# Je zou index.html, sitemap.xml, etc. moeten zien
```

Initialiseer Git:

```bash
git init
git add .
git commit -m "feat: initial production release v1.0.0

- Complete website met signage + digital/AI diensten
- 87 Schema.org entries, image sitemap, llms.txt
- GitHub Actions quality gates (Lighthouse, HTML, SEO)
- Cloudflare Pages deployment ready"
```

Je zou iets moeten zien zoals "150+ files changed".

---

## Stap 3 — Pushen naar GitHub

### 3.1. Remote toevoegen

Ga terug naar je GitHub repo-pagina. Kopieer de HTTPS URL, bv:
`https://github.com/JOUW-USERNAME/alfareclame-nl.git`

```bash
git remote add origin https://github.com/JOUW-USERNAME/alfareclame-nl.git
git branch -M main
git push -u origin main
```

GitHub vraagt om authenticatie. Aanbevolen: **Personal Access Token** (niet je wachtwoord).

### 3.2. Personal Access Token aanmaken

1. GitHub → klik op je profielfoto rechtsboven → **Settings**
2. Links onderaan: **Developer settings**
3. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**
4. Vul in:
   - **Note:** `alfareclame-nl-laptop`
   - **Expiration:** `90 days` (of langer)
   - **Scopes:** vink `repo` aan (full control of private repositories)
5. **Generate token** → **kopieer de token direct** (je ziet hem maar één keer)
6. Gebruik de token als wachtwoord bij `git push`

**Tip:** Sla 'm op in je password manager als `github-alfareclame`.

### 3.3. Push succesvol?

Ververs je GitHub repo-pagina. Je zou nu alle bestanden moeten zien, inclusief:
- `index.html`
- `.github/workflows/` (6 bestanden)
- `README.md`
- `sitemap.xml`, `robots.txt`, etc.

**🎉 Je code staat nu veilig op GitHub.**

---

## Stap 4 — Cloudflare Pages koppelen

### 4.1. Cloudflare account

Als je nog geen Cloudflare account hebt:
1. https://dash.cloudflare.com/sign-up
2. Bevestig e-mail

### 4.2. Pages project aanmaken

1. Inloggen op https://dash.cloudflare.com
2. Links menu: **Workers & Pages**
3. Klik **Create application** → tab **Pages** → **Connect to Git**
4. Autoriseer GitHub (eerste keer) — kies **Only select repositories** en selecteer `alfareclame-nl`
5. Selecteer je `alfareclame-nl` repository
6. **Begin setup**

### 4.3. Build configuratie

Vul in:
- **Project name:** `alfareclame` (wordt onderdeel van `alfareclame.pages.dev`)
- **Production branch:** `main`
- **Framework preset:** **None**
- **Build command:** *(leeg laten)*
- **Build output directory:** `/` *(of leeg laten)*
- **Root directory:** *(leeg laten)*

Klik **Save and Deploy**.

**⏱️ Eerste deploy duurt ~2 minuten.**

### 4.4. Verifieer staging URL

Na de deploy krijg je een URL zoals:
```
https://alfareclame.pages.dev
```

Open 'm — je zou de website moeten zien. 🎉

---

## Stap 5 — Custom domain koppelen (`alfareclame.nl`)

### 5.1. Cloudflare als nameserver instellen

Je domein `alfareclame.nl` is waarschijnlijk geregistreerd bij een Nederlandse registrar (TransIP, Versio, Mijndomein, Hostnet, etc.). We gaan de DNS via Cloudflare laten lopen.

**Let op:** dit kan tot 24 uur duren om te propageren, maar meestal binnen 2 uur.

### 5.2. Domein toevoegen aan Cloudflare

1. Cloudflare dashboard → links bovenaan: **Add a domain**
2. Voer in: `alfareclame.nl`
3. Kies **Free plan** → Continue
4. Cloudflare scant bestaande DNS records — importeert wat er is
5. **Belangrijk:** Cloudflare geeft je **2 nameservers**, bv:
   ```
   adam.ns.cloudflare.com
   eva.ns.cloudflare.com
   ```
6. Log in bij je registrar (waar je het domein hebt geregistreerd)
7. Zoek **Nameserver wijzigen** / **DNS instellingen**
8. Verander naar de twee Cloudflare nameservers
9. Opslaan bij de registrar
10. Terug naar Cloudflare: **Check nameservers** (soms handmatig triggeren)

### 5.3. Custom domain in Pages project

1. Cloudflare dashboard → **Workers & Pages** → `alfareclame` project
2. Tab **Custom domains** → **Set up a custom domain**
3. Voer in: `alfareclame.nl`
4. Cloudflare voegt automatisch een `CNAME` record toe aan DNS
5. Voeg ook toe: `www.alfareclame.nl` (zelfde stap herhalen)

### 5.4. SSL certificaat

Cloudflare regelt dit automatisch. Na 5-15 minuten:
- HTTP → HTTPS redirect actief
- Green padlock 🔒 in browser
- A+ rating op https://www.ssllabs.com/ssltest/

### 5.5. www → naked redirect

1. Cloudflare dashboard → **Rules** → **Redirect Rules** → **Create rule**
2. Naam: `www to naked`
3. **When:** `(http.host eq "www.alfareclame.nl")`
4. **Then:** Static redirect
   - **URL:** `https://alfareclame.nl/${http.request.uri.path}`
   - **Status:** `301`
5. Deploy

Nu gaat `www.alfareclame.nl` automatisch naar `alfareclame.nl`.

---

## Stap 6 — Staging branch setup (optioneel maar aanbevolen)

Een staging branch laat je grote wijzigingen testen voor productie.

### 6.1. Staging branch aanmaken (lokaal)

```bash
git checkout -b staging
git push -u origin staging
```

### 6.2. Preview deployments

Cloudflare Pages deployt **automatisch elke branch** naar een preview URL.

- `main` → `alfareclame.nl`
- `staging` → `staging.alfareclame.pages.dev`
- `feature/*` → `feature-x.alfareclame.pages.dev`

Geen extra configuratie nodig — werkt out-of-the-box.

---

## Stap 7 — GitHub branch protection (belangrijk!)

Voorkom dat iemand (of jij per ongeluk) direct naar `main` pusht zonder de quality gates.

1. GitHub → je repo → **Settings** → **Branches**
2. **Add branch protection rule**
3. **Branch name pattern:** `main`
4. Vink aan:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
     - Voeg toe (na eerste CI run): `lighthouse`, `validate-html`, `seo-validation`, `image-size-check`, `link-check`, `validate-data`
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings** (ook voor jezelf)
5. **Save**

Nu is het **onmogelijk** om kapotte code naar productie te pushen.

---

## Stap 8 — GitHub Search Console koppelen

### 8.1. Google Search Console

1. https://search.google.com/search-console
2. Voeg property toe: **Domain property** → `alfareclame.nl`
3. Verifieer via DNS TXT record (Cloudflare Dashboard → DNS → Add record)
4. Na verificatie: **Sitemaps** → voeg toe: `sitemap.xml`

### 8.2. Bing Webmaster Tools

1. https://www.bing.com/webmasters
2. **Add a site** → `https://alfareclame.nl`
3. Verifieer via dezelfde DNS of URL-upload
4. Submit sitemap: `https://alfareclame.nl/sitemap.xml`

---

## Stap 9 — Day-to-day workflow (na setup)

### Kleine tekstwijziging

```bash
git checkout main
git pull
git checkout -b content/prijs-update
# ... wijzig index.html ...
git add index.html
git commit -m "content: update raambelettering prijs naar €159"
git push origin content/prijs-update
```

Open een PR op GitHub → wacht op quality gates (~3 min) → merge → live in 2 min.

### Nieuwe portfolio item

```bash
git checkout -b content/portfolio-nieuw-project
# 1. Upload foto naar public/images/portfolio/nieuwe-klant.jpg
# 2. Edit data/portfolio.json — voeg nieuw item toe
git add .
git commit -m "content: voeg portfolio item Nieuwe Klant toe"
git push origin content/portfolio-nieuw-project
# PR openen → CI checkt of image < 500KB → merge → live
```

### Grote redesign

```bash
git checkout -b design/nieuwe-hero
# ... wijzigingen ...
git push origin design/nieuwe-hero
# Cloudflare maakt: design-nieuwe-hero.alfareclame.pages.dev
# Deel URL met klanten voor feedback
# Bij akkoord: PR → merge → live
```

### Oeps, productie kapot!

```bash
git checkout main
git pull
git revert HEAD    # draai laatste commit terug
git push
# Live binnen 2 min met oude versie
```

---

## 🚨 Troubleshooting

### "git push" werkt niet — authenticatie faalt
- Gebruik Personal Access Token als wachtwoord (niet GitHub wachtwoord)
- Check: `git remote -v` — moet `https://github.com/...` tonen

### Cloudflare Pages deployt niet
- Check **Deployments** tab → zie laatste status
- Failed? Klik erop voor log
- Meestal: geen `index.html` in root, of foute build output directory

### Custom domain toont "DNS_PROBE_FINISHED_NXDOMAIN"
- Nameservers niet goed gezet bij registrar — kan 24u duren
- Test met: `dig alfareclame.nl NS` — moet Cloudflare tonen

### Lighthouse CI faalt
- Check de run log in GitHub Actions
- Meestal: performance < 80 door grote afbeelding
- Oplossing: image compressen (TinyPNG, Squoosh)

### Site is live maar Google toont het niet
- Geduld: 1-4 weken voor eerste indexatie
- Versnel via Search Console → URL Inspection → Request indexing
- Check dat `robots.txt` niet blokkeert: `curl https://alfareclame.nl/robots.txt`

---

## 📊 Post-launch checklist

### Dag 1
- [ ] Site live op `alfareclame.nl` met HTTPS
- [ ] Branch protection op `main` actief
- [ ] Google Search Console property toegevoegd
- [ ] Bing Webmaster Tools toegevoegd
- [ ] Sitemap gesubmit bij beide

### Week 1
- [ ] PageSpeed Insights score 90+ (zo niet: image compressen)
- [ ] Rich Results Test passed: https://search.google.com/test/rich-results
- [ ] Mobile-Friendly Test passed: https://search.google.com/test/mobile-friendly
- [ ] Schema validator clean: https://validator.schema.org/
- [ ] SSL Labs A+ rating: https://www.ssllabs.com/ssltest/
- [ ] Eerste backlinks plaatsen (Google Business Profile, social media)

### Maand 1
- [ ] Google Analytics / Plausible / Umami toevoegen
- [ ] Google Business Profile optimaliseren + foto's
- [ ] Eerste reviews verzamelen en in `reviews.json` zetten
- [ ] Facebook + Instagram actief houden (link naar site)
- [ ] 3-5 nieuwe portfolio items toevoegen

---

## 💬 Vragen?

- Technische vragen over deze guide → open een issue op GitHub
- Cloudflare-specifiek → https://community.cloudflare.com
- Algemene support → info@alfareclame.nl

**Succes met de launch!** 🚀
