# Modelos de orçamento por categoria

**Sim, faz sentido. É relevante.** Desde que seja **molde em cima do mesmo motor**, não um sistema diferente para cada ofício.

O cliente de um pintor precisa **ver a parede**. O de um pedreiro precisa **entender mão de obra e material**. O de uma construtora precisa **ver etapas**. O de um técnico de informática precisa **ver o problema e a solução**. Um PDF genérico de “item / qtd / valor” fecha venda em todos — mas fecha **menos**, e parece Excel.

O Orçaki vende um gerador único. O Orçah ganha se o orçamento **parecer do ofício** daquele prestador, no celular do cliente.

Este arquivo define os moldes. A implementação vem nas etapas 2 e 3 de [ordem.md](./ordem.md). Tabelas continuam as mesmas (`budgets`, `budget_items`, `budget_photos`). O que muda é o **pacote da categoria**: campos visíveis, unidades, sugestões, fotos e o texto que o cliente lê.

---

## 1. Como isso funciona (sem virar 25 produtos)

Toda categoria aponta para um **molde** (`template_key`).

```
Categoria  →  Molde  →  Orçamento
Pintor     →  acabamento-visual
Azulejista →  revestimento
Pedreiro   →  equipe-obra
Outro      →  base
```

O motor é um só:

| Sempre igual | Muda com o molde |
| --- | --- |
| Cliente, validade, total, link, WhatsApp, aprovar/recusar | Rótulos, unidades, itens sugeridos |
| Itens (descrição, qtd, valor) | Como o item é preenchido (m², hora, etapa…) |
| Fotos opcionais na tabela | Se foto é destaque, se tem antes/depois, se o subtítulo é obrigatório |
| Página pública e PDF | Ordem das seções e o que aparece primeiro |

Se a categoria não tiver molde próprio, cai no **molde base** (placeholder). O prestador nunca fica sem orçamento.

No cadastro ele escolhe o ramo. O sistema aplica o molde. Ele **pode** ligar/desligar foto, trocar unidade e apagar sugestão. O molde é atalho, não prisão.

### O que não fazer

- Não criar tabela diferente por ofício.
- Não obrigar o pedreiro a preencher “demãos de tinta”.
- Não lançar 20 moldes no MVP. Começar pelos que mais mudam a cara da proposta.

---

## 2. Famílias de molde

Ofícios parecidos compartilham a família. A categoria só troca catálogo e textos.

| Família | Molde (`template_key`) | Quem usa | O cliente precisa ver |
| --- | --- | --- | --- |
| Placeholder | `base` | Outro, ramo sem molde | Lista simples de serviços e total |
| Equipe de obra | `equipe-obra` | Pedreiro, gesseiro, encanador, eletricista, instalador, manutenção | Ambiente + mão de obra + material |
| Revestimento | `revestimento` | Azulejista | m², tipo de peça, perda, fotos da base |
| Acabamento visual | `acabamento-visual` | Pintor, decorador | Fotos com subtítulo, cor, demãos, m² |
| Esquadria / peça | `peca-sob-medida` | Marceneiro, serralheiro, vidraceiro | Medida, material, ambiente |
| Oficina / técnico | `oficina-tecnico` | Informática, ar-condicionado, mecânico, funileiro, assistência | Diagnóstico, peça, mão de obra |
| Projeto | `projeto` | Arquiteto, designer, fotógrafo, social media, agência | Pacote / fase, entregas, prazo |
| Recorrente | `recorrente` | Limpeza, diarista, jardineiro | Frequência, cômodos, pacote mensal |
| Construtora | `construtora` | Construtora, empreiteira | Etapas da obra, material x serviço, prazo |

No MVP, prioridade de molde **único e visível**:

1. `base`
2. `equipe-obra` (pedreiro)
3. `revestimento` (azulejista)
4. `acabamento-visual` (pintor)
5. `oficina-tecnico` (informática)
6. `construtora`

Os outros ramos usam a família mais próxima até ganharem catálogo próprio. Não precisa de tela nova: só JSON de configuração + sugestões.

Incluir no cadastro (hoje faltam no seed): a lista completa está em [ramos.md](./ramos.md). Azulejista, construtora, montador de móveis e encanador/hidráulico entram nela.

---

## 3. Molde base (placeholder)

Usado quando o ramo é **Outro** ou ainda não tem molde. Tem que parecer profissional, não “genérico feio”.

**Nome na tela:** Orçamento  
**Unidade padrão:** un  
**Fotos:** opcionais, no fim, com legenda livre  
**Sugestão de itens:** vazia, só “+ Adicionar item”

### Campos do orçamento

- Cliente
- Local do serviço (cidade/UF + endereço)
- Validade
- Prazo estimado (texto curto)
- Observações
- Itens: descrição, quantidade, unidade, valor
- Desconto
- Total

### Página que o cliente abre

1. Nome da empresa + cidade
2. “Orçamento #00125”
3. Lista de serviços e valores
4. Observações
5. Total
6. Aprovar / Recusar / Quero alterar

### Mensagem de WhatsApp

> Olá, {cliente}! Preparei seu orçamento #{numero} no valor de {total}.  
> Você vê os detalhes neste link: {url}

### Quando NÃO basta o base

Se o ofício vive de foto, medida ou etapa, o base empobrece a venda. Por isso os moldes abaixo existem.

---

## 4. Equipe de obra — Pedreiro

**Ramo na tela:** Pedreiro / equipe de obra  
**Molde:** `equipe-obra`  
**Por que é único:** o cliente de obra não compra “8 itens”. Ele compra **o que vai ser feito em cada cômodo**, separado em **mão de obra** e **material**, senão acha que está caro sem entender.

Linguagem no Brasil: *equipe de obra*, *mão de obra*, *material*, *cômodo*, *metragem*. Evitar “escopo”, “deliverable”, “proposta comercial”.

### O que o prestador preenche (rápido, no celular)

- Cliente
- Endereço da obra + cidade
- Cômodo ou trecho (banheiro, muro, laje, calçada…) — pode repetir
- Prazo em dias
- Validade

Cada linha do orçamento pede:

| Campo | Exemplo |
| --- | --- |
| Tipo | Mão de obra / Material / Equipamento |
| Cômodo | Banheiro social |
| Descrição | Assentar piso 60x60 |
| Unidade | m², m, un, diária, vb (verba) |
| Quantidade | 12 |
| Valor | R$ 45 |

Unidades sugeridas: **m², m, un, diária, saco, kg**.

### Catálogo inicial (sugestões, editáveis)

- Demolição (m²)
- Alvenaria (m²)
- Reboco (m²)
- Contrapiso (m²)
- Assentar piso (m²)
- Rejunte (m²)
- Muro (m)
- Laje (m²)
- Mão de obra diária
- Material (verba)
- Caçamba / entulho (un)
- Deslocamento

### Fotos

Importantes, mas **não mandatórias**. Seção “Situação atual da obra”.

Cada foto: **subtítulo obrigatório se houver foto**.

Exemplos de subtítulo:

- “Parede do banheiro onde entra o box”
- “Piso atual, a ser removido”
- “Muro dos fundos, 12 m”

### Página do cliente

1. Empresa + “Equipe de obra · {cidade}”
2. Local da obra
3. Fotos da situação atual (se existirem)
4. Serviços **agrupados por cômodo**
5. Subtotal mão de obra / subtotal material (se os tipos foram usados)
6. Total e prazo
7. Botões de resposta

Isso é o que um dono de casa entende no Zap.

### WhatsApp

> Olá, {cliente}! Separei o orçamento da obra em {endereco}.  
> 📋 #{numero} · 💰 {total} · ⏱ {prazo}  
> Fotos e serviços estão no link: {url}

### Eletricista e encanador neste molde

Mesma casca. Catálogo diferente:

- Eletricista: ponto de tomada, luminária, quadro, chuveiro, cabo (m)
- Encanador: ponto hidráulico, registro, vaso, ralo, tubo (m)

---

## 5. Azulejista — revestimento

**Ramo na tela:** Azulejista  
**Molde:** `revestimento`  
**Por que é único:** o preço vive de **metragem + peça + perda**. Sem isso o cliente compara só o valor e acha outro mais barato que não colocou a perda de 10%.

### Campos extras do orçamento (simples)

- Ambiente (banheiro, cozinha, área gourmet, fachada)
- Tipo de peça (porcelanato, azulejo, pastilha, pedra)
- Formato (60x60, 90x90, subway…)
- Metragem líquida
- **Perda sugerida:** 10% (editável) — linha automática “Perda de material”
- Assentamento incluso ou só material

### Itens típicos

- Fornecimento da peça (m²)
- Perda de material (m²)
- Mão de obra de assentamento (m²)
- Rejunte (m²)
- Impermeabilização (m²)
- Remoção do revestimento antigo (m²)
- Peça especial / recorte (un)
- Soleira / rodapé (m)

Unidade rainha: **m²**. Depois **m** e **un**.

### Fotos (quase o centro)

Seção “Base e referência”.

Cada foto com subtítulo, tipos sugeridos:

- Situação atual
- Detalhe do piso/parede
- Referência do revestimento escolhido
- Caixa / lote da peça (se o cliente já comprou)

O cliente abre o link e **vê o banheiro dele**, não uma tabela solta.

### Página do cliente

1. Ambiente e tipo de peça no topo
2. Galeria com subtítulos
3. Metragem + perda explicada em uma linha (“inclui 10% de perda”)
4. Itens
5. Total

### WhatsApp

> Olá, {cliente}! Orçamento do revestimento do {ambiente}.  
> Peça {tipo} · {m2} m² (com perda) · {total}  
> {url}

---

## 6. Pintor — acabamento visual

**Ramo na tela:** Pintor  
**Molde:** `acabamento-visual`  
**Por que é único:** a venda é visual. Foto sem subtítulo não serve. “Pintura interna — R$ 2.800” sem m², cor e demãos gera discussão depois.

### Campos que importam

- Interno / externo / ambos
- Ambiente
- Tipo (parede, teto, muro, portão, textura)
- Cor / referência (nome ou código, texto livre)
- Demãos (padrão 2)
- Massa corrida / lixamento incluso?

### Itens típicos

- Lixamento e preparação (m²)
- Massa corrida (m²)
- Fundo preparador (m²)
- Pintura parede (m²) — já considerando demãos na descrição
- Pintura teto (m²)
- Pintura muro (m²)
- Esmalte em madeira/ferro (m)
- Material de tinta (verba ou un)
- Andaime / proteção de piso

Unidades: **m², m, un**.

### Fotos (obrigatórias na experiência, não no banco)

O molde **pede** foto com subtítulo. Dá para enviar sem, mas a tela insiste: “Uma foto da parede ajuda o cliente a aprovar.”

Subtítulos sugeridos:

- “Sala, parede da TV”
- “Muro da frente, sol da tarde”
- “Infiltração no teto do quarto”
- “Cor de referência”

Na página pública, as fotos vêm **antes** da tabela. Esse é o molde que o usuário descreveu: imagens com subtítulos.

### Página do cliente

1. Fotos grandes + subtítulo
2. Resumo: interno/externo, demãos, m² total
3. Itens
4. Total
5. Observação: “Cor a confirmar no local” se não houver código

### WhatsApp

> Olá, {cliente}! Mandei o orçamento da pintura com as fotos do {ambiente}.  
> #{numero} · {total}  
> {url}

Decorador usa este molde, com catálogo de cortina, papel de parede, ambientação — fotos no mesmo lugar.

---

## 7. Construtora / empreiteira

**Ramo na tela:** Construtora  
**Molde:** `construtora`  
**Por que é único:** uma reforma de casa não é uma lista solta. É **etapa**. O cliente (e o banco, e o engenheiro) quer ver fundação → estrutura → alvenaria → instalações → acabamento.

Não é cronograma de MS Project. É o orçamento **quebrado em fases**, cada fase com serviços e um subtotal.

### Estrutura

O orçamento tem **etapas**. Cada etapa é um grupo de itens (campo `group` / `stage` no item, sem tabela nova no MVP).

Etapas sugeridas (liga/desliga):

1. Serviços preliminares
2. Fundação
3. Estrutura
4. Alvenaria
5. Cobertura
6. Instalações (elétrica / hidráulica)
7. Revestimentos
8. Esquadrias
9. Pintura
10. Limpeza e entrega

Cada item: tipo **Serviço** ou **Material**, unidade m²/m/un/vb, quantidade, valor.

Campos no cabeçalho:

- Tipo de obra (construção, reforma, ampliação)
- Área aproximada (m²)
- Prazo total (dias ou semanas)
- Observação de que material X é por conta do cliente, se for o caso

### Fotos

- Terreno / casa atual
- Referência (se houver)
- Documento / croqui (upload simples, mesma galeria, subtítulo “planta” ou “fachada”)

### Página do cliente

1. Resumo: área, prazo, total
2. Fotos
3. **Subtotal por etapa** (o pulo do gato)
4. Total geral
5. Condições (validade, prazo, o que não está incluso)

Uma linha no topo: “Valores de material podem variar conforme marca escolhida.”

### WhatsApp

> Olá, {cliente}! Orçamento da {tipoObra} em {cidade}, separado por etapas.  
> Área {m2} m² · Prazo {prazo} · Total {total}  
> {url}

Empreiteira pequena usa o mesmo molde, com menos etapas ligadas por padrão.

---

## 8. Técnico de informática

**Ramo na tela:** Técnico de informática  
**Molde:** `oficina-tecnico` (variação informática)  
**Por que é único:** quase sempre existe um **diagnóstico**. O cliente não quer m². Quer: o que está com defeito, o que vai ser feito, peça x serviço, garantia.

### Fluxo do orçamento

1. Equipamento (notebook, PC, impressora, rede, celular)
2. Relato do cliente (texto curto)
3. Diagnóstico (texto curto, pode ser o mesmo campo de observações com rótulo diferente)
4. Itens em dois tipos: **Serviço** e **Peça**
5. Prazo de reparo (horas ou dias)
6. Garantia do serviço (ex.: 90 dias) — texto no rodapé

### Itens típicos

- Diagnóstico / taxa de visita
- Formatação + backup
- Troca de tela
- Troca de bateria
- SSD / memória
- Limpeza interna
- Remoção de vírus
- Montagem de PC
- Configuração de rede
- Visita / deslocamento

Unidades: **un, hora**. Nunca m².

### Fotos

Úteis, não centrais. Subtítulos:

- “Equipamento na bancada”
- “Tela quebrada”
- “Etiqueta / modelo”

### Página do cliente

1. Equipamento + diagnóstico em destaque (caixa no topo)
2. Serviços e peças separados
3. Prazo e garantia
4. Total
5. Fotos no fim, se houver

### WhatsApp

> Olá, {cliente}! Segue o orçamento do {equipamento}.  
> Diagnóstico: {diagnosticoCurto}  
> #{numero} · {total} · prazo {prazo}  
> {url}

### O mesmo molde, outros ofícios

| Categoria | Rótulo do “equipamento” | Catálogo |
| --- | --- | --- |
| Ar-condicionado | Aparelho / BTUs | limpeza, gás, instalação, suporte |
| Mecânico | Veículo / placa | revisão, pastilha, óleo |
| Funileiro | Veículo / peça da lataria | funilaria, pintura da peça |
| Assistência técnica | Aparelho | visita, peça, mão de obra |

A página continua “diagnóstico → serviço → peça”. Só muda o vocabulário.

---

## 9. Os outros ramos (família, catálogo próprio depois)

Não precisam de spec tão longa agora. Herdam família e ganham lista sugerida.

### Peça sob medida — marceneiro, serralheiro, vidraceiro

- Ambiente + medida (largura x altura x profundidade, texto)
- Material (MDF, alumínio, vidro temperado…)
- Foto do vão / referência
- Itens em un ou m²
- Cliente vê medida no topo

### Projeto — arquiteto, designer, fotógrafo, social media, agência

- Pacotes (essencial / completo) ou fases (estudo, executivo, acompanhamento)
- Entregas em texto (“5 artes”, “visita + planta”)
- Unidade: un, h, pacote
- Foto de portfólio **no perfil**, não obrigatória no orçamento
- Página do cliente: o que está incluso / o que não está

### Recorrente — limpeza, diarista, jardineiro

- Frequência (avulsa, semanal, quinzenal, mensal)
- Cômodos ou área (m² de jardim)
- Pacote mensal vs visita única
- Página do cliente: valor da visita e valor mensal, se houver os dois

---

## 10. O que o cliente vê de diferente (resumo)

Mesmo botão **Aprovar**. Outra conversa.

| Molde | Primeira coisa na página | Tabela | Foto |
| --- | --- | --- | --- |
| Base | Lista + total | Itens simples | Opcional no fim |
| Equipe de obra | Cômodos | Mão de obra / material | Situação atual + subtítulo |
| Revestimento | Peça + m² + perda | m² | Base e referência |
| Pintor | Galeria | m² e demãos | **Antes da tabela**, com subtítulo |
| Construtora | Área e prazo | **Por etapa** | Terreno / croqui |
| Informática | Diagnóstico | Serviço / peça | Detalhe do aparelho |

---

## 11. Dados (sem explodir o schema)

Não criar `budgets_pintor`. Usar o que já existe:

| Precisa o molde | Onde vive |
| --- | --- |
| Qual molde a empresa usa | `business_categories.template_key` + a empresa pode sobrescrever depois |
| Tipo do item (mão de obra, material, peça, etapa) | `budget_items` + campo `kind` |
| Cômodo / etapa / grupo | `budget_items.group_name` |
| Unidade | já existe `unit` |
| Foto + subtítulo | `budget_photos.caption` (já existe) |
| Diagnóstico, cor, demãos, perda % | `budgets` JSON `extras` **ou** campos opcionais nulos |

No MVP: `kind`, `group_name` no item e `extras` JSON no orçamento são suficientes. A tela do molde só mostra os campos certos.

Catálogo inicial: tabela `services` já existente, **pré-populada no onboarding** conforme a categoria. O usuário edita preço.

---

## 12. Ordem para construir os moldes

Não fazer os oito no primeiro mês.

**Junto do cadastro (etapa 2)**  
Salvar a categoria. Guardar o `template_key`. Ainda pode renderizar só o base.

**Junto do orçamento (etapa 3)**  
1. Molde `base` funcionando de ponta a ponta  
2. `equipe-obra` (pedreiro)  
3. `acabamento-visual` (pintor — fotos com subtítulo)  
4. `revestimento` (azulejista)  
5. `oficina-tecnico` (informática)  
6. `construtora`

O resto herda família. Catálogo fino entra quando um ramo real pedir.

---

## 13. Textos de interface por molde (tom)

| Molde | Botão principal | Título da página pública |
| --- | --- | --- |
| Base | Novo orçamento | Orçamento |
| Equipe de obra | Nova obra / novo orçamento | Orçamento da obra |
| Revestimento | Novo revestimento | Orçamento de revestimento |
| Pintor | Nova pintura | Orçamento de pintura |
| Construtora | Novo orçamento de obra | Proposta da obra |
| Informática | Novo reparo | Orçamento do reparo |

Um jeito brasileiro, curto, sem cheiro de ERP.

---

## 14. Decisão

A ideia é boa e é diferencial — **orçamento que parece do ofício**, não um PDF único com o nome da empresa.

O Orçah continua um produto só: criar, enviar no WhatsApp, o cliente abrir e responder. O molde só muda **o que está dentro da proposta**, para o cliente do pedreiro, do azulejista, do pintor, da construtora e do técnico reconhecerem o próprio serviço.
