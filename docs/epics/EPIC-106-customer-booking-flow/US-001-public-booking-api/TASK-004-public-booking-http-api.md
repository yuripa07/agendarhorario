# TASK-004: Expor API HTTP pública

**Status:** ✅ Done
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Expor endpoints públicos do fluxo de booking sem sessão administrativa.

## Passos de execução

1. [x] Criar controller público de serviços e slots.
2. [x] Criar controller público de bookings.
3. [x] Mapear erros de aplicação para status HTTP.
4. [x] Cobrir fluxo com E2E por `Host`.

## Definition of Done

- [x] Endpoints disponíveis sem autenticação.
- [x] E2E cobre isolamento por tenant, conflito e cancelamento.
