# US-001: Configurar monorepo

**Épico pai:** [EPIC-001](../README.md)
**Status:** ✅ Done
**Estimativa:** 4 horas
**Criado em:** 2026-05-02

## 📖 Narrativa

> Como **desenvolvedor**,
> Eu quero **um monorepo com tooling padronizado**,
> Para que **API, web e pacotes compartilhados evoluam juntos**.

## 🎯 Critérios de aceite

### Cenário 1: Setup local

**Dado** um clone novo,
**Quando** eu rodo `pnpm install`,
**Então** os workspaces são instalados.

## 🔧 Considerações técnicas

- Usar pnpm workspaces e TypeScript estrito.

## 🔒 Considerações de segurança

- Hooks evitam commits fora do padrão básico.

## ♿ Considerações de acessibilidade

- Não se aplica.

## 🧪 Estratégia de teste

- Validar scripts `lint`, `typecheck` e `test`.

## 🔗 Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-pnpm-workspaces.md) | Configurar pnpm workspaces | ✅ |
