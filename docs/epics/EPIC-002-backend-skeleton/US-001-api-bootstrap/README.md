# US-001: Criar bootstrap da API

**Épico pai:** [EPIC-002](../README.md)
**Status:** ✅ Done
**Estimativa:** 6 horas
**Criado em:** 2026-05-02

## 📖 Narrativa

> Como **desenvolvedor**,
> Eu quero **uma API NestJS inicial**,
> Para que **features futuras tenham base de arquitetura e observabilidade**.

## 🎯 Critérios de aceite

### Cenário 1: Health check

**Dado** a API rodando,
**Quando** acesso `/health`,
**Então** recebo status HTTP 200 com `status: ok`.

## 🔧 Considerações técnicas

- Clean Architecture por camadas.
- Logger Pino.
- Env validation com Zod.

## 🧪 Estratégia de teste

- Unit test do controller.
- E2E smoke com Supertest.

## 🔗 Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-api-bootstrap.md) | Criar API NestJS inicial | ✅ |
