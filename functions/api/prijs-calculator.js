/**
 * POST /api/prijs-calculator
 * Berekent een richtprijs voor een signage-dienst op basis van oppervlakte,
 * complexiteit, wijk en materiaal-merk.
 *
 * Input JSON: { dienst, oppervlakte_m2, complexiteit, wijk?, materiaal? }
 * Output JSON 200: { prijs_min, prijs_max, btw_incl, levertijd_dagen_min,
 *   levertijd_dagen_max, factoren, disclaimer, dienst, oppervlakte_m2, complexiteit }
 */

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  "https://alfareclame.nl",
  "https://www.alfareclame.nl",
];
const PREVIEW_ORIGIN_RE =
  /^https:\/\/[a-z0-9-]+\.alfareclame-(pages|nl)\.pages\.dev$/i;
const LOCALHOST_RE = /^https?:\/\/localhost(:\d+)?$/;

function corsHeaders(origin) {
  const ok =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      PREVIEW_ORIGIN_RE.test(origin) ||
      LOCALHOST_RE.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin : "https://alfareclame.nl",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
  };
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
    },
  });
}

// ---------------------------------------------------------------------------
// Price bands — inlined from data/sectorprijslijst-2026.json
// Keys are normalised dienst slugs used in the API.
// ---------------------------------------------------------------------------
const PRICE_BANDS = {
  raambelettering:        { min: 149,  max: 2500  },
  autoreclame:            { min: 149,  max: 4500  },
  gevelreclame:           { min: 295,  max: 5000  },
  lichtreclame:           { min: 1495, max: 8000  },
  doosletters:            { min: 2495, max: 12000 },
  bestickering:           { min: 149,  max: 9995  },
  "fleet-wrap":           { min: 1995, max: 25000 },
  silobelettering:        { min: 2495, max: 8995  },
  "offshore-belettering": { min: 3495, max: 12995 },
  havenreclame:           { min: 2950, max: 12500 },
  horecabelettering:      { min: 495,  max: 2950  },
  retailreclame:          { min: 595,  max: 3950  },
  freesletters:           { min: 795,  max: 4500  },
};

const VALID_DIENSTEN = new Set(Object.keys(PRICE_BANDS));

// ---------------------------------------------------------------------------
// Levertijd per dienst (werkdagen)
// ---------------------------------------------------------------------------
const LEVERTIJD = {
  raambelettering:        { min: 5,  max: 10 },
  autoreclame:            { min: 7,  max: 14 },
  gevelreclame:           { min: 30, max: 56 },
  lichtreclame:           { min: 28, max: 42 },
  doosletters:            { min: 28, max: 42 },
  bestickering:           { min: 3,  max: 7  },
  "fleet-wrap":           { min: 10, max: 14 },
  silobelettering:        { min: 21, max: 35 },
  "offshore-belettering": { min: 28, max: 42 },
  havenreclame:           { min: 5,  max: 10 },
  horecabelettering:      { min: 4,  max: 8  },
  retailreclame:          { min: 5,  max: 10 },
  freesletters:           { min: 21, max: 35 },
};

// ---------------------------------------------------------------------------
// Multipliers
// ---------------------------------------------------------------------------
const COMPLEXITEIT_MULT = {
  basis:   1.0,
  middel:  1.4,
  premium: 2.0,
};

const MATERIAAL_MULT = {
  "3m":   1.00,
  avery:  1.05,
  hexis:  1.08,
  orafol: 1.03,
};

// Wijk delta as fraction (from regionalVariation in dataset)
const WIJK_DELTA = {
  centrum:    0.10,
  hoogvliet:  0.05,
  delfshaven: 0.05,
};

// ---------------------------------------------------------------------------
// Human-readable dienst labels (NL)
// ---------------------------------------------------------------------------
const DIENST_LABELS = {
  raambelettering:        "raambelettering",
  autoreclame:            "autoreclame",
  gevelreclame:           "gevelreclame",
  lichtreclame:           "lichtreclame",
  doosletters:            "doosletters",
  bestickering:           "bestickering",
  "fleet-wrap":           "fleet wrap",
  silobelettering:        "silobelettering",
  "offshore-belettering": "offshore-belettering",
  havenreclame:           "havenreclame",
  horecabelettering:      "horecabelettering",
  retailreclame:          "retailreclame",
  freesletters:           "freesletters",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function roundToFive(n) {
  return Math.round(n / 5) * 5;
}

function buildFactoren(dienst, oppervlakte_m2, complexiteit, wijk, materiaal) {
  const factoren = [];

  const label = DIENST_LABELS[dienst] || dienst;
  factoren.push(
    `Dienst: ${label} — prijsband gebaseerd op 500+ projecten Rotterdam 2024-2026.`
  );

  factoren.push(
    `Oppervlakte ${oppervlakte_m2} m² — schaaleffect toegepast (groter formaat = hogere absolute prijs, lager per m²).`
  );

  const multLabel = {
    basis:   "standaard (1,0×)",
    middel:  "middel (1,4×)",
    premium: "premium (2,0×)",
  };
  factoren.push(
    `Complexiteit ${complexiteit}: multiplier ${multLabel[complexiteit] || complexiteit}.`
  );

  if (wijk) {
    const delta = WIJK_DELTA[wijk];
    if (delta !== undefined && delta > 0) {
      factoren.push(
        `Wijk ${wijk}: +${Math.round(delta * 100)}% toeslag voor extra montage-condities of beperkte toegang.`
      );
    } else if (delta !== undefined) {
      factoren.push(`Wijk ${wijk}: geen toeslag — standaard montage-condities.`);
    } else {
      factoren.push(`Wijk ${wijk}: geen specifieke toeslag, standaard Rotterdam-tarief.`);
    }
  }

  if (materiaal) {
    const mult = MATERIAAL_MULT[materiaal];
    if (mult !== undefined && mult > 1.0) {
      factoren.push(
        `Materiaal ${materiaal.toUpperCase()}: +${Math.round((mult - 1) * 100)}% toeslag voor A-merk premium vinyl.`
      );
    } else if (mult !== undefined) {
      factoren.push(`Materiaal ${materiaal.toUpperCase()}: standaard tarief, geen toeslag.`);
    }
  }

  if (factoren.length < 3) {
    factoren.push(
      "Definitieve prijs afhankelijk van exacte afmetingen, gevel-type en bereikbaarheid voor montage."
    );
  }

  return factoren.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Price computation
// ---------------------------------------------------------------------------
function computePrice(dienst, oppervlakte_m2, complexiteit, wijk, materiaal) {
  const band = PRICE_BANDS[dienst];
  const complexMult = COMPLEXITEIT_MULT[complexiteit];

  // Oppervlakte scaling: schaalfactor = max(0.5, oppervlakte_m2 / 10)
  const oppScaleFactor = Math.max(0.5, oppervlakte_m2 / 10);

  let prijs_min = band.min * complexMult * oppScaleFactor;
  let prijs_max = band.max * complexMult * oppScaleFactor * 1.3;

  // Sanity cap: max band.max * 4
  const sanityMax = band.max * 4;
  prijs_max = Math.min(prijs_max, sanityMax);

  // Wijk modifier
  const wijkDelta = (wijk && WIJK_DELTA[wijk] !== undefined) ? WIJK_DELTA[wijk] : 0;
  prijs_min *= 1 + wijkDelta;
  prijs_max *= 1 + wijkDelta;

  // Materiaal modifier
  const matMult =
    materiaal && MATERIAAL_MULT[materiaal] !== undefined
      ? MATERIAAL_MULT[materiaal]
      : 1.0;
  prijs_min *= matMult;
  prijs_max *= matMult;

  // Floor: prijs_min >= band.min * 0.5
  prijs_min = Math.max(prijs_min, band.min * 0.5);
  if (prijs_min > prijs_max) prijs_max = prijs_min * 1.3;

  return {
    prijs_min: roundToFive(prijs_min),
    prijs_max: roundToFive(prijs_max),
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin")),
  });
}

export async function onRequestPost({ request }) {
  const origin = request.headers.get("Origin");

  let body;
  try {
    const text = await request.text();
    if (text.length > 4096) {
      return json(400, { ok: false, error: "payload_too_large" }, origin);
    }
    body = JSON.parse(text);
  } catch {
    return json(400, { ok: false, error: "invalid_json" }, origin);
  }

  const { dienst, oppervlakte_m2, complexiteit, wijk, materiaal } = body;

  // Validate dienst
  if (!dienst || !VALID_DIENSTEN.has(dienst)) {
    return json(
      400,
      {
        ok: false,
        error: "invalid_dienst",
        message: `Dienst moet een van de 13 bekende diensten zijn: ${[...VALID_DIENSTEN].join(", ")}`,
      },
      origin
    );
  }

  // Validate oppervlakte_m2
  const opp = Number(oppervlakte_m2);
  if (!Number.isFinite(opp) || opp < 0.1 || opp > 200) {
    return json(
      400,
      {
        ok: false,
        error: "invalid_oppervlakte_m2",
        message: "oppervlakte_m2 moet een getal zijn tussen 0,1 en 200.",
      },
      origin
    );
  }

  // Validate complexiteit
  if (!complexiteit || !COMPLEXITEIT_MULT[complexiteit]) {
    return json(
      400,
      {
        ok: false,
        error: "invalid_complexiteit",
        message: "complexiteit moet 'basis', 'middel' of 'premium' zijn.",
      },
      origin
    );
  }

  // Normalise optional fields
  const wijkNorm = wijk ? String(wijk).toLowerCase().trim() : null;
  const materiaalNorm = materiaal ? String(materiaal).toLowerCase().trim() : null;

  if (materiaalNorm && !MATERIAAL_MULT[materiaalNorm]) {
    return json(
      400,
      {
        ok: false,
        error: "invalid_materiaal",
        message: "materiaal moet '3m', 'avery', 'hexis' of 'orafol' zijn.",
      },
      origin
    );
  }

  // Compute
  const { prijs_min, prijs_max } = computePrice(
    dienst,
    opp,
    complexiteit,
    wijkNorm,
    materiaalNorm
  );

  const lt = LEVERTIJD[dienst];
  const factoren = buildFactoren(dienst, opp, complexiteit, wijkNorm, materiaalNorm);

  return json(
    200,
    {
      ok: true,
      prijs_min,
      prijs_max,
      btw_incl: false,
      levertijd_dagen_min: lt.min,
      levertijd_dagen_max: lt.max,
      factoren,
      disclaimer:
        "Dit is een richtprijs op basis van publieke prijsbanden. Definitieve offerte na onderzoek van uw situatie.",
      dienst,
      oppervlakte_m2: opp,
      complexiteit,
    },
    origin
  );
}

export async function onRequest({ request }) {
  return json(
    405,
    { ok: false, error: "method_not_allowed" },
    request.headers.get("Origin")
  );
}
