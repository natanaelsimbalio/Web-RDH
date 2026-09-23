// Phase 2: consumes data/productos.json, downloads images, and renders static HTML
// for every jersey into tienda/<section>/[<league>/]<slug>.html plus category index pages.
const fs = require("fs");
const path = require("path");
const { classify, classifyShort, classifyMedias } = require("./classify");
const teams = require("./teams");

const ROOT = path.join(__dirname, "..", "..");
const DATA_FILE = path.join(ROOT, "data", "productos.json");

const WA1 = "5493412025376";

const WA_ICON_PATH =
  "M17.6 6.3A8.9 8.9 0 0 0 12.04 3.6 8.9 8.9 0 0 0 3.5 12.5c0 1.57.4 3.1 1.16 4.45L3.4 21.4l4.6-1.2a8.9 8.9 0 0 0 4.04.98h.01a8.9 8.9 0 0 0 8.55-8.9c0-2.38-.93-4.62-2.6-6.98Zm-5.56 13.7a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.72.72.73-2.66-.18-.27a7.4 7.4 0 0 1-1.14-3.95 7.4 7.4 0 0 1 12.63-5.23 7.36 7.36 0 0 1 2.17 5.24 7.4 7.4 0 0 1-7.45 7.34Zm4.06-5.53c-.22-.11-1.32-.65-1.53-.73-.2-.08-.35-.11-.5.11-.15.22-.57.73-.7.88-.13.15-.26.16-.48.05-.22-.11-.94-.35-1.79-1.11a6.72 6.72 0 0 1-1.24-1.55c-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.4.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.4-.06-.11-.5-1.21-.69-1.66-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.4.06-.6.28-.2.22-.8.78-.8 1.9s.82 2.2.94 2.36c.11.15 1.62 2.48 3.93 3.47.55.24.98.38 1.31.48.55.18 1.06.15 1.46.09.44-.07 1.32-.54 1.51-1.06.19-.52.19-.96.13-1.06-.06-.1-.2-.15-.42-.26Z";

const IG_ICON_PATH =
  "M12 2c-2.717 0-3.056.012-4.123.06-1.066.049-1.793.218-2.428.465a4.902 4.902 0 0 0-1.772 1.153A4.902 4.902 0 0 0 2.525 5.45c-.247.635-.416 1.362-.465 2.428C2.012 8.944 2 9.283 2 12s.012 3.056.06 4.123c.049 1.066.218 1.793.465 2.428a4.902 4.902 0 0 0 1.153 1.772 4.902 4.902 0 0 0 1.772 1.153c.635.247 1.362.416 2.428.465C8.944 21.988 9.283 22 12 22s3.056-.012 4.123-.06c1.066-.049 1.793-.218 2.428-.465a4.902 4.902 0 0 0 1.772-1.153 4.902 4.902 0 0 0 1.153-1.772c.247-.635.416-1.362.465-2.428C21.988 15.056 22 14.717 22 12s-.012-3.056-.06-4.123c-.049-1.066-.218-1.793-.465-2.428a4.902 4.902 0 0 0-1.153-1.772A4.902 4.902 0 0 0 18.55 2.525c-.635-.247-1.362-.416-2.428-.465C15.056 2.012 14.717 2 12 2zm0 1.802c2.67 0 2.986.01 4.04.059.976.045 1.505.207 1.858.344.467.182.8.399 1.15.748.35.35.566.683.748 1.15.137.353.3.882.344 1.857.048 1.055.059 1.37.059 4.04s-.01 2.986-.059 4.04c-.045.976-.207 1.505-.344 1.858a3.1 3.1 0 0 1-.748 1.15 3.1 3.1 0 0 1-1.15.748c-.353.137-.882.3-1.857.344-1.054.048-1.37.059-4.041.059s-2.987-.01-4.041-.059c-.976-.045-1.505-.207-1.858-.344a3.1 3.1 0 0 1-1.15-.748 3.1 3.1 0 0 1-.748-1.15c-.137-.353-.3-.882-.344-1.857-.048-1.055-.059-1.37-.059-4.041s.01-2.986.059-4.04c.045-.976.207-1.505.344-1.858.182-.467.399-.8.748-1.15a3.1 3.1 0 0 1 1.15-.748c.353-.137.882-.3 1.857-.344 1.055-.048 1.37-.059 4.041-.059zm0 3.063a5.135 5.135 0 1 0 0 10.27 5.135 5.135 0 0 0 0-10.27zm0 8.468a3.333 3.333 0 1 1 0-6.666 3.333 3.333 0 0 1 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z";

function waIconSvg(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${WA_ICON_PATH}"/></svg>`;
}

function igIconSvg(cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${IG_ICON_PATH}"/></svg>`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function downloadImage(url, destPath) {
  if (fs.existsSync(destPath)) return;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; RDH-import/1.0)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
}

function waLink(text) {
  return `https://wa.me/${WA1}?text=${encodeURIComponent(text)}`;
}

function relPrefix(depth) {
  // depth = number of folders below site root, e.g. tienda/clubes/liga-inglesa/x.html => depth 3
  return "../".repeat(depth);
}

function sectionLabel(section) {
  return (
    { clubes: "Clubes", selecciones: "Selecciones", "mundial-2026": "Mundial 2026", retro: "Retro", shorts: "Shorts", medias: "Medias" }[
      section
    ] || section
  );
}

function displayName(p) {
  let n = p.name.replace(/^Camiseta\s+/i, "").replace(/^Short\s+/i, "");
  n = n.replace(/\bFAN\b/gi, "").replace(/\bPLAYER\b/gi, "").trim();
  n = n.replace(/\bSupl\s*3\b/gi, "Tercera Equipación");
  n = n.replace(/\bSupl\b/gi, "Alternativa");
  n = n.replace(/\bHome\b/gi, "Titular");
  if (p.section === "medias") n = n.replace(/\bImportadas\b/gi, "");
  n = n.replace(/\s{2,}/g, " ").trim();
  if (p.section === "shorts") n = `Short ${n}`;
  return n;
}

function priceFmt(n) {
  return "$" + n.toLocaleString("es-AR");
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

function teamDisplay(p) {
  return (p.teamMeta && (p.teamMeta.displayName || p.teamMeta.canonical)) || p.teamKey;
}

const CLUB_OPENERS = [
  (team, league) => `Vestí los colores de ${team} con esta camiseta de la ${league}.`,
  (team, league) => `Directo de la ${league}: la camiseta oficial de ${team}.`,
  (team, league) => `Para el hincha de ${team}, la casaca que se usa hoy en la ${league}.`,
];
const SELECCION_OPENERS = [
  (team) => `La camiseta con la que ${team} sale a jugar.`,
  (team) => `Representá a ${team} en cada partido con esta camiseta oficial.`,
  (team) => `Un clásico del fútbol de selecciones: la de ${team}.`,
];
const MUNDIAL_OPENERS = [
  (team) => `${team} rumbo al Mundial 2026, con la camiseta que va a usar en la cita máxima.`,
  (team) => `La camiseta de ${team} pensada para el camino al Mundial 2026.`,
];
const RETRO_OPENERS = [
  (team) => `Un ícono: la camiseta retro de ${team} que marcó una época.`,
  (team) => `Para los nostálgicos del fútbol, la casaca histórica de ${team}.`,
  (team) => `Revivís un pedazo de la historia de ${team} con esta camiseta retro.`,
];

const PLAYER_LINES = [
  "Versión Player: el mismo corte y la misma tela técnica que usan los jugadores en cancha.",
  "Edición Player, con tecnología de ventilación pensada para el rendimiento en cancha.",
  "Corte Player ajustado al cuerpo, con la calidad de la que se usa en partidos oficiales.",
];
const FAN_LINES = [
  "Versión Fan, pensada para el uso diario: liviana y cómoda para la calle o el club.",
  "Edición Fan, con un corte más relajado, ideal para el día a día.",
  "Corte Fan cómodo y liviano, la opción de siempre para hinchas.",
];

const CLOSERS = [
  "Te confirmamos talle, precio y stock por WhatsApp al toque.",
  "Escribinos por WhatsApp y coordinamos talle, envío y forma de pago.",
  "Consultá stock y talles disponibles por WhatsApp.",
];

const SHORTS_OPENERS = [
  (team) => `El short que combina con la camiseta de ${team}, para armar el conjunto completo.`,
  (team) => `Short a juego con la casaca de ${team}, ideal para completar el conjunto.`,
  (team) => `Sumá el short de ${team} y llevá el conjunto entero, de arriba a abajo.`,
];

const MEDIAS_OPENERS = [
  () => "Medias antideslizantes para no perder pisada en cada jugada.",
  () => "El extra que evita que la media se baje: agarre antideslizante durante todo el partido.",
  () => "Comodidad y sujeción: medias antideslizantes importadas para entrenar o jugar.",
];

function productDesc(p) {
  const team = teamDisplay(p);
  const seed = hashSeed(p.slug);
  if (p.section === "medias") {
    return `${pick(MEDIAS_OPENERS, seed)()} Material importado, agarre antideslizante y talle único.`;
  }
  let opener;
  if (p.section === "shorts") {
    opener = pick(SHORTS_OPENERS, seed)(team);
  } else if (p.section === "clubes") {
    opener = pick(CLUB_OPENERS, seed)(team, p.leagueName || "liga");
  } else if (p.section === "mundial-2026") {
    opener = pick(MUNDIAL_OPENERS, seed)(team);
  } else if (p.section === "retro") {
    opener = pick(RETRO_OPENERS, seed)(team);
  } else {
    opener = pick(SELECCION_OPENERS, seed)(team);
  }
  const qualityLine = p.quality === "player" ? pick(PLAYER_LINES, seed) : pick(FAN_LINES, seed);
  return `${opener} ${qualityLine}`;
}

function productDescShort(p) {
  if (p.section === "medias") return "Antideslizantes · Importadas.";
  const team = teamDisplay(p);
  const qualityWord = p.quality === "player" ? "Player" : "Fan";
  if (p.section === "shorts") return `Conjunto con ${team} · Edición ${qualityWord}.`;
  if (p.section === "clubes") return `${team} · Edición ${qualityWord}, importada.`;
  if (p.section === "mundial-2026") return `Rumbo al Mundial 2026 · Edición ${qualityWord}.`;
  if (p.section === "retro") return `Retro · Edición ${qualityWord}, importada.`;
  return `Selección de ${team} · Edición ${qualityWord}.`;
}

function productPageHtml(p, depth) {
  const pre = relPrefix(depth);
  const isMedias = p.section === "medias";
  const title = isMedias
    ? `${displayName(p)} — RDH Imports`
    : `${displayName(p)} · ${p.quality === "player" ? "Versión Player" : "Versión Fan"} — RDH Imports`;
  const desc = productDesc(p);
  const catHref = `${pre}tienda/${p.section}/index.html`;
  const images = p.localImages.map((f) => `assets/tienda/${p.section}/${p.slug}/${f}`);
  const mainImg = `${pre}${images[0]}`;
  const thumbs = images
    .map(
      (img, i) => `          <button${i === 0 ? ' class="active"' : ""} aria-label="Ver foto ${i + 1}">
            <img src="${pre}${img}" alt="${displayName(p)}, foto ${i + 1}" width="1024" height="1024">
          </button>`
    )
    .join("\n");
  const waText = isMedias
    ? `Hola! Me interesan las ${displayName(p)}, ¿tienen stock?`
    : `Hola! Me interesa la camiseta ${displayName(p)} (${p.quality === "player" ? "Player" : "Fan"}), ¿tienen stock?`;
  const jsonLdImages = images.map((img) => `"https://rdhimports.vercel.app/${img}"`).join(",\n    ");

  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://rdhimports.vercel.app/tienda/${p.section}/${p.league ? p.league + "/" : ""}${p.slug}.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&display=swap" rel="stylesheet"></noscript>
<link rel="stylesheet" href="${pre}css/style.css">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/img/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/assets/img/site.webmanifest">
<meta name="theme-color" content="#b8452b">

<meta property="og:type" content="product">
<meta property="og:site_name" content="RDH Imports">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="https://rdhimports.vercel.app/${images[0]}">
<meta property="og:locale" content="es_AR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="https://rdhimports.vercel.app/${images[0]}">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${displayName(p)}",
  "category": "${sectionLabel(p.section)}",
  "description": "${desc}",
  "image": [
    ${jsonLdImages}
  ],
  "brand": { "@type": "Brand", "name": "RDH Imports" },
  "offers": {
    "@type": "Offer",
    "availability": "https://schema.org/InStock",
    "priceCurrency": "ARS",
    "price": "${p.priceDisplay}",
    "url": "https://rdhimports.vercel.app/tienda/${p.section}/${p.league ? p.league + "/" : ""}${p.slug}.html",
    "seller": { "@type": "Organization", "name": "RDH Imports" }
  }
}
</script>
</head>
<body>

<div class="grain"></div>

${headerHtml(pre)}

<div class="breadcrumb">
  <div class="wrap">
    <a href="${pre}index.html">Inicio</a><span>/</span>
    <a href="${pre}tienda.html">Tienda</a><span>/</span>
    <a href="${catHref}">${sectionLabel(p.section)}</a><span>/</span>
    <span class="current">${displayName(p)}</span>
  </div>
</div>

<section class="pdp">
  <div class="wrap">
    <div class="pdp-layout">
      <div class="pdp-gallery">
        <div class="pdp-gallery-main">
          <img src="${mainImg}" alt="${displayName(p)}" id="pdpMainImg" width="1024" height="1024">
        </div>
        <div class="pdp-gallery-thumbs">
${thumbs}
        </div>
      </div>

      <div class="pdp-info">
        <p class="pdp-tag">${sectionLabel(p.section)}${p.leagueName ? " · " + p.leagueName : ""}</p>
        <h1 class="pdp-title">${displayName(p)}</h1>
        <p class="pdp-subtitle">${isMedias ? "Antideslizantes · Importadas" : `Edición ${p.quality === "player" ? "Player" : "Fan"}`}</p>
        <p class="pdp-price">${priceFmt(p.priceDisplay)}</p>
        <p class="pdp-desc">${productDesc(p)}</p>

        <div class="pdp-cta">
          <a class="btn btn-primary" href="${waLink(waText)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          <p class="pdp-cta-note">Te confirmamos talle, precio y stock al toque.</p>
        </div>

        <div class="pdp-specs-block">
          <h2>Detalles del producto</h2>
          <ul class="pdp-specs">
${
  isMedias
    ? `            <li><span>Tipo</span><strong>Antideslizantes</strong></li>
            <li><span>Talle</span><strong>Único (adulto)</strong></li>
            <li><span>Origen</span><strong>Importada</strong></li>`
    : `            <li><span>Edición</span><strong>${p.quality === "player" ? "Player" : "Fan"}</strong></li>
            <li><span>Tela</span><strong>Liviana y transpirable</strong></li>
            <li><span>Talles</span><strong>S · M · L · XL · XXL</strong></li>
            <li><span>Origen</span><strong>Importada</strong></li>`
}
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="pdp-lightbox" id="pdpLightbox" role="dialog" aria-modal="true" aria-label="Imagen ampliada">
  <button class="pdp-lightbox-close" aria-label="Cerrar">&times;</button>
  <img src="" alt="">
</div>

${footerHtml(pre)}

<a class="wa-float" href="https://wa.me/${WA1}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.6 6.3A8.9 8.9 0 0 0 12.04 3.6 8.9 8.9 0 0 0 3.5 12.5c0 1.57.4 3.1 1.16 4.45L3.4 21.4l4.6-1.2a8.9 8.9 0 0 0 4.04.98h.01a8.9 8.9 0 0 0 8.55-8.9c0-2.38-.93-4.62-2.6-6.98Zm-5.56 13.7a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.72.72.73-2.66-.18-.27a7.4 7.4 0 0 1-1.14-3.95 7.4 7.4 0 0 1 12.63-5.23 7.36 7.36 0 0 1 2.17 5.24 7.4 7.4 0 0 1-7.45 7.34Zm4.06-5.53c-.22-.11-1.32-.65-1.53-.73-.2-.08-.35-.11-.5.11-.15.22-.57.73-.7.88-.13.15-.26.16-.48.05-.22-.11-.94-.35-1.79-1.11a6.72 6.72 0 0 1-1.24-1.55c-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.4.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.4-.06-.11-.5-1.21-.69-1.66-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.4.06-.6.28-.2.22-.8.78-.8 1.9s.82 2.2.94 2.36c.11.15 1.62 2.48 3.93 3.47.55.24.98.38 1.31.48.55.18 1.06.15 1.46.09.44-.07 1.32-.54 1.51-1.06.19-.52.19-.96.13-1.06-.06-.1-.2-.15-.42-.26Z"/></svg>
</a>

<script src="https://unpkg.com/lenis@1.3.26/dist/lenis.min.js"></script>
<script>
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.Lenis) {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) lenis.scrollTo(target, { immediate: true, offset: -84 });
    }
  }
</script>
<script src="${pre}js/main.js?v=3"></script>
</body>
</html>
`;
}

const LEAGUE_LIST = (() => {
  const seen = new Map();
  Object.values(teams).forEach((m) => {
    if (m.type === "club" && !seen.has(m.league)) seen.set(m.league, m.leagueName);
  });
  return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
})();

function headerHtml(pre) {
  const leagueLinks = LEAGUE_LIST.map(
    ([slug, name]) => `          <a href="${pre}tienda/clubes/index.html#${slug}">${name}</a>`
  ).join("\n");
  return `<header class="site-header header-solid" id="header">
  <div class="wrap header-inner">
    <a href="${pre}index.html" class="brand-mark">
      <img class="brand-logo brand-logo-light" src="${pre}assets/img/logo-horizontal-white.png" alt="RDH Imports" width="764" height="173">
      <img class="brand-logo brand-logo-dark" src="${pre}assets/img/logo-horizontal-dark.png" alt="RDH Imports" width="764" height="173">
    </a>

    <nav class="main-nav" id="main-nav">
      <div class="has-dropdown">
        <a href="${pre}tienda.html">Tienda</a>
        <div class="dropdown dropdown-wide">
          <div class="dropdown-col">
            <p class="dropdown-heading">Categorías</p>
            <a href="${pre}tienda/clubes/index.html">Clubes</a>
            <a href="${pre}tienda/selecciones/index.html">Selecciones</a>
            <a href="${pre}tienda/mundial-2026/index.html">Mundial 2026</a>
            <a href="${pre}tienda/retro/index.html">Retro</a>
            <a href="${pre}tienda/shorts/index.html">Shorts</a>
            <a href="${pre}tienda/medias/index.html">Medias</a>
          </div>
          <div class="dropdown-col">
            <p class="dropdown-heading">Ligas</p>
${leagueLinks}
          </div>
        </div>
      </div>
      <a href="${pre}index.html#como-comprar">Cómo comprar</a>
      <a href="${pre}index.html#nosotros">Nosotros</a>
      <a href="${pre}index.html#contacto">Contacto</a>
    </nav>

    <div class="header-cta">
      <button class="search-toggle" id="searchToggle" aria-label="Buscar camisetas">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </button>
      <a class="btn btn-ghost-sm" href="https://instagram.com/rdh.imports" target="_blank" rel="noopener">
        ${igIconSvg("icon")}
        @rdh.imports
      </a>
      <a class="btn btn-primary-sm" href="https://wa.me/${WA1}" target="_blank" rel="noopener">
        ${waIconSvg("icon")}
        WhatsApp
      </a>
    </div>

    <button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="search-overlay" id="searchOverlay" role="dialog" aria-modal="true" aria-label="Buscar camisetas" data-pre="${pre}">
    <div class="search-panel">
      <div class="search-input-row">
        <svg class="search-input-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="search" id="searchInput" placeholder="Buscar por equipo, selección o liga..." autocomplete="off">
        <button class="search-close" id="searchClose" aria-label="Cerrar búsqueda">&times;</button>
      </div>
      <div class="search-results" id="searchResults"></div>
    </div>
  </div>
  <div class="mobile-nav" id="mobile-nav">
    <a href="${pre}tienda.html">Tienda</a>
    <div class="submenu">
      <a href="${pre}tienda/clubes/index.html">Clubes</a>
      <a href="${pre}tienda/selecciones/index.html">Selecciones</a>
      <a href="${pre}tienda/mundial-2026/index.html">Mundial 2026</a>
      <a href="${pre}tienda/retro/index.html">Retro</a>
      <a href="${pre}tienda/shorts/index.html">Shorts</a>
      <a href="${pre}tienda/medias/index.html">Medias</a>
    </div>
    <a href="${pre}index.html#como-comprar">Cómo comprar</a>
    <a href="${pre}index.html#nosotros">Nosotros</a>
    <a href="${pre}index.html#contacto">Contacto</a>
    <a href="https://instagram.com/rdh.imports" target="_blank" rel="noopener" class="mobile-nav-ig">
      ${igIconSvg("icon-sm")}
      @rdh.imports
    </a>
    <a class="btn btn-primary-sm" href="https://wa.me/${WA1}" target="_blank" rel="noopener">
      ${waIconSvg("icon")}
      Pedir por WhatsApp
    </a>
  </div>
</header>`;
}

function footerHtml(pre) {
  return `<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">
      <img class="brand-logo" src="${pre}assets/img/logo-horizontal-white.png" alt="RDH Imports" width="764" height="173">
      <p>"El Rincón del Hincha"</p>
    </div>
    <div class="footer-links">
      <a href="${pre}tienda.html">Tienda</a>
      <a href="${pre}index.html#como-comprar">Cómo comprar</a>
      <a href="${pre}index.html#nosotros">Nosotros</a>
      <a href="${pre}index.html#contacto">Contacto</a>
    </div>
    <div class="footer-social">
      <a href="https://wa.me/${WA1}" target="_blank" rel="noopener">${waIconSvg("icon-sm")}WhatsApp 1</a>
      <a href="https://wa.me/5493417213013" target="_blank" rel="noopener">${waIconSvg("icon-sm")}WhatsApp 2</a>
      <a href="https://instagram.com/rdh.imports" target="_blank" rel="noopener">
        ${igIconSvg("icon-sm")}
        Instagram
      </a>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p>© <span id="year"></span> RDH Imports. Todos los derechos reservados.</p>
  </div>
</footer>`;
}

function productCardHtml(p, depth) {
  const pre = relPrefix(depth);
  const href = `${pre}tienda/${p.section}/${p.league ? p.league + "/" : ""}${p.slug}.html`;
  const img = `${pre}assets/tienda/${p.section}/${p.slug}/${p.localImages[0]}`;
  const waText =
    p.section === "medias"
      ? `Hola! Me interesan las ${displayName(p)}, ¿tienen stock?`
      : `Hola! Me interesa la camiseta ${displayName(p)} (${p.quality === "player" ? "Player" : "Fan"}), ¿tienen stock?`;
  return `      <article class="product-card reveal" data-quality="${p.quality || ""}">
        <a class="product-media product-link" href="${href}">
          <img src="${img}" alt="${displayName(p)}" loading="lazy" width="800" height="800">
        </a>
        <div class="product-body">
          <p class="product-tag">${sectionLabel(p.section)}${p.leagueName ? " · " + p.leagueName : ""}</p>
          <p class="product-price">${priceFmt(p.priceDisplay)}</p>
          <h3><a href="${href}">${displayName(p)}</a></h3>
          <p>${productDescShort(p)}</p>
          <a href="${href}" class="btn btn-primary-sm">Ver producto</a>
          <a href="${waLink(waText)}" target="_blank" rel="noopener" class="btn btn-ghost-sm">Consultar por WhatsApp</a>
        </div>
      </article>`;
}

const QUALITY_FILTER_SCRIPT = `<script>
(function(){
  var buttons = document.querySelectorAll('.quality-filter button');
  var cards = document.querySelectorAll('.product-card[data-quality]');
  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      buttons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var q = btn.dataset.quality;
      cards.forEach(function(c){
        c.style.display = (q === 'all' || c.dataset.quality === q) ? '' : 'none';
      });
    });
  });
})();
</script>`;

function categoryIndexHtml({ section, title, desc, bodySections, extraNote, filter = true }) {
  const pre = relPrefix(2); // tienda/<section>/index.html is 2 folders below root
  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — RDH Imports</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://rdhimports.vercel.app/tienda/${section}/index.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&display=swap" rel="stylesheet"></noscript>
<link rel="stylesheet" href="${pre}css/style.css">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/img/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/assets/img/site.webmanifest">
<meta name="theme-color" content="#b8452b">
<meta property="og:type" content="website">
<meta property="og:site_name" content="RDH Imports">
<meta property="og:title" content="${title} — RDH Imports">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="https://rdhimports.vercel.app/tienda/${section}/index.html">
<meta property="og:locale" content="es_AR">
</head>
<body>

<div class="grain"></div>

${headerHtml(pre)}

<div class="breadcrumb">
  <div class="wrap">
    <a href="${pre}index.html">Inicio</a><span>/</span>
    <a href="${pre}tienda.html">Tienda</a><span>/</span>
    <span class="current">${title}</span>
  </div>
</div>

<section class="page-hero">
  <div class="wrap">
    <p class="section-eyebrow reveal">Tienda</p>
    <h1 class="section-title reveal">${title}</h1>
    <p class="section-desc reveal">${desc}</p>
  </div>
</section>

${
  filter
    ? `<section class="category-block">
  <div class="wrap category-layout">
    <aside class="category-sidebar">
      <p class="sidebar-heading">Filtrar</p>
      <div class="quality-filter quality-filter-vertical">
        <button class="active" data-quality="all">Todas</button>
        <button data-quality="player">Player</button>
        <button data-quality="fan">Fan</button>
      </div>
    </aside>
    <div class="category-content">
${bodySections}
${extraNote || ""}
    </div>
  </div>
</section>`
    : `<section class="category-block">
  <div class="wrap">
${bodySections}
${extraNote || ""}
  </div>
</section>`
}

${footerHtml(pre)}

<a class="wa-float" href="https://wa.me/${WA1}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.6 6.3A8.9 8.9 0 0 0 12.04 3.6 8.9 8.9 0 0 0 3.5 12.5c0 1.57.4 3.1 1.16 4.45L3.4 21.4l4.6-1.2a8.9 8.9 0 0 0 4.04.98h.01a8.9 8.9 0 0 0 8.55-8.9c0-2.38-.93-4.62-2.6-6.98Zm-5.56 13.7a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.72.72.73-2.66-.18-.27a7.4 7.4 0 0 1-1.14-3.95 7.4 7.4 0 0 1 12.63-5.23 7.36 7.36 0 0 1 2.17 5.24 7.4 7.4 0 0 1-7.45 7.34Zm4.06-5.53c-.22-.11-1.32-.65-1.53-.73-.2-.08-.35-.11-.5.11-.15.22-.57.73-.7.88-.13.15-.26.16-.48.05-.22-.11-.94-.35-1.79-1.11a6.72 6.72 0 0 1-1.24-1.55c-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.4.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.4-.06-.11-.5-1.21-.69-1.66-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.4.06-.6.28-.2.22-.8.78-.8 1.9s.82 2.2.94 2.36c.11.15 1.62 2.48 3.93 3.47.55.24.98.38 1.31.48.55.18 1.06.15 1.46.09.44-.07 1.32-.54 1.51-1.06.19-.52.19-.96.13-1.06-.06-.1-.2-.15-.42-.26Z"/></svg>
</a>

<script src="https://unpkg.com/lenis@1.3.26/dist/lenis.min.js"></script>
<script>
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.Lenis) {
    const lenis = new Lenis();
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
</script>
<script src="${pre}js/main.js?v=3"></script>
${QUALITY_FILTER_SCRIPT}
</body>
</html>
`;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const camisetas = data.products.filter((p) => p.name.toLowerCase().startsWith("camiseta"));
  const shorts = data.products.filter((p) => p.name.toLowerCase().startsWith("short"));
  const medias = data.products.filter((p) => p.name.toLowerCase().startsWith("medias"));
  const classified = camisetas
    .map(classify)
    .filter((p) => p.section !== "sin-clasificar")
    .concat(shorts.map(classifyShort))
    .concat(medias.map(classifyMedias));

  console.log(`Classified ${classified.length} products.`);

  // Download images (main + up to 3 gallery shots) per product.
  let done = 0;
  for (const p of classified) {
    const imgDir = path.join(ROOT, "assets", "tienda", p.section, p.slug);
    ensureDir(imgDir);
    const urls = [p.image, ...p.gallery.filter((g) => g !== p.image)].slice(0, 8);
    const localImages = [];
    for (let i = 0; i < urls.length; i++) {
      const ext = ".webp";
      const fname = `${i + 1}${ext}`;
      try {
        await downloadImage(urls[i], path.join(imgDir, fname));
        localImages.push(fname);
      } catch (e) {
        console.log("IMG FAIL", p.name, urls[i], e.message);
      }
      await sleep(120);
    }
    p.localImages = localImages.length ? localImages : ["1.webp"];
    done++;
    if (done % 10 === 0) console.log(`Images: ${done}/${classified.length}`);
  }

  // Write product pages.
  for (const p of classified) {
    const depth = p.league ? 3 : 2; // tienda/section/[league/]slug.html
    const outDir = path.join(ROOT, "tienda", p.section, p.league || "");
    ensureDir(outDir);
    const html = productPageHtml(p, depth);
    fs.writeFileSync(path.join(outDir, `${p.slug}.html`), html);
  }

  // ---- Category index pages ----
  const bySection = { clubes: [], selecciones: [], "mundial-2026": [], retro: [], shorts: [], medias: [] };
  classified.forEach((p) => bySection[p.section].push(p));

  // Clubes: grouped by league, with a sub-nav.
  const leagues = {};
  bySection.clubes.forEach((p) => {
    if (!leagues[p.league]) leagues[p.league] = { name: p.leagueName, items: [] };
    leagues[p.league].items.push(p);
  });
  const leagueOrder = Object.keys(leagues).sort((a, b) => leagues[b].items.length - leagues[a].items.length);
  const subnav = `    <nav class="league-subnav">\n${leagueOrder
    .map((l) => `      <a href="#${l}">${leagues[l].name} (${leagues[l].items.length})</a>`)
    .join("\n")}\n    </nav>`;
  const clubesBody =
    subnav +
    "\n" +
    leagueOrder
      .map(
        (l) =>
          `    <h2 class="league-heading" id="${l}">${leagues[l].name}</h2>\n    <div class="product-grid">\n${leagues[l].items
            .map((p) => productCardHtml(p, 2))
            .join("\n")}\n    </div>`
      )
      .join("\n");
  fs.writeFileSync(
    path.join(ROOT, "tienda", "clubes", "index.html"),
    categoryIndexHtml({
      section: "clubes",
      title: "Clubes",
      desc: "Camisetas de los clubes más grandes de Europa y Sudamérica, organizadas por liga.",
      bodySections: clubesBody,
    })
  );

  // Selecciones
  fs.writeFileSync(
    path.join(ROOT, "tienda", "selecciones", "index.html"),
    categoryIndexHtml({
      section: "selecciones",
      title: "Selecciones",
      desc: "Camisetas de selecciones nacionales para vivir cada Mundial y Copa América.",
      bodySections: `    <div class="product-grid">\n${bySection.selecciones.map((p) => productCardHtml(p, 2)).join("\n")}\n    </div>`,
    })
  );

  // Mundial 2026
  fs.writeFileSync(
    path.join(ROOT, "tienda", "mundial-2026", "index.html"),
    categoryIndexHtml({
      section: "mundial-2026",
      title: "Mundial 2026",
      desc: "La colección oficial de selecciones rumbo al Mundial 2026.",
      bodySections: `    <div class="product-grid">\n${bySection["mundial-2026"].map((p) => productCardHtml(p, 2)).join("\n")}\n    </div>`,
    })
  );

  // Retro
  const retroNote = `    <div class="empty-state reveal" style="margin-top:32px;">
      <p>Estamos sumando más modelos retro al stock. Contanos qué camiseta buscás y te avisamos apenas la consigamos.</p>
      <a href="${waLink("Hola! Busco una camiseta retro, ¿me pueden ayudar?")}" target="_blank" rel="noopener" class="btn btn-ghost-sm">Consultar por WhatsApp</a>
    </div>`;
  fs.writeFileSync(
    path.join(ROOT, "tienda", "retro", "index.html"),
    categoryIndexHtml({
      section: "retro",
      title: "Retro",
      desc: "Camisetas de temporadas pasadas y ediciones aniversario para los que juegan de memoria.",
      bodySections: `    <div class="product-grid">\n${bySection.retro.map((p) => productCardHtml(p, 2)).join("\n")}\n    </div>`,
      extraNote: retroNote,
    })
  );

  // Shorts (sold as sets to complete a jersey's conjunto)
  ensureDir(path.join(ROOT, "tienda", "shorts"));
  fs.writeFileSync(
    path.join(ROOT, "tienda", "shorts", "index.html"),
    categoryIndexHtml({
      section: "shorts",
      title: "Shorts",
      desc: "Shorts a juego con tu camiseta para armar el conjunto completo.",
      bodySections: `    <div class="product-grid">\n${bySection.shorts.map((p) => productCardHtml(p, 2)).join("\n")}\n    </div>`,
    })
  );

  // Medias antideslizantes (flat grid, no player/fan filter)
  ensureDir(path.join(ROOT, "tienda", "medias"));
  fs.writeFileSync(
    path.join(ROOT, "tienda", "medias", "index.html"),
    categoryIndexHtml({
      section: "medias",
      title: "Medias Antideslizantes",
      desc: "Medias antideslizantes importadas, para no perder pisada en cada jugada. $13.500 cada una.",
      bodySections: `    <div class="product-grid">\n${bySection.medias.map((p) => productCardHtml(p, 2)).join("\n")}\n    </div>`,
      filter: false,
    })
  );

  fs.writeFileSync(path.join(ROOT, "data", "clasificados.json"), JSON.stringify(classified, null, 2));

  // ---- Search index (consumed client-side by the header search overlay) ----
  const searchIndex = classified.map((p) => ({
    name: displayName(p),
    href: `tienda/${p.section}/${p.league ? p.league + "/" : ""}${p.slug}.html`,
    img: `assets/tienda/${p.section}/${p.slug}/${p.localImages[0]}`,
    tag: `${sectionLabel(p.section)}${p.leagueName ? " · " + p.leagueName : ""}`,
  }));
  fs.writeFileSync(path.join(ROOT, "search-index.json"), JSON.stringify(searchIndex));

  // ---- sitemap.xml (kept in sync with every generated + static page) ----
  const SITE = "https://rdhimports.vercel.app";
  const staticUrls = [
    { loc: `${SITE}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${SITE}/tienda.html`, changefreq: "weekly", priority: "0.9" },
  ];
  const categoryUrls = Object.keys(bySection).map((section) => ({
    loc: `${SITE}/tienda/${section}/index.html`,
    changefreq: "weekly",
    priority: "0.8",
  }));
  const productUrls = classified.map((p) => ({
    loc: `${SITE}/tienda/${p.section}/${p.league ? p.league + "/" : ""}${p.slug}.html`,
    changefreq: "weekly",
    priority: "0.7",
  }));
  const allUrls = [...staticUrls, ...categoryUrls, ...productUrls];
  const sitemapXml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    allUrls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemapXml);

  console.log(`Done. Wrote ${classified.length} product pages + 6 category index pages.`);
  console.log(`Sitemap: ${allUrls.length} URLs.`);
  console.log("Section counts:", Object.fromEntries(Object.entries(bySection).map(([k, v]) => [k, v.length])));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
