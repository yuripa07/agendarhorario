# US-001: Configurar Docker e Caddy

**Épico pai:** [EPIC-006](../README.md)
**Status:** ✅ Done
**Estimativa:** 5 horas
**Criado em:** 2026-05-02

## 📖 Narrativa

> Como **operador do homelab**,
> Eu quero **subir o app com Docker Compose e Caddy**,
> Para que **o deploy inicial seja repetível**.

## 🎯 Critérios de aceite

### Cenário 1: Compose

**Dado** `.env` preenchido,
**Quando** executo `docker compose up`,
**Então** Postgres, API, Web e Caddy sobem.

## 🔒 Considerações de segurança

- API roda como usuário non-root.
- Secrets ficam fora do repositório.

## 🔗 Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-docker-caddy.md) | Criar infra homelab | ✅ |
