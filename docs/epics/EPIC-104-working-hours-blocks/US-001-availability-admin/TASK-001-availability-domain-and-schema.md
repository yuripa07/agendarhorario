# TASK-001: Criar domínio, schemas e migration

**Status:** ✅ Done
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Definir o contrato de disponibilidade em schemas compartilhados e banco.

## Passos de execução

1. [x] Criar schemas Zod em `packages/shared`.
2. [x] Criar tabela `working_hours` com `tenant_id NOT NULL`.
3. [x] Criar tabela `availability_blocks` com `tenant_id NOT NULL`.
4. [x] Gerar migration Drizzle.
5. [x] Adicionar testes de validação.

## Definition of Done

- [x] Schemas exportados por `@agendarhorario/shared`.
- [x] Migration versionada.
- [x] Testes relevantes passando.
