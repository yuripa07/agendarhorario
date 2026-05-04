# TASK-002: Persistir appointments e proteger sobreposição

**Status:** 🚧 In progress
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Persistir appointments confirmados com token de gerenciamento hasheado e impedir sobreposição ativa por tenant no PostgreSQL.

## Passos de execução

1. [ ] Criar tabela `appointments`.
2. [ ] Adicionar exclusion constraint por `tenant_id` e `tstzrange(starts_at, ends_at)`.
3. [ ] Persistir token de gerenciamento apenas como hash.
4. [ ] Permitir reuso de slot após cancelamento.

## Definition of Done

- [ ] Migration Drizzle criada.
- [ ] Schema Drizzle atualizado.
- [ ] Teste de integração cobre persistência, token e constraint.
