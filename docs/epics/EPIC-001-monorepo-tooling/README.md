# EPIC-001: Monorepo & tooling

**Status:** ✅ Done
**Owner:** Yuri
**Criado em:** 2026-05-02
**Última atualização:** 2026-05-02

## 🎯 Objetivo

Preparar o repositório com pnpm workspaces, TypeScript estrito, Biome, hooks e convenções de release.

## 📋 Contexto e motivação

A Fase 0 precisa de uma base previsível para API, web e pacotes compartilhados.

## 🎁 Escopo

### Inclui

- Workspaces pnpm.
- Configuração TypeScript base.
- Biome, Husky, lint-staged, commitlint e Changesets.

### Não inclui

- Publicação de pacotes.

## ✅ Critérios de pronto

- [x] Scripts raiz funcionam.
- [x] Workspaces criados.
- [x] Convenções documentadas.

## 🔗 User Stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-monorepo-setup/) | Configurar monorepo | ✅ |

## 📚 ADRs relacionados

- [ADR-005](../../adrs/ADR-005-monorepo-pnpm.md)

## 📜 Histórico

- 2026-05-02: criado.
