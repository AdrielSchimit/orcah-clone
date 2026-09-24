# Marca Orçah — nome, assinatura e logo

Complemento de `docs/paleta.md`. A paleta diz as cores; este arquivo diz como o nome aparece e o que anda junto dele.

Serve como briefing para o desenho definitivo da logo.

---

## O problema que a assinatura resolve

`Orçah` é um bom nome: curto, registrável, fácil de falar ("orçá"). Mas o `h` é mudo e não carrega significado. Quem vê a palavra sozinha não sabe se é orçamento, oficina ou financeira.

A solução não é trocar o nome nem enfiar explicação dentro dele. É **fixar uma frase curta ao lado do wordmark**, sempre a mesma, sempre no mesmo lugar. Em design isso se chama assinatura, ou lockup: nome e descritor viram um bloco só, que nunca é remontado à mão.

Depois de meses de circulação a frase pode sair, porque o nome já significa o produto. Antes disso, ela é obrigatória.

---

## Nome, escrita

Regras que não mudam:

- Escreve **Orçah**: ç sempre, sem acento no `a` final, sem `!`.
- Em corpo de texto, capitaliza só o O. Não usa `ORÇAH` em caixa alta como wordmark.
- `orcah` sem cedilha existe **só** em endereço e usuário: `orcah.com.br`, `@orcah`. Nunca em peça visual.
- Erros a evitar em qualquer material: `Orça`, `Orçá`, `Orçah!`, `Orcah`, `OrçaH`.
- Nome de empresa não flexiona: "no Orçah", "com o Orçah". Nunca "no aplicativo Orçah App".

## Descritor — a frase da assinatura

O descritor é funcional e fixo. Não é slogan, não muda por campanha, e não leva ponto final.

**Escolhido: `Orçamento no WhatsApp`**

Ganha porque cobre o que o nome não diz (é orçamento) e o canal que o prestador já entende (WhatsApp), em três palavras que caem embaixo do wordmark sem quebrar linha.

Avaliadas e descartadas:

| Frase | Por que não |
| --- | --- |
| `Orçamentos profissionais` | É o que o Orçaki já diz. Não separa. |
| `Orçamento pelo celular` | Verdadeiro e genérico. Todo app é pelo celular. |
| `Orçamento, envio e aprovação` | Descreve certo, mas é longo e quebra em duas linhas no tamanho pequeno. |
| `Orçamento em 2 minutos` | Promessa de campanha, não descritor. Envelhece e cria expectativa. |

**Slogan é outra coisa.** Vive em anúncio e topo de home, muda quando quiser, e nunca entra no lockup: *Monte, mande, feche.*

---

## Variações do lockup

Cinco, e só cinco. Qualquer arranjo fora desta lista está errado.

**1. Horizontal com descritor** — uso padrão. Ícone à esquerda, `Orçah` à direita, descritor na linha de baixo, alinhado com a esquerda do `O` do wordmark (não com o ícone). É a versão de cabeçalho de site e de topo de PDF.

**2. Empilhado com descritor** — ícone em cima, centralizado, wordmark embaixo, descritor por último. Para splash do PWA, imagem de compartilhamento e qualquer espaço mais alto que largo.

**3. Reduzido** — ícone + wordmark, sem descritor. Para barra de navegação interna, onde já se sabe onde está, e para espaços com menos de 88px de largura.

**4. Ícone puro** — favicon, ícone do PWA, avatar de Instagram e WhatsApp. Nunca leva letra dentro.

**5. Assinatura com domínio** — empilhado, com `orcah.com.br` no lugar do descritor. Só para peça impressa, adesivo e anúncio, onde o endereço é a ação.

---

## Construção

Medidas relativas, para o lockup escalar sem ser redesenhado. Chamo de **C** a altura da caixa alta do `O` do wordmark.

| Regra | Valor |
| --- | --- |
| Altura do descritor (caixa alta) | 1/3 de **C** |
| Espaço entre wordmark e descritor | 1/2 da altura do descritor |
| Espaço entre ícone e wordmark | 1/2 de **C** |
| Altura do ícone | 1,4 × **C** |
| Respiro em volta de tudo | 1 × **C** em todos os lados |
| Tracking do descritor | +6% a +8% |
| Peso do descritor | Medium (500). Nunca bold. |
| Caixa do descritor | Alta e baixa normal, como frase. Não versal. |

O descritor **nunca** passa da largura do wordmark. Se passar, o problema é a frase, não a medida.

### Tamanho mínimo

- Acima de 88px de largura (ou 22mm impresso): lockup completo.
- Entre 40 e 88px: versão reduzida, sem descritor.
- Abaixo de 40px: só o ícone.

Descritor ilegível é pior que descritor ausente.

---

## Cor da assinatura

Com os tokens novos de `docs/design-audit.md`:

| Fundo | Ícone | Wordmark | Descritor |
| --- | --- | --- | --- |
| Escuro `ink #151F38` | `gold #FFB020` | `ink-text #F7F9FC` | `ink-soft #A9B6CE` |
| Claro `paper` / `card` | `gold #FFB020` | `text #151F38` | `text-soft #59677F` |
| Uma cor só (carimbo, fax, serigrafia) | `ink` | `ink` | `ink` |
| Uma cor sobre foto escura | branco | branco | branco |

Proibido:

- Descritor em ouro. Ouro é ação no produto; se a assinatura for dourada, ela compete com os botões.
- Ícone marinho dentro de bloco ouro, na versão horizontal.
- Lockup sobre foto sem faixa escura por baixo.
- Sombra, gradiente ou contorno no wordmark.

---

## Onde cada versão vive

Hoje os arquivos em `public/brand/` são todos PNG. **Falta SVG**, e é a primeira coisa a pedir no redesenho: sem vetor, o lockup vai borrar em tela de alta densidade e não dá para recolorir por CSS.

| Arquivo | Versão |
| --- | --- |
| `orcah-logo.png` → `.svg` | Horizontal com descritor |
| `orcah-header.png` → `.svg` | Reduzido, sem descritor |
| `orcah-share.png` | Empilhado com descritor e domínio |
| `orcah-icon.png` → `.svg` | Ícone puro |
| `orcah-pdf.png` | Horizontal, uma cor, para cabeçalho do PDF |
| `orcah-whatsapp.png`, `orcah-instagram.png` | Ícone em círculo |
| `favicon.ico`, `apple-touch-icon.png`, `orcah.ico` | Ícone puro |

---

## Onde a assinatura **não** entra

Isto é regra de produto, não de estética, e vale mais que o resto.

- **No link que o cliente abre** (`/orcamento/[token]`) e **na página pública** (`/empresa/[slug]`), a marca que manda é a **do prestador**. O Orçah assina no rodapé, em texto pequeno: "Feito com Orçah". Cliente que abre o orçamento precisa ver o serralheiro dele, não a nossa logo.
- **Dentro do painel**, o lockup aparece uma vez, reduzido, e não repete em cada tela.
- **No PDF**, a logo do prestador é a principal; a nossa é linha fina de rodapé.

Isso é o oposto do Orçaki, que assina tudo. É proposital: nosso produto vende a presença do prestador, então a nossa marca aparece onde ele decide mostrar, não onde ele está trabalhando.

---

## Briefing para o desenho

O que pedir a quem for desenhar:

1. Manter o símbolo atual — balão de fala com a dobra dourada. Não redesenhar do zero; refinar curva, espessura e a dobra, que hoje só existe em PNG.
2. Escolher a tipografia do wordmark com **cedilha desenhada**, não a cedilha padrão da fonte. É o único traço realmente nosso na palavra.
3. Entregar as cinco variações, em SVG e PNG (1×, 2×, 3×), nas duas versões de cor mais a monocromática.
4. Entregar o ícone em 512, 192, 180, 32 e 16px, com margem interna própria — o ícone do PWA não pode usar o mesmo recorte da logo grande.
5. Entregar uma folha de construção com as medidas relativas deste arquivo, para conferência.

O que não aceitar: nome com "app" embutido, `!`, engrenagem, prancheta, capacete de obra, e qualquer amarelo de fita de sinalização.
