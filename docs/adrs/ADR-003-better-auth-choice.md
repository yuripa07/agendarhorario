# ADR-003: Better Auth para autenticação

**Status:** Accepted
**Data:** 2026-05-02
**Decididores:** Yuri

## Contexto

O MVP precisa autenticar prestadores e usar magic links para clientes finais.

## Decisão

Adotar Better Auth quando o épico de autenticação for implementado.

## Alternativas consideradas

- **Passport:** flexível, exige mais implementação manual.
- **Auth.js:** maduro, menos focado em alguns padrões de backend standalone.
- **Better Auth:** cobre email/senha, magic link e CSRF de forma integrada.

## Consequências

### Positivas

- Menos código sensível próprio.

### Negativas

- Integração deverá respeitar Clean Architecture.
