# Security Policy

## 🔒 Security Disclosure

Alfa Reclame neemt de veiligheid van haar website en klantgegevens serieus. Als u een kwetsbaarheid ontdekt, willen we dat graag weten.

## Hoe kwetsbaarheden melden

**Meld geen security issues via publieke GitHub issues.**

Stuur een e-mail naar: **info@alfareclame.nl**

Geef in uw melding aan:
- Type kwetsbaarheid (XSS, injection, CSRF, data exposure, etc.)
- Stappen om te reproduceren
- Potentiële impact
- Eventuele voorgestelde mitigatie

## Response tijd

- **Bevestiging van ontvangst:** binnen 48 uur
- **Eerste analyse:** binnen 5 werkdagen
- **Fix of update:** afhankelijk van ernst, doorgaans binnen 14 dagen

## Scope

**In scope:**
- `alfareclame.nl` (production site)
- `*.alfareclame.pages.dev` (preview deployments)
- Deze GitHub repository

**Out of scope:**
- Social engineering
- Physical attacks
- Third-party services (Cloudflare, WhatsApp, Google Fonts)
- DoS / volumetric attacks

## Disclosure beleid

Wij hanteren **coordinated disclosure** — eerst wordt het probleem opgelost, daarna kunt u publiceren. We waarderen responsible disclosure.

## Veiligheidsmaatregelen

Deze site implementeert:
- HTTPS-only (HSTS met 2 jaar, preload)
- Strict Content Security via headers
- Geen tracking cookies
- Geen localStorage/sessionStorage met gevoelige data
- Externe links via `rel="noopener noreferrer"`
- Security.txt volgens [RFC 9116](https://tools.ietf.org/html/rfc9116)

Zie `.well-known/security.txt` voor de actuele security contact.
