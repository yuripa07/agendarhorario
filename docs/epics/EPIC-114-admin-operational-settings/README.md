# EPIC-114: Admin operational settings

**Status:** ✅ Done
**Owner:** Yuri
**Criado em:** 2026-05-05 21:40
**Última atualização:** 2026-05-05 21:40

## 🎯 Objetivo

Expandir o painel administrativo para configurar a operacao do tenant: servicos, disponibilidade semanal, bloqueios e branding minimo.

## 📋 Contexto e motivação

O backend ja possui APIs administrativas para catalogo de servicos, disponibilidade e branding. O painel web tinha apenas a agenda, deixando configuracoes operacionais dependentes de chamadas diretas a API.

## 🎁 Escopo

### Inclui

- Shell administrativo compartilhado com navegacao persistente.
- Rotas `/admin/calendar`, `/admin/services`, `/admin/availability` e `/admin/branding`.
- Listagem, criacao, edicao e desativacao de servicos.
- Listagem de servicos ativos e inativos com estado visual distinto.
- Editor semanal de disponibilidade com multiplos intervalos por dia.
- Substituicao da grade semanal via `PUT /admin/availability/working-hours`.
- Criacao e remocao de bloqueios.
- Edicao de `displayName` e `primaryColor`.
- Preview simples de branding.
- Protecao de sessao administrativa e redirecionamento para login em `401`.
- Testes automatizados de componentes e E2E mockado.

### Não inclui (explicitamente)

- Reativacao de servicos.
- Upload de logo.
- Edicao de timezone.
- Convite ou cadastro de admin.
- Permissoes administrativas avancadas.
- Novos contratos backend ou migrations.

## ✅ Critérios de pronto

- [x] Rotas admin usam shell compartilhado e navegacao persistente.
- [x] `/admin/calendar` preserva a agenda existente.
- [x] `/admin/services` lista ativos e inativos.
- [x] Admin cria, edita e desativa servicos.
- [x] `/admin/availability` renderiza multiplos intervalos por dia.
- [x] Admin salva a grade semanal completa.
- [x] Admin cria e remove bloqueios.
- [x] `/admin/branding` carrega, valida cor e salva branding.
- [x] Preview reflete nome e cor primaria.
- [x] `401` em paginas admin redireciona para `/admin/login`.
- [x] Testes automatizados passam localmente.

## 🔗 User Stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-admin-operational-settings/) | Configurar operacao administrativa | ✅ Done |

## 📚 ADRs relacionados

- [ADR-001](../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-006](../../adrs/ADR-006-timezone-utc.md)
- [ADR-007](../../adrs/ADR-007-frontend-stack.md)
- [ADR-010](../../adrs/ADR-010-documentation-model.md)

## 📜 Histórico

- 2026-05-05 21:40: implementado shell administrativo e telas de servicos, disponibilidade e branding.

