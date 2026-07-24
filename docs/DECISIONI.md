# Decisioni architetturali

## Approvate

### ADR-001 — PWA locale prima del backend

L'app deve rimanere utilizzabile senza account e senza connessione per le funzioni essenziali.

### ADR-002 — Offerte separate dai dati personali

Le offerte sono dati condivisi e pubblicabili; lista, dispensa e cronologia personale sono dati privati.

### ADR-003 — Connettori indipendenti

Ogni catena deve poter fallire o essere aggiornata senza bloccare le altre.

### ADR-004 — Normalizzazione centralizzata

Prezzi, formati e quantità devono essere interpretati da un modulo comune. I connettori forniscono dati grezzi e metadati della fonte.

### ADR-005 — Matching spiegabile

L'app non deve nascondere una corrispondenza incerta. Deve mostrare motivazioni e avvisi.

### ADR-006 — Ottimizzazione multi-obiettivo

Non esiste una sola “spesa migliore”: prezzo, distanza e numero di negozi devono produrre soluzioni alternative.

### ADR-007 — Apps Script come soluzione personale, non backend definitivo

Google Apps Script resta valido per l'uso familiare attuale. Un prodotto pubblico richiederà autenticazione e database dedicati.

## Da decidere

### Backend pubblico

Candidati:

- Supabase;
- Firebase;
- backend Node.js personalizzato.

La scelta deve essere presa soltanto prima della fase famiglia pubblica, non adesso.

### Mappe e distanze

Da definire:

- distanza in linea d'aria o percorso stradale;
- costo chilometrico configurabile;
- privacy della posizione;
- cache dei punti vendita.

### Assistente AI

L'AI deve essere un livello opzionale. Le funzioni economiche fondamentali devono rimanere deterministiche e verificabili.
