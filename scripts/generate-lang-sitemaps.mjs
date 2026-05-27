#!/usr/bin/env node
/**
 * generate-lang-sitemaps.mjs
 * Reads sitemap.xml, groups <url> blocks by language prefix,
 * writes sitemap-nl.xml / sitemap-en.xml / sitemap-de.xml /
 *        sitemap-tr.xml / sitemap-pl.xml to project root.
 *
 * Language detection:
 *   /en/...  -> en
 *   /de/...  -> de
 *   /tr/...  -> tr
 *   /pl/...  -> pl
 *   anything else (root NL paths) -> nl
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const LANGS = ['nl', 'en', 'de', 'tr', 'pl']

// --- read source sitemap ---
const src = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8')

// Split on <url> boundaries -- each block starts with <url> ends with </url>
const urlBlockRegex = /<url>[\s\S]*?<\/url>/g
const blocks = src.match(urlBlockRegex) || []

// --- bucket by lang ---
const buckets = Object.fromEntries(LANGS.map(l => [l, []]))

for (const block of blocks) {
  // extract <loc> value
  const locMatch = block.match(/<loc>([^<]+)<\/loc>/)
  if (!locMatch) continue
  const loc = locMatch[1]

  let lang = 'nl'
  for (const candidate of ['en', 'de', 'tr', 'pl']) {
    if (loc.includes(`/${candidate}/`)) {
      lang = candidate
      break
    }
  }
  buckets[lang].push(block)
}

// --- write one sitemap per lang ---
for (const lang of LANGS) {
  const urls = buckets[lang]
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
  ].join('\n')

  const dest = join(ROOT, `sitemap-${lang}.xml`)
  writeFileSync(dest, xml, 'utf8')
  console.log(`sitemap-${lang}.xml  ->  ${urls.length} URLs`)
}

console.log(`\nTotal blocks processed: ${blocks.length}`)
