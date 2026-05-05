# EPIC-111: Public booking UI

**Status:** 📝 Planned
**Owner:** Yuri
**Criado em:** 2026-05-05
**Última atualização:** 2026-05-05

## 🎯 Objetivo

Criar a interface pública de agendamento para que o cliente final escolha um serviço ativo, selecione um horário disponível, informe seus dados e confirme o booking sem sessão administrativa.

## 📋 Contexto e motivação

O backend já expõe APIs públicas para branding do tenant, serviços ativos, slots disponíveis e criação de booking. O EPIC-110 também passou a enviar e-mail de confirmação com link futuro de gerenciamento. Falta uma experiência web real em `/booking` para transformar essas APIs em um fluxo utilizável pelo cliente final.

## 🎁 Escopo

### Inclui

- Página pública `/booking`.
- Fluxo em etapas: serviço, horário, dados do cliente e confirmação.
- Consulta de branding público do tenant.
- Consulta de serviços ativos.
- Consulta de slots disponíveis para o serviço e a data selecionados.
- Criação de booking via API pública.
- Estados de loading, vazio, erro, conflito e sucesso.
- Testes automatizados da UI pública.

### Não inclui (explicitamente)

- Página `/booking/manage`.
- Cancelamento ou remarcação pela UI.
- Login ou área administrativa.
- Pagamento.
- Multi-profissional.
- Lembretes, scheduler ou outbox.

## ✅ Critérios de pronto

- [ ] `/booking` carrega sem sessão administrativa.
- [ ] O nome e a cor primária do tenant são aplicados a partir de `GET /public/tenant/branding`.
- [ ] O cliente consegue escolher um serviço ativo.
- [ ] O cliente consegue consultar e escolher um slot disponível.
- [ ] O formulário valida nome, e-mail, telefone e aceite de privacidade.
- [ ] A confirmação chama `POST /public/bookings` com payload compatível com os schemas compartilhados.
- [ ] O sucesso mostra dados mínimos do appointment sem expor token de gerenciamento.
- [ ] Conflito `409` é apresentado de forma recuperável.
- [ ] Arquivos novos de páginas, componentes, hooks, clients e testes usam kebab-case.
- [ ] Testes unitários/componentes e E2E passam localmente.

## 🔗 User Stories

| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-public-booking-flow/) | Agendar pelo fluxo público web | 📝 Planned |

## 📚 ADRs relacionados

- [ADR-001](../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-007](../../adrs/ADR-007-frontend-stack.md)

## 📜 Histórico

- 2026-05-05: planejado escopo da UI pública de booking.
