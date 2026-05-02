# ADR-009: Homelab com Docker Compose e Caddy

**Status:** Accepted
**Data:** 2026-05-02
**Decididores:** Yuri

## Contexto

O deploy inicial será no homelab e deve migrar facilmente para Railway/Vercel/Neon.

## Decisão

Containerizar API e web, usar Postgres em container no dev/homelab e Caddy como reverse proxy.

## Alternativas consideradas

- **Processos diretos no host:** simples, menos reproduzível.
- **Docker Compose:** reproduzível e próximo da futura migração.

## Consequências

### Positivas

- Deploy repetível.

### Negativas

- Wildcard TLS com Cloudflare pode exigir imagem Caddy customizada.
