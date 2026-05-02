# Prompt para Claude Code / Codex — agendarhorario.com.br

> **Como usar este prompt:** Salve este arquivo como `INITIAL-PROMPT.md` na raiz de um repositório vazio, abra o Claude Code nesse diretório, e envie a primeira mensagem como: *"Leia o arquivo `INITIAL-PROMPT.md` e execute o que está pedido. Antes de começar a codar, me apresente o plano de execução em forma de checklist e aguarde minha aprovação."*

---

## 🎯 Contexto do projeto

Você é um desenvolvedor sênior fullstack TypeScript trabalhando em um SaaS de agendamento de horários chamado **agendarhorario.com.br**. O produto será vendido para prestadores de serviço (médicos, dentistas, cabeleireiros, psicólogos, barbeiros, etc.) que precisam que seus clientes finais agendem horários online.

**Modelo comercial:** Cada cliente recebe um subdomínio próprio (`barbeariabraga.agendarhorario.com.br`, `dramaria.agendarhorario.com.br`, etc.). Tecnicamente é um **deploy único multi-tenant** com isolamento por subdomínio resolvido pelo `Host` header.

**Hospedagem atual:** Homelab Ubuntu Server do desenvolvedor (Yuri), com Docker Compose + Caddy + Cloudflare Tunnel.
**Hospedagem futura:** Railway (backend) + Vercel (frontend) + Neon (banco). A migração precisa ser trivial — tudo containerizado.

---

## 🛠️ Stack técnica (decidida e imutável — não substitua sem perguntar)

### Monorepo
- **Gerenciador:** pnpm workspaces
- **Estrutura:**
  ```
  apps/
    api/       # NestJS backend
    web/       # React + Vite frontend
  packages/
    shared/    # Schemas Zod, tipos, utils compartilhados
  docs/
    epics/     # Estrutura de épicos, US e tasks (ver seção dedicada)
    adrs/      # Architecture Decision Records
    guides/    # Guias para agentes e desenvolvedores
  ```

### Backend (`apps/api`)
- **Framework:** NestJS (versão estável mais recente)
- **Arquitetura:** Clean Architecture com camadas `domain` / `application` / `infrastructure` / `presentation` por bounded context
- **ORM:** Drizzle ORM
- **Banco:** PostgreSQL (Neon em produção, Postgres em container Docker em dev/homelab)
- **Validação:** Zod (schemas em `packages/shared`)
- **Autenticação:** Better Auth (https://www.better-auth.com)
- **Email:** Resend + React Email
- **Testes:** Vitest (unit + integration), Supertest (E2E API)
- **Logging:** Pino estruturado em JSON

### Frontend (`apps/web`)
- **Build:** Vite + TypeScript
- **UI:** shadcn/ui + Tailwind CSS + Radix UI (que vem com shadcn)
- **Roteamento:** TanStack Router (file-based, type-safe)
- **Data fetching:** TanStack Query
- **Forms:** React Hook Form + `@hookform/resolvers/zod` (schemas Zod de `packages/shared`)
- **Arquitetura:** Feature-Sliced Design (FSD) — `entities`, `features`, `widgets`, `pages`, `shared`
- **Testes:** Vitest + Testing Library (componentes), Playwright (E2E)
- **Acessibilidade:** WCAG 2.1 AA mínimo

### Tooling transversal
- **Lint/Format:** Biome (substitui ESLint + Prettier)
- **Type-check:** `tsc --noEmit` no CI
- **Git hooks:** Husky + lint-staged
- **Commits:** Conventional Commits + commitlint
- **Versionamento:** Changesets (preparar pra release notes futuras)

### CI/CD (GitHub Actions)
Pipelines obrigatórios:
1. **`ci.yml`** — roda em todo PR: install, lint (Biome), type-check, testes (Vitest unit), build
2. **`security.yml`** — roda em PR e schedule semanal: `npm audit`, Trivy (filesystem + container scan), CodeQL, Gitleaks
3. **`e2e.yml`** — roda em PR pra `main`: Playwright E2E em ambiente de teste com Postgres efêmero
4. **`deploy-homelab.yml`** — roda em push pra `main`: build da imagem Docker, push pro registry (GHCR), webhook pro homelab fazer pull e restart

### Hospedagem inicial (homelab)
- Ubuntu Server (já existe)
- Docker + Docker Compose
- Caddy como reverse proxy (HTTPS automático, suporte a wildcard subdomain via Cloudflare DNS challenge)
- Cloudflare Tunnel (sem expor portas no roteador)
- `unattended-upgrades`, `fail2ban`, `ufw` configurados
- Container roda como **non-root user**

---

## 🏗️ Decisões arquiteturais importantes

### Multi-tenancy
- **Estratégia:** Multi-tenant-ready no código + isolamento lógico por `tenant_id`
- **Resolução de tenant:** Middleware lê o subdomínio do `Host` header e injeta `tenantId` no request context (NestJS `AsyncLocalStorage` ou `CLS`)
- **Schema do banco:** **TODA tabela de domínio tem `tenant_id NOT NULL`** com FK pra `tenants`. Drizzle queries devem ser auditáveis pra garantir filtro por `tenant_id` (criar helper/repository base que força isso)
- **Tenant `default`:** Subdomínio raiz (`agendarhorario.com.br`) e `app.agendarhorario.com.br` reservados pra landing page e admin master (futuro)

### Autenticação (Better Auth)
- **Admin/prestador:** email + senha + magic link como recovery; Google OAuth previsto na fase 2
- **Cliente final:** sem conta — apenas magic link enviado pro email após informar nome + email + telefone. Token de cancelamento/reagendamento via link único e expirável (7 dias)
- **Sessão:** cookie httpOnly, secure, sameSite=lax, prefixo `__Host-` em produção
- **CSRF:** double-submit cookie pattern (Better Auth tem suporte nativo)

### Fuso horário
- **No banco:** TODA data/hora é `timestamp with time zone` em **UTC**
- **Na UI:** conversão pra timezone do tenant (campo `timezone` em `tenants`, default `America/Sao_Paulo`)
- **Lib:** `date-fns` + `date-fns-tz` (ou Temporal API se estável)
- **Regra de ouro:** **NUNCA** persistir hora local no banco. **NUNCA** confiar em `new Date()` no frontend pra cálculos de slot.

### Algoritmo de slots inteligentes
- **Objetivo:** minimizar tempo vago entre agendamentos
- **Estratégia inicial (fase 1):** slots fixos baseados em duração do serviço, com encaixe priorizando horários **adjacentes a agendamentos existentes**. Slots órfãos (que deixariam um buraco menor que a duração do menor serviço) são desencorajados.
- **Implementar como serviço de domínio puro** (sem dependência de framework), com testes exaustivos
- **Documentar como ADR específico** com exemplos visuais

### Segurança (não-negociável)
- **Headers HTTP:** Helmet com CSP estrito, HSTS, X-Frame-Options DENY
- **Rate limiting:** `@nestjs/throttler` com limites diferenciados por rota (login mais restrito)
- **Input validation:** Zod em TODA borda (controllers, queries, params)
- **SQL injection:** apenas via Drizzle queries parametrizadas, nunca string concat
- **Secrets:** `.env` com `.env.example` versionado. Em produção, secrets via Railway/Doppler. Gitleaks no CI.
- **Logs:** nunca logar dados sensíveis (senha, token, dados pessoais completos). Helper `redact()` no logger.
- **LGPD:** Privacy policy + termos de uso obrigatórios no agendamento. Endpoint de exportação e exclusão de dados do cliente final (preparar agora, expor depois).
- **Dependências:** Renovate ou Dependabot configurado.

### Personalização do tenant (white-label leve)
- Cada tenant pode customizar:
  - Logo (upload — armazenar em Cloudflare R2 ou S3-compatible)
  - Cor primária (CSS variable, aplicada via Tailwind theme dinâmico)
  - Nome de exibição
- **Não suportamos** customização de fontes, layouts ou copy do app no MVP.

---

## 📂 Estrutura de épicos / user stories / tasks

Esta é uma **parte crítica** do projeto. Documentação clara é mandatória pra agentes (Claude Code, Codex) e humanos navegarem facilmente.

### Estrutura de pastas

```
docs/
├── README.md                          # Índice geral e como navegar
├── epics/
│   ├── README.md                      # Lista de épicos com status
│   ├── EPIC-001-foundation/
│   │   ├── README.md                  # Descrição do épico, motivação, escopo, status
│   │   ├── US-001-monorepo-setup/
│   │   │   ├── README.md              # User story (formato detalhado abaixo)
│   │   │   ├── HISTORY.md             # Histórico de mudanças (append-only)
│   │   │   ├── TASK-001-pnpm-workspaces.md
│   │   │   ├── TASK-002-tsconfig-base.md
│   │   │   └── TASK-003-biome-config.md
│   │   └── US-002-...
│   ├── EPIC-002-tenant-management/
│   └── ...
├── adrs/
│   ├── README.md                      # Índice de ADRs
│   ├── ADR-001-multi-tenant-strategy.md
│   ├── ADR-002-clean-architecture.md
│   ├── ADR-003-better-auth-choice.md
│   ├── ADR-004-drizzle-vs-prisma.md
│   ├── ADR-005-monorepo-pnpm.md
│   └── ...
└── guides/
    ├── README.md
    ├── how-to-add-a-new-module.md     # Passo a passo pra adicionar um bounded context
    ├── how-to-add-a-new-tenant.md     # Onboarding de cliente novo
    ├── coding-standards.md
    ├── testing-strategy.md
    ├── tdd-workflow.md
    ├── git-workflow.md
    └── agent-instructions.md          # Como agentes devem operar neste repo
```

### Formato do épico (`docs/epics/EPIC-XXX-<slug>/README.md`)

```markdown
# EPIC-XXX: <Nome do Épico>

**Status:** 🟢 Active | 🟡 Planned | ✅ Done | 🔴 Blocked
**Owner:** Yuri
**Criado em:** YYYY-MM-DD
**Última atualização:** YYYY-MM-DD

## 🎯 Objetivo
Frase clara em 1-2 linhas.

## 📋 Contexto e motivação
Por que esse épico existe? Que problema resolve?

## 🎁 Escopo
### Inclui
- ...
### Não inclui (explicitamente)
- ...

## ✅ Critérios de "pronto" (Definition of Done)
- [ ] ...

## 🔗 User Stories
| ID | Título | Status |
|----|--------|--------|
| [US-001](./US-001-.../) | ... | ✅ |
| [US-002](./US-002-.../) | ... | 🟡 |

## 📚 ADRs relacionados
- [ADR-XXX](../../adrs/ADR-XXX-...md)

## 📜 Histórico
- YYYY-MM-DD: criado
- YYYY-MM-DD: ...
```

### Formato da US (`docs/epics/.../US-XXX-<slug>/README.md`)

```markdown
# US-XXX: <Título da User Story>

**Épico pai:** [EPIC-XXX](../README.md)
**Status:** 🟢 In progress | 🟡 Ready | ✅ Done | 🔴 Blocked
**Estimativa:** X pontos / X horas
**Criado em:** YYYY-MM-DD

## 📖 Narrativa
> Como **<persona>**,
> Eu quero **<ação>**,
> Para que **<benefício>**.

## 🎯 Critérios de aceite (Gherkin)

### Cenário 1: <descrição>
**Dado** que ...
**Quando** ...
**Então** ...
**E** ...

### Cenário 2: <descrição>
...

## 🔧 Considerações técnicas
- ...

## 🔒 Considerações de segurança
- ...

## ♿ Considerações de acessibilidade
- ...

## 🧪 Estratégia de teste
- Unit: ...
- Integration: ...
- E2E: ...

## 🔗 Tasks
| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-....md) | ... | ✅ |

## 📚 Referências
- ADR-XXX
- Documentação externa: ...

## 📜 Ver [HISTORY.md](./HISTORY.md)
```

### Formato da Task (`docs/epics/.../TASK-XXX-<slug>.md`)

```markdown
# TASK-XXX: <Título>

**US pai:** [US-XXX](./README.md)
**Status:** 🟢 In progress | 🟡 To do | ✅ Done | 🔴 Blocked
**Tipo:** feature | bug | refactor | infra | docs | test
**Estimativa:** X horas
**Atribuído a:** Yuri | Claude Code

## 🎯 Objetivo
Frase única e específica.

## 📋 Passos de execução
1. [ ] ...
2. [ ] ...

## ✅ Definition of Done
- [ ] Código implementado seguindo TDD (testes primeiro)
- [ ] Testes passando localmente (`pnpm test`)
- [ ] Lint/format limpos (`pnpm lint`)
- [ ] Type-check sem erros (`pnpm typecheck`)
- [ ] CI verde
- [ ] Documentação atualizada se necessário
- [ ] HISTORY.md da US atualizado
- [ ] Code review (auto-review pelo agente, depois Yuri)

## 🔍 Arquivos afetados (estimativa)
- `apps/api/src/modules/.../...`
- ...

## 📜 Log de execução
- YYYY-MM-DD HH:mm — Iniciado por <agente/humano>
- YYYY-MM-DD HH:mm — ...
```

### Formato do `HISTORY.md` (append-only)

```markdown
# Histórico de US-XXX

## YYYY-MM-DD — TASK-001 concluída
**Por:** Claude Code (sonnet-4.7)
**Resumo:** Implementado X usando Y. Testes Z criados.
**Decisões tomadas:** ...
**Ajustes necessários no futuro:** ...

## YYYY-MM-DD — TASK-002 iniciada
...
```

### Formato do ADR (`docs/adrs/ADR-XXX-<slug>.md`)

```markdown
# ADR-XXX: <Título>

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-YYY
**Data:** YYYY-MM-DD
**Decididores:** Yuri

## Contexto
Qual problema/decisão estamos enfrentando?

## Decisão
O que decidimos?

## Alternativas consideradas
- **Alternativa A:** prós/contras
- **Alternativa B:** prós/contras

## Consequências
### Positivas
- ...
### Negativas
- ...
### Neutras
- ...

## Referências
- ...
```

---

## 🤖 Instruções para o agente (você, Claude Code/Codex)

### Workflow obrigatório

1. **Sempre leia primeiro** `docs/guides/agent-instructions.md` antes de começar uma sessão
2. **Antes de implementar uma task**, leia: a task, a US pai, o épico pai, e ADRs referenciados
3. **TDD é obrigatório no backend:**
   - Escreva o teste que falha
   - Implemente o mínimo pra passar
   - Refatore mantendo verde
   - Commit com mensagem `test:` ou `feat:` seguindo Conventional Commits
4. **No frontend, TDD é flexível:** testes unitários só pra lógica não-trivial. E2E (Playwright) cobre fluxos críticos.
5. **Sempre atualize o `HISTORY.md` da US** ao terminar uma task
6. **Sempre rode antes de commit:** `pnpm lint && pnpm typecheck && pnpm test`
7. **Se uma decisão arquitetural surgir, crie um ADR antes de implementar**
8. **Se algo está ambíguo, pare e pergunte ao Yuri** — não invente requisitos

### Princípios de código

- **Clean Architecture** no backend: domain não conhece framework, application não conhece HTTP, infrastructure implementa portas, presentation só traduz HTTP↔use case
- **Type safety end-to-end**: schemas Zod em `packages/shared` são a fonte da verdade
- **Imutabilidade por padrão**: `readonly`, `as const`, evite mutação
- **Erros de domínio são tipados**: classes específicas (`SlotUnavailableError`, `TenantNotFoundError`), nunca lançar `new Error("...")` solto
- **Sem `any`, sem `as` casting**: se precisar, justifique em comentário
- **Componentes shadcn primeiro**: se shadcn tem o componente, use. Não recrie.
- **Acessibilidade**: todo input com label, todo botão com texto ou aria-label, foco visível, navegação por teclado
- **Mobile-first**: Tailwind responsivo, testar em viewports `sm`, `md`, `lg`

### Comunicação

- **Idioma do código:** inglês (variáveis, comentários, commits)
- **Idioma da documentação:** português (épicos, US, tasks, ADRs, guides) — porque Yuri é o único usuário e isso facilita
- **Idioma da UI:** português (pt-BR)

---

## 🚀 Plano de entrega incremental

### Fase 0 — Foundation (você vai construir agora)
**Objetivo:** repo pronto pra desenvolvimento, sem features de produto ainda.

**Épicos:**
- **EPIC-001: Monorepo & tooling** — pnpm workspaces, Biome, tsconfig, Husky, commitlint, Changesets
- **EPIC-002: Backend skeleton** — NestJS bootstrap, estrutura de Clean Architecture, health check, logger Pino, configuração via env, Zod validation pipe
- **EPIC-003: Frontend skeleton** — Vite + React + TanStack Router (file-based) + Tailwind + shadcn init + página inicial vazia
- **EPIC-004: Database & migrations** — Drizzle setup, primeira migration (tabela `tenants`), seed básico, scripts de migrate
- **EPIC-005: CI/CD pipelines** — todos os GHA descritos acima
- **EPIC-006: Homelab deploy infra** — Dockerfile multi-stage do api, Dockerfile do web, docker-compose.yml, Caddyfile com wildcard, instruções de Cloudflare Tunnel, runbook de deploy
- **EPIC-007: Documentation foundation** — todos os docs/, ADRs iniciais, guides

### Fase 1 — MVP funcional (depois da Fase 0)
- **EPIC-101: Tenant resolution** — middleware de subdomínio, contexto async, testes
- **EPIC-102: Auth admin** — Better Auth, login email+senha, magic link recovery, guards
- **EPIC-103: Service catalog** — CRUD de serviços (nome, duração, preço)
- **EPIC-104: Working hours & blocks** — configuração de horário de funcionamento, bloqueios (almoço, férias)
- **EPIC-105: Smart slot algorithm** — serviço de domínio que calcula slots disponíveis priorizando adjacência
- **EPIC-106: Customer booking flow** — fluxo público de agendamento (sem auth, magic link)
- **EPIC-107: Provider calendar view** — agenda do prestador (visão diária/semanal)
- **EPIC-108: Cancel & reschedule** — fluxo de cancelamento via magic link
- **EPIC-109: Tenant branding** — upload de logo, cor primária, configuração via admin
- **EPIC-110: Email notifications** — confirmação, lembrete, cancelamento via Resend

### Fase 2 — Crescimento (futuro, mapeado mas não implementado agora)
- Múltiplos profissionais por tenant
- WhatsApp notifications (provavelmente via Twilio ou Z-API)
- Google OAuth pro admin
- Dashboard analytics
- Multi-tenant deploy real (consolidação)
- Onboarding self-service

### Fase 3 — Pagamentos (futuro)
- Mercado Pago integration (recomendo este primeiro — melhor cobertura no Brasil)
- PagSeguro como alternativa
- Cobrança recorrente do prestador (assinatura mensal do SaaS)
- Pagamento do agendamento pelo cliente final (opcional, configurável por tenant)

---

## 🎬 Sua tarefa AGORA

Execute a **Fase 0 — Foundation completa**. Ao final, eu (Yuri) vou clonar o repo, rodar `pnpm install && pnpm dev` e ter:
- Backend NestJS rodando em `localhost:3000` com `/health` retornando OK
- Frontend Vite rodando em `localhost:5173` com página inicial em branco mas estilizada
- Banco Postgres em container Docker rodando localmente
- Migrations rodando via `pnpm db:migrate`
- Testes passando via `pnpm test`
- CI verde no primeiro push pro GitHub
- Estrutura completa de `docs/` com EPICs 001-007 documentados (mesmo que algumas tasks não estejam implementadas, todas devem estar **escritas** com US e tasks)
- ADRs 001-010 escritos cobrindo as decisões deste documento
- Dockerfile e docker-compose.yml prontos pra rodar no homelab

### Antes de começar

**Não comece a codar imediatamente.** Faça o seguinte:

1. **Apresente um plano de execução** em forma de checklist ordenado, agrupado por épico, mostrando a ordem em que vai criar/configurar as coisas
2. **Liste suposições** que você vai assumir (versões de libs, conventions específicas, etc.)
3. **Liste perguntas** se houver ambiguidade
4. **Aguarde minha aprovação** antes de criar qualquer arquivo de código

### Conventions específicas

- Versões: use as **latest stable** de cada lib em maio/2026, mas **fixe** as versões no `package.json` (sem `^`)
- Node: use a versão LTS atual via `.nvmrc`
- Commits: Conventional Commits, em inglês, no imperativo (`feat: add tenant resolution middleware`)
- Branch: trabalhe em `main` por enquanto (projeto solo, sem PRs ainda); quando adicionar pessoas, mudamos pra trunk-based
- README raiz: deve ter badges de CI, instruções de setup local, link pra `docs/`

### Critério de pronto da Fase 0

- [ ] `pnpm install` funciona limpo em máquina nova
- [ ] `pnpm dev` sobe api + web + postgres
- [ ] `pnpm test` passa (mesmo que sejam só smoke tests por enquanto)
- [ ] `pnpm lint` e `pnpm typecheck` passam
- [ ] CI verde no GitHub
- [ ] Documentação navegável: a partir de `docs/README.md` consigo chegar em qualquer task
- [ ] Posso rodar `docker compose up` no homelab e ter o app servindo HTTPS via Caddy

---

## 💬 Comunicação comigo durante a execução

- **Reporte progresso** após cada épico concluído
- **Pergunte** se algo aqui contradiz uma boa prática que você conhece — quero discutir antes de você desviar
- **Não use emojis em código** (variáveis, comentários, logs); pode usar em docs e commits
- **Se demorar muito** numa decisão pequena, escolha o caminho mais simples e documente como ADR

Boa execução. Vamos construir algo de qualidade.

— Yuri
