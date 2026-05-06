# TASK-001: Tenant onboarding

**Status:** Planned

## Checklist

1. [ ] Criar documentacao da EPIC-116.
2. [ ] Adicionar schemas compartilhados do onboarding.
3. [ ] Criar tabelas de convites e vinculos admin-tenant.
4. [ ] Adicionar CLI operacional de convite.
5. [ ] Implementar use cases e repositorios de onboarding.
6. [ ] Expor endpoints de lookup e aceite de convite.
7. [ ] Reforcar autorizacao dos endpoints admin por membership.
8. [ ] Criar UI `/admin/onboarding`.
9. [ ] Atualizar guia de criacao de tenant.
10. [ ] Cobrir backend, UI e E2E.
11. [ ] Executar validacoes finais.

## Contratos planejados

- `POST /admin/onboarding/lookup`
- `POST /admin/onboarding/accept`
- `pnpm --filter @agendarhorario/api tenant:invite -- --slug ... --display-name ... --admin-email ...`
