# Lidl v6.0 — scoperta dalla pagina Volantini e Riviste

Il connettore usa come sorgente primaria:

`https://www.lidl.it/c/volantino-lidl/s10018048`

## Cosa include

- Volantini settimanali
- Volantini speciali

## Cosa esclude

- Lidl Viaggi
- pubblicazioni riconosciute come vacanze, tour, hotel, villaggi, crociere, voli o travel

## Strategia di scoperta

1. legge card, link, iframe e risorse presenti nella pagina;
2. prova ad aprire le card senza link diretto, incluso il Volantino settimanale;
3. intercetta le risposte `leaflets.schwarz` prodotte dalla pagina;
4. ricostruisce l’URL del viewer anche quando l’API espone soltanto `flyer_identifier`;
5. usa il vecchio widget esclusivamente come fallback per non perdere i volantini speciali;
6. scarica e analizza il PDF di ogni volantino scoperto;
7. unisce e deduplica le offerte.

## File diagnostici

Nell’artefatto `lidl-pdf-debug-NUMERO` vengono creati:

- `cards.json`: card individuate nella pagina;
- `flyers.json`: volantini finali inclusi;
- `flyer-discovery.json`: conteggi per ogni metodo di scoperta;
- `flyers-summary.json`: risultato dell’elaborazione dei PDF;
- `pdf-extraction-XX.json`: testo e offerte di ogni PDF;
- `report.json` e `report.txt`: riepilogo generale.

La proprietà `pdfBytes` ora viene salvata prima che PDF.js possa trasferire il buffer, evitando il precedente valore errato pari a zero.
