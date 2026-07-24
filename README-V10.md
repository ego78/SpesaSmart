# Spesa Smart v10.0 — Lista operativa

Questa versione trasforma i prodotti monitorati in una vera lista della spesa.

## Novità

- quantità richiesta e unità di misura per ogni prodotto;
- priorità, note e scelta delle alternative;
- aggiunta rapida di più prodotti separati da virgola;
- normalizzazione dei formati (kg, g, L, ml, pezzi e multipack);
- confronto basato sul costo della quantità richiesta, non solo sul prezzo della confezione;
- prezzo unitario calcolato e mostrato nelle offerte;
- piano intelligente con numero di confezioni necessarie;
- modalità “Spesa in corso” con articoli da spuntare;
- avanzamento della lista e salvataggio delle spunte;
- sincronizzazione dei nuovi campi tramite Google Apps Script;
- migrazione automatica dei prodotti locali dalla chiave v1 alla v2.

## Aggiornamento di Google Apps Script

Per sincronizzare quantità, unità, priorità, note e spunte, sostituire il contenuto della distribuzione Apps Script con `google/Code.gs` e creare una nuova versione della distribuzione. Il foglio `Prodotti` viene esteso automaticamente con le nuove colonne.

## Nota

Il pulsante “Ricarica offerte” rilegge `data/offerte.json`. La scansione dei volantini continua a essere eseguita dal workflow GitHub Actions.
