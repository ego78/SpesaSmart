export async function syncProductToGoogle(product, settings) {
  if (!settings.appsScriptUrl) return { skipped: true };

  const response = await fetch(settings.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "upsertProduct",
      familyCode: settings.familyCode || "default",
      product
    })
  });

  if (!response.ok) throw new Error("Sincronizzazione non riuscita");
  return response.json();
}

export async function deleteProductFromGoogle(productId, settings) {
  if (!settings.appsScriptUrl) return { skipped: true };

  const response = await fetch(settings.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "deleteProduct",
      familyCode: settings.familyCode || "default",
      productId
    })
  });

  if (!response.ok) throw new Error("Eliminazione remota non riuscita");
  return response.json();
}

export async function loadOffers() {
  const response = await fetch(`data/offerte.json?t=${Date.now()}`, {
    cache: "no-store"
  });

  if (!response.ok) throw new Error("Impossibile leggere le offerte");
  return response.json();
}
