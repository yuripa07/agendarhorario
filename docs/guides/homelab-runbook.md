# Runbook homelab

## Pré-requisitos

- Docker e Docker Compose instalados.
- Caddy com suporte a HTTPS automático.
- Cloudflare Tunnel apontando para o serviço Caddy.
- Variáveis preenchidas em `.env`.

## Deploy

1. Copie `.env.example` para `.env` e ajuste secrets.
2. Rode `docker compose up -d --build`.
3. Rode migrations com `docker compose exec api pnpm db:migrate` se o pacote estiver disponível na imagem operacional.
4. Verifique `https://agendarhorario.com.br/health`.

## Observação

Para wildcard com Cloudflare DNS challenge em produção, use imagem Caddy com plugin Cloudflare ou forneça certificados via automação externa.
