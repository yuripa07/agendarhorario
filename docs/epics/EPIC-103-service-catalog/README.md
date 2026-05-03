# EPIC-103: Service catalog

**Status:** 🟢 Active

## Objetivo

Permitir que o prestador administre os serviços oferecidos pelo tenant, com duração e preço, para alimentar o futuro fluxo de agendamento.

## Escopo

- Criar modelo persistido de serviços com isolamento por `tenant_id`.
- Expor CRUD administrativo protegido por autenticação.
- Validar entrada e saída com schemas Zod compartilhados.
- Garantir que todas as operações usem o contexto do tenant resolvido pelo host.

## Não inclui

- UI administrativa no frontend.
- Fluxo público de booking.
- Algoritmo de slots.
- Categorias, imagens ou múltiplos profissionais.

## User stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-service-crud/) | Gerenciar catálogo de serviços | 🟢 In progress |

