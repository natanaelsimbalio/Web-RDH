// Phase 1: scrape supplier product pages into data/productos.json
// Source of truth for the URL list: https://sacadelmedio.com.ar/sitemap.xml
const fs = require("fs");
const path = require("path");

const BASE = "https://sacadelmedio.com.ar";
const OUT_DIR = path.join(__dirname, "..", "..", "data");
const OUT_FILE = path.join(OUT_DIR, "productos.json");
const URLS_FILE = path.join(__dirname, ".scratch", "product_urls.txt");

function extractMainProduct(html, url) {
  const matches = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const m of matches) {
    let json;
    try {
      json = JSON.parse(m[1]);
    } catch {
      continue;
    }
    if (json["@type"] === "WebPage" && json.mainEntity && json.mainEntity["@type"] === "Product") {
      const p = json.mainEntity;
      return {
        url,
        name: p.name,
        image: p.image,
        sku: p.sku,
        price: p.offers ? Number(p.offers.price) : null,
        availability: p.offers ? p.offers.availability : null,
      };
    }
  }
  return null;
}

function extractGalleryImages(html) {
  const set = new Set();
  const re = /https:\/\/acdn-us\.mitiendanube\.com\/stores\/[^\s"'\\]+?-1024-1024\.webp/g;
  let m;
  while ((m = re.exec(html))) set.add(m[0]);
  return [...set];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchProduct(url, attempt = 1) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; RDH-import/1.0)" } });
  if (res.status === 429) {
    if (attempt > 5) throw new Error(`HTTP 429 for ${url} (gave up after ${attempt} attempts)`);
    await sleep(1500 * attempt);
    return fetchProduct(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  const main = extractMainProduct(html, url);
  if (!main) return null;
  main.gallery = extractGalleryImages(html);
  return main;
}

async function main() {
  const urls = fs.readFileSync(URLS_FILE, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  const failed = [];
  const CONCURRENCY = 3;
  let idx = 0;

  async function worker() {
    while (idx < urls.length) {
      const i = idx++;
      const url = urls[i];
      await sleep(300);
      try {
        const data = await fetchProduct(url);
        if (data) {
          results.push(data);
          console.log(`[${i + 1}/${urls.length}] OK  ${data.name}`);
        } else {
          failed.push(url);
          console.log(`[${i + 1}/${urls.length}] NO-PRODUCT-DATA ${url}`);
        }
      } catch (e) {
        failed.push(url);
        console.log(`[${i + 1}/${urls.length}] FAIL ${url} :: ${e.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  results.sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(OUT_FILE, JSON.stringify({ scrapedAt: new Date().toISOString(), count: results.length, failed, products: results }, null, 2));
  console.log(`\nDone. ${results.length} products saved to ${OUT_FILE}. ${failed.length} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
