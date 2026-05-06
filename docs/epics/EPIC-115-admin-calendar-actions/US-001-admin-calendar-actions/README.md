# US-001: Operar agendamentos pela agenda admin

**Status:** ✅ Done

## História

Como admin do tenant, quero criar, remarcar e cancelar agendamentos pela agenda para resolver ajustes operacionais sem sair do painel administrativo.

## Cenários

### Cenário 1: Criar agendamento

**dado** que o admin esta autenticado,
**quando** escolhe servico, data, slot valido e dados do cliente,
**entao** a UI cria o appointment confirmado e atualiza a agenda.

### Cenário 2: Remarcar agendamento

**dado** que existe um appointment confirmado,
**quando** o admin escolhe outro slot valido para o mesmo servico,
**entao** o appointment e atualizado e a agenda reflete o novo horario.

### Cenário 3: Cancelar agendamento

**dado** que existe um appointment confirmado,
**quando** o admin confirma o cancelamento,
**entao** o appointment fica cancelado e nao oferece novas acoes operacionais.

### Cenário 4: Slot indisponivel

**dado** que o horario esta fora da disponibilidade, bloqueado ou ocupado,
**quando** o admin tenta criar ou remarcar,
**entao** a API rejeita a operacao.

## Notas técnicas

- As acoes admin usam endpoints protegidos em `/admin/calendar`.
- Slots sao calculados pela mesma regra do fluxo publico.
- Criacao gera management token com expiracao de 7 dias.
- Criacao, cancelamento e remarcacao enviam e-mail ao cliente.

