# LESSON

## 2026-05-07

- I documenti operativi devono essere allineati subito in tutte le entry (`AGENTS`, `CLAUDE`, `agent.md`, `agents.md`, skills, rules, progress, lesson) prima di partire con codice.
- In alcuni workspace Windows la branch `task/...` può avere conflitti; quando accade mantenere naming canonico in documenti e usare nomi equivalenti locali registrando la deviazione.
- Copilot review via `gh pr edit <PR> --add-reviewer @copilot` può non partire per scope token/project; la richiesta funziona con GraphQL su `copilot-pull-request-reviewer[bot]` e va verificata in `requested_reviewers`.
- Il file design è disponibile localmente in `C:\Users\lopad\Downloads\patent-box-admin-panel\project\index.html` e quindi non deve più essere trattato come blocker.
- La lettura del pacchetto API mostra che le API v1 attuali coprono molti endpoint ma non hanno ancora uno stato/job id coerente e non hanno storage di errori/diagnostica robusta.
- In questo ambiente locale i test PHP non partono finché non si usa il runtime Herd/PHP accessibile sul sistema; verificare su shell utente se `php -v` è disponibile, quindi ogni step `composer test` è una dipendenza esplicita del prossimo ambiente.
- `AGENTS.md` e `agents.md` coesistono in questo clone; verificare sempre dopo il bootstrap per evitare file-case confusion.
- Macro 0 bootstrap doc-only è stato completato e pushato (`task-admin-operating-system`), ma `gh pr create` fallisce con `HTTP 401` in questa sandbox: la PR deve essere aperta manualmente da utente autenticato.
- In package macro1, l'introduzione di `ApiResponse::success()` ha evitato doppio nesting di `data`; in particolare, in fase iniziale era stato quasi introdotto un wrapper `data => ['data'=> ...]` e poi corretto.
- Remote loop package: push a `task/api-foundation-hardening` può fallire in questa macchina per SSH (`Win32 error 5`, signal pipe). Bloccare manuale remoto e riaprire il loop nel prossimo ambiente.

