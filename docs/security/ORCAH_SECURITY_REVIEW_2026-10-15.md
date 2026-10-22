# Auditoria de segurança ORÇAH — 15/10/2026

> **RASCUNHO PARA REVISÃO. Nenhum SQL deste PR foi executado.**
>
> Pasta `docs/security/manual` fica **fora** de `prisma/migrations`.
> Merge deste PR (se ocorrer) **não é autorização** para aplicar a migration.

## Contexto confirmado (Supabase SERVIDOR ORCAH)

- 21 tabelas do Prisma em `public` têm RLS desabilitada e privilégios SQL amplos para `anon` e `authenticated` (inclusive `users`, `password_reset_tokens`, `budgets` e `_prisma_migrations`).
- `public.support_threads` e `public.support_messages` já têm RLS, sem grants para os papéis públicos e com policies para `orcah_production_app` / `orcah_preview_app`. **Não alterar neste pacote.**
- `public.orcah_ops_shared_documents` e `ops_api.orcah_ops_shared_documents` pertencem ao Kanban compartilhado e ficam **fora** desta alteração.
- `orcah_production_app` e `orcah_preview_app` têm grants explícitos, mas **não têm BYPASSRLS** nem são proprietários das 21 tabelas, que são de `postgres`. Por isso **ativar RLS sem policies server-side quebra o Prisma**.
- `service_role` tem BYPASSRLS e grants de leitura; manter sua chave exclusivamente no servidor.
- Há 20 sequências em `public` utilizáveis por `anon`; o script cuida delas sem modificar `ops_api`.

## SQL proposto

`2026-10-15-hardening-public-prisma.sql` (210 linhas) é um script **manual**, executado apenas após as checagens. Em **uma transação**:

1. Confere existência dos papéis, proprietário, 21 tabelas e grants dos papéis do app, abortando se a topologia mudar.
2. Cria política `orcah_server_roles_full` restrita a `orcah_production_app` e `orcah_preview_app` (serviços privados).
3. Revoga grants dos papéis `PUBLIC`, `anon` e `authenticated` nessas 21 tabelas; garante grants necessários aos papéis privados.
4. Liga RLS e restringe uso direto das sequências do Prisma.
5. Confirma que os papéis públicos perderam acesso e que os papéis de aplicação conservam os grants.

Não houve testes DDL em Preview nem aplicação de SQL em produção.

## Portões obrigatórios antes de aplicar

- [ ] Revisão do César e do Adriel: confirmar que **nenhuma tela ou integração legítima** acessa estas 21 tabelas via `supabase-js` no browser ou usando `anon`.
- [ ] Confirmar que Production e Preview usam **as roles e bancos esperados**, sem publicar os valores de `DATABASE_URL` nem `DIRECT_URL`.
- [ ] Confirmar banco de Preview isolado com volume/backup restaurável; verificar a política de backup/PITR em produção.
- [ ] Rodar `2026-10-15-audit-readonly.sql` em Preview; comparar inventário.
- [ ] Testar a transação de hardening **em Preview**, com smoke tests de login, cadastro, CRUD clientes, orçamentos, páginas públicas, imagens e suporte.
- [ ] Comprovar, sem consultar dados sensíveis, `has_table_privilege('anon', 'public.users', 'SELECT') = false` e `has_table_privilege('orcah_production_app','public.users','SELECT') = true`.
- [ ] Validar `npx prisma migrate status` em Preview (não usar `migrate dev` em produção).
- [ ] Aplicação em produção **somente após autorização explícita**, com janela de baixa utilização e responsáveis presentes.
- [ ] Executar smoke test imediatamente após aplicação e monitorar erros no Vercel.

## Riscos / rollback

O rollback restaura privilégios inseguros e por isso deve ser **último recurso**, com revisão da equipe. Registrar previamente snapshot dos grants, policies e RLS, e reverter em transação apenas as alterações introduzidas por este script. Preferir corrigir a role/policy faltante a desligar a proteção. Nunca executar `TRUNCATE`, `DROP TABLE` ou resetar bancos.

**Importante:** `GRANT` e `RLS` são camadas diferentes. Um papel que tem grant não necessariamente pode ler uma linha quando RLS está ativa. Para o Prisma, a policy é explicitamente para as roles privadas; não há policy nova para `anon`/`authenticated`.

## Próxima fase: Operação ORÇAH

O site estático `operacao-orcah` usa `access.js` para verificar um hash no próprio navegador e `sync.js` para conectar ao Supabase usando chave publicável. O schema `ops_api` possui policy de leitura/escrita por `anon` para o workspace compartilhado.

**Isso significa que o código de acesso visual não garante autorização do banco.** Requer uma mudança coordenada: login autenticado no backend (Supabase Auth ou sessão server-side), RLS baseada em identidade autorizada, remoção do UPDATE/INSERT anônimo e teste de sincronização/realtime no navegador. Não revogar esses grants isoladamente: isso quebraria o Kanban compartilhado. A correção deve ser revisada em branch independente do repositório `operacao-orcah`.

## Dados da auditoria

- App `orcah-clone` release `dac04180`, Vercel Production READY em 14/10 (estado do deploy, não garantia funcional).
- Banco Supabase saudável; migrations de suporte aplicadas.
- Teste humano completo do chat, orçamento e PDF ainda pendente.
- O domínio `orcah.com.br` ainda foi encontrado na configuração do app legado Railway (sem alteração).
