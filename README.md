# agendarhorario.com.br

[![CI](https://github.com/yurirocha/agendarhorario/actions/workflows/ci.yml/badge.svg)](https://github.com/yurirocha/agendarhorario/actions/workflows/ci.yml)
[![Security](https://github.com/yurirocha/agendarhorario/actions/workflows/security.yml/badge.svg)](https://github.com/yurirocha/agendarhorario/actions/workflows/security.yml)

SaaS multi-tenant para agendamento online de horários.

## Stack

- Monorepo com pnpm workspaces.
- API NestJS em `apps/api`.
- Web React + Vite em `apps/web`.
- Schemas e tipos compartilhados em `packages/shared`.
- PostgreSQL + Drizzle ORM.

## Setup local

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Serviços locais:

- API: `http://localhost:3000/health`
- Web: `http://localhost:5173`
- Postgres: `localhost:5432`

## Comandos

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate
pnpm db:seed
```

## Docker homelab

```bash
cp .env.example .env
docker compose up -d --build
```

Veja o [runbook homelab](./docs/guides/homelab-runbook.md).

## Documentação

Comece por [docs/README.md](./docs/README.md).
