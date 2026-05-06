# US-001: Visualizar agenda administrativa

**Status:** ✅ Done
**EPIC:** [EPIC-113](../README.md)

## User Story

> Como **prestador administrador**,
> quero **entrar no painel e visualizar meus agendamentos por dia e por semana**,
> para que **eu consiga acompanhar minha operação sem consultar o banco ou a API diretamente**.

## Critérios de aceite

### Cenário 1: Admin faz login

**Dado** que existe um admin com email e senha,
**quando** ele acessa `/admin/login` e informa credenciais válidas,
**então** a UI autentica com Better Auth e redireciona para `/admin/calendar`.

### Cenário 2: Usuário anônimo acessa rota protegida

**Dado** que não existe sessão administrativa,
**quando** o usuário acessa `/admin/calendar`,
**então** a UI redireciona para `/admin/login`.

### Cenário 3: Admin visualiza agenda diária

**Dado** que existe sessão administrativa válida,
**quando** a visão `Dia` está selecionada,
**então** a UI consulta appointments na janela UTC do dia selecionado e exibe os horários em `America/Sao_Paulo`.

### Cenário 4: Admin visualiza agenda semanal

**Dado** que existe sessão administrativa válida,
**quando** a visão `Semana` está selecionada,
**então** a UI consulta appointments na janela UTC da semana selecionada e agrupa os itens por dia.

### Cenário 5: Sessão expira

**Dado** que a API retorna `401`,
**quando** a UI tenta consultar sessão ou agenda,
**então** o usuário é redirecionado para login.

## Regras e decisões

- A rota de login é `/admin/login`.
- A rota inicial protegida é `/admin/calendar`.
- A UI usa `POST /auth/sign-in/email`, `POST /auth/sign-out`, `GET /admin/session` e `GET /admin/calendar/appointments`.
- Todas as chamadas autenticadas usam `credentials: "include"`.
- `VITE_API_URL` é override explícito da API; sem override, o client deve derivar uma API tenant-aware a partir do host atual.
- Datas enviadas à API são UTC instants terminados em `Z`.
- Exibição inicial usa timezone `America/Sao_Paulo`.

## Fora do escopo

- Cadastro ou convite de admin.
- Reset/recovery de senha.
- Permissões avançadas por tenant.
- CRUD administrativo de serviços, disponibilidade ou branding.
- Ações sobre appointments na agenda.

## Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-admin-calendar-ui.md) | Criar login e agenda administrativa | ✅ Done |
