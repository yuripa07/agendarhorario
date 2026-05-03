# EPIC-102: Auth admin

**Status:** ✅ Done

## Objetivo

Adicionar autenticação administrativa com Better Auth para proteger as próximas funcionalidades do painel do prestador.

## Escopo

- Configurar Better Auth no NestJS usando o adapter Drizzle.
- Persistir usuários, sessões, contas e verificações no PostgreSQL.
- Habilitar login com email e senha.
- Preparar recovery de senha com sender stub em dev/test.
- Proteger rotas administrativas por sessão.
- Manter `/health` público.

## Não inclui

- Envio real de email via Resend.
- Google OAuth.
- Tela de login no frontend.
- Permissões avançadas por tenant.

## User stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-admin-email-password/) | Autenticar administrador com email e senha | ✅ Done |

