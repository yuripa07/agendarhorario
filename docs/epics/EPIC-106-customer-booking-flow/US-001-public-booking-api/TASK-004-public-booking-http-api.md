# TASK-004: Expor API HTTP pública

**Status:** 🚧 In progress
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Expor endpoints públicos do fluxo de booking sem sessão administrativa.

## Passos de execução

1. [ ] Criar controller público de serviços e slots.
2. [ ] Criar controller público de bookings.
3. [ ] Mapear erros de aplicação para status HTTP.
4. [ ] Cobrir fluxo com E2E por `Host`.

## Definition of Done

- [ ] Endpoints disponíveis sem autenticação.
- [ ] E2E cobre isolamento por tenant, conflito e cancelamento.
