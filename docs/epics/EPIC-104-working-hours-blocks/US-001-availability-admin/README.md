# US-001: Configurar disponibilidade administrativa

**Status:** ✅ Done

## História

Como prestador administrador, quero configurar meus horários de atendimento e bloqueios para que o sistema saiba quando pode oferecer agendamentos.

## Critérios de aceite

- Dado um admin autenticado em um tenant, ele pode substituir a grade semanal de horários.
- Dado um tenant, a listagem retorna apenas horários daquele tenant.
- Dado um admin autenticado em um tenant, ele pode criar bloqueios com início, fim e motivo opcional.
- Dado um tenant, a listagem retorna apenas bloqueios daquele tenant.
- Dado outro tenant, nenhum endpoint retorna ou altera disponibilidade fora do tenant atual.

## Considerações técnicas

- Horários semanais usam minutos desde meia-noite local do tenant.
- Bloqueios usam `timestamp with time zone`, persistidos em UTC conforme ADR-006.
- Um dia pode ter múltiplos intervalos.
- `PUT /admin/availability/working-hours` substitui a grade semanal inteira do tenant.
- `DELETE /admin/availability/blocks/:id` remove fisicamente o bloqueio.

## Estratégia de teste

- Unit: schemas e use cases.
- Integration: repositório Drizzle com filtro obrigatório por `tenant_id`.
- E2E API: proteção, substituição de horários, fluxo de bloqueio e isolamento por tenant.

## Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-availability-domain-and-schema.md) | Criar domínio, schemas e migration | ✅ Done |
| [TASK-002](./TASK-002-availability-repository-and-use-cases.md) | Criar repositório e use cases | ✅ Done |
| [TASK-003](./TASK-003-availability-admin-http-api.md) | Expor API administrativa | ✅ Done |

## Ver [HISTORY.md](./HISTORY.md)
