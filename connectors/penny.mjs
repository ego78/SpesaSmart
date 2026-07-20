const PENNY_API =
  "https://www.penny.it/api/product-discovery/categories/" +
  "tutte-le-offerte-99000000/products";

const PENNY_PAGE =
  "https://www.penny.it/categorie/tutte-le-offerte-99000000";

/*
 * Usiamo un limite alto per provare a ricevere tutte le offerte
 * PENNY in una sola richiesta.
 */
const PAGE_SIZE = 100;

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
  if (
    typeof product.descriptionShort === "string" &&
    product.descriptionShort.trim()
  ) {
    return product.descriptionShort.trim();
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

  const regularPrice = centsToEuro(
    price.regular?.value
  );

  const loyaltyPrice = centsToEuro(
    price.loyalty?.value
  );

  const oldPrice = centsToEuro(
    price.crossed ?? price.standard?.value
  );

  const regularUnitPrice = centsToEuro(
    price.regular?.perStandardizedQuantity
  );

  const loyaltyUnitPrice = centsToEuro(
    price.loyalty?.perStandardizedQuantity
  );

  /*
   * Se è presente un prezzo PENNYCard, lo salviamo
   * come prezzo principale dell'offerta.
   */
  if (loyaltyPrice !== null) {
    return {
      currentPrice: loyaltyPrice,
      regularPrice,
      oldPrice,
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
  const {
    currentPrice,
    regularPrice,
    oldPrice,
    unitPrice,
    requiresLoyaltyCard
  } = getPriceData(product);

  if (currentPrice === null) {
    return null;
  }

  const name =
    typeof product.name === "string"
      ? product.name.trim()
      : "";

  const brand =
    typeof product.brand?.name === "string"
      ? product.brand.name.trim()
      : "";

  if (!name) {
    return null;
  }

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

    category:
      product.category || "",

    sku:
      product.sku || "",

    productId:
      product.productId || "",

    requiresLoyaltyCard,

    sourceUrl: PENNY_PAGE,
    source: "official-api"
  };
}

async function fetchPennyPage(offset = 0) {
  const url = new URL(PENNY_API);

  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("sortBy", "price");
  url.searchParams.set("sortOrder", "asc");

  console.log(`PENNY richiesta: ${url.toString()}`);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (compatible; SpesaSmart/1.0)"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Errore API PENNY: HTTP ${response.status} - ` +
      errorText.slice(0, 300)
    );
  }

  const data = await response.json();

  console.log(
    `PENNY risposta: ` +
    `offset=${data.offset ?? offset}, ` +
    `ricevuti=${data.count ?? data.results?.length ?? 0}, ` +
    `totale=${data.total ?? "sconosciuto"}`
  );

  return data;
}

export async function scanPenny() {
  const offers = [];
  const seenPages = new Set();

  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const data = await fetchPennyPage(offset);

    const products = Array.isArray(data.results)
      ? data.results
      : [];

    const parsedTotal = Number(data.total);

    if (Number.isFinite(parsedTotal)) {
      total = parsedTotal;
    } else {
      total = offset + products.length;
    }

    if (products.length === 0) {
      console.log(
        `PENNY: nessun prodotto ricevuto all'offset ${offset}`
      );
      break;
    }

    /*
     * Evita cicli infiniti se PENNY restituisce due volte
     * la stessa pagina.
     */
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
        `PENNY: pagina ripetuta all'offset ${offset}. ` +
        "Scansione interrotta."
      );
      break;
    }

    seenPages.add(pageSignature);

    for (const product of products) {
      const offer = mapProduct(product);

      if (offer) {
        offers.push(offer);
      }
    }

    offset += products.length;
  }

  /*
   * Elimina eventuali prodotti duplicati.
   */
  const unique = new Map();

  for (const offer of offers) {
    const key =
      offer.sku ||
      offer.productId ||
      `${offer.product}-${offer.brand}-${offer.price}`;

    unique.set(key, offer);
  }

  const finalOffers = [...unique.values()];

  console.log(
    `PENNY: ${finalOffers.length} offerte lette dall'API ufficiale`
  );

  return finalOffers;
}