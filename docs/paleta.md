# Paleta Orçah

O produto é **claro onde se trabalha** e **escuro na casca**. Fundo `paper`, texto `ink`, ouro só na ação. Sem bege. Sem amarelo de fita de obra. Sem tema escuro na tela de formulário.

A logo não muda: ícone dourado, wordmark marinho, ç, sem acento no a final, sem `!`.

Um nome por cor. Sem alias.

Contraste mínimo: **4,5:1** para texto normal; **3:1** para texto ≥ 24px e para borda de componente.

## Tokens

| Token | Hex | Uso |
| --- | --- | --- |
| `ink` | `#151F38` | Topo do painel, barra, hero |
| `ink-deep` | `#070B14` | CTA final e rodapé, como bloco único |
| `ink-tile` | `#16223A` | Caixa escura de número |
| `ink-line` | `#29354F` | Borda no escuro |
| `ink-text` | `#F7F9FC` | Texto sobre escuro |
| `ink-soft` | `#A9B6CE` | Legenda sobre escuro |
| `paper` | `#F5F7FA` | Fundo das telas |
| `paper-alt` | `#E8EDF4` | 4º nível de superfície, seções alternadas |
| `card` | `#FFFFFF` | Caixa, input, PDF |
| `line` | `#E3E8EF` | Bordas no claro |
| `text` | `#151F38` | Texto |
| `text-soft` | `#59677F` | Texto secundário |
| `gold` | `#FFB020` | Botão primário |
| `gold-press` | `#E5991A` | Hover / pressionado |
| `gold-wash` | `#FFF4E0` | Chip, realce claro |
| `gold-deep` | `#8B5A09` | Texto dourado sobre branco ou `gold-wash` |
| `ok` / `ok-wash` | `#166534` / `#E7F6ED` | Aprovado |
| `no` / `no-wash` | `#B91C1C` / `#FDECEC` | Recusado |
| `wait` / `wait-wash` | `#2C4A6E` / `#DCE6F2` | Aguardando (família do `ink`, não do ouro) |
| `zap` | `#25D366` | Só botão de WhatsApp; texto `ink` |
| `focus` | `ink` | Anel de 3px em `:focus-visible` |

Classes Tailwind: `bg-ink`, `bg-ink-deep`, `bg-paper`, `bg-paper-alt`, `bg-gold`, `bg-zap`, `text-text`, `text-text-soft`, `text-wait`, `rounded-box`.

## Como aplicar

1. **Casca:** topo, barra e números do painel em `ink`. CTA final e rodapé em `ink-deep`.
2. **Trabalho:** formulário e orçamento do cliente em `paper` + `card`. Alternar `paper` / `paper-alt` nas seções da home.
3. **Ação:** um botão ouro por tela. WhatsApp em `zap` com texto `ink`.
4. **Status:** pill colorida. Espera usa `wait`, nunca `gold`.
5. **Foco:** anel de 3px (`focus`) em `input`/`select`/`textarea` no `:focus` e em qualquer controle no `:focus-visible`. Em superfície `ink`, a cor do anel é `currentColor`.
6. **PDF:** fundo branco, logo dourada, texto `ink`, linha ouro fina no cabeçalho.

## CSS

Valores em `src/app/globals.css`.
