# Contratto dei connettori

## 1. Scopo

Ogni connettore deve trasformare una fonte ufficiale in offerte normalizzabili senza dipendere dalla UI.

## 2. Interfaccia comune

Ogni connettore deve esportare metadati e una funzione di scansione coerente:

```js
export const connector = {
  id: 'lidl',
  chain: 'Lidl',
  version: '1.0.0',
  capabilities: {
    storeSpecific: false,
    structuredApi: false,
    pdf: true,
    images: true
  },
  async scan(context) {
    return {
      offers: [],
      flyers: [],
      diagnostics: {},
      warnings: []
    };
  }
};
```

## 3. Output minimo di un'offerta grezza

```json
{
  "sourceId": "stable-source-id",
  "chain": "Lidl",
  "title": "...",
  "price": 1.99,
  "formatText": "500 g",
  "validFrom": "2026-07-23",
  "validTo": "2026-07-29",
  "sourceUrl": "..."
}
```

La normalizzazione finale deve essere centralizzata, non replicata in modo divergente in ogni connettore.

## 4. Livelli di qualità

- **A — API strutturata:** prezzo, formato e prodotto da dati ufficiali.
- **B — HTML strutturato:** dati leggibili nel markup.
- **C — PDF con testo:** estrazione testuale e spaziale.
- **D — OCR/AI:** fallback, sempre con confidenza e diagnostica.

La UI deve poter mostrare la qualità della fonte quando necessario.

## 5. Diagnostica

In esecuzione normale:

- riepilogo con conteggi;
- durata;
- errori e avvisi;
- file piccoli.

In modalità debug:

- HTML;
- screenshot;
- rete;
- estrazione PDF completa;
- risposte API rilevanti.

## 6. Regole di stabilità

- Nessun connettore deve interrompere l'intera scansione se una catena fallisce.
- Gli errori devono essere raccolti con `Promise.allSettled` o equivalente.
- Prima di pubblicare le offerte va eseguita la validazione dello schema.
- Un calo anomalo del numero di offerte deve generare un avviso e non sovrascrivere automaticamente dati buoni senza controllo.
- I duplicati devono essere eliminati tramite identificatori stabili e non soltanto tramite titolo.

## 7. Aggiunta di una nuova catena

Checklist:

1. confermare la fonte ufficiale;
2. verificare condizioni d'uso e stabilità tecnica;
3. identificare se la validità è nazionale o locale;
4. creare fixture di test;
5. implementare il connettore;
6. normalizzare almeno 20 offerte campione;
7. testare date, prezzi, formati e duplicati;
8. aggiungere il connettore al registry;
9. abilitare la catena soltanto dopo un'esecuzione di prova valida.
