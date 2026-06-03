#!/usr/bin/env node
// One-off: regional DE/EN translation pages wrongly declared nl-NL -> the BASE
// NL service page, colliding with the base translation (two translations -> one
// NL is invalid hreflang). Repoint each to its matching regional NL page.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FIX = [
  ['de/fahrzeugbeschriftung-rotterdam-zuid', '/autoreclame-rotterdam/', '/autoreclame-zuid-rotterdam/'],
  ['en/vehicle-wraps-rotterdam-zuid', '/autoreclame-rotterdam/', '/autoreclame-zuid-rotterdam/'],
  ['de/fassadenwerbung-rotterdam-kralingen', '/gevelreclame-rotterdam/', '/gevelreclame-kralingen-rotterdam/'],
  ['en/facade-signage-rotterdam-kralingen', '/gevelreclame-rotterdam/', '/gevelreclame-kralingen-rotterdam/'],
  ['de/fensterbeschriftung-rotterdam-noord', '/raambelettering-rotterdam/', '/raambelettering-noord-rotterdam/'],
  ['en/window-graphics-rotterdam-noord', '/raambelettering-rotterdam/', '/raambelettering-noord-rotterdam/'],
  ['de/fensterbeschriftung-rotterdam-centrum', '/raambelettering-rotterdam/', '/raambelettering-centrum-rotterdam/'],
  ['en/window-graphics-rotterdam-centrum', '/raambelettering-rotterdam/', '/raambelettering-centrum-rotterdam/'],
  ['de/leuchtreklame-rotterdam-prins-alexander', '/lichtreclame-rotterdam/', '/lichtreclame-prins-alexander-rotterdam/'],
  ['en/illuminated-signs-rotterdam-prins-alexander', '/lichtreclame-rotterdam/', '/lichtreclame-prins-alexander-rotterdam/'],
];

for (const [dir, oldUrl, newUrl] of FIX) {
  const f = `${dir}/index.njk`;
  if (!existsSync(f)) { console.log(`MISSING ${f}`); continue; }
  let t = readFileSync(f, 'utf8');
  const needle = `href: "https://alfareclame.nl${oldUrl}"`;
  const repl = `href: "https://alfareclame.nl${newUrl}"`;
  const n = t.split(needle).length - 1;
  if (n === 0) { console.log(`NOHIT ${f}`); continue; }
  t = t.split(needle).join(repl);
  writeFileSync(f, t);
  console.log(`FIXED ${f} (${n}x ${oldUrl} -> ${newUrl})`);
}
