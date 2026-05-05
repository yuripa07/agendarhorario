# US-001: Agendar pelo fluxo público web

**Status:** 📝 Planned
**EPIC:** [EPIC-111](../README.md)

## User Story

> Como **cliente final**,
> quero **escolher um serviço, selecionar um horário e informar meus dados pelo site**,
> para que **eu consiga criar meu agendamento sem contato manual com o prestador**.

## Critérios de aceite

### Cenário 1: Cliente acessa o booking público

**Dado** que o tenant foi resolvido pelo `Host`,
**quando** o cliente acessa `/booking`,
**então** a página exibe o nome do tenant e aplica a cor primária configurada.

### Cenário 2: Cliente escolhe um serviço

**Dado** que existem serviços ativos para o tenant,
**quando** a página carrega,
**então** o cliente pode escolher um serviço ativo antes de avançar para horários.

### Cenário 3: Cliente escolhe um horário disponível

**Dado** que o cliente escolheu um serviço,
**quando** seleciona uma data,
**então** a UI busca slots disponíveis e permite escolher um horário retornado pela API.

### Cenário 4: Cliente confirma o booking

**Dado** que o cliente escolheu serviço e horário,
**quando** informa nome, e-mail, telefone e aceita a privacidade,
**então** a UI cria o booking e mostra confirmação com dados do appointment.

### Cenário 5: Slot deixa de estar disponível

**Dado** que o slot escolhido ficou indisponível antes da confirmação,
**quando** a API retorna conflito `409`,
**então** a UI informa o conflito e permite escolher outro horário.

## Regras e decisões

- A rota pública será `/booking`.
- A experiência será um fluxo em etapas: serviço, horário, dados e confirmação.
- A UI deve usar os tipos e schemas de `@agendarhorario/shared`.
- O cliente web deve usar `VITE_API_URL` quando definido e `http://localhost:3000` como fallback de desenvolvimento.
- A resposta de criação não deve expor nem depender de `managementToken`.
- Todos os arquivos novos de páginas, componentes, hooks, clients e testes devem usar kebab-case.

## Fora do escopo

- `/booking/manage`.
- Cancelamento ou remarcação.
- Login, painel admin ou autenticação.
- Pagamentos.
- Seleção de profissional.

## Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-public-booking-ui.md) | Criar UI pública de booking | 📝 Planned |
