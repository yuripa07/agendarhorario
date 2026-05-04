# TASK-001: Criar remarcação pública por token

**US pai:** [US-001](./README.md)
**Status:** 🟢 In progress
**Tipo:** feature
**Estimativa:** Não estimada
**Atribuído a:** Codex

## 🎯 Objetivo

Permitir que um appointment confirmado seja remarcado para outro slot válido usando o management token existente.

## 📋 Passos de execução

1. [ ] Criar schema compartilhado `reschedulePublicBookingSchema`.
2. [ ] Cobrir use case com testes unitários inicialmente falhando.
3. [ ] Cobrir endpoint com E2E inicialmente falhando.
4. [ ] Adicionar método de repository para atualizar o horário por token.
5. [ ] Criar use case de remarcação com validação de token, status, slot e conflito.
6. [ ] Expor `POST /public/bookings/management/reschedule`.
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

- `packages/shared/src/schemas/booking.ts`
- `apps/api/src/booking/application/public-booking.*`
- `apps/api/src/booking/infrastructure/drizzle-public-booking.repository.ts`
- `apps/api/src/booking/presentation/public-booking.controller.ts`
- `apps/api/test/public-booking.e2e-spec.ts`

## 📜 Log de execução

- 2026-05-04 20:04 — Iniciado por Codex.
