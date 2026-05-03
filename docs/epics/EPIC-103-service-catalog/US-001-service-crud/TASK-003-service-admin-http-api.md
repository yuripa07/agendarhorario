# TASK-003: Expor API administrativa

**Status:** 🟡 To do
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Expor endpoints protegidos para o admin gerenciar serviços do tenant atual.

## Passos de execução

1. [ ] Criar controller em `/admin/services`.
2. [ ] Validar body e params com Zod.
3. [ ] Usar `TenantContextService` para obter `tenantId`.
4. [ ] Adicionar testes E2E de proteção e CRUD.

## Definition of Done

- [ ] Endpoints exigem sessão admin.
- [ ] `/health` permanece público.
- [ ] Testes relevantes passando.

