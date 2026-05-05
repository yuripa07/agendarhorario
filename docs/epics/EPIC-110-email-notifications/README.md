# EPIC-110: Email notifications

**Status:** ✅ Done
**Owner:** Yuri
**Criado em:** 2026-05-04
**Última atualização:** 2026-05-04

## 🎯 Objetivo

Enviar notificações transacionais por e-mail para reset de senha e eventos do booking público usando Resend em produção e noop/captura em desenvolvimento e teste sem chave.

## 📋 Contexto e motivação

O backend já gera links de reset de senha e tokens de gerenciamento de booking, mas os envios estavam limitados a stubs internos. O sistema precisa ter uma infraestrutura de e-mail compartilhada e testável, mantendo o comportamento local seguro sem chamadas reais de rede.

## 🎁 Escopo

### Inclui

- Configuração opcional de `RESEND_API_KEY`.
- Configuração de `EMAIL_FROM` com default seguro para desenvolvimento.
- Sender Resend injetável com fallback noop quando não houver chave.
- Renderização HTML/texto de templates transacionais com React Email.
- E-mail de reset de senha via sender configurado.
- E-mails de criação, cancelamento e remarcação de booking.
- Link de gerenciamento no e-mail de criação em `/booking/manage?token=...`.
- Testes unitários e E2E sem chamada real de rede.

### Não inclui (explicitamente)

- Lembretes agendados.
- Scheduler, outbox ou retry persistente.
- Tracking de entrega.
- UI de gerenciamento.
- Configuração de remetente por tenant.

## ✅ Critérios de pronto

- [x] Sem `RESEND_API_KEY`, o backend usa noop/captura.
- [x] Com `RESEND_API_KEY`, o backend envia por Resend usando `EMAIL_FROM`.
- [x] Reset de senha usa o sender configurado sem logar token ou URL.
- [x] Booking criado envia confirmação com serviço, horário e link de gerenciamento.
- [x] Booking cancelado envia notificação de cancelamento.
- [x] Booking remarcado envia notificação de remarcação.
- [x] Falha de notificação de booking é logada e não desfaz a operação persistida.

## 📜 Histórico

- 2026-05-04: implementadas notificações transacionais com Resend/noop.
