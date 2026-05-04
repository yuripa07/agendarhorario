# EPIC-108: Cancel and reschedule

**Status:** 🟢 Active
**Owner:** Yuri
**Criado em:** 2026-05-04
**Última atualização:** 2026-05-04

## 🎯 Objetivo

Permitir que o cliente final gerencie um agendamento existente pelo token de gerenciamento, com remarcação backend para um novo slot válido.

## 📋 Contexto e motivação

O EPIC-106 entregou criação, consulta e cancelamento de appointment por management token. Este épico complementa o fluxo público com remarcação por token, mantendo o frontend fora do escopo desta entrega.

## 🎁 Escopo

### Inclui

- Schema compartilhado para remarcação por token.
- Endpoint público `POST /public/bookings/management/reschedule`.
- Validação de token existente e não expirado.
- Remarcação apenas de appointment confirmado.
- Validação do novo horário pelo algoritmo de slots do mesmo serviço.
- Rejeição de conflito com outro appointment confirmado.
- Testes unitários e E2E do backend.

### Não inclui (explicitamente)

- Frontend de cancelamento ou remarcação.
- Novo token após remarcação.
- Múltiplos profissionais.
- Migration, salvo se a implementação revelar necessidade real.
- Mudanças no cancelamento já existente.

## ✅ Critérios de pronto

- [ ] `POST /public/bookings/management/reschedule` aceita `{ token, startsAt }`.
- [ ] `startsAt` exige UTC instant terminado em `Z`.
- [ ] Token inexistente ou expirado retorna 404.
- [ ] Appointment cancelado não pode ser remarcado.
- [ ] Slot inválido retorna 400.
- [ ] Conflito com outro appointment confirmado retorna 409.
- [ ] O mesmo management token continua válido após remarcação.
- [ ] Testes automatizados passam localmente.

## 🔗 User Stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-public-reschedule-api/) | Remarcar agendamento por token | 🟢 |

## 📚 ADRs relacionados

- [ADR-001](../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-002](../../adrs/ADR-002-clean-architecture.md)
- [ADR-006](../../adrs/ADR-006-timezone-utc.md)
- [ADR-011](../../adrs/ADR-011-smart-slot-algorithm.md)

## 📜 Histórico

- 2026-05-04: criado escopo backend de remarcação por token. Cancelamento por token permanece como funcionalidade pré-existente do EPIC-106.
