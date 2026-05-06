# TASK-001: Criar login e agenda administrativa

**US pai:** [US-001](./README.md)
**Status:** ✅ Done
**Tipo:** feature
**Atribuído a:** Codex

## 🎯 Objetivo

Implementar login administrativo mínimo e página `/admin/calendar` no web app, consumindo sessão Better Auth e o endpoint administrativo de calendário existente.

## 📋 Passos de execução

1. [x] Criar documentação inicial do EPIC-113, US e task.
2. [x] Criar testes de componente inicialmente falhando para login, proteção de rota e calendário.
3. [x] Criar E2E web mockado inicialmente falhando para login e agenda.
4. [x] Criar helper compartilhado para base URL da API tenant-aware.
5. [x] Atualizar clients públicos para usar o helper compartilhado sem mudar comportamento esperado.
6. [x] Criar client HTTP administrativo com sessão via cookies.
7. [x] Adicionar rotas `/admin/login` e `/admin/calendar`.
8. [x] Criar tela de login com estados de loading e erro.
9. [x] Criar shell administrativo mínimo com logout.
10. [x] Criar agenda com visão dia/semana e navegação.
11. [x] Tratar estados de loading, vazio, erro e sessão expirada.
12. [x] Ajustar proxy `/api` para encaminhar chamadas à API sem prefixo em produção.
13. [x] Rodar validações finais.
14. [x] Atualizar documentação final e histórico com horário.

## ✅ Definition of Done

- [x] `/admin/login` envia credenciais para Better Auth.
- [x] `/admin/calendar` exige sessão administrativa.
- [x] Logout encerra sessão e volta para login.
- [x] Agenda diária consulta janela UTC correta.
- [x] Agenda semanal consulta janela UTC correta.
- [x] Appointments mostram cliente, serviço, contato, horário e status.
- [x] Appointments cancelados têm tratamento visual distinto.
- [x] `401` redireciona para login.
- [x] `VITE_API_URL` continua funcionando como override.
- [x] Proxy `/api` está compatível com produção.
- [x] `pnpm --filter @agendarhorario/web lint` passa.
- [x] `pnpm --filter @agendarhorario/web typecheck` passa.
- [x] `pnpm --filter @agendarhorario/web test` passa.
- [x] `pnpm --filter @agendarhorario/web test:e2e` passa.

## 🔌 APIs e contratos

- `POST /auth/sign-in/email`
  - Body: `{ email, password }`.
  - Cria sessão Better Auth por cookie.
- `POST /auth/sign-out`
  - Encerra sessão atual.
- `GET /admin/session`
  - Retorna sessão autenticada ou `401`.
- `GET /admin/calendar/appointments?startsAt=...&endsAt=...`
  - Retorna `AdminCalendarAppointment[]`.

## 🧪 Testes planejados

- Componentes:
  - Login envia email/senha e redireciona.
  - Login inválido mostra erro.
  - Calendário redireciona anônimo para login.
  - Agenda diária consulta janela UTC correta.
  - Agenda semanal renderiza appointments agrupados por dia.
  - `401` durante carregamento redireciona para login.
- E2E:
  - Admin faz login e vê agenda semanal.
  - Anônimo em `/admin/calendar` volta para `/admin/login`.

## 🔍 Arquivos afetados estimados

- `apps/web/src/app/App.tsx`
- `apps/web/src/shared/api/api-base-url.ts`
- `apps/web/src/pages/admin/*`
- `apps/web/src/test/e2e/admin-calendar.spec.ts`
- `infra/caddy/Caddyfile`

## 📜 Log de execução

- 2026-05-05 21:11 — Planejado por Codex.
- 2026-05-05 21:18 — Implementado por Codex com testes de componente, E2E web e validações locais.
