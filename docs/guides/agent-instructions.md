# Instruções para agentes

1. Leia este arquivo antes de iniciar uma sessão.
2. Antes de implementar uma task, leia a task, a US pai, o épico pai e ADRs relacionados.
3. Planeje o trabalho antes de executar e registre premissas relevantes.
4. Crie uma branch antes de alterar código. Use o padrão `feature/epic-XXX-slug` para entregas de épico e `chore/slug` para mudanças operacionais.
5. Atualize ou crie a documentação necessária antes dos testes e da implementação, deixando status, checklists e Definition of Done pendentes até a entrega estar realmente validada.
6. Backend deve seguir TDD: crie testes inicialmente falhando, faça commit, implemente o mínimo necessário e refatore.
7. Implemente o código em commit separado dos testes e da documentação.
8. Atualize o `HISTORY.md` da US ao concluir uma task, sempre com data e hora local no formato `YYYY-MM-DD HH:mm`.
9. Crie um ADR antes de implementar qualquer decisão arquitetural nova.
10. Se houver ambiguidade relevante, pergunte ao Yuri.

## Fluxo obrigatório de entrega

1. Ler documentação relacionada e confirmar o escopo.
2. Planejar a execução.
3. Criar branch a partir de `main`.
4. Criar ou atualizar docs iniciais pendentes e commitar.
5. Criar testes e commitar.
6. Implementar código e commitar.
7. Rodar validações finais.
8. Abrir PR contra `main`.

## Regras de documentação durante a entrega

- Docs de épico, US e task devem nascer como planejamento: sem checkboxes marcados e sem status `Done` antes da execução.
- Marque checkboxes, Definition of Done e status final somente depois que código, testes e validações finais estiverem concluídos.
- Use data e hora local em logs de execução e histórico: `YYYY-MM-DD HH:mm`.
- Registre no markdown o que foi implementado, decisões relevantes, validações e ajustes futuros. Não registre eventos que já ficam rastreados no GitHub, como abertura de PR.
- Se uma PR precisar de follow-up documental depois de aberta, faça commit normal na mesma branch; não reescreva histórico.

## Validações finais

Antes de finalizar, rode sempre que possível:

- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test`;
- E2E quando houver rota ou API alterada;
- startup local da API e da web para confirmar que sobem sem erro.

Código, nomes técnicos e commits devem usar inglês. Documentação e UI devem usar português.
