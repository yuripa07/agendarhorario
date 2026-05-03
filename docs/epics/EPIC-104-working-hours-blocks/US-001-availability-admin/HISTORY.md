# Histórico de US-001

## 2026-05-03 — TASK-001, TASK-002 e TASK-003 concluídas

**Por:** Codex

**Resumo:** Implementada API backend de disponibilidade com horários semanais, bloqueios, schemas compartilhados, migration Drizzle, use cases, repositório tenant-aware e endpoints administrativos em `/admin/availability`.

**Decisões tomadas:** Horários recorrentes são persistidos como minutos desde meia-noite local do tenant; bloqueios são persistidos como timestamps UTC; `PUT /working-hours` substitui a grade semanal inteira.

**Ajustes necessários no futuro:** Usar disponibilidade e serviços ativos no algoritmo de slots e conectar a configuração à UI administrativa.
