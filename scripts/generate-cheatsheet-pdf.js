'use strict';

/**
 * generate-cheatsheet-pdf.js
 *
 * Generates data/cheatsheet-rotterdam-signage-2026-{lang}.pdf (12 pages A4)
 * using pdfkit. Supports 5 languages: nl, en, de, tr, pl.
 *
 * Usage:
 *   node scripts/generate-cheatsheet-pdf.js                  # NL only (+ alias)
 *   node scripts/generate-cheatsheet-pdf.js --lang=en        # single lang
 *   node scripts/generate-cheatsheet-pdf.js --all            # all 5 + alias
 *
 * Requires pdfkit in devDependencies.
 */

const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// ── CLI arg parsing ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const langArgRaw = args.find(function(a) { return a.startsWith('--lang='); });
const langArg = langArgRaw
  ? langArgRaw.split('=')[1]
  : (args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null);
const allFlag = args.includes('--all');
const validLangs = ['nl', 'en', 'de', 'tr', 'pl'];

// ── Paths ──────────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');

function loadJson(filename) {
  var fullPath = path.join(ROOT, 'data', filename);
  if (!fs.existsSync(fullPath)) {
    console.warn('[WARN] Data file not found: ' + filename + ' — using empty fallback');
    return {};
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

// ── Load data ──────────────────────────────────────────────────────────────────
var kb = loadJson('rotterdam-signage-knowledge-base.json');
var prijslijst = loadJson('sectorprijslijst-2026.json');
var reviews = loadJson('reviews.json');

var kbData = (kb && kb.data) ? kb.data : {};
var materials = Array.isArray(kbData.materials) ? kbData.materials.slice(0, 12) : [];
var permits = Array.isArray(kbData.permits) ? kbData.permits.slice(0, 8) : [];
var sectorCompliance = Array.isArray(kbData.sector_compliance) ? kbData.sector_compliance.slice(0, 8) : [];
var wijkSpecifics = Array.isArray(kbData.wijk_specifics) ? kbData.wijk_specifics.slice(0, 8) : [];
var pricingData = Array.isArray(prijslijst.data) ? prijslijst.data.slice(0, 12) : [];
var reviewItems = Array.isArray(reviews.items) ? reviews.items.slice(0, 3) : [];

// ── Colour / typography constants ──────────────────────────────────────────────
var BRAND   = '#0071E3';
var INK     = '#1D1D1F';
var MUTED   = '#6E6E73';
var LIGHT   = '#F5F5F7';
var WHITE   = '#FFFFFF';

var MARGIN_X  = 56;
var PAGE_W    = 595.28;
var PAGE_H    = 841.89;
var CONTENT_W = PAGE_W - MARGIN_X * 2;

// ── Multilingual STRINGS dictionary ───────────────────────────────────────────
var STRINGS = {
  nl: {
    cover_title: 'Signage Rotterdam\nCheatsheet 2026',
    cover_subtitle: '12 pagina\'s  •  Prijzen, Materialen, Vergunningen, Wijk-tips',
    cover_intro: 'Alles wat u moet weten over signage in Rotterdam: actuele marktprijzen (500+ projecten 2024-2026), materiaalkeuze per toepassing, stap-voor-stap vergunninggids en wijk-specifieke welstandstips — samengesteld door Alfa Reclame.',
    cover_about_heading: 'Over deze cheatsheet',
    cover_about_body: 'Deze cheatsheet is samengesteld door Marco, eigenaar van Alfa Reclame Rotterdam, op basis van 14 jaar Rotterdamse signage-ervaring en meer dan 500 uitgevoerde projecten. De informatie is aangevuld met officieel gemeentelijk beleid (APV Rotterdam, Welstandsnota 2018) en fabrikant-technische datasheets van 3M, Avery Dennison, Hexis en Orafol.',
    cover_license_note: 'De cheatsheet is vrijgegeven onder Creative Commons Attribution 4.0 International (CC BY 4.0). Vrij te gebruiken, delen en distribueren met bronvermelding. Zie pagina 12 voor licentiedetails.',
    toc_heading: 'Inhoudsopgave',
    toc_note: 'Alle prijzen zijn indicatief en exclusief BTW, tenzij anders vermeld. Raadpleeg alfareclame.nl/tarieven/ voor actuele pakket-prijzen.',
    section_prices: 'SECTIE 1 — Prijzen 2026 per dienst',
    section_prices_cont: 'SECTIE 1 — Prijzen 2026 (vervolg)',
    section_prices_intro: 'Marktdata gebaseerd op 514 Rotterdamse signage-projecten 2024-2026 (MKB-segment). Prijzen exclusief BTW. Mediaan = meest representatief voor doorsnee-project.',
    section_materials: 'SECTIE 2 — Materiaal-keuze gids',
    section_materials_cont: 'SECTIE 2 — Materiaal-vergelijkingstabel',
    section_materials_intro: 'Vier A-merk vinyl-families die Alfa Reclame inzet voor Rotterdamse projecten. Keuze bepaald door toepassing, levensduur-eis, oppervlak en budget.',
    section_permits: 'SECTIE 3 — Vergunning-stappen Rotterdam',
    section_permits_cont: 'SECTIE 3 — Doorlooptijden & vrijstellingen',
    section_permits_intro: 'Gevelreclame, lichtreclame en buitenreclame zijn in Rotterdam meestal vergunningsplichtig. Stap-voor-stap procedure voor omgevingsvergunning:',
    section_wijk: 'SECTIE 4 — Wijk-specifieke welstand-tips Rotterdam',
    section_wijk_intro: 'Rotterdam hanteert drie welstandszones (zone 1 = historisch strikt, zone 2 = modern regulier, zone 3 = industrie/haven ruim). Per wijk de belangrijkste aandachtspunten:',
    section_sectors: 'SECTIE 5 — Sector-compliance (top 8 sectoren)',
    section_sectors_intro: 'Elke branche heeft eigen signage-vereisten in Rotterdam. De acht meest gevraagde sectoren:',
    section_quotes: 'SECTIE 6 — Klant-ervaringen',
    section_quotes_intro: 'Alfa Reclame scoort 4,9 sterren op Google (25 reviews). Een selectie van klant-citaten:',
    section_contact: 'Contact & offerte aanvragen',
    section_license: 'Licentie & colofon',
    page_label: 'Pagina',
    footer: 'Alfa Reclame Rotterdam — Signage Cheatsheet 2026 — CC BY 4.0 — alfareclame.nl/cheatsheet-signage-rotterdam-2026/',
    cta_heading: 'Signage nodig in Rotterdam?',
    cta_body: 'WhatsApp: wa.me/31624741597 — offerte binnen 24 uur na toesturen locatiefoto.',
  },
  en: {
    cover_title: 'Signage Rotterdam\nCheatsheet 2026',
    cover_subtitle: '12 pages  •  Prices, Materials, Permits, District tips',
    cover_intro: 'Everything you need to know about signage in Rotterdam: current market prices (500+ projects 2024-2026), material selection per application, step-by-step permit guide and district-specific zoning tips — compiled by Alfa Reclame.',
    cover_about_heading: 'About this cheatsheet',
    cover_about_body: 'This cheatsheet was compiled by Marco, owner of Alfa Reclame Rotterdam, based on 14 years of Rotterdam signage experience and more than 500 completed projects. The information is supplemented with official municipal policy (APV Rotterdam, Welstandsnota 2018) and manufacturer technical datasheets from 3M, Avery Dennison, Hexis and Orafol.',
    cover_license_note: 'This cheatsheet is released under Creative Commons Attribution 4.0 International (CC BY 4.0). Free to use, share and distribute with attribution. See page 12 for licence details.',
    toc_heading: 'Table of Contents',
    toc_note: 'All prices are indicative and exclude VAT unless stated otherwise. Visit alfareclame.nl/tarieven/ for current package pricing.',
    section_prices: 'SECTION 1 — Prices 2026 per service',
    section_prices_cont: 'SECTION 1 — Prices 2026 (continued)',
    section_prices_intro: 'Market data based on 514 Rotterdam signage projects 2024-2026 (SME segment). Prices exclude VAT. Median = most representative for average project.',
    section_materials: 'SECTION 2 — Material selection guide',
    section_materials_cont: 'SECTION 2 — Material comparison table',
    section_materials_intro: 'Four A-brand vinyl families used by Alfa Reclame for Rotterdam projects. Choice determined by application, lifespan requirement, surface and budget.',
    section_permits: 'SECTION 3 — Permit steps Rotterdam',
    section_permits_cont: 'SECTION 3 — Lead times & exemptions',
    section_permits_intro: 'Facade signage, illuminated signs and outdoor advertising in Rotterdam usually require a permit. Step-by-step procedure for environmental permit:',
    section_wijk: 'SECTION 4 — District-specific zoning tips Rotterdam',
    section_wijk_intro: 'Rotterdam uses three zoning categories (zone 1 = historically strict, zone 2 = modern regular, zone 3 = industrial/harbour lenient). Key points per district:',
    section_sectors: 'SECTION 5 — Sector compliance (top 8 sectors)',
    section_sectors_intro: 'Each industry has its own signage requirements in Rotterdam. The eight most requested sectors:',
    section_quotes: 'SECTION 6 — Customer experiences',
    section_quotes_intro: 'Alfa Reclame scores 4.9 stars on Google (25 reviews). A selection of customer quotes:',
    section_contact: 'Contact & request a quote',
    section_license: 'Licence & colophon',
    page_label: 'Page',
    footer: 'Alfa Reclame Rotterdam — Signage Cheatsheet 2026 — CC BY 4.0 — alfareclame.nl/cheatsheet-signage-rotterdam-2026/',
    cta_heading: 'Need signage in Rotterdam?',
    cta_body: 'WhatsApp: wa.me/31624741597 — quote within 24 hours after sending a location photo.',
  },
  de: {
    cover_title: 'Signage Rotterdam\nCheatsheet 2026',
    cover_subtitle: '12 Seiten  •  Preise, Materialien, Genehmigungen, Tipps je Viertel',
    cover_intro: 'Alles, was Sie uber Signage in Rotterdam wissen mussen: aktuelle Marktpreise (500+ Projekte 2024-2026), Materialwahl je Anwendung, Schritt-fur-Schritt-Genehmigungsleitfaden und stadtteilspezifische Gestaltungstipps — zusammengestellt von Alfa Reclame.',
    cover_about_heading: 'Uber dieses Cheatsheet',
    cover_about_body: 'Dieses Cheatsheet wurde von Marco, Inhaber von Alfa Reclame Rotterdam, auf Basis von 14 Jahren Erfahrung in der Rotterdamer Signage-Branche und mehr als 500 abgeschlossenen Projekten zusammengestellt. Die Informationen werden durch offizielle Gemeindepolitik (APV Rotterdam, Welstandsnota 2018) und Hersteller-Datenblatter von 3M, Avery Dennison, Hexis und Orafol erganzt.',
    cover_license_note: 'Dieses Cheatsheet wird unter Creative Commons Attribution 4.0 International (CC BY 4.0) veroffentlicht. Kostenlos nutzbar, teilbar und verteilbar mit Quellenangabe. Siehe Seite 12 fur Lizenzdetails.',
    toc_heading: 'Inhaltsverzeichnis',
    toc_note: 'Alle Preise sind Richtwerte und verstehen sich exkl. MwSt., sofern nicht anders angegeben. Aktuelle Paketpreise unter alfareclame.nl/tarieven/',
    section_prices: 'ABSCHNITT 1 — Preise 2026 je Leistung',
    section_prices_cont: 'ABSCHNITT 1 — Preise 2026 (Fortsetzung)',
    section_prices_intro: 'Marktdaten basierend auf 514 Rotterdamer Signage-Projekten 2024-2026 (KMU-Segment). Preise exkl. MwSt. Median = reprasentativster Wert fur Durchschnittsprojekte.',
    section_materials: 'ABSCHNITT 2 — Materialauswahlleitfaden',
    section_materials_cont: 'ABSCHNITT 2 — Materialvergleichstabelle',
    section_materials_intro: 'Vier A-Marken-Vinylfamilien, die Alfa Reclame fur Rotterdamer Projekte einsetzt. Auswahl je nach Anwendung, Lebensdaueranforderung, Untergrund und Budget.',
    section_permits: 'ABSCHNITT 3 — Genehmigungsschritte Rotterdam',
    section_permits_cont: 'ABSCHNITT 3 — Bearbeitungszeiten & Befreiungen',
    section_permits_intro: 'Fassadenwerbung, Leuchtreklame und Aussenwerbung sind in Rotterdam in der Regel genehmigungspflichtig. Schritt-fur-Schritt-Verfahren fur Umweltgenehmigung:',
    section_wijk: 'ABSCHNITT 4 — Stadtteilspezifische Gestaltungstipps Rotterdam',
    section_wijk_intro: 'Rotterdam verwendet drei Gestaltungszonen (Zone 1 = historisch streng, Zone 2 = modern regulier, Zone 3 = Industrie/Hafen grosszugig). Wichtigste Punkte je Stadtteil:',
    section_sectors: 'ABSCHNITT 5 — Branchencompliance (top 8 Branchen)',
    section_sectors_intro: 'Jede Branche hat eigene Signage-Anforderungen in Rotterdam. Die acht am haufigsten angefragten Branchen:',
    section_quotes: 'ABSCHNITT 6 — Kundenerfahrungen',
    section_quotes_intro: 'Alfa Reclame erreicht 4,9 Sterne bei Google (25 Bewertungen). Eine Auswahl von Kundenzitaten:',
    section_contact: 'Kontakt & Angebot anfordern',
    section_license: 'Lizenz & Impressum',
    page_label: 'Seite',
    footer: 'Alfa Reclame Rotterdam — Signage Cheatsheet 2026 — CC BY 4.0 — alfareclame.nl/cheatsheet-signage-rotterdam-2026/',
    cta_heading: 'Signage in Rotterdam gesucht?',
    cta_body: 'WhatsApp: wa.me/31624741597 — Angebot innerhalb 24 Stunden nach Zusendung eines Standortfotos.',
  },
  tr: {
    cover_title: 'Rotterdam Tabela\nCheatsheet 2026',
    cover_subtitle: '12 sayfa  •  Fiyatlar, Malzemeler, Izinler, Bolge Ipuclari',
    cover_intro: 'Rotterdam\'da tabela hakkinda bilmeniz gereken her sey: guncel piyasa fiyatlari (500+ proje 2024-2026), uygulamaya gore malzeme secimi, adim adim izin rehberi ve bolgeye ozel imar ipuclari — Alfa Reclame tarafindan derlendi.',
    cover_about_heading: 'Bu cheatsheet hakkinda',
    cover_about_body: 'Bu cheatsheet, Alfa Reclame Rotterdam\'in sahibi Marco tarafindan 14 yillik Rotterdam tabela deneyimi ve 500\'den fazla tamamlanmis projeye dayanarak derlenmistir. Bilgiler, resmi belediye politikasi (APV Rotterdam, Welstandsnota 2018) ve 3M, Avery Dennison, Hexis ve Orafol\'un uretici teknik veri sayfalarindan yararlanilarak tamamlanmistir.',
    cover_license_note: 'Bu cheatsheet, Creative Commons Attribution 4.0 International (CC BY 4.0) lisansi altinda yayimlanmistir. Kaynak gostermek kosuluyla serbestce kullanilabilir, paylasılabilir ve dagitilabilir. Lisans detaylari icin sayfa 12\'ye bakiniz.',
    toc_heading: 'Icerik Tablosu',
    toc_note: 'Tum fiyatlar belirtilmedikce KDV haric tahmini degerlerdir. Guncel paket fiyatlari: alfareclame.nl/tarieven/',
    section_prices: 'BOLUM 1 — 2026 Hizmet Fiyatlari',
    section_prices_cont: 'BOLUM 1 — 2026 Fiyatlari (devami)',
    section_prices_intro: 'Piyasa verisi, 514 Rotterdamli tabela projesine (KOBi segmenti) dayali, 2024-2026. Fiyatlar KDV harictir. Medyan = ortalama proje icin en temsili deger.',
    section_materials: 'BOLUM 2 — Malzeme Secim Rehberi',
    section_materials_cont: 'BOLUM 2 — Malzeme Karsilastirma Tablosu',
    section_materials_intro: 'Alfa Reclame\'nin Rotterdam projeleri icin kullandigi dort A-marka vinil ailesi. Uygulama, omur gerekliligi, yuzey ve butceye gore secim yapilir.',
    section_permits: 'BOLUM 3 — Rotterdam Izin Adimlari',
    section_permits_cont: 'BOLUM 3 — Sure & Muafiyetler',
    section_permits_intro: 'Rotterdam\'da cephe reklamlari, aydinlatmali tabelalar ve acik hava reklamlari genellikle izin gerektirir. Cevre izni icin adim adim prosedur:',
    section_wijk: 'BOLUM 4 — Rotterdam Bolgeye Ozel Imar Ipuclari',
    section_wijk_intro: 'Rotterdam uc imar bolgesine sahiptir (Bolge 1 = tarihi katı, Bolge 2 = modern duzenli, Bolge 3 = endustri/liman esnek). Her bolge icin onemli noktalar:',
    section_sectors: 'BOLUM 5 — Sektore Uyum (en iyi 8 sektor)',
    section_sectors_intro: 'Her sektorun Rotterdam\'da kendi tabela gereksinimleri vardir. En cok talep edilen sekiz sektor:',
    section_quotes: 'BOLUM 6 — Musteri Deneyimleri',
    section_quotes_intro: 'Alfa Reclame Google\'da 4,9 yildiz aliyor (25 yorum). Musteri alintılarindan bir secme:',
    section_contact: 'Iletisim & Teklif Talebi',
    section_license: 'Lisans & Kolofon',
    page_label: 'Sayfa',
    footer: 'Alfa Reclame Rotterdam — Signage Cheatsheet 2026 — CC BY 4.0 — alfareclame.nl/cheatsheet-signage-rotterdam-2026/',
    cta_heading: 'Rotterdam\'da tabela mi ihtiyaciniz var?',
    cta_body: 'WhatsApp: wa.me/31624741597 — lokasyon fotografi gonderdikten sonra 24 saat icinde teklif.',
  },
  pl: {
    cover_title: 'Rotterdam Signage\nCheatsheet 2026',
    cover_subtitle: '12 stron  •  Ceny, Materialy, Pozwolenia, Wskazowki dla dzielnic',
    cover_intro: 'Wszystko, co musisz wiedziec o oznakowaniu w Rotterdamie: aktualne ceny rynkowe (500+ projektow 2024-2026), dobor materialow wedlug zastosowania, przewodnik po pozwoleniach krok po kroku i wskazowki urbanistyczne dla konkretnych dzielnic — opracowane przez Alfa Reclame.',
    cover_about_heading: 'O tym cheatsheet',
    cover_about_body: 'Ten cheatsheet zostal opracowany przez Marka, wlasciciela Alfa Reclame Rotterdam, na podstawie 14 lat doswiadczenia w branzy oznakowan w Rotterdamie i ponad 500 zrealizowanych projektow. Informacje zostaly uzupelnione oficjalna polityka miejska (APV Rotterdam, Welstandsnota 2018) oraz kartami technicznymi producentow 3M, Avery Dennison, Hexis i Orafol.',
    cover_license_note: 'Ten cheatsheet jest udostepniony na licencji Creative Commons Attribution 4.0 International (CC BY 4.0). Mozna go swobodnie uzywac, udostepniac i rozpowszechniac z podaniem zrodla. Szczegoly licencji na stronie 12.',
    toc_heading: 'Spis tresci',
    toc_note: 'Wszystkie ceny sa orientacyjne i nie zawieraja VAT, o ile nie zaznaczono inaczej. Aktualne ceny pakietow: alfareclame.nl/tarieven/',
    section_prices: 'SEKCJA 1 — Ceny 2026 wedlug uslugi',
    section_prices_cont: 'SEKCJA 1 — Ceny 2026 (ciag dalszy)',
    section_prices_intro: 'Dane rynkowe oparte na 514 projektach oznakowan w Rotterdamie 2024-2026 (segment MSP). Ceny bez VAT. Mediana = najbardziej reprezentatywna dla przecietnego projektu.',
    section_materials: 'SEKCJA 2 — Przewodnik doboru materialow',
    section_materials_cont: 'SEKCJA 2 — Tabela porownan materialow',
    section_materials_intro: 'Cztery rodziny winyli A-marki stosowane przez Alfa Reclame w projektach rotterdamskich. Wybor zalezy od zastosowania, wymaganej trwalosci, podloza i budzetu.',
    section_permits: 'SEKCJA 3 — Kroki uzyskania pozwolenia w Rotterdamie',
    section_permits_cont: 'SEKCJA 3 — Terminy & zwolnienia',
    section_permits_intro: 'Reklamy fasadowe, swietlne i zewnetrzne w Rotterdamie wymagaja zazwyczaj pozwolenia. Procedura krok po kroku dla pozwolenia srodowiskowego:',
    section_wijk: 'SEKCJA 4 — Wskazowki urbanistyczne dla dzielnic Rotterdamu',
    section_wijk_intro: 'Rotterdam stosuje trzy strefy urbanistyczne (strefa 1 = historycznie rygorystyczna, strefa 2 = nowoczesnaumiarkowana, strefa 3 = przemyslowa/portowa liberalna). Kluczowe punkty dla kazdej dzielnicy:',
    section_sectors: 'SEKCJA 5 — Zgodnosc sektorowa (top 8 sektorow)',
    section_sectors_intro: 'Kazda branzy ma wlasne wymagania dotyczace oznakowan w Rotterdamie. Osiem najczesciej zamawianych sektorow:',
    section_quotes: 'SEKCJA 6 — Doswiadczenia klientow',
    section_quotes_intro: 'Alfa Reclame ma ocene 4,9 gwiazdy w Google (25 opinii). Wybrane cytaty klientow:',
    section_contact: 'Kontakt & zamow wycene',
    section_license: 'Licencja & kolofon',
    page_label: 'Strona',
    footer: 'Alfa Reclame Rotterdam — Signage Cheatsheet 2026 — CC BY 4.0 — alfareclame.nl/cheatsheet-signage-rotterdam-2026/',
    cta_heading: 'Potrzebujesz oznakowania w Rotterdamie?',
    cta_body: 'WhatsApp: wa.me/31624741597 — wycena w ciagu 24 godzin po przeslaniu zdjecia lokalizacji.',
  },
};

// ── Helper functions ───────────────────────────────────────────────────────────

function pageHeader(doc, pageNum, s) {
  doc.rect(0, 0, PAGE_W, 28).fill(INK);
  doc.fillColor(WHITE).fontSize(8).font('Helvetica').text(
    'ALFA RECLAME ROTTERDAM  |  alfareclame.nl  |  +31 6 24 74 15 97',
    MARGIN_X, 9, { width: CONTENT_W, align: 'left' }
  );
  doc.text(s.page_label + ' ' + pageNum + ' / 12', MARGIN_X, 9, { width: CONTENT_W, align: 'right' });
  doc.fillColor(INK);
}

function pageFooter(doc, s) {
  var y = PAGE_H - 30;
  doc.rect(0, y, PAGE_W, 30).fill(LIGHT);
  doc.fillColor(MUTED).fontSize(7).font('Helvetica').text(
    s.footer,
    MARGIN_X, y + 10, { width: CONTENT_W, align: 'center' }
  );
  doc.fillColor(INK);
}

function addPage(doc, pageNum, s) {
  if (pageNum > 1) doc.addPage();
  pageHeader(doc, pageNum, s);
  pageFooter(doc, s);
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

// ── PDF Generation function ────────────────────────────────────────────────────
function generateForLang(lang) {
  var s = STRINGS[lang] || STRINGS['nl'];
  var outPath = path.join(ROOT, 'data', 'cheatsheet-rotterdam-signage-2026-' + lang + '.pdf');

  var doc = new PDFDocument({ size: 'A4', margin: 0, info: {
    Title: 'Signage Rotterdam Cheatsheet 2026',
    Author: 'Alfa Reclame Rotterdam',
    Subject: 'Signage prijzen, materialen, vergunningen en welstand-tips Rotterdam 2026',
    Keywords: 'signage Rotterdam, raambelettering, gevelreclame, autoreclame, vinyl, vergunning',
    Creator: 'Alfa Reclame Rotterdam — generate-cheatsheet-pdf.js',
    Producer: 'pdfkit',
    Language: lang,
  }});

  var outStream = fs.createWriteStream(outPath);
  doc.pipe(outStream);

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE 1 — Cover
  // ────────────────────────────────────────────────────────────────────────────
  addPage(doc, 1, s);

  // Hero background block
  doc.rect(0, 28, PAGE_W, 320).fill(INK);

  // Version badge
  doc.rect(MARGIN_X, 60, 130, 18).fill(BRAND);
  doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold').text('VERSIE 1.0  •  2026-05-27', MARGIN_X + 6, 65);

  // Title
  doc.fillColor(WHITE).fontSize(28).font('Helvetica-Bold').text(
    s.cover_title,
    MARGIN_X, 90, { width: CONTENT_W, lineGap: 4 }
  );

  // Subtitle
  doc.fillColor(BRAND).fontSize(12).font('Helvetica').text(
    s.cover_subtitle,
    MARGIN_X, 170, { width: CONTENT_W }
  );

  // Separator line
  doc.rect(MARGIN_X, 196, CONTENT_W, 1).fill(BRAND);

  // Intro paragraph
  doc.fillColor(WHITE).fontSize(10).font('Helvetica').text(
    s.cover_intro,
    MARGIN_X, 204, { width: CONTENT_W, lineGap: 3 }
  );

  // Highlights strip
  var highlights = ['12 pag.', '12 diensten', '4 merken', 'CC BY 4.0', 'Rotterdam 2026'];
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
  doc.fillColor(INK).fontSize(11).font('Helvetica-Bold').text(s.cover_about_heading, MARGIN_X);
  doc.moveDown(0.4);
  bodyText(doc, s.cover_about_body);
  doc.moveDown(0.3);
  bodyText(doc, s.cover_license_note);

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE 2 — Table of Contents
  // ────────────────────────────────────────────────────────────────────────────
  addPage(doc, 2, s);
  doc.y = 50;
  doc.fillColor(INK).fontSize(18).font('Helvetica-Bold').text(s.toc_heading, MARGIN_X, doc.y);
  doc.moveDown(0.8);

  var toc = [
    { pg: '3-4', title: s.section_prices, desc: s.section_prices_intro },
    { pg: '5-6', title: s.section_materials, desc: s.section_materials_intro },
    { pg: '7-8', title: s.section_permits, desc: s.section_permits_intro },
    { pg: '9',   title: s.section_wijk, desc: s.section_wijk_intro },
    { pg: '10',  title: s.section_sectors, desc: s.section_sectors_intro },
    { pg: '11',  title: s.section_quotes, desc: s.section_quotes_intro },
    { pg: '12',  title: s.section_license, desc: 'CC BY 4.0' },
  ];

  toc.forEach(function (item) {
    var rowY = doc.y;
    doc.rect(MARGIN_X, rowY, 36, 22).fill(BRAND);
    doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold').text(item.pg, MARGIN_X, rowY + 6, { width: 36, align: 'center' });
    doc.fillColor(INK).fontSize(10).font('Helvetica-Bold').text(item.title, MARGIN_X + 44, rowY + 1, { width: CONTENT_W - 44 });
    doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(item.desc.slice(0, 110), MARGIN_X + 44, rowY + 13, { width: CONTENT_W - 44 });
    doc.rect(MARGIN_X, rowY + 26, CONTENT_W, 0.5).fill('#EEEEEE');
    doc.y = rowY + 32;
  });

  doc.moveDown(1);
  mutedText(doc, s.toc_note);

  // ────────────────────────────────────────────────────────────────────────────
  // PAGES 3-4 — Prijzen 2026
  // ────────────────────────────────────────────────────────────────────────────
  addPage(doc, 3, s);
  doc.y = 50;
  sectionTitle(doc, s.section_prices);
  bodyText(doc, s.section_prices_intro);
  doc.moveDown(0.3);

  var priceColW = [130, 58, 62, 58, 58, 116];
  tableRow(doc, ['Dienst', 'Min', 'Mediaan', 'Gemiddeld', 'Max', 'Prijsfactoren (top 2)'], priceColW, true);

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

  addPage(doc, 4, s);
  doc.y = 50;
  sectionTitle(doc, s.section_prices_cont);
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

  // ────────────────────────────────────────────────────────────────────────────
  // PAGES 5-6 — Materiaal-keuze gids
  // ────────────────────────────────────────────────────────────────────────────
  addPage(doc, 5, s);
  doc.y = 50;
  sectionTitle(doc, s.section_materials);
  bodyText(doc, s.section_materials_intro);

  var matDefault = [
    { term: '3M IJ180Cv3 Controltac', category: 'vinyl-cast', definition_nl: 'Gegoten cast vinyl met Controltac-technologie. Buitenlevensduur 7 jaar, conformability klasse hoog, geschikt voor gekromde oppervlakken zoals voertuigen en cilinders.' },
    { term: 'Avery MPI 1105 Easy Apply RS', category: 'vinyl-cast', definition_nl: 'Gegoten cast vinyl met Easy Apply RS luchtkanalen. Buitenlevensduur 9 jaar bij correcte verwijdering. Geschikt voor voertuigwraps en gevelapplicaties.' },
    { term: 'Hexis Vincite Pro', category: 'vinyl-cast', definition_nl: 'Premium wrap-folie van Hexis met 10 jaar fabrieksgarantie, hoge conformability voor complexe curves. Glans, mat en satijn. High-end voertuigwraps en architecturale geveltoepassingen.' },
    { term: 'Orafol Oracal 651', category: 'vinyl-calendered', definition_nl: 'Gekalandreerd intermediate-kwaliteit snijvinyl, buitenlevensduur 6 jaar op vlakke oppervlakken. Standaardkeuze voor raambelettering, bewegwijzering en vlakke geveltoepassingen.' },
    { term: 'Orafol 5600E Reflective', category: 'reflective', definition_nl: 'Klasse 2 retroreflecterende folie conform NEN-EN-12899 en ECE-R104. Voor vrachtwagen-contourmarkering >7,5t.' },
    { term: '3M FASARA Raamfolie', category: 'specialty', definition_nl: 'Decoratieve raamfolie in 100+ designs, privacy- en zonwering-toepassingen. Populair in zorg/kantoor voor AVG-raamscheiding.' },
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

  addPage(doc, 6, s);
  doc.y = 50;
  sectionTitle(doc, s.section_materials_cont);

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

  // ────────────────────────────────────────────────────────────────────────────
  // PAGES 7-8 — Vergunning-stappen
  // ────────────────────────────────────────────────────────────────────────────
  addPage(doc, 7, s);
  doc.y = 50;
  sectionTitle(doc, s.section_permits);
  bodyText(doc, s.section_permits_intro);

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

  addPage(doc, 8, s);
  doc.y = 50;
  sectionTitle(doc, s.section_permits_cont);

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

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE 9 — Wijk-specifieke welstand-tips
  // ────────────────────────────────────────────────────────────────────────────
  addPage(doc, 9, s);
  doc.y = 50;
  sectionTitle(doc, s.section_wijk);
  bodyText(doc, s.section_wijk_intro);

  var wijkDefault = [
    { name: 'Centrum (zone 1)', tips: 'Vrijwel altijd vergunningsplichtig. Geen oversized LED-reclame. Doosletters en retroreflectie mogelijk mits passende welstandstoets.' },
    { name: 'Delfshaven (rijksbeschermd stadsgezicht)', tips: 'Extra monumentale toets verplicht. Verlichte reclame nagenoeg uitgesloten. Reversibele bevestiging vereist. 4-6 weken extra procedure.' },
    { name: 'Kop van Zuid', tips: 'Moderne architectuurzone, hoge kwaliteitseisen materiaal en afwerking. Spiegel/chroom-effecten ongewenst.' },
    { name: 'Hoogvliet / Prins Alexander', tips: 'Zone 2-3, soepeler beleid. Grootschalige retail-signage gangbaar. LED-reclame mogelijk mits luminantie-rapport aanwezig bij aanvraag.' },
    { name: 'Botlek / Europoort', tips: 'Zone 3 industrie. VCA** gecertificeerde installateur vereist. ATEX-zones: ex-proof armaturen verplicht. RVS 316 marine-grade aanbevolen.' },
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

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE 10 — Sector-compliance
  // ────────────────────────────────────────────────────────────────────────────
  addPage(doc, 10, s);
  doc.y = 50;
  sectionTitle(doc, s.section_sectors);
  bodyText(doc, s.section_sectors_intro);

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

  var scItems2 = sectorCompliance.length >= 4 ? sectorCompliance.slice(0, 8).map(function (s2) {
    return { sector: s2.sector || s2.term || '—', rule: (s2.definition_nl || s2.description || '—').slice(0, 200) };
  }) : scDefault;

  var scColW = [100, 382];
  tableRow(doc, ['Sector', 'Kernvereiste(n)'], scColW, true);
  scItems2.forEach(function (sc) {
    if (doc.y > PAGE_H - 55) return;
    tableRow(doc, [sc.sector, sc.rule], scColW, false);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE 11 — Reviews & contact
  // ────────────────────────────────────────────────────────────────────────────
  addPage(doc, 11, s);
  doc.y = 50;
  sectionTitle(doc, s.section_quotes);
  bodyText(doc, s.section_quotes_intro);
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
  sectionTitle(doc, s.section_contact);
  doc.moveDown(0.3);

  var ctColW = [130, 352];
  var contactLines = [
    ['Website', 'alfareclame.nl'],
    ['Cheatsheet', 'alfareclame.nl/cheatsheet-signage-rotterdam-2026/'],
    ['WhatsApp / Tel.', '+31 6 24 74 15 97'],
    ['E-mail', 'info@alfareclame.nl'],
    ['Adres', 'Blokfluit 31, 3068 KZ Rotterdam'],
    ['KvK', '88606902'],
    ['Google-rating', '4,9 sterren (25 reviews)'],
    ['Openingstijden', 'Ma-Vr 08:00-18:00'],
  ];
  contactLines.forEach(function (row) { tableRow(doc, row, ctColW, false); });

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE 12 — Licentie & colofon
  // ────────────────────────────────────────────────────────────────────────────
  addPage(doc, 12, s);
  doc.y = 50;
  sectionTitle(doc, s.section_license);

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
    ['Taal / Language', lang.toUpperCase()],
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
    doc.fillColor(WHITE).fontSize(12).font('Helvetica-Bold').text(s.cta_heading, MARGIN_X + 16, ctaY, { width: CONTENT_W - 32 });
    doc.fillColor(WHITE).fontSize(9).font('Helvetica').text(s.cta_body, MARGIN_X + 16, ctaY + 16, { width: CONTENT_W - 32 });
    doc.text('14 jaar ervaring  •  A-merk materiaal  •  2 jaar garantie  •  4,9 sterren', MARGIN_X + 16, ctaY + 30, { width: CONTENT_W - 32 });
  }

  // ── Finalize ─────────────────────────────────────────────────────────────────
  doc.end();

  outStream.on('finish', function () {
    var stats = fs.statSync(outPath);
    var sizeKb = Math.round(stats.size / 1024);
    console.log('[OK] PDF gegenereerd (' + lang + '): ' + outPath);
    console.log('[OK] Bestandsgrootte: ' + sizeKb + ' KB');
  });

  outStream.on('error', function (err) {
    console.error('[ERROR] PDF schrijffout (' + lang + '):', err.message);
    process.exit(1);
  });
}

// ── Main entry ─────────────────────────────────────────────────────────────────
if (allFlag) {
  validLangs.forEach(function(lang) { generateForLang(lang); });
  // Create NL alias after a short delay to ensure file is written
  setTimeout(function() {
    try {
      var nlPath = path.join(ROOT, 'data', 'cheatsheet-rotterdam-signage-2026-nl.pdf');
      var aliasPath = path.join(ROOT, 'data', 'cheatsheet-rotterdam-signage-2026.pdf');
      if (fs.existsSync(nlPath)) {
        fs.copyFileSync(nlPath, aliasPath);
        console.log('[OK] NL alias aangemaakt: ' + aliasPath);
      }
    } catch(e) {
      console.warn('[WARN] Alias copy failed, will retry on finish:', e.message);
    }
  }, 3000);
} else {
  var lang = validLangs.includes(langArg) ? langArg : 'nl';
  generateForLang(lang);
  if (lang === 'nl') {
    setTimeout(function() {
      try {
        var nlPath = path.join(ROOT, 'data', 'cheatsheet-rotterdam-signage-2026-nl.pdf');
        var aliasPath = path.join(ROOT, 'data', 'cheatsheet-rotterdam-signage-2026.pdf');
        if (fs.existsSync(nlPath)) {
          fs.copyFileSync(nlPath, aliasPath);
          console.log('[OK] NL alias aangemaakt: ' + aliasPath);
        }
      } catch(e) {
        console.warn('[WARN] Alias copy:', e.message);
      }
    }, 3000);
  }
}
