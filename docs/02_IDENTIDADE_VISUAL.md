### 02 - Briefing de Identidade Visual e Alinhamento Estético

**Objetivo:** Pedir uma análise realista e sem filtros do Claude Opus sobre a paleta de cores (Roxo Escuro + Dourado) e o conceito da logo (Papel Dourado + Texto) para o SaaS **Orçah**. 

### 🧠 Instruções para o Claude Opus (Modo Ask / Chat)

"Opus, analise criticamente a nossa ideia atual de identidade visual. Seja 100% realista e pragmático. Se você achar que a combinação de roxo escuro com papel dourado parecer amadora, pesada ou datada para um aplicativo moderno de prestadores de serviço, **você tem total liberdade para sugerir uma mudança de 100% na paleta e no conceito do logo**." 

### 🎯 Critérios que o Opus deve avaliar para o Orçah:

1. **Contexto do Usuário:** Prestadores de serviço usam o app na rua, sob a luz do sol, em telas de celular às vezes trincadas ou baratas. Roxo escuro e dourado oferecem contraste e leitura suficientes em telas mobile?
2. **Psicologia das Cores:** O roxo escuro remete a SaaS premium/orçamentos ou está muito associado a finanças de luxo (estilo Nubank antigo/cartões black)? O dourado em gradiente na web costuma parecer "premium" ou "brega/amador"?
3. **Alternativas Radicais:** Se você fosse mudar 100%, qual paleta minimalista (Ex: Slate + Emerald, Zinc + Indigo, Amber + Dark Charcoal) traria mais sensação de 'aplicativo nativo e moderno'?

### 📝 Resolução e Paleta Definitiva (A ser ditada pelo Opus)

#### Premissa corrigida

O Orçah **não usa roxo**. A paleta em produção (`src/app/globals.css`) e a logo (`public/brand/orcah-header2.png`) são **azul-marinho `#151F38` + âmbar `#FFB020`**. Roxo escuro não aparece em nenhum arquivo de `src/`. A análise abaixo é sobre o que existe de fato.

#### Veredito: manter a paleta, refazer o desenho da logo

Não recomendo mudança de 100%. Marinho + âmbar é a combinação certa para este público; trocar agora só custaria reconhecimento e retrabalho em 40+ arquivos. O que está amador não é a cor, é o **acabamento do ícone**.

#### 1. Contexto do usuário (sol, tela barata, tela trincada)

Contraste medido (WCAG, mínimo 4,5:1 para texto e 3:1 para componente):

| Combinação | Contraste | Resultado |
| --- | --- | --- |
| Texto `ink` sobre branco | 16,1:1 | Excelente, aguenta sol |
| Texto `ink` sobre botão `gold` | 8,8:1 | Excelente |
| `gold` sobre fundo `ink` (hero) | 8,8:1 | Excelente |
| `text-soft` sobre `paper` | 5,3:1 | Passa |
| `ink-soft` sobre `ink` | 7,9:1 | Passa |
| `gold-deep` sobre branco | 5,9:1 | Passa |
| Branco sobre `gold` | 1,8:1 | **Reprova** |
| `gold` sobre branco (texto, borda, checkbox) | 1,8:1 | **Reprova** |

Marinho é praticamente preto para o olho sob sol forte, e o âmbar tem luminância alta. Os dois extremos ficam longe um do outro, o que é justamente o que funciona em tela ruim. A única armadilha é usar o dourado **como tinta sobre claro**. Texto dourado sobre claro usa `gold-deep`. Checkbox e radio usam `accent-ink`.

#### 2. Psicologia das cores

- **Marinho** lê como confiança, contrato, banco sério. Para um documento que pede dinheiro ao cliente, é o tom certo. Não carrega o peso de "cartão black" que o roxo carregaria. Roxo seria o erro aqui: remete a Nubank, fintech e cripto, e não a obra e serviço.
- **Âmbar sólido** lê como ação, energia e ofício. Funciona.
- **Dourado em gradiente** é o problema real. O ícone atual tem gradiente de laranja a ouro com a dobra de papel sombreada. Em 2026 isso lê como "logo gerada por IA / template de marketplace". Em 32px vira uma mancha laranja, e na tela do cliente compete com a logo do prestador.

#### 3. Alternativas radicais avaliadas

- **Slate + Emerald:** moderno, mas o verde colide com o botão do WhatsApp (`zap`), que é a ação mais importante do produto. Descartado.
- **Zinc + Indigo:** é a cara padrão de todo SaaS feito com shadcn. Some na multidão, e o índigo vai para o roxo que queremos evitar. Descartado.
- **Amber + Dark Charcoal:** é quase o que já temos. O marinho é melhor que o charcoal porque tem temperatura e não parece tema escuro genérico.

Conclusão: a alternativa mais forte é a paleta atual com execução mais limpa.

#### Paleta definitiva

Sem mudança de hex nos tokens. Fonte da verdade: `src/app/globals.css`.

| Papel | Token | Hex |
| --- | --- | --- |
| Casca (topo, nav, hero) | `ink` | `#151F38` |
| Fundo de trabalho | `paper` / `card` | `#F5F7FA` / `#FFFFFF` |
| Ação primária | `gold` (texto `ink`) | `#FFB020` |
| Texto dourado sobre claro | `gold-deep` | `#8B5A09` |
| WhatsApp | `zap` (texto `ink`) | `#25D366` |

`docs/paleta.md` e `docs/marca.md` usam `ink = #151F38`, o mesmo valor de `src/app/globals.css`.

#### Regras visuais

1. **Dourado nunca é tinta sobre fundo claro.** Texto, borda fina, ícone de linha ou checkbox sobre branco/`paper` usam `gold-deep`. `gold` puro só como preenchimento (botão, chip, fundo) ou sobre `ink`. "Feche o serviço." no hero de `src/app/page.tsx` usa `text-gold-deep` sobre `bg-brand-wash`.
2. **Botão dourado sempre com texto `ink`.** Nunca branco.
3. **Um botão dourado por tela.** Se tudo é dourado, nada é ação.
4. **Checkbox e radio:** trocar `accent-[#ffb020]` por `accent-ink`.
5. **Sem gradiente, sombra ou brilho** em nenhuma superfície de marca.
6. **Na tela do cliente** (`/orcamento/[token]`, `/empresa/[slug]`) a cor dominante é neutra, para a logo do prestador mandar.

#### Conceito do logo: manter a ideia, trocar o acabamento

A ideia (balão de fala + folha de orçamento = "orçamento no WhatsApp") é boa e deve ficar. O que muda:

1. **Ícone chapado:** um único `#FFB020`, sem gradiente. A dobra do papel vira um recorte geométrico em `gold-press #E5991A` ou em negativo, não uma sombra.
2. **Linhas internas** (as duas barras de texto) em `ink` ou em negativo, com espessura suficiente para sobreviver a 16px.
3. **Wordmark** em `ink`, peso bold, sem efeito. Cedilha desenhada, conforme `docs/marca.md`.
4. **Entregar em SVG.** Hoje `OrcahMark` carrega PNG (`orcah-header2.png`), que borra em tela de alta densidade e não recolore por CSS. Com SVG, a versão sobre `ink` (wordmark `ink-text`) sai do mesmo arquivo.
5. **Teste de aceite:** o ícone precisa ser reconhecível em 16px, em preto e branco, e impresso em uma cor só. Se não passar nos três, ainda está detalhado demais.