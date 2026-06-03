#!/usr/bin/env node
// One-off: make hreflang clusters reciprocal across the INDEXABLE locales only.
// DE/EN pages define clusters (nl/en/de + sometimes noindex pl/tr). pl/tr are
// noindex thin pages, so they must NOT appear in hreflang. This rewrites the
// `alternates:` block on every nl/en/de cluster member to the filtered set
// {nl-NL, en, de} + x-default(nl), guaranteeing bidirectional return tags.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://alfareclame.nl';
const DROP = /\/(pl|tr)\//; // noindex locales — exclude from hreflang

function parseAlternates(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const i = lines.findIndex(l => /^alternates:\s*$/.test(l));
  if (i === -1) return [];
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^\S/.test(lines[j])) break;
    const hm = lines[j].match(/hreflang:\s*"?([^"]+)"?/);
    const fm = lines[j].match(/href:\s*"?([^"]+)"?/);
    if (hm) out.push({ hreflang: hm[1].trim(), href: null });
    if (fm && out.length) out[out.length - 1].href = fm[1].trim();
  }
  return out.filter(a => a.href);
}

function transFiles() {
  const out = [];
  for (const lang of ['de', 'en']) {
    if (!existsSync(lang)) continue;
    for (const d of readdirSync(lang, { withFileTypes: true }))
      if (d.isDirectory() && existsSync(join(lang, d.name, 'index.njk'))) out.push(join(lang, d.name, 'index.njk'));
    if (existsSync(join(lang, 'index.njk'))) out.push(join(lang, 'index.njk'));
  }
  return out;
}

// cluster keyed by nl href -> Map(hreflang -> href), indexable locales only
const clusters = new Map();
for (const f of transFiles()) {
  const alts = parseAlternates(readFileSync(f, 'utf8')).filter(a => !DROP.test(a.href) && a.hreflang.toLowerCase() !== 'x-default');
  const nl = alts.find(a => a.hreflang.toLowerCase().startsWith('nl'));
  if (!nl) continue;
  if (!clusters.has(nl.href)) clusters.set(nl.href, new Map());
  const c = clusters.get(nl.href);
  for (const a of alts) c.set(a.hreflang, a.href);
}

function urlToSource(href) {
  const p = href.replace(BASE, '').replace(/^\//, '').replace(/\/$/, '');
  return p === '' ? 'index.njk' : join(p, 'index.njk');
}

function block(map, nlHref, eol) {
  const order = [...map.entries()].sort((a, b) => {
    const rank = h => (h.toLowerCase().startsWith('nl') ? 0 : h === 'en' ? 1 : h === 'de' ? 2 : 3);
    return rank(a[0]) - rank(b[0]);
  });
  const out = ['alternates:'];
  for (const [hl, href] of order) out.push(`  - hreflang: "${hl}"`, `    href: "${href}"`);
  out.push('  - hreflang: "x-default"', `    href: "${nlHref}"`);
  return out.join(eol);
}

function writeAlternates(src, map, nlHref) {
  if (!existsSync(src)) { console.log(`MISSING ${src}`); return false; }
  const txt = readFileSync(src, 'utf8');
  const eol = txt.includes('\r\n') ? '\r\n' : '\n';
  const lines = txt.split(/\r?\n/);
  const start = lines.findIndex(l => /^alternates:\s*$/.test(l));
  const newBlock = block(map, nlHref, eol).split(eol);
  if (start !== -1) {
    let end = start + 1;
    while (end < lines.length && /^\s/.test(lines[end])) end++;
    lines.splice(start, end - start, ...newBlock);
  } else {
    let ci = lines.findIndex(l => /^canonical:/.test(l));
    if (ci === -1) ci = lines.findIndex(l => /^permalink:/.test(l));
    if (ci === -1) ci = lines.findIndex(l => /^(layout|title):/.test(l));
    if (ci === -1) { console.log(`NO ANCHOR ${src}`); return false; }
    lines.splice(ci + 1, 0, ...newBlock);
  }
  writeFileSync(src, lines.join(eol));
  return true;
}

let n = 0;
for (const [nlHref, map] of clusters) {
  // every indexable member (nl + each href in map) gets the same set
  const members = new Set([nlHref, ...map.values()]);
  for (const href of members) {
    if (writeAlternates(urlToSource(href), map, nlHref)) { n++; console.log(`SET ${urlToSource(href)} (${map.size + 1} alts)`); }
  }
}
console.log(`\n${n} pages written across ${clusters.size} clusters`);

// Strip alternates from noindex pl/tr pages — they must not emit hreflang.
let stripped = 0;
for (const lang of ['pl', 'tr']) {
  if (!existsSync(lang)) continue;
  const dirs = readdirSync(lang, { withFileTypes: true });
  const files = [join(lang, 'index.njk'), ...dirs.filter(d => d.isDirectory()).map(d => join(lang, d.name, 'index.njk'))];
  for (const f of files) {
    if (!existsSync(f)) continue;
    const txt = readFileSync(f, 'utf8');
    const eol = txt.includes('\r\n') ? '\r\n' : '\n';
    const lines = txt.split(/\r?\n/);
    const start = lines.findIndex(l => /^alternates:\s*$/.test(l));
    if (start === -1) continue;
    let end = start + 1;
    while (end < lines.length && /^\s/.test(lines[end])) end++;
    lines.splice(start, end - start);
    writeFileSync(f, lines.join(eol));
    stripped++;
  }
}
console.log(`${stripped} pl/tr pages stripped of hreflang`);
