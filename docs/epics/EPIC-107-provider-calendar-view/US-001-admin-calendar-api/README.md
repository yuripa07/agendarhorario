# US-001: Consultar agenda administrativa

**Épico pai:** [EPIC-107](../README.md)
**Status:** ✅ Done
**Estimativa:** 3 horas
**Criado em:** 2026-05-04

## 📖 Narrativa
> Como **prestador autenticado**,
> Eu quero **consultar meus agendamentos em uma janela de calendário**,
> Para que **eu possa visualizar minha agenda diária ou semanal**.

## 🎯 Critérios de aceite (Gherkin)

### Cenário 1: listar appointments do tenant atual
**Dado** que existe um tenant com appointments confirmados,
**Quando** o administrador consulta a agenda com `startsAt` e `endsAt` UTC,
**Então** a API retorna os appointments que cruzam essa janela,
**E** cada item contém dados do serviço e do cliente.

### Cenário 2: impedir acesso anônimo
**Dado** que a requisição não possui sessão administrativa,
**Quando** ela consulta a agenda,
**Então** a API retorna 401.

### Cenário 3: preservar isolamento multi-tenant
**Dado** que outro tenant possui appointments no mesmo horário,
**Quando** o administrador consulta a agenda pelo host do tenant atual,
**Então** appointments de outros tenants não aparecem no resultado.

## 🔧 Considerações técnicas
- A API usa `GET /admin/calendar/appointments`.
- A janela é validada por Zod no pacote compartilhado.
- A consulta busca appointments que intersectam a janela: `appointment.startsAt < endsAt` e `appointment.endsAt > startsAt`.
- O join com `services` também filtra `tenant_id` para evitar vazamento por referência cruzada.

## 🔒 Considerações de segurança
- Endpoint protegido pela sessão Better Auth.
- Tenant vem do contexto resolvido pelo `Host`, nunca do body/query.
- Não retorna hash de token de gerenciamento.

## ♿ Considerações de acessibilidade
- Sem impacto direto nesta task, pois a entrega é API. A UI futura deve expor a agenda com navegação por teclado e textos legíveis.

## 🧪 Estratégia de teste
- Unit: use case exige tenant e encaminha a janela ao repositório.
- E2E: rota autenticada lista appointments do tenant e rejeita acesso anônimo.

## 🔗 Tasks
| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-admin-calendar-api.md) | Criar API administrativa de calendário | ✅ Done |

## 📚 Referências
- [ADR-001](../../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-002](../../../adrs/ADR-002-clean-architecture.md)
- [ADR-006](../../../adrs/ADR-006-timezone-utc.md)

## 📜 Ver [HISTORY.md](./HISTORY.md)
