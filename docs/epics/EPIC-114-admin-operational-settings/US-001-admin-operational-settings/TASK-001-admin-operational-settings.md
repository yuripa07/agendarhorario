# TASK-001: Admin operational settings

**Status:** ✅ Done

## Checklist

1. [x] Criar documentacao da EPIC-114.
2. [x] Refatorar admin web para shell compartilhado.
3. [x] Adicionar navegacao entre Agenda, Servicos, Disponibilidade e Branding.
4. [x] Estender `admin-client` com APIs de servicos.
5. [x] Estender `admin-client` com APIs de disponibilidade e bloqueios.
6. [x] Estender `admin-client` com APIs de branding.
7. [x] Implementar pagina `/admin/services`.
8. [x] Implementar pagina `/admin/availability`.
9. [x] Implementar pagina `/admin/branding`.
10. [x] Adicionar testes de componentes.
11. [x] Adicionar E2E mockado.
12. [x] Executar validacoes finais.

## Contratos usados

- `GET/POST/PATCH/DELETE /admin/services`
- `GET/PUT /admin/availability/working-hours`
- `GET/POST/DELETE /admin/availability/blocks`
- `GET/PATCH /admin/tenant/branding`
- `GET /admin/session`

