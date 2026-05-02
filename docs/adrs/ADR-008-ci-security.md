# ADR-008: CI e segurança automatizados

**Status:** Accepted
**Data:** 2026-05-02
**Decididores:** Yuri

## Contexto

O projeto manipulará dados pessoais e agenda de clientes.

## Decisão

Automatizar CI, E2E, audit, Trivy, CodeQL, Gitleaks e Dependabot.

## Alternativas consideradas

- **Validação manual:** rápida no início, frágil.
- **Automação desde a Fase 0:** mais setup, reduz regressões.

## Consequências

### Positivas

- Falhas aparecem cedo.

### Negativas

- Primeiro push pode exigir pequenos ajustes de workflow.
