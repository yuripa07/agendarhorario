# ADR-010: Modelo de documentação por épico

**Status:** Accepted
**Data:** 2026-05-02
**Decididores:** Yuri

## Contexto

Humanos e agentes precisam encontrar contexto rapidamente.

## Decisão

Documentar por épicos, user stories, tasks e histórico append-only.

Docs de planejamento devem ser criadas antes da implementação com status e checklists pendentes. Status `Done`, checkboxes concluídos e Definition of Done só devem ser marcados depois que a implementação e as validações finais passarem.

Entradas de `HISTORY.md`, `Log de execução` e histórico do épico devem usar data e hora local no formato `YYYY-MM-DD HH:mm`. Eventos já rastreados por ferramentas externas, como abertura de PR no GitHub, não precisam ser duplicados no histórico versionado.

## Alternativas consideradas

- **README único:** simples, cresce mal.
- **Issues externas apenas:** bom para gestão, menos portátil no repo.

## Consequências

### Positivas

- Contexto versionado junto ao código.

### Negativas

- Exige atualização contínua.
