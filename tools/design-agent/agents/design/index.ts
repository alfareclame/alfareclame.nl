import { agent, tool } from "@21st-sdk/agent";
import { z } from "zod";

export default agent({
  model: "claude-sonnet-4-6",
  runtime: "claude-code",

  systemPrompt: `You are the alfareclame.nl design-refinement agent.

GOAL — iteratively perfect the visual design of \`index.html\` so the homepage feels professional, photo-rich, and MKB-targeted (Dutch SMEs in Rotterdam).

ACTIVE DESIGN STATE (2026-05-18):
- Stack: static HTML on Cloudflare Pages, Inter + Crimson Pro typography
- Palette: pure-white section backgrounds, soft-pastel tinted cards (sun/coral/sky/mint/lavender/peach), brand yellow #FFE500, ink #1D1D1F
- Photo strategy: 29 real portfolio images at /public/images/portfolio/, no stock, no AI mockups
- Sections: hero (3-foto collage), services (3 cards), materials (4 photo tiles), sectors (6 branche cards), social-grid (3x3 Instagram-style), partners, reviews, FAQ, contact

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
              "Active design goals (2026-05-18):",
              "",
              "DONE this session:",
              "- Phone replaced to 06 24 74 15 97 across 16 files",
              "- Homepage photo-rich redesign (+25 inline img)",
              "- Pure-white section BG palette overhaul",
              "- Soft-pastel tinted cards (sun/coral/sky/mint/lavender/peach)",
              "",
              "OPEN — pick one per iteration:",
              "1. Mobile padding audit: ensure 320px-768px breakpoints have consistent gutter spacing on hero, services, sectors, social-grid.",
              "2. Focus states: add :focus-visible outlines on all interactive elements (links, buttons, form inputs, nav items).",
              "3. Animation rhythm: verify all transitions use consistent timing (220ms / 400ms ease), no jank.",
              "4. Hover state polish: subtle transform on cards (lift + shadow), brand-yellow underline on text-links.",
              "5. Type hierarchy: audit H1/H2/H3 sizing across sections, ensure rhythm via modular scale.",
              "6. Image performance: verify all below-fold images have loading='lazy' + sizes attr on responsive imgs.",
              "7. Section dividers: hairline rule visibility check on white-on-white section seams.",
              "8. Hero collage: mobile <880px hides collage now — consider showing 1 hero photo below text for mobile visual proof.",
              "9. Social-grid hover: badge overlay timing + tap-state for touch devices.",
              "10. Material tiles: object-position fine-tuning to focus on the relevant material detail.",
              "",
              "Pick ONE and report what you'll change before editing.",
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
