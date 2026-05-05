# Histórico: US-001 Agendar pelo fluxo público web

## 2026-05-05

**Resumo:** Implementada a página pública `/booking` no web app com fluxo em etapas para escolher serviço, escolher horário, preencher dados do cliente e confirmar agendamento.

**Decisões:** A UI usa `VITE_API_URL` com fallback `http://localhost:3000`, TanStack Query para branding/serviços/slots, React Hook Form + Zod para validação e schemas de `@agendarhorario/shared` para payloads e respostas.

**Validações:** Foram adicionados testes de componente para branding, seleção de serviço, slots, validação, payload, conflito `409` e confirmação sem token. Também foi adicionado E2E web cobrindo criação completa em `/booking`.

**Ajustes futuros:** Adicionar seleção explícita de data, internacionalização/acentuação completa do texto público e evoluir `/booking/manage` em épico próprio.
