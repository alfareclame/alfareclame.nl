#!/usr/bin/env node
/**
 * internal-link-builder.js
 * Builds _data/relatedPages.json via TF-IDF cosine similarity.
 * Pure Node, no external deps.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, '_data', 'relatedPages.json');

const EXCLUDE_DIRS = new Set([
  '_includes', '_site', 'node_modules', 'oss', 'outreach'
]);

const STOPWORDS = {
  nl: new Set(['de','het','een','en','van','in','op','voor','met','te','is','zijn','was','dat',
               'die','ook','niet','deze','dit','naar','bij','om','uit','door','als','aan','er',
               'ze','we','ik','je','u','uw','of','heeft','hebben','worden','werd']),
  en: new Set(['the','a','an','and','of','in','on','for','to','with','is','are','was','that',
               'this','by','at','from','as','or','but','be','have','has','had','it','its']),
  de: new Set(['der','die','das','und','von','in','im','an','auf','fur','mit','zu','ist','sind',
               'war','dass','dies','durch','als','oder','bei','dem','den','des','wird','werden']),
  tr: new Set(['ve','ile','icin','bir','bu','su','cok','en','da','de','mi','mu','ben','sen',
               'o','biz','siz','onlar','ne','var','olan']),
  pl: new Set(['i','w','na','do','dla','z','o','ze','jest','sa','to','od','po','ale','lub',
               'byc','sie','jak','nie','przez','przy','po','ktory','ktore'])
};

const TOP_N          = 5;
const MIN_SIMILARITY = 0.1;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Recursively collect .njk files, skip excluded dirs */
function collectNjk(dir, files) {
  if (!files) files = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return files; }

  for (const e of entries) {
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.has(e.name)) collectNjk(path.join(dir, e.name), files);
    } else if (e.isFile() && e.name.endsWith('.njk')) {
      files.push(path.join(dir, e.name));
    }
  }
  return files;
}

/** Parse YAML front-matter block (simple inline, no external dep) */
function parseFrontMatter(src) {
  if (!src.startsWith('---')) return { meta: {}, body: src };
  const end = src.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, body: src };
  const yaml = src.slice(4, end);
  const body = src.slice(end + 4);
  const meta = {};
  let currentKey = null;
  let inMultiline = false;
  const multilineVal = [];

  const lines = yaml.split('\n');
  for (const line of lines) {
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s?(.*)?$/);
    if (kvMatch && !line.startsWith(' ') && !line.startsWith('\t')) {
      if (inMultiline && currentKey) {
        meta[currentKey] = multilineVal.join('\n').trim();
        multilineVal.length = 0;
        inMultiline = false;
      }
      currentKey = kvMatch[1];
      const val = (kvMatch[2] || '').trim();
      if (val === '|' || val === '>') {
        inMultiline = true;
      } else {
        meta[currentKey] = val.replace(/^["']|["']$/g, '');
        inMultiline = false;
      }
    } else if (inMultiline) {
      multilineVal.push(line.replace(/^\s{2}/, ''));
    }
  }
  if (inMultiline && currentKey) {
    meta[currentKey] = multilineVal.join('\n').trim();
  }
  return { meta, body };
}

/** Strip HTML tags, Nunjucks tags, entities; collapse whitespace */
function stripMarkup(str) {
  return str
    .replace(/\{%[\s\S]*?%\}/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract H1 text from body */
function extractH1(body) {
  const m = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return '';
  return stripMarkup(m[1]).slice(0, 200);
}

/** Tokenize text for a given language */
function tokenize(text, lang) {
  const stops = STOPWORDS[lang] || STOPWORDS.nl;
  return text
    .toLowerCase()
    .replace(/[^\wA-Za-zÀ-ɏĀ-ž\s]/g, ' ')
    .split(/\s+/)
    .filter(function(t) { return t.length > 1 && !stops.has(t); });
}

/** Compute term frequencies for a token list */
function computeTF(tokens) {
  const freq = {};
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    freq[t] = (freq[t] || 0) + 1;
  }
  const len = tokens.length || 1;
  const tf = {};
  const terms = Object.keys(freq);
  for (let i = 0; i < terms.length; i++) {
    tf[terms[i]] = freq[terms[i]] / len;
  }
  return tf;
}

/** Cosine similarity between two tf-idf vectors */
function cosineSim(a, b) {
  let dot = 0, magA = 0, magB = 0;
  const aKeys = Object.keys(a);
  for (let i = 0; i < aKeys.length; i++) {
    const t = aKeys[i];
    const v = a[t];
    magA += v * v;
    if (b[t]) dot += v * b[t];
  }
  const bVals = Object.values(b);
  for (let i = 0; i < bVals.length; i++) magB += bVals[i] * bVals[i];
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/** Derive URL slug from file path relative to ROOT */
function slugFromPath(filePath) {
  let rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  rel = rel.replace(/\/index\.njk$/, '/').replace(/\.njk$/, '/');
  if (!rel.startsWith('/')) rel = '/' + rel;
  return rel;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
const t0 = Date.now();

const allFiles = collectNjk(ROOT);
console.log('Found ' + allFiles.length + ' .njk files');

// Parse each file
const docs = [];
for (let fi = 0; fi < allFiles.length; fi++) {
  const filePath = allFiles[fi];
  let src;
  try { src = fs.readFileSync(filePath, 'utf8'); }
  catch (e) { continue; }

  const parsed = parseFrontMatter(src);
  const meta = parsed.meta;
  const body = parsed.body;

  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel.startsWith('_includes/')) continue;

  const title       = meta.title || meta.og_title || '';
  const description = meta.description || meta.og_description || '';
  const canonical   = meta.canonical || '';
  const pageLang    = (meta.pageLang || 'nl').toLowerCase().replace(/-.*$/, '');
  const h1          = extractH1(body);
  const bodySnippet = stripMarkup(body).slice(0, 500);

  // Derive URL from canonical or file path
  let url;
  if (canonical) {
    try {
      const u = new URL(canonical);
      url = u.pathname;
      if (!url.endsWith('/')) url += '/';
    } catch (e) {
      url = slugFromPath(filePath);
    }
  } else {
    url = slugFromPath(filePath);
  }

  const text   = [title, description, h1, bodySnippet].join(' ');
  const tokens = tokenize(text, pageLang);
  const tf     = computeTF(tokens);

  docs.push({ url: url, title: title, pageLang: pageLang, tf: tf, tokens: tokens });
}

console.log('Parsed ' + docs.length + ' valid docs');

// Group by language
const byLang = {};
for (let i = 0; i < docs.length; i++) {
  const doc = docs[i];
  if (!byLang[doc.pageLang]) byLang[doc.pageLang] = [];
  byLang[doc.pageLang].push(doc);
}

// Compute IDF per language, then TF-IDF vectors
const langStats = {};
const langKeys = Object.keys(byLang);
for (let li = 0; li < langKeys.length; li++) {
  const lang = langKeys[li];
  const langDocs = byLang[lang];
  const N = langDocs.length;

  // document frequency per term
  const df = {};
  for (let i = 0; i < langDocs.length; i++) {
    const terms = Object.keys(langDocs[i].tf);
    for (let j = 0; j < terms.length; j++) {
      const term = terms[j];
      df[term] = (df[term] || 0) + 1;
    }
  }

  // IDF
  const idf = {};
  const dfKeys = Object.keys(df);
  for (let i = 0; i < dfKeys.length; i++) {
    const term = dfKeys[i];
    idf[term] = Math.log(N / df[term]);
  }

  // Build TF-IDF vectors
  for (let i = 0; i < langDocs.length; i++) {
    const doc = langDocs[i];
    const vec = {};
    const tfKeys = Object.keys(doc.tf);
    for (let j = 0; j < tfKeys.length; j++) {
      const term = tfKeys[j];
      vec[term] = doc.tf[term] * (idf[term] || 0);
    }
    doc.vec = vec;
  }
  langStats[lang] = { count: N };
}

// Compute cosine similarity all-pairs within language, collect top-N
const result = {};
const connectionCount = {};
let totalRelated = 0;

for (let li = 0; li < langKeys.length; li++) {
  const lang = langKeys[li];
  const langDocs = byLang[lang];

  for (let i = 0; i < langDocs.length; i++) {
    const docA = langDocs[i];
    const sims = [];

    for (let j = 0; j < langDocs.length; j++) {
      if (i === j) continue;
      const docB = langDocs[j];
      const sim = cosineSim(docA.vec, docB.vec);
      if (sim >= MIN_SIMILARITY) {
        sims.push({ url: docB.url, title: docB.title, similarity: Math.round(sim * 1000) / 1000 });
      }
    }

    sims.sort(function(a, b) { return b.similarity - a.similarity; });
    const top = sims.slice(0, TOP_N);

    result[docA.url] = {
      pageLang: docA.pageLang,
      related: top
    };

    connectionCount[docA.url] = top.length;
    if (top.length >= 3) totalRelated++;
  }
}

// Write output
const outDir = path.dirname(OUT);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');

const elapsed = Date.now() - t0;
const outSizeKB = Math.round(fs.statSync(OUT).size / 1024);

// Summary
console.log('\n=== Internal Link Builder Summary ===');
for (let li = 0; li < langKeys.length; li++) {
  const lang = langKeys[li];
  const langDocs = byLang[lang];
  let sumRelated = 0;
  for (let i = 0; i < langDocs.length; i++) sumRelated += (connectionCount[langDocs[i].url] || 0);
  const avgRelated = (sumRelated / langDocs.length).toFixed(1);
  console.log('  ' + lang.toUpperCase() + ': ' + langStats[lang].count + ' pages, avg ' + avgRelated + ' related');
}
console.log('  Total entries with 3+ related: ' + totalRelated);
console.log('  Output: ' + OUT + ' (' + outSizeKB + ' KB)');
console.log('  Elapsed: ' + elapsed + ' ms');

// Top-5 most connected pages
const allEntries = Object.entries(connectionCount);
allEntries.sort(function(a, b) { return b[1] - a[1]; });
const top5 = allEntries.slice(0, 5);
console.log('\nTop-5 most connected pages:');
for (let i = 0; i < top5.length; i++) {
  const url   = top5[i][0];
  const count = top5[i][1];
  const top1  = result[url] && result[url].related[0];
  console.log('  ' + url + ' — ' + count + ' related' + (top1 ? ' (top: ' + top1.url + ' sim ' + top1.similarity + ')' : ''));
}
console.log('=====================================\n');
