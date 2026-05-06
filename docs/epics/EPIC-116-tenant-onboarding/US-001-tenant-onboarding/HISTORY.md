# Histórico

## 2026-05-06 20:37

**Resumo:** Implementado onboarding controlado para criar tenant e primeiro admin por convite de uso unico.

**Decisões tomadas:** Convites sao gerados por CLI operacional e armazenam apenas hash do token. O primeiro admin recebe membership `owner` no tenant, e endpoints admin agora validam sessao e vinculo com o tenant resolvido por `Host`.

**Validacoes:** lint, typecheck, testes unitarios/componentes, E2E de API com migration local e Playwright web.
