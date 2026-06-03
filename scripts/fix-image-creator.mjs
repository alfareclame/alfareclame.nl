#!/usr/bin/env node
// One-off: GSC "creator invalid object type" on ImageObject. The creator used a
// dangling @id reference (#eigenaar) Google can't resolve for image metadata.
// Replace with an inline Organization object per Google's image-metadata spec.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OLD = '"creator": {"@id": "https://alfareclame.nl/over-ons/#eigenaar"}';
const NEW = '"creator": {"@type": "Organization", "name": "Alfa Reclame Rotterdam", "url": "https://alfareclame.nl/"}';

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (['node_modules', '_site', '.git'].includes(e)) continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (e.endsWith('.njk')) out.push(p);
  }
  return out;
}

let files = 0, repl = 0;
for (const f of walk(process.cwd())) {
  const t = readFileSync(f, 'utf8');
  const n = t.split(OLD).length - 1;
  if (n === 0) continue;
  writeFileSync(f, t.split(OLD).join(NEW));
  files++; repl += n;
  console.log(`FIXED ${f.replace(process.cwd(), '.')} (${n}x)`);
}
console.log(`\n${repl} ImageObject creators in ${files} files`);
