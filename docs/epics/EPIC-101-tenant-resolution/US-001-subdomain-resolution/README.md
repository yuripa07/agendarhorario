# US-001: Resolver tenant por subdomínio

**Status:** ✅ Done

## História

Como API multi-tenant, quero resolver o tenant a partir do subdomínio para que as próximas features possam aplicar isolamento lógico por `tenant_id`.

## Critérios de aceite

- Dado `cliente.agendarhorario.com.br`, o slug resolvido é `cliente`.
- Dado `cliente.localhost:3000` ou `cliente.localtest.me`, o slug resolvido é `cliente`.
- Dado `agendarhorario.com.br`, `app.agendarhorario.com.br` ou `www.agendarhorario.com.br`, nenhum tenant é exigido.
- Dado um tenant inexistente, a API retorna erro 404.
- O contexto fica disponível durante a cadeia assíncrona da requisição.
- `/health` continua funcionando sem tenant.

## Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-tenant-resolution.md) | Implementar tenant resolution | ✅ Done |
