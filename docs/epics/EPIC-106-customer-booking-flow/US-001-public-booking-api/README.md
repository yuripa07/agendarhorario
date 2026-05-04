# US-001: Agendar e cancelar pelo fluxo público

**Status:** ✅ Done

## História

Como cliente final, quero escolher um serviço ativo, selecionar um horário disponível e receber um link de gerenciamento para consultar ou cancelar meu agendamento.

## Critérios de aceite

- `GET /public/services` não exige autenticação e retorna apenas serviços ativos do tenant resolvido pelo `Host`.
- `GET /public/services/:serviceId/slots?startsAt=&endsAt=` valida tenant, serviço ativo e janela UTC antes de retornar slots `{ startsAt, endsAt, score, isAdjacent }`.
- `POST /public/bookings` exige `serviceId`, `startsAt`, dados do cliente e `privacyAccepted: true`.
- Um booking criado nasce com status `confirmed` quando o slot ainda está disponível.
- A resposta de criação não retorna token bruto.
- O link de gerenciamento é enviado por sender abstrato e o banco armazena somente hash do token.
- `POST /public/bookings/management/lookup` retorna dados mínimos quando o token é válido e não expirou.
- `POST /public/bookings/management/cancel` cancela appointment confirmado com token válido.
- Dois appointments ativos sobrepostos para o mesmo tenant são rejeitados mesmo sob concorrência.
- Appointment cancelado libera o slot para novo booking.

## Contratos públicos

### `GET /public/services`

- Sem cookie de admin.
- Tenant obrigatório via `Host`.
- Retorna serviços ativos do tenant.

### `GET /public/services/:serviceId/slots?startsAt=&endsAt=`

- Sem cookie de admin.
- `startsAt` e `endsAt` devem ser instantes UTC e `startsAt < endsAt`.
- Serviço deve existir, pertencer ao tenant e estar ativo.
- Retorna slots calculados pelo algoritmo do EPIC-105.

### `POST /public/bookings`

- Body: `serviceId`, `startsAt`, `customerName`, `customerEmail`, `customerPhone`, `privacyAccepted: true`.
- Cria appointment `confirmed` se o slot ainda estiver disponível.
- Envia magic link com token válido por 7 dias.
- Não retorna token bruto.

### `POST /public/bookings/management/lookup`

- Body: `{ token }`.
- Retorna dados mínimos do appointment se token válido, não expirado e appointment existente.

### `POST /public/bookings/management/cancel`

- Body: `{ token }`.
- Cancela appointment confirmado usando token válido.
- Remarcação fica fora desta etapa.

## Estratégia de teste

- Shared schemas: validação dos inputs públicos, datas UTC, e-mail, telefone, token obrigatório e `privacyAccepted: true`.
- Unit/application: serviços ativos, cálculo de slots com horários/bloqueios/appointments, serviço inativo, slot inválido, conflito e tenant ausente.
- Repository/integration: persistência, hash do token, cancelamento por token, expiração e reuso após cancelamento.
- PostgreSQL: constraint contra dois appointments ativos sobrepostos no mesmo tenant.
- E2E: fluxo público sem cookie admin, isolamento por `Host`, booking, duplicidade `409`, sender capturado e cancelamento.

## Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-public-booking-contracts.md) | Definir contratos públicos e schemas | ✅ Done |
| [TASK-002](./TASK-002-appointment-persistence.md) | Persistir appointments e proteger sobreposição | ✅ Done |
| [TASK-003](./TASK-003-booking-use-cases.md) | Implementar casos de uso de booking | ✅ Done |
| [TASK-004](./TASK-004-public-booking-http-api.md) | Expor API HTTP pública | ✅ Done |

## Ver [HISTORY.md](./HISTORY.md)
