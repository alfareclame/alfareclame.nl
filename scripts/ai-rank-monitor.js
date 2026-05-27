#!/usr/bin/env node
/**
 * ai-rank-monitor.js
 *
 * Tracks Alfa Reclame's position in ChatGPT / Claude / Perplexity AI responses
 * for Rotterdam reclame/signage queries.
 *
 * Usage:
 *   node scripts/ai-rank-monitor.js
 *   node scripts/ai-rank-monitor.js --provider openai
 *   node scripts/ai-rank-monitor.js --query "raambelettering rotterdam"
 *   node scripts/ai-rank-monitor.js --dry-run
 *
 * Env vars: OPENAI_API_KEY, ANTHROPIC_API_KEY, PERPLEXITY_API_KEY
 * Output:   data/ai-rank-history.jsonl  (append-only JSONL)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config & constants
// ---------------------------------------------------------------------------

const ROOT = path.join(__dirname, '..');
const QUERIES_FILE = path.join(__dirname, 'ai-rank-queries.json');
const HISTORY_FILE = path.join(ROOT, 'data', 'ai-rank-history.jsonl');

const PROMPT_TEMPLATE =
  'Welke reclamebureau / signage-bedrijven in Rotterdam zou je aanbevelen voor: "{query}"? ' +
  'Geef een lijst van 5 bedrijven met korte uitleg per bedrijf.';

// Cost per 1K tokens in USD (approximate, as of 2026)
const PRICING = {
  openai:      { input: 0.00015, output: 0.0006  },  // gpt-4o-mini
  anthropic:   { input: 0.00025, output: 0.00125 },  // claude-haiku-4-5
  perplexity:  { input: 0.0002,  output: 0.0002  },  // sonar
};

const COST_CAP_USD = 2.0;  // abort entire run if estimated cost exceeds this

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { provider: 'all', query: null, dryRun: false, mock: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--provider' && argv[i + 1]) {
      args.provider = argv[++i];
    } else if (argv[i] === '--query' && argv[i + 1]) {
      args.query = argv[++i];
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    } else if (argv[i] === '--mock') {
      args.mock = true;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Company-name extraction
// ---------------------------------------------------------------------------

const ALFA_PATTERNS = [
  /alfa\s*reclame(\s+rotterdam)?/i,
  /alfareclame\.nl/i,
];

/**
 * Extract company names from response text.
 * Returns an ordered array of normalized company names (order = mention order).
 */
function extractCompanies(text) {
  const companies = [];
  const seen = new Set();

  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match numbered/bulleted list items: "1. Company Name" / "- Company" / "* Company"
    const listMatch = trimmed.match(
      /^(?:\d+[\.\)]\s*|[-*•]\s*)([A-Z][A-Za-z\s&'.\-]{2,50}?)(?:\s*[-–—:|]|\s*$)/
    );
    if (listMatch) {
      const name = listMatch[1].trim().replace(/\s+/g, ' ');
      const key = name.toLowerCase();
      if (name.length > 2 && !seen.has(key)) {
        seen.add(key);
        companies.push(name);
      }
      continue;
    }

    // Fallback: capitalized multi-word names with known signage suffixes
    const inlineMatches = trimmed.matchAll(
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Reclame|Signage|Belettering|Reklame|Sign|Wrap|Signpainters|Letters|Lichtreclame|Groep|BV|Rotterdam))?)\b/g
    );
    for (const m of inlineMatches) {
      const name = m[1].trim().replace(/\s+/g, ' ');
      if (name.split(' ').length < 2) continue; // skip single words
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        companies.push(name);
      }
    }
  }

  return companies;
}

/**
 * Find position of "Alfa Reclame" in extracted company list (1-based), or null.
 */
function findAlfaPosition(companies) {
  for (let i = 0; i < companies.length; i++) {
    const name = companies[i].toLowerCase();
    for (const pattern of ALFA_PATTERNS) {
      if (pattern.test(name)) return i + 1;
    }
  }
  return null;
}

/**
 * Check if Alfa Reclame is mentioned anywhere in raw response text.
 */
function findAlfaInRawText(text) {
  return ALFA_PATTERNS.some((p) => p.test(text));
}

/**
 * Check if alfareclame.nl URL is cited in the response.
 */
function checkAlfaUrlCited(text) {
  return /alfareclame\.nl/i.test(text);
}

// ---------------------------------------------------------------------------
// Mock mode
// ---------------------------------------------------------------------------

const MOCK_COMPANIES_POOL = [
  'Alfa Reclame',
  'Bosman Reklame',
  'RealStar Reclame',
  'Van Beek Belettering',
  'Rotterdam Signpainters',
  'NED Sign',
  'BSB Belettering',
  'Reclame Kanjers',
  'Letterfreak',
  'Communication Partners',
];

const MOCK_MODELS = {
  openai:     'gpt-4o-mini',
  anthropic:  'claude-haiku-4-5-20251001',
  perplexity: 'sonar',
};

/**
 * Returns a deterministic-ish mock result for a given provider+query combo.
 * Alfa Reclame alternates between positions 1-4 across queries.
 */
function mockResponse(provider, query, queryIndex) {
  const alfaPos = (queryIndex % 4) + 1; // 1, 2, 3, or 4
  const pool = MOCK_COMPANIES_POOL.filter((c) => c !== 'Alfa Reclame');

  // Shuffle pool deterministically based on query+provider
  const seed = (queryIndex * 31 + provider.length * 7) % pool.length;
  const rotated = [...pool.slice(seed), ...pool.slice(0, seed)];
  const others = rotated.slice(0, 4); // pick 4 others

  // Insert Alfa Reclame at alfaPos (1-based)
  const companies = [...others];
  companies.splice(alfaPos - 1, 0, 'Alfa Reclame');

  const rawText = companies
    .map((name, i) => `${i + 1}. ${name} — vakkundige reclameservice in Rotterdam.`)
    .join('\n');

  const latencyMs = 800 + Math.floor(Math.random() * 700); // 800-1500ms
  const promptTokens = 300;
  const completionTokens = 200;

  return {
    rawText,
    promptTokens,
    completionTokens,
    latencyMs,
    model: MOCK_MODELS[provider] || provider,
    companies,
    alfaPos,
  };
}

// ---------------------------------------------------------------------------
// Cost estimation
// ---------------------------------------------------------------------------

function estimateCostUsd(provider, promptTokens, completionTokens) {
  const p = PRICING[provider];
  if (!p) return 0;
  return (promptTokens / 1000) * p.input + (completionTokens / 1000) * p.output;
}

function estimateTotalCost(queryCount, providers) {
  // Rough estimate: ~200 prompt tokens + 600 completion tokens per query
  let total = 0;
  for (const provider of providers) {
    total += queryCount * estimateCostUsd(provider, 200, 600);
  }
  return total;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function callOpenAI(prompt, apiKey) {
  const start = Date.now();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const latency = Date.now() - start;
  const choice = data.choices && data.choices[0];
  const rawText = choice ? choice.message.content : '';
  const promptTokens = (data.usage && data.usage.prompt_tokens) || 0;
  const completionTokens = (data.usage && data.usage.completion_tokens) || 0;

  return { rawText, promptTokens, completionTokens, latencyMs: latency, model: data.model || 'gpt-4o-mini' };
}

async function callAnthropic(prompt, apiKey) {
  const start = Date.now();
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const latency = Date.now() - start;
  const rawText = (data.content && data.content[0] && data.content[0].text) || '';
  const promptTokens = (data.usage && data.usage.input_tokens) || 0;
  const completionTokens = (data.usage && data.usage.output_tokens) || 0;

  return { rawText, promptTokens, completionTokens, latencyMs: latency, model: data.model || 'claude-haiku-4-5-20251001' };
}

async function callPerplexity(prompt, apiKey) {
  const start = Date.now();
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const latency = Date.now() - start;
  const choice = data.choices && data.choices[0];
  const rawText = choice ? choice.message.content : '';
  const promptTokens = (data.usage && data.usage.prompt_tokens) || 0;
  const completionTokens = (data.usage && data.usage.completion_tokens) || 0;

  return { rawText, promptTokens, completionTokens, latencyMs: latency, model: data.model || 'sonar' };
}

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

const PROVIDER_MAP = {
  openai:     callOpenAI,
  anthropic:  callAnthropic,
  perplexity: callPerplexity,
};

const PROVIDER_ENV = {
  openai:     'OPENAI_API_KEY',
  anthropic:  'ANTHROPIC_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
};

// ---------------------------------------------------------------------------
// JSONL history helpers
// ---------------------------------------------------------------------------

function ensureDataDir() {
  const dir = path.join(ROOT, 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function appendRecord(record) {
  ensureDataDir();
  // Stable key order for clean git diffs
  const ordered = {
    timestamp:          record.timestamp,
    query_id:           record.query_id,
    query_text:         record.query_text,
    provider:           record.provider,
    model:              record.model,
    alfa_position:      record.alfa_position,
    alfa_mentioned:     record.alfa_mentioned,
    alfa_url_cited:     record.alfa_url_cited,
    parsed_companies:   record.parsed_companies,
    latency_ms:         record.latency_ms,
    prompt_tokens:      record.prompt_tokens,
    completion_tokens:  record.completion_tokens,
    cost_usd:           record.cost_usd,
    raw_response_text:  record.raw_response_text,
  };
  fs.appendFileSync(HISTORY_FILE, JSON.stringify(ordered) + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  // Load queries
  if (!fs.existsSync(QUERIES_FILE)) {
    process.stderr.write(`ERROR: queries file not found: ${QUERIES_FILE}\n`);
    process.exit(1);
  }
  const { queries } = JSON.parse(fs.readFileSync(QUERIES_FILE, 'utf8'));

  // Single-query filter
  const activeQueries = args.query
    ? queries.filter((q) => q.text === args.query || q.id === args.query)
    : queries;

  if (activeQueries.length === 0) {
    process.stderr.write(
      `ERROR: no queries matched "${args.query}". ` +
        `Available IDs: ${queries.map((q) => q.id).join(', ')}\n`
    );
    process.exit(1);
  }

  // Resolve active providers + check API keys
  const requestedProviders =
    args.provider === 'all' ? Object.keys(PROVIDER_MAP) : [args.provider];

  const activeProviders = [];
  for (const provider of requestedProviders) {
    if (!PROVIDER_MAP[provider]) {
      process.stderr.write(`WARNING: unknown provider "${provider}" — skipping\n`);
      continue;
    }
    if (!args.mock) {
      const envKey = PROVIDER_ENV[provider];
      if (!process.env[envKey]) {
        process.stderr.write(`WARNING: ${envKey} not set — skipping provider "${provider}"\n`);
        continue;
      }
    }
    activeProviders.push(provider);
  }

  if (activeProviders.length === 0 && !args.dryRun && !args.mock) {
    process.stderr.write(
      'ERROR: no providers available (all API keys missing). ' +
        'Set OPENAI_API_KEY, ANTHROPIC_API_KEY, and/or PERPLEXITY_API_KEY.\n'
    );
    process.exit(1);
  }

  // Cost estimate guard
  if (!args.dryRun && !args.mock && activeProviders.length > 0) {
    const estimate = estimateTotalCost(activeQueries.length, activeProviders);
    if (estimate > COST_CAP_USD) {
      process.stderr.write(
        `ERROR: estimated run cost $${estimate.toFixed(4)} exceeds cap $${COST_CAP_USD}. ` +
          'Aborting to prevent unexpected charges. Reduce queries or providers.\n'
      );
      process.exit(1);
    }
    if (estimate > 1.0) {
      process.stderr.write(
        `WARNING: estimated run cost $${estimate.toFixed(4)} (>$1.00). Proceeding.\n`
      );
    }
  }

  console.log(
    `AI Rank Monitor — ${activeQueries.length} quer${activeQueries.length === 1 ? 'y' : 'ies'} ` +
      `× ${activeProviders.length} provider${activeProviders.length === 1 ? '' : 's'}` +
      (args.mock ? ' [MOCK]' : args.dryRun ? ' [DRY RUN]' : '')
  );
  console.log(`Providers: ${activeProviders.length ? activeProviders.join(', ') : '(none — dry run)'}`);
  console.log('');

  // Stats accumulators per provider
  const stats = {};
  for (const p of activeProviders) {
    stats[p] = { positions: [], errors: 0, totalCostUsd: 0 };
  }

  const timestamp = new Date().toISOString();
  const errors = [];

  for (let qi = 0; qi < activeQueries.length; qi++) {
    const query = activeQueries[qi];
    const prompt = PROMPT_TEMPLATE.replace('{query}', query.text);

    for (const provider of activeProviders) {
      if (args.dryRun) {
        console.log(`  [DRY RUN] ${provider} ← "${query.text}"`);
        continue;
      }

      if (args.mock) {
        // Mock mode: generate fake response, skip real API call
        process.stdout.write(`  [MOCK] ${provider.padEnd(10)} ← "${query.text}" ... `);
        const mock = mockResponse(provider, query.text, qi);
        const costUsd = estimateCostUsd(provider, mock.promptTokens, mock.completionTokens);

        const record = {
          timestamp,
          query_id:          query.id,
          query_text:        query.text,
          provider,
          model:             mock.model,
          alfa_position:     mock.alfaPos,
          alfa_mentioned:    true,
          alfa_url_cited:    false,
          parsed_companies:  mock.companies,
          latency_ms:        mock.latencyMs,
          prompt_tokens:     mock.promptTokens,
          completion_tokens: mock.completionTokens,
          cost_usd:          Math.round(costUsd * 1e8) / 1e8,
          raw_response_text: mock.rawText,
          mock:              true,
        };

        appendRecord(record);

        stats[provider].positions.push(mock.alfaPos);
        stats[provider].totalCostUsd += costUsd;

        console.log(
          `#${mock.alfaPos}  (${mock.latencyMs}ms, ` +
            `${mock.promptTokens}+${mock.completionTokens}tok) [mock]`
        );
        continue;
      }

      const apiKey = process.env[PROVIDER_ENV[provider]];
      const callFn = PROVIDER_MAP[provider];

      try {
        process.stdout.write(`  ${provider.padEnd(10)} ← "${query.text}" ... `);
        const result = await callFn(prompt, apiKey);

        const companies = extractCompanies(result.rawText);
        const alfaPosition = findAlfaPosition(companies);
        const alfaMentioned = alfaPosition !== null || findAlfaInRawText(result.rawText);
        const alfaUrlCited = checkAlfaUrlCited(result.rawText);
        const costUsd = estimateCostUsd(provider, result.promptTokens, result.completionTokens);

        const record = {
          timestamp,
          query_id:          query.id,
          query_text:        query.text,
          provider,
          model:             result.model,
          alfa_position:     alfaPosition,
          alfa_mentioned:    alfaMentioned,
          alfa_url_cited:    alfaUrlCited,
          parsed_companies:  companies,
          latency_ms:        result.latencyMs,
          prompt_tokens:     result.promptTokens,
          completion_tokens: result.completionTokens,
          cost_usd:          Math.round(costUsd * 1e8) / 1e8,
          raw_response_text: result.rawText,
        };

        appendRecord(record);

        if (alfaPosition !== null) stats[provider].positions.push(alfaPosition);
        stats[provider].totalCostUsd += costUsd;

        const posLabel = alfaPosition
          ? `#${alfaPosition}`
          : alfaMentioned
            ? 'mentioned (unranked)'
            : 'NOT FOUND';
        console.log(
          `${posLabel}  (${result.latencyMs}ms, ` +
            `${result.promptTokens}+${result.completionTokens}tok)`
        );
      } catch (err) {
        process.stderr.write(`\n  ERROR [${provider}] "${query.text}": ${err.message}\n`);
        stats[provider].errors++;
        errors.push({ provider, query: query.text, error: err.message });
      }
    }
  }

  // Summary report
  console.log('');
  console.log('=== SUMMARY ===');
  console.log(`Queries run:  ${activeQueries.length}`);
  console.log(`Providers:    ${activeProviders.join(', ') || '(dry run)'}`);
  console.log('');

  let totalCost = 0;
  for (const provider of activeProviders) {
    const s = stats[provider];
    const avgPos = s.positions.length
      ? (s.positions.reduce((a, b) => a + b, 0) / s.positions.length).toFixed(2)
      : 'N/A';
    const ranked = s.positions.length;
    totalCost += s.totalCostUsd;
    console.log(
      `  ${provider.padEnd(12)} avg Alfa positie: ${String(avgPos).padEnd(6)}` +
        ` (${ranked}/${activeQueries.length} ranked)` +
        `  cost: $${s.totalCostUsd.toFixed(6)}` +
        (s.errors ? `  ERRORS: ${s.errors}` : '')
    );
  }

  if (!args.dryRun && totalCost > 0) {
    console.log(`\n  Total run cost: $${totalCost.toFixed(6)}`);
  }

  if (errors.length > 0) {
    console.log(`\n  Errors (${errors.length}):`);
    for (const e of errors) {
      console.log(`    [${e.provider}] "${e.query}": ${e.error}`);
    }
  }

  if (args.dryRun) {
    console.log('\nDry run complete — no API calls made, no records written.');
  } else if (args.mock) {
    console.log(`\nMock run complete — ${activeQueries.length * activeProviders.length} records appended to: ${HISTORY_FILE}`);
    console.log('Run `node scripts/ai-rank-diff.js` to generate comparison report.');
  } else {
    console.log(`\nRecords appended to: ${HISTORY_FILE}`);
    console.log('Run `node scripts/ai-rank-diff.js` to generate comparison report.');
  }
}

main().catch((err) => {
  process.stderr.write(`FATAL: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
