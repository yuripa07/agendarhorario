# TASK-001: Admin calendar actions

**Status:** ✅ Done

## Checklist

1. [x] Criar documentacao da EPIC-115.
2. [x] Adicionar schemas compartilhados para criar e remarcar appointment admin.
3. [x] Estender use cases e repositorio admin de calendario.
4. [x] Expor endpoints admin de slots, criacao, remarcacao e cancelamento.
5. [x] Reaproveitar calculo de slots e notificacoes existentes.
6. [x] Estender `admin-client` no web app.
7. [x] Adicionar modais e acoes na pagina `/admin/calendar`.
8. [x] Cobrir API com unit e E2E.
9. [x] Cobrir UI com component tests e Playwright mockado.
10. [x] Executar validacoes finais.

## Contratos usados

- `GET /admin/calendar/services/:serviceId/slots?startsAt=...&endsAt=...`
- `POST /admin/calendar/appointments`
- `POST /admin/calendar/appointments/:id/reschedule`
- `POST /admin/calendar/appointments/:id/cancel`

