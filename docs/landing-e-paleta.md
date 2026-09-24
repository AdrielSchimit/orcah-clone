# Análise de referência e auditoria de paleta — Orçah

Feito em 18/09/2026. Nenhuma linha de código foi alterada.

**Referência analisada:** [fazerorcamento.com](https://fazerorcamento.com/) (home, `/planos`) e o app logado em `app.fazerorcamento.com`.
**Comparado com:** `src/app/page.tsx` rodando em `localhost:3000`, mais os tokens de `src/app/globals.css`.
**Método:** navegação real em 1035px (desktop) e 390px (mobile), estilos computados lidos pelo DevTools, contraste calculado em WCAG 2.1.

**Regra que vale para tudo neste documento:** a referência entra como *molde estrutural e lógica de conversão*. Nada de texto, foto, ícone, verde, tipografia ou desenho é copiado. Onde a referência acerta por mecânica, a gente repete a mecânica com cara própria. Onde ela acerta por gosto, a gente ignora.

---

# A. Análise da referência

## A.1 O que a página é, de fato

Não é um site institucional. São **três coisas empilhadas**:

1. Uma landing de conversão curta (6 seções de conteúdo).
2. Um hub de SEO programático (o rodapé tem 12 páginas "Orçamento para *ofício*" e 3 páginas "vs Excel / vs Word / vs bloco").
3. Um funil que **empurra tudo que é objeção para fora da home**: Planos, FAQ, Depoimentos e Modelos são páginas próprias, não seções.

Isso é uma decisão deliberada e é a primeira coisa a entender antes de olhar pixel. A home deles é curta porque ela só precisa fazer uma pergunta: *"isso é pra mim?"*. Preço, dúvida e comparação vivem depois.

## A.2 Estrutura, ordem e tamanho relativo

Medido em 1035px de largura. Página inteira: **4494px**.

| # | Seção | Altura | % da página | Fundo | Função |
| --- | --- | --- | --- | --- | --- |
| — | Header (sticky) | 65px | — | branco 95% + blur | Navegação + CTA sempre à mão |
| 1 | Hero | 822px | 18% | verde muito claro | Identificação + CTA + prova |
| 2 | Modelos por profissão | 668px | 15% | branco | "existe pro meu ofício" |
| 3 | Como funciona — 3 passos | 428px | 10% | cinza-pedra | "é fácil" |
| 4 | Tudo num só app | 640px | 14% | branco | "não é só orçamento" |
| 5 | Depoimentos | 649px | 14% | verde muito claro | "gente como eu" |
| 6 | CTA final | 436px | 10% | verde escuro | Fechar |
| 7 | Rodapé | 785px | 17% | verde escuro | SEO + confiança legal |

Duas leituras importantes dessa tabela:

- **A seção mais curta é "Como funciona" (10%).** O "como" é o que menos ocupa espaço. Quem compra não quer saber como funciona; quer saber se serve pra ele. O espaço grande vai para identificação (hero + modelos = 33%).
- **O rodapé é a segunda maior peça da página (17%).** Ele não é enfeite, é superfície de busca e de confiança.

### Header

- `sticky top-0`, fundo branco a 95% com `backdrop-blur`, borda inferior de 1px. Altura 65px.
- Logo à **esquerda**, pequena (74×28px). Não é protagonista.
- Navegação colada na logo, à esquerda-centro: 5 itens (Recursos, Modelos, Planos, Depoimentos, FAQ), 14px, peso 600, sem caixa.
- À **direita**, o par clássico: `Entrar` como texto puro e `Testar grátis` como pílula sólida verde, 36px de altura.
- Os 5 itens da navegação são exatamente as 5 objeções do funil. A navegação **é** o roteiro de venda, não um mapa do site.

### Hero

- Padding vertical de 128px. Duas colunas: texto à esquerda, imagem à direita.
- **Headline** 56px, peso 700, entrelinha 1,1, tracking -1,4px. Quatro linhas. Fala com a pessoa (*"quem vive de serviço"*), não com o produto.
- **Subtítulo** uma frase só, e ela **nomeia quatro profissões** antes de dizer o que o produto faz. É o gatilho de identificação e vem antes do benefício.
- **CTA primário** pílula sólida, 52px de altura, 18px, peso 600, com ícone. Ao lado, dois selos de loja (App Store / Google Play).
- **Prova social vem logo ABAIXO do CTA**, não acima: estrelas + "4,8 no Google Play · +500 mil downloads". Ela existe para justificar o clique que acabou de ser pedido.
- **Imagem:** três pessoas reais, de ofício, segurando o celular com o produto na tela. Pessoa e produto no mesmo quadro. Não é screenshot solto nem foto de banco genérica.
- **Rodapé do hero:** uma fila de pílulas de profissão (6). A última, "+ 7 profissões", é a única sólida e colorida da fila — sinaliza "tem mais" e vira link.

### Seção 2 — Modelos

Três cartões de imagem em formato retrato 225×300 (formato de documento, proposital: parece papel). O quarto slot da grade **não é um cartão, é o CTA** "Ver todos os modelos" em verde sólido, com a mesma altura dos outros. Truque simples e eficiente: o CTA ocupa o lugar de um item, então ele não parece anúncio.

### Seção 3 — Como funciona

Três passos. Círculo com número em verde claro, título 24px, uma frase. Sem CTA. 428px — a menor seção da página. Verbos no imperativo e curtos: Crie / Envie / Feche.

### Seção 4 — Tudo num só app

Três cartões, **agrupados por momento do ciclo comercial, não por lista de features**: Documentos / Fechamento / Gestão. Cada cartão tem ícone em círculo suave, título, uma linha de subtítulo e depois 2–3 links internos com seta. São 8 funcionalidades apresentadas como 3 ideias. É assim que eles cabem "somos uma plataforma inteira" em 640px sem virar lista de supermercado.

### Seção 5 — Depoimentos

Três vídeos com rosto visível, nome e **profissão** embaixo (Serralheria, Confeiteira, Piso e revestimento). Nota com tamanho da amostra: "4,8/5, baseado em 2.847 avaliações" — número com denominador, que é o que dá credibilidade. CTA secundário de contorno "Ver todos os depoimentos".

### Seção 6 — CTA final

Verde escuro sólido, centralizado. Headline + uma frase com número ("mais de 500 mil empreendedores"). **Aqui, e só aqui, o botão muda para amarelo.** É o único botão amarelo da página inteira. Abaixo dele, uma linha de três micro-garantias com check: *Teste grátis · Orçamentos em 3 minutos · Suporte em português*.

### Rodapé

Mesmo verde escuro do CTA final, então os dois se fundem num bloco único de fechamento. Quatro colunas: Produto (8), Modelos por profissão (12), Empresa (7), Legal (2). Bloco de marca com descrição, nota e selos de loja. Última linha: razão social, **CNPJ**, e-mail de contato.

## A.3 Sistema visual

| Item | Valor |
| --- | --- |
| Tipografia | Inter Variable |
| H1 | 56px desktop / 36px mobile, peso 700, tracking -1,4px |
| H2 | 30px, peso 700 |
| H3 | 24px, peso 600 |
| Corpo | 16px; rodapé 14px |
| Ritmo vertical | hero 128px; todas as outras seções 96px desktop / 64px mobile |
| Raio | botão e chip = pílula total; cartão = 20px |
| Sombra | praticamente zero |
| Separação de seções | **por cor de fundo**, não por sombra nem por linha |
| Toque | header 36px, chips 44px, CTA do hero 52px |

**Paleta da referência** (para comparação de sensação, não para cópia): uma única matiz verde em 6 tons (#006837 primário, #00552E texto, #004425 escuro, #E9F9F0 e #CDF2DE claros, #9BE5BF sobre escuro), um neutro quente (stone), e **um único acento** amarelo #FFCE00 usado ~18 vezes na página inteira — só nas estrelas e no botão final.

A alternância de fundos é o motor do ritmo: verde-claro → branco → cinza → branco → verde-claro → verde-escuro → verde-escuro. Quatro níveis de superfície e nunca dois iguais em seguida.

## A.4 Comportamento mobile (390px)

- Página inteira: **7240px**, 1,6× o desktop.
- Tudo empilha em uma coluna. Header vira logo + hambúrguer, e **o CTA some do header**.
- **Não existe barra fixa de ação embaixo.**
- H1 cai de 56 para 36px; padding de seção de 96 para 64px.
- O rodapé sozinho ocupa 1669px = **23% da página no celular**.

## A.5 Lógica de conversão

**Promessa principal:** *"Orçamento profissional para quem vive de serviço."* Repare que a promessa é uma **identidade**, não uma funcionalidade. A palavra que carrega o valor é "profissional"; a palavra que carrega o público é "quem vive de serviço".

**O problema nunca é dito.** Em nenhum lugar eles escrevem "você faz orçamento no caderno" ou "você perde cliente". A página inteira mostra o depois. É uma escolha: para esse público, apontar o erro afasta; mostrar o resultado atrai.

**Como conduzem até o CTA**, na ordem em que a cabeça do visitante pergunta:

1. *Isso é pra mim?* → headline nomeia o público, subtítulo nomeia profissões, chips nomeiam mais seis.
2. *Existe pro meu ofício?* → seção de modelos, com o documento visível.
3. *Vou conseguir usar?* → 3 passos, "3 minutos", nenhuma tela complexa mostrada.
4. *Só isso?* → "Tudo num só app", 8 recursos em 3 ideias.
5. *Alguém como eu usa?* → 3 vídeos com rosto e ofício, nota com amostra.
6. *Então tá.* → CTA final, com cor diferente e micro-garantias embaixo.

**Objeções que a página tenta matar, e onde:**

| Objeção | Onde é atacada |
| --- | --- |
| "Não serve pro meu ofício" | chips no hero, seção de modelos, 12 páginas de ofício no rodapé |
| "É complicado / não sei mexer" | "3 minutos", 3 passos, verbos curtos |
| "É golpe / empresa fantasma" | 500 mil downloads, 4,8 com 2.847 avaliações, CNPJ e razão social no rodapé, e-mail, blog, redes |
| "Preciso imprimir e correr atrás de assinatura" | "assinatura digital — sem imprimir nada" |
| "Vai me cobrar de cara" | teste grátis sem cartão (em `/planos`) |
| "Vou ficar preso" | "cancele quando quiser, sem multa" (em `/planos`) |
| "É só pra quem tem computador" | "no celular ou no computador", selos de loja |

**Quantos CTAs e onde:** só **quatro** na home inteira — header (0%), hero (13%), CTA final (78%), mais o `Entrar`. Tudo aponta para a **mesma URL**: `app.fazerorcamento.com/login`. Não existe `/cadastro` separado. Há ainda dois CTAs "moles" (Ver todos os modelos, Ver todos os depoimentos) que não pedem cadastro — servem para manter a pessoa no site quando ela ainda não está pronta.

**O que aparece antes de pedir cadastro:** tudo, menos o preço. Público, prova de ofício, os 3 passos, o escopo do produto, depoimentos e a nota. **Preço exige um clique.** É uma aposta: tirar o número da frente evita a comparação imediata, ao custo de um passo a mais para quem está pronto.

**Como constroem confiança:** rostos reais em cinco lugares diferentes; número com denominador (não "milhares de clientes", e sim "2.847 avaliações"); CNPJ e razão social; páginas de comparação ("vs Excel", "vs bloco") que assumem o concorrente verdadeiro — o caderno, não outro app; e suporte em português dito com todas as letras.

## A.6 O que a referência faz mal (é aqui que o Orçah ganha)

1. **O hero não mostra o produto.** Mostra pessoas segurando celulares. Você termina a página sem nunca ter visto uma tela real.
2. **Preço e FAQ fora da home.** No momento de maior intenção, a pessoa precisa clicar e sair.
3. **Sem barra fixa de ação no celular.** São 7240px com 4 CTAs. Existem trechos de 1500px sem nada clicável que converta.
4. **Rodapé com 23% da página no celular.** Serve SEO, atrapalha a pessoa.
5. **O app logado é muito pior que a landing.** Entrando com a conta: um grid de 8 cartões brancos de contorno verde, todos do mesmo peso, sem um número sequer na tela, e "Não há eventos recentes" como estado inicial. A landing promete uma plataforma; o painel entrega um menu. **Essa é a maior brecha competitiva que existe aqui**, e é exatamente onde o Orçah já tem caixa escura, número grande e pill de status previstos.
6. **O que eles chamam de "Meu site" é um item de menu**, não uma promessa da home. A presença digital do prestador — o diferencial que o Orçah quer cravar — aparece como um link no meio de oito.

---

# B. Estrutura recomendada para o Orçah

O molde abaixo usa a mecânica da referência, mas reordenada para o que o Orçah é: **não um gerador de PDF, e sim a ferramenta que dá presença digital e fecha o orçamento**. Por isso duas coisas mudam de lugar em relação à referência: o que o cliente recebe e a página do prestador sobem, e viram seção inteira.

| # | Seção | Fundo | % alvo | Tem CTA? | Por que existe |
| --- | --- | --- | --- | --- | --- |
| — | Header sticky | `ink` | — | sim | CTA sempre à mão |
| 1 | Hero | `ink` | 16% | sim | Quem é você + o que muda + prova |
| 2 | Faixa de ofícios + prova | `ink` | 4% | não | "serve pra mim" em 2 segundos |
| 3 | **O que o cliente recebe** | claro | 13% | não | O diferencial nº 1: link, não PDF |
| 4 | **Sua página, seu endereço** | claro alternativo | 13% | sim (mole) | O diferencial nº 2: presença digital |
| 5 | Como funciona — 3 passos | claro | 8% | não | "é fácil" |
| 6 | Tudo que vem junto | claro | 11% | não | Escopo em 4 ideias, não 12 features |
| 7 | Feito pro seu ofício | claro alternativo | 8% | sim (mole) | Moldes por ramo |
| 8 | Quem já usa | claro | 9% | não | Prova social de ofício |
| 9 | Plano e risco zero | `gold-wash` | 7% | sim | Preço na cara, com as garantias |
| 10 | Perguntas | claro | 7% | não | Objeção final |
| 11 | CTA final | `ink` escuro | 6% | sim | Fechar |
| 12 | **Rodapé** | `ink` escuro | 8% | não | Confiança legal + SEO. **Hoje não existe.** |

## Detalhe do que vai em cada uma

**1. Hero.** Manter a estrutura atual de duas colunas, mas três correções: (a) a headline hoje tem três frases e ocupa cinco linhas no desktop — precisa caber em duas ou três; (b) o mock do painel precisa virar produto de verdade, com o celular e a tela real, não uma caixa desenhada com `div`; (c) **falta a linha de prova embaixo do CTA** — hoje tem só "7 dias grátis. Sem cartão. R$ 29/mês depois.", que é garantia, não prova. Enquanto não houver número, use prova qualitativa honesta (ofícios atendidos, moldes prontos) em vez de inventar contagem.

**2. Faixa de ofícios.** Hoje a lista de ofícios está lá embaixo, na seção "Para quem é", a 58% da página. A identificação precisa acontecer na primeira rolada, como na referência. Sobe para logo abaixo do hero, como fila de pílulas, terminando com "e mais 70 ofícios" clicável.

**3. O que o cliente recebe.** Já existe e é a melhor ideia da página atual — mas hoje é um retângulo com "Total" e dois botões falsos, 316px. Precisa virar seção inteira mostrando o link real: nome e logo do prestador no topo, itens, total grande, `Aprovar` / `Quero alterar`, e o retorno disso no painel ("visualizado há 2 h"). É o único lugar onde se explica por que link é melhor que PDF, e isso é o coração do produto.

**4. Sua página, seu endereço.** Hoje é meio cartão branco de 5 linhas dividindo espaço com a caixa de preço. Isso é o segundo pilar do produto e está tratado como nota de rodapé. Vira seção inteira, com o endereço `nomedoprestador.orcah.com.br` escrito grande e legível, a página aberta no celular mostrando galeria e serviços, e a frase que fecha o argumento: **o cliente entra pela bio do Instagram e sai com um pedido de orçamento no seu painel.** Nenhum concorrente direto vende isso na home.

**5. Como funciona.** Mantém os 3 passos atuais. É a seção mais curta, e está certo assim.

**6. Tudo que vem junto.** Não existe hoje. Agrupado por momento, à maneira da referência, mas com os momentos do Orçah: **Apresentar** (página pública, galeria, catálogo de serviços) · **Orçar** (moldes por ramo, fotos no orçamento, catálogo, PDF) · **Fechar** (link, aprovação, recusa com motivo, pedido de alteração) · **Acompanhar** (visualização, status, pedidos, resumo do mês). Quatro ideias cobrindo umas quinze funcionalidades já construídas que a home hoje simplesmente não conta.

**7. Feito pro seu ofício.** Os moldes por ramo (`equipe-obra`, `acabamento-visual`, `construtora`, `revestimento`, `oficina-tecnico`) são trabalho pronto e invisível na home. Mostrar dois orçamentos lado a lado — um de pedreiro, um de pintor — prova em uma imagem o que um parágrafo não prova.

**9. Plano.** Mantém o preço na home. A referência esconde; o Orçah **não deve esconder**, porque R$ 29 com trial de 7 dias e sem limite de orçamento é mais barato que os R$ 39/mês deles e que os R$ 19,90-com-teto-de-30 do Orçaki. Preço aqui é argumento, não objeção.

**12. Rodapé.** Hoje a página simplesmente **termina no botão**. Sem rodapé, sem CNPJ, sem termos, sem privacidade, sem contato, sem links de ofício. É a maior lacuna estrutural da página, e ela custa confiança (quem é essa empresa?) e busca (nenhuma superfície de SEO).

## Regras de ritmo e hierarquia a adotar

- **Padding de seção:** hoje 48px; subir para 80–96px no desktop e 56–64px no mobile. O aperto atual é a razão principal da página parecer amadora antes de qualquer questão de cor.
- **Quatro níveis de superfície, alternando**, nunca dois iguais em seguida. Hoje só existem dois (`ink` e `paper`), então a página lê como listras preto-e-branco.
- **Um CTA sólido por seção, no máximo.** Hoje a primeira tela do desktop tem quatro botões dourados ao mesmo tempo (header, hero, o "+ Criar orçamento" do mock, e a barra fixa no mobile).
- **Escala de títulos:** H1 48–56px, H2 30–32px, H3 20–24px. Hoje H1 48 e H2 24, com um H2 solto em 20 ("Sua página na bio") — a escala está comprimida e o H2 quase não se distingue do corpo.
- **Alvo de toque mínimo 44px.** Medido agora no mobile: `Entrar` no header tem **20px** de altura e cada pergunta do FAQ tem **24px**.

---

# C. Principais diferenças entre a referência e o Orçah

| Dimensão | fazerorcamento.com | Orçah hoje | Leitura |
| --- | --- | --- | --- |
| Altura desktop | 4494px | **2305px** | A nossa página tem metade do argumento |
| Altura mobile | 7240px | **3426px** | Idem |
| Padding de seção | 96px / 64px | **48px / 48px** | Principal causa da sensação de aperto |
| Seções de conteúdo | 6 + rodapé | 6 + **sem rodapé** | Falta o fechamento da página |
| Rodapé | 17% do desktop | **0%** | Sem CNPJ, termos, contato ou SEO |
| Níveis de superfície | 4, alternando | 2 (`ink` / `paper`) | Ritmo em listras |
| Navegação no header | 5 âncoras | **nenhuma** | Não dá para pular para preço nem para FAQ |
| CTA no header (mobile) | some | **some** | Ambos perdem; nós compensamos com barra fixa |
| Barra fixa mobile | não tem | **tem** | ✅ ponto nosso |
| CTAs sólidos na 1ª tela | 1 | **3–4** | O principal compete com um mock |
| Fotografia / rosto humano | 5 pessoas + 3 vídeos | **zero** | Maior lacuna de confiança |
| Prova social | nota, amostra, downloads | **nenhuma** | Nada prova que alguém usa |
| Prova de ofício | chips no hero + 12 páginas | chips a 58% da página | Identificação tarde demais |
| Produto visível | não mostra a tela | mostra, mas é `div` desenhada | Empate ruim; dá para ganhar fácil |
| Preço na home | escondido em `/planos` | **na home, R$ 29** | ✅ ponto nosso, e mais barato que R$ 39 |
| FAQ na home | não tem | **tem** | ✅ ponto nosso |
| Presença digital do prestador | item de menu | meio cartão a 66% da página | Nosso diferencial, mal contado pelos dois |
| Confiança legal | CNPJ, razão social, e-mail | **nada** | Lacuna séria |
| Preview ao compartilhar | sim | **não** | Detalhado abaixo |
| Título/SEO | título e descrição por página | `title: "Orçah"`, sem mais nada | Nenhum trabalho de busca |

## Três achados que não são de layout, mas pesam mais que ele

1. **Não existe Open Graph.** `src/app/layout.tsx` não declara `openGraph` nem `twitter`, e `public/brand/orcah-share.png` existe mas nunca é referenciado. Consequência prática: **colar `orcah.com.br` no WhatsApp gera um link seco, sem card, sem imagem, sem título.** Num produto cujo canal é o WhatsApp e cuja distribuição vai ser prestador mandando link para prestador, isso é o bug de marketing mais caro do projeto — e é uma correção de dez linhas.

2. **O header não navega.** Não há âncoras. Quem entra querendo só o preço precisa rolar a página inteira. A referência resolve isso com 5 links que são as 5 objeções.

3. **O mock do painel é desenhado à mão em `div`.** Ele conta uma versão do produto que não é a que existe. O produto real já tem caixa escura, pill de status e timeline — mostrar a tela de verdade é ao mesmo tempo mais honesto, mais bonito e menos trabalho de manutenção.

---

# D. Auditoria da paleta atual

Tokens lidos de `src/app/globals.css`. Uso real contado por varredura das classes em `src/`.

## D.1 Uso real de cada token

| Token | Hex | Papel declarado | Usos | Situação |
| --- | --- | --- | --- | --- |
| `ink` | `#0D1526` | casca escura | 25 `bg` + 28 `text` | ✅ consistente |
| `ink-tile` | `#16223A` | caixa de número | 9 | ✅ |
| `ink-line` | `#29354F` | borda no escuro | 17 | ✅ |
| `ink-text` | `#F7F9FC` | texto sobre escuro | 22 | ✅ |
| `ink-soft` | `#A9B6CE` | legenda sobre escuro | 31 | ✅ |
| `paper` | `#F5F7FA` | fundo de tela | 28 | ✅ |
| `card` | `#FFFFFF` | caixa clara | 85 | ✅ |
| `line` | `#E3E8EF` | borda clara | 111 | ✅ |
| `text` | `#0D1526` | texto | **0** | ⚠️ token canônico nunca usado |
| `text-soft` | `#59677F` | texto secundário | **0** | ⚠️ token canônico nunca usado |
| `navy` (alias) | = `text` | não usar em tela nova | **18** | ❌ alias venceu o canônico |
| `navy-soft` (alias) | = `text-soft` | não usar em tela nova | **134** | ❌ o token mais usado do projeto é um alias legado |
| `gold` | `#FFB020` | ação primária | 33 `bg` + 18 `text` + 45 `border` | ⚠️ significado diluído (ver D.3) |
| `gold-press` | `#E5991A` | hover | 14 | ✅ |
| `gold-wash` | `#FFF4E0` | chip, realce | 8 | ✅ |
| `gold-deep` | `#9D680B` | dourado sobre branco | 15 | ⚠️ contraste (ver D.2) |
| `ok` / `ok-wash` | `#16A34A` / `#E7F6ED` | aprovado | 8 | ❌ contraste |
| `no` / `no-wash` | `#DC2626` / `#FDECEC` | recusado | 9 | ⚠️ contraste marginal |
| `danger` (alias) | = `no` | — | **17** | ❌ duas grafias para a mesma cor |
| `wait` / `wait-wash` | `#FFB020` / `#FFF4E0` | aguardando | 2 | ❌ é o mesmo hex do botão |
| `zap` | `#25D366` | só WhatsApp | 3 | ❌ contraste grave |
| `cream`, `cream-dark`, `gold-bright`, `success` | aliases | — | 0 | 🧹 lixo, podem sair |

## D.2 Contraste (WCAG 2.1, calculado)

**Passa com folga:**

| Par | Razão | |
| --- | --- | --- |
| `ink` sobre `gold` (texto do botão primário) | **9,8:1** | ✅ |
| `gold` sobre `ink` (número em destaque) | 9,8:1 | ✅ |
| `gold` sobre `ink-tile` | 8,7:1 | ✅ |
| `ink-soft` sobre `ink` | 8,8:1 | ✅ |
| `text`/`navy` sobre `paper` | 16,8:1 | ✅ |
| `text-soft`/`navy-soft` sobre `paper` | 5,3:1 | ✅ |
| `text-soft`/`navy-soft` sobre `card` | 5,7:1 | ✅ |
| `no` sobre `card` | 4,8:1 | ✅ |

**Reprova:**

| Par | Razão | Onde aparece | |
| --- | --- | --- | --- |
| branco sobre `zap` | **2,0:1** | botão "Enviar pelo WhatsApp", "Responder no WhatsApp", contato da página pública | ❌ grave |
| `ok` sobre `ok-wash` | **3,0:1** | pill "Aprovado" em `status-pill.tsx` | ❌ |
| `ok` sobre `card` | 3,3:1 | "Cliente selecionado", "Perfil salvo", "Visualizado em…" | ❌ |
| `no` sobre `no-wash` | 4,2:1 | pill "Recusado" | ⚠️ |
| `gold-deep` sobre `gold-wash` | **4,4:1** | "Um plano só", "Link da bio", pill "Aguardando" | ⚠️ e é texto de 12px, onde o mínimo prático é maior |
| `gold-deep` sobre `paper` | 4,4:1 | rótulos de passo na home | ⚠️ |
| `gold-deep` sobre `card` | 4,8:1 | links "Criar agora", "Esqueci a senha" | ✅ no limite |

O caso do `zap` tem solução trivial e sem custo de marca: **trocar o texto do botão de branco para `ink`** leva o contraste de 2,0:1 para **9,1:1** sem mexer no verde do WhatsApp.

**Foco de teclado:** todos os inputs usam `outline-none focus:border-gold` — ou seja, o foco é uma mudança de cor numa borda de 1px, e some para quem enxerga pouco. Não existe token de foco na paleta. É a falha de acessibilidade mais sistemática do projeto (aparece em praticamente todo formulário).

## D.3 Consistência e percepção

**A paleta tem cinco matizes, e duas delas são a mesma coisa.** Navy, dourado, verde `ok` (#16A34A), verde `zap` (#25D366) e vermelho. Os dois verdes são diferentes e podem aparecer na mesma tela — um pill "Aprovado" ao lado de um botão de WhatsApp — o que lê como descuido, não como sistema. A referência trabalha com **uma** matiz e **um** acento; essa é a diferença de sensação entre "produto" e "protótipo", e ela não vem do verde deles, vem da disciplina.

**A camada de alias está governando o projeto.** `docs/paleta.md` diz que `navy` / `navy-soft` existem só para não quebrar tela antiga e não devem ser usados em tela nova. Na prática, `navy-soft` é a classe **mais usada do código inteiro** (134 ocorrências) e os tokens canônicos `text` / `text-soft` têm **zero**. `danger` (17) convive com `no` (3). Isso não é problema de cor, é de manutenção: qualquer ajuste futuro de paleta precisa ser feito em dois lugares e alguém vai esquecer um.

**O ouro significa três coisas ao mesmo tempo.** Ação primária (botão), espera (`wait` é literalmente o mesmo `#FFB020`) e realce (`gold-wash` em chip, `focus:border-gold` em input). Quando a mesma cor diz "clique aqui", "está parado" e "olhe aqui", ela para de dizer qualquer coisa. Na home isso já aparece: a primeira tela do desktop tem quatro elementos dourados competindo, e um deles é um botão falso dentro de um mock.

**O CTA chama atenção?** Sim, quando está sobre `ink` — 9,8:1 e matiz oposta, é impossível não ver. Não, quando está sobre `paper` ou `gold-wash`, onde o mesmo dourado perde metade da força. Como quase todo o corpo da página é claro, o CTA é forte só nas duas pontas.

**Percepção de marca.** Marinho + ouro lê *finanças, contabilidade, seriedade, caro*. É coerente com "profissionalize-se", e é uma boa escolha de diferenciação — o mercado inteiro (Orçaki amarelo-fita, fazerorcamento verde) está em outro lugar. Mas hoje falta o contrapeso: **zero fotografia, zero rosto, zero cor quente que não seja o botão**. Para um pedreiro de Maravilha-SC, confiança vem menos de "parece caro" e mais de "gente como eu usa isso". A paleta está correta; a marca está fria porque nada além de cor foi construído em cima dela.

**Parece SaaS moderno?** Os tokens, sim — navy profundo, neutro levemente frio, âmbar saturado é um combo atual e bem calibrado. O que não parece moderno é o resto: espaçamento apertado, duas superfícies só, sombra zero sem compensação de contraste, `<details>` com a setinha nativa do navegador, e escala tipográfica comprimida. **O problema de "cara de SaaS" no Orçah não é a paleta.**

**Excesso de cores?** Não em quantidade — 14 tokens úteis é um sistema enxuto. O excesso é de **sinônimos** (2 verdes, 2 nomes para vermelho, 2 nomes para o texto, 4 aliases mortos) e de **significados por cor** (ouro fazendo três papéis).

## D.4 Veredito objetivo

**1. A paleta atual deve ser mantida?**
A espinha sim. `ink`, `gold` e `paper` estão bem escolhidos, bem contrastados e diferenciam o Orçah dos dois concorrentes. Não jogue fora.

**2. Deve ser ajustada?**
**Sim — esta é a recomendação.** Ajuste cirúrgico, não reforma: limpar sinônimos, separar significados, consertar cinco pares de contraste, adicionar o que falta (níveis de superfície e token de foco).

**3. Deve ser completamente reformulada?**
Não, e reformular seria um erro. A queixa real ("não parece SaaS moderno") nasce de espaçamento, hierarquia, ausência de fotografia e dos aliases legados — trocar os hexadecimais não resolveria nenhuma das quatro, e custaria o reconhecimento que a marca já tem nas telas, na logo e no PDF.

**4. Que características a nova paleta deveria ter?**

- **Uma matiz de marca, um acento.** Marinho é a marca; ouro é a ação. Tudo que não for uma dessas duas coisas é neutro ou semântico.
- **Um nome por cor.** Os aliases saem; `text` / `text-soft` / `no` viram os únicos nomes.
- **Ouro exclusivo da ação.** "Aguardando" ganha cor própria; o realce de chip e o foco saem do ouro.
- **Quatro níveis de superfície no claro**, para a página poder alternar sem virar listra: branco, `paper`, um segundo claro (neutro ou tinta fria muito leve) e um tom quente para as faixas de destaque.
- **Dois níveis de escuro:** `ink` para casca e um mais profundo para CTA final e rodapé, para eles se fundirem num bloco de fechamento.
- **Semânticas que passam em AA sobre o próprio wash.** Verde e vermelho mais escuros que os atuais.
- **Token de foco explícito**, visível, com espessura própria — não uma borda de 1px trocando de cor.
- **Regra de contraste mínima escrita:** 4,5:1 para texto normal, 3:1 para texto ≥ 24px e para borda de componente.

## D.5 Direção proposta (não implementada)

Ponto de partida para discussão, não valores finais.

| Token | Hoje | Proposta | Motivo |
| --- | --- | --- | --- |
| `ink` | `#0D1526` | mantém | Marca |
| `ink-deep` | — | **novo**, mais escuro que `ink` | CTA final + rodapé como bloco único |
| `ink-tile`, `ink-line`, `ink-text`, `ink-soft` | — | mantêm | Funcionam |
| `paper` | `#F5F7FA` | mantém | Funciona |
| `paper-alt` | — | **novo**, um degrau abaixo de `paper` | 4º nível de superfície, alternância de seções |
| `card` / `line` | — | mantêm | Funcionam |
| `text` / `text-soft` | 0 usos | mantêm o hex, **viram os únicos nomes** | `navy` / `navy-soft` saem |
| `gold` / `gold-press` / `gold-wash` | — | mantêm, **só para ação** | Deixa de ser realce e foco |
| `gold-deep` | `#9D680B` | **escurecer** até ≥ 4,5:1 sobre `gold-wash` | Hoje 4,4:1 |
| `ok` / `ok-wash` | `#16A34A` | **escurecer o `ok`** até ≥ 4,5:1 sobre `ok-wash` | Hoje 3,0:1 |
| `no` / `no-wash` | `#DC2626` | escurecer levemente | Hoje 4,2:1 no pill |
| `wait` / `wait-wash` | = `gold` | **cor própria**, fora da família do botão | Devolve o significado ao ouro |
| `zap` | `#25D366` | mantém o verde, **texto vira `ink`** | 2,0:1 → 9,1:1 sem perder o WhatsApp |
| `focus` | — | **novo**, anel visível de 2–3px | Não existe hoje |
| `cream`, `cream-dark`, `gold-bright`, `success`, `danger`, `navy`, `navy-soft` | aliases | **removidos** após a migração | Um nome por cor |

E o que **não** é paleta, mas resolve a percepção mais que qualquer hexadecimal: fotografia de prestador de verdade, screenshot real do produto no lugar dos mocks em `div`, respiro de 80–96px entre seções e uma escala tipográfica com degraus de verdade.

---

# E. Proposta de melhorias

## E.1 Estrutura da home

1. Criar o **rodapé** (hoje inexistente): marca + descritor, colunas de produto, ofícios e legal, CNPJ/razão social quando houver, contato, termos e privacidade.
2. Adicionar **navegação por âncora no header** (Como funciona · Sua página · Plano · Perguntas) e manter o par `Entrar` + botão sólido.
3. Subir **ofícios** para logo abaixo do hero.
4. Promover **"O que o cliente recebe"** a seção inteira, com o link real.
5. Promover **"Sua página, seu endereço"** a seção inteira, com `nomedoprestador.orcah.com.br` em destaque e a página aberta no celular.
6. Criar **"Tudo que vem junto"**, em quatro momentos: Apresentar · Orçar · Fechar · Acompanhar.
7. Criar **"Feito pro seu ofício"**, com dois moldes lado a lado.
8. Criar **"Quem já usa"**, com prova honesta — depoimento real com nome, ofício e cidade assim que existir; até lá, prova qualitativa (ofícios atendidos, moldes prontos) sem número inventado.
9. Separar **Plano** do cartão da bio e dar caixa própria, com as três garantias em linha: 7 dias · sem cartão · cancela quando quiser.
10. Manter FAQ na home, **estilizado** (hoje é `<details>` com a seta nativa do navegador) e com a área de toque em 48px.

## E.2 Hierarquia e ritmo

11. Padding de seção de 48px → **80–96px** desktop, 56–64px mobile.
12. Introduzir o **4º nível de superfície** e alternar fundos; hoje a página é listra `ink`/`paper`.
13. **Um CTA sólido por seção.** Tirar o dourado do botão falso dentro do mock.
14. Encurtar a headline para caber em 2–3 linhas no desktop.
15. Abrir a escala tipográfica: H2 sobe para 30–32px; eliminar o H2 solto em 20px.
16. Limitar a largura do texto a ~65 caracteres nas seções de duas colunas.
17. `max-w-5xl` com `px-4` deixa o conteúdo colado na borda em telas de ~1035px — subir o respiro lateral.

## E.3 Mobile

18. Mostrar o CTA no header também no mobile, ou compensar com a barra fixa já existente — hoje o topo mobile tem só "Entrar", com **20px** de altura.
19. FAQ com 24px de alvo de toque → 48px.
20. `scroll-margin-top` nas seções, para o header sticky não cobrir o título ao pular por âncora (visível hoje: o "R$ 29/mês" fica escondido atrás do header).

## E.4 Confiança e distribuição

21. **Open Graph e Twitter Card** em `layout.tsx`, usando `public/brand/orcah-share.png`. Maior retorno por linha de código do projeto inteiro, porque o canal de distribuição *é* o WhatsApp.
22. Título e descrição de verdade (hoje `title: "Orçah"`).
23. **Fotografia de prestador de verdade** — é a única lacuna que nenhuma mudança de CSS resolve.
24. **Screenshot real do produto** no lugar dos mocks desenhados em `div`.
25. Dados legais no rodapé.

## E.5 Paleta

26. Migrar `navy` → `text`, `navy-soft` → `text-soft`, `danger` → `no`; apagar `cream`, `cream-dark`, `gold-bright`, `success`. Troca mecânica, 172 ocorrências, risco praticamente nulo.
27. Texto do botão `zap` de branco para `ink`.
28. Escurecer `ok`, `no` e `gold-deep` até AA sobre os respectivos washes.
29. Dar cor própria ao `wait`, separando-o do ouro de ação.
30. Criar o token de foco e trocar `outline-none focus:border-gold` por um anel visível em todos os formulários.
31. Criar `ink-deep` e `paper-alt`.

---

# F. Ordem de prioridade

## Lote 1 — barato, imediato, mexe em pouca coisa

| # | O quê | Por quê agora |
| --- | --- | --- |
| 1 | Open Graph + título/descrição | Dez linhas. Todo link colado no Zap hoje sai sem card. |
| 2 | Texto do botão WhatsApp para `ink` | Uma classe. 2,0:1 → 9,1:1. |
| 3 | Rodapé da home | Única seção estrutural inteiramente ausente; custa confiança e busca. |
| 4 | Padding de seção 48 → 80/96px | Uma troca de classe por seção. É o que mais muda a sensação de acabamento. |
| 5 | Alvos de toque: `Entrar` (20px) e FAQ (24px) → 48px | Acessibilidade básica, mobile-first. |

## Lote 2 — a página conta o produto certo

| # | O quê | Por quê agora |
| --- | --- | --- |
| 6 | "Sua página, seu endereço" como seção inteira | É o diferencial nº 1 e hoje é meio cartão. |
| 7 | "O que o cliente recebe" como seção inteira, com o link real | É o diferencial nº 2 e hoje é um retângulo. |
| 8 | Ofícios sobem para logo abaixo do hero | Identificação acontece a 58% da página; tem que ser na 1ª rolada. |
| 9 | "Tudo que vem junto", em 4 momentos | Quinze funcionalidades prontas que a home não conta. |
| 10 | Um CTA sólido por seção; tirar o dourado do mock | Hoje 4 dourados competem na 1ª tela. |
| 11 | Âncoras no header + `scroll-margin-top` | Quem quer só o preço não precisa rolar tudo. |

## Lote 3 — limpeza de paleta (mecânica, sem decisão de design)

| # | O quê |
| --- | --- |
| 12 | `navy`/`navy-soft`/`danger` → `text`/`text-soft`/`no`; apagar aliases mortos |
| 13 | Escurecer `ok`, `no`, `gold-deep` até AA |
| 14 | `wait` ganha cor própria |
| 15 | Token de foco + troca do `outline-none focus:border-gold` |
| 16 | `ink-deep` e `paper-alt`, com a alternância de fundos aplicada |

## Lote 4 — precisa de material novo (fotógrafo, screenshot, cliente real)

| # | O quê | Bloqueio |
| --- | --- | --- |
| 17 | Fotografia de prestador de verdade | Precisa de foto |
| 18 | Screenshot real do produto no hero | Precisa das telas em estado bonito |
| 19 | "Quem já usa" com depoimento nomeado | Precisa do primeiro cliente disposto |
| 20 | "Feito pro seu ofício", dois moldes lado a lado | Precisa gerar os dois orçamentos de exemplo |
| 21 | Páginas de ofício (SEO) e comparações | Trabalho de conteúdo, depois do MVP |

O Lote 1 é meio dia e resolve as falhas objetivas. O Lote 2 é o que faz a página parar de vender "gerador de orçamento" e passar a vender **presença digital + fechamento**, que é o posicionamento escrito em `docs/produto.md`. O Lote 3 é mecânico e pode rodar em paralelo. O Lote 4 é o que separa uma página correta de uma página que converte, e depende de material que ainda não existe.

---

## Anexo — o que explicitamente não copiar da referência

Verde e a paleta inteira · a tipografia · qualquer foto, ícone ou ilustração · o desenho dos cartões de modelo · a logo e o wordmark · qualquer frase ("quem vive de serviço", "3 passos", "Crie/Envie/Feche", "Tudo num só app", "Comece hoje, grátis") · os selos de loja (o Orçah é PWA) · o formato de depoimento com texto amarelo sobre verde · a estrutura de três planos · esconder o preço da home · o rodapé de 23% no celular.

O que foi levado: **a ordem das perguntas na cabeça do visitante**, agrupar funcionalidade por momento em vez de lista, prova social logo abaixo do CTA em vez de acima, uma cor de ação com significado único, alternância de superfícies como ritmo, o rodapé como peça de confiança e busca, e a navegação do header como roteiro de objeções.
