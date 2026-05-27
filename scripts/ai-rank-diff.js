#!/usr/bin/env node
/**
 * ai-rank-diff.js
 *
 * Reads data/ai-rank-history.jsonl, compares the last 2 distinct run-days,
 * and writes a markdown report to data/ai-rank-latest-report.md.
 *
 * Usage:
 *   node scripts/ai-rank-diff.js
 *
 * No API keys required — pure local analysis.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.join(__dirname, '..');
const HISTORY_FILE = path.join(ROOT, 'data', 'ai-rank-history.jsonl');
const REPORT_FILE = path.join(ROOT, 'data', 'ai-rank-latest-report.md');

const PROVIDERS = ['openai', 'anthropic', 'perplexity'];
const PROVIDER_LABELS = {
  openai:     'ChatGPT (OpenAI)',
  anthropic:  'Claude (Anthropic)',
  perplexity: 'Perplexity',
};

// ---------------------------------------------------------------------------
// JSONL reader
// ---------------------------------------------------------------------------

function readHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  const content = fs.readFileSync(HISTORY_FILE, 'utf8').trim();
  if (!content) return [];

  const records = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed));
    } catch (_) {
      process.stderr.write(`WARNING: skipping malformed JSONL line: ${trimmed.slice(0, 80)}\n`);
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// Grouping helpers
// ---------------------------------------------------------------------------

/** ISO-8601 timestamp → "YYYY-MM-DD" */
function toDay(ts) {
  return ts.slice(0, 10);
}

/**
 * Group records by day (YYYY-MM-DD).
 * Returns Map<day, record[]> sorted newest-first.
 */
function groupByDay(records) {
  const map = new Map();
  for (const rec of records) {
    const day = toDay(rec.timestamp);
    if (!map.has(day)) map.set(day, []);
    map.get(day).push(rec);
  }
  return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

/**
 * Build lookup: Map<provider, Map<query_id, record>> from a flat record list.
 * If multiple records exist for same provider×query, last one wins.
 */
function buildLookup(records) {
  const lookup = new Map();
  for (const rec of records) {
    if (!lookup.has(rec.provider)) lookup.set(rec.provider, new Map());
    lookup.get(rec.provider).set(rec.query_id, rec);
  }
  return lookup;
}

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

function mdTable(headers, rows) {
  const sep = headers.map(() => '---');
  return [
    `| ${headers.join(' | ')} |`,
    `| ${sep.join(' | ')} |`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');
}

function posLabel(pos) {
  return pos === null || pos === undefined ? '—' : `#${pos}`;
}

function diffLabel(curr, prev) {
  if (curr === null && prev === null) return '—';
  if (curr === null && prev !== null) return '(uitgevallen)';
  if (curr !== null && prev === null) return '(nieuw)';
  const delta = prev - curr; // positive = moved up (lower number = better rank)
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return '=';
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

function analyze(records) {
  const byDay = groupByDay(records);
  const days = [...byDay.keys()]; // newest-first

  if (days.length === 0) return { error: 'no_data' };

  const latestDay = days[0];
  const prevDay = days.length > 1 ? days[1] : null;

  const latestRecords = byDay.get(latestDay);
  const prevRecords = prevDay ? byDay.get(prevDay) : [];

  const latestLookup = buildLookup(latestRecords);
  const prevLookup = prevDay ? buildLookup(prevRecords) : new Map();

  // All query IDs in latest run
  const allQueryIds = new Set();
  for (const [, pMap] of latestLookup) {
    for (const qid of pMap.keys()) allQueryIds.add(qid);
  }

  // New competitors: companies first-seen in this run
  const companiesPrev = new Set();
  const companiesLatest = new Set();
  for (const rec of prevRecords) {
    for (const c of (rec.parsed_companies || [])) companiesPrev.add(c.toLowerCase());
  }
  for (const rec of latestRecords) {
    for (const c of (rec.parsed_companies || [])) companiesLatest.add(c.toLowerCase());
  }
  const newCompetitors = [...companiesLatest]
    .filter((c) => !companiesPrev.has(c))
    .sort();

  // Per-query × per-provider analysis
  const rows = [];
  let upCount = 0, downCount = 0, stableCount = 0, newCount = 0, droppedCount = 0;
  const biggestWinners = [];
  const biggestLosers = [];

  for (const qid of [...allQueryIds].sort()) {
    const row = { qid, providers: {} };
    for (const provider of PROVIDERS) {
      const currRec = latestLookup.has(provider) ? latestLookup.get(provider).get(qid) : undefined;
      const prevRec = prevLookup.has(provider) ? prevLookup.get(provider).get(qid) : undefined;
      const currPos = currRec ? currRec.alfa_position : null;
      const prevPos = prevRec ? prevRec.alfa_position : null;

      row.providers[provider] = { currPos, prevPos };

      if (prevDay) {
        if (currPos !== null && prevPos === null) {
          newCount++;
        } else if (currPos === null && prevPos !== null) {
          droppedCount++;
        } else if (currPos !== null && prevPos !== null) {
          const delta = prevPos - currPos;
          if (delta > 0) { upCount++; biggestWinners.push({ qid, provider, delta }); }
          else if (delta < 0) { downCount++; biggestLosers.push({ qid, provider, delta }); }
          else stableCount++;
        }
      }
    }
    rows.push(row);
  }

  // Average position per provider (latest run only)
  const avgPos = {};
  for (const provider of PROVIDERS) {
    const positions = latestRecords
      .filter((r) => r.provider === provider && r.alfa_position !== null)
      .map((r) => r.alfa_position);
    avgPos[provider] = positions.length
      ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(2)
      : null;
  }

  biggestWinners.sort((a, b) => b.delta - a.delta);
  biggestLosers.sort((a, b) => a.delta - b.delta);

  return {
    latestDay,
    prevDay,
    rows,
    avgPos,
    upCount,
    downCount,
    stableCount,
    newCount,
    droppedCount,
    newCompetitors,
    biggestWinners: biggestWinners.slice(0, 5),
    biggestLosers: biggestLosers.slice(0, 5),
    totalQueries: allQueryIds.size,
    totalRecords: latestRecords.length,
  };
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

function generateReport(result) {
  if (result.error === 'no_data') {
    return (
      '# AI Rank Monitor — Rapportage\n\n' +
      `Geen data beschikbaar in \`${HISTORY_FILE}\`.\n` +
      'Voer eerst `node scripts/ai-rank-monitor.js` uit.\n'
    );
  }

  const lines = [];
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  lines.push('# AI Rank Monitor — Rapportage');
  lines.push(`\n_Gegenereerd: ${now} UTC_\n`);

  if (!result.prevDay) {
    lines.push(
      '> **Baseline only** — geen eerdere dag beschikbaar voor vergelijking.\n' +
        '> Verschilanalyse is pas mogelijk na de tweede wekelijkse run.\n'
    );
  }

  lines.push(`**Laatste run:** ${result.latestDay}`);
  if (result.prevDay) lines.push(`**Vorige run:** ${result.prevDay}`);
  lines.push(`**Queries geanalyseerd:** ${result.totalQueries}`);
  lines.push(`**Records in run:** ${result.totalRecords}\n`);

  // Samenvatting
  lines.push('## Samenvatting');
  if (result.prevDay) {
    lines.push('');
    lines.push(
      mdTable(
        ['Beweging', 'Aantal query×provider combos'],
        [
          ['↑ Gestegen', String(result.upCount)],
          ['↓ Gedaald', String(result.downCount)],
          ['= Stabiel', String(result.stableCount)],
          ['↑ Nieuw ingekomen', String(result.newCount)],
          ['↓ Uitgevallen', String(result.droppedCount)],
        ]
      )
    );
    lines.push('');
  } else {
    lines.push('\nEerste meting — samenvatting verschilanalyse beschikbaar na volgende run.\n');
  }

  // Per-provider tabel
  lines.push('## Alfa Reclame positie per provider');
  lines.push('');
  lines.push(
    mdTable(
      ['Provider', 'Gem. positie (laatste run)', 'Queries met ranking'],
      PROVIDERS.map((p) => {
        const ranked = result.rows.filter(
          (r) => r.providers[p] && r.providers[p].currPos !== null
        ).length;
        return [
          PROVIDER_LABELS[p] || p,
          result.avgPos[p] !== null ? `#${result.avgPos[p]}` : '—',
          `${ranked} / ${result.totalQueries}`,
        ];
      })
    )
  );
  lines.push('');

  // Grootste stijgers
  if (result.prevDay && result.biggestWinners.length > 0) {
    lines.push('## Grootste stijgers');
    lines.push('');
    lines.push(
      mdTable(
        ['Query', 'Provider', 'Verbetering'],
        result.biggestWinners.map((w) => [
          `\`${w.qid}\``,
          PROVIDER_LABELS[w.provider] || w.provider,
          `+${w.delta} positie${w.delta !== 1 ? 's' : ''}`,
        ])
      )
    );
    lines.push('');
  }

  // Grootste dalers
  if (result.prevDay && result.biggestLosers.length > 0) {
    lines.push('## Grootste dalers');
    lines.push('');
    lines.push(
      mdTable(
        ['Query', 'Provider', 'Verlies'],
        result.biggestLosers.map((l) => [
          `\`${l.qid}\``,
          PROVIDER_LABELS[l.provider] || l.provider,
          `${l.delta} positie${Math.abs(l.delta) !== 1 ? 's' : ''}`,
        ])
      )
    );
    lines.push('');
  }

  // Nieuwe concurrenten
  if (result.newCompetitors.length > 0) {
    lines.push('## Nieuwe concurrenten gesignaleerd');
    lines.push('');
    lines.push('Bedrijfsnamen die voor het eerst worden genoemd in de laatste run:\n');
    for (const c of result.newCompetitors.slice(0, 20)) {
      lines.push(`- ${c}`);
    }
    lines.push('');
  }

  // Detailtabel
  lines.push('## Detailtabel — alle queries');
  lines.push('');
  const detailHeaders = [
    'Query ID',
    PROVIDER_LABELS.openai,
    PROVIDER_LABELS.anthropic,
    PROVIDER_LABELS.perplexity,
  ];
  const detailRows = result.rows.map((row) => [
    `\`${row.qid}\``,
    ...PROVIDERS.map((p) => {
      const { currPos, prevPos } = row.providers[p] || { currPos: null, prevPos: null };
      const pos = posLabel(currPos);
      const diff = result.prevDay ? ` ${diffLabel(currPos, prevPos)}` : '';
      return `${pos}${diff}`.trim();
    }),
  ]);
  lines.push(mdTable(detailHeaders, detailRows));
  lines.push('');

  lines.push('---');
  lines.push(
    '_Data: `data/ai-rank-history.jsonl` · ' +
      'Monitor: `scripts/ai-rank-monitor.js` · ' +
      'Rapport: `scripts/ai-rank-diff.js`_'
  );
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('AI Rank Diff — generating comparison report...');

  const records = readHistory();

  if (records.length === 0) {
    console.log('No history data found. Run `node scripts/ai-rank-monitor.js` first.');
    const placeholder =
      '# AI Rank Monitor — Rapportage\n\n' +
      'Geen data beschikbaar. Voer eerst `node scripts/ai-rank-monitor.js` uit.\n';
    fs.writeFileSync(REPORT_FILE, placeholder, 'utf8');
    console.log(`Placeholder written to: ${REPORT_FILE}`);
    process.exit(0);
  }

  console.log(`Loaded ${records.length} record(s) from history.`);

  const result = analyze(records);

  // Stdout summary
  if (!result.prevDay) {
    console.log('Baseline only — no prior day for comparison.');
  } else {
    console.log(`Latest day: ${result.latestDay}  |  Prev day: ${result.prevDay}`);
    console.log(
      `Changes: ${result.upCount} up, ${result.downCount} down, ` +
        `${result.stableCount} stable, ${result.newCount} new, ${result.droppedCount} dropped`
    );
  }

  console.log('\nAvg Alfa positie per provider (latest run):');
  for (const p of PROVIDERS) {
    const ranked = result.rows.filter((r) => r.providers[p] && r.providers[p].currPos !== null).length;
    console.log(
      `  ${(PROVIDER_LABELS[p] || p).padEnd(22)} ` +
        `${result.avgPos[p] !== null ? `#${result.avgPos[p]}` : 'N/A'}` +
        `  (${ranked}/${result.totalQueries} ranked)`
    );
  }

  const report = generateReport(result);
  fs.writeFileSync(REPORT_FILE, report, 'utf8');
  console.log(`\nReport written to: ${REPORT_FILE}`);
}

main();
