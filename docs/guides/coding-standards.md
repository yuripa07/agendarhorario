# Padrões de código

- Use TypeScript estrito.
- Evite `any` e casting com `as`; se inevitável, justifique.
- Backend segue Clean Architecture.
- Schemas Zod em `packages/shared` são fonte de verdade para contratos compartilhados.
- Datas persistidas devem estar em UTC.
- Logs não devem conter tokens, senhas ou dados pessoais completos.
- UI deve ser mobile-first e atender WCAG 2.1 AA.
