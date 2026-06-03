#!/usr/bin/env node
// Ground-truth SEO audit over built _site HTML. Maps Ahrefs categories to real files.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SITE = join(ROOT, '_site');
const BASE = 'https://www.alfareclame.nl';

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = walk(SITE);
const urlSet = new Set();
for (const f of files) {
  let rel = '/' + relative(SITE, f).replace(/\\/g, '/');
  rel = rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (rel === '') rel = '/';
  urlSet.add(rel);
  if (rel.endsWith('/')) urlSet.add(rel.slice(0, -1));
  else urlSet.add(rel + '/');
}
function assetExists(p) {
  const fp = join(SITE, p.replace(/^\//, '').split('?')[0].split('#')[0]);
  return existsSync(fp);
}

const redirectSources = new Map();
const redirFile = join(SITE, '_redirects');
if (existsSync(redirFile)) {
  for (const line of readFileSync(redirFile, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [from, to] = t.split(/\s+/);
    if (from) redirectSources.set(from, to);
  }
}

const attr = (html, re) => { const m = html.match(re); return m ? m[1] : null; };
// Displayed length: HTML entities (&amp; &mdash; &#9733; …) render as 1 char in SERP.
const dispLen = s => s.replace(/&[a-z]+;|&#\d+;/gi, 'x').trim().length;

const report = {
  titleTooLong: [], titleMissing: [],
  descMissing: [], descTooLong: [], descTooShort: [],
  noindex: [],
  htmlLangMissing: [], langHreflangMismatch: [],
  ogMissing: [], twitterMissing: [],
  brokenInternalLinks: {}, linksToRedirect: {},
  jsonldErrors: [],
  canonicalMissing: [],
};

for (const f of files) {
  const rel = '/' + relative(SITE, f).replace(/\\/g, '/');
  const html = readFileSync(f, 'utf8');

  const title = attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!title || !title.trim()) report.titleMissing.push(rel);
  else if (dispLen(title) > 60) report.titleTooLong.push(`${rel} (${dispLen(title)})`);

  const desc = attr(html, /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i);
  if (desc === null || !desc.trim()) report.descMissing.push(rel);
  else {
    const L = dispLen(desc);
    if (L > 160) report.descTooLong.push(`${rel} (${L})`);
    else if (L < 70) report.descTooShort.push(`${rel} (${L})`);
  }

  const robots = attr(html, /<meta\s+name=["']robots["']\s+content=["']([\s\S]*?)["']/i);
  if (robots && /noindex/i.test(robots)) report.noindex.push(`${rel} [${robots}]`);

  const htmlLang = attr(html, /<html[^>]*\slang=["']([^"']+)["']/i);
  if (!htmlLang) report.htmlLangMissing.push(rel);

  const hreflangs = [...html.matchAll(/<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']/gi)].map(m => m[1]);
  if (htmlLang && hreflangs.length) {
    const langBase = htmlLang.split('-')[0].toLowerCase();
    const hasMatch = hreflangs.some(h => h.toLowerCase() === 'x-default' || h.split('-')[0].toLowerCase() === langBase);
    if (!hasMatch) report.langHreflangMismatch.push(`${rel} lang=${htmlLang} hreflang=[${hreflangs.join(',')}]`);
  }

  if (!/property=["']og:title["']/i.test(html)) report.ogMissing.push(rel);
  if (!/name=["']twitter:card["']/i.test(html)) report.twitterMissing.push(rel);
  if (!/rel=["']canonical["']/i.test(html)) report.canonicalMissing.push(rel);

  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1].trim()); }
    catch (e) { report.jsonldErrors.push(`${rel}: ${e.message.slice(0, 80)}`); }
  }

  const broken = [], toRedir = [];
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)) {
    let href = m[1];
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    if (href.startsWith('http')) {
      if (!href.startsWith(BASE) && !href.startsWith('https://alfareclame.nl')) continue;
      href = href.replace(BASE, '').replace('https://alfareclame.nl', '') || '/';
    }
    if (!href.startsWith('/')) continue;
    const clean = href.split('?')[0].split('#')[0];
    const noSlash = clean.replace(/\/$/, '') || '/';
    if (redirectSources.has(clean)) { toRedir.push(href); continue; }
    if (/\.(css|js|png|jpe?g|webp|avif|svg|ico|xml|txt|pdf|json|webmanifest|woff2?)$/i.test(clean)) {
      if (!assetExists(clean)) broken.push(href);
    } else {
      if (!urlSet.has(clean) && !urlSet.has(noSlash) && !urlSet.has(noSlash + '/')) broken.push(href);
    }
  }
  if (broken.length) report.brokenInternalLinks[rel] = [...new Set(broken)];
  if (toRedir.length) report.linksToRedirect[rel] = [...new Set(toRedir)];
}

const sum = (label, arr) => `${label}: ${arr.length}`;
console.log('=== SEO AUDIT (built _site) ===');
console.log(sum('title>60', report.titleTooLong));
console.log(sum('title missing', report.titleMissing));
console.log(sum('desc missing/empty', report.descMissing));
console.log(sum('desc>160', report.descTooLong));
console.log(sum('desc<70', report.descTooShort));
console.log(sum('noindex pages', report.noindex));
console.log(sum('html lang missing', report.htmlLangMissing));
console.log(sum('lang/hreflang mismatch', report.langHreflangMismatch));
console.log(sum('OG missing', report.ogMissing));
console.log(sum('twitter missing', report.twitterMissing));
console.log(sum('canonical missing', report.canonicalMissing));
console.log(sum('JSON-LD parse errors', report.jsonldErrors));
console.log('pages w/ broken internal links: ' + Object.keys(report.brokenInternalLinks).length);
console.log('pages linking to redirect src: ' + Object.keys(report.linksToRedirect).length);

const arg = process.argv[2];
if (arg) console.log('\n=== DETAIL: ' + arg + ' ===\n' + JSON.stringify(report[arg], null, 2));
