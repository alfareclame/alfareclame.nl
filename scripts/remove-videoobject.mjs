#!/usr/bin/env node
// One-off: /video/* pages are text transcripts, not hosted video. Remove the
// VideoObject node from each page's JSON-LD @graph (Article + FAQPage + HowTo
// schema remain). Resolves the "video without video" root cause.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'video';
const files = readdirSync(DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(DIR, d.name, 'index.njk')))
  .map(d => join(DIR, d.name, 'index.njk'));

let ok = 0, skip = 0;
for (const f of files) {
  const raw = readFileSync(f, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex(l => /^jsonld:\s*\|/.test(l));
  if (start === -1) { console.log(`SKIP no-jsonld ${f}`); skip++; continue; }
  let end = start + 1;
  while (end < lines.length && (lines[end] === '' || /^\s/.test(lines[end]))) end++;
  const block = lines.slice(start + 1, end).join('\n');
  if (block.includes('{{') || block.includes('{%')) { console.log(`SKIP nunjucks ${f}`); skip++; continue; }

  let obj;
  try { obj = JSON.parse(block); } catch (e) { console.log(`SKIP parse ${f}: ${e.message.slice(0,40)}`); skip++; continue; }
  if (!Array.isArray(obj['@graph'])) { console.log(`SKIP no-graph ${f}`); skip++; continue; }

  const before = obj['@graph'].length;
  obj['@graph'] = obj['@graph'].filter(n => n['@type'] !== 'VideoObject');
  if (obj['@graph'].length === before) { console.log(`SKIP no-VideoObject ${f}`); skip++; continue; }

  const pretty = JSON.stringify(obj, null, 2);
  JSON.parse(pretty); // verify
  const indented = pretty.split('\n').map(l => '  ' + l).join(eol);
  const out = [...lines.slice(0, start + 1), ...indented.split(eol), '', ...lines.slice(end)].join(eol);
  writeFileSync(f, out);
  console.log(`FIXED ${f} (${before} -> ${obj['@graph'].length} graph nodes)`);
  ok++;
}
console.log(`\n${ok} pages cleaned, ${skip} skipped`);
