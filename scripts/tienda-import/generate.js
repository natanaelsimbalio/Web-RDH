// Phase 2: consumes data/productos.json, downloads images, and renders static HTML
// for every jersey into tienda/<section>/[<league>/]<slug>.html plus category index pages.
const fs = require("fs");
const path = require("path");
const { classify } = require("./classify");

const ROOT = path.join(__dirname, "..", "..");
const DATA_FILE = path.join(ROOT, "data", "productos.json");

const WA1 = "5493412025376";

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
  return { clubes: "Clubes", selecciones: "Selecciones", "mundial-2026": "Mundial 2026", retro: "Retro" }[section] || section;
}

function displayName(p) {
  let n = p.name.replace(/^Camiseta\s+/i, "");
  n = n.replace(/\bFAN\b/gi, "").replace(/\bPLAYER\b/gi, "").trim();
  n = n.replace(/\s{2,}/g, " ");
  return n;
}

function priceFmt(n) {
  return "$" + n.toLocaleString("es-AR");
}

function productPageHtml(p, depth) {
  const pre = relPrefix(depth);
  const title = `${displayName(p)} · ${p.quality === "player" ? "Versión Player" : "Versión Fan"} — RDH Imports`;
  const desc = `Camiseta ${displayName(p)}, edición ${p.quality === "player" ? "Player" : "Fan"}. Tela liviana e importada. Consultá talle y stock por WhatsApp.`;
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
  const waText = `Hola! Me interesa la camiseta ${displayName(p)} (${p.quality === "player" ? "Player" : "Fan"}), ¿tienen stock?`;
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
        <p class="pdp-subtitle">Edición ${p.quality === "player" ? "Player" : "Fan"}</p>
        <p class="pdp-price">${priceFmt(p.priceDisplay)}</p>
        <p class="pdp-desc">Camiseta importada ${displayName(p)}, edición ${p.quality === "player" ? "Player" : "Fan"}. Tela liviana y transpirable, ideal para usar en la cancha o de calle.</p>

        <div class="pdp-cta">
          <a class="btn btn-primary" href="${waLink(waText)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          <p class="pdp-cta-note">Te confirmamos talle, precio y stock al toque.</p>
        </div>

        <div class="pdp-specs-block">
          <h2>Detalles del producto</h2>
          <ul class="pdp-specs">
            <li><span>Edición</span><strong>${p.quality === "player" ? "Player" : "Fan"}</strong></li>
            <li><span>Tela</span><strong>Liviana y transpirable</strong></li>
            <li><span>Talles</span><strong>S · M · L · XL · XXL</strong></li>
            <li><span>Origen</span><strong>Importada</strong></li>
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

function headerHtml(pre) {
  return `<header class="site-header" id="header">
  <div class="wrap header-inner">
    <a href="${pre}index.html" class="brand-mark">
      <img class="brand-logo brand-logo-light" src="${pre}assets/img/logo-horizontal-white.png" alt="RDH Imports" width="764" height="173">
      <img class="brand-logo brand-logo-dark" src="${pre}assets/img/logo-horizontal-dark.png" alt="RDH Imports" width="764" height="173">
    </a>

    <nav class="main-nav" id="main-nav">
      <div class="has-dropdown">
        <a href="${pre}tienda.html">Tienda</a>
        <div class="dropdown">
          <a href="${pre}tienda/clubes/index.html">Clubes</a>
          <a href="${pre}tienda/selecciones/index.html">Selecciones</a>
          <a href="${pre}tienda/mundial-2026/index.html">Mundial 2026</a>
          <a href="${pre}tienda/retro/index.html">Retro</a>
        </div>
      </div>
      <a href="${pre}index.html#como-comprar">Cómo comprar</a>
      <a href="${pre}index.html#nosotros">Nosotros</a>
      <a href="${pre}index.html#contacto">Contacto</a>
    </nav>

    <div class="header-cta">
      <a class="btn btn-ghost-sm" href="https://instagram.com/rdh.imports" target="_blank" rel="noopener">
        <span class="icon-ig" aria-hidden="true"></span>
        @rdh.imports
      </a>
      <a class="btn btn-primary-sm" href="https://wa.me/${WA1}" target="_blank" rel="noopener">WhatsApp</a>
    </div>

    <button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="mobile-nav" id="mobile-nav">
    <a href="${pre}tienda.html">Tienda</a>
    <div class="submenu">
      <a href="${pre}tienda/clubes/index.html">Clubes</a>
      <a href="${pre}tienda/selecciones/index.html">Selecciones</a>
      <a href="${pre}tienda/mundial-2026/index.html">Mundial 2026</a>
      <a href="${pre}tienda/retro/index.html">Retro</a>
    </div>
    <a href="${pre}index.html#como-comprar">Cómo comprar</a>
    <a href="${pre}index.html#nosotros">Nosotros</a>
    <a href="${pre}index.html#contacto">Contacto</a>
    <a href="https://instagram.com/rdh.imports" target="_blank" rel="noopener" class="mobile-nav-ig">
      <span class="icon-ig icon-ig-sm" aria-hidden="true"></span>
      @rdh.imports
    </a>
    <a class="btn btn-primary-sm" href="https://wa.me/${WA1}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
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
      <a href="https://wa.me/${WA1}" target="_blank" rel="noopener">WhatsApp 1</a>
      <a href="https://wa.me/5493417213013" target="_blank" rel="noopener">WhatsApp 2</a>
      <a href="https://instagram.com/rdh.imports" target="_blank" rel="noopener">
        <span class="icon-ig icon-ig-sm" aria-hidden="true"></span>
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
  const waText = `Hola! Me interesa la camiseta ${displayName(p)} (${p.quality === "player" ? "Player" : "Fan"}), ¿tienen stock?`;
  return `      <article class="product-card reveal" data-quality="${p.quality}">
        <a class="product-media product-link" href="${href}">
          <img src="${img}" alt="${displayName(p)}" loading="lazy" width="800" height="800">
        </a>
        <div class="product-body">
          <p class="product-tag">${sectionLabel(p.section)}${p.leagueName ? " · " + p.leagueName : ""}</p>
          <p class="product-price">${priceFmt(p.priceDisplay)}</p>
          <h3><a href="${href}">${displayName(p)}</a></h3>
          <p>Edición ${p.quality === "player" ? "Player" : "Fan"}, importada, tela liviana y transpirable.</p>
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

function categoryIndexHtml({ section, title, desc, bodySections, extraNote }) {
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

<section class="category-block">
  <div class="wrap">
    <div class="quality-filter">
      <button class="active" data-quality="all">Todas</button>
      <button data-quality="player">Player</button>
      <button data-quality="fan">Fan</button>
    </div>
${bodySections}
${extraNote || ""}
  </div>
</section>

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
  const camisetas = data.products.filter((p) => p.name.toLowerCase().startsWith("camiseta") && p.price > 0);
  const classified = camisetas.map(classify).filter((p) => p.section !== "sin-clasificar");

  console.log(`Classified ${classified.length} products.`);

  // Download images (main + up to 3 gallery shots) per product.
  let done = 0;
  for (const p of classified) {
    const imgDir = path.join(ROOT, "assets", "tienda", p.section, p.slug);
    ensureDir(imgDir);
    const urls = [p.image, ...p.gallery.filter((g) => g !== p.image)].slice(0, 4);
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
  const bySection = { clubes: [], selecciones: [], "mundial-2026": [], retro: [] };
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

  fs.writeFileSync(path.join(ROOT, "data", "clasificados.json"), JSON.stringify(classified, null, 2));
  console.log(`Done. Wrote ${classified.length} product pages + 4 category index pages.`);
  console.log("Section counts:", Object.fromEntries(Object.entries(bySection).map(([k, v]) => [k, v.length])));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
