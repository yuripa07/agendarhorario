# US-001: Gerenciar catálogo de serviços

**Status:** ✅ Done

## História

Como prestador administrador, quero criar e manter meus serviços para que clientes possam escolher o serviço correto no agendamento.

## Critérios de aceite

- Dado um admin autenticado em um tenant, ele pode criar serviço com nome, duração e preço.
- Dado um tenant, a listagem retorna apenas serviços daquele tenant.
- Dado um serviço existente do tenant, o admin pode consultar e atualizar seus dados.
- Dado um serviço existente, a remoção desativa o serviço em vez de apagar o registro.
- Dado outro tenant, nenhum endpoint retorna ou altera serviço fora do tenant atual.

## Considerações técnicas

- Toda tabela de domínio deve ter `tenant_id NOT NULL`.
- O preço será persistido em centavos (`price_cents`) para evitar ponto flutuante.
- A exclusão inicial será soft-delete via `is_active = false`.
- Os endpoints ficam sob `/admin/services` e exigem sessão Better Auth.

## Estratégia de teste

- Unit: regras de domínio e use cases.
- Integration: repositório Drizzle com filtro obrigatório por `tenant_id`.
- E2E API: smoke de proteção e fluxo CRUD principal quando viável.

## Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-service-domain-and-schema.md) | Criar domínio, schemas e migration | ✅ Done |
| [TASK-002](./TASK-002-service-repository-and-use-cases.md) | Criar repositório e use cases | ✅ Done |
| [TASK-003](./TASK-003-service-admin-http-api.md) | Expor API administrativa | ✅ Done |

## Ver [HISTORY.md](./HISTORY.md)
