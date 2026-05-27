# A/B Test Weekly Report — Template

## Test metadata

| Field | Value |
|---|---|
| Test name | `hero-cta-variant` |
| Start date | YYYY-MM-DD |
| End date | YYYY-MM-DD |
| Test page | `/` (homepage) |
| Split | 50 / 50 |
| Cookie | `ab_variant` (30-day, `SameSite=Lax`) |
| Tracking endpoint | `/api/track-click` (beacon, console.log) |

---

## Hypothesis

**If** we show visitors a price-calculator CTA ("Bereken zelf je prijs") instead of the default offerte CTA ("Vraag gratis offerte"), **then** click-through rate to conversion pages will increase, **because** lower-commitment actions reduce friction for first-time visitors.

---

## Variant A — Control

**CTA text:** Vraag gratis offerte
**Destination:** `/offerte/`
**Description:** Classic conversion CTA. Direct, high-intent. Requires user to commit to a contact form.

| Metric | Value |
|---|---|
| Impressions | ___ |
| Clicks | ___ |
| CTR | ___% |
| Offerte completions (downstream) | ___ |

---

## Variant B — Treatment

**CTA text:** Bereken zelf je prijs
**Destination:** `/prijs-calculator/`
**Description:** Lower-friction CTA. Tool-first flow before commitment.

| Metric | Value |
|---|---|
| Impressions | ___ |
| Clicks | ___ |
| CTR | ___% |
| Calculator completions (downstream) | ___ |

---

## Delta + significance

**CTR delta:** B - A = ___pp
**Relative lift:** ___% uplift (or decline)

### Manual significance check (proportions z-test)

```
p_A = clicks_A / impressions_A
p_B = clicks_B / impressions_B
p_pool = (clicks_A + clicks_B) / (impressions_A + impressions_B)
SE = sqrt(p_pool * (1 - p_pool) * (1/n_A + 1/n_B))
z = (p_B - p_A) / SE

z > 1.96  -> significant at 95% confidence
z > 2.58  -> significant at 99% confidence
```

**Calculated z:** ___
**Significant at 95%?** YES / NO

---

## Recommendation

- [ ] Declare winner: Variant ___
- [ ] Ship winner to 100% (update `index.njk`, remove A/B wrapper)
- [ ] Archive losing variant in `data/ab-test-results.jsonl`
- [ ] Reset test for next hypothesis

---

## Notes

_Add any anomalies, segment findings, or qualitative observations here._

---

_Template maintained by Alfa Reclame. Data source: CF wrangler tail -> `data/ab-test-results.jsonl`._
