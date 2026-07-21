async function fetchPennyPage(offset, pageNumber) {
  const url = new URL(PENNY_API);

  /*
   * Utilizziamo sia offset sia page:
   * - offset: 0, 20, 40
   * - page:   1, 2, 3
   *
   * In questo modo la richiesta funziona anche se PENNY
   * considera principalmente il numero della pagina.
   */
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("page", String(pageNumber));
  url.searchParams.set("limit", "20");

  /*
   * Ordinamento stabile, uguale per tutte le pagine.
   * Evita prodotti duplicati o saltati tra una richiesta e l'altra.
   */
  url.searchParams.set("sortBy", "price");
  url.searchParams.set("sortOrder", "asc");

  console.log(`PENNY richiesta pagina: ${url.toString()}`);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; SpesaSmart/1.0)"
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

  const products = Array.isArray(data.results)
    ? data.results
    : [];

  console.log(
    `PENNY risposta: ` +
    `pagina richiesta=${pageNumber}, ` +
    `offset richiesto=${offset}, ` +
    `offset risposta=${data.offset ?? "n/d"}, ` +
    `ricevuti=${products.length}, ` +
    `totale=${data.total ?? "n/d"}`
  );

  if (products.length > 0) {
    console.log(
      `PENNY pagina ${pageNumber}: ` +
      `${products[0].name} → ${products.at(-1).name}`
    );
  }

  return data;
}