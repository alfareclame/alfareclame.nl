#!/usr/bin/env node
/**
 * generate-avif-images.js — Sprint 11 H2.1
 * Converts top 30 images (by file size) to AVIF siblings.
 * Usage: node scripts/generate-avif-images.js
 * Requires: sharp ^0.33.x  (npm install sharp)
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ---------------------------------------------------------------------------
// Resolve repo root relative to this script
// ---------------------------------------------------------------------------
const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');

// ---------------------------------------------------------------------------
// Minimal glob: recursively collect image files
// ---------------------------------------------------------------------------
function collectImages(dir, exts = ['.jpg', '.jpeg', '.png', '.webp']) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectImages(full, exts));
    } else if (exts.includes(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Pick top 30 by file size, skip favicons & already-existing avif siblings
// ---------------------------------------------------------------------------
function pickTop30(allFiles) {
  const withSize = allFiles
    .filter(f => !path.basename(f).startsWith('favicon'))
    .map(f => ({ file: f, size: fs.statSync(f).size }))
    .sort((a, b) => b.size - a.size);

  const top = [];
  for (const item of withSize) {
    if (top.length >= 30) break;
    const avifPath = item.file.replace(/\.(jpg|jpeg|png|webp)$/i, '.avif');
    // skip if .avif already exists (idempotent)
    if (fs.existsSync(avifPath)) {
      console.log(`  SKIP (avif exists): ${path.relative(ROOT, item.file)}`);
      continue;
    }
    top.push({ ...item, avifPath });
  }
  return top;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (err) {
    console.error('');
    console.error('ERROR: sharp module not found.');
    console.error('  Run: npm install sharp');
    console.error('  Windows note: sharp requires native binaries (node-gyp).');
    console.error('  On CI (Linux): npm install sharp succeeds automatically.');
    console.error('  Script exits with code 1 so CI can detect the problem.');
    console.error('');
    process.exit(1);
  }

  console.log('\n=== generate-avif-images.js — Alfa Reclame Sprint 11 ===\n');

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const allFiles = collectImages(IMAGES_DIR);
  console.log(`Found ${allFiles.length} source image files total.\n`);

  const targets = pickTop30(allFiles);
  console.log(`Processing top ${targets.length} images (by file size, skipping existing AVIF):\n`);

  let succeeded = 0;
  let failed    = 0;
  let totalSavedBytes = 0;
  let totalOrigBytes  = 0;

  for (const { file, size, avifPath } of targets) {
    const rel = path.relative(ROOT, file);
    try {
      await sharp(file)
        .avif({ quality: 72, effort: 4 })
        .toFile(avifPath);

      const avifSize = fs.statSync(avifPath).size;
      const saved    = size - avifSize;
      const pct      = ((saved / size) * 100).toFixed(1);

      totalOrigBytes  += size;
      totalSavedBytes += Math.max(0, saved);

      console.log(
        `  OK  ${rel}\n` +
        `      ${(size / 1024).toFixed(1)} KB  ->  ${(avifSize / 1024).toFixed(1)} KB AVIF  (${pct}% smaller)\n`
      );
      succeeded++;
    } catch (err) {
      console.error(`  FAIL ${rel}: ${err.message}`);
      failed++;
    }
  }

  const totalPct = totalOrigBytes > 0
    ? ((totalSavedBytes / totalOrigBytes) * 100).toFixed(1)
    : '0';

  console.log('\n=== Summary ===');
  console.log(`  Processed : ${succeeded + failed} images`);
  console.log(`  Succeeded : ${succeeded}`);
  console.log(`  Failed    : ${failed}`);
  console.log(`  Total saved: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB  (avg ${totalPct}% per image)\n`);

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
