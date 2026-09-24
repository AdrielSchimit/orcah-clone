### 03 - Engenharia Reversa do Concorrente e Manual de Hierarquia

**Objetivo:** Usar a visão estética do Claude Opus para analisar o layout do concorrente, apontar os erros dele e ditar o código exato da nova hierarquia visual mobile-first para o Orçah. 

### 📸 Quais Prints do Concorrente Você Deve Tirar e Mandar para o Opus:

1. **Print 1 (Visão Mobile da Criação do Orçamento):** Onde o usuário adiciona itens, muda preços e seleciona o cliente.
2. **Print 2 (O Orçamento Pronto no Celular):** A página que o cliente final do prestador de serviço abre para aprovar ou recusar o orçamento. (Esta é a página mais importante do seu SaaS!).
3. **Print 3 (Dashboard / Lista de Orçamentos):** A tela inicial onde aparecem os status ("Pendente", "Pago", "Aprovado").

### 🧠 Instruções para o Claude Opus (Modo Ask / Chat)

"Opus, estou te enviando os prints das telas do meu principal concorrente e os meus arquivos atuais de frontend. Quero que você faça uma análise cirúrgica de UI/UX focada em **Web-App Mobile-First**." 

### O que o Opus deve analisar nos prints do concorrente:

* **Problemas de Densidade:** O concorrente espreme muita informação na tela do celular? As fontes estão muito pequenas?
* **Pontos de Fricção:** Onde o usuário se perde? O botão de "Enviar" ou "Aprovar" está escondido?
* **Oportunidade de Ouro para o Orçah:** Como podemos estruturar nossos componentes Next.js + Tailwind para que o nosso fluxo pareça 10x mais limpo e profissional que o dele?

### 🛠️ Resultado Esperado (O que o Opus vai gerar):

1. Um guia detalhado de melhorias.
2. O código refatorado dos componentes principais com Tailwind CSS ultra-limpo, aplicando a nova paleta de cores definida no Passo 2 e uma hierarquia visual impecável (fundo cinza claro de app nativo, cards brancos arredondados, botões de ação gigantes e fáceis de tocar com o polegar).

---

## Análise do Opus — rodada 1 (23/09/2026)

### Validação dos prints recebidos

Concorrente analisado: app verde com "Meu site", Orçamentos, Recibos, OS, Catálogo e Gestão. **Não é o Orçaki** de `docs/concorrente-orcaki.md` (lá a marca é amarela `#FFCC00`). Falta confirmar o nome.

| Print pedido | Recebido | Situação |
| --- | --- | --- |
| 1. Criação do orçamento | `orçamento_1`, `orçamento_2`, `orçamento_3` | OK |
| 2. Orçamento pronto, visto pelo cliente | — | **Faltando.** É a tela mais importante |
| 3. Dashboard / lista com status | `dashboard`, `orçamento_dash` | Parcial: a lista está vazia, sem nenhum status visível |
| Extra | `tutorial_divulga_site_1-3`, `divulga_site_1-3` | Útil para comparar com `/painel/empresa` |

### Prints que ainda faltam

1. **A página que o cliente final abre** (link ou PDF), incluindo os botões de aprovar/recusar e a tela depois de clicar.
2. **O que acontece depois de "Salvar e visualizar":** a prévia e a tela de envio (WhatsApp, copiar link, baixar PDF).
3. **A lista de orçamentos com 3 a 5 orçamentos** em status diferentes (Em aberto, Aceito, Rejeitado, Revisão).
4. **O modal de "+ Adicionar" item** e a **seleção/cadastro de cliente**.
5. Opcional: a página "Meu site" pública e a tela "Modelos".

Sem os itens 1 e 2 não dá para julgar o ponto de fricção principal (enviar e aprovar), que é onde o Orçah quer ganhar.

### Problemas de densidade

- **Cabeçalho da empresa ocupa o topo nobre.** No dashboard e no "Novo Orçamento", logo + razão social + CNPJ + endereço ocupam cerca de 35–40% da primeira dobra. É informação que o prestador já sabe; o formulário real só começa no meio da tela.
- **Tudo tem o mesmo peso.** No dashboard, "Orçamentos" (o motivo de abrir o app) tem o mesmo tamanho e a mesma cor que "Catálogo" ou "Clientes": sete cards iguais em grade, sem número, sem status e sem nada pendente.
- **Formulário em 10 seções**, quase todas marcadas "(opcional)": Dados do orçamento, Cliente, Relatório inicial, Descrição das atividades, Imagens, **Preços (opcional!)**, Desconto, Pagamento, Contrato, Observações. Quando tudo é opcional, nada guia o usuário. Preço marcado como opcional num orçamento é um erro de modelo.
- **Texto pequeno e cinza sobre cinza-azulado** no bloco Subtotal/Desconto/Total (`orçamento_3`): o valor que importa, o total, tem o mesmo tamanho das linhas de apoio.
- **Cores demais competindo:** verde (marca), roxo (topo do Meu site, desconto, mapa), azul (Catálogo, logo de exemplo, links), vermelho (lixeira, PDF), amarelo (ícone de ajuda). Não há uma cor de ação clara.
- **Tutorial com lorem ipsum e mockup roxo** num app verde: a prévia não parece o produto. O aviso azul tem erro de texto ("Em editar na tela principal...").

### Pontos de fricção

- **Botão flutuante de chat cobre o conteúdo em todas as telas.** Em `orçamento_2` e `orçamento_3` ele fica em cima do campo de valor do desconto e do botão "+ Adicionar". Na zona do polegar direito isso gera toque errado.
- **A zona do polegar do dashboard é gasta com "Indicar" e "Assinatura"** (indicação e cobrança), e não com "Novo orçamento".
- **Não existe "Enviar" na criação.** O único CTA é "Salvar e visualizar"; enviar ao cliente é pelo menos mais um passo (precisa do print 2 para confirmar quantos).
- **Cliente está escondido e marcado como opcional**, abaixo do cabeçalho e do título. Sem cliente não há para quem enviar.
- **Jargão:** "Número serial", "Relatório inicial", "OS". O prestador pensa em "nº do orçamento" e "o que vou fazer".
- **Filtros da lista:** o chip ativo "Todos" é verde-claro sobre verde-claro (contraste muito baixo) e "Revisão" aparece cortado, sem indicar que há rolagem. O ícone ⓘ amarelo solto no topo não diz nada.
- **Empty state gasta a tela com ilustração** e não tem botão próprio; a ação fica na barra de baixo, que não é full-width.
- **Meu site:** sete campos de rede social sempre abertos, mesmo vazios, e e-mail bloqueado com link para outra tela. Muito formulário para um ganho que o usuário ainda não viu.
- **Navegação em cima** (engrenagem + hambúrguer no canto superior direito): é a área mais difícil de alcançar com uma mão.

### O que eles fazem certo (levar)

- CTA fixo na base, full-width, em todas as telas de edição.
- Seções recolhíveis com um título claro e um ícone por seção.
- Chips para formas de pagamento (toque único, sem select).
- Upload com área tracejada grande e texto "arraste ou toque".
- Item de preço como card, com total do item em destaque à direita.

### Onde o Orçah já está à frente (código atual)

- Navegação inferior com 5 destinos (`src/components/painel-nav.tsx`), em vez de hambúrguer no topo.
- Barra fixa de envio no formulário (`src/components/budget-form.tsx`, a partir da linha 1244).
- Página pública com "Aprovar orçamento" fixo na base (`src/components/public-budget-actions.tsx`, linha 158), com recusa e pedido de alteração no próprio link. Pelos prints, o concorrente não mostra nada disso; confirmar com o print 2.
- Paleta com uma cor de ação só (dourado) e status em cores próprias (`docs/02_IDENTIDADE_VISUAL.md`).

### Oportunidade de ouro — guia para o Orçah

1. **Início = trabalho pendente, não menu.** Topo com 2–3 números do mês (enviados, vistos, aprovados), depois "precisa de você" (vistos sem resposta, pedidos de alteração), depois a lista. Um único botão dourado "Novo orçamento", full-width, na zona do polegar.
2. **Criação em 3 blocos obrigatórios + 1 recolhido:** Cliente (primeiro, com busca e "+ novo" inline) → Itens (card por item, total grande) → Total e envio. Imagens, pagamento, condições e observações ficam juntos em "Mais detalhes", fechado por padrão. Sem cabeçalho de empresa no formulário.
3. **CTA final é "Enviar no WhatsApp"**, não "Salvar". Salvar é automático (rascunho). Um toque do formulário até o WhatsApp aberto com a mensagem e o link.
4. **Total sempre visível** na barra fixa, junto do botão: `R$ 1.250,00 · Enviar`. O prestador nunca rola para conferir o valor.
5. **Página do cliente:** a marca do prestador no topo, o total em fonte grande logo na primeira dobra, os itens em seguida e "Aprovar" dourado fixo na base; "Pedir alteração" e "Recusar" como ações secundárias de texto.
6. **Nada flutuante sobre o conteúdo.** Suporte vai para "Mais". A barra de baixo reserva padding para não cobrir o último campo.
7. **Lista com status em pill** (cores `ok`, `no`, `wait` da paleta), chips de filtro com contraste real e um indicador de rolagem (fade na borda).
8. **Alvos de toque de 48px no mínimo**, texto do corpo 16px (evita o zoom automático do iOS nos inputs) e total em 28px ou mais.
9. **Página pública da empresa:** mostrar só as redes preenchidas e abrir campos novos sob demanda ("+ adicionar rede"), sem tutorial de três telas.

### Próximo passo (rodada 1)

O código refatorado (resultado esperado nº 2) fica para depois dos prints 1 e 2 da lista acima, e só com autorização para alterar código.

---

## Análise do Opus — rodada 2 (23/09/2026)

Concorrente identificado pelo link de compartilhamento: **fazerorcamento.com** (`app.fazerorcamento.com/p/...`).

### Validação dos novos prints

| Print pedido | Recebido | Situação |
| --- | --- | --- |
| 1. Página que o cliente abre | `orçamento_pronto_1` a `_4`, `orçamento_pdf.pdf` | OK |
| 2. Tela de envio | `orçamento_finalizado_compartilhar` | OK |
| 3. Lista com status | `dashboard_orçamentos_status` | OK com 1 orçamento. Serve para ver o card; outros status seriam bônus, não bloqueiam |
| 4. Modal de item / seleção de cliente | — | Não bloqueia. Pode vir depois |

Com isso a análise está completa para seguir.

### Envio (`orçamento_finalizado_compartilhar`)

- **Bom:** WhatsApp em verde no topo, link visível, e as demais saídas (Copiar, PDF, Outros apps, Visualizar) como botões secundários full-width. É o padrão certo; vale levar.
- **Ruim:** fica atrás de dois toques ("Compartilhar" → modal) e não existe envio direto a partir do formulário. "Baixar PDF" em preto sólido compete com o WhatsApp: são duas ações primárias na mesma tela.
- **Ruim:** na barra de baixo, "Ações" tem o mesmo peso que "Compartilhar".

### Página do cliente (`orçamento_pronto_1-4`) — o ponto mais fraco deles

Leitura de cima para baixo, como o cliente final vê:

1. Faixa azul + logo + razão social + **CNPJ e endereço do prestador**.
2. Título "Montagem Roupeiro" em destaque e o código `[OR.0001]`.
3. **Os dados do próprio cliente** (telefone, e-mail, CEP), que ele já sabe. Ocupa espaço nobre.
4. Descrição, uma imagem de ~115px, sem ampliar.
5. Itens. Os dois se chamam "Montagem" e só o preço os diferencia.
6. **O total aparece só na segunda tela**, em fonte de corpo, igual às linhas dos itens.
7. Seções vazias impressas mesmo assim: "Condições de contrato: Sem indicação", "Observações: Nenhum".
8. **Não existe botão de aprovar.** A aprovação é uma assinatura desenhada no dedo ("Tocar para assinatura do cliente"), na terceira rolagem.
9. A logo repetida em tamanho gigante no rodapé, com "Conheça Nossa Empresa".

Conclusão: a página foi desenhada como **documento impresso**, não como tela de decisão. O cliente precisa rolar três telas e desenhar uma assinatura para dizer "sim". Também não há validade, prazo nem forma de pedir alteração ou recusar.

**PDF:** 2 páginas para um orçamento de R$ 180. A assinatura cai sozinha na página 2 e o total não se destaca.

### Lista (`dashboard_orçamentos_status`)

- **Bom:** card com código, data, pill de status, título, cliente, valor e contador de assinaturas `1/2`. Informação certa, bem agrupada.
- **Ruim:** o único status é "Em aberto". Não diz se o cliente **abriu** o link, que é a informação que o prestador mais quer. O chip ativo "Todos" continua com contraste quase nulo, e o botão de busca separado é um toque a mais sem necessidade.

### Comparação direta com o Orçah atual

| Ponto | fazerorcamento | Orçah hoje |
| --- | --- | --- |
| Aprovar | Assinatura no dedo, no fim da página | "Aprovar orçamento" fixo na base, um toque |
| Recusar / pedir alteração | Não existe | Existe no link |
| Saber se o cliente abriu | Não mostra | Evento "Cliente visualizou" |
| Total | Pequeno, no meio da rolagem | 28px, mas também só no fim |
| Fotos no link | Miniatura ~115px | Largura total, uma embaixo da outra |
| Fotos na criação | Na própria tela | **Só depois de salvar** (`budget-photos-form` fica em `/painel/orcamentos/[id]`) |
| Forma de pagamento | Chips (Pix, Crédito…) | **Não existe**, só texto livre em observações |
| Página da empresa no link | Logo gigante no rodapé | Link "Ver página da empresa" no topo |

O Orçah já vence no que importa: **decisão em um toque e rastreio de visualização**. Faltam três coisas que eles têm: foto na criação, forma de pagamento e envio num modal simples.

### Imagens — o que planejar

A imagem pequena deles é a oportunidade. Proposta em três camadas:

1. **Na criação:** anexar foto no próprio formulário, sem precisar salvar antes. Hoje o molde diz "Opcional — anexa depois de salvar", e isso tira foto do fluxo de quem está na obra com o celular na mão.
2. **No link do cliente:**
   - 1 foto: largura total, com toque para abrir em tela cheia.
   - 2 ou mais: grade de 2 colunas, com toque para abrir uma galeria que desliza para os lados.
   - Legenda curta opcional ("antes", "parede da sala").
   - Para ramos visuais (veículo, dano, estofado, reforma), a foto vem **antes dos itens**. O molde já tem `photos.placement: "before-items"`; hoje nenhum molde fino usa.
3. **No final — antes e depois:** quando o orçamento é aprovado e o serviço termina, o prestador anexa as fotos de "depois". Elas vão, com um toque, para a galeria da página pública (`/empresa/[slug]`). Cada orçamento aprovado vira portfólio, e o link do próximo cliente mostra trabalho real. O concorrente não tem nada parecido: ali, orçamento e "Meu site" são mundos separados.

### Moldes por ramo — análise

Estado atual (`src/lib/ramo-moldes.ts`, `docs/ramos-moldes.md`): **91 moldes finos, todos marcados como feitos**. Cada ramo define unidades, unidade padrão, 3–4 sugestões de item, campos extras (veículo, equipamento, data do evento, m², medidas, kWp, m³), rótulos e dica de foto. É um diferencial real: o concorrente usa o mesmo formulário genérico para todo mundo.

O que ajustar na implementação:

1. **O ramo só pode ser escolhido no onboarding.** Depois disso, só a conta admin troca (`admin-ramo-switcher`). Quem errou o ramo, ou mudou de atividade, fica preso ao molde errado. Falta a troca em `/painel/empresa`.
2. **Um ramo por empresa.** Muitos prestadores fazem duas coisas: pedreiro + pintor, eletricista + ar-condicionado, marido de aluguel + montador. Sugestão: um **ramo principal** (define o molde) e até 2 **ramos extras**, cujas sugestões de item entram como chips adicionais. Numa fase seguinte, um seletor discreto "Tipo de serviço" no topo do novo orçamento, só para quem tem mais de um ramo.
3. **Escolha do ramo no onboarding.** Sem busca, aparecem só 6 ramos fixos (`PREVIEW_SLUGS` em `src/app/api/ramos/route.ts`). Com 91 opções, quem não pensa em digitar acha que o seu não existe. Sugestão: 6 famílias em chips com ícone (Obra e reforma · Casa e manutenção · Técnico e conserto · Veículos · Eventos e imagem · Limpeza e jardim). Tocar numa família abre os ramos dela, e a busca continua por cima.
4. **Sugestões sem preço e poucas.** Os chips preenchem nome + unidade; 3–4 por ramo é pouco. Sugestão: 6–8 por ramo, e o preço que o prestador digitar pela primeira vez fica salvo no catálogo (`catalogSave` já existe e deve ser a regra padrão).
5. **O arquivo tem ~1.800 linhas repetidas.** Quase todo molde é `simple({ extraTitle, showAddress, showValidity: false, itemPhotoHint: true })`. Com famílias (`obra`, `tecnico`, `veiculo`, `evento`, `area`) e só as diferenças por ramo, cai para cerca de um terço e fica mais fácil manter. É refatoração interna; não muda nada para o usuário.

### Sugestões de orçamento por ramo (novas)

O que o molde pode passar a definir, além do que já define:

| Recurso | Para quais ramos | Por quê |
| --- | --- | --- |
| **Condições prontas em chips** (toque para incluir) | Todos, com texto por família | Substitui o "Sem indicação" do concorrente por frases reais |
| — Obra e reforma | "Material por conta do cliente", "50% de entrada e 50% na entrega", "Limpeza final inclusa" | É a negociação que o pedreiro faz no Zap |
| — Técnico e conserto | "Garantia de 90 dias no serviço", "Peça com garantia do fabricante", "Diagnóstico abatido se aprovar" | 90 dias é o prazo do CDC para serviço durável; passa segurança |
| — Veículos | "Peças originais / paralelas", "Prazo sujeito à chegada da peça" | Evita discussão depois |
| — Eventos e imagem | "Reserva da data com sinal", "Entrega das fotos em X dias" | O sinal é o que fecha a data |
| **Formas de pagamento em chips** | Todos | Pix, Dinheiro, Cartão, Parcelado, Entrada + restante. Aparece no link como linha curta |
| **Foto antes dos itens** | Mecânico, funileiro, pintor automotivo, borracharia, higienização, tapeceiro, demolição, assistência técnica | Nesses ramos, a foto é a justificativa do preço |
| **Validade padrão por ramo** | Obra: 15 dias · Técnico: 7 dias · Eventos: até a data | Hoje `showValidity: false` na maioria dos moldes; o cliente não sente urgência |
| **Aceite com assinatura (opcional)** | Construtora, empreiteira, equipe de obra, eventos, móveis planejados | Serviço alto e contrato. Para os demais, um toque em "Aprovar" basta; é aí que o Orçah ganha do concorrente |
| **Mensagem de WhatsApp por ramo** | Todos | "Oi Fulano, segue o orçamento da montagem do guarda-roupa" é melhor que uma mensagem genérica |

### Guia atualizado — página do cliente (a mais importante)

Ordem proposta para `src/app/orcamento/[token]/page.tsx`, de cima para baixo:

1. Marca do prestador (logo + nome + ramo), compacta. Sem CNPJ no topo (vai para o rodapé do documento).
2. **Título do serviço + total grande**, na primeira dobra. Validade logo abaixo ("Válido até 30/09").
3. Fotos (antes ou depois dos itens, conforme o ramo), com toque para ampliar.
4. Itens.
5. Pagamento e condições, **só se preenchidos**.
6. Barra fixa na base: **total à esquerda + "Aprovar" dourado à direita**. "Pedir alteração" e "Recusar" ficam como ações de texto logo acima do rodapé.
7. Rodapé: CNPJ/endereço do prestador, "Ver página da empresa", "Baixar PDF", "Feito com Orçah".

Os dados do cliente saem da área nobre (ele sabe quem é). O nome aparece uma vez, na saudação: "Orçamento para Cesar".

### Próximo passo (rodada 2)

Análise concluída; nenhum print bloqueia mais. Quando houver autorização para alterar código, a ordem sugerida, da maior vantagem para a menor:

1. Página do cliente: total no topo e na barra fixa, fotos com ampliação, seções vazias ocultas.
2. Foto no formulário de criação (sem salvar antes).
3. Formas de pagamento + condições em chips, vindas do molde.
4. Envio: modal com WhatsApp primário e o resto secundário, direto do formulário.
5. Troca de ramo em `/painel/empresa` e escolha por famílias no onboarding.
6. Ramos extras e o antes/depois indo para a página pública (fase seguinte). Arquivos que serão tocados, conforme `docs/01_MAPEAMENTO_AGENT.md`: `src/app/painel/page.tsx`, `src/components/budget-form.tsx`, `src/app/orcamento/[token]/page.tsx`, `src/components/public-budget-actions.tsx` e `src/components/status-pill.tsx`.