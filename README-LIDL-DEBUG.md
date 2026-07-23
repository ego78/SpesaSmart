# Spesa Smart v5.2.0 — Diagnostica Lidl

Questa versione continua a estrarre le offerte Lidl, ma salva anche tutto ciò
che serve per individuare la sorgente completa dei prodotti.

## Come scaricare la diagnostica

1. Apri **GitHub → Actions**.
2. Apri l'esecuzione appena terminata.
3. Scorri in fondo alla pagina.
4. Nella sezione **Artifacts**, scarica `lidl-debug-NUMERO`.

## Contenuto

- `report.txt`: riepilogo leggibile;
- `report.json`: riepilogo strutturato;
- `network.json`: tutte le richieste;
- `json-index.json`: indice delle risposte JSON;
- `responses/*.json`: risposte JSON complete;
- `page.html`: pagina finale;
- `final-page.png`: screenshot completo;
- `lidl-session.har`: archivio di rete;
- `console.json`: console del browser;
- `page-errors.json`: errori JavaScript;
- `failed-requests.json`: richieste fallite.

Invia direttamente lo ZIP scaricato dagli Artifacts.
