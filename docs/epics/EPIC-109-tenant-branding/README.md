# EPIC-109: Tenant branding

**Status:** 🟢 Active
**Owner:** Yuri
**Criado em:** 2026-05-04
**Última atualização:** 2026-05-04

## 🎯 Objetivo

Permitir configurar e consultar o branding mínimo do tenant para que interfaces administrativas e públicas possam exibir nome e cor primária corretos.

## 📋 Contexto e motivação

A tabela `tenants` já possui `displayName` e `primaryColor`, mas ainda não existe contrato HTTP para o admin configurar esses dados nem endpoint público para a UI de booking consumir o branding do tenant resolvido pelo `Host`.

## 🎁 Escopo

### Inclui

- Schemas compartilhados para branding do tenant.
- API administrativa protegida para consultar e atualizar nome e cor primária.
- API pública para consultar branding do tenant resolvido pelo `Host`.
- Testes unitários e E2E do backend.

### Não inclui (explicitamente)

- Logo, upload ou storage de arquivos.
- Migration.
- UI administrativa ou pública.
- Customização de fontes, layouts ou textos.

## ✅ Critérios de pronto

- [ ] `GET /admin/tenant/branding` retorna `displayName` e `primaryColor` do tenant atual.
- [ ] `PATCH /admin/tenant/branding` atualiza `displayName` e `primaryColor`.
- [ ] `GET /public/tenant/branding` retorna branding sem exigir sessão.
- [ ] Rotas usam o tenant resolvido pelo `Host`.
- [ ] `primaryColor` aceita apenas hex `#RRGGBB`.
- [ ] Testes automatizados passam localmente.

## 🔗 User Stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-tenant-branding-backend/) | Configurar branding mínimo do tenant | 🟢 |

## 📚 ADRs relacionados

- [ADR-001](../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-002](../../adrs/ADR-002-clean-architecture.md)

## 📜 Histórico

- 2026-05-04: criado escopo backend de branding mínimo do tenant.
