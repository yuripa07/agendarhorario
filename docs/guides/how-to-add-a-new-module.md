# Como adicionar um novo módulo

1. Crie o bounded context em `apps/api/src`.
2. Separe `domain`, `application`, `infrastructure` e `presentation`.
3. Coloque contratos compartilhados em `packages/shared`.
4. Escreva testes de domínio antes da implementação.
5. Registre ADR se a decisão extrapolar o módulo.
