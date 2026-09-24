# Ordem de construção — Orçah

Mapa de execução. Spec completa: [produto.md](./produto.md). Ramos: [ramos.md](./ramos.md). Moldes: [modelos-categorias.md](./modelos-categorias.md). Checklist fino: [ramos-moldes.md](./ramos-moldes.md).

Regra: cada etapa só começa quando a anterior está **usável**. Não pular para PWA, PDF ou assinatura antes do fluxo criar → enviar → responder.

---

## Princípios

1. **Uma coisa por vez.** Dados, depois conta, depois orçamento, depois conversão.
2. **SaaS desde a primeira query.** Tudo da empresa leva `company_id`.
3. **Localização.** Estado é cadastro (`states`). Cidade a pessoa **digita**; o banco une o mesmo nome no mesmo estado mesmo com acento diferente (`Cunha Pora` = `Cunha Porã`). Cidade pode ficar em branco.
4. **MVP = o coração.** Cadastrou, criou orçamento, mandou no Zap, cliente abriu e respondeu.
5. **Busca pelo nome que a pessoa fala.** Campo **Ramo**. Prévia ao clicar; **Outro** sempre por último. Digitou um nome que não está na lista → **Usar este ramo**.
6. **Um motor de orçamento.** Ramo só muda textos, caixas e detalhes.

---

## Etapa 0 — Fundação *(feita)*

- [x] Next.js + TypeScript + Tailwind
- [x] Paleta e marca em `public/brand/`
- [x] Docs de produto, paleta, concorrente, moldes e ramos

---

## Etapa 1 — Banco *(feita)*

Objetivo: MySQL no WAMP com Prisma, tabelas e localização.

- [x] Prisma + banco `orcah`
- [x] Tabelas SaaS (`users` … `subscriptions`)
- [x] `states` (27 UFs) e `cities` (capitais + algumas de teste, ex. Maravilha-SC)
- [x] Seed de **ramos oficiais** (molde + aliases) — [ramos.md](./ramos.md)
- [x] `business_categories.template_key` e `search_aliases`

Cidades do Brasil inteiro (IBGE) **não entram**. A pessoa escreve a cidade; a gente só ajusta maiúsculas e une o mesmo nome sem acento (`Cunha Pora` = `Cunha Porã`).

**Pronto quando:** phpMyAdmin mostra as tabelas e o seed de ramos bate com o MD.

---

## Etapa 2 — Conta e empresa *(feita)*

Objetivo: o prestador cria conta, escolhe ramo e cidade, entra no painel.

Fluxo usável:

1. `/cadastro` — nome, e-mail, senha, telefone  
2. `/onboarding` — empresa, **ramo** (prévia + Outro), **estado**, cidade digitada (opcional), trabalho na região, WhatsApp  
3. `/painel` — “olá” + lista + novo orçamento  
4. `/login` e sair  
5. `/recuperar-senha` — tela existe; e-mail de verdade pode ficar para depois

Checklist:

- [x] Cadastro cria `users` com senha em hash
- [x] Sessão em cookie httpOnly
- [x] Busca de ramo (prévia + Outro por último)
- [x] Select só do estado; cidade digitada (opcional)
- [x] “Trabalho na região” → no perfil: Maravilha-SC e Região
- [x] Grava `companies` com `company_id` amarrado ao usuário, slug, `template_key` via ramo
- [x] Quem não terminou o onboarding não entra no painel
- [x] Mobile-first, paleta creme / marinho / ouro

Ainda **não** nesta etapa: logo upload, PDF, PWA.

Cadastro da empresa (localização):

| Campo | Tipo | Obrigatório |
| --- | --- | --- |
| Estado | UF de `states` | sim |
| Cidade | texto (grava em `cities`, une pelo slug sem acento) | não |
| Trabalho na região | sim/não | não |
| Bairro | texto | não |
| CEP | texto | não |
| Endereço | texto | não |

No perfil, abaixo do nome da empresa:

- Com cidade e região: **Presta serviços em Maravilha-SC e Região**
- Com cidade, sem região: **Presta serviços em Maravilha-SC**
- Sem cidade: **Presta serviços em Santa Catarina** (ou “e Região”)

### Ramo (prévia + Outro)

Campo: **Ramo**. Ao clicar, aparece uma prévia (encanador, construtora, marceneiro…). **Outro** sempre por último.

- Digitou e escolheu um da lista → grava o ramo oficial
- Digitou e escolheu **Outro** → “Usar este ramo” com o nome que a pessoa escreveu
- Sem ramo duplicado por apelido; aliases em [ramos.md](./ramos.md)

| Digitou | Encontra |
| --- | --- |
| encanador, cano | Encanador / hidráulico |
| construtora, construtor | Construtora |
| marceneiro, marcenaria | Marceneiro |

---

## Etapa 3 — Núcleo do orçamento *(feita)*

Objetivo: criar e guardar uma proposta. Um motor só; molde do ramo entra nos textos depois.

Sai usável quando: cadastrar cliente, montar itens, gravar orçamento com `public_token`.

Fluxo:

1. `/painel` — lista + **Novo orçamento**
2. `/painel/clientes` — cadastro simples (UF/cidade opcional)
3. `/painel/orcamentos/novo` — cliente existente ou novo, itens, desconto, validade, cidade do serviço
4. `/painel/orcamentos/{id}` — rascunho editável, número `ORÇ-2026-000123`, token já gerado

Checklist:

- [x] Cliente com `company_id` (nome + telefone obrigatórios; UF/cidade opcional)
- [x] Orçamento com itens, desconto, validade, prazo, observações
- [x] Cidade/UF do serviço (não texto livre)
- [x] Número sequencial por empresa/ano + `public_token` único
- [x] Evento `created` na timeline
- [x] Catálogo de serviços (sugestão do ramo)
- [x] Fotos no orçamento
- [x] Página pública `/orcamento/{token}` — etapa 4

---

## Etapa 4 — Enviar e converter *(feita)*

Objetivo: o cliente recebe, abre e responde. **Coração do produto.**

Sai usável quando: link público funciona sem login e o status muda no painel.

Fluxo:

1. Prestador clica **Enviar pelo WhatsApp** → `wa.me` + status `sent`
2. Cliente abre `/orcamento/{token}` sem conta → status `viewed` (data + IP)
3. Aprovar / recusar / pedir alteração
4. Painel mostra o status e o resumo do mês

Checklist:

- [x] Página pública sem login
- [x] Visualização registrada
- [x] Aprovar / recusar (com motivo) / pedir alteração
- [x] WhatsApp via `wa.me` (sem API oficial)
- [x] Lista + números do mês no painel
- [ ] Follow-up automático — depois (não é a próxima etapa)

O follow-up é um **lembrete no WhatsApp**, não um pagamento. Exemplo: o cliente recebeu o orçamento há 3 dias e não respondeu; o painel sugere “Enviar lembrete” e abre o Zap com um texto pronto. Sem API oficial. Fica para depois do Asaas.
- [x] PDF — etapa 6

---

## Etapa 5 — Presença digital *(feita)*

Objetivo: a empresa tem um mini-site para colar na bio do Instagram.

Sai usável quando: o link da loja abre, o cliente pede orçamento e o pedido chega no painel.

Fluxo:

1. `/painel/empresa` — descrição, contatos, logo, galeria, copiar link
2. `nomeloja.orcah.com.br` — perfil público. `nomeloja.orcah.com.br/painel` — painel da loja. `orcah.com.br/painel` abre o login e, depois de entrar, cai no painel da loja.
3. **Pedir orçamento** grava `quote_requests`
4. `/painel/pedidos` — lista e responde no WhatsApp

Checklist:

- [x] Página pública da empresa
- [x] Cidade/UF e “e Região” no perfil
- [x] Galeria de trabalhos
- [x] Pedir orçamento (nome + WhatsApp)
- [x] Pedidos no painel
- [x] Subdomínio da loja (`slug.orcah.com.br` e `slug.orcah.com.br/painel`; no local: `slug.localhost:3000`)
- [ ] QR Code — depois

---

## Etapa 6 — PDF, PWA e plano *(feita)*

Objetivo: o orçamento vira PDF, o app instala no celular, e o plano único aparece.

Sai usável quando: dá para baixar o PDF, adicionar o Orçah na tela inicial, e ver o teste de 7 dias / plano.

Checklist:

- [x] PDF do orçamento (painel e link público)
- [x] PWA (manifest + service worker + ícone)
- [x] Trial 7 dias ao criar a empresa
- [x] Plano único na tela (ativação local; pagamento real = etapa 7)
- [x] Relatório simples do mês, inclusive por cidade

---

## Etapa 7 — Pagamento Asaas *(atual)*

Objetivo: o prestador paga o Orçah de verdade, **no visual do Orçah**, com Pix e cartão. Processador: **Asaas** (não Stripe, não Cakto, não Mercado Pago).

Preço do plano único: **R$ 29/mês**.

Sai usável quando: no fim do trial, **Ativar plano** cobra R$ 29 (Pix ou cartão), o webhook libera a empresa, e o cancelamento/falha volta o acesso para bloqueado.

### Conta (você faz fora do código)

Duas contas, porque sandbox e produção **não compartilham** nada:

1. **Sandbox agora** — [sandbox.asaas.com](https://sandbox.asaas.com/) — testa sem dinheiro real
2. **Produção depois** — [asaas.com](https://www.asaas.com/) — recebe de verdade (CPF serve para começar; CNPJ para Pix Automático, depois de 6 meses)

Guarde a API Key só no `.env`. Nunca no git nem no chat.

### O que entra no site (nessa ordem)

1. **Preço e copy** — R$ 29 no `plan.ts`, onboarding, `/painel/plano` e botão Ativar
2. **Segredos** — `ASAAS_API_KEY`, `ASAAS_API_URL` (sandbox vs produção), `ASAAS_WEBHOOK_TOKEN`
3. **Cliente Asaas** — ao ativar, cria/atualiza o customer (nome, e-mail, CPF/CNPJ, `externalReference` = `company_id`)
4. **Checkout no Orçah** — tela em `/painel/plano`: Pix (QR + copia e cola) e cartão. Sem redirecionar para a fatura do Asaas. Cartão tokenizado; dado do cartão não passa pelo nosso servidor em texto
5. **Assinatura** — cobrança recorrente mensal de R$ 29; gravar `provider = "asaas"` e `providerSubscriptionId`
6. **Webhook** — `POST /api/webhooks/asaas`  
   Eventos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `SUBSCRIPTION_DELETED`  
   Validar header `asaas-access-token`. Responder 200 rápido. Idempotente.
7. **Acesso** — pago → `active`; atrasado/cancelado → bloqueia o painel (orçamento público do cliente continua abrindo)
8. **Falha e recibo** — erro de cartão visível; Pix pendente até o webhook; status da assinatura no plano

Ainda **não** nesta etapa: Pix Automático (precisa CNPJ com 6 meses), NFS-e, checkout hospedado Asaas como tela principal.

### Banco

`subscriptions` já tem `provider` e `provider_subscription_id`. Completar se faltar: id da cobrança, próximo vencimento, meio (pix/cartão). CPF/CNPJ do pagador (o dono do Orçah) no cadastro da empresa, se ainda não estiver no onboarding.

Checklist:

- [x] Conta Sandbox + API Key no `.env` local (`ASAAS_API_URL` sandbox + `ASAAS_API_KEY` de homologação)
- [ ] `ASAAS_WEBHOOK_TOKEN` — invente uma senha, cole no Asaas (Integrações → Webhooks) e no `.env`. URL: `https://seu-dominio/api/webhooks/asaas`. No localhost o Pix confirma por consulta, não por webhook.
- [x] Preço R$ 29 no produto
- [x] Checkout transparente em `/painel/plano` (Pix + cartão)
- [x] Webhook liga/desliga o plano (endpoint pronto; token e URL pública ainda faltam)
- [x] Trial local continua 7 dias até o primeiro pagamento
- [ ] Conta Produção + credenciais de produção (quando o site estiver no ar)
- [ ] Pix Automático — depois, com CNPJ

---

## Etapa 8 — Moldes por ramo *(feita)*

Objetivo: o mesmo motor de orçamento **parece do ofício**. Pintor vê m² e foto; pedreiro vê mão de obra e material; construtora vê etapa. Spec: [modelos-categorias.md](./modelos-categorias.md).

`template_key` da empresa muda o formulário, a página pública, o PDF e a mensagem do WhatsApp. O motor continua um só.

Sai usável quando: um pintor e um pedreiro criam orçamento e o cliente vê propostas **diferentes**, sem tela nova por ofício.

Nesta ordem, só o que muda a cara:

1. Pacote JSON por molde (rótulos, unidades, sugestões)
2. Formulário lê o `template_key` da empresa
3. Página pública + PDF na mesma ordem de seções
4. Fotos no orçamento (já tem tabela `budget_photos`)
5. Catálogo sugerido do ramo (dá para apagar; molde não prende)

MVP visível, nesta ordem:

1. `base`
2. `equipe-obra`
3. `acabamento-visual`
4. `construtora`

`revestimento` e `oficina-tecnico` na sequência, se o 1–4 estiver usável.

Checklist:

- [x] Molde `base` explícito (unidade, textos)
- [x] `equipe-obra` no form + página pública + PDF
- [x] `acabamento-visual` (foto com subtítulo)
- [x] `construtora` (etapas)
- [x] Sugestões de item do ramo (catálogo leve)
- [x] `revestimento` e `oficina-tecnico` na mesma casca
- [x] Fotos no orçamento
- [x] Conta de análise (`cesar.turmina1@gmail.com` / slug `cesar-turmina`): todos os moldes, sem trial e sem cobrança; orçamentos e PDFs só nessa empresa

---

## O que não fazer ainda

Nativo, API oficial do WhatsApp, NF-e, estoque, financeiro do prestador, Pix no orçamento do cliente dele, agenda, equipe, IA, marketplace, Pix Automático, follow-up automático, QR Code.

Itens **estacionados** (existem no spec, não travam o MVP):

- Follow-up automático (lembrete no Zap depois de X dias sem resposta)
- QR Code da página da loja
- E-mail de verdade em “esqueci a senha”
- Cidades IBGE do Brasil inteiro — **não faremos**; cidade é digitada
- Pix Automático (CNPJ com 6 meses)

---

## Agora

**Etapa 7 no ar em sandbox:** Pix e cartão em `/painel/plano` a R$ 29. Falta token de webhook + conta produção quando o site estiver público.
