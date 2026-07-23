import { cleanText, numberValue, uniqueOffers } from './common.mjs';
import { resolveLidlFlyer } from './lidl-local.mjs';

const HOME_URL = 'https://www.lidl.it/';
const LANDING_URL = 'https://www.lidl.it/c/volantino-lidl/s10018048';

function parseItalianPrice(value = '') {
  const text = cleanText(value);
  const euro = text.match(/(?:^|\s)(\d{1,3}(?:[.,]\d{2}))\s*€\*?/);
  if (euro) return numberValue(euro[1]);

  const split = text.match(/(?:^|\s)(\d{1,3})\s*[,.]\s*(\d{2})(?:\s*€|\s|$)/);
  return split ? Number(`${split[1]}.${split[2]}`) : null;
}

function parseDates(text = '') {
  const normalized = cleanText(text);
  const range = normalized.match(
    /(?:dal|da)\s+(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\s+(?:al|a)\s+(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/i
  );

  if (!range) return { validFrom: '', validTo: '' };

  const currentYear = new Date().getFullYear();
  const year1 = Number(range[3] || currentYear);
  const year2 = Number(range[6] || year1);
  const yyyy1 = year1 < 100 ? 2000 + year1 : year1;
  const yyyy2 = year2 < 100 ? 2000 + year2 : year2;

  const iso = (y, m, d) =>
    `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return {
    validFrom: iso(yyyy1, range[2], range[1]),
    validTo: iso(yyyy2, range[5], range[4])
  };
}

function cleanTitle(value = '') {
  return cleanText(value)
    .replace(/^(in punto vendita|online)\s*/i, '')
    .replace(/\s+\^\{\}\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function titleIsUsable(value = '') {
  const title = cleanTitle(value);
  if (!title || title.length < 3 || title.length > 160) return false;
  if (/^(scopri|mostra|offerte|questa settimana|prossima settimana|in punto vendita)$/i.test(title)) return false;
  if (/^\d/.test(title) && title.length < 12) return false;
  return /[a-zàèéìòù]/i.test(title);
}

function normalizeOffer(raw, context, store, index) {
  const title = cleanTitle(raw.title || raw.imageAlt || '');
  const price = numberValue(raw.price);
  if (!titleIsUsable(title) || !Number.isFinite(price) || price <= 0) return null;

  const dates = parseDates(raw.text || '');
  const appStoreId = String(store.id || '');
  const officialStoreId = String(
    store.officialStoreId ||
    store.storeCode ||
    context.officialStoreId ||
    'IT00812'
  );

  return {
    id: `lidl-${context.flyerId || 'weekly'}-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-').slice(0, 48)}`,
    store: 'Lidl',
    chain: 'LIDL',
    product: title,
    brand: cleanText(raw.brand || ''),
    format: cleanText(raw.format || ''),
    category: cleanText(raw.category || ''),
    price,
    oldPrice: Number.isFinite(numberValue(raw.oldPrice)) && numberValue(raw.oldPrice) > price
      ? numberValue(raw.oldPrice)
      : null,
    unitPrice: numberValue(raw.unitPrice),
    discount: cleanText(raw.discount || ''),
    description: cleanText(raw.description || ''),
    image: String(raw.image || ''),
    validFrom: dates.validFrom || context.validFrom || '',
    validTo: dates.validTo || context.validUntil || '',
    sourceUrl: String(raw.sourceUrl || context.offersUrl || context.flyerUrl || LANDING_URL),
    source: 'Lidl Italia - pagina offerte ufficiale',
    localValidityVerified: false,
    offerScope: 'national-chain',
    flyerId: String(context.flyerId || ''),
    promotionId: '',
    flyerStoreId: appStoreId,
    officialStoreId,
    officialStoreAlias: 'sava',
    nearestStore: {
      id: appStoreId,
      name: store.name || store.brand || 'Lidl',
      brand: store.brand || 'Lidl',
      address: store.address || '',
      lat: Number.isFinite(Number(store.lat)) ? Number(store.lat) : null,
      lon: Number.isFinite(Number(store.lon)) ? Number(store.lon) : null,
      distance: Number.isFinite(Number(store.distance)) ? Number(store.distance) : null
    },
    locations: [{
      id: appStoreId,
      name: store.name || store.brand || 'Lidl',
      brand: store.brand || 'Lidl',
      address: store.address || '',
      lat: Number.isFinite(Number(store.lat)) ? Number(store.lat) : null,
      lon: Number.isFinite(Number(store.lon)) ? Number(store.lon) : null,
      distance: Number.isFinite(Number(store.distance)) ? Number(store.distance) : null,
      officialStoreId
    }],
    fetchedAt: new Date().toISOString()
  };
}

async function dismissConsent(page) {
  const labels = [
    /accetta tutto/i,
    /accetta tutti/i,
    /consenti tutto/i,
    /continua senza accettare/i
  ];

  for (const label of labels) {
    const button = page.getByRole('button', { name: label }).first();
    if (await button.count()) {
      try {
        await button.click({ timeout: 2500 });
        await page.waitForTimeout(600);
        return;
      } catch {
        // Il banner può non essere visibile in GitHub Actions.
      }
    }
  }
}

async function findOffersUrl(page) {
  await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await dismissConsent(page);

  const links = await page.locator('a[href]').evaluateAll(nodes =>
    nodes.map(node => ({
      href: node.href || '',
      text: (node.textContent || '').replace(/\s+/g, ' ').trim()
    }))
  );

  const candidates = links
    .filter(item =>
      /\/c\/(?:offerte-della-settimana|lidl-plus|frutta|carne|super-offerte)[^?#/]*/i.test(item.href) ||
      /super offerte nel tuo punto vendita|offerte attuali/i.test(item.text)
    )
    .sort((a, b) => {
      const score = item => {
        let value = 0;
        if (/offerte-della-settimana/i.test(item.href)) value += 30;
        if (/offerte attuali|super offerte/i.test(item.text)) value += 10;
        if (/kw-/i.test(item.href)) value += 5;
        return value;
      };
      return score(b) - score(a);
    });

  if (candidates[0]?.href) return candidates[0].href;

  // Pagina ufficiale di riserva: contiene comunque i collegamenti alle offerte.
  await page.goto(LANDING_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await dismissConsent(page);

  const landingLinks = await page.locator('a[href]').evaluateAll(nodes =>
    nodes.map(node => ({
      href: node.href || '',
      text: (node.textContent || '').replace(/\s+/g, ' ').trim()
    }))
  );

  return landingLinks.find(item => /\/c\/offerte-della-settimana-/i.test(item.href))?.href || '';
}

async function expandOffers(page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const buttons = page.getByRole('button', { name: /mostra di più|show more/i });
    if (!(await buttons.count())) break;

    let clicked = false;
    for (let i = 0; i < await buttons.count(); i += 1) {
      try {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          await button.click({ timeout: 2500 });
          await page.waitForTimeout(800);
          clicked = true;
        }
      } catch {
        // Un pulsante può sparire dopo il click del precedente.
      }
    }
    if (!clicked) break;
  }

  // Alcune sezioni caricano le card soltanto durante lo scorrimento.
  for (let y = 0; y < 6; y += 1) {
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(400);
  }
  await page.mouse.wheel(0, -10000);
}

async function extractCards(page) {
  return page.evaluate(() => {
    const clean = value => String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    const priceFrom = text => {
      const matches = [...clean(text).matchAll(/(\d{1,3}[.,]\d{2})\s*€\*?/g)];
      if (!matches.length) return null;
      return Number(matches[matches.length - 1][1].replace(',', '.'));
    };

    const oldPriceFrom = element => {
      const old = element.querySelector(
        'del, s, strike, [class*="old-price"], [class*="oldPrice"], [class*="previous"], [class*="original"]'
      );
      const match = clean(old?.textContent).match(/(\d{1,3}[.,]\d{2})/);
      return match ? Number(match[1].replace(',', '.')) : null;
    };

    const titleFrom = element => {
      const preferred = element.querySelector(
        'h1, h2, h3, h4, h5, [class*="product"][class*="title"], [class*="product"][class*="name"], [class*="title"], [class*="name"]'
      );
      const heading = clean(preferred?.textContent);
      if (heading) return heading;

      const imageAlt = clean(element.querySelector('img[alt]')?.getAttribute('alt'));
      if (imageAlt && !/^image$/i.test(imageAlt)) return imageAlt;

      return '';
    };

    const formatFrom = text => {
      const patterns = [
        /\b\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|cl)\b/i,
        /\bal\s*kg\b/i,
        /\bal\s*litro\b/i,
        /\bconfezione\b/i
      ];
      return patterns.map(pattern => clean(text).match(pattern)?.[0] || '').find(Boolean) || '';
    };

    const unitPriceFrom = text => {
      const match = clean(text).match(/(\d{1,3}[.,]\d{2})\s*€\s*\/\s*(?:kg|l|lt|100\s*g)/i);
      return match ? Number(match[1].replace(',', '.')) : null;
    };

    const selectors = [
      'article',
      '[data-testid*="product"]',
      '[data-test*="product"]',
      '[class*="product-grid"] > *',
      '[class*="product-card"]',
      '[class*="productCard"]',
      '[class*="offer-card"]',
      '[class*="offerCard"]',
      '[class*="promotion-card"]',
      '[class*="promotionCard"]'
    ];

    const candidates = [...new Set(selectors.flatMap(selector => [...document.querySelectorAll(selector)]))];
    const result = [];

    for (const element of candidates) {
      const text = clean(element.textContent);
      if (!text || text.length > 1800 || !text.includes('€')) continue;

      const title = titleFrom(element);
      const price = priceFrom(text);
      if (!title || !price) continue;

      const imageElement = element.querySelector('img');
      const image = imageElement?.currentSrc || imageElement?.src || '';
      const imageAlt = clean(imageElement?.getAttribute('alt'));
      const discount = clean(text.match(/-\s*\d{1,2}\s*%/)?.[0] || '');
      const link = element.closest('a[href]') || element.querySelector('a[href]');

      result.push({
        title,
        imageAlt,
        text,
        price,
        oldPrice: oldPriceFrom(element),
        unitPrice: unitPriceFrom(text),
        format: formatFrom(text),
        discount,
        image,
        sourceUrl: link?.href || location.href
      });
    }

    return result;
  });
}

export async function scanLidlOffers(store = {}) {
  const { chromium } = await import('playwright');
  const context = await resolveLidlFlyer(store);
  const browser = await chromium.launch({ headless: true });

  try {
    const browserContext = await browser.newContext({
      locale: 'it-IT',
      timezoneId: 'Europe/Rome',
      viewport: { width: 1440, height: 1100 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36'
    });
    const page = await browserContext.newPage();

    const offersUrl = await findOffersUrl(page);
    if (!offersUrl) {
      throw new Error('Lidl: pagina delle offerte settimanali non individuata');
    }

    await page.goto(offersUrl, { waitUntil: 'networkidle', timeout: 90000 });
    await dismissConsent(page);
    await expandOffers(page);

    const rawCards = await extractCards(page);
    const offers = uniqueOffers(
      rawCards
        .map((raw, index) =>
          normalizeOffer(raw, { ...context, offersUrl }, store, index)
        )
        .filter(Boolean)
    );

    console.log(`Lidl: pagina ${offersUrl}; ${rawCards.length} card candidate; ${offers.length} offerte valide`);

    if (!offers.length) {
      throw new Error(
        'Lidl: nessuna offerta estratta. Il sito potrebbe aver modificato il markup.'
      );
    }

    return offers;
  } finally {
    await browser.close();
  }
}

export const __test = {
  parseItalianPrice,
  parseDates,
  cleanTitle,
  titleIsUsable,
  normalizeOffer
};
