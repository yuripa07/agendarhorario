# ADR-005: Monorepo com pnpm workspaces

**Status:** Accepted
**Data:** 2026-05-02
**Decididores:** Yuri

## Contexto

API, web e contratos compartilhados precisam evoluir juntos.

## Decisão

Usar pnpm workspaces.

## Alternativas consideradas

- **npm workspaces:** simples, menos eficiente.
- **Turborepo:** útil futuramente, desnecessário na Fase 0.
- **pnpm workspaces:** rápido, estrito e suficiente.

## Consequências

### Positivas

- Instalação eficiente.
- Dependências compartilhadas controladas.

### Negativas

- Requer familiaridade com filtros pnpm.
