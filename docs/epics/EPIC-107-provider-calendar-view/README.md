# EPIC-107: Provider calendar view

**Status:** ✅ Done
**Owner:** Yuri
**Criado em:** 2026-05-04
**Última atualização:** 2026-05-04

## 🎯 Objetivo
Permitir que o prestador consulte os agendamentos do tenant em uma janela de calendário para montar visões diária e semanal.

## 📋 Contexto e motivação
Depois do fluxo público de booking, o administrador precisa enxergar os horários ocupados sem acessar diretamente o banco. A primeira entrega expõe uma API protegida e isolada por tenant para alimentar a UI de agenda.

## 🎁 Escopo
### Inclui
- Endpoint administrativo para listar appointments por janela UTC.
- Isolamento por tenant resolvido pelo `Host`.
- Dados mínimos do serviço e cliente para renderização da agenda.
- Testes unitários e E2E cobrindo contrato, autenticação e isolamento.

### Não inclui (explicitamente)
- UI administrativa da agenda.
- Drag and drop, remarcação ou criação manual pelo prestador.
- Múltiplos profissionais.
- Integração com calendários externos.

## ✅ Critérios de "pronto" (Definition of Done)
- [x] API protegida por sessão administrativa.
- [x] Query exige `startsAt` e `endsAt` UTC válidos.
- [x] Resultado retorna somente appointments do tenant atual que cruzam a janela pedida.
- [x] Dados de serviço são retornados junto do appointment.
- [x] Testes automatizados passam localmente.

## 🔗 User Stories
| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-admin-calendar-api/) | Consultar agenda administrativa | ✅ Done |

## 📚 ADRs relacionados
- [ADR-001](../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-002](../../adrs/ADR-002-clean-architecture.md)
- [ADR-006](../../adrs/ADR-006-timezone-utc.md)

## 📜 Histórico
- 2026-05-04: criado com API administrativa de calendário.
