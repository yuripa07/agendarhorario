# Como adicionar um novo tenant

1. Crie registro na tabela `tenants` com `slug`, nome, timezone e cor primária.
2. Configure DNS/subdomínio se necessário.
3. Valide resolução pelo `Host` header quando EPIC-101 for implementado.
4. Confirme que dados de domínio usam `tenant_id`.
