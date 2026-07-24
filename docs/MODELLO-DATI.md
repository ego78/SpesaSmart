# Modello dati

## 1. Versionamento

Ogni raccolta persistente deve contenere `schemaVersion`.
Le migrazioni devono essere idempotenti: eseguirle più volte non deve danneggiare i dati.

## 2. Voce della lista

```json
{
  "id": "uuid",
  "name": "Latte intero",
  "categoryId": "latte",
  "quantity": 6,
  "unit": "l",
  "priority": "required",
  "brandPreference": null,
  "allowAlternativeBrands": true,
  "allowAlternativeFormats": true,
  "maxUnitPrice": 1.1,
  "notes": "",
  "recurrence": null,
  "checked": false,
  "createdAt": "2026-07-24T08:00:00Z",
  "updatedAt": "2026-07-24T08:00:00Z"
}
```

## 3. Offerta normalizzata

```json
{
  "id": "source-stable-id",
  "chain": "Lidl",
  "storeId": null,
  "title": "Latte intero Milbona",
  "brand": "Milbona",
  "categoryId": "latte",
  "price": 0.89,
  "currency": "EUR",
  "package": {
    "count": 1,
    "quantityPerItem": 1,
    "unit": "l",
    "totalBaseQuantity": 1
  },
  "unitPrice": 0.89,
  "unitPriceUnit": "l",
  "validFrom": "2026-07-23",
  "validTo": "2026-07-29",
  "sourceUrl": "...",
  "sourcePage": 4,
  "imageUrl": null,
  "conditions": [],
  "quality": {
    "confidence": 0.94,
    "warnings": []
  },
  "observedAt": "2026-07-24T05:00:00Z"
}
```

## 4. Corrispondenza

```json
{
  "listItemId": "uuid",
  "offerId": "source-stable-id",
  "score": 0.91,
  "status": "exact",
  "reasons": [
    "categoria coincidente",
    "formato compatibile",
    "nessuna parola esclusa"
  ],
  "warnings": []
}
```

Valori consigliati per `status`:

- `exact`;
- `compatible`;
- `alternative`;
- `uncertain`;
- `rejected`.

## 5. Riga del piano

```json
{
  "listItemId": "uuid",
  "offerId": "source-stable-id",
  "storeKey": "lidl-sava",
  "packages": 6,
  "providedQuantity": 6,
  "requestedQuantity": 6,
  "estimatedCost": 5.34,
  "baselineCost": 6.6,
  "estimatedSaving": 1.26,
  "status": "planned"
}
```

## 6. Piano della spesa

```json
{
  "id": "uuid",
  "mode": "balanced",
  "createdAt": "2026-07-24T08:15:00Z",
  "stores": [],
  "lines": [],
  "missingItems": [],
  "totals": {
    "estimatedCost": 69.1,
    "baselineCost": 82.1,
    "saving": 13,
    "storeCount": 2,
    "estimatedDistanceKm": 7.4
  }
}
```

## 7. Osservazione storica

Lo storico non deve duplicare l'intero oggetto dell'offerta. Deve conservare i dati necessari al confronto:

```json
{
  "productKey": "latte-intero-1l",
  "chain": "Lidl",
  "price": 0.89,
  "unitPrice": 0.89,
  "unit": "l",
  "format": "1 L",
  "validFrom": "2026-07-23",
  "validTo": "2026-07-29",
  "observedAt": "2026-07-24T05:00:00Z",
  "offerId": "source-stable-id"
}
```

## 8. Dispensa

```json
{
  "id": "uuid",
  "productKey": "latte-intero",
  "name": "Latte intero",
  "quantity": 4,
  "unit": "l",
  "minimumQuantity": 2,
  "averageDailyUsage": 0.7,
  "expiresAt": null,
  "updatedAt": "2026-07-24T09:00:00Z"
}
```

## 9. Compatibilità con i dati attuali

Durante la migrazione:

- un prodotto senza quantità riceve `quantity: 1`;
- un prodotto senza unità riceve `unit: "pcs"`;
- `checked` viene inizializzato a `false`;
- i campi sconosciuti vengono conservati;
- nessun dato utente viene eliminato automaticamente.
