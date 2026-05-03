# TASK-001: Criar domínio, schemas e migration

**Status:** ✅ Done
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Definir o contrato do catálogo de serviços em domínio, schemas compartilhados e banco.

## Passos de execução

1. [x] Criar schemas Zod em `packages/shared`.
2. [x] Criar tabela `services` com `tenant_id NOT NULL`.
3. [x] Gerar migration Drizzle.
4. [x] Adicionar testes de validação/domínio.

## Definition of Done

- [x] Schemas exportados por `@agendarhorario/shared`.
- [x] Migration versionada.
- [x] Testes relevantes passando.
