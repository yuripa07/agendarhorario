# TASK-001: Criar remarcação pública por token

**US pai:** [US-001](./README.md)
**Status:** ✅ Done
**Tipo:** feature
**Estimativa:** Não estimada
**Atribuído a:** Codex

## 🎯 Objetivo

Permitir que um appointment confirmado seja remarcado para outro slot válido usando o management token existente.

## 📋 Passos de execução

1. [x] Criar schema compartilhado `reschedulePublicBookingSchema`.
2. [x] Cobrir use case com testes unitários inicialmente falhando.
3. [x] Cobrir endpoint com E2E inicialmente falhando.
4. [x] Adicionar método de repository para atualizar o horário por token.
5. [x] Criar use case de remarcação com validação de token, status, slot e conflito.
6. [x] Expor `POST /public/bookings/management/reschedule`.
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

- `packages/shared/src/schemas/booking.ts`
- `apps/api/src/booking/application/public-booking.*`
- `apps/api/src/booking/infrastructure/drizzle-public-booking.repository.ts`
- `apps/api/src/booking/presentation/public-booking.controller.ts`
- `apps/api/test/public-booking.e2e-spec.ts`

## 📜 Log de execução

- 2026-05-04 20:04 — Iniciado por Codex.
- 2026-05-04 20:09 — Implementado backend de remarcação por token e validado localmente.
