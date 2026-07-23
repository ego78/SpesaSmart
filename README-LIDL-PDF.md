# Spesa Smart v5.5.0 — Parser PDF Lidl migliorato

Questa versione usa le coordinate del testo nel PDF per distinguere il prezzo di vendita dal prezzo al kg/litro.

## Miglioramenti

- considera prezzi principali solo gli elementi isolati come `2.99`;
- ignora righe come `1 kg = 9.34 €`, `1 l = ...` e prezzi unitari;
- associa titolo e formato usando la stessa colonna grafica del prezzo;
- elimina titoli di servizio e testo legale;
- evita duplicati identici per pagina, titolo e prezzo;
- mantiene il parser HTML come sorgente aggiuntiva.

Il file diagnostico `pdf-extraction.json` continua a essere incluso nell'artefatto GitHub.
