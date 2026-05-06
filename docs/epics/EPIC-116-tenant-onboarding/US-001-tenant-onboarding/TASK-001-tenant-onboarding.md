# TASK-001: Tenant onboarding

**Status:** ✅ Done

## Checklist

1. [x] Criar documentacao da EPIC-116.
2. [x] Adicionar schemas compartilhados do onboarding.
3. [x] Criar tabelas de convites e vinculos admin-tenant.
4. [x] Adicionar CLI operacional de convite.
5. [x] Implementar use cases e repositorios de onboarding.
6. [x] Expor endpoints de lookup e aceite de convite.
7. [x] Reforcar autorizacao dos endpoints admin por membership.
8. [x] Criar UI `/admin/onboarding`.
9. [x] Atualizar guia de criacao de tenant.
10. [x] Cobrir backend, UI e E2E.
11. [x] Executar validacoes finais.

## Contratos planejados

- `POST /admin/onboarding/lookup`
- `POST /admin/onboarding/accept`
- `pnpm --filter @agendarhorario/api tenant:invite -- --slug ... --display-name ... --admin-email ...`
