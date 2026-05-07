# LESSON

## 2026-05-07

- Le branch con pattern `task/...` potrebbero non essere create in questo clone se esiste un ref locale con prefisso `task` come file/entrypoint. In questi casi usa naming equivalente e mantieni nel piano il naming canonico con slash per coerenza.
- Copilot review via `gh pr edit <PR> --add-reviewer @copilot` può non funzionare per autorizzazioni/project scope. In quell caso la richiesta è via GraphQL con `copilot-pull-request-reviewer[bot]`.
- In assenza del file design locale, il plan deve includere un subtask dedicato all'allineamento reale dopo acquisizione del file `index.html` condiviso.
- Gli errori nel package base (TODO su stima ore per commit e logica monolitica dei comandi) vanno risolti in backend prima della stabilizzazione dell'admin v1.
- In questa sessione l'URL `api.anthropic.com/v1/design/...` per `index.html` non è stato recuperabile (SSL/endpoint non accessibile), quindi il lockfile/design non è stato importato.
- Ambiente Windows case-insens: `AGENTS.md` e `agents.md` non possono coesistere; per ora uso `AGENTS.md` come file agente canonico e `agent.md` per compatibilità testuale dove richiesto.
