import { cleanText, parsePrice } from './common.mjs';

const LANDING_URL = 'https://www.penny.it/sfoglia-il-volantino-mobile';
const API_ROOT = 'https://next.doveconviene.it/api/flyer';
const FALLBACK_FLYER_ID = '1635909';
const MAX_PRODUCTS = 500;
const MAX_SECTIONS = 12;

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function absoluteImage(basePath, source = '') {
  const src = String(source || '').trim();
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  return `${String(basePath || '').replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
}

async function getJson(url, { allowNotFound = false } = {}) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json,text/plain,*/*',
      'accept-language': 'it-IT,it;q=0.9',
      'user-agent': 'Mozilla/5.0 (compatible; SpesaSmart/2.2; +GitHub Actions)'
    },
    redirect: 'follow'
  });

  if (allowNotFound && response.status === 404) return null;
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function discoverFlyerId() {
  if (process.env.PENNY_FLYER_ID) return String(process.env.PENNY_FLYER_ID).trim();

  try {
    const response = await fetch(LANDING_URL, {
      headers: {
        'accept-language': 'it-IT,it;q=0.9',
        'user-agent': 'Mozilla/5.0 (compatible; SpesaSmart/2.2; +GitHub Actions)'
      },
      redirect: 'follow'
    });
    const html = await response.text();
    const patterns = [
      /api\/flyer\/(\d{5,})/i,
      /["']flyerId["']\s*[:=]\s*["']?(\d{5,})/i,
      /[?&](?:flyer|flyerId|id)=(\d{5,})/i
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return match[1];
    }
  } catch (error) {
    console.warn(`PENNY: identificazione automatica volantino non riuscita: ${error.message}`);
  }

  console.warn(`PENNY: uso ID volantino di riserva ${FALLBACK_FLYER_ID}`);
  return FALLBACK_FLYER_ID;
}

function coordinates(store) {
  const lat = numberOrNull(store.lat ?? store.latitude);
  const lon = numberOrNull(store.lon ?? store.lng ?? store.longitude);
  if (lat === null || lon === null) throw new Error('Punto vendita PENNY senza coordinate GPS');
  return { lat, lon };
}

async function resolvePennyStore(flyerId, selectedStore) {
  const { lat, lon } = coordinates(selectedStore);
  const url = `${API_ROOT}/${flyerId}/stores?ll=${encodeURIComponent(`${lat},${lon}`)}&cb=${Date.now()}`;
  const data = await getJson(url);
  const stores = Array.isArray(data?.value) ? data.value : [];
  if (!stores.length) throw new Error('Nessun punto vendita PENNY associato al volantino');
  return stores
    .map(store => ({ ...store, distance: numberOrNull(store.distance) }))
    .sort((a, b) => (a.distance ?? 999999) - (b.distance ?? 999999))[0];
}

function mapProduct(payload, metadata, selectedStore, officialStore, flyerId) {
  const item = payload?.product;
  if (!item || item.type === 'image') return null;

  const product = cleanText(item.name);
  const price = parsePrice(item.price?.discounted ?? item.price?.full);
  if (!product || !price) return null;

  const oldPrice = parsePrice(item.price?.full);
  const storeName = cleanText(selectedStore.name || selectedStore.brand || `PENNY ${officialStore.city || ''}`) || 'PENNY';
  const address = cleanText(selectedStore.address || officialStore.address);
  const distance = numberOrNull(selectedStore.distance ?? officialStore.distance);

  return {
    product,
    brand: '',
    store: 'PENNY',
    format: cleanText(item.subName),
    price,
    oldPrice: oldPrice && oldPrice > price ? oldPrice : null,
    unitPrice: null,
    unit: '',
    validFrom: metadata.dateFrom || '',
    validUntil: metadata.dateTo || '',
    image: absoluteImage(metadata.basePath, item.productImage),
    category: cleanText(item.categoryName),
    productId: item.id || item.externalId || '',
    requiresLoyaltyCard: String(item.selectedBadge || '').toLowerCase().includes('pennycard'),
    sourceUrl: LANDING_URL,
    source: 'penny-local-flyer-api',
    flyerId: String(flyerId),
    flyerStoreId: String(selectedStore.id || ''),
    officialStoreId: String(officialStore.id || ''),
    localValidityVerified: true,
    offerScope: 'selected-store',
    nearestStore: {
      id: String(selectedStore.id || ''),
      officialStoreId: String(officialStore.id || ''),
      name: storeName,
      brand: 'PENNY',
      address,
      distance,
      lat: numberOrNull(selectedStore.lat ?? officialStore.lat),
      lon: numberOrNull(selectedStore.lon ?? selectedStore.lng ?? officialStore.lon)
    },
    locations: [{
      id: String(selectedStore.id || ''),
      officialStoreId: String(officialStore.id || ''),
      name: storeName,
      brand: 'PENNY',
      address,
      distance,
      lat: numberOrNull(selectedStore.lat ?? officialStore.lat),
      lon: numberOrNull(selectedStore.lon ?? selectedStore.lng ?? officialStore.lon)
    }]
  };
}

async function readProducts(flyerId, metadata, selectedStore, officialStore) {
  const offers = [];
  let emptySections = 0;

  for (let section = 0; section < MAX_SECTIONS && emptySections < 2; section += 1) {
    let foundInSection = 0;
    let consecutiveMissing = 0;

    for (let productIndex = 0; productIndex < MAX_PRODUCTS && consecutiveMissing < 4; productIndex += 1) {
      const url = `${API_ROOT}/${flyerId}/section/${section}/product/${productIndex}?cb=${Date.now()}`;
      const payload = await getJson(url, { allowNotFound: true });
      if (!payload) {
        consecutiveMissing += 1;
        continue;
      }
      consecutiveMissing = 0;
      foundInSection += 1;
      const offer = mapProduct(payload, metadata, selectedStore, officialStore, flyerId);
      if (offer) offers.push(offer);
    }

    if (foundInSection === 0) emptySections += 1;
    else emptySections = 0;
  }

  return offers;
}

export async function scanPennyLocal(selectedStore) {
  const flyerId = await discoverFlyerId();
  const metadata = await getJson(`${API_ROOT}/${flyerId}?cb=${Date.now()}`);
  const officialStore = await resolvePennyStore(flyerId, selectedStore);
  const offers = await readProducts(flyerId, metadata, selectedStore, officialStore);

  if (!offers.length) throw new Error(`Volantino PENNY ${flyerId}: nessun prodotto leggibile`);

  console.log(
    `PENNY locale: ${officialStore.city}, ${officialStore.address} ` +
    `(store ${officialStore.id}, volantino ${flyerId}, ${offers.length} offerte)`
  );
  return offers;
}
