# Test e rilasci

## 1. Livelli di test

### Test unitari

Coprono funzioni pure:

- parsing prezzi;
- parsing quantità;
- conversione unità;
- prezzo unitario;
- numero confezioni;
- matching;
- deduplicazione;
- calcolo totali.

### Test con fixture

Usano copie ridotte e stabili di:

- offerte Lidl;
- offerte PENNY;
- offerte Eurospin;
- casi difficili di formato;
- prodotti con nomi ambigui.

### Test di integrazione

Verificano:

- output dei connettori;
- generazione di `data/offerte.json`;
- compatibilità con la PWA;
- sincronizzazione Apps Script;
- migrazioni dati.

### Smoke test UI

Percorso minimo:

1. aprire l'app;
2. aggiungere un prodotto;
3. modificare quantità;
4. generare il piano;
5. avviare la spesa;
6. spuntare il prodotto;
7. ricaricare la pagina e verificare la persistenza.

## 2. Qualità dei dati

Prima di pubblicare una scansione:

- nessun prezzo negativo o nullo;
- date coerenti;
- catena valorizzata;
- titolo non vuoto;
- unità prezzo coerente;
- duplicati sotto soglia;
- numero offerte non anomalo rispetto all'ultima scansione;
- JSON valido rispetto allo schema.

## 3. Strategia di rilascio

- `main`: versione stabile pubblicata;
- branch di lavoro per ogni versione;
- pull request con riepilogo e checklist;
- tag `vX.Y.Z` per ogni rilascio;
- changelog sintetico orientato all'utente;
- backup automatico dei JSON prima della scansione.

## 4. Versionamento

- **major**: modifica incompatibile dei dati o dell'architettura;
- **minor**: nuova funzione compatibile;
- **patch**: correzione senza nuove funzioni.

## 5. Criteri per dichiarare una versione stabile

Una versione è stabile soltanto quando:

- tutti i test automatici passano;
- nessuna migrazione perde dati;
- il percorso principale funziona da smartphone;
- il service worker serve la versione corretta;
- il workflow offerte termina nei tempi previsti;
- i dati pubblicati superano i controlli di qualità;
- è disponibile una procedura di rollback.

## 6. Monitoraggio connettori

Il report di scansione dovrebbe includere per ogni catena:

- stato;
- durata;
- numero offerte;
- numero volantini;
- variazione rispetto alla scansione precedente;
- errori;
- versione del connettore;
- qualità media dei dati.
