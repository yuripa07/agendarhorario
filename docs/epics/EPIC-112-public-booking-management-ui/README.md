# EPIC-112: Public booking management UI

**Status:** ✅ Done
**Owner:** Yuri
**Criado em:** 2026-05-05 19:04
**Última atualização:** 2026-05-05 19:04

## 🎯 Objetivo

Permitir que o cliente final consulte, cancele e remarque um agendamento existente pelo link de gerenciamento enviado por e-mail.

## 📋 Contexto e motivação

Os EPICs 106, 108 e 110 já entregaram consulta, cancelamento, remarcação por token e envio de e-mail com link `/booking/manage?token=...`. O EPIC-111 criou a UI pública de criação de booking, mas ainda faltava uma experiência web para o cliente usar esse link.

## 🎁 Escopo

### Inclui

- Página pública `/booking/manage`.
- Leitura do `token` pela query string.
- Consulta do appointment por token.
- Cancelamento com confirmação explícita.
- Remarcação para slot disponível do mesmo serviço.
- Tratamento de token ausente, inválido ou expirado.
- Estados de loading, erro, conflito e sucesso.
- Testes automatizados da UI pública de gerenciamento.

### Não inclui (explicitamente)

- Input manual de token.
- Login ou área administrativa.
- Novo token após remarcação.
- Pagamento.
- Múltiplos profissionais.
- Seleção avançada de datas.

## ✅ Critérios de pronto

- [x] `/booking/manage?token=...` carrega sem sessão administrativa.
- [x] A UI consulta `POST /public/bookings/management/lookup`.
- [x] Token ausente, inexistente ou expirado mostra mensagem recuperável sem expor detalhes internos.
- [x] O cliente consegue cancelar um appointment confirmado.
- [x] O cliente consegue remarcar para um slot disponível do mesmo serviço.
- [x] Conflito `409` na remarcação permite escolher outro horário.
- [x] A tela não expõe o token de gerenciamento.
- [x] Testes unitários/componentes e E2E passam localmente.

## 🔗 User Stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-public-booking-management/) | Gerenciar agendamento pelo link público | ✅ Done |

## 📚 ADRs relacionados

- [ADR-001](../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-006](../../adrs/ADR-006-timezone-utc.md)
- [ADR-007](../../adrs/ADR-007-frontend-stack.md)

## 📜 Histórico

- 2026-05-05 19:04: implementada UI pública de gerenciamento em `/booking/manage`.
