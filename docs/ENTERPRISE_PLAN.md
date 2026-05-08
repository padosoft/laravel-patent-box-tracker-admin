# Laravel Patent Box Tracker Enterprise Roadmap

## Obiettivo v1

Fornire un admin web Laravel 13 + React completo per `laravel-patent-box-tracker` con: discovery repository, dry-run, lanci asincroni, monitoraggio stato, ispezione commit/evidence, rendering/rendered download, verifiche integrity e UX allineata al design.

Lo stack base attuale dell'admin richiede bootstrap processuale e la roadmap qui sotto regola anche i processi di PR/Copilot/CI.

---

## Deep Analysis (Bug, problemi, miglioramenti)

### A. Stato API `laravel-patent-box-tracker` (repo package)

1. Stato job non persistente
- `RunTrackingSessionJob` imposta `failed` solo su eccezione e non gestisce correttamente il passaggio completo di stato (`pending`/`running`/`classified`/`failed`) lato job.
- `RenderTrackingSessionDossierJob` non registra errore esplicito e non imposta stato dossier/run.

2. Orchestrazione non idempotente/robusta
- La sessione viene creata con stato `pending`, ma manca stato `queued` coerente.
- Dispatch job non tracciato (`job.id` sempre null nel payload).
- Non c'è endpoint di stato job e non è garantito un path di recovery.

3. Validazione input debole
- Validazioni ripetute in controller con `Validator` (`QueueTrackingSessionController`, `TrackingDryRunController`, `ValidateRepositoryController`, ecc.) senza FormRequest/DTO.
- `QueueTrackingSessionController` non controlla unique constraints di repo/periodo e non sanitizza ruoli/path con policy.
- Il controllo repo in dry-run/validate usa solo `GitProcess::isRepository` e non isola policy filesystem.

4. Calcolo e gestione costi incompleta
- `TrackingDryRunController` richiede sempre `classifier.model`, mentre `QueueTrackingSessionController` lo rende opzionale; API incoerente per i client.
- `projectedCost` usa guard, ma non c'è uniformità su rounding/overflow/cap policy.

5. Dossier e sicurezza filesystem
- `RenderTrackingSessionDossierJob` crea `TrackedDossier` con `path = null` senza persistere stato finale/durata.
- Nessun endpoint di download protetto per `path` + autorizzazione per sessione.

6. Integrity e observability
- Endpoint integrity presente ma limitato, senza pagina job/attempt e senza envelope errore uniforme.
- Assenza di contract tests per payloads endpoint/API shape.

7. Sicurezza e policy
- API pubblica manca policy layer (solo middleware config).
- Nessun endpoint esplicito che esponga error taxonomy/trace id.

8. Admin repository (questo repo)
- Mancano ancora baseline operativi applicativi per frontend e UI; ci sono solo documenti minimo-minimi.

### B. Priorità funzionali mancanti

1. endpoint di stato per run/job.
2. Playbook completo per upload/download dossier e autorizzazioni.
3. UI/UX amministrativa con flussi guidati (new run, validation, launch, poll, detail, integrity, render/download).
4. test contract + Playwright per tutte le interazioni UI nuove.

---

## Criteri globali di accettazione

Un task/subtask è chiuso solo se:

1. test locali obbligatori passati;
2. PR aperta verso branch corretto;
3. review Copilot richiesta e verificata;
4. CI green (o attese esplicite documentate);
5. commenti Copilot risolti;
6. aggiornamenti su `docs/PROGRESS.md` e, se utile, `docs/LESSON.md`.

Se una PR non parte per limiti GitHub/SSH/CLI, il task resta `OPEN` con stato bloccato esplicito.

---

## Metodo operativo

1. Macro branch per macro task (nomi canonici con slash in piano: `task/<name>`).
2. Subtask branch da macro branch.
3. Implementa la singola slice.
4. Apri PR verso macro branch con test, PR link, notes Copilot e stato locale.
5. Richiedi Copilot.
6. Itera fix finché CI/recensioni sono pulite.
7. Merge subtask -> macro, poi macro -> `main`.

Quando l'ambiente locale blocca `task/<name>`, usare alias equivalenti e annotare la deviazione nel piano e in `PROGRESS`.

---

## Macro 0 - Operating System Bootstrap (admin repo)

### Obiettivo
- Consolidare istruzioni operative, agent/skill/rules, progress/lesson e procedure PR.

### Subtask 0.1 - Regole e onboarding
- Aggiornare `AGENTS.md`, `CLAUDE.md`, `agent.md`, `agents.md`.
- Aggiornare `docs/RULES.md` con criteri assoluti e guardrail Copilot.

**Guardrail**
- Ogni file richiesto esiste e contiene read-order coerente.

### Subtask 0.2 - Skill pack
- Aggiornare `.claude/skills/patent-box-admin-enterprise/SKILL.md`.
- Aggiornare `.claude/skills/copilot-pr-review-loop/SKILL.md` con fallback GraphQL e verifica reviewer.

**Guardrail**
- fallback documentato testabile con esempio di comando.

### Subtask 0.3 - Piano definitivo
- Riscrivere questa roadmap con tutti i blocchi sottotask e test.

**Guardrail**
- Include subtask UI con Playwright e milestone release.

**Test locali**
- Solo verifica manuale di coerenza file e grep/read; nessun test applicativo richiesto.

**Output PR**
- PR verso `task-admin-operating-system`.

---

## Macro 1 - API Foundation Hardening (package repo)

### Obiettivo
- Stabilizzare le API base prima della UI.

### Subtask 1.1 - Contratto envelope e versioning
- Introdurre shape response standardizzato (`data`, `meta`, `error`).
- Standardizzare codici errore (`validation_failed`, `not_found`, `conflict`, `cost_cap_exceeded`, `internal_error`).
- Aggiornare `GET /health`, `GET /capabilities` in questo schema.

**Guardrail**
- test su payload keys obbligatorie, status codes, content-type.

### Subtask 1.2 - Error taxonomy middleware
- Centralizzare mapping exceptione validation/authorization/repository in helper dedicato.

**Test**
- feature tests per codici errori con fixture.

### Subtask 1.3 - Test contract base
- Creare test di contract per endpoint foundation.

**Test locali**
- `composer validate --strict --no-check-publish`
- `composer test` (filtri su API foundation).

---

## Macro 2 - Read Model API Completion (package repo)

### Obiettivo
- Rifinire endpoint lettura sessioni, commit, evidence, dossier, integrity.

### Subtask 2.1 - Sessions list/detail
- Filtri robusti: `status`, `fiscal_year`, `regime`, `from`, `to`, `search`.
- Metadata paginazione + summary.

### Subtask 2.2 - Commit explorer
- Filtri per `phase`, `is_rd_qualified`, `ai_attribution`, `rd_confidence_min/max`, `repository_path`, `search`.
- Ordinamenti deterministici, paginazione e limiti.

### Subtask 2.3 - Evidence explorer
- Filtri per `kind`, `slug`, `path_like`, `search`.

### Subtask 2.4 - Dossier list + integrity endpoint
- list detail per dossier con stato rendere e audit metadata.
- endpoint integrity con payload stabile + identificatori hash.

### Subtask 2.5 - Performance
- Eager loading/indicizzazione query e test per grandi dataset.

**Guardrail**
- Nessun N+1 noto; response shape stabile.

**Test locali**
- feature tests per ogni endpoint in `tests/Feature/Api`.

---

## Macro 3 - Write, Job Lifecycle, and State Machine (package repo)

### Obiettivo
- Completare i write APIs, validazioni, execution asynchronous e stato sessione robusto.

### Subtask 3.1 - Queue APIs e DTO
- Aggiungere FormRequest/DTO per `POST /tracking-sessions`, `/dry-run`, `/repositories/validate`, `/tracking-sessions/{id}/dossiers`.
- Validazione path/repo duplication/rule matrix.

### Subtask 3.2 - Job state machine
- Introdurre stato intermedio coerente (`queued`), timestamp e `progress` minimo.
- In `QueueTrackingSessionController`, riportare `job.id` reale in response.
- In job `RunTrackingSessionJob`/`RenderTrackingSessionDossierJob`, aggiornare `TrackingSession`/`TrackedDossier` su start/fail/success con fallback transazionale.

### Subtask 3.3 - Azioni condivise
- Estrarre layer action/service per estrarre logica da command/API.
- Aggiornare CLI path per usare action comuni.

### Subtask 3.4 - Failure semantics
- Persistere error_reason + context ridotto su `failed`.
- Non lasciare sessioni in stato ambiguo.

**Guardrail**
- idempotenza del create/lancio per payload identici (evitare doppie sessioni non richieste).

**Test locali**
- php feature tests: dispatch, stato transizionale, recovery.
- unit tests su action.

---

## Macro 4 - Security and Data Access Hardening (package repo)

### Obiettivo
- Rendere API sicura e pronta per uso multi-tenant/operator.

### Subtask 4.1 - Middleware/auth config
- Policy/middleware default for admin contexts.
- `api.enabled` e prefix hardening.

### Subtask 4.2 - Dossier access control
- Nuovo endpoint download con autorizzazione per `tracking_session_id` + ownership.
- Path traversal + race checks.

### Subtask 4.3 - Rate limit + audit
- Cap per endpoint sensibili (`dry-run`, `validate`, `create`).
- Log minimi audit + request id.

**Test locali**
- endpoint 401/403/422/409 con test feature.
- path traversal test negativo.

---

## Macro 5 - Admin API Client Foundation (admin repo)

### Obiettivo
- Costruire consumer API con contract stabile, tipi, store e polling stato.

### Subtask 5.1 - Client typed + env
- Integrazione config runtime base URL + token support.

### Subtask 5.2 - Error adapter unificato
- Tradurre error taxonomy in notifiche operatore.

### Subtask 5.3 - Stato run + polling
- Hook run in polling con backoff e aggiornamento UI.

### Subtask 5.4 - Contratti frontend
- Test client for shape parse/validation.

**Test locali**
- unit tests client + Playwright smoke per bootstrap/API call.

---

## Macro 6 - Admin UX + Design Implementation (admin repo)

### Obiettivo
- Implementare interfaccia end-to-end con design guida da `C:\Users\lopad\Downloads\patent-box-admin-panel\project\index.html` e flussi operativi.

### Subtask 6.1 - Setup shell + routing admin
- Sidebar/nav + dashboard + sessions list page.

### Subtask 6.2 - Run wizard (new session)
- Form wizard: repositories, period, tax identity, dry-run, launch.

### Subtask 6.3 - Session detail & monitors
- Timeline sessione, stato run, commit/evidence explorer, summary KPI.

### Subtask 6.4 - Dossier center
- Render trigger, stato async, download autorizzato, integrity check view.

### Subtask 6.5 - Implementazione design file
- Importare `C:\Users\lopad\Downloads\patent-box-admin-panel\project\index.html` e mappare sezione per sezione.
- Documentare scostamenti responsabili nel commit note.

**Guardrail UI/UX**
- Nessuna landing/hero, niente elementi promozionali, layout operativo.

**Playwright obbligatorio**
- Scenario nuova run: validazione -> dry-run -> launch -> polling -> dettagli -> render.
- Scenario filtro commit/evidence.
- Scenario dossier render + download/error.

**Test locali**
- `npm run test`
- `npm run build`
- `npm run e2e`

---

## Macro 7 - Contracts, Docs, Release, and Tag

### Obiettivo
- Chiusura enterprise + rilascio v.x.x.x.

### Subtask 7.1 - Contract suite finale
- Fixture contract JSON per API + frontend shape assertion.

### Subtask 7.2 - README wow (stile AskMyDocs)
- Rework README nel package e admin con:
  - architettura, capability matrix, quickstart install/config, security, troubleshooting, roadmap, API.

### Subtask 7.3 - Consolidamento lesson/rules
- Riflettere lezioni/skill/rules con aggiornamenti finali.

### Subtask 7.4 - Release
- Macro PR finale, CI/PR loop chiuso.
- Tag `v.x.x.x` su `main` e release notes.

**Guardrail**
- Nessuna promessa non verificata nel README.
- Release solo con tutti i loop chiusi e PR merged.

---

## PR Loop (obbligatorio per ogni subtask e macro)

1. branch locale creato/aggiornato
2. implementazione slice
3. run gates
4. aggiornamento docs `docs/PROGRESS.md`
5. PR aperta
6. richiesta Copilot review
7. verifica reviewer effettivo
8. chiusura commenti
9. merge

Se ci sono blocchi remoti persistenti, il subtask resta aperto con blocker esplicito.

---

## Registro dei tag target

- `v1.0.0` placeholder: da definire dopo chiusura macro.
- naming formale previsto: `v.x.x.x` (seguire semver del pacchetto).


