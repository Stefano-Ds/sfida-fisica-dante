# Sito della sfida

Apri https://stefano-ds.github.io/sfida-fisica-dante/ oppure https://sfida-fisica-dante-sds.area-di-lavo-8593.chatgpt.site/.

Il sito è pubblico e non richiede un account. Estrae tre quesiti di fisica distinti tra i 14 forniti e aggiunge una domanda a scelta multipla sulla vita di Dante. Un errore blocca l’indirizzo IP per 60 minuti. Il PDF viene restituito soltanto dopo quattro risposte corrette.

GitHub Pages apre il sito ospitato su un servizio server, che verifica le risposte e mantiene i tentativi nel database. Il documento protetto e le credenziali non sono inclusi in questo repository.

L’archivio Sorgenti_sito.zip contiene i sorgenti completi senza il PDF. Per una nuova installazione, aggiungere privatamente protected-file.js con fileName e fileBase64, impostare una chiave IP_SECRET e un database D1 chiamato DB, applicare le migrazioni in drizzle e lanciare npm run build. Usare un proprio progetto di hosting nel manifest. Il server deve ricevere il vero CF-Connecting-IP dal proxy fidato di Cloudflare e non deve essere esposto direttamente con intestazioni controllabili dal client.

Per l’anteprima locale: npm run dev (Node 24). I controlli locali verificano estrazione, correzione, blocco, scadenza, richieste simultanee, sessione e integrità SHA-256 del documento originale.

Limiti: una rete condivisa condivide il blocco; cambiare rete o usare una VPN cambia l’IP. Il file scaricato può essere condiviso. La prova e il permesso di download durano 30 minuti.