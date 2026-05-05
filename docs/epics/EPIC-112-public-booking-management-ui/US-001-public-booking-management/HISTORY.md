# Histórico: US-001 Gerenciar agendamento pelo link público

## 2026-05-05 19:04

**Resumo:** Implementada a página pública `/booking/manage` para consultar, cancelar e remarcar um agendamento pelo management token enviado no e-mail.

**Decisões:** O token é lido apenas da query string `token`; a remarcação reutiliza o mesmo token e busca slots pelo `serviceId` do appointment; a tela não exibe o token.

**Validações:** Foram adicionados testes de componente para lookup, token ausente, token inválido, cancelamento, remarcação e conflito `409`. Também foi adicionado E2E web cobrindo remarcação completa em `/booking/manage`.

**Ajustes futuros:** Adicionar seleção explícita de data e input manual de token se houver necessidade de suporte.
