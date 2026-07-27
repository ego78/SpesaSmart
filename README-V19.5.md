# Spesa Smart v19.5 — Enterprise Foundation

Questa versione consolida l'architettura senza cambiare i flussi principali dell'app.

## Fondazioni introdotte

- store applicativo centrale con bridge compatibile verso i moduli esistenti;
- event bus per comunicazioni disaccoppiate;
- cache in memoria con TTL e `remember`;
- monitor delle prestazioni per avvio e rendering;
- logging differenziato tra sviluppo e produzione;
- servizio notifiche centralizzato;
- registro plugin per i supermercati;
- motore di regole configurabile;
- test automatici dedicati al core enterprise.

L'interfaccia e i dati locali della v18 restano compatibili. La migrazione è volutamente progressiva per evitare regressioni e mantenere la fluidità raggiunta.
