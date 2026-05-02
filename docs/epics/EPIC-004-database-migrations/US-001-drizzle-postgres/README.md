# US-001: Configurar banco e migrations

**Épico pai:** [EPIC-004](../README.md)
**Status:** ✅ Done
**Estimativa:** 4 horas
**Criado em:** 2026-05-02

## 📖 Narrativa

> Como **desenvolvedor**,
> Eu quero **Postgres e Drizzle configurados**,
> Para que **o domínio multi-tenant tenha persistência versionada**.

## 🎯 Critérios de aceite

### Cenário 1: Migration

**Dado** o Postgres local rodando,
**Quando** executo `pnpm db:migrate`,
**Então** a tabela `tenants` é criada.

## 🔧 Considerações técnicas

- Timestamps com timezone.
- `tenants` é raiz do isolamento lógico.

## 🧪 Estratégia de teste

- Migration validada via comando local/CI.

## 🔗 Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-drizzle-postgres.md) | Criar schema tenants | ✅ |
