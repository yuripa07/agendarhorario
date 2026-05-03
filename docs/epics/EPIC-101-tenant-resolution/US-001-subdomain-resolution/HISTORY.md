# Histórico

## 2026-05-03

**Implementado:** resolução de tenant por subdomínio, contexto assíncrono e testes unitários.

**Decisões tomadas:** usar `AsyncLocalStorage` nativo do Node para evitar dependência externa nesta fase.

**Ajustes necessários no futuro:** aplicar o contexto em repositories de domínio quando as tabelas multi-tenant forem criadas.
