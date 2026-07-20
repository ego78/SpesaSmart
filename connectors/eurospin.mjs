import * as cheerio from "cheerio";
import {
  cleanText,
  parsePrice,
  uniqueOffers,
  fetchHtml
} from "./common.mjs";

const URL = "https://www.eurospin.it/promozioni/";

function getDates(text) {
  return text.match(
    /\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b/g
  ) || [];
}

function extractPrices(node, text) {
  /*
   * Esempio Eurospin:
   *
   * 1,19  0,83 €
   * 160 g / sgocc. 112 g - 7,42 €/kg
   *
   * Risultato desiderato:
   * price:     0.83
   * oldPrice:  1.19
   * unitPrice: 7.42
   */

  const unitPriceMatch = text.match(
    /(\d{1,4}[.,]\d{2})\s*€\s*\/\s*(kg|l|lt|litro|100\s*g)/i
  );

  const unitPrice = unitPriceMatch
    ? parsePrice(unitPriceMatch[1])
    : null;

  /*
   * Cerca un prezzo con € che NON sia seguito da /kg, /l ecc.
   * Questo dovrebbe essere il prezzo reale della confezione.
   */
  const normalPriceMatches = [
    ...text.matchAll(
      /(\d{1,4}[.,]\d{2})\s*€(?!\s*\/\s*(?:kg|l|lt|litro|100\s*g))/gi
    )
  ];

  const price = normalPriceMatches.length
    ? parsePrice(normalPriceMatches[0][1])
    : null;

  /*
   * Cerca prima il vecchio prezzo negli elementi barrati
   * o nelle classi che normalmente indicano il prezzo precedente.
   */
  const oldPriceText = cleanText(
    node
      .find(
        [
          "del",
          "s",
          "strike",
          ".old-price",
          ".price-old",
          ".previous-price",
          "[class*='old-price']",
          "[class*='oldPrice']",
          "[class*='previous-price']",
          "[class*='prezzo-vecchio']",
          "[class*='prezzo-originale']"
        ].join(",")
      )
      .first()
      .text()
  );

  let oldPrice = parsePrice(oldPriceText);

  /*
   * Se il vecchio prezzo non è dentro un elemento riconoscibile,
   * cerca l'ultimo numero presente prima del prezzo promozionale.
   */
  if (!oldPrice && normalPriceMatches.length) {
    const currentMatch = normalPriceMatches[0];
    const textBeforeCurrentPrice = text.slice(0, currentMatch.index);

    const precedingNumbers = [
      ...textBeforeCurrentPrice.matchAll(
        /(?:^|\s)(\d{1,3}[.,]\d{2})(?=\s|$)/g
      )
    ];

    if (precedingNumbers.length) {
      oldPrice = parsePrice(
        precedingNumbers[precedingNumbers.length - 1][1]
      );
    }
  }

  /*
   * Evita che il prezzo al kg venga utilizzato come vecchio prezzo.
   */
  if (oldPrice === unitPrice) {
    oldPrice = null;
  }

  return {
    price,
    oldPrice,
    unitPrice
  };
}

export async function scanEurospin() {
  const html = await fetchHtml(URL);
  const $ = cheerio.load(html);
  const offers = [];

  const selectors = [
    "article",
    ".product",
    ".promotion",
    ".promozione",
    ".card",
    "[class*='product']",
    "[class*='promo']"
  ].join(",");

  $(selectors).each((_, element) => {
    const node = $(element);
    const text = cleanText(node.text());

    if (
      !text ||
      text.length > 1500 ||
      !text.includes("€")
    ) {
      return;
    }

    const title = cleanText(
      node
        .find(
          [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            ".title",
            "[class*='title']",
            "[class*='name']"
          ].join(",")
        )
        .first()
        .text()
    );

    if (!title) {
      return;
    }

    const brand = cleanText(
      node
        .find(
          [
            ".brand",
            "[class*='brand']",
            "[class*='marchio']"
          ].join(",")
        )
        .first()
        .text()
    );

    const format = cleanText(
      node
        .find(
          [
            ".format",
            "[class*='format']",
            "[class*='weight']",
            "[class*='peso']"
          ].join(",")
        )
        .first()
        .text()
    );

    const {
      price,
      oldPrice,
      unitPrice
    } = extractPrices(node, text);

    if (!price) {
      return;
    }

    const dates = getDates(text);

    offers.push({
      product: title,
      brand,
      store: "Eurospin",
      format,
      price,
      oldPrice,
      unitPrice,
      validFrom: dates[0] || "",
      validUntil: dates[1] || "",
      sourceUrl: URL,
      source: "official"
    });
  });

  return uniqueOffers(offers);
}
