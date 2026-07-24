export function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "";

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value));
}

export function renderProducts(container, products, handlers) {
  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Nessun prodotto inserito</h3>
        <p>Aggiungi gli alimenti e i prodotti che comprate più spesso.</p>
        <button id="emptyAddButton" class="primary-button" type="button">
          Aggiungi il primo prodotto
        </button>
      </div>
    `;

    container.querySelector("#emptyAddButton")
      ?.addEventListener("click", handlers.onAdd);
    return;
  }

  container.innerHTML = products.map(product => `
    <article class="product-card ${product.favorite ? "favorite" : ""}">
      <div class="product-card-top">
        <div>
          <h3 class="product-name">
            ${escapeHtml(product.name)} ${product.favorite ? "⭐" : ""}
          </h3>
          <p class="product-meta">
            ${[product.brand, product.format, product.category]
              .filter(Boolean)
              .map(escapeHtml)
              .join(" · ")}
          </p>
        </div>

        ${product.maximumPrice
          ? `<span class="price-badge">Sotto ${formatMoney(product.maximumPrice)}</span>`
          : `<span class="status-badge">Monitorato</span>`}
      </div>

      <div class="card-actions">
        <button class="text-button" data-action="duplicate" data-id="${product.id}" type="button">Duplica</button>
        <button class="text-button" data-action="edit" data-id="${product.id}" type="button">Modifica</button>
        <button class="text-button danger" data-action="delete" data-id="${product.id}" type="button">Elimina</button>
      </div>
    </article>
  `).join("");

  container.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
      handlers[button.dataset.action]?.(button.dataset.id);
    });
  });
}

export function renderOffers(container, offers, products) {
  const names = new Set(products.map(product => product.name.toLowerCase()));

  const relevant = offers.filter(offer =>
    !names.size ||
    [...names].some(name =>
      offer.product.toLowerCase().includes(name) ||
      name.includes(offer.product.toLowerCase())
    )
  );

  if (!relevant.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏷️</div>
        <h3>Nessuna offerta trovata</h3>
        <p>Le offerte compariranno qui quando il file <strong>data/offerte.json</strong> verrà aggiornato.</p>
      </div>
    `;
    return [];
  }

  container.innerHTML = relevant.map(offer => `
    <article class="offer-card">
      <div class="offer-card-top">
        <div>
          <h3 class="offer-name">${escapeHtml(offer.product)}</h3>
          <p class="offer-meta">
            ${escapeHtml(offer.store)}
            ${offer.format ? ` · ${escapeHtml(offer.format)}` : ""}
            <br>
            Valida fino al ${escapeHtml(offer.validUntil || "dato non disponibile")}
          </p>
        </div>

        <div>
          <div class="offer-price">${formatMoney(offer.price)}</div>
          ${offer.oldPrice
            ? `<div class="offer-old-price">${formatMoney(offer.oldPrice)}</div>`
            : ""}
        </div>
      </div>
    </article>
  `).join("");

  return relevant;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  })[character]);
}
