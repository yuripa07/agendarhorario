# ADR-004: Drizzle ORM sobre Prisma

**Status:** Accepted
**Data:** 2026-05-02
**Decididores:** Yuri

## Contexto

O projeto precisa de queries auditáveis e migrations simples para Postgres.

## Decisão

Usar Drizzle ORM.

## Alternativas consideradas

- **Prisma:** excelente DX, abstração mais alta.
- **Drizzle:** SQL-like, tipado e mais auditável.

## Consequências

### Positivas

- Queries próximas de SQL.
- Bom encaixe com helpers tenant-aware.

### Negativas

- Menos automações de alto nível que Prisma.
