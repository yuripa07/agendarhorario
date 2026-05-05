# TASK-001: Criar UI pública de gerenciamento de booking

**US pai:** [US-001](./README.md)
**Status:** ✅ Done
**Tipo:** feature
**Atribuído a:** Codex

## 🎯 Objetivo

Implementar a página `/booking/manage` no web app para consultar, cancelar e remarcar appointments públicos usando as APIs já disponíveis no backend.

## 📋 Passos de execução

1. [x] Criar documentação do EPIC-112, US e task.
2. [x] Estender client HTTP público com lookup, cancelamento e remarcação.
3. [x] Adicionar rota `/booking/manage` no TanStack Router.
4. [x] Criar página de gerenciamento com leitura do token por query string.
5. [x] Exibir detalhes mínimos do appointment sem expor token.
6. [x] Implementar cancelamento com confirmação.
7. [x] Implementar remarcação para slot disponível do mesmo serviço.
8. [x] Tratar token ausente, `404`, `400`, `409`, loading e erro genérico.
9. [x] Adicionar testes de componente e E2E web.
10. [x] Validar localmente.

## ✅ Definition of Done

- [x] `/booking/manage?token=...` funciona sem sessão administrativa.
- [x] A UI consome `POST /public/bookings/management/lookup`.
- [x] A UI consome `POST /public/bookings/management/cancel`.
- [x] A UI consome `POST /public/bookings/management/reschedule`.
- [x] A UI consome `GET /public/services/:serviceId/slots`.
- [x] Conflito `409` permite recuperação.
- [x] A tela não mostra token de gerenciamento.
- [x] `pnpm --filter @agendarhorario/web test` passa.
- [x] `pnpm --filter @agendarhorario/web test:e2e` passa.
- [x] `pnpm --filter @agendarhorario/web typecheck` passa.
- [x] PR aberto para `main`.

## 🔌 APIs e contratos

- `POST /public/bookings/management/lookup`
  - Body: `{ token }`.
  - Retorna appointment público.
- `POST /public/bookings/management/cancel`
  - Body: `{ token }`.
  - Retorna appointment público cancelado.
- `POST /public/bookings/management/reschedule`
  - Body: `{ token, startsAt }`.
  - Retorna appointment público remarcado.
- `GET /public/services/:serviceId/slots?startsAt=...&endsAt=...`
  - Retorna slots disponíveis em UTC.

## 🧪 Testes planejados

- Componentes:
  - Consulta appointment por token da URL.
  - Exibe estado sem token.
  - Exibe estado para token inválido ou expirado.
  - Cancela appointment confirmado.
  - Remarca appointment confirmado.
  - Recupera de conflito `409` ao remarcar.
- E2E:
  - Cliente consulta e remarca appointment em `/booking/manage?token=...`.

## 🔍 Arquivos afetados

- `apps/web/src/app/App.tsx`
- `apps/web/src/pages/booking/public-booking-client.ts`
- `apps/web/src/pages/booking/booking-management-page.tsx`
- `apps/web/src/pages/booking/booking-management-page.test.tsx`
- `apps/web/src/test/e2e/booking-management.spec.ts`

## 📜 Log de execução

- 2026-05-05 19:04 — Implementado por Codex com testes de componente, E2E web e validações locais.
- 2026-05-05 19:05 — PR aberta para `main`: https://github.com/yuripa07/agendarhorario/pull/22.
