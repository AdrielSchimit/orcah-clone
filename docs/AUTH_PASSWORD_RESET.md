# Autenticação e recuperação de senha

Decisão de produto: **login normal com e-mail + senha**, **recuperação de senha por e-mail (Resend)** e **sessão persistente**. Nada de magic link.

## Cadastro

`POST /api/auth/register` (`src/app/api/auth/register/route.ts`)

- Nome (mín. 2 letras), e-mail, telefone opcional, senha.
- E-mail normalizado (`normalizeEmail`: `trim` + minúsculas) e validado (`emailIsValid`).
- Senha: mínimo **8 caracteres** (`MIN_PASSWORD_LENGTH` em `src/lib/password-rules.ts`, usado no servidor e nos formulários). Sem outras regras.
- Senha guardada com **bcrypt** (custo 10, `src/lib/password.ts`).
- Cria a sessão e manda para `/onboarding` → empresa → `/painel`.

## Login

`POST /api/auth/login` → `authenticateLogin` (`src/lib/auth-login.ts`)

- Erro sempre genérico: **"E-mail ou senha incorretos."** — igual para senha errada e para e-mail sem conta.
- E-mail sem conta também roda um `bcrypt.compare` (contra um hash fixo), para o tempo de resposta não revelar se a conta existe.
- Rate limit (ver abaixo). Com conta e senha certas → `/painel` (ou `/onboarding` se ainda não tem empresa).

## Sessão

`src/lib/session-token.ts` e `src/lib/session.ts`

- JWT HS256 assinado com `AUTH_SECRET`, cookie `orcah_session`.
- Duração centralizada em `SESSION_TTL_DAYS = 30` (JWT e `maxAge` do cookie).
- Cookie: `httpOnly`, `sameSite=lax`, `secure` em produção, `path=/`. Em domínio próprio o cookie é compartilhado com os subdomínios das empresas (`sessionCookieIsShared`).
- Nada de autenticação em `localStorage`.
- Logout: `/api/auth/logout` apaga o cookie.

### Sessões antigas depois de trocar a senha

A coluna nova `users.password_changed_at` guarda quando a senha foi redefinida. `getSessionUser` compara com o `iat` do JWT (`sessionIsCurrent`): sessão emitida **antes** da troca deixa de valer.

- Usuário que nunca trocou a senha (`password_changed_at` nulo) **não perde a sessão**.
- Limitação: o `proxy.ts` só verifica a assinatura do JWT (roda sem banco). Uma sessão derrubada ainda passa pelo proxy, mas o painel e as APIs usam `getSessionUser` e mandam para `/login`.

## Recuperação de senha

Telas: `/recuperar-senha` (pede o e-mail) e `/redefinir-senha?token=...` (nova senha).
APIs: `POST /api/auth/password-reset/request` e `POST /api/auth/password-reset/confirm`.
Lógica: `src/lib/password-reset.ts`, regras puras em `src/lib/auth-security.ts`.

Fluxo:

1. Usuário digita o e-mail.
2. Resposta **sempre a mesma**, exista conta ou não: *"Se existir uma conta com esse endereço, você receberá um link para redefinir sua senha."*
3. Se a conta existe: gera token, grava só o hash, envia o link pelo Resend.
4. Link vale **15 minutos** e **uma vez só**.
5. Nova senha (mín. 8) → novo bcrypt em `password_hash`, token marcado com `used_at`, `password_changed_at` atualizado, outros links pendentes do usuário também são marcados como usados.
6. Usuário entra com a nova senha. A antiga deixa de funcionar.

### Token

- `randomBytes(32)` em base64url (256 bits).
- No banco vai **só o SHA-256 em hex** (`password_reset_tokens.token_hash`); o token puro existe apenas no e-mail.
- Status: `valid`, `expired` (passou de 15 min), `used` (`used_at` preenchido), `invalid` (não existe).
- O consumo é atômico (`updateMany ... where used_at is null and expires_at > agora` dentro de transação): dois cliques ao mesmo tempo não trocam a senha duas vezes.
- Registros velhos (tokens vencidos/usados e tentativas com mais de 24 h) são apagados a cada novo pedido.

### Anti-enumeração

- Pedido de recuperação: mesma resposta com ou sem conta; nunca "usuário não encontrado".
- Falha de envio no Resend: o usuário recebe a mesma mensagem genérica; o erro vai só para o log do servidor, sem e-mail, token ou link.
- Resend não configurado: resposta `503` "Recuperação de senha indisponível no momento", **igual para qualquer e-mail** (checada antes de olhar o usuário).
- Limitação conhecida: quando a conta existe há o tempo extra de gravar o token e chamar o Resend; é uma diferença pequena de tempo, aceita nesta fase.

## Rate limit

Tabela `auth_attempts` (janela de **10 minutos**, nada é bloqueado para sempre):

| Ação | Limite |
| --- | --- |
| Login com erro, por e-mail | 5 tentativas / 10 min |
| Login com erro, por IP | 20 tentativas / 10 min |
| Pedido de recuperação, por e-mail | 3 pedidos / 10 min |
| Pedido de recuperação, por IP | 10 pedidos / 10 min |

- O IP é guardado como HMAC-SHA256 com `AUTH_SECRET`, nunca puro.
- Estourou → `429` "Muitas tentativas. Aguarde alguns minutos…". Passada a janela, volta ao normal.

## Resend

`src/lib/resend.ts` (somente servidor).

- Assunto: **Redefina sua senha do Orçah**.
- Corpo: título, "Recebemos uma solicitação para alterar sua senha.", botão **Criar nova senha**, "Este link expira em 15 minutos.", "Se você não solicitou isso, ignore este e-mail." (texto puro + HTML).
- O SDK do Resend não lança exceção em erro de API (devolve `{ error }`); o código trata isso.
- Testes nunca chamam o Resend: o envio é injetado (`sendEmail`) e os testes usam um mock.

## Links do e-mail (URL do app)

O link usa o helper existente `appUrl()` (`src/lib/urls.ts`), que **não usa o header `Host`**:

- Production: `NEXT_PUBLIC_APP_URL`.
- Preview da Vercel: `VERCEL_URL` do próprio deploy (automático).
- Local: `http://localhost:3000`.

Não existe uma env `APP_URL` separada: o projeto já usa `NEXT_PUBLIC_APP_URL`.

Observação sobre o Preview: se a proteção de deploy da Vercel estiver ligada, quem abrir o link do e-mail no Preview precisa estar logado na Vercel.

### Subdomínios

`/redefinir-senha` entrou no `matcher` do `proxy.ts` e em `isApexAuthPath`: se alguém abrir o link num subdomínio de empresa, é redirecionado para o domínio do app **com o token preservado**. A página não exige sessão.

## Migration

`prisma/migrations/20260925172000_password_reset/migration.sql` — **só aditiva**:

- `ALTER TABLE users ADD COLUMN password_changed_at` (opcional, nulo para todos).
- `CREATE TABLE password_reset_tokens` e `CREATE TABLE auth_attempts` com índices.

Não altera nem apaga nenhum usuário ou `password_hash`. Aplicar com `npm run db:deploy` no ambiente certo.

## Variáveis de ambiente

| Env | Uso |
| --- | --- |
| `AUTH_SECRET` | assina o JWT e o HMAC do IP (já existia) |
| `NEXT_PUBLIC_APP_URL` | base dos links em produção (já existia) |
| `RESEND_API_KEY` | chave do Resend (nova) |
| `AUTH_EMAIL_FROM` | remetente, ex. `Orçah <nao-responda@seu-dominio.com.br>`, em domínio verificado no Resend (nova) |

Nada de valores reais no repositório (`.env.example` só tem exemplos).

## Logs

Nunca vão para o log: senha, `password_hash`, token, URL com token, API key, cookie ou JWT. Os únicos logs novos são "Resend não configurado" e "falha ao enviar e-mail de recuperação" com a mensagem do erro, que não contém o link.

## Testes

`tests/auth.test.ts` (banco em memória + Resend mockado): normalização de e-mail, senha mínima, login certo/errado/inexistente, rate limit de login e de recuperação, token aleatório e só com hash no banco, 15 minutos, token válido/expirado/usado/inexistente, troca de senha (antiga falha, nova entra), sessões antigas derrubadas, anti-enumeração, falha de envio e conteúdo do e-mail.

## Limitações

- Sessão continua JWT sem estado; a revogação é só por troca de senha (não há "sair de todos os aparelhos" nem lista de sessões).
- Rate limit fica no banco (sem Redis): suficiente para o volume atual.
- Pequena diferença de tempo entre e-mail com e sem conta no pedido de recuperação.
