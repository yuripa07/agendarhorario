# EPIC-113: Admin calendar UI

**Status:** ✅ Done
**Owner:** Yuri
**Criado em:** 2026-05-05 21:11
**Última atualização:** 2026-05-05 21:18

## 🎯 Objetivo

Criar a primeira área administrativa web usável para que o prestador faça login e visualize a agenda diária/semanal do tenant.

## 📋 Contexto e motivação

O backend já possui autenticação administrativa com Better Auth e endpoint protegido para listar appointments por janela UTC. Ainda não existe UI administrativa no frontend, então o prestador não consegue acessar a agenda sem chamadas diretas à API.

## 🎁 Escopo

### Inclui

- Login administrativo com email e senha.
- Proteção de rota administrativa por sessão.
- Shell administrativo mínimo.
- Página `/admin/calendar`.
- Visões de dia e semana.
- Navegação anterior, hoje e próximo.
- Listagem de appointments do tenant com dados de serviço e cliente.
- Estados de loading, vazio, erro e sessão expirada.
- Base URL da API tenant-aware com `VITE_API_URL` como override.
- Ajuste de proxy `/api` para produção.
- Testes automatizados da UI administrativa.

### Não inclui (explicitamente)

- Cadastro/onboarding de admin.
- Recuperação de senha.
- Associação usuário-tenant avançada.
- CRUD de serviços, disponibilidade ou branding.
- Criação manual de appointment.
- Drag and drop ou remarcação pelo admin.
- Múltiplos profissionais.

## ✅ Critérios de pronto

- [x] `/admin/login` autentica com email e senha.
- [x] `/admin/calendar` redireciona usuário anônimo para login.
- [x] Usuário autenticado acessa a agenda sem novo login.
- [x] A agenda consulta `GET /admin/calendar/appointments`.
- [x] A visão diária usa janela UTC do dia selecionado.
- [x] A visão semanal usa janela UTC da semana selecionada.
- [x] Appointments confirmados e cancelados aparecem diferenciados.
- [x] Erros de autenticação e carregamento são recuperáveis.
- [x] A UI usa API tenant-aware e mantém `VITE_API_URL` como override.
- [x] Testes automatizados passam localmente.

## 🔗 User Stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-admin-calendar-web/) | Visualizar agenda administrativa | ✅ Done |

## 📚 ADRs relacionados

- [ADR-001](../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-006](../../adrs/ADR-006-timezone-utc.md)
- [ADR-007](../../adrs/ADR-007-frontend-stack.md)
- [ADR-010](../../adrs/ADR-010-documentation-model.md)

## 📜 Histórico

- 2026-05-05 21:11: planejado login administrativo mínimo e UI de agenda dia/semana.
- 2026-05-05 21:18: implementada UI administrativa de login e agenda dia/semana.
