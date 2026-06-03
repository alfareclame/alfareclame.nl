#!/usr/bin/env node
// Diagnostic: verify hreflang reciprocity over built _site HTML.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const SITE = '_site';
function walk(d, o = []) { for (const e of readdirSync(d)) { const p = join(d, e); const s = statSync(p); if (s.isDirectory()) walk(p, o); else if (e.endsWith('.html')) o.push(p); } return o; }
const alts = {};
for (const f of walk(SITE)) {
  const h = readFileSync(f, 'utf8');
  const a = [...h.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(m => ({ hl: m[1], href: m[2] }));
  if (a.length > 1) { const rel = relative(SITE, f).replace(/\\/g, '/').replace(/index\.html$/, ''); alts['https://alfareclame.nl/' + rel] = a; }
}
let missing = 0, checked = 0;
for (const [u, a] of Object.entries(alts)) for (const x of a) {
  if (x.hl === 'x-default' || x.href === u) continue; checked++;
  const t = alts[x.href];
  if (!t || !t.some(y => y.href === u)) { missing++; if (missing <= 12) console.log('NO RETURN:', u, '->', x.href); }
}
console.log('\nhreflang pairs checked:', checked, 'missing reciprocal:', missing, '| clusters:', Object.keys(alts).length);
