#!/usr/bin/env node
// Counts inbound internal links per built page → reports orphan (0) and single (1).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SITE = join(process.cwd(), '_site');
function walk(d, o = []) {
  for (const e of readdirSync(d)) {
    const p = join(d, e), s = statSync(p);
    if (s.isDirectory()) walk(p, o);
    else if (e.endsWith('.html')) o.push(p);
  }
  return o;
}
const norm = u => (u.replace(/\/$/, '') || '/');
const urlOf = f => norm(('/' + relative(SITE, f).replace(/\\/g, '/')).replace(/index\.html$/, '').replace(/\.html$/, '/'));

const files = walk(SITE);
const pages = files.map(f => ({ u: urlOf(f), html: readFileSync(f, 'utf8') }));
const inb = new Map();
for (const p of pages) {
  const seen = new Set();
  for (const m of p.html.matchAll(/<a\s[^>]*href=["'](\/[^"'#?]*)/g)) {
    let h = norm(m[1].split('?')[0]);
    if (/\.(css|js|png|jpe?g|webp|avif|svg|ico|xml|txt|json|pdf|mp4|woff2?)$/i.test(h)) continue;
    if (h.startsWith('/public') || h.startsWith('/api')) continue;
    if (h === p.u) continue;
    seen.add(h);
  }
  for (const h of seen) inb.set(h, (inb.get(h) || 0) + 1);
}
const orphan = pages.filter(p => p.u !== '/' && !(inb.get(p.u) > 0)).map(p => p.u);
const single = pages.filter(p => inb.get(p.u) === 1).map(p => p.u);
console.log('ORPHAN (0 inbound):', orphan.length);
orphan.forEach(o => console.log('  ' + o));
console.log('\nSINGLE inbound (1):', single.length);
single.slice(0, 30).forEach(o => console.log('  ' + o));
