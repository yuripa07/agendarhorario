# TASK-001: Criar UI pública de booking

**US pai:** [US-001](./README.md)
**Status:** 📝 Planned
**Tipo:** feature
**Atribuído a:** Codex

## 🎯 Objetivo

Implementar a página `/booking` no web app com fluxo em etapas para criar agendamentos públicos usando as APIs já disponíveis no backend.

## 📋 Passos de execução

1. [ ] Criar testes de componente inicialmente falhando para o fluxo público.
2. [ ] Criar E2E web inicialmente falhando para criação de booking em `/booking`.
3. [ ] Criar client HTTP público para branding, serviços, slots e criação de booking.
4. [ ] Adicionar rota `/booking` no TanStack Router.
5. [ ] Criar página `booking-page.tsx` com fluxo em etapas.
6. [ ] Criar componentes de seleção de serviço, seleção de horário, formulário de dados e confirmação.
7. [ ] Integrar validação com React Hook Form, Zod e schemas compartilhados.
8. [ ] Tratar estados de loading, vazio, erro, conflito `409` e sucesso.
9. [ ] Aplicar branding público do tenant na experiência.
10. [ ] Validar localmente e atualizar documentação se necessário.

## ✅ Definition of Done

- [ ] Código implementado seguindo TDD.
- [ ] `/booking` funciona sem sessão administrativa.
- [ ] A UI consome `GET /public/tenant/branding`.
- [ ] A UI consome `GET /public/services`.
- [ ] A UI consome `GET /public/services/:serviceId/slots`.
- [ ] A UI envia `POST /public/bookings` com payload válido.
- [ ] Conflito `409` permite recuperação sem perder os dados do cliente.
- [ ] A confirmação não mostra token de gerenciamento.
- [ ] Arquivos novos de páginas, componentes, hooks, clients e testes usam kebab-case.
- [ ] `pnpm lint` passa.
- [ ] `pnpm typecheck` passa.
- [ ] `pnpm test` passa.
- [ ] `pnpm --filter @agendarhorario/web test:e2e` passa.
- [ ] `pnpm audit --audit-level moderate` passa.
- [ ] PR aberto para `main`.

## 🔌 APIs e contratos

- `GET /public/tenant/branding`
  - Retorna `displayName` e `primaryColor`.
- `GET /public/services`
  - Retorna serviços ativos do tenant resolvido.
- `GET /public/services/:serviceId/slots?startsAt=...&endsAt=...`
  - Retorna slots disponíveis em UTC.
- `POST /public/bookings`
  - Body: `serviceId`, `startsAt`, `customerName`, `customerEmail`, `customerPhone`, `privacyAccepted: true`.
  - Retorna appointment público sem `managementToken`.

## 🧪 Testes planejados

- Componentes:
  - Renderiza branding público.
  - Lista serviços ativos.
  - Bloqueia avanço sem serviço.
  - Busca slots para serviço e data.
  - Exibe estado sem horários disponíveis.
  - Valida campos obrigatórios e aceite de privacidade.
  - Envia payload correto de criação.
  - Exibe confirmação sem token.
  - Exibe conflito `409` de forma recuperável.
- E2E:
  - Cliente cria booking completo em `/booking` sem sessão admin.
  - Cliente vê estado sem slots quando não há horários disponíveis.

## 🔍 Arquivos afetados (estimativa)

- `apps/web/src/app/App.tsx`
- `apps/web/src/pages/booking/booking-page.tsx`
- `apps/web/src/pages/booking/booking-page.test.tsx`
- `apps/web/src/pages/booking/public-booking-client.ts`
- `apps/web/src/test/e2e/booking.spec.ts`

## 📜 Log de execução

- 2026-05-05 — Planejado por Codex.
