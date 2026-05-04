# US-001: Configurar branding mínimo do tenant

**Épico pai:** [EPIC-109](../README.md)
**Status:** ✅ Done
**Criado em:** 2026-05-04

## 📖 Narrativa

> Como **prestador administrador**,
> Eu quero **configurar o nome de exibição e a cor primária do meu tenant**,
> Para que **as interfaces do sistema reflitam a identidade básica do meu negócio**.

## 🎯 Critérios de aceite (Gherkin)

### Cenário 1: consultar branding administrativo

**Dado** que existe um tenant resolvido pelo `Host`,
**Quando** o admin autenticado consulta o branding,
**Então** a API retorna `displayName` e `primaryColor` do tenant atual.

### Cenário 2: atualizar branding administrativo

**Dado** que existe um tenant resolvido pelo `Host`,
**Quando** o admin autenticado atualiza `displayName` e `primaryColor` válidos,
**Então** a API persiste e retorna o branding atualizado.

### Cenário 3: rejeitar cor inválida

**Dado** que o admin informa uma cor fora do formato `#RRGGBB`,
**Quando** ele solicita a atualização,
**Então** a API retorna erro de validação.

### Cenário 4: consultar branding público

**Dado** que existe um tenant resolvido pelo `Host`,
**Quando** a UI pública consulta o branding,
**Então** a API retorna `displayName` e `primaryColor` sem exigir sessão administrativa.

### Cenário 5: preservar isolamento multi-tenant

**Dado** que existem tenants diferentes,
**Quando** a API é chamada com hosts diferentes,
**Então** cada resposta contém somente o branding do tenant resolvido.

## 🔧 Considerações técnicas

- A API administrativa usa `GET /admin/tenant/branding` e `PATCH /admin/tenant/branding`.
- A API pública usa `GET /public/tenant/branding`.
- A implementação usa a tabela `tenants` existente, sem migration.
- O bounded context é `tenancy`, com use case, repository e controllers seguindo o padrão atual.

## 🔒 Considerações de segurança

- Rotas administrativas exigem sessão Better Auth.
- O tenant vem do contexto resolvido pelo `Host`, nunca do body.
- Endpoint público retorna apenas dados não sensíveis de branding.

## ♿ Considerações de acessibilidade

- Sem impacto direto nesta task, pois a entrega é API. A UI futura deve aplicar cor com contraste adequado.

## 🧪 Estratégia de teste

- Unit: schemas, consulta e atualização por use case.
- E2E: rotas admin protegidas, rota pública sem sessão, validação de cor e isolamento por `Host`.

## 🔗 Tasks

| ID | Título | Status |
|----|--------|--------|
| [TASK-001](./TASK-001-tenant-branding-backend.md) | Criar backend de branding do tenant | ✅ |

## 📚 Referências

- [ADR-001](../../../adrs/ADR-001-multi-tenant-strategy.md)
- [ADR-002](../../../adrs/ADR-002-clean-architecture.md)

## 📜 Ver [HISTORY.md](./HISTORY.md)
