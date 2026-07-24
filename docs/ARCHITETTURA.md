# Architettura di Spesa Smart

## 1. Obiettivo del prodotto

Spesa Smart deve trasformare una lista familiare in un piano di acquisto concreto:

- cosa comprare;
- in quale supermercato;
- quante confezioni servono;
- quale prezzo unitario è realmente più conveniente;
- quanto si spenderà;
- quanto si risparmierà;
- se una tappa aggiuntiva è economicamente utile.

La raccolta delle offerte è un'infrastruttura del prodotto, non l'interfaccia principale.

## 2. Architettura attuale

Il progetto è composto da quattro parti:

1. **PWA statica** pubblicabile su GitHub Pages;
2. **connettori Node.js** eseguiti da GitHub Actions;
3. **file JSON versionati** usati come archivio delle offerte;
4. **Google Apps Script opzionale** per sincronizzare i dati familiari.

### Flusso attuale

```text
Fonti ufficiali supermercati
        ↓
Connettori Node.js
        ↓
data/offerte.json + storico
        ↓
GitHub Pages / PWA
        ↓
Browser dell'utente
        ↕
Google Apps Script (opzionale)
```

## 3. Architettura di destinazione

Il codice dovrà essere suddiviso in moduli con responsabilità chiare.

```text
CORE
├── Lista della spesa
├── Motore di matching
├── Normalizzazione prezzi e formati
├── Ottimizzatore della spesa
├── Storico prezzi
├── Dispensa
├── Famiglia e sincronizzazione
├── Ricette e assistente AI
└── Telemetria e qualità dati

INGESTIONE
├── Registry connettori
├── Lidl
├── PENNY
├── Eurospin
└── nuove catene

PRESENTAZIONE
├── Home
├── Lista
├── Piano di acquisto
├── Spesa in corso
├── Offerte
├── Dispensa
└── Impostazioni
```

## 4. Moduli principali

### 4.1 Lista della spesa

Responsabilità:

- prodotti richiesti;
- quantità e unità;
- priorità;
- preferenze di marca e formato;
- stato acquistato/non acquistato;
- note;
- ricorrenza.

Non deve conoscere il funzionamento interno dei connettori.

### 4.2 Normalizzazione

Converte i dati grezzi in un formato confrontabile:

- `500 g` → `0.5 kg`;
- `6 x 1 L` → `6 litri`;
- `3 pezzi da 80 g` → `0.24 kg`;
- prezzo al kg/litro/pezzo;
- numero di confezioni necessario per soddisfare la quantità richiesta.

### 4.3 Motore di matching

Associa una voce della lista alle offerte.

Deve considerare:

- categoria e sottocategoria;
- sinonimi;
- marca richiesta;
- parole obbligatorie;
- parole escluse;
- formato e unità;
- soglia minima di confidenza.

Ogni corrispondenza deve poter essere spiegata e verificata dall'utente.

### 4.4 Ottimizzatore

Produce almeno tre soluzioni:

- **Risparmio massimo**;
- **Meno negozi**;
- **Miglior compromesso**.

Fattori:

- costo dei prodotti;
- quantità necessarie;
- numero di negozi;
- distanza;
- costo stimato del tragitto;
- prodotti mancanti;
- risparmio minimo che giustifica una tappa.

### 4.5 Spesa in corso

Interfaccia operativa da usare nel negozio:

- raggruppamento per supermercato;
- articoli da spuntare;
- quantità e confezioni;
- prezzo previsto;
- prezzo reale opzionale;
- alternativa scelta;
- prodotto non trovato;
- subtotale aggiornato.

### 4.6 Storico prezzi

Conserva osservazioni normalizzate per prodotto e catena:

- prezzo osservato;
- prezzo unitario;
- formato;
- periodo di validità;
- fonte;
- qualità del dato.

Serve a classificare un prezzo come eccezionale, buono o normale.

### 4.7 Dispensa

Modulo successivo alla stabilizzazione dell'ottimizzatore:

- quantità disponibile;
- soglia minima;
- consumo medio;
- scadenza opzionale;
- aggiunta automatica alla lista;
- aggiornamento da spesa completata o scontrino.

### 4.8 Famiglia

Nella versione personale può continuare a usare Apps Script.
Per una versione pubblica dovrà migrare verso un backend con:

- autenticazione;
- inviti;
- ruoli;
- sincronizzazione quasi in tempo reale;
- regole di sicurezza;
- audit delle modifiche.

## 5. Confini tecnici

### Frontend

- HTML, CSS e moduli JavaScript;
- PWA installabile;
- funzionamento locale anche senza backend;
- dati utente salvati prima localmente;
- sincronizzazione come livello aggiuntivo.

### Pipeline offerte

- Node.js;
- GitHub Actions;
- connettori indipendenti;
- output validato prima del commit;
- diagnostica completa solo in caso di errore o modalità debug.

### Persistenza

Fase attuale:

- `localStorage` per dati utente;
- JSON GitHub per offerte;
- Google Sheets per sincronizzazione opzionale.

Fase pubblica:

- database relazionale per utenti, famiglie, liste, dispensa e storico personale;
- archivio centralizzato delle offerte;
- cache e code di elaborazione per i connettori.

## 6. Regole di dipendenza

- La UI non deve importare direttamente codice dei connettori.
- I connettori non devono conoscere `localStorage` o Google Apps Script.
- Il matching deve ricevere dati normalizzati.
- L'ottimizzatore deve ricevere candidati già validati dal matching.
- Lo storico non deve modificare le offerte correnti.
- Ogni modulo deve restituire errori strutturati e non soltanto messaggi testuali.

## 7. Struttura cartelle proposta

```text
assets/
  js/
    core/
      list.js
      normalization.js
      matching.js
      optimizer.js
      history.js
      pantry.js
    services/
      offers-service.js
      sync-service.js
      storage-service.js
    ui/
      home-view.js
      list-view.js
      plan-view.js
      shopping-view.js
      offers-view.js
    app.js
connectors/
  registry.mjs
  shared/
  lidl/
  penny/
  eurospin/
data/
  catalogo.json
  offerte.json
  storico-offerte.json
  schema-version.json
docs/
tests/
  unit/
  fixtures/
  integration/
```

La riorganizzazione deve essere graduale: prima si aggiungono test, poi si spostano i moduli senza cambiare il comportamento.

## 8. Strategia offline

L'app deve continuare a permettere:

- consultazione dell'ultima lista;
- spunta degli articoli;
- visualizzazione dell'ultimo piano;
- inserimento di nuove voci;
- registrazione locale delle modifiche.

Quando torna la connessione, le modifiche vengono sincronizzate con una politica esplicita di risoluzione dei conflitti.
