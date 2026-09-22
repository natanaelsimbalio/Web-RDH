const fs = require("fs");
const path = require("path");
const OUT_FILE = path.join(__dirname, "..", "..", "data", "productos.json");

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

async function main() {
  const data = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
  const stillFailed = [];
  for (const url of data.failed) {
    await sleep(2000);
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; RDH-import/1.0)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const main = extractMainProduct(html, url);
      if (!main) {
        console.log("NO-PRODUCT-DATA", url);
        stillFailed.push(url);
        continue;
      }
      main.gallery = extractGalleryImages(html);
      data.products.push(main);
      console.log("OK", main.name);
    } catch (e) {
      console.log("FAIL", url, e.message);
      stillFailed.push(url);
    }
  }
  data.failed = stillFailed;
  data.count = data.products.length;
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2));
  console.log(`Done. ${data.products.length} total, ${stillFailed.length} still failed.`);
}
main();
