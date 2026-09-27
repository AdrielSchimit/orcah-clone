# Relatório final de release — 27/09/2026

## Resultado: publicação na `main` **BLOQUEADA** (Resend não configurado)

O gate exige Auth real funcionando (e-mail de confirmação e recuperação de senha chegando de verdade).
Na Vercel não existem `RESEND_API_KEY` nem `AUTH_EMAIL_FROM` (nem Preview nem Production), e não há
credencial Resend disponível localmente. Sem isso nenhuma conta nova consegue confirmar o e-mail, então
**não houve merge para `main` nem deploy de Production**. Todo o resto está pronto e validado na `develop`.

| Item | Valor |
|---|---|
| HEAD develop | `a1ea1e9` (+ este relatório) |
| HEAD main | `62c6316` (inalterada) |
| Merge commit | — (não feito) |
| Production em uso | `dpl_D3QVejeeFAid7ahGGQodahcxMdw7` (commit `c6bbcca`), READY, saudável |
| Preview develop | `dpl_CoJ3JBorVotf3atfVFNitFtzvktY` — https://orcah-clone-git-develop-adrielschimits-projects.vercel.app |

> O deploy de Production do commit `62c6316` (César, direto na `main`) falhou no build (erro de tipo) —
> por isso Production continua na `c6bbcca`. A correção está na `develop` (`d8b2718`).

## Para destravar (só o dono pode fazer)

1. Resend: domínio verificado (ex.: `orcah.com.br`) e uma API key.
2. Vercel → orcah-clone → Environment Variables, em **Preview e Production**:
   - `RESEND_API_KEY`
   - `AUTH_EMAIL_FROM` — ex.: `Orçah <nao-responda@SEU-DOMINIO>` (precisa ser do domínio verificado)
3. Redeploy do Preview da `develop` (as envs só valem em builds novos) e rodar o roteiro:
   cadastro → e-mail → confirmar → onboarding → painel → sair → entrar → esqueci a senha → e-mail → nova senha → entrar.
4. Com isso verde:
   ```
   git checkout main && git pull
   git merge --no-ff --no-commit develop     # vai acusar conflito: esperado
   git checkout develop -- .
   git add -A
   git diff --cached develop --stat          # TEM que sair vazio
   git commit -m "merge: publica nova versao"
   git push origin main
   ```
   Por que assim: a `main` não tem nada que a `develop` não tenha — `c6bbcca` tem a mesma árvore de `7ca4682`
   e o commit do César (`62c6316`) tem o mesmo patch-id do cherry-pick `5dfd153`. O merge textual conflita em
   `api/orcamentos/[id]/route.ts` e `painel/orcamentos/[id]/page.tsx` (linhas corrigidas) e, pior, **auto-mescla
   errado**: com `-X theirs` o bloco que grava o evento de republicação fica duplicado, e `budget-cycle.ts` /
   `budget-cycle.test.ts` (criados nos dois lados) ganham linhas repetidas. Pegar a árvore inteira da `develop`
   preserva o histórico dos dois lados (autoria do César incluída) sem duplicar lógica. Simulado em worktree
   descartável: diff final vs `develop` = 0.

## Supabase

Migrations `password_reset` e `auth_verificacao_roles` aplicadas pelo dono no SERVIDOR ORCAH (não reaplicadas).
Preview confirma: nenhuma rota de auth dá 500; cadastro grava conta pendente; `auth_attempts` conta tentativas.

Atenção: enquanto Production roda código antigo, contas criadas lá nascem com `email_verified_at = null`.
Quando a nova versão for publicada, essas contas vão ver “Confirme seu e-mail” — resolvem pelo reenvio ou por
“Esqueci a senha” (a redefinição também confirma o e-mail). Opcional no dia da publicação:
`UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL AND created_at < '<data do merge>';`
(isso também confirmaria contas de sonda/teste criadas pelo Preview — ver abaixo).

## Auth 2.0

Validado no Preview (banco real), sem e-mail:

- `/login`, `/cadastro`, `/recuperar-senha`, `/verificar-email`: 200.
- Login inexistente: 401 genérico. Token de verificação inválido: 400.
- Cadastro com `"role":"ADMIN"`: 200, conta pendente, sem cookie de sessão; login → 403 “Confirme seu e-mail para continuar.”
- Recadastro do mesmo e-mail pendente: só reenvia, não sobrescreve.
- Rate limit de login: 5 erros → 429.
- Reenvio de verificação e recuperação: 503 com mensagem limpa (falta Resend), log sem segredo.

Validado localmente (servidor descartável, 29/29 + testes automáticos): política de senha igual no front e no
servidor, token SHA-256 de uso único com TTL 30 min, `email_verified_at` preenchido, sessão só depois de
verificar, recuperação invalida sessões antigas, senha antiga falha, cookie `HttpOnly; SameSite=Lax; Path=/; Secure` em produção.

Admin: só `users.role = 'ADMIN'` (backdoors por e-mail/slug removidos). `schimitadriel100@gmail.com` é ADMIN.
`cesar.turmina1@gmail.com` ainda não existe — quando ele se cadastrar, será USER; promover depois com
`UPDATE users SET role='ADMIN' WHERE email='cesar.turmina1@gmail.com';`. `cesarteste@gmail.com` permanece USER.

Conta de sonda criada no banco real pelo teste do Preview: `sonda.orcah.<timestamp>@example.com`, pendente, USER
(domínio reservado, nunca recebe e-mail). Pode ser apagada quando quiser.

## Página Comercial 2.0, Bottom nav, Ciclo de alteração

- Página Comercial 2.0: validada E2E no Preview da branch dela (missão anterior) e integrada na `develop` por fast-forward.
- Bottom nav: Início · Clientes · **Orçamento** (central, ícone oficial, preto + dourado, elevado) · Página · Mais;
  safe-area com `viewportFit: cover`; 45 combinações 320–430 px sem overflow nem sobreposição com o mascote.
- Ciclo do César: pedido de alteração → edição → versão anterior salva → `sent` → nova aprovação; clique duplo
  não duplica versão; versão antiga não pode ser aprovada durante o pedido; segundo ciclo ok; aprovado não edita (27/27 local).

## Testes e CI

- `npm test` 143/143 · `db:validate` · `typecheck` · `lint` · `build`: ok em `a1ea1e9`.
- GitHub Actions “Build diagnostic” na `develop`: verde.
- Logs do Preview: nenhum 500 / Prisma / storage / timeout; só o aviso esperado “Resend não configurado”.

## Pendências

1. **Resend** (bloqueio do release) — ver “Para destravar”.
2. Teste real no celular do fluxo completo e da safe-area no iPhone.
3. Promover o César a ADMIN depois que ele criar a conta.
4. Remover `ADMIN_EMAILS` da Vercel (não é mais usada).
5. Versões do orçamento guardam totais e observações, não os itens.
