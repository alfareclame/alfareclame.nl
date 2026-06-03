#!/usr/bin/env node
// One-off: add meta description + Open Graph + Twitter Card tags to AMP web
// stories (raw HTML, not using base.njk). Inserts after the canonical link.
import { readFileSync, writeFileSync } from 'node:fs';

const STORIES = {
  autoreclame: {
    title: 'Autoreclame Rotterdam — Visuele Gids | Alfa Reclame',
    desc: 'Visuele gids over autoreclame en wraps in Rotterdam: cast vs calendered vinyl, partial vs full wrap en kosten. Bekijk de web story van Alfa Reclame.',
    image: 'https://alfareclame.nl/public/images/portfolio/cc-cable-communication.webp',
  },
  doosletters: {
    title: 'Doosletters Rotterdam — Visuele Gids | Alfa Reclame',
    desc: 'Visuele gids over doosletters in Rotterdam: frontlit vs halo-lit LED, materialen en uitstraling. Bekijk de web story van Alfa Reclame.',
    image: 'https://alfareclame.nl/public/images/portfolio/benjamin-furniture.webp',
  },
  gevelreclame: {
    title: 'Gevelreclame Rotterdam — Visuele Gids | Alfa Reclame',
    desc: 'Visuele gids over gevelreclame in Rotterdam: lichtbakken, doosletters en gevelplaten. Bekijk de web story van Alfa Reclame.',
    image: 'https://alfareclame.nl/public/images/portfolio/benjamin-furniture.webp',
  },
  lichtreclame: {
    title: 'Lichtreclame Rotterdam — Visuele Gids | Alfa Reclame',
    desc: 'Visuele gids over lichtreclame in Rotterdam: LED-lichtbakken, energieverbruik en onderhoud. Bekijk de web story van Alfa Reclame.',
    image: 'https://alfareclame.nl/public/images/portfolio/yilmaz-havalem.webp',
  },
  raambelettering: {
    title: 'Raambelettering Rotterdam — Visuele Gids | Alfa Reclame',
    desc: 'Visuele gids over raambelettering in Rotterdam: folietypes, frosted glas en toepassingen. Bekijk de web story van Alfa Reclame.',
    image: 'https://alfareclame.nl/public/images/portfolio/yohnny-cake.webp',
  },
};

for (const [slug, s] of Object.entries(STORIES)) {
  const file = `stories/${slug}/index.html`;
  let html = readFileSync(file, 'utf8');
  const url = `https://alfareclame.nl/stories/${slug}/`;
  if (html.includes('property="og:title"')) { console.log(`SKIP already ${slug}`); continue; }
  const canonical = `<link rel="canonical" href="${url}">`;
  if (!html.includes(canonical)) { console.log(`SKIP no-canonical ${slug}`); continue; }
  const block = `${canonical}
  <meta name="description" content="${s.desc}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Alfa Reclame">
  <meta property="og:title" content="${s.title}">
  <meta property="og:description" content="${s.desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${s.image}">
  <meta property="og:locale" content="nl_NL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${s.title}">
  <meta name="twitter:description" content="${s.desc}">
  <meta name="twitter:image" content="${s.image}">`;
  html = html.replace(canonical, block);
  writeFileSync(file, html);
  console.log(`FIXED ${slug} (desc ${s.desc.length} chars)`);
}
