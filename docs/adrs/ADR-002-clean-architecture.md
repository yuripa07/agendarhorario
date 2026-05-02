# ADR-002: Clean Architecture no backend

**Status:** Accepted
**Data:** 2026-05-02
**Decididores:** Yuri

## Contexto

O backend terá regras de domínio importantes, como slots inteligentes.

## Decisão

Organizar bounded contexts com camadas `domain`, `application`, `infrastructure` e `presentation`.

## Alternativas consideradas

- **MVC NestJS puro:** mais rápido, acopla regra de domínio ao framework.
- **Clean Architecture:** mais estrutura, melhor testabilidade.

## Consequências

### Positivas

- Domínio testável sem NestJS.
- Fronteiras explícitas.

### Negativas

- Mais arquivos por feature.
