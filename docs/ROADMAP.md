# Roadmap di sviluppo

## Principio

Le versioni seguenti devono aumentare l'utilità della spesa, non soltanto il numero di dati raccolti.

## v10.1 — Architettura e consolidamento

- documentazione tecnica unica;
- inventario dei moduli esistenti;
- eliminazione definitiva del codice legacy dopo verifica;
- schema dati versionato;
- fixture affidabili per prodotti e offerte;
- test per normalizzazione, matching e calcolo quantità.

**Criterio di uscita:** il comportamento v10 rimane invariato e i moduli critici hanno test ripetibili.

## v11 — Motore prezzi e formati ✅ implementato

- parser centralizzato di quantità e confezioni;
- prezzo al kg/litro/pezzo;
- multipack;
- costo della quantità richiesta;
- gestione del prodotto sfuso;
- avvisi sui dati incompleti.

**Criterio di uscita:** almeno il 90% di un set di offerte campione viene normalizzato correttamente.

## v12 — Matching affidabile

- tassonomia di categorie e sottocategorie;
- sinonimi;
- parole obbligatorie ed escluse;
- preferenze di marca e formato;
- spiegazione della corrispondenza;
- conferma manuale per match incerti.

**Criterio di uscita:** falsi positivi critici inferiori al 5% nel set di test.

## v13 — Ottimizzatore della spesa

- risparmio massimo;
- meno negozi;
- miglior compromesso;
- quantità e confezioni;
- prodotti mancanti;
- soglia minima per una tappa aggiuntiva;
- confronto tra soluzioni.

**Criterio di uscita:** i totali sono riproducibili e ogni assegnazione è spiegabile.

## v14 — Esperienza “Spesa in corso”

- lista per negozio;
- spunte;
- prezzo reale;
- sostituzioni;
- non trovato;
- subtotali;
- completamento e storico acquisto.

## v15 — Storico prezzi

- salvataggio osservazioni;
- minimo, media e ultimo prezzo;
- valutazione della convenienza;
- andamento per prodotto;
- offerte eccezionali.

## v16 — Dispensa

- giacenze;
- soglie;
- consumi;
- reinserimento automatico nella lista;
- aggiornamento dalla spesa completata.

## v17 — Famiglia evoluta

- inviti;
- ruoli;
- sincronizzazione rapida;
- registro delle modifiche;
- gestione conflitti.

## v18 — Scontrino e codice a barre

- scansione codice a barre;
- importazione scontrino;
- aggiornamento dispensa;
- storico prezzo personale;
- controllo differenza tra prezzo previsto e reale.

## v19 — Ricette e pianificazione

- ricette dalla dispensa;
- ingredienti mancanti;
- conversione ricetta → lista;
- quantità per numero di persone;
- preferenze alimentari.

## v20 — Prodotto pubblico

- backend dedicato;
- autenticazione;
- privacy e consenso;
- notifiche push;
- monitoraggio connettori;
- pannello amministrativo;
- beta controllata.

## Priorità immediata

La prossima implementazione di codice deve essere **v11: normalizzazione centralizzata di formati e prezzi**. Senza questa base, matching e ottimizzazione produrrebbero risultati apparentemente precisi ma economicamente sbagliati.
