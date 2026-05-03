# TASK-003: Expor API administrativa

**Status:** ✅ Done
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Expor endpoints protegidos para o admin gerenciar disponibilidade do tenant atual.

## Passos de execução

1. [x] Criar controller em `/admin/availability`.
2. [x] Validar body e params com Zod.
3. [x] Usar `TenantContextService` para obter `tenantId`.
4. [x] Adicionar testes E2E de proteção, horários e bloqueios.

## Definition of Done

- [x] Endpoints exigem sessão admin.
- [x] `/health` permanece público.
- [x] Testes relevantes passando.
