# EPIC-116: Tenant onboarding

**Status:** ✅ Done
**Owner:** Yuri
**Criado em:** 2026-05-06
**Última atualização:** 2026-05-06 20:37

## Objetivo

Permitir provisionar um tenant e seu primeiro admin por convite controlado, sem depender de edicao manual no banco.

## Contexto e motivação

O produto ja possui fluxo publico de booking, painel administrativo, configuracoes operacionais e acoes sobre agenda. Ainda falta um caminho seguro para criar novos tenants e vincular o usuario administrativo ao tenant correto.

Hoje os testes criam usuarios e tenants diretamente, e o guia operacional ainda descreve criacao manual de tenant. Isso nao e suficiente para operar o MVP com previsibilidade.

## Escopo

### Inclui

- Convite de onboarding com token de uso unico.
- CLI operacional para criar tenant e convite inicial.
- Aceite de convite por UI em `/admin/onboarding`.
- Criacao do primeiro admin do tenant.
- Vinculo persistente entre admin e tenant.
- Bloqueio de endpoints admin quando o usuario autenticado nao pertence ao tenant do `Host`.
- Atualizacao do guia de criacao de tenant.
- Testes automatizados de API, UI e E2E.

### Não inclui (explicitamente)

- Cadastro publico aberto.
- Billing.
- Convite de membros adicionais.
- Papeis administrativos granulares.
- Custom domain.
- Upload de logo.

## Critérios de pronto

- [x] Operador cria convite por CLI sem gravar token puro.
- [x] Convite valido permite criar o primeiro admin do tenant.
- [x] Convite invalido, expirado ou usado e rejeitado.
- [x] Convite so pode ser usado uma vez.
- [x] Usuario autenticado so acessa endpoints admin dos tenants vinculados.
- [x] Usuario autenticado sem vinculo recebe `403`.
- [x] Usuario anonimo continua recebendo `401`.
- [x] UI de onboarding trata estados de carregamento, erro e sucesso.
- [x] Guia operacional descreve o novo fluxo.
- [x] Testes automatizados passam localmente.

## User Stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-tenant-onboarding/) | Provisionar tenant por convite | ✅ Done |

## ADRs relacionados

- [ADR-001](../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-003](../../adrs/ADR-003-better-auth-choice.md)
- [ADR-006](../../adrs/ADR-006-timezone-utc.md)
- [ADR-007](../../adrs/ADR-007-frontend-stack.md)
- [ADR-010](../../adrs/ADR-010-documentation-model.md)

## Histórico

- 2026-05-06: planejado onboarding controlado de tenant por convite.
- 2026-05-06 20:37: implementado onboarding controlado por convite com CLI, UI, membership admin-tenant e autorizacao por tenant.
