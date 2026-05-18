import { agent, tool } from "@21st-sdk/agent";
import { z } from "zod";

export default agent({
  model: "claude-sonnet-4-6",
  runtime: "claude-code",

  systemPrompt: `You are the alfareclame.nl design-refinement agent. Your job is to enforce and refine the brand HUISSTIJL (corporate visual identity) across the homepage and gradually across landing pages.

GOAL — keep visuals strictly aligned with the Alfa Reclame logo: black-dominant, brand-yellow accent only, no off-brand pastels.

ACTIVE DESIGN STATE (2026-05-18):
- Stack: static HTML on Cloudflare Pages, Inter + Crimson Pro typography
- Logo: AR monogram in striped/parallel-line letterforms, ALFA RECLAME bold rounded sans, tagline "Your Print & Sign Partner" italic serif on black bar, yellow triangle inside the A
- Photo strategy: 29 real portfolio images at /public/images/portfolio/, no stock, no AI mockups
- Sections: hero (3-foto collage), services (3 cards), materials (4 photo tiles), sectors (6 branche cards), social-grid (3x3), partners, reviews, FAQ, contact

HUISSTIJL RULES — hard, never violate:
1. PALETTE: black #000 (or near-black --ink #1D1D1F), brand yellow #FFE500, white #FFF — that's it. Greys #FAFAFA, #F5F5F7 allowed for surface tints only.
2. NO pastel card tints (sun/coral/sky/mint/lavender/peach). They violate the 3-color logo palette. Migrate cards to: white BG + 1px black hairline border + hover yellow accent.
3. YELLOW TRIANGLE accent — signature decorative element from logo. Use sparingly in exactly these 4 places:
   a) H2 .section-title prefix: small yellow triangle 12-16px before title text (clip-path)
   b) Service/sector card corner ribbon: small yellow triangle in top-right corner of each card (CSS clip-path)
   c) Primary CTA button hover: yellow triangle reveal animation from left edge
   d) Hero eyebrow text: small yellow triangle badge inline with the eyebrow line
4. PARALLEL LINE motif — from the logo letterforms. Use as:
   - Section divider stripes (3 thin parallel lines, decorative)
   - Heading underline accent on key H2s
   - Card hover stripe on bottom edge
5. CARD STYLE: white BG, 1px solid #1D1D1F border, 12-14px border-radius, hover lifts -4px + yellow corner triangle highlights + bottom stripe slides in
6. TYPOGRAPHY: keep Inter for headings (heavy/bold weights), Crimson Pro italic for taglines/quotes only. Match logo's tagline italic-serif tone.
7. DARK SECTIONS (manifest, over-alp, industrieel, footer): keep black --ink BG, add yellow accent text on key phrases mimicking logo's black-bar tagline.

PROCESS:
1. Read /index.html and audit ONE specific design concern (spacing, hierarchy, hover states, focus indicators, mobile breakpoints, animation rhythm, contrast, etc.)
2. Propose a focused improvement in plain language
3. Apply via Edit tool — surgical, minimal diff
4. Verify with git diff --stat
5. Commit + push (use \`gh auth switch --user alfareclame\` if needed before first push)
6. Submit IndexNow ping after each push: POST https://api.indexnow.org/IndexNow with key c80c952b77275971494670c168fd7c7e5b2affa21d357bba74042b4082dd768d and urlList ["https://alfareclame.nl/"]
7. Loop until budget exhausted

HARD CONSTRAINTS — never violate:
- Site is static HTML — no React, no build pipeline, no new bundler
- Preserve all <script type="application/ld+json"> blocks and meta tags
- Preserve phone number +31 6 24 74 15 97 / +31624741597 / 31624741597 (do NOT revert)
- Preserve all <img loading="lazy" decoding="async"> + width/height attrs
- Maintain Lighthouse: a11y >= 90, perf >= 80, SEO >= 95
- All CSS in existing <style> block — no new <style> tags
- No stock photos, no AI-generated assets — only /public/images/portfolio/* and /public/images/raambelettering/*
- Never run \`git push --force\`, \`git reset --hard\`, or destructive ops without explicit owner approval

DESIGN PRINCIPLES:
- Apple-style minimalism: generous whitespace, type rhythm, restrained chrome
- Photo-first: real portfolio shots carry the brand
- Pastel cards provide visual variety against white sections
- Yellow accent is rare + intentional (CTA, hover, brand moment)
- Dark sections (manifest, over-alp, industrieel) provide cadence — don't flatten them
- Mobile-first: ensure 320px+ usability

REPORT after each successful iteration: one-line summary of what changed and why.`,

  permissionMode: "bypassPermissions",
  maxTurns: 30,
  maxBudgetUsd: 2,

  tools: {
    getDesignGoals: tool({
      description:
        "Returns the active design refinement goals for the current iteration. Call once at the start of each session.",
      inputSchema: z.object({}),
      execute: async () => ({
        content: [
          {
            type: "text",
            text: [
              "Active design goals (2026-05-18) — HUISSTIJL FIRST priority:",
              "",
              "DONE earlier:",
              "- Phone replaced 06 24 74 15 97 across 16 files",
              "- Homepage photo-rich redesign (+25 inline img)",
              "- Form direct-submit + Brevo email integration",
              "- Focus rings, hover lift, mobile hero, type rhythm pass",
              "",
              "HUISSTIJL OPEN — pick one per iteration:",
              "H1. Pastel-to-monochrome migration: replace all --tint-* card backgrounds with white #FFF + 1px solid #1D1D1F border + 14px radius. Keep card content layout intact. Update both service-card and sector cards.",
              "H2. Yellow triangle accent on .section-title: add ::before pseudo-element with clip-path triangle, fill #FFE500, size 14px, gap 12px before text.",
              "H3. Card corner ribbon: add ::after pseudo-element with clip-path triangle in top-right of every card (service-card, sector, material-tile, social-grid .tile), 24x24 size, fill #FFE500.",
              "H4. Parallel line section divider: replace current border-top hairlines with a 3-line stripe motif (3 horizontal lines spaced 4px, height 1px, color #1D1D1F at 8% opacity) — mimics logo letterform striping.",
              "H5. Primary CTA hover: yellow triangle reveal animation from left edge on .btn-primary, .form-submit, etc. Use transform/clip-path transition 280ms.",
              "H6. Hero eyebrow badge: small yellow triangle next to '— Reclamebureau · Rotterdam · sinds 2012' eyebrow line.",
              "H7. Dark-section yellow accent text: in .manifest, .over-alp, .industrieel sections highlight one keyphrase per H2 in #FFE500 (mimicking the logo's tagline yellow-on-black moments).",
              "H8. Heading underline stripe: on key H2 (services, sectors, contact) add a 3-parallel-line accent under the title (logo letterform motif).",
              "",
              "POLISH OPEN — after huisstijl migration:",
              "P1. Mobile padding audit 320-768px gutters.",
              "P2. Animation timing consistency (220/280/400ms ease).",
              "P3. Type modular scale H1/H2/H3 rhythm.",
              "P4. Image sizes attr on responsive imgs.",
              "P5. Material tiles object-position fine-tuning.",
              "",
              "PICK ONE (start with H-prefix items). Report what you'll change before editing.",
            ].join("\n"),
          },
        ],
      }),
    }),

    getPortfolioInventory: tool({
      description:
        "Lists the 29 portfolio photos available at /public/images/portfolio/ with their primary signage category. Use this when assigning images to new sections — never invent a path.",
      inputSchema: z.object({}),
      execute: async () => ({
        content: [
          {
            type: "text",
            text: [
              "Portfolio photos (29 files at /public/images/portfolio/):",
              "",
              "Raambelettering / etalage:",
              "  yohnny-cake.jpg, aras-partners.jpg, dermamedi-lijn.jpg, kantoor-kaplan.jpg,",
              "  rondo.jpg, tabakshop-oudedijk.jpg, istanbul-reisbureau.jpg, istanbul-reisbureau-montage.jpg",
              "",
              "Autoreclame / fleet:",
              "  i-bo-warmte-techniek.jpg, cc-cable-communication.jpg, oranje-stucadoor.jpg,",
              "  fietswinkel-rotterdam.jpg, sowieso-geslaagd.jpg",
              "",
              "Gevelreclame / lichtbak / 3D:",
              "  benjamin-furniture.jpg, yilmaz-havalem.jpg, il-mare-pizzeria.jpg,",
              "  de-groene-tuin.jpg, diamor-jewellery.jpg, garage-rijnmond.jpg",
              "",
              "Grootformaat / industrieel:",
              "  barge-master.jpg, barge-master-detail.jpg, barge-master-container.jpg,",
              "  iop-silo.jpg, iop-silo-detail.jpg, iop-silo-montage.jpg,",
              "  bouwcontainers.jpg, bouwcontainers-2.jpg, sancak-banners.jpg, sancak-sv-besiktas.jpg",
            ].join("\n"),
          },
        ],
      }),
    }),
  },
});
