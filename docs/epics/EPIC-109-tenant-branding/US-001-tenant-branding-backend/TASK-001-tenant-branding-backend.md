# TASK-001: Criar backend de branding do tenant

**US pai:** [US-001](./README.md)
**Status:** ✅ Done
**Tipo:** feature
**Atribuído a:** Codex

## 🎯 Objetivo

Expor contratos backend para consultar e atualizar `displayName` e `primaryColor` do tenant atual.

## 📋 Passos de execução

1. [x] Criar schemas compartilhados de branding.
2. [x] Cobrir use case e schemas com testes unitários inicialmente falhando.
3. [x] Cobrir rotas admin e pública com E2E inicialmente falhando.
4. [x] Criar repository tenant-aware para branding.
5. [x] Criar use case de consulta e atualização.
6. [x] Expor controllers admin e público.
7. [x] Atualizar documentação da US.

## ✅ Definition of Done

- [x] Código implementado seguindo TDD.
- [x] Testes passando localmente (`pnpm test`).
- [x] E2E da API passando localmente.
- [x] Lint/format limpos (`pnpm lint`).
- [x] Type-check sem erros (`pnpm typecheck`).
- [ ] CI verde.
- [x] Documentação atualizada.
- [x] HISTORY.md da US atualizado.
- [x] Auto-review pelo agente.

## 🔍 Arquivos afetados (estimativa)

- `packages/shared/src/schemas/tenant.ts`
- `apps/api/src/tenancy/**`
- `apps/api/test/tenant-branding.e2e-spec.ts`

## 📜 Log de execução

- 2026-05-04 20:26 — Iniciado por Codex.
- 2026-05-04 20:29 — Implementado backend de branding do tenant e validado localmente.
