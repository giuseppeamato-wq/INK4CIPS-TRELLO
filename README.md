# INK4CIPS-TRELLO

App di gestione multi-progetto in stile Trello, installabile come PWA su Mac e iPhone. Next.js (App Router) su Cloudflare Workers, con D1 (Postgres-like SQLite) + Drizzle ORM, better-auth, R2 e Durable Objects.

## Setup locale (nessun account Cloudflare richiesto)

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Copia `.env.example` in `.env.local` (già presente `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` di default per lo sviluppo locale — rigenera il secret con `openssl rand -base64 32` se vuoi il tuo).
3. Applica le migrazioni al D1 locale:
   ```bash
   npx wrangler d1 migrations apply ink4cips-trello-db --local
   ```
4. Avvia il dev server:
   ```bash
   npm run dev
   ```

Il file `next.config.ts` chiama `initOpenNextCloudflareForDev()`, che avvia una Miniflare locale così `next dev` ha accesso ai binding D1/R2 senza bisogno di un vero account Cloudflare.

## Stato del progetto

- **M0 — Scaffold + Auth**: fatto e verificato dal vivo (signup/login/logout con better-auth + D1 locale, sessione via proxy.ts, guard sulle route autenticate).
- **M1 — Workspace, Board, Inviti**: fatto e verificato dal vivo (creazione workspace con auto-owner, board, invito per email con riconciliazione automatica alla registrazione, autorizzazione via `src/lib/authz/guards.ts` — niente RLS, D1 non la supporta).
- **M2 — Liste/Card + Drag&Drop + Realtime**: fatto e verificato dal vivo. Liste e card con fractional indexing, drag&drop cross-lista e riordino liste via dnd-kit, persistenza su D1, guard su ogni Server Action. Realtime via Durable Object `BoardRoom` (WebSocket Hibernation API, un'istanza per board) — verificato con un client WebSocket indipendente che riceve il broadcast (`list.created`) subito dopo una scrittura su D1 fatta da un altro client. Il realtime va testato con `npm run cf:build && npx wrangler dev` (non `next dev`, il cui dev-shim OpenNext non esegue Durable Object reali) — per lo sviluppo quotidiano non-realtime si usa comunque `npm run dev`.
- **M3 — Dettaglio card**: fatto e verificato dal vivo. Modale via `?card=<id>`, titolo/descrizione/scadenza editabili, assegnazione membri, etichette (con palette colori, creazione al volo che le collega subito alla card), checklist con item spuntabili/eliminabili, commenti — tutto confermato persistente dopo reload completo.
- **M4 — Allegati**: fatto e verificato dal vivo. Upload/download/delete via Route Handler + binding R2 `ATTACHMENTS`, path `{workspaceId}/{boardId}/{cardId}/{uuid}-{filename}`, niente URL pubblici (sempre streaming autenticato via `requireCardMember`). Verificato anche che dopo il delete l'oggetto R2 sia davvero rimosso (404 su un successivo download).
- **M5 — PWA + responsive**: fatto e verificato dal vivo. Manifest + icone → installabile su Mac (Chrome/Edge "Installa app") e iPhone (Safari "Aggiungi a Home"); service worker minimale solo per i criteri di installabilità, niente cache offline aggressiva (app live multi-utente, dati stantii sarebbero un problema, non un beneficio). Sidebar responsive: drawer a scomparsa su mobile con hamburger, sidebar statica da `md:` in su — verificato su viewport 375px che l'header, il drawer e il modale card si adattino correttamente.
- **Ruolo editor + rinomina/elimina**: fatto e verificato dal vivo. Nuovo ruolo `editor` nella gerarchia `owner > admin > editor > member` (`src/db/schema.ts`), con guard dedicate in `src/lib/authz/guards.ts` (`requireWorkspaceEditor`, `requireBoardEditor`, `requireListEditor`, `requireCardEditor`) che risalgono la catena board/lista/card → board → workspace. Member continua a creare board/liste/card/commenti come prima; solo editor (o ruoli superiori) può rinominare/eliminare board, liste e card, tramite dropdown "..." su board card e colonne lista, e icona cestino nel modale card. Owner/admin possono assegnare il ruolo editor a un collega sia in fase di invito (`InviteMemberDialog`) sia successivamente da Impostazioni workspace (`MemberRoleSelect`, non disponibile per l'owner che non può essere retrocesso). Rename/delete di liste e card fanno broadcast realtime (`list.renamed`, `list.deleted`, `card.renamed`, `card.deleted`) via `BoardRoom`, così un secondo client connesso vede il cambiamento senza reload. Verificato dal vivo: rename board/lista/card, delete lista/card (delete card gated da `window.confirm`), select ruolo in Impostazioni, opzione "Editor" nel dialog di invito.
- **Deploy continuo**: fatto e verificato dal vivo. Repo GitHub (`giuseppeamato-wq/INK4CIPS-TRELLO`) collegato a Cloudflare Workers Builds — ogni push su `main` fa build (`npm run cf:build`) e deploy (`npx wrangler deploy`) automatico. Risorse di produzione: D1 `ink4cips-trello-db`, R2 `ink4cips-trello-attachments`, secret `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` impostati via `wrangler secret put`. App live su `https://ink4cips-trello.giuseppe1993amato.workers.dev`.
- **Logo INK4CIPS**: fatto e verificato dal vivo. Logo reale al posto dei placeholder — in `public/logo.png` (login/signup e sidebar workspace) e rigenerato in tutte le taglie PWA in `public/icons/` + `public/apple-touch-icon.png` (icona maskable con safe-zone al 72% per evitare che l'OS ritagli il logo).

## Note

- Per testare con `wrangler dev` usa `--persist-to <cartella fuori dal progetto>`, altrimenti il watcher di wrangler osserva anche i file di stato D1 e ricarica il worker a ogni scrittura, interrompendo le connessioni WebSocket in corso.
- Le icone in `public/icons/` e `public/apple-touch-icon.png` sono generate da `public/logo.png` (192×192, sfondo pieno) con Pillow: upscale Lanczos per le taglie maggiori, e per la maskable un canvas 512×512 con il logo al 72% centrato sul colore di sfondo del logo stesso, per rispettare la safe-zone che gli OS possono ritagliare.
