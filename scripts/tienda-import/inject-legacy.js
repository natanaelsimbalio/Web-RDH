// Injects the 11 pre-existing hand-authored root-level product pages into the
// newly generated category index pages, so the old catalog stays reachable
// from the new nav instead of being orphaned.
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");

function card({ href, img, alt, tag, price, title, desc, wa }) {
  return `      <article class="product-card reveal" data-quality="player">
        <a class="product-media product-link" href="${href}">
          <img src="${img}" alt="${alt}" loading="lazy" width="800" height="800">
        </a>
        <div class="product-body">
          <p class="product-tag">${tag}</p>
          <p class="product-price">${price}</p>
          <h3><a href="${href}">${title}</a></h3>
          <p>${desc}</p>
          <a href="${href}" class="btn btn-primary-sm">Ver producto</a>
          <a href="https://wa.me/5493412025376?text=${encodeURIComponent(wa)}" target="_blank" rel="noopener" class="btn btn-ghost-sm">Consultar por WhatsApp</a>
        </div>
      </article>`;
}

const R = "../../"; // tienda/<section>/index.html -> root

const selecciones = [
  card({
    href: R + "producto-argentina-titular.html",
    img: R + "assets/imgCamisetas/argentina-titular-frente.jpg",
    alt: "Camiseta titular de la Selección Argentina, campeón del mundo",
    tag: "Selecciones",
    price: "$48.000",
    title: "Selección Argentina · Titular · Versión Jugador",
    desc: "La titular albiceleste con las tres estrellas y el escudo de campeón del mundo termosellado.",
    wa: "Hola! Me interesa la camiseta titular de la Selección Argentina, ¿tienen stock?",
  }),
  card({
    href: R + "producto-francia-alternativa.html",
    img: R + "assets/imgCamisetas/francia-alternativa-frente.jpg",
    alt: "Camiseta alternativa de la Selección de Francia, color verde menta",
    tag: "Selecciones",
    price: "$48.000",
    title: "Selección Francia · Alternativa · Versión Jugador",
    desc: "Segunda equipación en verde menta con detalles en naranja y el gallo termosellado al pecho.",
    wa: "Hola! Me interesa la camiseta alternativa de la Selección de Francia, ¿tienen stock?",
  }),
  card({
    href: R + "producto-italia-suplente.html",
    img: R + "assets/imgCamisetas/italia-suplente-frente.jpg",
    alt: "Camiseta suplente de la Selección de Italia, edición Mundial blanca y dorada",
    tag: "Selecciones",
    price: "$48.000",
    title: "Selección Italia · Suplente · Versión Jugador",
    desc: "Suplente rumbo al Mundial, blanca con vivos dorados y azules, escudo FIGC bordado.",
    wa: "Hola! Me interesa la camiseta suplente de la Selección de Italia, ¿tienen stock?",
  }),
];

const clubes = {
  "liga-inglesa": [
    card({
      href: R + "producto-manchester-united.html",
      img: R + "assets/imgCamisetas/manchester-united-especial-frente.jpg",
      alt: "Camiseta manga larga edición especial de Manchester United",
      tag: "Clubes · Liga Inglesa",
      price: "$48.000",
      title: "Manchester United · Edición Especial · Versión Jugador",
      desc: "Manga larga edición limitada en beige con estampado floral sutil y escudo del diablo rojo.",
      wa: "Hola! Me interesa la camiseta edición especial de Manchester United, ¿tienen stock?",
    }),
    card({
      href: R + "producto-manchester-united-home.html",
      img: R + "assets/imgCamisetas/manchester-united-home-frente.jpg",
      alt: "Camiseta titular de Manchester United 25/26, roja con sponsor Snapdragon",
      tag: "Clubes · Liga Inglesa",
      price: "$48.000",
      title: "Manchester United · Titular · Versión Jugador 25/26",
      desc: "Titular roja con detalles negros, escudo bordado y sponsor Snapdragon termosellado.",
      wa: "Hola! Me interesa la camiseta titular del Manchester United 25/26, ¿tienen stock?",
    }),
    card({
      href: R + "producto-manchester-city-home.html",
      img: R + "assets/imgCamisetas/manchester-city-home-frente.jpg",
      alt: "Camiseta titular del Manchester City 26/27, celeste con sponsor Etihad Airways",
      tag: "Clubes · Liga Inglesa",
      price: "$48.000",
      title: "Manchester City · Titular · Versión Jugador 26/27",
      desc: "Titular celeste con degradé, escudo termosellado y sponsor Etihad Airways.",
      wa: "Hola! Me interesa la camiseta titular del Manchester City 26/27, ¿tienen stock?",
    }),
    card({
      href: R + "producto-manchester-city-suplente.html",
      img: R + "assets/imgCamisetas/manchester-city-suplente-frente.jpg",
      alt: "Camiseta suplente del Manchester City 25/26, blanca con banda celeste",
      tag: "Clubes · Liga Inglesa",
      price: "$48.000",
      title: "Manchester City · Suplente · Versión Jugador 25/26",
      desc: "Suplente blanca con banda central celeste degradé y sponsor Etihad Airways.",
      wa: "Hola! Me interesa la camiseta suplente del Manchester City 25/26, ¿tienen stock?",
    }),
  ],
  "liga-espanola": [
    card({
      href: R + "producto-real-madrid-home.html",
      img: R + "assets/imgCamisetas/real-madrid-home-frente.jpg",
      alt: "Camiseta titular del Real Madrid 25/26, blanca con sponsor Emirates",
      tag: "Clubes · Liga Española",
      price: "$48.000",
      title: "Real Madrid · Titular · Versión Jugador 25/26",
      desc: "Titular blanca con vivos dorados y sponsor Emirates Fly Better termosellado.",
      wa: "Hola! Me interesa la camiseta titular del Real Madrid 25/26, ¿tienen stock?",
    }),
    card({
      href: R + "producto-barcelona-edicion-especial.html",
      img: R + "assets/imgCamisetas/barcelona-edicion-especial-frente.jpg",
      alt: "Camiseta Barcelona edición especial 1899-2024, bordó y azul",
      tag: "Clubes · Liga Española",
      price: "$48.000",
      title: "Barcelona · Edición Especial 1899-2024 · Versión Jugador",
      desc: "Edición aniversario 125 años, partida en bordó y azul, escudo y swoosh Nike dorados.",
      wa: "Hola! Me interesa la camiseta edición especial 1899-2024 del Barcelona, ¿tienen stock?",
    }),
  ],
  "liga-alemana": [
    card({
      href: R + "producto-bayern-munich-home.html",
      img: R + "assets/imgCamisetas/bayern-munich-home-frente.jpg",
      alt: "Camiseta titular del Bayern Munich 26/27, roja con sponsor T-Mobile",
      tag: "Clubes · Liga Alemana",
      price: "$48.000",
      title: "Bayern Munich · Titular · Versión Jugador 26/27",
      desc: "Titular roja con rayas tono sobre tono, vivos dorados y escudo de cinco estrellas.",
      wa: "Hola! Me interesa la camiseta titular del Bayern Munich 26/27, ¿tienen stock?",
    }),
  ],
  "liga-italiana": [
    card({
      href: R + "producto-ac-milan-suplente.html",
      img: R + "assets/imgCamisetas/ac-milan-suplente-frente.jpg",
      alt: "Camiseta suplente de AC Milan 26/27, blanca con vivos rojo y negro",
      tag: "Clubes · Liga Italiana",
      price: "$48.000",
      title: "AC Milan · Suplente · Versión Jugador 26/27",
      desc: "Suplente blanca con vivos rojo y negro en cuello y mangas, escudo bordado 1899.",
      wa: "Hola! Me interesa la camiseta suplente de AC Milan 26/27, ¿tienen stock?",
    }),
  ],
};

const retro = [
  card({
    href: R + "producto-barcelona-edicion-especial.html",
    img: R + "assets/imgCamisetas/barcelona-edicion-especial-frente.jpg",
    alt: "Camiseta Barcelona edición especial 1899-2024, bordó y azul",
    tag: "Retro",
    price: "$48.000",
    title: "Barcelona · Edición Especial 1899-2024 · Versión Jugador",
    desc: "Edición aniversario 125 años, partida en bordó y azul, escudo y swoosh Nike dorados.",
    wa: "Hola! Me interesa la camiseta edición especial 1899-2024 del Barcelona, ¿tienen stock?",
  }),
];

function insertAfterGridOpen(html, marker, cardsHtml) {
  const idx = html.indexOf(marker);
  if (idx === -1) throw new Error("marker not found: " + marker);
  const insertAt = idx + marker.length;
  return html.slice(0, insertAt) + "\n" + cardsHtml + html.slice(insertAt);
}

// Selecciones: single grid, insert at its opening.
{
  const file = path.join(ROOT, "tienda", "selecciones", "index.html");
  let html = fs.readFileSync(file, "utf8");
  html = insertAfterGridOpen(html, '<div class="product-grid">', selecciones.join("\n"));
  fs.writeFileSync(file, html);
  console.log("Injected", selecciones.length, "into selecciones");
}

// Retro: single grid.
{
  const file = path.join(ROOT, "tienda", "retro", "index.html");
  let html = fs.readFileSync(file, "utf8");
  html = insertAfterGridOpen(html, '<div class="product-grid">', retro.join("\n"));
  fs.writeFileSync(file, html);
  console.log("Injected", retro.length, "into retro");
}

// Clubes: one grid per league heading id — insert right after that league's product-grid opening.
{
  const file = path.join(ROOT, "tienda", "clubes", "index.html");
  let html = fs.readFileSync(file, "utf8");
  for (const [league, cards] of Object.entries(clubes)) {
    const headingMarker = `id="${league}">`;
    const headingIdx = html.indexOf(headingMarker);
    if (headingIdx === -1) throw new Error("league heading not found: " + league);
    const gridMarker = '<div class="product-grid">';
    const gridIdx = html.indexOf(gridMarker, headingIdx);
    const insertAt = gridIdx + gridMarker.length;
    html = html.slice(0, insertAt) + "\n" + cards.join("\n") + html.slice(insertAt);
  }
  fs.writeFileSync(file, html);
  console.log("Injected clubes cards across leagues");
}

console.log("Done.");
