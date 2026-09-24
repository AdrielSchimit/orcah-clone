# SaaS — Plataforma de Orçamentos para Prestadores de Serviço

**Produto:** Orçah  
**Domínio:** [orcah.com.br](https://orcah.com.br)

Este documento é a especificação do produto. Onde o rascunho original dizia OrçaPro, leia **Orçah**.

## 0. Stack técnico (decisão inicial)

O app é **Node**. O WAMP entra só como **MySQL local**. PHP 8.2 e Composer ficam na máquina, mas **não entram no projeto**.

| Camada | Escolha | Por quê |
| --- | --- | --- |
| App | Next.js (App Router) + TypeScript + Tailwind | Padrão de SaaS: painel, páginas públicas e API no mesmo repo. PWA e mobile-first cabem aqui. |
| Runtime | Node.js + npm | Já instalado. Um `npm run dev` sobe o produto. |
| Banco | MySQL 8 do WAMP (`C:\wamp64`) | Pedido inicial. Isolamento por `company_id` desde o começo. |
| ORM | Prisma | Schema e migrations em `prisma/`. |
| Auth / assinatura / PDF | Depois | Não implementar agora. |

Não usar Laravel neste produto. A spec original citava Laravel + MySQL; o caminho atual é **Next.js + MySQL**. Mesmas tabelas, outro runtime.

---

## 1. Visão geral

A plataforma será um SaaS voltado principalmente para **prestadores de serviços, autônomos, MEIs e pequenas empresas** que atualmente fazem seus orçamentos pelo WhatsApp, papel, bloco de notas, Word ou planilhas.

A proposta é transformar o processo de:

**Cliente pede orçamento → empresa monta → envia → cliente visualiza → aprova/recusa → empresa acompanha**

em um fluxo simples, rápido e profissional.

O sistema deverá ser pensado **mobile-first**, porque o público-alvo provavelmente estará usando o sistema na rua, na obra, na casa do cliente ou diretamente pelo celular.

Não deverá existir necessidade de instalar um aplicativo pela Play Store inicialmente.

O sistema será um **PWA — Progressive Web App**, permitindo que o usuário acesse pelo navegador e escolha "Adicionar à tela inicial".

Assim, para o usuário final, a experiência será semelhante a um aplicativo:

* ícone na tela inicial;
* abertura em tela própria;
* interface otimizada para celular;
* login persistente;
* funcionamento em Android e iPhone;
* sem necessidade de publicação inicial na Play Store.

---

## 2. Proposta principal

O produto deve resolver uma dor muito específica:

> "Eu faço orçamento, mas não tenho uma maneira profissional e organizada de apresentar, acompanhar e recuperar esses orçamentos."

O sistema não deve tentar ser um ERP completo inicialmente.

O foco deve ser:

### CRIAR → ENVIAR → ACOMPANHAR → CONVERTER

O prestador poderá criar um orçamento em poucos minutos, gerar uma página profissional para o cliente e enviar pelo WhatsApp.

O cliente não precisa criar conta.

Ele simplesmente recebe um link e abre pelo celular.

---

## 3. Público-alvo

O sistema poderá atender diversos segmentos:

* Pedreiros
* Eletricistas
* Encanadores
* Pintores
* Marceneiros
* Serralheiros
* Vidraceiros
* Técnicos de ar-condicionado
* Técnicos de informática
* Mecânicos
* Funileiros
* Jardineiros
* Gesseiros
* Instaladores
* Fotógrafos
* Designers
* Social media
* Agências
* Arquitetos
* Decoradores
* Limpeza
* Diaristas
* Pequenas empresas de manutenção
* Assistências técnicas
* Pequenas empreiteiras
* Outros profissionais que trabalham através de orçamento

No cadastro, o usuário deverá escolher o ramo de atuação.

A lista oficial de ramos do cadastro está em [ramos.md](./ramos.md). O usuário escolhe um; categoria sem molde fino usa o **molde base**.

---

## 4. Modelo de negócio

Plano inicial:

## R$ 29,00/mês

Um único plano inicialmente.

Evitar criar vários planos antes de validar o produto.

O plano poderá incluir:

* clientes ilimitados;
* orçamentos ilimitados ou limite bastante alto;
* perfil público da empresa;
* logo;
* fotos;
* criação de orçamento;
* página pública do orçamento;
* PDF;
* envio pelo WhatsApp;
* acompanhamento dos orçamentos;
* histórico;
* relatórios básicos;
* página pública da empresa;
* solicitação de orçamento pelo cliente;
* instalação como aplicativo/PWA.

A ideia é transmitir:

> "R$29 por mês e pronto."

Sem complicar a venda.

---

## 5. Cadastro da empresa

Durante o primeiro acesso, o sistema deverá solicitar informações básicas:

### Dados da empresa

* Nome da empresa
* Nome comercial
* CNPJ — opcional
* CPF — opcional para autônomos
* Telefone
* WhatsApp
* E-mail
* Endereço — opcional
* **Estado (UF)** — obrigatório, lista de `states` (não texto livre)
* **Cidade** — obrigatória, lista de `cities` daquele estado
* Bairro — opcional
* CEP — opcional
* Site — opcional
* Instagram — opcional
* Facebook — opcional
* Descrição da empresa
* Ramo de atividade

### Identidade visual

O usuário poderá:

* enviar sua própria logo;
* escolher uma cor principal;
* escolher uma cor secundária;
* escolher modelo visual do orçamento.

Caso não tenha logo, o sistema deverá oferecer **logos/identidades genéricas próprias ou devidamente licenciadas**, evitando simplesmente utilizar imagens encontradas na internet sem autorização.

Exemplo:

> João Elétrica
> ⚡
> Instalações elétricas residenciais e comerciais

O usuário poderá começar imediatamente mesmo sem possuir identidade visual.

---

## 6. Perfil público da empresa

Essa é uma funcionalidade que considero MUITO interessante.

Cada empresa terá uma página pública própria.

Exemplo:

`orcah.com.br/empresa/joao-eletrica` redireciona para:

`joao-eletrica.orcah.com.br`

Essa página funcionará como uma espécie de **mini-site profissional**.

Ela poderá mostrar:

### Cabeçalho

Logo

Nome da empresa

Ramo de atuação

Cidade/região

Descrição

Botão:

**Pedir orçamento**

### Informações

* telefone;
* WhatsApp;
* cidade;
* horário de atendimento;
* Instagram;
* site;
* redes sociais.

### Galeria

Fotos dos trabalhos realizados.

Exemplo:

> "Confira alguns dos nossos trabalhos"

Fotos de:

* obras;
* instalações;
* antes/depois;
* produtos;
* projetos;
* serviços realizados.

---

## 7. Perfil para divulgar no Instagram

Sim.

Essa funcionalidade faz bastante sentido.

A empresa poderá copiar seu link público:

`joao-eletrica.orcah.com.br`

e colocar no:

* Instagram;
* Facebook;
* Google;
* cartão digital;
* assinatura do WhatsApp;
* QR Code;
* cartão de visita.

Porém, inicialmente não é necessário criar uma "integração com Instagram".

O sistema simplesmente fornece uma **landing page pública da empresa**, que funciona muito bem como link da bio.

Exemplo:

Instagram da empresa:

> "Peça seu orçamento 👇"

Link:

> orcah.com.br/joao-eletrica

Ao abrir:

**JOÃO ELÉTRICA**

⚡ Instalações residenciais e comerciais

📍 Maravilha - SC

[ PEDIR ORÇAMENTO ]

### Nossos trabalhos

[foto] [foto] [foto]

[foto] [foto] [foto]

### Entre em contato

[ WhatsApp ]

[ Instagram ]

[ Telefone ]

Isso transforma o SaaS em algo maior que simplesmente "um gerador de orçamento".

Ele vira também uma **presença digital básica para o prestador**.

---

## 8. Botão "Pedir orçamento"

Essa funcionalidade deve existir no perfil público.

O cliente entra na página e encontra:

## Precisa de um orçamento?

Preencha algumas informações e entraremos em contato.

Campos:

* Nome
* WhatsApp
* Serviço desejado
* Descrição
* Fotos
* Estado e cidade (dos cadastros, não texto livre)
* Bairro
* Melhor horário para contato

Botão:

**SOLICITAR ORÇAMENTO**

Ao enviar, a empresa recebe uma nova solicitação dentro do painel.

Opcionalmente, também poderá receber uma notificação.

Isso cria um pequeno sistema de **leads** dentro do SaaS.

---

## 9. Orçamento

Essa será a funcionalidade central.

O usuário deverá conseguir criar um orçamento rapidamente.

### Novo orçamento

Selecionar:

**Cliente existente**

ou

**Novo cliente**

Depois:

### Informações

* cliente;
* telefone;
* endereço do serviço;
* validade do orçamento;
* prazo estimado;
* observações.

### Itens

Cada item deverá possuir:

* descrição;
* quantidade;
* unidade;
* valor unitário;
* desconto;
* subtotal.

Exemplo:

| Item | Quantidade | Valor |
| --- | ---: | ---: |
| Instalação de tomadas | 8 | R$ 320 |
| Instalação de luminárias | 4 | R$ 280 |
| Material elétrico | 1 | R$ 450 |

Subtotal:

R$ 1.050

Desconto:

R$ 50

### Total

**R$ 1.000,00**

---

## 10. Fotos dentro do orçamento

SIM.

Eu colocaria essa funcionalidade.

Mas com cuidado para não transformar o sistema em um armazenamento de arquivos gigantesco.

Cada orçamento poderá possuir fotos relacionadas ao serviço.

Exemplo:

### Orçamento para reforma

Fotos:

* banheiro atual;
* parede;
* piso;
* instalação existente.

O prestador poderá adicionar uma legenda:

> "Parede onde será instalada a nova tubulação."

Isso é especialmente útil para:

* construção;
* reformas;
* manutenção;
* assistência técnica;
* pintura;
* elétrica;
* hidráulica;
* ar-condicionado;
* mecânica;
* móveis planejados.

Também pode existir uma seção:

### Fotos do serviço

na página pública do orçamento.

---

## 11. PDF do orçamento

O sistema deverá gerar um PDF profissional.

O PDF deverá conter:

### Cabeçalho

Logo

Nome da empresa

Contato

CNPJ/CPF, se informado

### Dados do cliente

Nome

Telefone

Endereço

### Dados do orçamento

Número:

ORÇ-2026-000123

Data:

16/09/2026

Validade:

7 dias

### Serviços

Lista de itens e valores.

### Observações

Texto definido pelo prestador.

### Total

**R$ 1.250,00**

### Rodapé

Informações da empresa.

---

## 12. Link público do orçamento

Além do PDF, cada orçamento deverá possuir uma URL exclusiva.

Exemplo:

`orcah.com.br/orcamento/8F4K92`

O cliente poderá abrir diretamente pelo celular.

Não deverá ser necessário criar conta.

A página poderá apresentar:

**JOÃO ELÉTRICA**

Orçamento #00124

Cliente: Carlos

Serviços:

...

Total:

**R$ 1.250,00**

[ APROVAR ORÇAMENTO ]

[ RECUSAR ]

[ SOLICITAR ALTERAÇÃO ]

---

## 13. Aprovação do orçamento

O cliente poderá clicar:

### APROVAR

O sistema registra:

* data;
* horário;
* IP;
* orçamento;
* cliente;
* versão da proposta.

O status passa para:

**APROVADO**

Isso deverá aparecer imediatamente no painel da empresa.

---

## 14. Recusa

Também poderá existir:

**NÃO TENHO INTERESSE**

Opcionalmente o cliente poderá informar um motivo:

* preço;
* prazo;
* serviço não será realizado;
* escolhi outra empresa;
* outro.

Isso será útil para os relatórios.

---

## 15. Solicitação de alteração

Essa funcionalidade é muito interessante.

O cliente poderá clicar:

**QUERO ALTERAR**

e escrever:

> "Consigo fazer sem trocar o material?"

ou:

> "Pode fazer somente a parte elétrica?"

A empresa receberá essa solicitação.

O orçamento continuará registrado.

A empresa poderá:

**Criar nova versão**

sem apagar a anterior.

---

## 16. Histórico de versões

Cada alteração deverá gerar uma nova versão.

Exemplo:

Orçamento #00125

* Versão 1 — R$ 2.500
* Versão 2 — R$ 2.200
* Versão 3 — R$ 2.100
* Versão 3 aprovada

Isso é importante para manter histórico.

Nunca sobrescrever silenciosamente uma proposta que já foi enviada.

---

## 17. WhatsApp

O WhatsApp deverá ser uma das principais partes do produto.

Inicialmente NÃO é necessário utilizar API oficial.

O sistema pode gerar uma mensagem e abrir o WhatsApp através de link.

Exemplo:

> Olá, Carlos! 👋
>
> Preparei seu orçamento para o serviço solicitado.
>
> 📋 Orçamento: #00125
> 💰 Valor: R$ 2.100,00
>
> Você pode visualizar todos os detalhes pelo link:
>
> https://orcah.com.br/orcamento/ABC123
>
> Qualquer dúvida, estou à disposição.

Botão:

**ENVIAR PELO WHATSAPP**

O navegador abre o WhatsApp do usuário.

Isso reduz drasticamente o custo e a complexidade inicial.

---

## 18. Retorno do WhatsApp

Importante diferenciar duas coisas.

### Inicialmente:

O sistema NÃO precisa ler as conversas do WhatsApp.

Ele apenas:

1. cria o orçamento;
2. gera o link;
3. prepara a mensagem;
4. abre o WhatsApp;
5. usuário envia.

Depois o cliente responde normalmente no WhatsApp.

O sistema acompanha a parte que acontece dentro da plataforma:

* enviado;
* visualizado;
* aprovado;
* recusado;
* alteração solicitada.

### Futuramente

Pode existir integração oficial com WhatsApp Business API.

Mas isso deve ficar para uma segunda etapa.

Não colocaria isso no MVP.

---

## 19. Rastreamento da visualização

Uma das funções mais valiosas.

Quando o cliente abre o link do orçamento, o sistema registra:

**Visualizado em 16/09/2026 às 14:32**

O painel poderá mostrar:

🟢 Visualizado hoje

ou:

> Última visualização: há 3 horas

Isso permite ao prestador saber quando é um bom momento para fazer follow-up.

---

## 20. Follow-up

O sistema poderá futuramente sugerir:

> ⚠️ Carlos recebeu seu orçamento há 3 dias e ainda não respondeu.

Botão:

**ENVIAR LEMBRETE**

Mensagem pré-configurada:

> Olá, Carlos! Tudo bem?
>
> Passando para saber se conseguiu analisar o orçamento que enviei.
>
> Se tiver alguma dúvida ou quiser ajustar algum item, posso te ajudar.

Clicou:

**ENVIAR PELO WHATSAPP**

Novamente, sem API inicialmente.

---

## 21. Lista de orçamentos

O painel deverá ter uma área:

## Meus orçamentos

Com filtros:

* Todos
* Rascunhos
* Enviados
* Visualizados
* Aguardando resposta
* Aprovados
* Recusados
* Expirados

Cada cartão poderá mostrar:

**#00125 — Carlos Silva**

R$ 2.100

🟢 Visualizado

Última atividade:

16/09/2026 14:32

---

## 22. Dashboard

O dashboard inicial deve ser simples.

Não fazer um painel cheio de gráficos.

Mostrar:

### Este mês

**R$ 18.450**
em orçamentos

**32**
orçamentos enviados

**12**
aprovados

**R$ 7.850**
em vendas aprovadas

### Ações

[ + NOVO ORÇAMENTO ]

[ CLIENTES ]

[ ORÇAMENTOS ]

---

## 23. Relatórios

SIM, vale a pena.

Mas somente relatórios simples inicialmente.

Não faria um BI completo.

Relatórios que realmente ajudam:

### Quantidade de orçamentos

* enviados;
* visualizados;
* aprovados;
* recusados;
* expirados.

### Valores

* valor total orçado;
* valor aprovado;
* valor recusado;
* valor aguardando resposta.

### Taxa de aprovação

Exemplo:

32 enviados

12 aprovados

37,5% de aprovação.

### Tempo médio

Quanto tempo leva entre:

**Envio → aprovação**

### Clientes

* clientes que mais receberam orçamentos;
* clientes que mais aprovaram;
* clientes que ainda estão aguardando resposta.

Isso já gera muito valor.

---

## 24. Relatório mensal

Futuramente:

## Resumo de setembro

Orçamentos:

42

Valor total:

R$ 28.500

Aprovados:

18

Valor aprovado:

R$ 14.200

Taxa de aprovação:

42,8%

Ticket médio:

R$ 788

Esse tipo de relatório pode virar uma ferramenta de gestão muito útil.

---

## 25. Clientes

O sistema deverá possuir um cadastro simples de clientes.

Campos:

* nome;
* telefone;
* WhatsApp;
* e-mail;
* CPF — opcional;
* endereço;
* **estado (UF)** — da tabela `states`;
* **cidade** — da tabela `cities`;
* bairro — opcional;
* observações;
* data do primeiro contato.

No perfil do cliente:

### Histórico

Orçamentos:

* #001
* #018
* #034

Serviços:

...

Total aprovado:

R$ 4.850

Último orçamento:

16/09/2026

Isso evita o usuário ter que cadastrar novamente o cliente.

---

## 26. Galeria da empresa

A empresa poderá cadastrar fotos permanentemente no perfil.

Exemplo:

## Nossos trabalhos

[foto]

Instalação elétrica residencial

[foto]

Reforma de cozinha

[foto]

Instalação de ar-condicionado

As imagens poderão ter:

* título;
* descrição;
* categoria.

---

## 27. Categorias de serviços

O usuário poderá cadastrar serviços próprios.

Exemplo:

### Eletricista

* instalação de tomada;
* instalação de luminária;
* troca de disjuntor;
* instalação de chuveiro.

Ao criar orçamento, basta selecionar:

**+ Adicionar serviço**

Isso acelera muito a criação.

O sistema pode preencher automaticamente:

* descrição;
* unidade;
* valor padrão.

O usuário sempre poderá alterar o preço no orçamento.

---

## 28. Banco de dados

A estrutura inicial usa **MySQL** (WAMP local) com **Prisma**. Estado e cidade **não** são texto livre: existem tabelas `states` e `cities` (código IBGE) para busca regional no futuro.

Principais tabelas:

### states

* id
* name
* uf
* ibge_code
* created_at
* updated_at

### cities

* id
* state_id
* name
* slug
* ibge_code
* created_at
* updated_at

### users

* id
* name
* email
* password
* phone
* created_at
* updated_at

### companies

* id
* user_id
* name
* trade_name
* document
* phone
* whatsapp
* email
* description
* address
* neighborhood
* zip_code
* city_id
* state_id
* website
* instagram
* primary_color
* secondary_color
* logo_path
* slug
* business_category_id
* created_at
* updated_at

### business_categories

* id
* name
* slug
* active

Exemplo:

Eletricista

Pedreiro

Pintor

Marceneiro

etc.

### customers

* id
* company_id
* name
* phone
* whatsapp
* email
* document
* address
* neighborhood
* city_id
* state_id
* notes
* created_at
* updated_at

### budgets

* id
* company_id
* customer_id
* number
* public_token
* status
* subtotal
* discount
* total
* validity_date
* service_address
* service_city_id
* service_state_id
* notes
* sent_at
* viewed_at
* approved_at
* rejected_at
* created_at
* updated_at

### budget_items

* id
* budget_id
* description
* quantity
* unit
* unit_price
* discount
* subtotal
* created_at
* updated_at

### budget_versions

* id
* budget_id
* version
* subtotal
* discount
* total
* notes
* created_at

### budget_events

* id
* budget_id
* event
* metadata
* ip_address
* user_agent
* created_at

Eventos:

* created
* sent
* viewed
* approved
* rejected
* revision_requested
* expired

### services

* id
* company_id
* name
* description
* unit
* default_price
* active
* created_at
* updated_at

### company_photos

* id
* company_id
* path
* title
* description
* sort_order
* active
* created_at
* updated_at

### budget_photos

* id
* budget_id
* path
* caption
* sort_order
* created_at
* updated_at

### quote_requests

* id
* company_id
* customer_name
* customer_phone
* customer_email
* description
* city_id
* state_id
* neighborhood
* status
* created_at
* updated_at

### subscriptions

* id
* company_id
* provider
* provider_subscription_id
* status
* plan
* amount
* starts_at
* ends_at
* created_at
* updated_at

---

## 29. Multiempresa / isolamento dos dados

O sistema deve ser pensado como SaaS desde o começo.

Cada usuário/empresa deverá acessar somente seus próprios dados.

Toda tabela que pertence à empresa deverá possuir:

`company_id`

E todas as consultas deverão respeitar o escopo da empresa.

Exemplo:

Empresa A jamais poderá acessar:

* clientes da Empresa B;
* orçamentos da Empresa B;
* fotos da Empresa B;
* relatórios da Empresa B.

Esse isolamento deverá ser tratado como requisito fundamental.

---

## 30. Armazenamento de fotos

Não armazenar fotos diretamente no banco.

O banco deverá guardar apenas o caminho/identificador.

As imagens deverão ficar em storage.

Estrutura lógica:

`companies/{company_id}/logo`

`companies/{company_id}/gallery`

`companies/{company_id}/budgets/{budget_id}`

Também deverá existir:

* limite de tamanho;
* validação de extensão;
* compressão;
* redimensionamento;
* geração de thumbnail.

Isso reduz bastante o custo de armazenamento.

---

## 31. PWA

O sistema deverá possuir:

* manifest.json;
* service worker;
* ícone;
* splash;
* nome do aplicativo;
* modo standalone;
* responsividade.

O usuário poderá clicar:

**Adicionar à tela inicial**

e terá:

📱 Orçah

na tela do celular.

Não precisa Play Store inicialmente.

---

## 32. Segurança

Requisitos básicos:

* HTTPS;
* passwords com hash;
* CSRF;
* validação de formulários;
* rate limiting;
* proteção contra upload malicioso;
* autorização por empresa;
* URLs públicas com tokens não previsíveis;
* não expor IDs sensíveis quando desnecessário;
* backups;
* logs.

O link público do orçamento deverá utilizar um token aleatório forte.

Não utilizar simplesmente:

`/orcamento/123`

Preferir algo como:

`/orcamento/X7kP92LmQa8T`

---

## 33. LGPD

O sistema armazenará dados pessoais de clientes.

Portanto, desde o início deverá existir preocupação com:

* política de privacidade;
* termos de uso;
* finalidade dos dados;
* segurança;
* exclusão de dados;
* controle de acesso;
* armazenamento mínimo necessário.

Não coletar CPF, endereço ou outros dados se não forem realmente necessários.

---

## 34. Fluxo completo

O fluxo ideal:

### 1

Empresa cria conta.

↓

### 2

Escolhe segmento.

↓

### 3

Adiciona logo/foto.

↓

### 4

Configura seus dados.

↓

### 5

Cadastra alguns serviços.

↓

### 6

Cadastra cliente.

↓

### 7

Cria orçamento.

↓

### 8

Adiciona itens.

↓

### 9

Adiciona fotos, se necessário.

↓

### 10

Publica orçamento.

↓

### 11

Sistema gera:

* página;
* PDF;
* mensagem WhatsApp.

↓

### 12

Usuário clica:

**Enviar pelo WhatsApp**

↓

### 13

Cliente abre o link.

↓

### 14

Sistema registra:

**Visualizado**

↓

### 15

Cliente:

**Aprova**

↓

### 16

Empresa recebe:

🔔

**Orçamento #00125 aprovado!**

Esse é o coração do produto.

---

## 35. O que NÃO fazer inicialmente

Para conseguir colocar o produto no mercado rapidamente, NÃO desenvolver inicialmente:

* aplicativo nativo Android;
* aplicativo iOS;
* integração oficial complexa com WhatsApp;
* emissão de nota fiscal;
* estoque;
* financeiro completo;
* contas a pagar;
* contas a receber;
* agenda complexa;
* equipe de funcionários;
* CRM completo;
* IA;
* automações complexas;
* marketplace;
* pagamentos dentro do sistema;
* PIX automático;
* integração bancária.

Tudo isso pode virar produto depois.

O MVP precisa fazer uma coisa muito bem:

> **Criar um orçamento profissional e fazer o cliente recebê-lo, visualizar e responder.**

---

## 36. Funcionalidades do MVP

A primeira versão deverá possuir:

### Conta

* cadastro;
* login;
* recuperação de senha.

### Empresa

* dados;
* logo;
* cores;
* segmento;
* perfil público.

### Clientes

* cadastro;
* histórico.

### Serviços

* catálogo simples;
* preço padrão.

### Orçamentos

* criação;
* itens;
* desconto;
* validade;
* observações;
* fotos;
* PDF;
* link público.

### Cliente

* visualizar;
* aprovar;
* recusar;
* solicitar alteração.

### WhatsApp

* mensagem automática;
* botão enviar.

### Dashboard

* quantidade;
* valores;
* status.

### PWA

* instalação na tela inicial.

### Assinatura

* plano de R$29/mês.

---

## 37. Evolução futura

Depois da validação:

### Fase 2

* follow-up;
* relatórios avançados;
* versões;
* catálogo avançado;
* QR Code;
* página pública melhorada;
* domínio personalizado.

### Fase 3

* integração oficial WhatsApp;
* notificações;
* PIX;
* cobrança;
* conversão de orçamento em ordem de serviço.

### Fase 4

* agenda;
* financeiro;
* equipe;
* automações;
* IA.

---

## 38. A ideia central do produto

Não vender o sistema como:

> "Software de gestão empresarial."

Isso assusta o público.

A comunicação deverá ser simples:

> **Crie orçamentos profissionais, envie pelo WhatsApp e acompanhe até o cliente responder.**

Ou:

> **Pare de fazer orçamento no WhatsApp.**

Ou:

> **Seu orçamento profissional em poucos minutos.**

O produto deve parecer simples.

Por trás pode existir um SaaS sofisticado.

Para o usuário, deve parecer:

**abriu → criou → enviou → acompanhou.**

---

## 39. Posicionamento

O diferencial não deverá ser simplesmente:

> "faz orçamento."

Porque isso já existe no mercado.

Inclusive, a pesquisa encontrou vários produtos atuais oferecendo orçamento via WhatsApp, link público, PDF, aprovação e acompanhamento.

O diferencial proposto deve ser a combinação:

**ORÇAMENTO + PERFIL PROFISSIONAL + GALERIA + CAPTAÇÃO DE CLIENTES + WHATSAPP**

Ou seja:

O prestador não terá somente uma ferramenta para fazer orçamento.

Ele terá uma pequena presença digital.

---

## 40. Conceito final

O produto pode ser resumido em quatro áreas:

## 1. ORÇAR

Crie propostas profissionais.

## 2. ENVIAR

Envie pelo WhatsApp.

## 3. CONVERTER

Cliente visualiza, aprova ou solicita alteração.

## 4. MOSTRAR

Tenha um perfil profissional com seus serviços e trabalhos.

Essa combinação torna o produto mais interessante do que simplesmente um "gerador de PDF".

---

## 41. Experiência ideal no celular

Ao abrir o aplicativo:

Olá, João 👋

### Hoje

**R$ 4.850**
em orçamentos

**3**
aguardando resposta

**2**
aprovados

---

### Ações rápidas

🟢 **+ Novo orçamento**

👤 Clientes

📋 Orçamentos

🏢 Meu perfil

📊 Relatórios

---

O botão:

# + NOVO ORÇAMENTO

deverá estar sempre muito acessível.

O objetivo é permitir que um prestador parado na frente da casa do cliente consiga criar e enviar um orçamento em poucos minutos.

---

## 42. Modelo comercial inicial

Preço:

# R$ 29,00/mês

Sem necessidade de planos complexos.

Uma estratégia possível para lançamento:

### 7 ou 14 dias grátis

Depois:

**R$29/mês**

Ou, para os primeiros clientes:

### Plano fundador

**R$29/mês**

com condição especial enquanto permanecer assinante.

Isso permite validar o preço sem criar uma estrutura de planos artificial.

---

## 43. Métrica mais importante

No começo, não ficar obcecado com:

* usuários cadastrados;
* quantidade de páginas;
* quantidade de fotos;
* quantidade de acessos.

A métrica principal deverá ser:

## Quantos orçamentos enviados viram aprovação?

E uma segunda:

## Quantos usuários continuam pagando R$29 depois do primeiro mês?

Se alguém cria 100 orçamentos mas não paga, o produto não resolveu o problema.

Se 50 profissionais usam todo mês e pagam R$29, existe um negócio.

---

## 44. Resumo do produto

O SaaS será uma plataforma mobile-first para prestadores de serviço criarem e gerenciarem orçamentos profissionais.

Cada empresa terá:

* conta própria;
* perfil público;
* logo;
* identidade visual;
* galeria de trabalhos;
* catálogo de serviços;
* clientes;
* orçamentos;
* fotos;
* PDF;
* link público;
* aprovação online;
* solicitação de alteração;
* histórico;
* envio pelo WhatsApp;
* dashboard;
* relatórios;
* PWA instalável no celular.

Tudo por:

# R$29/mês.

O produto deverá começar pequeno, com foco absoluto no fluxo:

**Cliente pediu → criar orçamento → enviar WhatsApp → cliente abriu → cliente respondeu.**

O restante deve crescer conforme os clientes realmente pedirem.
