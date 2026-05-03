# TASK-001: Implementar tenant resolution

**Status:** ✅ Done

## Escopo

- Criar módulo `TenancyModule`.
- Criar parser de `Host` header.
- Criar `TenantContextService` baseado em `AsyncLocalStorage`.
- Criar repositório de tenant por `slug`.
- Criar middleware de resolução de tenant.
- Configurar variáveis `ROOT_DOMAIN` e `RESERVED_SUBDOMAINS`.
- Cobrir parser, contexto e middleware com testes unitários.

## Resultado

O backend agora consegue identificar o tenant da requisição por subdomínio e disponibilizar esse contexto para os próximos módulos do MVP.
