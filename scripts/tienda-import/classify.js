const teams = require("./teams");

function extractTeamKey(name) {
  let n = name.replace(/^Camiseta\s+/i, "");
  n = n.split(/\s+(Home|Supl|Suplente|Entrenamiento|Edicion|Ter\s|Mundial|x\s|Pro\s|ICON)/i)[0];
  n = n.replace(/\s+\d{4}$/, "");
  return n.trim();
}

function extractShortTeamKey(name) {
  let n = name.replace(/^Short\s+/i, "");
  n = n.split(/\s+(Home|Supl|Suplente|Entrenamiento|Edicion|Ter\s|Mundial|x\s|Pro\s|ICON)/i)[0];
  n = n.replace(/\s+\d{4}$/, "");
  return n.trim();
}

function findTeamMeta(key) {
  if (teams[key]) return teams[key];
  const lower = key.toLowerCase();
  const found = Object.keys(teams).find((k) => k.toLowerCase() === lower);
  return found ? teams[found] : null;
}

function isRetroByYear(name) {
  if (/\b(19\d{2}|200[0-9]|201[0-9])\b/.test(name)) return true;
  if (/\b(0[0-9]|1[0-9])\/(0[0-9]|1[0-9])\b/.test(name)) return true;
  return false;
}

function isMundial2026(name) {
  return /2026/.test(name);
}

function detectQuality(name, price) {
  if (/\bFAN\b/i.test(name)) return "fan";
  if (/\bPLAYER\b/i.test(name) || /\bPro\b/.test(name) || /\bICON\b/i.test(name)) return "player";
  return price >= 50000 ? "player" : "fan";
}

function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Classify a scraped product into { section, league?, quality, slug, teamKey, teamMeta }
function classify(product) {
  const teamKey = extractTeamKey(product.name);
  const meta = teams[teamKey];
  const quality = detectQuality(product.name, product.price);
  const retro = isRetroByYear(product.name);

  let section, league = null, leagueName = null;
  if (retro) {
    section = "retro";
  } else if (meta && meta.type === "seleccion") {
    section = isMundial2026(product.name) ? "mundial-2026" : "selecciones";
  } else if (meta && meta.type === "club") {
    section = "clubes";
    league = meta.league;
    leagueName = meta.leagueName;
  } else {
    section = "sin-clasificar";
  }

  const slug = slugify(product.name.replace(/^Camiseta\s+/i, ""));
  return {
    ...product,
    teamKey,
    teamMeta: meta || null,
    quality,
    section,
    league,
    leagueName,
    slug,
    priceDisplay: quality === "player" ? 48000 : 41000,
  };
}

// Classify a scraped "Short ..." product into the shorts section.
function classifyShort(product) {
  const teamKey = extractShortTeamKey(product.name);
  const meta = findTeamMeta(teamKey);
  const quality = detectQuality(product.name, product.price);

  let league = null,
    leagueName = null;
  if (meta && meta.type === "club") {
    league = meta.league;
    leagueName = meta.leagueName;
  }

  const slug = slugify(product.name.replace(/^Short\s+/i, "") + "-short");
  return {
    ...product,
    teamKey,
    teamMeta: meta || null,
    quality,
    section: "shorts",
    league,
    leagueName,
    slug,
    priceDisplay: quality === "player" ? 32000 : 27000,
  };
}

module.exports = { classify, classifyShort, extractTeamKey, isRetroByYear, isMundial2026, detectQuality, slugify };
