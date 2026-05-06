# Como adicionar um novo tenant

1. Execute o CLI operacional no ambiente desejado:

   ```bash
   pnpm --filter @agendarhorario/api tenant:invite -- --slug studio-bela --display-name "Studio Bela" --admin-email admin@studio-bela.com.br
   ```

2. Envie a URL de onboarding exibida pelo comando para o primeiro admin.
3. O admin deve abrir `/admin/onboarding?token=...`, informar nome e senha, e concluir a ativacao.
4. Configure DNS/subdomínio se necessario.
5. Valide o acesso ao painel pelo `Host` do tenant.
