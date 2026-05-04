# ADR-011: Algoritmo puro de slots disponíveis

**Status:** Accepted
**Data:** 2026-05-03
**Decididores:** Yuri

## Contexto

O booking precisa sugerir horários disponíveis sem criar buracos ruins na operação. A base de horários semanais e bloqueios já existe, mas a API pública e a persistência de appointments serão tratadas em épico posterior.

## Decisão

Implementar o cálculo de slots como serviço de domínio puro, recebendo todos os dados em memória e sem depender de NestJS, Drizzle ou banco.

A entrada deve receber timezone do tenant, janela UTC de busca, duração do serviço solicitado, menor duração de serviço ativo, horários semanais locais, bloqueios e agendamentos existentes. O algoritmo converte os horários semanais locais para intervalos UTC, gera candidatos em passos iguais à duração do serviço, remove conflitos e ordena o resultado por adjacência a agendamentos existentes, menor buraco operacional e horário crescente.

A saída deve expor `startsAt`, `endsAt`, `score` e `isAdjacent`. Horas locais não devem ser persistidas.

## Alternativas consideradas

- **Calcular direto no banco:** pode ser eficiente, mas acopla regra de domínio a SQL antes de estabilizar o comportamento.
- **Criar endpoint junto com o algoritmo:** entrega fluxo completo, mas mistura contrato público com uma regra ainda isolável.
- **Persistir hora local:** simples para leitura humana, mas contradiz ADR-006 e aumenta risco em fusos e transições de dia.

## Consequências

### Positivas

- Algoritmo testável com unit tests rápidos.
- Contrato preparado para EPIC-106 consumir sem reescrever regra.
- Timezone explícito reduz ambiguidade de cálculo.

### Negativas

- O chamador precisa carregar bloqueios e agendamentos antes de executar o cálculo.
- A otimização por banco fica adiada para quando houver volume real.
