# LESSON

## 2026-05-08 (allineamento upstream + README WOW)

- Quando il package upstream taglia una stable (`v1.0.0`/`v1.0.1`), il primo passo è confrontare `routes/api.php` upstream con `project/api-client.jsx`: se gli endpoint coincidono e l'error taxonomy è congelata, l'admin non richiede modifica funzionale, solo documentale.
- L'alias `invalid_repository → validation_failed` deve restare nel client per la transizione da `v0.1.x` a `v1.0.x`: rimuoverlo è una breaking change anche per l'admin, non solo per il package.
- README admin "wow community" deve dichiarare esplicitamente: (a) ruolo di companion del package, (b) consumo solo via API pubblica, (c) presenza vibe-coding pack `.claude/skills/`, (d) badge stack + companion. Senza questi quattro elementi il lettore non capisce che è un *pannello*, non un fork del package.
- La roadmap è "completa" anche con gap UX residui solo se i gap sono espliciti in `ENTERPRISE_PLAN.md` con riferimento al subtask di follow-up. Marcare 100% senza gap visibili crea debito invisibile.

## 2026-05-08

- In questo ciclo, `gh pr list` è stato usato per verificare stato reale PR aperte; dove nulla risulta aperto, il macro può essere marcato come chiuso anche se i test frontend non sono eseguibili localmente.
- `php` risulta disponibile in PATH (`8.4.20`) quindi la verifica dei pacchetti può essere fatta su `vendor/bin/phpunit.bat` anche quando il repo admin non espone tool frontend.
- Se non esiste `npm`/Playwright in repo admin, registrare il limite come blocker non funzionale e usare test API del package come gate operativo minimo per la chiusura end-to-end.
- In assenza di pipeline frontend nel repo admin, i file statici `project/*.jsx` devono rimanere coerenti con il design source e documentare eventuali divergenze nel `docs/PROGRESS.md`.

## 2026-05-08

- Integrazione admin/API: la normalizzazione lato client va fatta sia su payload v1 (`tax_identity`) sia su campi top-level (`denomination`, `fiscal_year`, `p_iva`, `regime`) per evitare campi vuoti quando gli endpoint cambiano forma.
- `enabled` nelle impostazioni API deve essere persistito separatamente dal token: memorizzare un booleano dedicato evita regressioni dove il client restava disattivato per override incoerente.

## 2026-05-08

- In assenza di scaffold Laravel/React preesistente nell’admin repo, la baseline UI può essere resa disponibile copiando l’intero set `project/` dal design di riferimento (HTML + JSX + CSS) e mantenendo l’evoluzione a step successivi verso integrazione Laravel/SWR/API client.
- Registrare nel `docs/PROGRESS.md` la consegna della baseline anche senza build/test automatici quando l’ambiente backend non fornisce runtime completo.

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
- 2026-05-07: nel package `laravel-patent-box-tracker` le API contract su 422/404/409 ora sono state rese esplicite nei controller (`ApiResponse::error`) dove il mapping middleware da solo era insufficiente in test (response wrapper non applicato su alcune eccezioni).

