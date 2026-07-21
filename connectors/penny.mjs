const PENNY_API =
  "https://www.penny.it/api/product-discovery/categories/" +
  "tutte-le-offerte-99000000/products";

const PENNY_PAGE =
  "https://www.penny.it/categorie/tutte-le-offerte-99000000";

/**
 * PENNY restituisce i prezzi in centesimi.
 * Esempio: 199 = 1,99 euro.
 */
function centsToEuro(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number / 100;
}

function buildFormat(product) {
  const description =
    typeof product.descriptionShort === "string"
      ? product.descriptionShort.trim()
      : "";

  if (description) {
    return description;
  }

  const amount = Number(product.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  const unit =
    product.volumeLabelShort ||
    product.price?.baseUnitShort ||
    "";

  return `${String(product.amount).replace(".", ",")} ${unit}`.trim();
}

function getPriceData(product) {
  const price = product.price || {};

  const regularPrice = centsToEuro(price.regular?.value);
  const loyaltyPrice = centsToEuro(price.loyalty?.value);

  const oldPrice = centsToEuro(
    price.crossed ?? price.standard?.value
  );

  const regularUnitPrice = centsToEuro(
    price.regular?.perStandardizedQuantity
  );

  const loyaltyUnitPrice = centsToEuro(
    price.loyalty?.perStandardizedQuantity
  );

  if (loyaltyPrice !== null) {
    return {
      currentPrice: loyaltyPrice,
      regularPrice,
      oldPrice:
        oldPrice !== null
          ? oldPrice
          : regularPrice,
      unitPrice:
        loyaltyUnitPrice !== null
          ? loyaltyUnitPrice
          : regularUnitPrice,
      requiresLoyaltyCard: true
    };
  }

  return {
    currentPrice: regularPrice,
    regularPrice,
    oldPrice,
    unitPrice: regularUnitPrice,
    requiresLoyaltyCard: false
  };
}

function mapProduct(product) {
  const name =
    typeof product.name === "string"
      ? product.name.trim()
      : "";

  if (!name) {
    return null;
  }

  const {
    currentPrice,
    regularPrice,
    oldPrice,
    unitPrice,
    requiresLoyaltyCard
  } = getPriceData(product);

  if (currentPrice === null) {
    console.log(
      `PENNY scartato senza prezzo: ${name}`
    );

    return null;
  }

  const brand =
    typeof product.brand?.name === "string"
      ? product.brand.name.trim()
      : "";

  return {
    product: name,
    brand,
    store: "PENNY",

    format: buildFormat(product),

    price: currentPrice,
    regularPrice,
    oldPrice,
    unitPrice,

    unit:
      product.price?.baseUnitShort ||
      product.volumeLabelShort ||
      "",

    validFrom:
      product.price?.validityStart || "",

    validUntil:
      product.price?.validityEnd || "",

    image:
      Array.isArray(product.images)
        ? product.images[0] || ""
        : "",

    category: product.category || "",

    sku: product.sku || "",
    productId: product.productId || "",

    requiresLoyaltyCard,

    sourceUrl: PENNY_PAGE,
    source: "official-api"
  };
}

/**
 * Non impostiamo limit o count.
 * L'API PENNY restituisce normalmente 20 risultati per pagina.
 */
async function fetchPennyPage(offset) {
  const url = new URL(PENNY_API);

  url.searchParams.set("offset", String(offset));

  console.log(
    `PENNY richiesta pagina: ${url.toString()}`
  );

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (compatible; SpesaSmart/1.0)"
    }
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Errore API PENNY: HTTP ${response.status} - ` +
      text.slice(0, 300)
    );
  }

  const data = await response.json();

  const received = Array.isArray(data.results)
    ? data.results.length
    : 0;

  console.log(
    `PENNY risposta: offset=${offset}, ` +
    `ricevuti=${received}, ` +
    `count=${data.count ?? "n/d"}, ` +
    `totale=${data.total ?? "n/d"}`
  );

  return data;
}

export async function scanPenny() {
  const offers = [];
  const seenPages = new Set();

  let offset = 0;
  let total = null;
  let pageNumber = 1;

  while (total === null || offset < total) {
    console.log(
      `PENNY: scarico pagina ${pageNumber}, offset ${offset}`
    );

    const data = await fetchPennyPage(offset);

    const products = Array.isArray(data.results)
      ? data.results
      : [];

    const apiTotal = Number(data.total);

    if (Number.isFinite(apiTotal)) {
      total = apiTotal;
    }

    if (products.length === 0) {
      console.log(
        `PENNY: pagina vuota all'offset ${offset}`
      );

      break;
    }

    const pageSignature = products
      .map(product =>
        product.sku ||
        product.productId ||
        product.name ||
        ""
      )
      .join("|");

    if (seenPages.has(pageSignature)) {
      console.warn(
        `PENNY: pagina duplicata all'offset ${offset}. ` +
        "Interrompo per evitare un ciclo infinito."
      );

      break;
    }

    seenPages.add(pageSignature);

    for (const product of products) {
      const productName =
        typeof product.name === "string"
          ? product.name
          : "";

      console.log(
        `PENNY prodotto API: ${productName}`
      );

      if (productName.toLowerCase().includes("tonno")) {
        console.log(
          "========== TONNO TROVATO NELLE API PENNY =========="
        );

        console.log(
          JSON.stringify(
            {
              name: product.name,
              brand: product.brand?.name || "",
              sku: product.sku || "",
              price: product.price || {}
            },
            null,
            2
          )
        );
      }

      const offer = mapProduct(product);

      if (offer) {
        offers.push(offer);
      }
    }

    /*
     * PENNY indica count=20, ma è più affidabile
     * avanzare usando il numero reale di risultati ricevuti.
     */
    offset += products.length;
    pageNumber += 1;
  }

  const uniqueOffers = new Map();

  for (const offer of offers) {
    const key =
      offer.sku ||
      offer.productId ||
      [
        offer.product,
        offer.brand,
        offer.format,
        offer.price
      ].join("|");

    uniqueOffers.set(key, offer);
  }

  const finalOffers = [...uniqueOffers.values()];

  const tunaOffers = finalOffers.filter(offer =>
    `${offer.product} ${offer.brand}`
      .toLowerCase()
      .includes("tonno")
  );

  console.log(
    `PENNY: ${finalOffers.length} offerte totali lette`
  );

  console.log(
    `PENNY: ${tunaOffers.length} offerte di tonno trovate`
  );

  if (tunaOffers.length > 0) {
    console.log(
      "PENNY TONNO DOPO LA CONVERSIONE:",
      JSON.stringify(tunaOffers, null, 2)
    );
  }

  return finalOffers;
}