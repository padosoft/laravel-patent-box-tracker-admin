# Laravel Patent Box Tracker Admin Enterprise Plan (v0)

## Obiettivo

Costruire e portare in produzione un pannello admin Laravel 13 + React che gestisce l'intero flusso
`laravel-patent-box-tracker` via HTTP API, con controllo completo di: validazione repository, dry-run, avvio run single/cross-repo, monitoraggio stato, ispezione commit/evidence, render PDF/JSON, verifica integrità hash-chain e download sicuro.

Il piano include:

- bootstrap operativo (docs/rules/skills/progress/lesson, branch flow)
- API layer nel package `laravel-patent-box-tracker` (facoltativo e opt-in)
- web admin panel standalone
- test end-to-end (PHP + test frontend + Playwright)
- loop PR/Copilot/CI vincolante
- tag e release finale `v.x.x.x`

## Stato: Deep Analysis (bug / problemi / miglioramenti)

### Problemi rilevati nel package attuale (tracker)

1. Nessuna API HTTP nel package
   - Rischio: l'admin non può operare senza coupling DB.
2. Duplicazione logica monolitica nei comandi
   - `TrackCommand` e `CrossRepoCommand` replicano parte del percorso orchestrazione/validazione.
   - Rischio: drift comportamentale tra CLI e API.
3. Operazioni lunghe sync
   - track/cross-repo/render sono comandi sincroni.
   - Rischio: timeout/UX pessima per workflow admin.
4. Nessun hardening per path dossier in superficie API
   - Potenziale exposure se download non vincolato a sessione/dossier.
5. Nessuna autorizzazione API perché layer assente.
   - Rischio: esposizione dati sensibili.
6. Nessun contract testing
   - UI e API non avrebbero un contratto stabile.
7. Calcolo costo ore semplificato come placeholder
   - In `DossierPayloadAssembler` c'è TODO: `1.0h/commit` per commit qualificato.
   - Impatto: stima costi potenzialmente non aderente a policy reale.

### Incompletezza funzionale da chiudere nel flusso admin v1

- Stato job real-time + tracking `running/pending` in modo coerente.
- Pagine dedicate per:
  - commit explorer con filtri robusti
  - evidence explorer con search + collegamento commit
  - sessione dettaglio con timeline e integrity
  - dossier center con stato render/download.
- Gestione errori e codifica errori domain (domain violations, cost cap, validation).
- Scaffolding UX operativo (non landing page, no marketing hero).

### Opportunità di miglioramento

- Estrarre servizi condivisi tra CLI e API (azioni condivise).
- Aggiungere endpoint capabilities per bootstrap frontend.
- Standardizzare envelope risposta + mappa errori.
- Hardening security by default con middleware configurabile.
- Iniziare a usare Playwright per tutte le interazioni principali.

## Riferimento design

- Input richiesto: `https://api.anthropic.com/v1/design/h/qw1_j3QWGp6GqGyno3jc2Q?open_file=index.html`
- In questa sessione non è stato possibile leggere direttamente il file design dal canale web (errore SSL/endpoint).
- Subtask specifico nel piano prevede import e allineamento UI non appena il file viene reso disponibile localmente o come asset recuperabile.

Nota operativa Git:

- Nel file system locale di questo clone, la creazione di branch `task/...` può fallire. Quando ciò accade, usare alias locali coerenti (es. `task-admin-*`) nei comandi effettivi, ma mantenere nei documenti i nomi canonici con slash per coerenza metodologica.

## Macro Task 1 — Bootstrap operativo e processo

Branch: `task/admin-operating-system`

### Subtask 1.1

- Obiettivo: stabilire struttura governance, files guida e regole.
- Implementazione:
  - creare `AGENTS.md`, `CLAUDE.md`, `agents.md`
  - creare `docs/RULES.md`, `docs/PROGRESS.md`, `docs/LESSON.md`, `docs/ENTERPRISE_PLAN.md`
  - creare `.claude/skills/patent-box-admin-enterprise/SKILL.md` e `.claude/skills/copilot-pr-review-loop/SKILL.md`
- Guardrail:
  - controllo file diff completo
  - aggiornamento `docs/PROGRESS.md` con stato iniziale
- Verifica:
  - nessun test applicativo richiesto

### Subtask 1.2

- Obiettivo: definire piano esecuzione e template PR/Copilot nel repo.
- Implementazione:
  - sezione "loop PR obbligatorio" in regole
  - codifica regole di fallback Copilot (GraphQL).
- Guardrail:
  - PR template base con link a test/Copilot checklist
- Verifica:
  - controllo manuale coerenza con `rules`

## Macro Task 2 — API Foundations (in package tracker)

Branch: `task/api-enterprise-bootstrap`

### Subtask 2.1 Config e enablement API

- Obiettivo: API opt-in, prefix e middleware configurabili.
- Implementazione:
  - aggiungere sezione `api` in `config/patent-box-tracker.php` (`enabled`, `prefix`, `middleware`, `rate_limiter`, `route_name`)
  - gate di registrazione routes in service provider
- Guardrail:
  - test API disabled => 404
  - test API enabled => route risponde
- Verifica:
  - PHPUnit feature test

### Subtask 2.2 Service provider e route bootstrap

- Obiettivo: introdurre `routes/api.php` con versioning `v1`.
- Implementazione:
  - gruppo route `prefix`, `middleware` configurabili
  - endpoint `GET /capabilities`, `GET /health`
- Guardrail:
  - no route registrate se `api.enabled=false`
- Verifica:
  - feature test routes

### Subtask 2.3 Standard envelope e resource mappers

- Obiettivo: response stable shape.
- Implementazione:
  - standard envelope `{data, meta, error}` o equivalente coerente
  - mapper DTO per capabilities
- Guardrail:
  - test JSON schema base
- Verifica:
  - unit test mapper + feature snapshot

## Macro Task 3 — API Read Models (consistency + osservabilità)

Branch: `task/api-read-models`

### Subtask 3.1 Sessions list/detail

- Obiettivo: elencare e leggere sessioni con filtri.
- Endpoint:
  - `GET /v1/tracking-sessions`
  - `GET /v1/tracking-sessions/{id}`
- Guardrail:
  - filtri: `status`, `fiscal_year`, `regime`, `from`, `to`, `search`, paginazione
- Verifica:
  - feature tests filtro + ordinamento + 404

### Subtask 3.2 Commit explorer APIs

- Obiettivo: tabella commit robusta con filtri.
- Endpoint:
  - `GET /v1/tracking-sessions/{id}/commits`
- Guardrail:
  - filtri `phase`, `ai_attribution`, `is_rd_qualified`, `author_email`, range confidence, search
- Verifica:
  - feature tests e payload contract

### Subtask 3.3 Evidence API

- Obiettivo: dettagliare evidenze con filtro.
- Endpoint:
  - `GET /v1/tracking-sessions/{id}/evidence`
- Verifica:
  - test `kind`, `slug`, `search`, paginazione

### Subtask 3.4 Dossiers + Integrity

- Obiettivo:
  - `GET /v1/tracking-sessions/{id}/dossiers`
  - `GET /v1/tracking-sessions/{id}/integrity`
- Guardrail:
  - verify hash-chain con modello già esistente
- Verifica:
  - test chain valid/fail

## Macro Task 4 — API Write + Async Jobs

Branch: `task/api-write-jobs`

### Subtask 4.1 Service extraction

- Obiettivo: evitare duplicazione logica CLI/API.
- Implementazione:
  - estrarre `CreateTrackingSessionAction`
  - `RunSingleRepositoryTrackingAction`
  - `RunCrossRepositoryTrackingAction`
  - `RenderDossierAction`
  - `ProjectCostAction`
- Guardrail:
  - output delle comandi invariato (retrocompatibilità)
- Verifica:
  - unit test action boundaries

### Subtask 4.2 Repository validation + dry-run

- Endpoint:
  - `POST /v1/repositories/validate`
  - `POST /v1/tracking-sessions/dry-run`
- Guardrail:
  - no classifier call in dry-run
  - commit count corretto
- Verifica:
  - feature tests con fake repo fixture

### Subtask 4.3 Avvio tracking con async

- Endpoint:
  - `POST /v1/tracking-sessions`
  - `POST /v1/tracking-sessions/{id}/dossiers`
- Guardrail:
  - ritorna stato `202` e stato job
- Verifica:
  - test async dispatch, stato iniziale, eventuale fallback sync se queue non attiva

### Subtask 4.4 Job queue + status

- Obiettivo:
  - job class e stato sessione coerente (`pending`, `running`, `classified`, `rendered`, `failed`)
- Verifica:
  - test transizione stato su success/failure path

## Macro Task 5 — API Security and hardening

Branch: `task/api-security-hardening`

### Subtask 5.1 Authorization and middleware

- Implementazione:
  - middleware default `auth:sanctum` o override configurabile
  - policy stubs/documentation for host override
- Verifica:
  - test 401/403

### Subtask 5.2 Error taxonomy + input hardening

- Implementazione:
  - request classes per endpoint scrittura
  - mapping errori con codici standard (`validation_failed`, `repository_invalid`, `cost_cap_exceeded`, `not_found`, `conflict`)
- Verifica:
  - test 422/409/404/500 shape

### Subtask 5.3 Download safety

- Implementazione:
  - download endpoint verificando ownership session/dossier
  - no client-supplied path
- Verifica:
  - test traversal/foreign-session rejection

## Macro Task 6 — Admin UI foundation

Branch: `task/web-admin-foundation`

### Subtask 6.1 Scaffold e runtime modes

- Laravel 13 + React + TS + Vite + Tailwind + React Query.
- Support same-host e remote API base.
- Verifica:
  - build app + smoke page load.

### Subtask 6.2 API client typed

- Implementare `capabilities`, `sessions`, `commits`, `evidence`, `dossiers`, `integrity`, `mutations`.
- Verifica:
  - unit tests client
  - test mappatori errori (401/403/404/409/422/500).

### Subtask 6.3 Shell + navigazione

- Dashboard, sessioni, run nuovo, dettagli.
- Verifica:
  - component tests + Playwright per flusso base dashboard.

## Macro Task 7 — Admin UX implementation

Branch: `task/web-admin-pipeline`

### Subtask 7.1 New Run Wizard

- Step: identity, period, repositories (+validate), dry-run, launch.
- Verifica:
  - playright flow completo (desktop)

### Subtask 7.2 Session detail

- timeline, metriche, commit/evidence tabs, integrity strip.
- Verifica:
  - playright su stato pending/running/classified

### Subtask 7.3 Commit explorer

- filtri avanzati, drawer dettaglio.
- Verifica:
  - scenari di filtro + inspector

### Subtask 7.4 Evidence explorer

- filtri + detail.
- Verifica:
  - scenario dettaglio evidence + link-to-commits

### Subtask 7.5 Dossier center

- render/download status + error states.
- Verifica:
  - playright render + download check

## Macro Task 8 — Contracts + QA + release

Branch: `task/final-release`

### Subtask 8.1 Contract suite

- fixture JSON per capabilities/session/detail/commits/evidence/dossier/errore
- verifica contract e stabilità shape.

### Subtask 8.2 README wow-style + docs finale

- update README completo in stile alto livello.
- include API quickstart e flow admin.

### Subtask 8.3 Lessons/rules/agents consolidation

- integrare in `docs/LESSON.md`, `docs/RULES.md`, skills/agents.

### Subtask 8.4 Release

- PR finale macro verso main
- run test allineato
- tag `v.x.x.x`
- release notes e changelog

## PR Loop obbligatorio per ogni subtask e macro

1. Implementare slice.
2. Eseguire gate locali.
3. Aprire PR verso branch corrente.
4. Richiedere Copilot review.
5. Verificare richiesta reale in GitHub.
6. Correggere commenti/CI.
7. Riaprire ciclo.
8. Merge subtask/macro solo dopo stato verde.

## Acceptance criteria globali

- API opt-in completa e sicura.
- Admin operativo end-to-end:
  - config/validate/dry-run/launch/poll/inspect/render/download/integrity.
- Nessun coupling a internals di package.
- Long operations async con stato osservabile.
- CI locale e remoto verdi e Copilot review chiuso.
