# EPIC-115: Admin calendar actions

**Status:** ✅ Done
**Owner:** Yuri
**Criado em:** 2026-05-06
**Última atualização:** 2026-05-06

## 🎯 Objetivo

Permitir que o admin crie, remarque e cancele agendamentos diretamente pela agenda administrativa.

## 📋 Contexto e motivação

O painel administrativo ja permite visualizar a agenda e configurar a operacao do tenant. Ainda faltavam acoes do dia a dia na propria agenda, obrigando o prestador a depender do fluxo publico ou de chamadas diretas a API para ajustar agendamentos.

## 🎁 Escopo

### Inclui

- Listagem de slots validos para o admin.
- Criacao de appointment pelo admin.
- Remarcacao de appointment confirmado pelo admin.
- Cancelamento de appointment confirmado pelo admin.
- Validacao por disponibilidade, bloqueios e conflitos.
- Notificacoes de criacao, cancelamento e remarcacao para o cliente.
- Modais de criacao, remarcacao e confirmacao de cancelamento na agenda web.
- Testes automatizados de API, UI e E2E mockado.

### Não inclui (explicitamente)

- Override manual fora da grade de disponibilidade.
- Encaixe forcado em horario ocupado.
- Edicao direta de dados do cliente em appointment existente.
- Multi-profissional.
- Auditoria avancada.

## ✅ Critérios de pronto

- [x] Admin lista slots validos por servico.
- [x] Admin cria appointment em slot disponivel.
- [x] Criacao rejeita conflito e slot invalido.
- [x] Admin remarca appointment confirmado para slot valido.
- [x] Remarcacao ignora o proprio appointment e bloqueia conflito com outros.
- [x] Admin cancela appointment confirmado.
- [x] Appointment cancelado nao oferece acoes de remarcar/cancelar na UI.
- [x] Cliente recebe notificacoes nas tres acoes.
- [x] Endpoints admin continuam protegidos por sessao.
- [x] Testes automatizados passam localmente.

## 🔗 User Stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-admin-calendar-actions/) | Operar agendamentos pela agenda admin | ✅ Done |

## 📚 ADRs relacionados

- [ADR-001](../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-006](../../adrs/ADR-006-timezone-utc.md)
- [ADR-007](../../adrs/ADR-007-frontend-stack.md)
- [ADR-010](../../adrs/ADR-010-documentation-model.md)

## 📜 Histórico

- 2026-05-06: implementadas acoes administrativas de agenda com slots validos e notificacoes.

