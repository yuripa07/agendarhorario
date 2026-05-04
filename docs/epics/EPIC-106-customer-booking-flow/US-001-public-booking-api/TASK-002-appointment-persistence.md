# TASK-002: Persistir appointments e proteger sobreposição

**Status:** ✅ Done
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Persistir appointments confirmados com token de gerenciamento hasheado e impedir sobreposição ativa por tenant no PostgreSQL.

## Passos de execução

1. [x] Criar tabela `appointments`.
2. [x] Adicionar exclusion constraint por `tenant_id` e `tstzrange(starts_at, ends_at)`.
3. [x] Persistir token de gerenciamento apenas como hash.
4. [x] Permitir reuso de slot após cancelamento.

## Definition of Done

- [x] Migration Drizzle criada.
- [x] Schema Drizzle atualizado.
- [x] Teste de integração cobre persistência, token e constraint.
