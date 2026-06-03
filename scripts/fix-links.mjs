#!/usr/bin/env node
// One-off: repoint dead internal hrefs to their real canonical targets.
// Replaces only exact href="OLD" occurrences in *.njk source files.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAP = {
  '/materiaalvergelijking/': '/materialen/',
  '/kennisbank/': '/kennisbank-rotterdam-signage/',
  '/gevelreclame/': '/gevelreclame-rotterdam/',
  '/doosletters/': '/doosletters-rotterdam/',
  '/raambelettering/': '/raambelettering-rotterdam/',
  '/autoreclame/': '/autoreclame-rotterdam/',
  '/signage-rotterdam/': '/signage-rotterdam-centrum/',
  '/signage-feijenoord-rotterdam/': '/signage-feijenoord/',
  '/veiligheidssignage/': '/bewegwijzering-rotterdam/',
  '/drukwerk-rotterdam/': '/diensten/',
  '/de/leuchtreklame-rotterdam/': '/de/',
};

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '_site' || e === '.git') continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (e.endsWith('.njk')) out.push(p);
  }
  return out;
}

let totalFiles = 0, totalRepl = 0;
const perTarget = {};
for (const f of walk(process.cwd())) {
  let html = readFileSync(f, 'utf8');
  let changed = false;
  for (const [oldUrl, newUrl] of Object.entries(MAP)) {
    const needle = `href="${oldUrl}"`;
    if (html.includes(needle)) {
      const n = html.split(needle).length - 1;
      html = html.split(needle).join(`href="${newUrl}"`);
      perTarget[oldUrl] = (perTarget[oldUrl] || 0) + n;
      totalRepl += n; changed = true;
    }
  }
  if (changed) { writeFileSync(f, html); totalFiles++; }
}
console.log('Repointed links:');
for (const [k, v] of Object.entries(perTarget)) console.log(`  ${v}x  ${k} -> ${MAP[k]}`);
console.log(`\n${totalRepl} links across ${totalFiles} files`);
