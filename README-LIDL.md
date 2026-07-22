# Spesa Smart 4.3.0 — Lidl automatico

- Lidl è trattato come catena automatica: il pulsante “Collega PDF” è nascosto.
- Il workflow individua dalla pagina ufficiale Lidl il volantino settimanale nazionale corrente.
- Il punto vendita resta associato al negozio scelto; per Sava viene usato come riferimento `IT00812` quando Apps Script non fornisce un codice ufficiale.
- Lo stato dell'interfaccia diventa “Volantino Lidl collegato · offerte nazionali”.
- Questa versione collega il volantino. L'estrazione strutturata dei singoli prodotti Lidl non è ancora attivata, perché il sito non espone nel HAR un endpoint JSON equivalente a PENNY/Eurospin.
