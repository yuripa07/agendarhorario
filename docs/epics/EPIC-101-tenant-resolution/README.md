# EPIC-101: Tenant resolution

**Status:** ✅ Done

## Objetivo

Resolver o tenant a partir do subdomínio do `Host` header e disponibilizar o contexto do tenant para a API durante a requisição.

## Escopo

- Normalizar `Host` header com suporte a porta e valores encaminhados por proxy.
- Resolver subdomínios de produção em `*.agendarhorario.com.br`.
- Resolver subdomínios locais em `*.localhost` e `*.localtest.me`.
- Ignorar domínio raiz e subdomínios reservados como `app` e `www`.
- Buscar o tenant pelo `slug` no banco.
- Gravar `tenantId`, `tenantSlug` e `host` em `AsyncLocalStorage`.
- Retornar 404 quando o subdomínio aponta para tenant inexistente.
- Manter `/health` sem dependência de tenant.

## User stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-subdomain-resolution/) | Resolver tenant por subdomínio | ✅ Done |
