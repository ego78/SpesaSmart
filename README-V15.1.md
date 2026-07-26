# Spesa Smart v15.1 — OCR scontrini

- Riconoscimento OCR avviato esclusivamente dal pulsante **Analizza scontrino**.
- Tesseract.js viene caricato da CDN solo al primo utilizzo: nessun peso aggiuntivo all'avvio dell'app.
- Pre-elaborazione locale della foto per migliorare contrasto e leggibilità.
- Riconoscimento preliminare di supermercato, data, descrizioni, quantità e prezzi.
- Le righe riconosciute vengono sempre mostrate come bozza modificabile prima del salvataggio.
- Il testo OCR può essere aperto per controllare eventuali errori.
- La foto e il testo riconosciuto non vengono salvati.

Nota: l'OCR richiede una connessione internet al primo utilizzo per scaricare il motore e il modello italiano.
