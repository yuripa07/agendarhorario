# TASK-001: Criar login e agenda administrativa

**US pai:** [US-001](./README.md)
**Status:** 🚧 Planned
**Tipo:** feature
**Atribuído a:** Codex

## 🎯 Objetivo

Implementar login administrativo mínimo e página `/admin/calendar` no web app, consumindo sessão Better Auth e o endpoint administrativo de calendário existente.

## 📋 Passos de execução

1. [ ] Criar documentação inicial do EPIC-113, US e task.
2. [ ] Criar testes de componente inicialmente falhando para login, proteção de rota e calendário.
3. [ ] Criar E2E web mockado inicialmente falhando para login e agenda.
4. [ ] Criar helper compartilhado para base URL da API tenant-aware.
5. [ ] Atualizar clients públicos para usar o helper compartilhado sem mudar comportamento esperado.
6. [ ] Criar client HTTP administrativo com sessão via cookies.
7. [ ] Adicionar rotas `/admin/login` e `/admin/calendar`.
8. [ ] Criar tela de login com estados de loading e erro.
9. [ ] Criar shell administrativo mínimo com logout.
10. [ ] Criar agenda com visão dia/semana e navegação.
11. [ ] Tratar estados de loading, vazio, erro e sessão expirada.
12. [ ] Ajustar proxy `/api` para encaminhar chamadas à API sem prefixo em produção.
13. [ ] Rodar validações finais.
14. [ ] Atualizar documentação final e histórico com horário.

## ✅ Definition of Done

- [ ] `/admin/login` envia credenciais para Better Auth.
- [ ] `/admin/calendar` exige sessão administrativa.
- [ ] Logout encerra sessão e volta para login.
- [ ] Agenda diária consulta janela UTC correta.
- [ ] Agenda semanal consulta janela UTC correta.
- [ ] Appointments mostram cliente, serviço, contato, horário e status.
- [ ] Appointments cancelados têm tratamento visual distinto.
- [ ] `401` redireciona para login.
- [ ] `VITE_API_URL` continua funcionando como override.
- [ ] Proxy `/api` está compatível com produção.
- [ ] `pnpm --filter @agendarhorario/web lint` passa.
- [ ] `pnpm --filter @agendarhorario/web typecheck` passa.
- [ ] `pnpm --filter @agendarhorario/web test` passa.
- [ ] `pnpm --filter @agendarhorario/web test:e2e` passa.

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
