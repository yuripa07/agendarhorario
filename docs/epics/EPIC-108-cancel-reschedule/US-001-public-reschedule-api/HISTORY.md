# Histórico de US-001

## 2026-05-04 — TASK-001 iniciada

**Por:** Codex
**Resumo:** Planejado backend de remarcação pública por management token.
**Decisões tomadas:** Escopo limitado a backend; cancelamento por token permanece como funcionalidade pré-existente do EPIC-106; não criar migration salvo necessidade real.
**Ajustes necessários no futuro:** Implementar UI de remarcação e cancelamento em épico posterior.

## 2026-05-04 — TASK-001 concluída

**Por:** Codex
**Resumo:** Implementado `POST /public/bookings/management/reschedule` com schema compartilhado, use case, repository Drizzle, controller e testes unitários/E2E.
**Decisões tomadas:** Reutilizar o management token existente; validar disponibilidade pelo mesmo algoritmo de slots; buscar o timezone do tenant a partir do appointment porque o endpoint por token não depende de `Host`.
**Ajustes necessários no futuro:** Criar frontend de remarcação e revisar eventual expiração/renovação de token em política de produto.
