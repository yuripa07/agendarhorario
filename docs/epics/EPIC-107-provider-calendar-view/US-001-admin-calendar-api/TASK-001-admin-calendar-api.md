# TASK-001: Criar API administrativa de calendário

**US pai:** [US-001](./README.md)
**Status:** ✅ Done
**Tipo:** feature
**Estimativa:** 3 horas
**Atribuído a:** Codex

## 🎯 Objetivo
Expor appointments do tenant em uma janela UTC para alimentar a visão de agenda do prestador.

## 📋 Passos de execução
1. [x] Criar schema compartilhado para query e resposta da agenda.
2. [x] Criar porta, use case e teste unitário.
3. [x] Criar repositório Drizzle com filtro por tenant e janela.
4. [x] Criar controller administrativo protegido.
5. [x] Cobrir com E2E.
6. [x] Atualizar documentação da US.

## ✅ Definition of Done
- [x] Código implementado seguindo TDD.
- [x] Testes passando localmente (`pnpm test`).
- [x] Lint/format limpos (`pnpm lint`).
- [x] Type-check sem erros (`pnpm typecheck`).
- [ ] CI verde.
- [x] Documentação atualizada.
- [x] HISTORY.md da US atualizado.
- [x] Auto-review pelo agente.

## 🔍 Arquivos afetados
- `packages/shared/src/schemas/calendar.ts`
- `apps/api/src/booking/application/admin-calendar.*`
- `apps/api/src/booking/infrastructure/drizzle-admin-calendar.repository.ts`
- `apps/api/src/booking/presentation/admin-calendar.controller.ts`
- `apps/api/test/admin-calendar.e2e-spec.ts`

## 📜 Log de execução
- 2026-05-04 00:00 — Iniciado por Codex.
- 2026-05-04 00:00 — API, testes e documentação concluídos.
