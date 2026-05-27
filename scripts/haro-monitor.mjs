#!/usr/bin/env node
/**
 * scripts/haro-monitor.js
 * HARO/press-quote monitor — pure Node 24, zero external deps.
 *
 * Fetches RSS feeds, filters for signage/reclame relevance,
 * generates draft NL answers, appends to data/haro-queue.jsonl.
 *
 * Usage:
 *   node scripts/haro-monitor.js
 *   node scripts/haro-monitor.js --dry-run
 *   node scripts/haro-monitor.js --feed https://example.com/feed.xml
 *   node scripts/haro-monitor.js --limit 5
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const FEEDS = [
  { name: 'HARO',         url: 'https://www.helpareporter.com/sources/feed/' },
  { name: 'Qwoted',       url: 'https://qwoted.com/queries.rss' },
  { name: 'PressJunkie',  url: 'https://www.pressjunkie.io/feed.xml' },
  { name: 'SourceBottle', url: 'https://www.sourcebottle.com/rss/calls.xml' },
  { name: 'HN-signage',   url: 'https://hnrss.org/newest?q=signage+OR+reclame+OR+%22sign+maker%22' },
];

const RELEVANCE_RE = /signage|reclame|outdoor[\s-]adverti|sign[\s-]maker|signage[\s-]company|window[\s-]graphic|vehicle[\s-]wrap|fleet[\s-]wrap|gevelreclame|raambelettering|doosletters|lichtreclame|belettering|shopfront|storefront[\s-]sign|fascia[\s-]sign/i;

const FETCH_TIMEOUT_MS = 10_000;

const QUEUE_FILE  = join(ROOT, 'data', 'haro-queue.jsonl');
const KB_FILE     = join(ROOT, 'data', 'rotterdam-signage-knowledge-base.json');
const PRICES_FILE = join(ROOT, 'data', 'sectorprijslijst-2026.json');

// ─── CLI ARGS ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const feedIdx    = args.indexOf('--feed');
const limitIdx   = args.indexOf('--limit');
const SINGLE_FEED = feedIdx !== -1 ? args[feedIdx + 1] : null;
const LIMIT      = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────

let KB_ENTRIES = [];
let PRICE_ENTRIES = [];

try {
  const kb = JSON.parse(readFileSync(KB_FILE, 'utf-8'));
  KB_ENTRIES = Object.values(kb.data || {})
    .flat()
    .filter(e => e && (e.definition_nl || e.term));
} catch {
  console.warn('[KB] rotterdam-signage-knowledge-base.json not found or invalid — draft answers will be generic.');
}

try {
  const prices = JSON.parse(readFileSync(PRICES_FILE, 'utf-8'));
  PRICE_ENTRIES = (prices.services || prices.data || []).flat().filter(Boolean);
} catch {
  console.warn('[PRICES] sectorprijslijst-2026.json not found or invalid.');
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function sha1(str) {
  return createHash('sha1').update(str).digest('hex').slice(0, 16);
}

function extractGuid(itemXml) {
  const m = itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
  return m ? m[1].trim() : null;
}

function extractTag(xml, tag) {
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataM = xml.match(cdataRe);
  if (cdataM) return cdataM[1].trim();
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const plainM = xml.match(plainRe);
  return plainM ? plainM[1].replace(/<[^>]+>/g, ' ').trim() : '';
}

function extractItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    items.push(m[1]);
  }
  return items;
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function toIso(dateStr) {
  if (!dateStr) return new Date().toISOString();
  try { return new Date(dateStr).toISOString(); } catch { return new Date().toISOString(); }
}

function matchedKeywords(text) {
  const lower = text.toLowerCase();
  const targets = [
    'signage', 'reclame', 'outdoor advertising', 'sign maker', 'signage company',
    'window graphic', 'vehicle wrap', 'fleet wrap', 'gevelreclame', 'raambelettering',
    'doosletters', 'lichtreclame', 'belettering', 'shopfront', 'storefront sign', 'fascia sign',
  ];
  return targets.filter(kw => lower.includes(kw));
}

// ─── KNOWLEDGE LOOKUP ─────────────────────────────────────────────────────────

function findRelevantKbEntries(queryText, n = 3) {
  const lq = queryText.toLowerCase();
  const scored = KB_ENTRIES.map(entry => {
    const term = (entry.term || '').toLowerCase();
    const def  = (entry.definition_nl || '').toLowerCase();
    const cat  = (entry.category || '').toLowerCase();
    let score = 0;
    if (lq.includes(term)) score += 3;
    if (def.split(' ').some(w => w.length > 4 && lq.includes(w))) score += 1;
    if (cat && lq.includes(cat)) score += 2;
    return { entry, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(s => s.entry);
}

function findRelevantPrice(queryText) {
  const lq = queryText.toLowerCase();
  return PRICE_ENTRIES.find(p => {
    const name = (p.service_name || p.name || '').toLowerCase();
    return name.split(/\s+/).some(w => w.length > 3 && lq.includes(w));
  }) || null;
}

// ─── DRAFT ANSWER GENERATOR ───────────────────────────────────────────────────

function generateDraftAnswer(title, description) {
  const query = `${title} ${description}`;
  const kbHits = findRelevantKbEntries(query, 3);
  const priceHit = findRelevantPrice(query);

  const kbParagraph = kbHits.length > 0
    ? kbHits.map(e => {
        const fact = e.definition_nl || '';
        return `**${e.term}:** ${fact.slice(0, 220)}${fact.length > 220 ? '…' : ''}`;
      }).join('\n\n')
    : 'Bij Alfa Reclame werken we uitsluitend met premium cast-vinyl (3M, Avery Dennison, Hexis) met een buitenlevensduur van 7–10 jaar, gecertificeerd voor straatbelasting en Rotterdam-klimaat.';

  const priceLine = priceHit
    ? `Onze marktconforme prijzen voor ${priceHit.service_name || priceHit.name || 'deze dienst'} starten vanaf €${priceHit.price_start_eur || priceHit.startprijs_eur || '–'} inclusief materiaal en installatie.`
    : 'Onze projectprijzen zijn marktconform en inclusief materiaal, print en installatie — geen verborgen kosten.';

  return `Beste [naam],

Alfa Reclame Rotterdam is een gespecialiseerd reclamebureau met meer dan 15 jaar ervaring in professionele signage, raambelettering, gevelreclame en voertuigwraps voor het Rotterdamse MKB.

Naar aanleiding van uw vraag over "${title.slice(0, 80)}" deel ik graag enkele concrete inzichten:

${kbParagraph}

${priceLine} Wij begeleiden het volledige traject: ontwerp, vergunningsadvies (gemeente Rotterdam, welstandseisen), productie en installatie. Onze installateurs zijn gecertificeerd en werken conform NEN-1414 en RVV-normen waar van toepassing.

Ter referentie: Rotterdam heeft specifieke welstandseisen per wijk — in gebieden als Centrum en Kralingen gelden strengere eisen voor maatvoering en verlichting dan in industriegebieden (Botlek, Waalhaven). Wij kennen deze lokale regelgeving en voorkomen onnodige bezwaartrajecten.

Graag sta ik beschikbaar voor een korte toelichting, beeldmateriaal of een offerte-op-maat.

Met vriendelijke groet,
Marco Pekel
Eigenaar Alfa Reclame
sales@alfareclame.nl
+31 10 123 4567
https://alfareclame.nl`;
}

// ─── FETCH FEED ───────────────────────────────────────────────────────────────

async function fetchFeed(feedUrl, feedName) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AlfaReclame-HaroBot/1.0 (+https://alfareclame.nl)' },
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.log(`[${feedName}] HTTP ${res.status} — skipping.`);
      return null;
    }
    return await res.text();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      console.log(`[${feedName}] Timeout after ${FETCH_TIMEOUT_MS}ms — skipping.`);
    } else {
      console.log(`[${feedName}] Fetch error: ${err.message} — skipping.`);
    }
    return null;
  }
}

// ─── LOAD EXISTING IDS ────────────────────────────────────────────────────────

function loadExistingIds() {
  if (!existsSync(QUEUE_FILE)) return new Set();
  const lines = readFileSync(QUEUE_FILE, 'utf-8').split('\n').filter(Boolean);
  const ids = new Set();
  for (const line of lines) {
    try {
      const rec = JSON.parse(line);
      if (rec.id) ids.add(rec.id);
    } catch { /* comment line or corrupt — skip */ }
  }
  return ids;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const existingIds = loadExistingIds();
  const feeds = SINGLE_FEED
    ? [{ name: 'custom', url: SINGLE_FEED }]
    : FEEDS;

  let feedsChecked = 0;
  let queriesFound = 0;
  let newRecords = [];

  for (const feed of feeds) {
    console.log(`[${feed.name}] Fetching ${feed.url} …`);
    const xml = await fetchFeed(feed.url, feed.name);
    if (!xml) continue;
    feedsChecked++;

    const items = extractItems(xml);
    console.log(`[${feed.name}] ${items.length} items parsed.`);

    for (const item of items) {
      const title       = stripHtml(extractTag(item, 'title'));
      const description = stripHtml(extractTag(item, 'description') || extractTag(item, 'content:encoded'));
      const link        = extractTag(item, 'link').trim() || extractTag(item, 'guid').trim();
      const pubDate     = extractTag(item, 'pubDate');
      const guid        = extractGuid(item) || link || title;

      if (!title) continue;

      const combined = `${title} ${description}`;
      if (!RELEVANCE_RE.test(combined)) continue;
      queriesFound++;

      const id = sha1(guid || link || title);
      if (existingIds.has(id)) {
        console.log(`  [skip] duplicate: ${title.slice(0, 60)}`);
        continue;
      }

      const keywords = matchedKeywords(combined);
      const draftAnswer = generateDraftAnswer(title, description);

      newRecords.push({
        id,
        query_title:       title,
        query_description: description.slice(0, 1000),
        source_url:        link,
        source:            feed.name,
        pubDate:           toIso(pubDate),
        matched_keywords:  keywords,
        draft_answer:      draftAnswer,
        discovered_at:     new Date().toISOString(),
        status:            'pending',
      });

      existingIds.add(id);
    }
  }

  // Apply limit
  if (LIMIT < Infinity && newRecords.length > LIMIT) {
    newRecords = newRecords.slice(0, LIMIT);
  }

  // Write
  if (!DRY_RUN && newRecords.length > 0) {
    const lines = newRecords.map(r => JSON.stringify(r)).join('\n') + '\n';
    appendFileSync(QUEUE_FILE, lines, 'utf-8');
    console.log(`\nAppended ${newRecords.length} record(s) to ${QUEUE_FILE}`);
  } else if (DRY_RUN) {
    console.log(`\n[--dry-run] Would append ${newRecords.length} record(s) — no file written.`);
    if (newRecords.length > 0) {
      console.log('Sample record:', JSON.stringify(newRecords[0], null, 2).slice(0, 800));
    }
  } else if (!DRY_RUN && newRecords.length === 0) {
    console.log('\nNo new matching queries found.');
  }

  console.log(`\n=== Summary ===`);
  console.log(`Feeds checked : ${feedsChecked}`);
  console.log(`Queries found : ${queriesFound}`);
  console.log(`New records   : ${newRecords.length}${DRY_RUN ? ' (dry-run, not written)' : ''}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
