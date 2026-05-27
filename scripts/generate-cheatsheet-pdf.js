'use strict';

/**
 * generate-cheatsheet-pdf.js
 *
 * Generates data/cheatsheet-rotterdam-signage-2026.pdf (12 pages A4)
 * using pdfkit. Reads data files from the project root.
 *
 * Usage:
 *   node scripts/generate-cheatsheet-pdf.js
 *
 * Requires pdfkit in devDependencies:
 *   npm install  (after pdfkit is added to package.json)
 */

const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// ── Paths ──────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'data', 'cheatsheet-rotterdam-signage-2026.pdf');

function loadJson(filename) {
  const fullPath = path.join(ROOT, 'data', filename);
  if (!fs.existsSync(fullPath)) {
    console.warn('[WARN] Data file not found: ' + filename + ' — using empty fallback');
    return {};
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

// ── Load data ──────────────────────────────────────────────────────────────
const kb = loadJson('rotterdam-signage-knowledge-base.json');
const prijslijst = loadJson('sectorprijslijst-2026.json');
const reviews = loadJson('reviews.json');

const kbData = (kb && kb.data) ? kb.data : {};
const materials = Array.isArray(kbData.materials) ? kbData.materials.slice(0, 12) : [];
const permits = Array.isArray(kbData.permits) ? kbData.permits.slice(0, 8) : [];
const sectorCompliance = Array.isArray(kbData.sector_compliance) ? kbData.sector_compliance.slice(0, 8) : [];
const wijkSpecifics = Array.isArray(kbData.wijk_specifics) ? kbData.wijk_specifics.slice(0, 8) : [];
const pricingData = Array.isArray(prijslijst.data) ? prijslijst.data.slice(0, 12) : [];
const reviewItems = Array.isArray(reviews.items) ? reviews.items.slice(0, 3) : [];

// ── Colour / typography constants ──────────────────────────────────────────
const BRAND   = '#0071E3';
const INK     = '#1D1D1F';
const MUTED   = '#6E6E73';
const LIGHT   = '#F5F5F7';
const WHITE   = '#FFFFFF';

const MARGIN_X  = 56;
const PAGE_W    = 595.28;
const PAGE_H    = 841.89;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

// ── Helper functions ───────────────────────────────────────────────────────

function pageHeader(doc, pageNum) {
  doc.rect(0, 0, PAGE_W, 28).fill(INK);
  doc.fillColor(WHITE).fontSize(8).font('Helvetica').text(
    'ALFA RECLAME ROTTERDAM  |  alfareclame.nl  |  +31 6 24 74 15 97',
    MARGIN_X, 9, { width: CONTENT_W, align: 'left' }
  );
  doc.text('p. ' + pageNum + ' / 12', MARGIN_X, 9, { width: CONTENT_W, align: 'right' });
  doc.fillColor(INK);
}

function pageFooter(doc) {
  var y = PAGE_H - 30;
  doc.rect(0, y, PAGE_W, 30).fill(LIGHT);
  doc.fillColor(MUTED).fontSize(7).font('Helvetica').text(
    'Alfa Reclame Rotterdam — Signage Cheatsheet 2026 — CC BY 4.0 — alfareclame.nl/cheatsheet-signage-rotterdam-2026/',
    MARGIN_X, y + 10, { width: CONTENT_W, align: 'center' }
  );
  doc.fillColor(INK);
}

function addPage(doc, pageNum) {
  if (pageNum > 1) doc.addPage();
  pageHeader(doc, pageNum);
  pageFooter(doc);
  doc.y = 44;
}

function sectionTitle(doc, text) {
  var top = doc.y;
  doc.rect(MARGIN_X, top, CONTENT_W, 1).fill(BRAND);
  doc.fillColor(BRAND).fontSize(13).font('Helvetica-Bold').text(text, MARGIN_X, top + 6);
  doc.fillColor(INK);
  doc.moveDown(0.5);
}

function subHeading(doc, text) {
  doc.fillColor(INK).fontSize(10).font('Helvetica-Bold').text(text, MARGIN_X, doc.y);
  doc.moveDown(0.3);
}

function bodyText(doc, text) {
  doc.fillColor(INK).fontSize(9).font('Helvetica').text(text, MARGIN_X, doc.y, { width: CONTENT_W, lineGap: 2 });
  doc.moveDown(0.4);
}

function mutedText(doc, text) {
  doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(text, MARGIN_X, doc.y, { width: CONTENT_W });
  doc.fillColor(INK);
  doc.moveDown(0.3);
}

function tableRow(doc, cols, colWidths, isHeader) {
  var rowY = doc.y;
  var rowH = isHeader ? 18 : 16;
  var totalW = colWidths.reduce(function (a, b) { return a + b; }, 0);

  if (isHeader) {
    doc.rect(MARGIN_X, rowY, totalW, rowH).fill(LIGHT);
  }

  var x = MARGIN_X;
  cols.forEach(function (col, i) {
    doc
      .fillColor(isHeader ? MUTED : INK)
      .fontSize(isHeader ? 7.5 : 8.5)
      .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
      .text(String(col || ''), x + 4, rowY + 4, { width: colWidths[i] - 8, ellipsis: true });
    x += colWidths[i];
  });

  doc.rect(MARGIN_X, rowY + rowH - 1, totalW, 0.5).fill('#DDDDDD');
  doc.y = rowY + rowH;
}

function formatEur(n) {
  return n != null ? String(n) : '—';
}

// ── PDF Generation ─────────────────────────────────────────────────────────
var doc = new PDFDocument({ size: 'A4', margin: 0, info: {
  Title: 'Signage Rotterdam Cheatsheet 2026',
  Author: 'Alfa Reclame Rotterdam',
  Subject: 'Signage prijzen, materialen, vergunningen en welstand-tips Rotterdam 2026',
  Keywords: 'signage Rotterdam, raambelettering, gevelreclame, autoreclame, vinyl, vergunning',
  Creator: 'Alfa Reclame Rotterdam — generate-cheatsheet-pdf.js',
  Producer: 'pdfkit',
}});

var outStream = fs.createWriteStream(OUT_PATH);
doc.pipe(outStream);

// ──────────────────────────────────────────────────────────────────────────
// PAGE 1 — Cover
// ──────────────────────────────────────────────────────────────────────────
addPage(doc, 1);

// Hero background block
doc.rect(0, 28, PAGE_W, 320).fill(INK);

// Version badge
doc.rect(MARGIN_X, 60, 130, 18).fill(BRAND);
doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold').text('VERSIE 1.0  •  2026-05-27', MARGIN_X + 6, 65);

// Title
doc.fillColor(WHITE).fontSize(28).font('Helvetica-Bold').text(
  'Signage Rotterdam\nCheatsheet 2026',
  MARGIN_X, 90, { width: CONTENT_W, lineGap: 4 }
);

// Subtitle
doc.fillColor(BRAND).fontSize(12).font('Helvetica').text(
  '12 pagina\'s  •  Prijzen, Materialen, Vergunningen, Wijk-tips',
  MARGIN_X, 170, { width: CONTENT_W }
);

// Separator line
doc.rect(MARGIN_X, 196, CONTENT_W, 1).fill(BRAND);

// Intro paragraph
doc.fillColor(WHITE).fontSize(10).font('Helvetica').text(
  'Alles wat u moet weten over signage in Rotterdam: actuele marktprijzen (500+ projecten 2024-2026), materiaalkeuze per toepassing, stap-voor-stap vergunninggids en wijk-specifieke welstandstips - samengesteld door Alfa Reclame.',
  MARGIN_X, 204, { width: CONTENT_W, lineGap: 3 }
);

// Highlights strip
var highlights = ['12 pagina\'s A4', '12 diensten', '4 merken vergeleken', 'CC BY 4.0', 'Rotterdam 2026'];
var hx = MARGIN_X;
var hlW = Math.floor(CONTENT_W / highlights.length) - 4;
highlights.forEach(function (hl) {
  doc.rect(hx, 278, hlW, 28).fill(BRAND);
  doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold').text(hl, hx + 4, 285, { width: hlW - 8, align: 'center' });
  hx += hlW + 5;
});

// Footer of cover area
doc.fillColor(WHITE).fontSize(9).font('Helvetica').text(
  'Alfa Reclame Rotterdam  |  KvK 88606902  |  +31 6 24 74 15 97  |  info@alfareclame.nl',
  MARGIN_X, 336, { width: CONTENT_W, align: 'center' }
);

doc.y = 370;
doc.fillColor(INK).fontSize(11).font('Helvetica-Bold').text('Over deze cheatsheet', MARGIN_X);
doc.moveDown(0.4);
bodyText(doc, 'Deze cheatsheet is samengesteld door Marco, eigenaar van Alfa Reclame Rotterdam, op basis van 14 jaar Rotterdamse signage-ervaring en meer dan 500 uitgevoerde projecten. De informatie is aangevuld met officieel gemeentelijk beleid (APV Rotterdam, Welstandsnota 2018) en fabrikant-technische datasheets van 3M, Avery Dennison, Hexis en Orafol.');
doc.moveDown(0.3);
bodyText(doc, 'De cheatsheet is vrijgegeven onder Creative Commons Attribution 4.0 International (CC BY 4.0). Vrij te gebruiken, delen en distribueren met bronvermelding. Zie pagina 12 voor licentiedetails.');

// ──────────────────────────────────────────────────────────────────────────
// PAGE 2 — Table of Contents
// ──────────────────────────────────────────────────────────────────────────
addPage(doc, 2);
doc.y = 50;
doc.fillColor(INK).fontSize(18).font('Helvetica-Bold').text('Inhoudsopgave', MARGIN_X, doc.y);
doc.moveDown(0.8);

var toc = [
  { pg: '3-4', title: 'Sectie 1: Prijzen 2026 per dienst', desc: 'Raambelettering t/m fleet-wrap, 12 diensten, EUR excl. BTW + doorlooptijden' },
  { pg: '5-6', title: 'Sectie 2: Materiaal-keuze gids', desc: '3M IJ180Cv3 vs Avery MPI 1105 vs Hexis Vincite Pro vs Orafol — vergelijkingstabel' },
  { pg: '7-8', title: 'Sectie 3: Vergunning-stappen', desc: 'Omgevingsvergunning + welstandstoets, doorlooptijden, vrijstellingen Rotterdam' },
  { pg: '9',   title: 'Sectie 4: Wijk-specifieke welstand-tips', desc: 'Centrum, Delfshaven, Hoogvliet, Kop van Zuid, Kralingen, Botlek — per wijk do\'s & don\'ts' },
  { pg: '10',  title: 'Sectie 5: Sector-compliance', desc: 'Zorg, transport, horeca, bouw — NEN 1414, ECE-R104, HACCP, AVG per sector' },
  { pg: '11',  title: 'Sectie 6: Reviews & contact', desc: 'Klant-citaten + Alfa Reclame contactgegevens en offerteproces' },
  { pg: '12',  title: 'Licentie & colofon', desc: 'CC BY 4.0, bronvermelding, KvK, garantie, disclaimer' },
];

toc.forEach(function (item) {
  var rowY = doc.y;
  doc.rect(MARGIN_X, rowY, 36, 22).fill(BRAND);
  doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold').text(item.pg, MARGIN_X, rowY + 6, { width: 36, align: 'center' });
  doc.fillColor(INK).fontSize(10).font('Helvetica-Bold').text(item.title, MARGIN_X + 44, rowY + 1, { width: CONTENT_W - 44 });
  doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(item.desc, MARGIN_X + 44, rowY + 13, { width: CONTENT_W - 44 });
  doc.rect(MARGIN_X, rowY + 26, CONTENT_W, 0.5).fill('#EEEEEE');
  doc.y = rowY + 32;
});

doc.moveDown(1);
mutedText(doc, 'Alle prijzen zijn indicatief en exclusief BTW, tenzij anders vermeld. Raadpleeg alfareclame.nl/tarieven/ voor actuele pakket-prijzen.');

// ──────────────────────────────────────────────────────────────────────────
// PAGES 3-4 — Prijzen 2026
// ──────────────────────────────────────────────────────────────────────────
addPage(doc, 3);
doc.y = 50;
sectionTitle(doc, 'SECTIE 1 — Prijzen 2026 per dienst');
bodyText(doc, 'Marktdata gebaseerd op 514 Rotterdamse signage-projecten 2024-2026 (MKB-segment). Prijzen exclusief BTW. Mediaan = meest representatief voor doorsnee-project.');
doc.moveDown(0.3);

var priceColW = [130, 58, 62, 58, 58, 116];
tableRow(doc, ['Dienst', 'Min', 'Mediaan', 'Gemiddeld', 'Max', 'Prijsfactoren (top 2)'], priceColW, true);

// Fallback pricing if data file is empty
var pricingFallback = [
  { service: 'Raambelettering', min: 149, median: 295, mean: 412, max: 2500, price_drivers: ['oppervlakte', 'vinyl-type'] },
  { service: 'Bestickering', min: 149, median: 595, mean: 1180, max: 9995, price_drivers: ['oppervlakte', 'substraat'] },
  { service: 'Autoreclame partial', min: 495, median: 1295, mean: 1650, max: 5500, price_drivers: ['% dekking', 'kleurproductie'] },
  { service: 'Voertuig full-wrap', min: 2495, median: 3995, mean: 4200, max: 8500, price_drivers: ['voertuigklasse', 'ontwerp-complexiteit'] },
  { service: 'Gevelreclame banner', min: 295, median: 695, mean: 820, max: 2800, price_drivers: ['formaat', 'printmethode'] },
  { service: 'Doosletters basis', min: 1295, median: 2995, mean: 3400, max: 8500, price_drivers: ['letters-aantal', 'materiaal'] },
  { service: 'Lichtreclame LED', min: 2995, median: 6500, mean: 7200, max: 25000, price_drivers: ['oppervlakte', 'LED-type'] },
  { service: 'Spandoek print', min: 65, median: 195, mean: 280, max: 950, price_drivers: ['oppervlakte m2', 'printmethode'] },
];
var pricingToUse = pricingData.length > 0 ? pricingData : pricingFallback;

pricingToUse.slice(0, 8).forEach(function (item) {
  if (doc.y > PAGE_H - 80) return;
  var drivers = Array.isArray(item.price_drivers) ? item.price_drivers.slice(0, 2).join(', ') : '—';
  tableRow(doc, [
    item.service || '—',
    formatEur(item.min),
    formatEur(item.median),
    formatEur(item.mean),
    formatEur(item.max),
    drivers,
  ], priceColW, false);
});

addPage(doc, 4);
doc.y = 50;
sectionTitle(doc, 'SECTIE 1 — Prijzen 2026 (vervolg)');
tableRow(doc, ['Dienst', 'Min', 'Mediaan', 'Gemiddeld', 'Max', 'Prijsfactoren (top 2)'], priceColW, true);

pricingToUse.slice(8).forEach(function (item) {
  if (doc.y > PAGE_H - 80) return;
  var drivers = Array.isArray(item.price_drivers) ? item.price_drivers.slice(0, 2).join(', ') : '—';
  tableRow(doc, [
    item.service || '—',
    formatEur(item.min),
    formatEur(item.median),
    formatEur(item.mean),
    formatEur(item.max),
    drivers,
  ], priceColW, false);
});

doc.moveDown(0.8);
subHeading(doc, 'Doorlooptijd per dienst (indicatief, excl. vergunning)');
var dtColW = [230, 250];
tableRow(doc, ['Dienst', 'Indicatieve doorlooptijd'], dtColW, true);
var doorlooptijden = [
  ['Raambelettering standaard', '3-5 werkdagen'],
  ['Raambelettering maatwerk / etsfolie', '5-10 werkdagen'],
  ['Voertuig full-wrap', '3-7 werkdagen'],
  ['Gevelreclame doosletters', '10-20 werkdagen + vergunning'],
  ['Lichtreclame LED', '15-25 werkdagen + vergunning'],
  ['Silobelettering >10m', '10-20 werkdagen (hoogwerker + planning)'],
  ['Spandoek / banner standaard', '2-4 werkdagen'],
  ['Magneetfolie stel', '2-4 werkdagen'],
];
doorlooptijden.forEach(function (row) { tableRow(doc, row, dtColW, false); });
mutedText(doc, '* Vergunning omgevingsvergunning voegt 8-26 weken toe afhankelijk van type en zone.');

// ──────────────────────────────────────────────────────────────────────────
// PAGES 5-6 — Materiaal-keuze gids
// ──────────────────────────────────────────────────────────────────────────
addPage(doc, 5);
doc.y = 50;
sectionTitle(doc, 'SECTIE 2 — Materiaal-keuze gids');
bodyText(doc, 'Vier A-merk vinyl-families die Alfa Reclame inzet voor Rotterdamse projecten. Keuze bepaald door toepassing, levensduur-eis, oppervlak en budget.');

var matDefault = [
  { term: '3M IJ180Cv3 Controltac', category: 'vinyl-cast', definition_nl: 'Gegoten cast vinyl met Controltac-technologie (microscopisch kleine glasbolletjes reduceren initieel kleef voor luchtbelvrije applicatie). Buitenlevensduur 7 jaar, conformability klasse hoog, geschikt voor gekromde oppervlakken zoals voertuigen en cilinders.' },
  { term: 'Avery MPI 1105 Easy Apply RS', category: 'vinyl-cast', definition_nl: 'Gegoten cast vinyl met Easy Apply RS luchtkanalen voor bobbel-vrije applicatie. Buitenlevensduur 9 jaar bij correcte verwijdering, low-tack initieel voor herpositionering. Geschikt voor voertuigwraps en gevelapplicaties.' },
  { term: 'Hexis Vincite Pro', category: 'vinyl-cast', definition_nl: 'Premium wrap-folie van Hexis met 10 jaar fabrieksgarantie, hoge conformability voor complexe curves. Verkrijgbaar in glans, mat en satijn. Veelgebruikt voor high-end voertuigwraps en architecturale geveltoepassingen.' },
  { term: 'Orafol Oracal 651', category: 'vinyl-calendered', definition_nl: 'Gekalandreerd intermediate-kwaliteit snijvinyl, buitenlevensduur 6 jaar op vlakke oppervlakken. Standaardkeuze voor raambelettering, bewegwijzering en vlakke geveltoepassingen. Niet geschikt voor sterk gekromde oppervlakken.' },
  { term: 'Orafol 5600E Reflective', category: 'reflective', definition_nl: 'Klasse 2 retroreflecterende folie conform NEN-EN-12899 en ECE-R104. Voor vrachtwagen-contourmarkering >7,5t. RA minimaal 70 cd/(lx m2), levensduur 7 jaar.' },
  { term: '3M FASARA Raamfolie', category: 'specialty', definition_nl: 'Decoratieve raamfolie in 100+ designs, privacy- en zonwering-toepassingen. Niet drukbaar — patroon gefixeerd in folie. Populair in zorg/kantoor voor AVG-raamscheiding.' },
];
var matItems = materials.length > 0 ? materials : matDefault;

var matColW = [140, 80, 263];
tableRow(doc, ['Product', 'Type', 'Definitie / Toepassing'], matColW, true);
matItems.slice(0, 8).forEach(function (m) {
  if (doc.y > PAGE_H - 80) return;
  tableRow(doc, [
    m.term || '—',
    m.category || '—',
    (m.definition_nl || '').slice(0, 130),
  ], matColW, false);
});

addPage(doc, 6);
doc.y = 50;
sectionTitle(doc, 'SECTIE 2 — Materiaal-vergelijkingstabel');

var compareHeaders = ['Eigenschap', '3M IJ180Cv3', 'Avery MPI 1105', 'Hexis Vincite', 'Orafol 651'];
var compareColW = [118, 100, 100, 100, 65];
var compareRows = [
  ['Type', 'Cast vinyl', 'Cast vinyl', 'Cast vinyl', 'Calendered'],
  ['Levensduur buiten', '7 jaar', '9 jaar', '10 jaar', '6 jaar (vlak)'],
  ['Conformability', 'Hoog', 'Hoog', 'Zeer hoog', 'Medium'],
  ['Luchtkanalen', 'Microsferen', 'RS Easy Apply', 'Wrap-tech', 'Geen'],
  ['Toepassing', 'Voertuig/gevel', 'Voertuig/gevel', 'High-end wrap', 'Raam/vlak gevel'],
  ['Prijs-indicatie', 'EUR EUR', 'EUR EUR', 'EUR EUR EUR', 'EUR'],
  ['Geschikt curves', 'Ja', 'Ja', 'Ja — optimaal', 'Beperkt'],
  ['Verwijderbaarheid', 'Schoon (7jr)', 'Schoon (9jr)', 'Schoon (10jr)', 'Matig >5jr'],
];

tableRow(doc, compareHeaders, compareColW, true);
compareRows.forEach(function (row) { tableRow(doc, row, compareColW, false); });

doc.moveDown(0.8);
subHeading(doc, 'Wanneer welk materiaal kiezen?');
var adviceColW = [240, 242];
var advice = [
  ['Voertuig-wrap (personen/bestelwagen)', 'Hexis Vincite Pro of 3M IJ180Cv3'],
  ['Raambelettering standaard', 'Orafol 651 of Avery MPI 1105'],
  ['Gevelreclame vlak oppervlak', 'Orafol 651 (kostenefficient) of 3M IJ180Cv3'],
  ['Gevelreclame gebogen/gecorrigeerd', '3M IJ180Cv3 of Avery MPI 1105'],
  ['Silobelettering >10m (levensduur)', 'Avery MPI 1105 (9jr) of 3M IJ180Cv3 (7jr)'],
  ['Retroreflectie vrachtwagen ECE-R104', 'Orafol 5600E (klasse 2 retroreflectief)'],
  ['Groene aanbesteding PVC-vrij', '3M Envision LX480mC (op aanvraag)'],
  ['Privacy raamfolie zorg/kantoor', '3M FASARA of gelijkwaardige decoratieve folie'],
];
tableRow(doc, ['Toepassing', 'Aanbevolen materiaal'], adviceColW, true);
advice.forEach(function (row) { tableRow(doc, row, adviceColW, false); });

// ──────────────────────────────────────────────────────────────────────────
// PAGES 7-8 — Vergunning-stappen
// ──────────────────────────────────────────────────────────────────────────
addPage(doc, 7);
doc.y = 50;
sectionTitle(doc, 'SECTIE 3 — Vergunning-stappen Rotterdam');
bodyText(doc, 'Gevelreclame, lichtreclame en buitenreclame zijn in Rotterdam meestal vergunningsplichtig. Stap-voor-stap procedure voor omgevingsvergunning:');

var steps = [
  { n: '1', title: 'Verificeer vergunningsplicht', desc: 'Raadpleeg Welstandsnota Rotterdam 2018 en APV art. 4.2. Kleine uitingen (<0,5 m2 aan eigen pand, niet verlicht, niet bij monument) kunnen vergunningsvrij zijn.' },
  { n: '2', title: 'Tekeningen & omschrijving opstellen', desc: 'Maak schaalnauwkeurige tekeningen: gevelaanzicht, afmetingen, materiaalspecificatie (kleur RAL, vinyl-type), verlichtingsvermogen bij LED (cd/m2).' },
  { n: '3', title: 'Indienen via OLO', desc: 'Dien in via Omgevingsloket Online (omgevingsloket.nl). Activiteit: Handelen in strijd met regels + Bouwen indien constructief bevestigd.' },
  { n: '4', title: 'Welstandstoets', desc: 'Welstandscommissie Rotterdam toetst uw aanvraag. Doorlooptijd: 2-6 weken afhankelijk van zone (zone 1 historisch strikt, zone 3 industrie soepel).' },
  { n: '5', title: 'Wachten op beschikking', desc: 'Reguliere procedure: 8 weken + max. 6 weken verlenging. Uitgebreide procedure: 26 weken. U ontvangt de beschikking digitaal via het OLO-account.' },
  { n: '6', title: 'Realiseren na onherroepelijkheid', desc: 'Start realisatie pas na onherroepelijkheid (6 weken na vergunningsdatum indien geen bezwaar). Bewaar vergunde tekeningen voor handhaving.' },
];

steps.forEach(function (step) {
  if (doc.y > PAGE_H - 80) return;
  var sy = doc.y;
  doc.rect(MARGIN_X, sy, 22, 22).fill(BRAND);
  doc.fillColor(WHITE).fontSize(12).font('Helvetica-Bold').text(step.n, MARGIN_X, sy + 4, { width: 22, align: 'center' });
  doc.fillColor(INK).fontSize(10).font('Helvetica-Bold').text(step.title, MARGIN_X + 28, sy + 1, { width: CONTENT_W - 28 });
  doc.fillColor(MUTED).fontSize(8.5).font('Helvetica').text(step.desc, MARGIN_X + 28, sy + 13, { width: CONTENT_W - 28, lineGap: 1.5 });
  doc.y = doc.y + 8;
  doc.rect(MARGIN_X, doc.y, CONTENT_W, 0.5).fill('#EEEEEE');
  doc.y = doc.y + 6;
});

addPage(doc, 8);
doc.y = 50;
sectionTitle(doc, 'SECTIE 3 — Doorlooptijden & vrijstellingen');

subHeading(doc, 'Doorlooptijden samengevat');
var dlColW = [200, 120, 162];
tableRow(doc, ['Type aanvraag', 'Wettelijke termijn', 'Reeel incl. welstand'], dlColW, true);
var dlRows = [
  ['Reguliere omgevingsvergunning', '8 + 6 wk opt.', '10-14 weken'],
  ['Uitgebreide procedure (groot formaat)', '26 weken', '28-32 weken'],
  ['Welstandstoets zone 1 (Centrum)', '+4-6 weken', 'Inbegrepen boven'],
  ['Welstandstoets Delfshaven (monument)', '+6-8 weken', 'Inbegrepen boven'],
  ['Tijdelijke reclame evenement', 'Min. 4 wk voor', 'Max. 6 weken geldig'],
];
dlRows.forEach(function (row) { tableRow(doc, row, dlColW, false); });

doc.moveDown(0.8);
subHeading(doc, 'Vergunningsvrij — voorwaarden');
var vrijColW = [270, 212];
tableRow(doc, ['Situatie', 'Voorwaarde'], vrijColW, true);
var vrijRows = [
  ['Reclame aan eigen pand <0,5 m2', 'Geen verlichte reclame; niet bij monument'],
  ['Voertuig-belettering eigen terrein', 'Geen permanente installatie aan bouwwerk'],
  ['Stoepbord/A-bord bij horeca', 'APV-toestemming gemeente + melding'],
  ['Tijdelijk spandoek <2 weken', 'Max. 1x per jaar per locatie; melding gemeente'],
];
vrijRows.forEach(function (row) { tableRow(doc, row, vrijColW, false); });

doc.moveDown(0.8);
subHeading(doc, 'Databronnen vergunningen');
var permitDefault = [
  { term: 'Omgevingsloket Online (OLO)', definition_nl: 'Landelijk digitaal loket voor omgevingsvergunning-aanvragen.' },
  { term: 'APV Rotterdam art. 4.2', definition_nl: 'LED-reclame max 400 cd/m2 overdag, 100 cd/m2 \'s nachts.' },
  { term: 'Welstandsnota Rotterdam 2018', definition_nl: 'Zone 1 historisch strikt; zone 2 modern regulier; zone 3 industrie ruim.' },
  { term: 'Wabo art. 2.1', definition_nl: 'Verbod bouwen/gebruik zonder omgevingsvergunning, met uitzonderingen per AMvB.' },
];
var permitItems2 = permits.length > 0 ? permits : permitDefault;
permitItems2.slice(0, 5).forEach(function (p) {
  if (doc.y > PAGE_H - 60) return;
  bodyText(doc, '• ' + (p.term || '') + ': ' + (p.definition_nl || '').slice(0, 150));
});

// ──────────────────────────────────────────────────────────────────────────
// PAGE 9 — Wijk-specifieke welstand-tips
// ──────────────────────────────────────────────────────────────────────────
addPage(doc, 9);
doc.y = 50;
sectionTitle(doc, 'SECTIE 4 — Wijk-specifieke welstand-tips Rotterdam');
bodyText(doc, 'Rotterdam hanteert drie welstandszones (zone 1 = historisch strikt, zone 2 = modern regulier, zone 3 = industrie/haven ruim). Per wijk de belangrijkste aandachtspunten:');

var wijkDefault = [
  { name: 'Centrum (zone 1)', tips: 'Vrijwel altijd vergunningsplichtig. Geen oversized LED-reclame. Doosletters en retroreflectie mogelijk mits passende welstandstoets. Kleurenpalet passend bij pand-architectuur vereist.' },
  { name: 'Delfshaven (rijksbeschermd stadsgezicht)', tips: 'Extra monumentale toets verplicht. Verlichte reclame nagenoeg uitgesloten. Reversibele bevestiging vereist (geen schroeven in historisch metselwerk). 4-6 weken extra procedure.' },
  { name: 'Kop van Zuid', tips: 'Moderne architectuurzone, hoge kwaliteitseisen materiaal en afwerking. Spiegel/chroom-effecten ongewenst. Hoge aandacht voor nachtelijke lichtimpact op de skyline.' },
  { name: 'Hoogvliet / Prins Alexander', tips: 'Zone 2-3, soepeler beleid. Grootschalige retail-signage gangbaar. LED-reclame mogelijk mits luminantie-rapport aanwezig bij aanvraag.' },
  { name: 'Botlek / Europoort', tips: 'Zone 3 industrie. VCA** gecertificeerde installateur vereist. ATEX-zones: ex-proof armaturen verplicht. RVS 316 marine-grade aanbevolen (zilte atmosfeer).' },
  { name: 'Kralingen (villawijken)', tips: 'Conservatief welstandsbeleid. Geen opvallende LED. Bescheiden formaten. Kleur en materiaal moeten opgaan in groene, rustige omgeving.' },
  { name: 'Feijenoord / Charlois', tips: 'Zone 2, herontwikkeling. Positief voor creatieve en visueel sterke reclame mits uitstraling past bij revitalisering van het gebied.' },
  { name: 'IJsselmonde', tips: 'Zone 2-3. Regulier beleid. Bedrijventerreinen toegankelijk voor billboard en lichtreclame mits aanvraag ingediend bij gemeente.' },
];

var wijkItems2 = wijkSpecifics.length > 0 ? wijkSpecifics.slice(0, 8).map(function (w) {
  return { name: w.wijk || w.name || w.term || '—', tips: (w.definition_nl || w.description || w.tips || '—').slice(0, 280) };
}) : wijkDefault;

wijkItems2.forEach(function (w) {
  if (doc.y > PAGE_H - 70) return;
  doc.fillColor(BRAND).fontSize(10).font('Helvetica-Bold').text(w.name, MARGIN_X, doc.y);
  doc.moveDown(0.2);
  bodyText(doc, w.tips);
  doc.rect(MARGIN_X, doc.y, CONTENT_W, 0.5).fill('#EEEEEE');
  doc.y += 5;
});

// ──────────────────────────────────────────────────────────────────────────
// PAGE 10 — Sector-compliance
// ──────────────────────────────────────────────────────────────────────────
addPage(doc, 10);
doc.y = 50;
sectionTitle(doc, 'SECTIE 5 — Sector-compliance (top 8 sectoren)');
bodyText(doc, 'Elke branche heeft eigen signage-vereisten in Rotterdam. De acht meest gevraagde sectoren:');

var scDefault = [
  { sector: 'Zorg', rule: 'NEN 1414 vluchtrouteaanduiding verplicht. Antimicrobieel vinyl (ISO 22196) voor spreekkamers. AVG-raamfolie voor privacy-scheiding.' },
  { sector: 'Transport / Logistiek', rule: 'ECE-R104 retroreflecterende contourmarkering voor voertuigen >7,5t. VCA-gecertificeerde installateur vereist.' },
  { sector: 'Horeca', rule: 'HACCP food-safe inkten (geen oplosmiddelinkten binnenshuis). APV-melding stoepbord. Alcoholreclame conform DHW art. 20.' },
  { sector: 'Bouw & Aannemerij', rule: 'VCA-installateur bij werken op hoogte. Bouwbord conform CROW 400. Reflecterende kentekenplaat correct zichtbaar.' },
  { sector: 'Advocatuur / Notariaat', rule: 'NOvA/KNB beroepsregels: uitingen niet misleidend, geen resultaatgarantie. Beperkt reclamemateriaal conform beroepscode.' },
  { sector: 'Onderwijs', rule: 'NEN 1414 vluchtrouteaanduiding op kinderhoogte 80-120 cm. AVG leerlingengegevens — geen herkenbaarheid op buitenreclame.' },
  { sector: 'Industrie / Haven', rule: 'ATEX 2014/34/EU ex-proof armaturen in Botlek/Europoort zones. RVS 316 marine-grade bij zilte atmosfeer. VCA Petrochemie.' },
  { sector: 'Retail / Winkelcentrum', rule: 'Conform huisregels beheerder (kleur-palette, max. lumensterkte). Shopfront-richtlijnen koepelorganisatie indien van toepassing.' },
];

var scItems2 = sectorCompliance.length >= 4 ? sectorCompliance.slice(0, 8).map(function (s) {
  return { sector: s.sector || s.term || '—', rule: (s.definition_nl || s.description || '—').slice(0, 200) };
}) : scDefault;

var scColW = [100, 382];
tableRow(doc, ['Sector', 'Kernvereiste(n)'], scColW, true);
scItems2.forEach(function (s) {
  if (doc.y > PAGE_H - 55) return;
  tableRow(doc, [s.sector, s.rule], scColW, false);
});

// ──────────────────────────────────────────────────────────────────────────
// PAGE 11 — Reviews & contact
// ──────────────────────────────────────────────────────────────────────────
addPage(doc, 11);
doc.y = 50;
sectionTitle(doc, 'SECTIE 6 — Klant-ervaringen');
bodyText(doc, 'Alfa Reclame scoort 4,9 sterren op Google (25 reviews). Een selectie van klant-citaten:');
doc.moveDown(0.4);

var revDefault = [
  { quote: 'Snel, scherp geprijsd en kwaliteit top. Er wordt echt meegedacht. Mijn bus ziet er nu echt professioneel uit.', name: 'Mehmet C.', company: 'Transport & Installatie — Rotterdam' },
  { quote: 'Vraagprijs elders was 850 euro. Bij Alfa Reclame 495 euro. Zelfde kwaliteit, betere service. Zeker een aanrader.', name: 'Paolo', company: 'Horeca-ondernemer — Rotterdam' },
  { quote: 'Voor onze franchise-wagens een consistent ontwerp. Levert exact wat is afgesproken, elke keer weer.', name: 'Nadia M.', company: 'Retail-ondernemer — Rotterdam' },
];

var revItems2 = reviewItems.length > 0 ? reviewItems : revDefault;

revItems2.forEach(function (r) {
  if (doc.y > PAGE_H - 90) return;
  doc.rect(MARGIN_X, doc.y, CONTENT_W, 1).fill(BRAND);
  doc.moveDown(0.3);
  doc.fillColor(INK).fontSize(10).font('Helvetica').text(
    '"' + (r.quote || '') + '"',
    MARGIN_X, doc.y, { width: CONTENT_W, lineGap: 2 }
  );
  doc.moveDown(0.3);
  doc.fillColor(BRAND).fontSize(8.5).font('Helvetica-Bold').text(
    '— ' + (r.name || '') + '  |  ' + (r.company || ''),
    MARGIN_X
  );
  doc.moveDown(0.8);
});

doc.moveDown(0.5);
sectionTitle(doc, 'Contact & offerte aanvragen');
doc.moveDown(0.3);

var ctColW = [130, 352];
var contactLines = [
  ['Website', 'alfareclame.nl'],
  ['Cheatsheet-pagina', 'alfareclame.nl/cheatsheet-signage-rotterdam-2026/'],
  ['WhatsApp / Telefoon', '+31 6 24 74 15 97'],
  ['E-mail', 'info@alfareclame.nl'],
  ['Adres', 'Blokfluit 31, 3068 KZ Rotterdam'],
  ['KvK', '88606902'],
  ['Google-rating', '4,9 sterren (25 reviews)'],
  ['Openingstijden', 'Maandag t/m vrijdag 08:00-18:00'],
];
contactLines.forEach(function (row) { tableRow(doc, row, ctColW, false); });

// ──────────────────────────────────────────────────────────────────────────
// PAGE 12 — Licentie & colofon
// ──────────────────────────────────────────────────────────────────────────
addPage(doc, 12);
doc.y = 50;
sectionTitle(doc, 'Licentie & colofon');

doc.fillColor(INK).fontSize(12).font('Helvetica-Bold').text('Creative Commons Attribution 4.0 International (CC BY 4.0)', MARGIN_X, doc.y);
doc.moveDown(0.4);
bodyText(doc, 'U mag deze cheatsheet vrijelijk gebruiken, verspreiden, aanpassen en commercieel inzetten, mits u de volgende bronvermelding opneemt:');
doc.moveDown(0.2);

// Attribution block
var abBlockH = 56;
doc.rect(MARGIN_X, doc.y, CONTENT_W, abBlockH).fill(LIGHT);
var abY = doc.y + 8;
doc.fillColor(INK).fontSize(9).font('Helvetica-Bold').text('Alfa Reclame Rotterdam — Signage Cheatsheet 2026', MARGIN_X + 12, abY, { width: CONTENT_W - 24 });
doc.fillColor(MUTED).fontSize(8.5).font('Helvetica').text('URL: alfareclame.nl/cheatsheet-signage-rotterdam-2026/', MARGIN_X + 12, abY + 14, { width: CONTENT_W - 24 });
doc.text('Licentie: CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/', MARGIN_X + 12, abY + 26, { width: CONTENT_W - 24 });
doc.y = abY + abBlockH;

doc.moveDown(0.6);
subHeading(doc, 'Disclaimer');
bodyText(doc, 'De informatie in deze cheatsheet is gebaseerd op publiek beschikbare normen (NEN, ISO, EU-richtlijnen), officieel gemeentelijk beleid (APV Rotterdam, Welstandsnota 2018) en fabrikant-technische datasheets. Prijzen zijn indicatief en exclusief BTW tenzij anders vermeld. Voor vergunning-aanvragen is officiele verificatie bij gemeente Rotterdam vereist. Alfa Reclame aanvaardt geen aansprakelijkheid voor beslissingen genomen op basis van deze cheatsheet.');

doc.moveDown(0.6);
subHeading(doc, 'Colofon');
var colofonRows = [
  ['Titel', 'Signage Rotterdam Cheatsheet 2026'],
  ['Versie', '1.0'],
  ['Datum publicatie', '2026-05-27'],
  ['Auteur', 'Marco — Alfa Reclame Rotterdam'],
  ['KvK', '88606902'],
  ['Pagina\'s', '12 (A4)'],
  ['Licentie', 'CC BY 4.0'],
  ['Gebaseerd op', '500+ Rotterdamse projecten 2024-2026'],
  ['Jaarlijkse revisie', 'Q2 van elk jaar'],
];
var colColW = [140, 342];
colofonRows.forEach(function (row) { tableRow(doc, row, colColW, false); });

doc.moveDown(0.8);
// Final CTA box
var ctaBoxH = 52;
if (doc.y + ctaBoxH < PAGE_H - 40) {
  doc.rect(MARGIN_X, doc.y, CONTENT_W, ctaBoxH).fill(BRAND);
  var ctaY = doc.y + 10;
  doc.fillColor(WHITE).fontSize(12).font('Helvetica-Bold').text('Signage nodig in Rotterdam?', MARGIN_X + 16, ctaY, { width: CONTENT_W - 32 });
  doc.fillColor(WHITE).fontSize(9).font('Helvetica').text('WhatsApp: wa.me/31624741597 — offerte binnen 24 uur na toesturen locatiefoto.', MARGIN_X + 16, ctaY + 16, { width: CONTENT_W - 32 });
  doc.text('14 jaar ervaring  •  A-merk materiaal  •  2 jaar garantie  •  4,9 sterren', MARGIN_X + 16, ctaY + 30, { width: CONTENT_W - 32 });
}

// ── Finalize ───────────────────────────────────────────────────────────────
doc.end();

outStream.on('finish', function () {
  var stats = fs.statSync(OUT_PATH);
  var sizeKb = Math.round(stats.size / 1024);
  console.log('[OK] PDF gegenereerd: ' + OUT_PATH);
  console.log('[OK] Bestandsgrootte: ' + sizeKb + ' KB (' + stats.size + ' bytes)');
  console.log('[OK] Pagina\'s: 12 (A4)');
});

outStream.on('error', function (err) {
  console.error('[ERROR] PDF schrijffout:', err.message);
  process.exit(1);
});
