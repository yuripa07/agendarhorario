# ADR-006: UTC no banco e timezone por tenant

**Status:** Accepted
**Data:** 2026-05-02
**Decididores:** Yuri

## Contexto

Agendamento depende de datas corretas por fuso horário.

## Decisão

Persistir datas em UTC com `timestamp with time zone` e converter na UI usando timezone do tenant.

## Alternativas consideradas

- **Persistir hora local:** simples, propenso a erros.
- **Persistir UTC:** exige conversão, preserva consistência.

## Consequências

### Positivas

- Evita ambiguidade em horário de verão e integrações.

### Negativas

- Cálculos de slots precisam receber timezone explicitamente.
