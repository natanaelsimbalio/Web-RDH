// Fetches each product's own supplier page and extracts the FULL photo gallery
// (not just the single cover image already in data/productos.json).
//
// The supplier page repeats the product's own photos inside `.js-product-thumb`
// elements whose `alt` text starts with the product's exact name, and separately
// embeds single cover shots for ~8 unrelated "recommended products" further down
// the page (their alt text is a *different* product name). We keep only the
// images whose alt matches this product, dedup by base filename (ignoring the
// `-WWW-HHH.webp` size suffix) and upgrade every URL to the `-1024-1024` size.
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "..", "data", "productos.json");
const CONCURRENCY = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractGalleryImages(html, productName) {
  const nameLower = productName.trim().toLowerCase();
  const re = /data-srcset=['"]([^'"]+)['"][^>]*alt="([^"]*)"/g;
  const seen = new Set();
  const results = [];
  let m;
  while ((m = re.exec(html))) {
    const alt = m[2].trim().toLowerCase();
    if (!alt.startsWith(nameLower)) continue;
    const parts = m[1].split(",").map((s) => s.trim());
    let best = null;
    let bestW = -1;
    for (const p of parts) {
      const [url, wRaw] = p.split(/\s+/);
      const w = parseInt(wRaw) || 0;
      if (w > bestW) {
        bestW = w;
        best = url;
      }
    }
    if (!best) continue;
    let full = best.startsWith("//") ? "https:" + best : best;
    full = full.replace(/-\d+-\d+\.webp$/, "-1024-1024.webp");
    const base = full.replace(/-\d+-\d+\.webp$/, "");
    if (seen.has(base)) continue;
    seen.add(base);
    results.push(full);
  }
  return results;
}

async function fetchGallery(url, name, attempt = 1) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; RDH-import/1.0)" } });
  if (res.status === 429) {
    if (attempt > 5) throw new Error(`HTTP 429 (gave up)`);
    await sleep(1500 * attempt);
    return fetchGallery(url, name, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return extractGalleryImages(html, name);
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const products = data.products;
  let idx = 0;
  let done = 0;
  let withGallery = 0;

  async function worker() {
    while (idx < products.length) {
      const i = idx++;
      const p = products[i];
      await sleep(200);
      try {
        const gallery = await fetchGallery(p.url, p.name);
        p.gallery = gallery.filter((g) => g !== p.image);
        if (p.gallery.length) withGallery++;
        done++;
        console.log(`[${done}/${products.length}] ${p.gallery.length + 1} imgs :: ${p.name}`);
      } catch (e) {
        done++;
        console.log(`[${done}/${products.length}] FAIL :: ${p.name} :: ${e.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`\nDone. ${withGallery}/${products.length} products now have a multi-photo gallery.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
