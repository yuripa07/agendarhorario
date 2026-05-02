# ADR-007: Vite, React, TanStack e shadcn/ui

**Status:** Accepted
**Data:** 2026-05-02
**Decididores:** Yuri

## Contexto

O frontend precisa ser rápido, tipado e acessível.

## Decisão

Usar Vite, React, TanStack Router, TanStack Query, Tailwind CSS e shadcn/ui.

## Alternativas consideradas

- **Next.js:** ótimo para SSR, não necessário no MVP atual.
- **React Router:** maduro, menos type-safe que TanStack Router.

## Consequências

### Positivas

- DX forte e composição flexível.

### Negativas

- File-based routing deve ser mantido com disciplina.
