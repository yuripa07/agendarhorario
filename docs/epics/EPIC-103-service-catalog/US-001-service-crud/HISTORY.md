# Histórico de US-001

## 2026-05-03 — US planejada

**Por:** Codex

**Resumo:** Criada documentação inicial do EPIC-103 com escopo backend-only para CRUD administrativo de serviços por tenant.

**Decisões tomadas:** Exclusão de serviço será soft-delete via `is_active = false`; preço será persistido como centavos.

**Ajustes necessários no futuro:** Adicionar UI administrativa e integrar o catálogo ao fluxo público de booking.

## 2026-05-03 — TASK-001, TASK-002 e TASK-003 concluídas

**Por:** Codex

**Resumo:** Implementado CRUD backend de serviços com schema compartilhado, migration Drizzle, use cases, repositório tenant-aware e endpoints administrativos em `/admin/services`.

**Decisões tomadas:** A remoção permanece como soft-delete (`is_active = false`) e o E2E agora aplica migrations antes de exercitar a API.

**Ajustes necessários no futuro:** Conectar os endpoints à UI administrativa e usar apenas serviços ativos no booking público.
