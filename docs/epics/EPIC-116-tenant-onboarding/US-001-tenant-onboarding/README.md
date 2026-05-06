# US-001: Provisionar tenant por convite

**Status:** ✅ Done

## História

Como operador do sistema, quero gerar um convite controlado para que o primeiro admin crie sua conta e ative o tenant sem intervencao manual no banco.

## Cenários

### Cenário 1: Criar convite operacional

**dado** que o operador tem acesso ao ambiente,
**quando** executa o comando de criacao de convite com slug, nome do tenant e e-mail do admin,
**entao** o sistema cria o tenant, registra o convite e mostra uma URL de onboarding com token.

### Cenário 2: Aceitar convite valido

**dado** que o futuro admin recebeu uma URL valida,
**quando** abre `/admin/onboarding?token=...` e informa nome e senha,
**entao** a conta admin e criada, vinculada ao tenant e a sessao passa a acessar o painel administrativo.

### Cenário 3: Rejeitar convite invalido

**dado** que o token esta ausente, invalido, expirado ou ja usado,
**quando** a pagina tenta carregar ou aceitar o convite,
**entao** o sistema mostra erro recuperavel e nao cria conta nem vinculo.

### Cenário 4: Bloquear admin sem vinculo

**dado** que um usuario esta autenticado,
**quando** tenta acessar um tenant ao qual nao pertence pelo `Host`,
**entao** a API rejeita a requisicao com `403`.

## Notas técnicas

- Convites armazenam apenas hash do token.
- O token puro aparece somente na URL impressa pelo CLI.
- O primeiro admin usa Better Auth email/senha.
- Endpoints admin devem validar sessao e vinculo com o tenant resolvido pelo `Host`.
