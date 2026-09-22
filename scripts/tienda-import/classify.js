const teams = require("./teams");

function extractTeamKey(name) {
  let n = name.replace(/^Camiseta\s+/i, "");
  n = n.split(/\s+(Home|Supl|Suplente|Entrenamiento|Edicion|Ter\s|Mundial|x\s|Pro\s|ICON)/i)[0];
  n = n.replace(/\s+\d{4}$/, "");
  return n.trim();
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

module.exports = { classify, extractTeamKey, isRetroByYear, isMundial2026, detectQuality, slugify };
