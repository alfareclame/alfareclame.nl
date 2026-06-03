#!/usr/bin/env node
// One-off: repair malformed JSON-LD front-matter blocks where extra schema
// objects were appended as sibling roots outside @graph. Re-merges every
// top-level object into a single {@context, @graph:[...]} and rewrites source.
import { readFileSync, writeFileSync } from 'node:fs';

const FILES = [
  'blog/autoreclame-tco-3-jaar', 'blog/carwrap-degradatie-noord-zee-klimaat',
  'blog/duurzaam-vinyl-recyclebaar-belettering', 'blog/led-vs-neon-lichtbak-vergelijking',
  'blog/levensduur-autobelettering', 'blog/lichtbak-energie-besparing-led-vs-tl',
  'blog/lichtreclame-kosten-rotterdam-2026', 'blog/rgb-vs-cmyk-print-belettering',
  'blog/spandoeken-prijzen-rotterdam-2026', 'kies-uw-signage-partner-rotterdam',
  'kosten-gevelreclame-rotterdam', 'video/doosletters-led-front-vs-halo',
  'video/fleet-wrap-kosten-berekenen-mkb', 'video/wrap-folie-merken-3m-vs-avery',
].map(p => `${p}/index.njk`);

// Extract balanced top-level {...} objects from a string, respecting JSON strings.
function extractObjects(s) {
  const objs = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') { depth--; if (depth === 0 && start >= 0) { objs.push(s.slice(start, i + 1)); start = -1; } }
  }
  return objs;
}

let ok = 0, fail = 0;
for (const file of FILES) {
  let raw;
  try { raw = readFileSync(file, 'utf8'); } catch { console.log(`SKIP missing ${file}`); continue; }
  const lines = raw.split('\n');
  const startIdx = lines.findIndex(l => /^jsonld:\s*\|/.test(l));
  if (startIdx === -1) { console.log(`SKIP no jsonld ${file}`); continue; }
  let endIdx = startIdx + 1;
  while (endIdx < lines.length && (lines[endIdx] === '' || /^\s/.test(lines[endIdx]))) endIdx++;
  const block = lines.slice(startIdx + 1, endIdx).join('\n');

  if (block.includes('{{') || block.includes('{%')) { console.log(`SKIP nunjucks ${file}`); fail++; continue; }

  const objs = extractObjects(block);
  const graph = [];
  let broke = false;
  for (const o of objs) {
    let parsed;
    try { parsed = JSON.parse(o); } catch (e) { console.log(`FAIL parse-obj ${file}: ${e.message.slice(0,60)}`); broke = true; break; }
    if (Array.isArray(parsed['@graph'])) graph.push(...parsed['@graph']);
    else { delete parsed['@context']; graph.push(parsed); }
  }
  if (broke || !graph.length) { console.log(`FAIL ${file}`); fail++; continue; }

  const merged = { '@context': 'https://schema.org', '@graph': graph };
  const pretty = JSON.stringify(merged, null, 2);
  try { JSON.parse(pretty); } catch { console.log(`FAIL reverify ${file}`); fail++; continue; }
  const indented = pretty.split('\n').map(l => '  ' + l).join('\n');
  const out = [...lines.slice(0, startIdx + 1), indented, '', ...lines.slice(endIdx)].join('\n');
  writeFileSync(file, out);
  console.log(`FIXED ${file} (${graph.length} graph nodes)`);
  ok++;
}
console.log(`\n${ok} fixed, ${fail} failed`);
