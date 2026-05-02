# US-001: Criar pipelines GitHub Actions

**Épico pai:** [EPIC-005](../README.md)
**Status:** ✅ Done
**Estimativa:** 4 horas
**Criado em:** 2026-05-02

## 📖 Narrativa

> Como **mantenedor**,
> Eu quero **pipelines automatizados**,
> Para que **mudanças sejam validadas antes de produção**.

## 🎯 Critérios de aceite

### Cenário 1: Pull request

**Dado** um PR,
**Quando** o CI executa,
**Então** lint, typecheck, testes e build rodam.

## 🔒 Considerações de segurança

- CodeQL, Gitleaks, Trivy e audit automatizados.

## 🧪 Estratégia de teste

- Validar sintaxe dos workflows no primeiro push.

## 🔗 Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-github-actions.md) | Criar workflows | ✅ |
