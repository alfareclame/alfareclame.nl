# Sprint 14 — content depth + Web Stories + push + install-prompt + perf (K1+K2+K3+K4+K5)

**Date:** 2026-05-28
**Trigger:** Sprint 13 deployed. User picked Yol A (code continue, accepting diminishing returns). Honest acknowledgement: real AI-rank validation pending (no API keys), off-site authority gated on user-action.
**Scope:** K1 full content depth EN+DE top 5 / K2 Web Stories 5 / K3 push notifications / K4 install-prompt banner / K5 perf audit
**User-aksiyonu:** 0 voor K1+K2+K4+K5; K3 push aktivasyonu opsiyonel 5dk VAPID secret.

## Baseline (post-Sprint 13)
- 215 sitemap URLs, ~225 .njk pages, 585-line llms.txt
- 8 sitemap, PWA installable, 5 PDF langs, 4 API
- Schema cascade + Position-Zero markup

## K1. Full content depth EN+DE top 5 dienst (10 page expansion)

EN ~700w stub → ~2000w (match NL): window-graphics, vehicle-wraps, facade-signage, illuminated-signs, channel-letters (verify slugs).
DE ~700w → ~2000w: fensterbeschriftung, fahrzeugbeschriftung, fassadenwerbung, leuchtreklame, profilbuchstaben (verify slugs).

Per page: read NL equivalent, translate full body section-by-section. Preserve front-matter (description if too short → update), extend JSON-LD FAQ, layout/structure (BLUF + intro + materials + applications + sectors + price-tiers + werkwijze + maintenance + FAQ + cases + closing-CTA). Real product-names (3M/Avery/Hexis) stay same; industry-standard EN/DE technical terms.

## K2. Web Stories AMP (5)

5 AMP-Story HTML at `/stories/{slug}/index.html`:
- raambelettering / autoreclame / gevelreclame / lichtreclame / doosletters

Each: `<amp-story standalone>` 5-8 panels 9:16, cover/title + 5-6 fact-panels + CTA panel, animations subtle, JSON-LD AmpStory, AMP boilerplate + amp-story script. `sitemap-stories.xml` separate. `sitemap-index.xml` update.

## K3. Push notifications (opt-in)

### K3.1 VAPID keypair
Generate via web-push or Node crypto. Public inline-committed. Private = user-action CF Pages secret `VAPID_PRIVATE_KEY` (5 min, optional).

### K3.2 `functions/api/push-subscribe.js`
POST `{endpoint, keys:{p256dh, auth}}`. Validate. Store via Telegram alert (no DB MVP).

### K3.3 `functions/api/push-send.js`
POST `{title, body, url}`. Admin-only `X-Admin-Token` header. MVP — limited without subscription store.

### K3.4 SW push handler
`service-worker.js` extend: `push` event → `showNotification`, `notificationclick` → `openWindow`.

### K3.5 Opt-in UI
Homepage + cheatsheet: "Krijg notificaties" button → `Notification.requestPermission()` → `pushManager.subscribe()` → POST subscribe.

## K4. PWA install-prompt smart banner

`beforeinstallprompt` capture, deferredPrompt store, 30s on-site delay, bottom-right banner, dismissable 30d localStorage. iOS no beforeinstallprompt → alternative modal "Voeg toe aan beginscherm" instructions. `appinstalled` event → `/api/track-click` beacon `pwa_installed`.

## K5. Perf audit + fixes 20 high-traffic pages

### K5.1 LCP fetchpriority
Cover Sprint 11/12 deferred: kennisbank, prijs-calculator, cheatsheet, tarieven, materialen, werkwijze, blog hub, video hub, faq, vraag-en-antwoord + 10 recent blog/video. Add `fetchpriority="high"` + verify `loading="eager"` + width/height.

### K5.2 Resource hints depth
`_includes/head.njk`: preconnect wa.me + maps.app.goo.gl verified. Add: github.com, schema.org. Audit-remove unused.

### K5.3 Critical CSS audit
Sprint 11 ~3.3KB inline. Consider add `.bluf-answer` + `.hero` styles inline (used 30+ pages above-fold). Strict 5KB ceiling.

### K5.4 SW cache invalidation
Verify CACHE_VERSION bump invalidates correctly.

## Architecture / Risk

- K1 translation accuracy: keep product-names + industry-standard tech terms
- K2 AMP validation: spot-check amp.dev/validator
- K3 push limited without subscription store (documented)
- K4 30s delay + dismiss-permanent — not annoying
- K5 CSS inline ceiling 5KB

## Done Definition

- 10 EN/DE pages expanded (K1)
- 5 Web Stories + sitemap-stories.xml (K2)
- push-subscribe + push-send + SW handler + opt-in UI (K3)
- Install-prompt banner + iOS modal (K4)
- 20 pages fetchpriority audit + resource hints (K5)
- Sitemap 215 → 220+
- Build clean + IndexNow + smoke
- Memory updated

## Out of Scope (Sprint 15)

- WhatsApp Business (excluded)
- A/B persistent CF D1 (user-binding)
- Image CDN (paid)
- Newsletter Brevo (creds)
- Custom GPT publish (user-action)
- Real review-velocity automation
- LibreTranslate self-host
- Full subscription store push broadcast (CF KV/D1)
