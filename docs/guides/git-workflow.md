# Workflow Git

- Crie uma branch antes de alterar código.
- Use `feature/epic-XXX-slug` para entregas de épico.
- Use `chore/slug` para documentação, processo e manutenção sem épico.
- Use Conventional Commits em inglês e no imperativo.
- Separe commits por intenção: documentação, testes e implementação devem ficar em commits próprios quando fizerem parte da entrega.
- Antes de abrir PR, rode `pnpm lint`, `pnpm typecheck` e `pnpm test`.
- Rode E2E quando houver mudança em rota ou API.
- Suba o app localmente quando possível para confirmar que API e web iniciam sem erro.
- Abra PR contra `main`.
- Não reescreva histórico compartilhado sem combinar com Yuri.
