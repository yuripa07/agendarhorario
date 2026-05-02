# ADR-001: Estratégia multi-tenant

**Status:** Accepted
**Data:** 2026-05-02
**Decididores:** Yuri

## Contexto

O produto terá deploy único com subdomínios por cliente.

## Decisão

Usar isolamento lógico por `tenant_id`, com resolução pelo `Host` header em fase futura.

## Alternativas consideradas

- **Banco por tenant:** isolamento forte, operação mais complexa.
- **Schema por tenant:** isolamento intermediário, migrations mais difíceis.
- **Linha por tenant:** simples para MVP e compatível com Railway/Neon.

## Consequências

### Positivas

- Deploy e migrations simples.
- Escala bem para MVP.

### Negativas

- Exige disciplina rigorosa nas queries.

### Neutras

- Helpers tenant-aware serão obrigatórios antes das tabelas de domínio.
