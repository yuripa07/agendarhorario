# Histórico: US-001 Visualizar agenda administrativa

## 2026-05-05 21:11

**Resumo:** Planejada UI administrativa inicial com login email/senha e agenda em visões de dia e semana.

**Decisões:** Login apenas para admins existentes; cadastro, recovery e onboarding ficam fora do escopo. A UI deve usar sessão Better Auth via cookie e base de API tenant-aware com `VITE_API_URL` como override.

**Validações:** Ainda não executadas.

**Ajustes futuros:** CRUD de serviços, disponibilidade, branding e ações administrativas sobre appointments.
