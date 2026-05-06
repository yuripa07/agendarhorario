# US-001: Configurar operacao administrativa

**Status:** ✅ Done

## História

Como admin do tenant, quero configurar servicos, disponibilidade, bloqueios e identidade visual minima pelo painel web para operar a agenda sem usar chamadas diretas a API.

## Cenários

### Cenário 1: Admin gerencia servicos

**dado** que o admin esta autenticado,
**quando** acessa `/admin/services`,
**entao** ve servicos ativos e inativos, cria um novo servico, edita nome/duracao/preco e desativa um servico ativo.

### Cenário 2: Admin configura disponibilidade

**dado** que o admin esta autenticado,
**quando** acessa `/admin/availability`,
**entao** edita multiplos intervalos por dia e salva a grade semanal completa.

### Cenário 3: Admin configura bloqueios

**dado** que o admin esta autenticado,
**quando** acessa `/admin/availability`,
**entao** cria bloqueios com periodo e motivo e remove bloqueios existentes.

### Cenário 4: Admin configura branding

**dado** que o admin esta autenticado,
**quando** acessa `/admin/branding`,
**entao** edita nome exibido e cor primaria e ve o preview atualizado.

### Cenário 5: Sessao expirada

**dado** que a API retorna `401`,
**quando** qualquer pagina administrativa tenta carregar dados,
**entao** a UI redireciona para `/admin/login`.

## Notas técnicas

- A UI reutiliza os schemas compartilhados de servicos, disponibilidade e tenant.
- Precos sao enviados em centavos e exibidos em BRL.
- Horarios semanais usam minutos locais e labels `HH:mm`.
- Bloqueios sao editados como datetime local e enviados como ISO UTC.
- Todas as chamadas administrativas usam `credentials: "include"`.

