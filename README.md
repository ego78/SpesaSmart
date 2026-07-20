# Spesa Smart — GitHub Pages + Google Fogli

Web app statica che consente di aggiungere prodotti da telefono. I prodotti vengono salvati in un Foglio Google attraverso Apps Script. GitHub Actions legge il foglio due volte al giorno, cerca le offerte e aggiorna `data/offerte.json`.

## 1. Crea il Foglio Google
1. Crea un nuovo Foglio Google e chiamalo **Spesa Smart**.
2. Apri **Estensioni → Apps Script**.
3. Cancella il contenuto di `Code.gs` e incolla tutto il file `google-apps-script/Code.gs`.
4. In Apps Script apri **Impostazioni progetto → Proprietà script → Aggiungi proprietà**.
5. Nome: `FAMILY_CODE`; valore: un codice scelto da te, ad esempio una password lunga.
6. Premi **Distribuisci → Nuova distribuzione → Applicazione web**.
7. Esegui come: **Me**. Chi ha accesso: **Chiunque**.
8. Autorizza lo script e copia l'URL che termina con `/exec`.

> Il codice famiglia protegge le operazioni, ma l'app è pensata per uso familiare e non per dati sensibili.

## 2. Configura la web app
Apri `config.js` e sostituisci:

```js
APPS_SCRIPT_URL: "INSERISCI_URL_APPS_SCRIPT"
```

con l'URL `/exec` copiato al punto precedente. Non inserire il codice famiglia nel file: verrà digitato nell'app e salvato solo sul dispositivo.

## 3. Carica su GitHub
1. Crea un repository chiamato `spesa-smart`.
2. Carica il contenuto di questa cartella nella radice del repository.
3. Assicurati che il branch principale si chiami `main`.
4. Apri **Settings → Pages**.
5. In **Build and deployment**, scegli **GitHub Actions**.
6. Il workflow `Pubblica GitHub Pages` creerà l'indirizzo della web app.

## 4. Configura i secret di GitHub Actions
Apri **Settings → Secrets and variables → Actions → New repository secret** e crea:

- `APPS_SCRIPT_URL`: URL Apps Script che termina con `/exec`.
- `APPS_SCRIPT_CODE`: lo stesso valore impostato come `FAMILY_CODE`.
- `BRAVE_SEARCH_API_KEY`: facoltativo ma necessario per la ricerca automatica tramite Brave Search API.

## 5. Prima prova
1. Apri la web app GitHub Pages.
2. Premi l'ingranaggio e inserisci codice famiglia e zona.
3. Apri **Aggiungi**, inserisci un prodotto e salvalo.
4. Controlla il Foglio Google: sarà stata aggiunta una riga.
5. Su GitHub apri **Actions → Cerca offerte → Run workflow**.
6. Al termine aggiorna la web app.

## 6. Scansione automatica
Il file `.github/workflows/scan-offers.yml` esegue la scansione alle 05:15 e 17:15 UTC, cioè normalmente 07:15 e 19:15 in Italia durante l'ora legale.

## Limite dei dati sulle offerte
La struttura è funzionante, ma la completezza dipende dalla fonte usata. Brave Search trova pagine pubbliche e volantini indicizzati; non garantisce tutte le offerte locali né prezzi sempre strutturati. In futuro si possono aggiungere connettori autorizzati per singole catene senza cambiare l'app.
