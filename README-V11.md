# Spesa Smart v11.0 — Smart Price Engine

La v11 centralizza la normalizzazione di quantità, formati e prezzi nel modulo:

```text
assets/js/smart-price.js
```

## Funzioni introdotte

- riconoscimento di formati singoli: `500 g`, `1,5 kg`, `750 ml`, `2 L`;
- riconoscimento multipack: `4x125 g`, `2 confezioni da 1 L`, `6 bottiglie da 330 ml`;
- riconoscimento unità a pezzo: rotoli, capsule, lavaggi, fogli, sacchetti e simili;
- conversione automatica in kg, litri o pezzi;
- prezzo normalizzato al kg, litro o pezzo;
- calcolo delle confezioni necessarie per la quantità richiesta;
- costo reale della lista, quantità coperta ed eventuale eccedenza;
- preferenza per offerte con unità compatibili;
- segnalazione dei dati incompleti o non confrontabili.

## Esempi

- Pasta da 500 g a 0,89 € → `1,78 €/kg`.
- Pasta da 1 kg a 1,49 € → `1,49 €/kg`.
- Richiesta di 2 kg: la seconda offerta costa 2,98 €, la prima 3,56 €.
- Latte da 1 L a 0,89 €, richiesta 3 L → 3 confezioni, totale 2,67 €.
- Carta igienica da 12 rotoli, richiesta 18 rotoli → 2 confezioni, 24 rotoli coperti.

## Test

```bash
npm test
npm run test:price
```

Il test dedicato verifica formati singoli, multipack, pezzi, prezzi unitari, quantità richieste, eccedenze e confronto tra confezioni.

## Compatibilità

Il modulo mantiene gli alias usati dalla v10 (`calculatedUnitPrice`, `calculatedUnitLabel` e `_format`), quindi l'interfaccia esistente continua a funzionare senza migrazione dei dati locali.
