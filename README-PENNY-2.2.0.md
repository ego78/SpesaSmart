# Spesa Smart 2.2.0 — volantino locale PENNY automatico

## Novità

- Il punto vendita PENNY selezionato viene riconosciuto tramite le sue coordinate.
- GitHub Actions interroga l'API del volantino e individua il PENNY più vicino.
- Le offerte vengono estratte come dati strutturati, senza PDF, OCR o API OpenAI.
- Ogni offerta contiene punto vendita, indirizzo, validità, immagine e ID ufficiale del negozio.
- Le offerte PENNY vengono mostrate come **Validità locale verificata**.

## Installazione

1. Sostituire nel repository tutti i file con quelli di questo pacchetto.
2. Fare commit e push.
3. In GitHub aprire **Actions → Cerca offerte automatiche → Run workflow**.
4. Non serve aggiungere `OPENAI_API_KEY` per PENNY.
5. Non è necessario modificare `Code.gs` rispetto alla versione 2.1.0.

## Nota tecnica

Il connector prova a ricavare automaticamente l'ID del volantino dalla pagina PENNY. Se il sito non lo espone nell'HTML, usa temporaneamente l'ID verificato nel file HAR. È possibile forzare un nuovo ID impostando la variabile `PENNY_FLYER_ID` nel workflow.
