# TASK-001: Implementar autenticação administrativa

**Status:** ✅ Done
**Tipo:** feature
**Atribuído a:** Codex

## Objetivo

Configurar Better Auth no backend e expor uma base protegida para rotas administrativas.

## Passos de execução

1. [x] Adicionar dependências Better Auth.
2. [x] Configurar adapter Drizzle e módulo NestJS.
3. [x] Adicionar tabelas e migration.
4. [x] Criar sender stub para recovery.
5. [x] Proteger endpoint administrativo de sessão.
6. [x] Manter health público.
7. [x] Adicionar testes unitários e E2E.

## Definition of Done

- [x] Código implementado.
- [x] Testes adicionados.
- [x] Documentação atualizada.
- [x] Migration versionada.

## Arquivos afetados

- `apps/api/src/auth/`
- `apps/api/src/infrastructure/database/schema.ts`
- `docs/epics/EPIC-102-auth-admin/`

