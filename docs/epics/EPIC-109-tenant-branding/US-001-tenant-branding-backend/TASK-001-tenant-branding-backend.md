# TASK-001: Criar backend de branding do tenant

**US pai:** [US-001](./README.md)
**Status:** 🟢 In progress
**Tipo:** feature
**Atribuído a:** Codex

## 🎯 Objetivo

Expor contratos backend para consultar e atualizar `displayName` e `primaryColor` do tenant atual.

## 📋 Passos de execução

1. [ ] Criar schemas compartilhados de branding.
2. [ ] Cobrir use case e schemas com testes unitários inicialmente falhando.
3. [ ] Cobrir rotas admin e pública com E2E inicialmente falhando.
4. [ ] Criar repository tenant-aware para branding.
5. [ ] Criar use case de consulta e atualização.
6. [ ] Expor controllers admin e público.
7. [ ] Atualizar documentação da US.

## ✅ Definition of Done

- [ ] Código implementado seguindo TDD.
- [ ] Testes passando localmente (`pnpm test`).
- [ ] E2E da API passando localmente.
- [ ] Lint/format limpos (`pnpm lint`).
- [ ] Type-check sem erros (`pnpm typecheck`).
- [ ] CI verde.
- [ ] Documentação atualizada.
- [ ] HISTORY.md da US atualizado.
- [ ] Auto-review pelo agente.

## 🔍 Arquivos afetados (estimativa)

- `packages/shared/src/schemas/tenant.ts`
- `apps/api/src/tenancy/**`
- `apps/api/test/tenant-branding.e2e-spec.ts`

## 📜 Log de execução

- 2026-05-04 20:26 — Iniciado por Codex.
