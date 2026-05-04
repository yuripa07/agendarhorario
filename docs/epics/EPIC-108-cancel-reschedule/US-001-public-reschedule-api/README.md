# US-001: Remarcar agendamento por token

**Épico pai:** [EPIC-108](../README.md)
**Status:** 🟢 In progress
**Estimativa:** Não estimada
**Criado em:** 2026-05-04

## 📖 Narrativa

> Como **cliente final com link de gerenciamento**,
> Eu quero **remarcar meu agendamento para outro horário disponível**,
> Para que **eu possa ajustar meu compromisso sem criar um novo booking manualmente**.

## 🎯 Critérios de aceite (Gherkin)

### Cenário 1: remarcar appointment confirmado

**Dado** que existe um appointment confirmado com management token válido,
**Quando** o cliente solicita remarcação para um slot válido do mesmo serviço,
**Então** a API atualiza `startsAt` e `endsAt`,
**E** retorna o appointment confirmado atualizado.

### Cenário 2: rejeitar token inválido ou expirado

**Dado** que o token não existe ou expirou,
**Quando** o cliente solicita remarcação,
**Então** a API retorna 404.

### Cenário 3: rejeitar appointment cancelado

**Dado** que o token pertence a um appointment cancelado,
**Quando** o cliente solicita remarcação,
**Então** a API rejeita a operação.

### Cenário 4: rejeitar slot inválido

**Dado** que o novo horário não aparece como slot válido para o serviço do appointment,
**Quando** o cliente solicita remarcação,
**Então** a API retorna 400.

### Cenário 5: rejeitar conflito

**Dado** que outro appointment confirmado ocupa o novo horário,
**Quando** o cliente solicita remarcação,
**Então** a API retorna 409.

## 🔧 Considerações técnicas

- A API usa `POST /public/bookings/management/reschedule`.
- Body: `{ token, startsAt }`.
- Resposta: `PublicAppointment`.
- O token de gerenciamento não é rotacionado nesta versão.
- A validação de disponibilidade deve ignorar o appointment que está sendo remarcado e considerar os demais appointments confirmados do tenant.
- Cancelamento por token já existe desde o EPIC-106 e não faz parte da implementação nova.

## 🔒 Considerações de segurança

- O token nunca é retornado na resposta.
- A busca usa hash do token, mantendo o token bruto fora da persistência.
- Token inexistente e expirado usam o mesmo status HTTP para reduzir enumeração.

## ♿ Considerações de acessibilidade

- Sem impacto direto nesta task, pois a entrega é API. A UI futura deve oferecer controles claros de data e hora e mensagens de erro acessíveis.

## 🧪 Estratégia de teste

- Unit: sucesso, token inexistente/expirado, appointment cancelado, slot inválido e conflito.
- E2E: criar booking, remarcar por token, confirmar liberação do horário antigo e rejeitar duplicidade no novo horário.

## 🔗 Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-public-reschedule-api.md) | Criar remarcação pública por token | 🟢 |

## 📚 Referências

- [EPIC-106](../../EPIC-106-customer-booking-flow/README.md)
- [ADR-006](../../../adrs/ADR-006-timezone-utc.md)
- [ADR-011](../../../adrs/ADR-011-smart-slot-algorithm.md)

## 📜 Ver [HISTORY.md](./HISTORY.md)
