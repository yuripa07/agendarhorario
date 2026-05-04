# EPIC-106: Customer booking flow API

**Status:** ✅ Done

## Objetivo

Permitir que clientes finais consultem serviços ativos, vejam slots disponíveis e criem/cancelem agendamentos por API pública, resolvendo o tenant pelo `Host` e sem exigir sessão administrativa.

## Escopo

- Expor endpoints públicos para serviços, slots, criação de booking, consulta por token e cancelamento.
- Persistir appointments confirmados com dados mínimos do cliente.
- Bloquear sobreposição de appointments ativos por tenant no PostgreSQL.
- Reusar o algoritmo do EPIC-105 para cálculo de slots.
- Enviar link de gerenciamento por sender abstrato, com implementação noop em dev/test.
- Armazenar apenas hash do token de gerenciamento no banco.

## Não inclui

- UI pública de booking.
- Remarcação de appointments.
- Gestão de múltiplos profissionais.
- Pagamentos.
- Confirmação por e-mail antes de criar o appointment.

## User stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-public-booking-api/) | Agendar e cancelar pelo fluxo público | ✅ Done |
