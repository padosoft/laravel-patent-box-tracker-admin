# PROGRESS

## 2026-05-08

- Stato roadmap admin: completate Macro 5 (API client foundation) e Macro 6 (UX design + run/detail interactions) in stato operativo locale.
- Stato subtask:
  - `project/api-client.jsx` presente e integrato in `index.html`.
  - flussi `new run` e `session detail` ora usano API live (`dry-run`, `create session`, `get session`, `get commits`, `get evidence`, `get dossiers`, `render dossier`, `download dossier`).
  - mappatura sessione robusta anche con payload top-level su campi fiscali (`fiscal_year`, `denomination`, `p_iva`, `regime`).
  - filtri/sommari sessioni collegati ai dati API quando disponibili (`PB.SESSIONS` come fallback operativo).
- Stato PR/loop:
  - nessuna PR aperta in corso in questo repo (`gh pr list --state open` vuoto).
  - PR #1 e #2 sul branch macro `task-admin-operating-system` risultano mergeate.
  - passaggio a `main` completato dopo `PR #2` come da remoto.
- Gate locali:
  - `php -v` disponibile (8.4.20), ma il repo admin non contiene stack Node/npm nel workspace corrente (no `npm run test/build/e2e`).
  - `project` usa HTML/JS puro (nessun test Playwright presente nello stato corrente).
  - test API completi verificati nel repo package collegato.
- Note finali:
  - nessun blocker operativo immediato; la roadmap si considera pronta per chiusura con i limiti locali (mancanza strumenti frontend) annotati.

## 2026-05-08

- Stato operativo locale su admin:
  - `project/api-client.jsx` introdotto e allineato ai parametri API base (`/api/patent-box/v1`), con normalizzazione sessione, commit, evidence, dossier e detail payload.
  - `project/pages-detail.jsx` e `project/pages-newrun.jsx` ora usano polling + live data/API-driven flow (dry-run → create session → render queue).
  - `TrackerApi` mapping corretto per leggere campi top-level di `tax_identity` restituiti da package API (`fiscal_year`, `denomination`, `p_iva`, `regime`), evitando campi vuoti in dashboard/sessioni.
  - Fix pratico in client: `apiEnabled` rispettato dal localStorage, evitando config incoerente.
- Stato subtask:
  - `task-admin-operating-system` rimane base di lavoro (main), con design e funzionalità API client ormai in stato operativo locale.
  - Macro 5 (API client foundation + bootstrap) e parte Macro 6 (UX run/detail) avanzate, senza nuova PR avviata in questa sessione per policy ambiente.
- Limiti locali:
  - nessun test automatizzato frontend disponibile in questo workspace (`npm`/playwright non presenti).
  - i passaggi PR/Copilot/CI restano da eseguire nel prossimo loop remoto.

## 2026-05-08

- Stato admin aggiornato su `main`:
  - PR #1 (`task-admin-operating-system-subtask-6.5-admin-ui` -> `task-admin-operating-system`) mergeata.
  - PR #2 (`task-admin-operating-system` -> `main`) aperta e merged.
  - Stato PR attivo: nessuna PR aperta.
- Stato subtask:
  - `subtask 6.5` (import design baseline) chiuso.
  - Passo successivo: avvio Macro 5 (API client + session bootstrap) su admin, con prima attività di scaffold types + polling schema.
- Copilot:
  - richiesta valida su PR #2 confermata.

## 2026-05-08

- Stato subtask admin: `task-admin-operating-system-subtask-6.5-admin-ui` in corso.
- Obiettivo subtask: importare base UI dal design locale `patent-box-admin-panel/project` e attivare i file sorgenti operativi (`index.html`, `app.jsx`, `shell.jsx`, `pages-*.jsx`, CSS).
- Stato operativo:
  - Branch: `task-admin-operating-system-subtask-6.5-admin-ui` (derivato da `task-admin-operating-system`).
  - File UI copiati in `project/` con struttura completa (`index.html`, `styles.css`, `patentbox.css`, `*.jsx`, `uploads/` docs).
  - PR #1 aperta verso `task-admin-operating-system`.
  - Copilot richiesto e verificato via GraphQL fallback (`Copilot` in `requested_reviewers`).
  - Nessun workflow CI rilevato in questo repo al momento; PR in attesa controllo CI.

- Package `laravel-patent-box-tracker` avanzato a `task/api-read-models`.
- Consolidato Macro 2 Read APIs lato package:
  - `GET /tracking-sessions/{trackingSession}/dossiers/{dossier}` detail endpoint,
  - test `404` per sessioni mancanti su read endpoints (`not_found`),
  - suite `tests/Feature/Api` ora a `36 tests` verdi (`179 assertions`).
 - Subtask `2.4 Dossier detail endpoint` chiuso con PR:
   - https://github.com/padosoft/laravel-patent-box-tracker/pull/7
 - Copilot review requested per PR #7.

## 2026-05-07 (Sincronizzazione package)

- Package `laravel-patent-box-tracker` (macro 1 API foundation): suite API locale ora verde (`vendor/bin/phpunit.bat tests/Feature/Api` → `29 tests`, `149 assertions`).
- Fix principali applicati sul package per contract/errore normalization:
  - `error.code` coerente per payload invalidi (`validation_failed`)
  - `error.code=not_found` su sessione inesistente
  - `error.code=conflict` su render dossier non consentito
- Stato macro in corso: PR/loop resta bloccato lato remoto (`Win32 error 5`, remote push/GitHub review). Nessuna chiusura formale senza PR/Copilot/CI nel flusso completo.

## 2026-05-07

- Inizio fase operativa v1.x della roadmap admin + API-UX.
- Branch attiva nel repo admin: `task-admin-operating-system`.
- Stato baseline nel repo package (`laravel-patent-box-tracker`): `task/api-write-jobs` con API layer scritto ma non ancora consolidato.

## Stato attuale documentale

- Creati/aggiornati file operativi:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `agent.md`
  - `agents.md` (shim compatibilità)
  - `docs/RULES.md`
  - `docs/LESSON.md`
  - `.claude/skills/patent-box-admin-enterprise/SKILL.md`
  - `.claude/skills/copilot-pr-review-loop/SKILL.md`
- `docs/ENTERPRISE_PLAN.md` in aggiornamento completo con macro-task e subtask dettagliati + criteri di chiusura.

## Rilevazioni operative (immediate)

- In questo ambiente locale i test PHP non partono finché non è verificata la disponibilità del runtime Herd/PHP (`php` non sempre eseguibile in sandbox).
- Il file design locale è confermato: `C:\Users\lopad\Downloads\patent-box-admin-panel\project\index.html`.
- In alcuni workspace la creazione branch con slash (`task/...`) può fallire; dove accade si usano nomi equivalenti locali e si registra la deviazione nel file di progetto.

## Prossimo passaggio

- Confermare e chiudere i guardrail del Macro 0 (operating system) in PR e poi avviare Macro Task 1 sul package `laravel-patent-box-tracker`.
- Poi passare a Macro Task 1 sul package `laravel-patent-box-tracker` con slice API/contract + hardening.

## Stato esecuzione Macro 0 (2026-05-07)
- Scope: bootstrap operativo completo (AGENTS/CLAUDE/agent/agents + rules + skills + plan + lesson/progress).
- Stato: BLOCKED_ON_PR_OPEN (gh auth required).
- Gate locali:
  - Documenti aggiornati e coerenti nei file richiesto dall'operating system bootstrap.
  - Nessun codice applicativo modificato.
  - Nessun test backend/frontend necessario per questo subtask (documentale).
- Azioni in corso:
  - commit completato: `85088f0`.
  - branch remoto sincronizzato: `task-admin-operating-system`.
  - PR non riuscito da CLI per `HTTP 401 Requires authentication` (token GitHub non autenticato in questo ambiente).
  - PR da aprire manualmente su: `https://github.com/padosoft/laravel-patent-box-tracker-admin/compare/main...task-admin-operating-system`.

## Stato esecuzione Macro 1 (2026-05-07)

- Repository package target: `laravel-patent-box-tracker`.
- Branch attiva package: `task/api-foundation-hardening` (da `task/api-write-jobs`).
- Subtask attivo: `1.1 Contratto envelope e versioning` (foundation scope).
- Implementato:
  - helper `src/Api/ApiResponse.php`;
  - `HealthController` e `CapabilitiesController` con envelope `{data}`;
  - test aggiornato `ApiHealthTest` su `data.status`/`data.version`.
- Commit package:
  - `f72c9a1` (slice 1.1 code)
  - `a379455` (progresso package + blocker remoto push).
- Stato subtask: `BLOCKED_ON_REMOTE_PUSH` (SSH `couldn't create signal pipe, Win32 error 5`).
- Prossimo passo:
  - ripartire dalla sezione Macro 1 Subtask 1.1 nel branch package e chiudere PR/loop quando i credenziali/SSH sono risolti.

## Stato esecuzione Macro 1 (Aggiornamento 2026-05-07)

- Subtask attivo aggiornato: `1.2/1.3 Error taxonomy middleware + contract tests` (foundation scope).
- Stato subtask locale:
  - middleware `HandleApiErrors` aggiunto in `laravel-patent-box-tracker/src/Http/Middleware`;
  - rotte API aggiornate con error taxonomy + `throttle` config;
  - risposte API success stabilizzate via `ApiResponse`;
  - nuovo test `tests/Feature/Api/ApiFoundationContractTest.php`.
- Aggiornamento rapido eseguito in package:
  - queue async ora espone stato e `job.id` coerente per tracking-session create/render,
  - job rendering dossier persistono artefatti su path fisico (`storage/dossiers`) e aggiornano stato sessione,
  - filtri read list allineati (sessions/evidence/dossiers meta + filtri aggiuntivi),
  - reference API aggiornato con envelope e nuovi filtri.
- Stato generale: `BLOCKED_ON_REMOTE_PUSH` (SSH `couldn't create signal pipe, Win32 error 5`) resta valido in questo ambiente.

