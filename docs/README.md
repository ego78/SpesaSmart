# Documentazione tecnica — Spesa Smart

Questa cartella descrive la struttura futura del progetto e deve essere aggiornata insieme al codice.

## Documenti

- [Architettura](ARCHITETTURA.md): moduli, flussi e responsabilità.
- [Modello dati](MODELLO-DATI.md): entità, campi e migrazioni.
- [Connettori](CONNETTORI.md): contratto comune per Lidl, PENNY, Eurospin e nuove catene.
- [Roadmap](ROADMAP.md): ordine di sviluppo dalla v10 alla versione pubblica.
- [Test e rilasci](TEST-E-RILASCI.md): controlli automatici, ambienti e criteri di qualità.
- [Decisioni architetturali](DECISIONI.md): scelte già approvate e aspetti ancora da decidere.

## Regola di progetto

Ogni nuova funzione deve dichiarare:

1. quali dati legge e modifica;
2. quale modulo ne è responsabile;
3. come viene testata;
4. se richiede una migrazione dei dati locali o di Google Apps Script;
5. come si comporta senza connessione.
