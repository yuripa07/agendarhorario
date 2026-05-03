# EPIC-104: Working hours & blocks

**Status:** ✅ Done

## Objetivo

Permitir que o prestador configure horários recorrentes de atendimento e bloqueios pontuais da agenda do tenant, criando a base para o cálculo futuro de slots.

## Escopo

- Criar modelo persistido de horários semanais com isolamento por `tenant_id`.
- Criar modelo persistido de bloqueios com início e fim em UTC.
- Expor API administrativa protegida por autenticação.
- Validar entrada e saída com schemas Zod compartilhados.
- Garantir que todas as operações usem o contexto do tenant resolvido pelo host.

## Não inclui

- UI administrativa no frontend.
- Cálculo de slots disponíveis.
- Fluxo público de booking.
- Gestão de múltiplos profissionais.

## User stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-availability-admin/) | Configurar disponibilidade administrativa | ✅ Done |
