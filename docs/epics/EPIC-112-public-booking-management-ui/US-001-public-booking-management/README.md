# US-001: Gerenciar agendamento pelo link público

**Status:** ✅ Done
**EPIC:** [EPIC-112](../README.md)

## User Story

> Como **cliente final**,
> quero **abrir meu link de gerenciamento para consultar, cancelar ou remarcar meu agendamento**,
> para que **eu consiga resolver mudanças sem contato manual com o prestador**.

## Critérios de aceite

### Cenário 1: Cliente acessa link válido

**Dado** que existe um appointment confirmado com management token válido,
**quando** o cliente acessa `/booking/manage?token=...`,
**então** a página exibe os dados mínimos do agendamento sem mostrar o token.

### Cenário 2: Link ausente, inválido ou expirado

**Dado** que o link não tem token válido,
**quando** a página tenta consultar o agendamento,
**então** a UI informa que o link não está disponível.

### Cenário 3: Cliente cancela o agendamento

**Dado** que o appointment está confirmado,
**quando** o cliente confirma o cancelamento,
**então** a UI chama a API de cancelamento e mostra o agendamento como cancelado.

### Cenário 4: Cliente remarca o agendamento

**Dado** que o appointment está confirmado,
**quando** o cliente escolhe um novo slot disponível do mesmo serviço,
**então** a UI chama a API de remarcação e atualiza os dados exibidos.

### Cenário 5: Novo slot entra em conflito

**Dado** que o slot escolhido ficou indisponível,
**quando** a API retorna conflito `409`,
**então** a UI informa o conflito e permite escolher outro horário.

## Regras e decisões

- A rota pública é `/booking/manage`.
- O token é aceito apenas via query string `token`.
- A UI usa `VITE_API_URL` com fallback `http://localhost:3000`.
- A remarcação usa slots do mesmo `serviceId` retornado pelo lookup.
- A tela não deve exibir o token de gerenciamento.
- Todos os arquivos novos de páginas, componentes, clients e testes usam kebab-case.

## Fora do escopo

- Input manual de token.
- Login, painel admin ou autenticação.
- Novo token após remarcação.
- Pagamentos.
- Seleção de profissional.

## Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-public-booking-management-ui.md) | Criar UI pública de gerenciamento de booking | ✅ Done |
