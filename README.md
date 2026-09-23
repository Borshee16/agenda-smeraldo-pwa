# Agenda Smeraldo

PWA in italiano, tema chiaro oro e smeraldo. Nessun account o servizio dati aggiuntivo: tutto viene conservato in IndexedDB sul dispositivo. Questa versione privata include il nome di Fabiana e il prospetto dei turni in `initial-data.js`.

## Funzioni

- Navigazione in basso: Calendario, Oggi, Aggiungi, Impostazioni.
- Turni personali e di tutti i colleghi. La modifica di una data non sposta il ciclo.
- Attività modificabili, eliminabili e ripristinabili dalle ultime 30 eliminate.
- Scelta «Da flaggare?» e «Salva questa attività per il futuro». Quest’ultima crea un modello senza date da riutilizzare; l’impegno viene comunque salvato in agenda.
- Appuntamenti singoli, date multiple, intervalli, periodi ricorrenti e attività collegate all’inizio di un periodo.
- Esempi configurabili: estetista, yoga, ciclo di 7 giorni ogni 27 e puntura ogni 14 giorni. Sono modelli scelti dall’utente, senza date sanitarie preimpostate.
- Backup JSON esportabile e importabile. Ripristinare un backup sostituisce i dati del dispositivo dopo conferma.
- Manifest, icone e service worker per installazione e uso offline dopo il primo caricamento online.
- Domeniche e festività nazionali italiane in rosso; patrono locale non impostato.

I dati non sono sincronizzati fra dispositivi. Eliminare i dati del browser elimina anche l’agenda: conservare un backup. Non vengono inviate notifiche a app chiusa. Le date dei periodi ricorrenti sono proiezioni matematiche modificabili, non rilevazioni automatiche.

## Distribuzione privata

Il repository e la build contengono nomi e turni. La build non include password, servizi di autenticazione o sincronizzazione. L'accesso al repository non protegge automaticamente un sito distribuito da esso.

Il workflow **Verifica PWA privata** esegue test e build, senza pubblicare. Per l'installazione sul telefono serve distribuire `dist/` su HTTPS con controllo degli accessi anche per gli asset statici. Non attivare GitHub Pages pubblico su questa versione: anche da un repository privato, un sito Pages personale può essere pubblico.

## Primo avvio

Al primo avvio appaiono Fabiana Martorano e i turni del prospetto 14 settembre–18 ottobre 2026. Le date esterne al prospetto sono proiezioni del ciclo di 35 giorni. I dati già salvati sul dispositivo hanno precedenza: un aggiornamento non sostituisce modifiche, attività o spunte.

Per il ciclo o altre attività ricorrenti, vai su **Aggiungi** e inserisci la prima data reale. Non sono inventate date per gli appuntamenti personali. I backup si gestiscono da **Impostazioni**.

Su Android usa **Installa app** o il menu del browser. Su iPhone apri il sito in Safari, poi **Condividi → Aggiungi alla schermata Home**. Le modifiche vengono salvate sul dispositivo anche offline.

## Sviluppo e verifica

Richiede Node.js 22 o successivo per test e build; nessuna dipendenza npm.

```sh
npm test
npm run build
python3 -m http.server 8080 --directory dist
```

Aprire `http://localhost:8080`. Installazione e service worker richiedono HTTPS in produzione o localhost in sviluppo. Non aprire `index.html` direttamente come file locale.

La build genera una versione della cache dal contenuto degli asset. Gli aggiornamenti richiedono il pulsante **Aggiorna app** e non toccano IndexedDB. Le scritture verificano la revisione salvata per evitare sovrascritture silenziose da una seconda finestra.
