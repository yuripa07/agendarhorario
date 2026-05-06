# Histórico: US-001 Visualizar agenda administrativa

## 2026-05-05 21:11

**Resumo:** Planejada UI administrativa inicial com login email/senha e agenda em visões de dia e semana.

**Decisões:** Login apenas para admins existentes; cadastro, recovery e onboarding ficam fora do escopo. A UI deve usar sessão Better Auth via cookie e base de API tenant-aware com `VITE_API_URL` como override.

**Validações:** Ainda não executadas.

**Ajustes futuros:** CRUD de serviços, disponibilidade, branding e ações administrativas sobre appointments.

## 2026-05-05 21:18

**Resumo:** Implementadas as rotas `/admin/login` e `/admin/calendar`, client administrativo com cookies de sessão, helper compartilhado de API tenant-aware e agenda em visões de dia e semana.

**Decisões:** A data inicial da agenda pode ser fixada por query `date=YYYY-MM-DD` para testes e links; sem query, a tela abre no dia atual. Em desenvolvimento, a API é derivada do host atual na porta `3000`; em produção, usa `/api`.

**Validações:** `pnpm --filter @agendarhorario/web lint`, `typecheck`, `test` e `test:e2e`.

**Ajustes futuros:** Criar fluxo de provisionamento de admin/tenant e conectar as próximas telas administrativas de serviços, disponibilidade e branding.
