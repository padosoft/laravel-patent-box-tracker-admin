# PROGRESS

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
- Stato: READY_FOR_PR.
- Gate locali:
  - Documenti aggiornati e coerenti nei file richiesto dall'operating system bootstrap.
  - Nessun codice applicativo modificato.
  - Nessun test backend/frontend necessario per questo subtask (documentale).
- Azioni in corso:
  - commit e apertura PR verso 	ask-admin-operating-system.

