# TASK-003: Implementar algoritmo puro

**Status:** ✅ Done
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Implementar o cálculo de slots disponíveis sem dependências de framework ou banco.

## Passos de execução

1. [x] Converter horários semanais locais para intervalos UTC usando timezone do tenant.
2. [x] Gerar candidatos em passos iguais à duração do serviço.
3. [x] Filtrar colisões com bloqueios e agendamentos.
4. [x] Calcular adjacência e score.
5. [x] Ordenar por adjacência, menor buraco operacional e horário crescente.

## Definition of Done

- [x] Serviço de domínio puro implementado.
- [x] Sem NestJS, Drizzle ou acesso a banco.
