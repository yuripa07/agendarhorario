# TASK-001: Criar domínio, schemas e migration

**Status:** 🟡 To do
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Definir o contrato do catálogo de serviços em domínio, schemas compartilhados e banco.

## Passos de execução

1. [ ] Criar schemas Zod em `packages/shared`.
2. [ ] Criar tabela `services` com `tenant_id NOT NULL`.
3. [ ] Gerar migration Drizzle.
4. [ ] Adicionar testes de validação/domínio.

## Definition of Done

- [ ] Schemas exportados por `@agendarhorario/shared`.
- [ ] Migration versionada.
- [ ] Testes relevantes passando.

