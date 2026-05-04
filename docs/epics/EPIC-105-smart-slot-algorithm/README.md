# EPIC-105: Smart slot algorithm

**Status:** ✅ Done

## Objetivo

Calcular slots disponíveis para booking a partir de horários semanais, bloqueios e agendamentos existentes, sem depender de banco, API HTTP ou NestJS.

## Escopo

- Criar algoritmo puro no domínio backend.
- Receber timezone do tenant explicitamente.
- Converter horários semanais locais para intervalos UTC em memória.
- Gerar candidatos em passos iguais à duração do serviço solicitado.
- Remover candidatos que conflitam com bloqueios ou agendamentos existentes.
- Ordenar slots priorizando adjacência, menor buraco operacional e horário crescente.
- Cobrir o comportamento com testes unitários de domínio.

## Não inclui

- Persistência de appointments.
- Endpoint HTTP público ou administrativo.
- Integração com repositórios Drizzle.
- UI de booking.
- Gestão de múltiplos profissionais.

## User stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-calculate-available-slots/) | Calcular slots disponíveis | ✅ Done |
