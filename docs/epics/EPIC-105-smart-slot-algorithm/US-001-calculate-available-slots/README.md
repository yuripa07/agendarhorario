# US-001: Calcular slots disponíveis

**Status:** ✅ Done

## História

Como cliente final, quero ver horários disponíveis calculados com base na agenda real do prestador para escolher um horário que reduza buracos operacionais.

## Critérios de aceite

- Dada uma janela de busca UTC, o algoritmo retorna apenas slots dentro da janela.
- Dado um timezone de tenant, horários semanais locais são convertidos para UTC antes do cálculo.
- Dados bloqueios, nenhum slot retornado colide com bloqueios.
- Dados agendamentos existentes, nenhum slot retornado colide com agendamentos.
- Dados agendamentos existentes, slots adjacentes são priorizados.
- Dados slots que deixam buraco menor que o menor serviço ativo, esses slots recebem penalidade de ordenação.
- Dado empate de score, slots são ordenados por horário crescente.

## Considerações técnicas

- Não persistir hora local.
- Representar agendamentos existentes apenas como intervalos em memória neste épico.
- Manter o algoritmo sem NestJS, Drizzle ou acesso a banco.
- Expor saída mínima com `startsAt`, `endsAt`, `score` e `isAdjacent`.
- Usar `date-fns` e `date-fns-tz` para conversões explícitas de timezone.

## Estratégia de teste

- Unit: agenda vazia, múltiplos intervalos no mesmo dia, bloqueios, conflitos com agendamentos, adjacência, ordenação, buracos menores que o menor serviço, timezone `America/Sao_Paulo`, transição de dia e janelas UTC.

## Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-smart-slot-adr.md) | Registrar ADR do algoritmo | ✅ Done |
| [TASK-002](./TASK-002-slot-domain-contract.md) | Criar domínio e contratos do algoritmo | ✅ Done |
| [TASK-003](./TASK-003-slot-algorithm.md) | Implementar algoritmo puro | ✅ Done |
| [TASK-004](./TASK-004-slot-tests.md) | Cobrir algoritmo com testes unitários | ✅ Done |

## Ver [HISTORY.md](./HISTORY.md)
