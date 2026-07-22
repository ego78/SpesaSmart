# Spesa Smart

Web app pronta per GitHub Pages.

## Già funzionante
- aggiunta, modifica, duplicazione ed eliminazione prodotti;
- categorie, preferiti e prezzo massimo;
- ricerca e filtro;
- salvataggio automatico nel browser;
- esportazione backup JSON;
- lettura offerte da `data/offerte.json`;
- installazione PWA e uso offline;
- collegamento facoltativo a Google Fogli.

## Pubblicazione
1. Estrai lo ZIP.
2. Carica **tutti i file e le cartelle** nella radice del repository SpesaSmart, sostituendo i file già presenti.
3. Vai in **Settings → Pages**.
4. Scegli **Deploy from a branch**, branch `main`, cartella `/ (root)`.
5. Salva e attendi alcuni minuti.

## Google Fogli
1. Crea un Foglio Google.
2. Vai in **Estensioni → Apps Script**.
3. Incolla `google/Code.gs`.
4. Distribuisci come **Applicazione web**, eseguita da te e accessibile a chiunque abbia il link.
5. Copia l'URL e inseriscilo nelle impostazioni dell'app.

L'app funziona subito anche senza Google Fogli: i dati restano nel browser.

## Offerte
La prima versione contiene due offerte dimostrative. Puoi modificare `data/offerte.json`. La ricerca automatica reale richiede connettori specifici o fonti autorizzate.

## Versione 2.0.0 Alpha

Aggiunto il modulo **I miei supermercati**:
- ricerca dei negozi vicini tramite GPS e OpenStreetMap/Overpass;
- scelta della distanza massima;
- selezione e salvataggio locale;
- sincronizzazione della selezione tramite Apps Script e foglio `Supermercati`;
- filtro delle offerte in base alle catene selezionate;
- collegamento diretto a Google Maps.

Dopo aver sostituito `google/Code.gs`, creare una **nuova distribuzione** della Web App Apps Script.


## Versione 2.0.2

- associa ogni offerta ai punti vendita selezionati della stessa catena;
- mostra il negozio selezionato più vicino, indirizzo e distanza;
- distingue chiaramente le offerte di catena dalla validità locale verificata;
- non dichiara locale un'offerta finché il connector non dispone di una fonte ufficiale specifica del punto vendita.


## Versione 2.0.6
Aggiunto il piano intelligente che assegna ogni prodotto all'offerta più economica tra i supermercati selezionati, raggruppa gli acquisti per negozio e segnala i prodotti ancora da completare.
