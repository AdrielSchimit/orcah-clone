# Auditoria de design — Orçah

Feito em 17/09/2026, com o app rodando local (mobile 390px e desktop) e leitura de `docs/paleta.md`, `docs/produto.md` e `docs/concorrente-orcaki.md`.

Nada de UI foi alterado. Este arquivo é o conceito a executar.

---

## Veredito

O fluxo está certo e enxuto. O que está errado é a **casca**: tudo é card branco sobre bege, com um ouro escuro no meio. Não existe superfície escura, não existe número grande, não existe cor de status. Então nada parece app — parece papel.

Dois problemas separados, que precisam de correções separadas:

1. **A paleta lê marrom.** `cream #FFFBF2`, `cream-dark #F3EBDD`, `line #E6DCC8` e `gold #D99212` são todos quentes e de luminosidade parecida. Sem nenhum tom frio ou escuro para segurar, o conjunto vira bege sujo e o ouro vira mostarda.
2. **Não há hierarquia visual.** Na `/painel`, o número do mês tem 18px e a mesma cor do resto; o status do orçamento é texto cinza de 12px; o botão de criar orçamento fica **abaixo** da lista de cidades. O olho não sabe onde cair.

---

## O que aprender do Orçaki (e o que não copiar)

Nos panfletos e em [orcaki.pro](https://www.orcaki.pro/), o que funciona é mecânico, não gosto:

| Funciona | Por quê |
| --- | --- |
| Fundo escuro atrás dos números | O valor salta. Faturamento e contadores viram o assunto da tela. |
| Caixa quadrada com ícone + número + label | O prestador lê em um passe de olho, sem ler frase. |
| Barra inferior fixa com ícone + nome | É isso que dá "cara de app". Hoje o Orçah não tem. |
| Uma cor de ação só, sempre no mesmo lugar | Amarelo é sempre "faça isso agora". |
| Amarelo vivo, não mostarda | Contraste alto contra o escuro. |

O que **não** copiar: preto puro com amarelo `#FFCC00`, que é a cara de fita de obra e já está anotada como ponto fraco deles; e dark mode na tela de trabalho, que queima no sol.

## Nossa versão disso

O truque é trocar o preto deles pelo **nosso marinho** e usar escuro só na casca:

- **Escuro (`navy`)** — topo do painel, caixas de número, barra inferior, hero da home. É onde a marca aparece.
- **Claro (quase branco, sem bege)** — onde se lê e se digita: formulário, itens, orçamento que o cliente abre, PDF. Sol na obra e confiança do cliente pedem claro.
- **Ouro** — só ação. Um por tela.

Assim ganhamos o impacto do concorrente sem dark mode no trabalho e sem virar cópia.

---

## Paleta nova

O bege sai. Entra um cinza-neutro claro, e o marinho ganha dois tons para virar superfície.

| Token | Hex | Uso |
| --- | --- | --- |
| `ink` | `#0D1526` | Fundo escuro: hero, topo do painel, barra inferior |
| `ink-tile` | `#16223A` | Caixa escura de número |
| `ink-line` | `#29354F` | Borda dentro do escuro |
| `ink-text` | `#F7F9FC` | Texto sobre escuro |
| `ink-soft` | `#A9B6CE` | Legenda sobre escuro |
| `paper` | `#F5F7FA` | Fundo das telas de trabalho (**substitui `cream`**) |
| `card` | `#FFFFFF` | Caixa clara, input, PDF |
| `line` | `#E3E8EF` | Borda no claro (**substitui `#E6DCC8`**) |
| `text` | `#0D1526` | Texto |
| `text-soft` | `#59677F` | Texto secundário |
| `gold` | `#FFB020` | Ação primária (**substitui `#D99212`**) |
| `gold-press` | `#E5991A` | Pressionado / hover |
| `gold-wash` | `#FFF4E0` | Chip, realce claro, fundo de destaque |
| `gold-deep` | `#9D680B` | Só texto dourado sobre branco |
| `ok` / `ok-wash` | `#16A34A` / `#E7F6ED` | Aprovado, visualizado |
| `no` / `no-wash` | `#DC2626` / `#FDECEC` | Recusado |
| `wait` / `wait-wash` | `#FFB020` / `#FFF4E0` | Aguardando resposta |
| `zap` | `#25D366` | **Só** o botão de WhatsApp |

Regras que vêm com isso:

- `cream` e `cream-dark` deixam de existir. Nenhuma tela volta a ter fundo bege.
- Ouro nunca é fundo de área grande. Só botão, pill e linha fina.
- Verde do WhatsApp é do botão de WhatsApp, não da marca. Isso resolve o botão de enviar, hoje dourado, que não parece WhatsApp.
- A logo não muda: ícone dourado, "Orçah" com ç, sem acento no a final, sem `!`.

---

## Sistema de caixas

O que o usuário chamou de "caixa prática" precisa de medida fixa, senão cada tela inventa a sua.

| Coisa | Medida |
| --- | --- |
| Raio da caixa | 20px |
| Raio de botão e input | 14px |
| Pill de status | 999px |
| Respiro interno | 16px |
| Espaço entre caixas | 12px |
| Toque mínimo | 48px de altura |
| Número grande | 28px, peso 600 |
| Label da caixa | 12px, peso 500, maiúscula, `tracking .04em` |
| Ícone | 20px dentro de um círculo de 36px com fundo `wash` |
| Profundidade | No claro, borda `line` e zero sombra. No escuro, borda `ink-line`. |

**Caixa escura de número** (painel): ícone no topo, número, label embaixo. Nada mais.
**Caixa clara de lista** (orçamento, cliente): nome à esquerda, valor à direita em peso 600, status como pill colorido embaixo do valor.

### Hierarquia, em três níveis

Toda tela obedece a isto, na ordem:

1. **Uma ação em ouro.** Se aparecerem duas, a segunda vira contorno.
2. **Um número maior que o resto** — o dinheiro, sempre.
3. **Todo o resto** em `text-soft`, e status **sempre** em pill colorido, nunca em cinza.

---

## Tela por tela

### Home `/` — `src/app/page.tsx`

Hoje é o PNG de share e dois botões. Quem cai pelo link da bio não descobre o que o Orçah faz, quanto custa e o que o cliente dele vai receber. É a maior perda contra o Orçaki, que explica tudo numa rolada.

Conceito novo, de cima para baixo:

1. **Topo fixo:** wordmark à esquerda, `Entrar` em texto e `Começar grátis` em ouro à direita.
2. **Hero escuro (`ink`):** manchete com uma palavra em ouro — orçamento pronto, mandado no WhatsApp, aprovado pelo cliente. Abaixo, uma linha de apoio e o botão ouro `Criar meu primeiro orçamento`. À direita (ou embaixo, no mobile) o celular mostrando o painel escuro.
3. **Faixa de 4 benefícios** ainda no escuro, ícone + duas palavras: orçamento em minutos, envio no WhatsApp, cliente aprova no link, página para a bio.
4. **Como funciona**, no claro: três caixas numeradas — *Monte o orçamento*, *Manda no WhatsApp*, *O cliente aprova*. Uma frase cada.
5. **O que o cliente vê** — a seção que o Orçaki não tem. Print do link com `Aprovar` e `Quero alterar`. Aqui mora a diferença entre link e PDF.
6. **Para quem é:** fila de ofícios com ícone (pedreiro, eletricista, pintor, serralheiro, mecânico, e mais).
7. **Sua página na bio:** print da `/empresa/[slug]` com galeria.
8. **Plano**, em uma caixa só, e **FAQ** de risco zero: sem cartão, sem contrato, cancela quando quiser.
9. **Fechamento** com o mesmo botão ouro.
10. **No mobile, barra fixa embaixo** com `Começar grátis`. O dedo nunca precisa voltar ao topo.

### Cabeçalho e navegação — `src/app/painel/layout.tsx`

Isto aparece em **todas** as telas do painel, então cada defeito aqui é pago cinco vezes.

- **Quatro linhas de texto no topo:** "Olá, Cesar", "Cesar Turmina", "Pintor automotivo", "Presta serviços em Santa Catarina". Ramo e região são dado de cadastro que ele leu no primeiro dia e vai reler todo dia, ocupando a área mais valiosa da tela. Fica bloco escuro `ink` com saudação pequena, nome da empresa em destaque e **uma** linha de apoio (ramo · região), logo à direita.
- **`Sair` flutua no meio da direita**, alinhado à altura da segunda linha, com o mesmo peso visual do nome da empresa. Sair não é tarefa diária: vai para dentro de `Mais`, na barra inferior.
- **A nav não marca onde você está.** Em `/painel/clientes`, a pill "Clientes" é idêntica às outras quatro. O prestador se perde entre telas que têm cabeçalho igual.
- **As pills têm ~30px de altura** (`text-sm px-3 py-1.5`), abaixo dos 48px de toque. Em conta normal são cinco itens (com `Plano`) e a linha embrulha; na conta de análise são quatro e cabem.
- **`Pedidos` não mostra contagem.** Existe um pedido novo da Maria Teste aguardando resposta e nada na navegação avisa. Precisa de badge numérico em ouro — é dinheiro esperando.
- Tudo isso vira **barra inferior fixa** com ícone + nome: Início, Orçamentos, Clientes, Página, Mais. Ativo em ouro, `padding-bottom` de área segura. É o que faltava para parecer app.

### Início `/painel` — `src/app/painel/page.tsx`

- **A primeira sessão mostra quatro zeros.** Enviados 0, Visualizados 0, Aprovados 0, Total aprovado R$ 0,00. Quem acabou de cadastrar recebe um relatório de nada feito. Enquanto não existir orçamento, essas caixas dão lugar a três passos numerados — *monte*, *mande no WhatsApp*, *receba a resposta* — e os números só aparecem depois do primeiro envio.
- **Os quatro números são caixas brancas com valor de 18px**, do mesmo tamanho do texto ao lado. Viram 2×2 de caixas escuras com ícone e número de 28px. `Total aprovado` recebe o maior peso, porque é o único que fala de dinheiro.
- **`+ Criar orçamento` vem depois dos números**, e quando existe a lista "Por cidade neste mês" desce mais ainda. A ação principal do produto não pode depender de rolagem: sobe para logo abaixo do cabeçalho.
- **Últimos orçamentos:** status é texto cinza de 12px, do lado do valor. Vira pill — verde aprovado, vermelho recusado, ouro aguardando, cinza rascunho. É como ele enxerga quem falta cobrar.
- **"Por cidade neste mês"** é uma caixa branca igual às outras e desaparece no meio. Vira lista dentro de `Mais`, ou ganha barra proporcional.

### Clientes `/painel/clientes`

Esta é a tela mais invertida do painel.

- **O formulário "Novo cliente" está sempre aberto e come a primeira tela inteira:** Nome, Telefone, WhatsApp, E-mail, Estado, Cidade, Bairro, Endereço, Observações. A lista de clientes fica abaixo de tudo isso. Quem abre a tela para achar o telefone de um cliente rola nove campos primeiro. Inverte: busca e lista no topo, e um `+ Novo cliente` em ouro que abre o formulário.
- **Os campos não têm rótulo, só placeholder.** Assim que ele digita, o "WhatsApp (se diferente)" desaparece e não há como conferir o que era cada caixa. No formulário de orçamento os rótulos são de verdade — padroniza nesse.
- **Estado e Cidade em cascata para cadastrar um cliente** é burocracia no meio de um cadastro de dois campos úteis. Vão para um bloco recolhido "Mais dados".

### Pedidos `/painel/pedidos` — `src/components/pedidos-list.tsx`

É a tela de lead: aqui o prestador está com o cliente na mão.

- **O telefone aparece cru: `49999990000`.** É o dado que ele vai ler em voz alta ou copiar. Formata `(49) 99999-0000`.
- **O selo "Novo" é texto de 12px cinza no canto**, mais fraco que o nome. Vira pill: ouro para novo, cinza para contatado, verde para convertido.
- **`Responder no WhatsApp` está em ouro.** É a única tela em que a ação *é* o WhatsApp: vira verde `zap` com ícone.
- **`Marcar como contatado` é um link dourado logo abaixo do botão dourado** — dois dourados empilhados, competindo. Vira botão de contorno.
- **Não mostra quando o pedido chegou.** `createdAt` existe no dado e não vai para a tela. Lead sem hora não cria urgência; "há 2 h" muda o comportamento.

### Sua página `/painel/empresa`

- **`Copiar link da bio` e `Ver página pública` são dois botões brancos idênticos, empilhados.** Copiar é a ação desta tela — é o link que vai para o Instagram. Copiar em ouro, ver em contorno, os dois lado a lado.
- **O upload de logo é o input nativo do navegador: aparece `Choose File / No file chosen`, em inglês, sem estilo.** É o controle mais sensível de marca do produto inteiro, e está cru. Vira área de toque com ícone, texto em português e miniatura depois do envio. Mesmo problema no campo de foto da galeria.
- **O link da bio é texto puro** no meio do parágrafo. Vira caixa `gold-wash` com o endereço em peso 600 e ícone de copiar do lado.
- **Não há prévia.** Ele edita o perfil sem ver o resultado e precisa abrir outra aba. Um cartão com a cara da página, no topo, resolve.

### Desktop

A coluna é `max-w-lg` (512px) centralizada. Em 1024px sobram ~250px vazios de cada lado, e o botão ouro de largura total fica com quase 440px — em desktop lê como banner, não como botão.

Acima de 900px: números em 4 colunas, lista de orçamentos em 2, botão primário com largura própria (não `w-full`), e a barra inferior vira coluna lateral fixa com os mesmos cinco itens.

### Novo orçamento `/painel/orcamentos/novo` — `src/components/budget-form.tsx`

O conteúdo já está no ponto depois dos moldes: um campo por vez, chips de catálogo, sem etapa nem tipo de item. Ajustes de casca:

- Os títulos de seção (`Cliente`, `Serviço`, `Itens do orçamento`, `Resumo`) têm o mesmo peso do resto. Cada seção vira caixa clara com o título em label 12px maiúsculo.
- O **total só aparece no fim**, depois do desconto e das observações. Quando ele está no meio da obra somando itens, precisa de uma **barra fixa embaixo** com total e `Salvar orçamento`.
- **Dois "Subtotal" com o mesmo peso:** um dentro do card do item e outro no `Resumo`. O do item vira texto pequeno alinhado à direita; só o do resumo fica em destaque.
- **`+ Adicionar item` é um link de texto dourado**, do lado de um `Salvar orçamento` sólido. Quem monta um orçamento de cinco itens usa esse controle cinco vezes: vira botão de contorno com ícone `+`, largura cheia.
- Chips de catálogo já funcionam. Ganham fundo `gold-wash` com texto navy — hoje competem com os inputs.
- O botão `Trocar molde · <ramo>` (só na conta de análise) senta acima do título e parece parte do produto. Vira faixa discreta de admin, com fundo diferente.

### Orçamento salvo `/painel/orcamentos/[id]`

- **Três botões empilhados** (WhatsApp, PDF, copiar link) com o de WhatsApp em ouro. Enviar é a ação: fica em `zap` verde com o ícone, largura cheia. PDF e copiar link viram dois botões de contorno lado a lado.
- O cartão de cabeçalho mistura número, nome, status, visualização e valor no mesmo peso. Valor sobe para 28px, status vira pill.
- **Acompanhamento** é uma lista de caixas iguais. Vira linha do tempo com ponto colorido: criado cinza, enviado ouro, visualizado ouro, aprovado verde, recusado vermelho. É o que responde "ele viu e não respondeu?".
- **`← Voltar` é um link de texto de 14px** no canto. No celular, com uma mão, vira área de toque de 48px com a seta.

### O link que o cliente abre `/orcamento/[token]`

Esta tela é a que fecha o negócio, e hoje ela abre com a **logo do Orçah acima do nome da empresa**. Quem contrata precisa ver primeiro o prestador; o Orçah fica no rodapé, onde já existe o "Feito com Orçah".

- Topo vira o bloco do prestador: logo dele, nome, ramo, região.
- **O total é só mais um card branco no meio de vários.** Vira caixa escura `ink` com o valor grande — o único bloco escuro da página, exatamente onde o olho deve parar.
- **`Baixar PDF` vem antes de `Aprovar orçamento`.** Inverte: `Aprovar` em ouro, largura cheia; `Quero alterar` e `Não tenho interesse` em contorno; PDF como link discreto no rodapé.
- No mobile, `Aprovar` também numa barra fixa embaixo enquanto o cliente rola os itens.
- Depois de aprovar, a confirmação é uma linha de texto verde. Vira caixa `ok-wash` com check e o próximo passo ("a empresa foi avisada").

### Página pública `/empresa/[slug]`

Vista no celular: **dois botões dourados iguais** competindo — `Pedir orçamento` no topo e `WhatsApp` na caixa de contato. O cliente não sabe qual é o caminho.

- `Pedir orçamento` continua ouro. `WhatsApp` vira verde `zap` com ícone. `Ligar`, `Instagram` e `Site` viram contorno, em fila de dois por linha.
- Sem foto cadastrada, a página é só texto. A galeria sobe para logo abaixo do nome, em 2×2, porque é o que prova serviço.
- Cabeçalho ganha faixa `ink` atrás do nome e do ramo, para a página não abrir em bege vazio.

### Plano — `src/components/plan-banner.tsx`

Banner branco com borda dourada e texto de 12px: some no meio dos outros cards. Vira caixa `gold-wash` com pill de dias restantes quando é trial, e `no-wash` quando venceu.

---

## Ordem de execução

1. Trocar os tokens em `src/app/globals.css` e `docs/paleta.md`. Sem tocar em layout, isso já mata o bege.
2. Barra inferior fixa + cabeçalho escuro no `painel/layout.tsx`, com item ativo e badge em `Pedidos`. É o que muda a sensação de app.
3. Caixas escuras de número, pills de status e primeira sessão com três passos no `painel/page.tsx`.
4. Inverter as ações do link do cliente e dar a caixa escura ao total.
5. Inverter a tela de Clientes (lista primeiro, formulário atrás de botão) e arrumar os dois uploads de arquivo em `Sua página`.
6. Pedidos: telefone formatado, pill de status, botão verde, hora do pedido.
7. Refazer a home com as dez seções.
8. Barras fixas de ação no formulário e no link.

Passos 1 a 4 já resolvem a queixa do bege e da hierarquia. 5 e 6 são os que o prestador sente no dia a dia. O 7 é o que compete com a landing do Orçaki.
