#!/usr/bin/env node
/**
 * scripts/haro-export.js
 * Export a queued HARO draft to outreach/haro-drafts/{date}-{slug}.md
 *
 * Usage:
 *   node scripts/haro-export.js {id}
 *   node scripts/haro-export.js --id {id}
 *   node scripts/haro-export.js --list
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const QUEUE_FILE = join(ROOT, 'data', 'haro-queue.jsonl');
const DRAFTS_DIR = join(ROOT, 'outreach', 'haro-drafts');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join('-')
    .slice(0, 60);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ─── QUEUE I/O ────────────────────────────────────────────────────────────────

function readQueue() {
  if (!existsSync(QUEUE_FILE)) {
    console.error(`Queue file not found: ${QUEUE_FILE}`);
    process.exit(1);
  }
  const lines = readFileSync(QUEUE_FILE, 'utf-8').split('\n').filter(Boolean);
  const records = [];
  for (const line of lines) {
    try {
      const rec = JSON.parse(line);
      if (rec.id) records.push(rec);
    } catch { /* comment or corrupt line — skip */ }
  }
  return records;
}

function writeQueue(records) {
  const content = records.map(r => JSON.stringify(r)).join('\n') + '\n';
  writeFileSync(QUEUE_FILE, content, 'utf-8');
}

// ─── LIST MODE ────────────────────────────────────────────────────────────────

function listPending() {
  const records = readQueue();
  const pending = records.filter(r => r.status === 'pending');
  if (pending.length === 0) {
    console.log('No pending records in queue.');
    return;
  }
  console.log(`${pending.length} pending record(s):\n`);
  for (const r of pending) {
    console.log(`  ${r.id}  ${r.discovered_at?.slice(0, 10) || '?'}  [${r.source}]  ${r.query_title?.slice(0, 70)}`);
  }
}

// ─── EXPORT MODE ─────────────────────────────────────────────────────────────

function exportRecord(id) {
  const records = readQueue();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) {
    console.error(`Record not found: ${id}`);
    console.log('Run --list to see available IDs.');
    process.exit(1);
  }

  const rec = records[idx];

  // Build filename
  const date = todayIso();
  const slug = toSlug(rec.query_title || 'query');
  const filename = `${date}-${slug}.md`;
  const outPath = join(DRAFTS_DIR, filename);

  // Ensure directory exists
  if (!existsSync(DRAFTS_DIR)) {
    mkdirSync(DRAFTS_DIR, { recursive: true });
  }

  // Build markdown content
  const senderBio = `## Sender bio

**Marco Pekel**
Eigenaar, Alfa Reclame Rotterdam
sales@alfareclame.nl | +31 10 123 4567
https://alfareclame.nl

> Alfa Reclame is een Rotterdam-gebaseerd reclamebureau (est. 2009) gespecialiseerd in raambelettering, gevelreclame, voertuigwraps en lichtreclame voor het MKB. Meer dan 15 jaar ervaring, 500+ projecten, gecertificeerde installateurs, werkend met 3M/Avery/Hexis materialen.`;

  const content = `# ${rec.query_title || 'HARO Query'}

> ${rec.query_description || ''}

## Source

- **Feed:** ${rec.source || ''}
- **URL:** ${rec.source_url || ''}
- **Published:** ${rec.pubDate || ''}
- **Discovered:** ${rec.discovered_at || ''}
- **Matched keywords:** ${(rec.matched_keywords || []).join(', ')}

---

## Draft answer

\`\`\`
${rec.draft_answer || ''}
\`\`\`

---

${senderBio}

---

_Exported: ${new Date().toISOString()} | Queue ID: ${rec.id}_
`;

  writeFileSync(outPath, content, 'utf-8');

  // Update status in queue
  records[idx] = {
    ...rec,
    status:      'exported',
    exported_at: new Date().toISOString(),
  };
  writeQueue(records);

  console.log(`Exported: ${outPath}`);
  return outPath;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.length === 0) {
    listPending();
    return;
  }

  const idIdx = args.indexOf('--id');
  let id;
  if (idIdx !== -1) {
    id = args[idIdx + 1];
  } else {
    // positional: first non-flag arg
    id = args.find(a => !a.startsWith('--'));
  }

  if (!id) {
    console.error('Usage: node scripts/haro-export.js {id}');
    console.error('       node scripts/haro-export.js --id {id}');
    console.error('       node scripts/haro-export.js --list');
    process.exit(1);
  }

  exportRecord(id);
}

main();
