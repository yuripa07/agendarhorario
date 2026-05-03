# US-001: Autenticar administrador com email e senha

**Status:** ✅ Done

## História

Como prestador administrador, quero autenticar com email e senha para acessar rotas administrativas do sistema.

## Critérios de aceite

- Dado um endpoint administrativo, uma requisição sem sessão é rejeitada.
- Dado `/health`, a API continua respondendo sem sessão.
- Dado um reset de senha, o sistema gera o link e chama uma porta de envio sem logar o token.
- Dados os scripts de banco, as tabelas necessárias do Better Auth são versionadas por migration Drizzle.

## Considerações técnicas

- A integração usa `@thallesp/nestjs-better-auth`, conforme documentação oficial da Better Auth para NestJS.
- O bootstrap NestJS desabilita o body parser nativo para permitir que o módulo Better Auth controle parsing de body.
- O envio real de email fica para o EPIC-110; nesta etapa o sender é um stub injetável.

## Estratégia de teste

- Unit: sender stub não deve registrar URL/token de recovery.
- E2E API: `/health` público e `/admin/session` rejeitando requisição anônima.
- Validação geral: `pnpm lint`, `pnpm typecheck`, `pnpm test`.

## Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-admin-auth.md) | Implementar autenticação administrativa | ✅ Done |

## Ver [HISTORY.md](./HISTORY.md)

