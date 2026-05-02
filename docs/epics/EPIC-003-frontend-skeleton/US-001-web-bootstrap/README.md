# US-001: Criar bootstrap web

**Épico pai:** [EPIC-003](../README.md)
**Status:** ✅ Done
**Estimativa:** 5 horas
**Criado em:** 2026-05-02

## 📖 Narrativa

> Como **desenvolvedor**,
> Eu quero **um frontend React configurado**,
> Para que **as telas do MVP sejam criadas com stack definida**.

## 🎯 Critérios de aceite

### Cenário 1: Web local

**Dado** o frontend rodando,
**Quando** acesso `localhost:5173`,
**Então** vejo a tela inicial da foundation.

## 🔧 Considerações técnicas

- Feature-Sliced Design como direção de pastas.
- shadcn/ui preparado via `components.json`.

## ♿ Considerações de acessibilidade

- HTML semântico, contraste suficiente e ícone decorativo com `aria-hidden`.

## 🧪 Estratégia de teste

- Smoke test com Testing Library.
- E2E básico com Playwright.

## 🔗 Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-web-bootstrap.md) | Criar web Vite inicial | ✅ |
