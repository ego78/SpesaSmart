import fs from "node:fs/promises";
import { search } from "fast-fuzzy";
import { scanEurospin } from "../connectors/eurospin.mjs";
import { scanPenny } from "../connectors/penny.mjs";
import { normalizeProduct, uniqueOffers } from "../connectors/common.mjs";

const OUTPUT = new URL("../data/offerte.json", import.meta.url);
const appsScriptUrl = process.env.APPS_SCRIPT_URL || "";
const familyCode = process.env.FAMILY_CODE || "default";
const minimumScore = Number(process.env.MINIMUM_MATCH_SCORE || "0.62");

async function loadRemote(action, fallback = []) {
  if (!appsScriptUrl) return fallback;
  const url = new URL(appsScriptUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("familyCode", familyCode);
  url.searchParams.set("_", Date.now());
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Google Apps Script: HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || `Errore ${action}`);
  return data;
}

async function loadProducts() {
  if (!appsScriptUrl) {
    console.warn("APPS_SCRIPT_URL non configurato: nessun prodotto remoto da filtrare.");
    return [];
  }
  const data = await loadRemote("listProducts", {});
  return Array.isArray(data.products) ? data.products : [];
}

async function loadSelectedStores() {
  if (!appsScriptUrl) return [];
  const data = await loadRemote("listSupermarkets", {});
  const stores = Array.isArray(data.supermarkets) ? data.supermarkets : [];
  return stores.filter(store => store && store.selected === true);
}

function normalizedChain(store) {
  return String(store?.brand || store?.name || "").trim().toUpperCase();
}

function selectedChainsFrom(stores) {
  return [...new Set(stores.map(normalizedChain).filter(Boolean))];
}

function locationsForOffer(offer, selectedStores) {
  const offerChain = String(offer.store || offer.chain || "").toUpperCase();
  return selectedStores
    .filter(store => {
      const chain = normalizedChain(store);
      return chain && (offerChain.includes(chain) || chain.includes(offerChain));
    })
    .map(store => ({
      id: store.id || "",
      name: store.name || store.brand || offer.store || "",
      brand: store.brand || store.name || offer.store || "",
      address: store.address || "",
      distance: Number.isFinite(Number(store.distance)) ? Number(store.distance) : null,
      lat: Number.isFinite(Number(store.lat)) ? Number(store.lat) : null,
      lon: Number.isFinite(Number(store.lon)) ? Number(store.lon) : null
    }))
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
}

function attachSelectedLocations(offers, selectedStores) {
  return offers.map(offer => {
    const locations = locationsForOffer(offer, selectedStores);
    return {
      ...offer,
      locations,
      nearestStore: locations[0] || null,
      offerScope: locations.length ? "selected-chain" : "national-chain",
      localValidityVerified: false
    };
  });
}

function matchesWantedProduct(offer, products) {
  if (!products.length) return true;

  const offerText = normalizeProduct(
    [offer.product, offer.brand, offer.format].filter(Boolean).join(" ")
  );

  return products.some(product => {
    const wanted = normalizeProduct(
      [product.name, product.brand, product.format].filter(Boolean).join(" ")
    );

    if (!wanted) return false;
    if (offerText.includes(wanted) || wanted.includes(offerText)) return true;

    const result = search(wanted, [offerText], {
      returnMatchData: true,
      threshold: minimumScore
    });

    return result.length > 0;
  });
}

async function safeScan(name, scanner) {
  try {
    const offers = await scanner();
    console.log(`${name}: ${offers.length} offerte lette`);
    return offers;
  } catch (error) {
    console.error(`${name}:`, error.message);
    return [];
  }
}

const [products, selectedStores] = await Promise.all([
  loadProducts(),
  loadSelectedStores()
]);
const selectedChains = selectedChainsFrom(selectedStores);
console.log(`Prodotti monitorati: ${products.length}`);
console.log(`Punti vendita selezionati: ${selectedStores.length}`);
console.log(`Catene selezionate: ${selectedChains.length ? selectedChains.join(", ") : "nessun filtro"}`);

const scanners = [
  { name: "Eurospin", aliases: ["EUROSPIN"], scan: scanEurospin },
  { name: "PENNY", aliases: ["PENNY"], scan: scanPenny }
];

const enabledScanners = selectedChains.length
  ? scanners.filter(item => item.aliases.some(alias => selectedChains.some(chain => chain.includes(alias))))
  : scanners;

const results = await Promise.all(
  enabledScanners.map(item => safeScan(item.name, item.scan))
);

const allOffers = attachSelectedLocations(uniqueOffers(results.flat()), selectedStores);

const matchedOffers = [...allOffers]
  .sort((a, b) =>
    a.store.localeCompare(b.store, "it") ||
    a.product.localeCompare(b.product, "it")
  );

await fs.writeFile(
  OUTPUT,
  JSON.stringify(matchedOffers, null, 2) + "\n",
  "utf8"
);

console.log(`Offerte totali: ${allOffers.length}`);
console.log(`Offerte corrispondenti: ${matchedOffers.length}`);
