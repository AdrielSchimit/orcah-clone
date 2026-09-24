# Ramos do cadastro

Este arquivo é a **lista-base** do ramo de atuação no cadastro da empresa. Quando formos popular `business_categories` e ligar moldes, usamos daqui. Não inventar ramo solto no código.

Motor de orçamento: **um só**. O que muda por ramo é texto interno, rótulo de caixa, unidade sugerida, catálogo inicial e alguns detalhes (foto, cômodo, etapa). Ver [modelos-categorias.md](./modelos-categorias.md).

No cadastro o campo se chama **Ramo**. Ao clicar aparece uma **prévia**; **Outro** fica sempre por último. Se a pessoa escolher Outro, pode **usar o nome que digitou** como ramo.

Exemplo de prévia: encanador, construtora, marceneiro. Digitou um apelido da lista → aparece o nome formal. Acentos e maiúsculas não importam. A coluna **Busca também** de cada ramo é o dicionário dessa busca. Não duplicar ramo por causa de apelido. Detalhe da tela na etapa 2 de [ordem.md](./ordem.md).

---

## Fontes

| Fonte | O que mostrava |
| --- | --- |
| [orcaki.pro](https://www.orcaki.pro/) | Soldador, serralheiro, eletricista, encanador, pintor, gesseiro, azulejista, marceneiro (faixa “feito para prestadores” + depoimentos) |
| [prummo.app](https://prummo.app/pt-BR) | Encanador, eletricista, pintor, construtor, serralheiro, marceneiro, climatização, jardineiro, segurança eletrônica, móveis planejados |
| [GetNinjas — reformas](https://www.getninjas.com.br/categoria/reformas-e-reparos/sc) | Pedreiro, eletricista, encanador, pintor, marceneiro, montador de móveis, impermeabilizador, energia solar, marido de aluguel, marmoraria, drywall, etc. |
| [Constru Match](https://construmatch.com.br/) | Pedreiro, mestre de obras, engenheiro civil, gesseiro, montagem de móveis, limpeza pós-obra |
| Spec Orçah | Lista original em [produto.md](./produto.md) |

Critério para entrar: o profissional **manda orçamento** (lista + valor + prazo) pelo WhatsApp. Não entra manicure, consulta médica, delivery.

Nome na tela = o que a pessoa fala no Brasil. Alias (ex.: hidráulico) entra na busca, não como ramo duplicado.

---

## Como ler a tabela

| Coluna | Significado |
| --- | --- |
| Nome | Texto do cadastro |
| Slug | `business_categories.slug` |
| Molde | Família em `modelos-categorias.md`. Sem molde fino ainda → família + catálogo depois |
| Busca também | Palavras que o select deve achar |

---

## 1. Obra e estrutura — molde `equipe-obra` ou `construtora`

| Nome | Slug | Molde | Busca também |
| --- | --- | --- | --- |
| Pedreiro | `pedreiro` | `equipe-obra` | alvenaria, obra, reforma |
| Equipe de obra | `equipe-obra` | `equipe-obra` | pedreiro, reforma |
| Mestre de obras | `mestre-de-obras` | `equipe-obra` | encarregado, fiscal de obra |
| Construtora | `construtora` | `construtora` | construtor, construção |
| Empreiteira | `empreiteira` | `construtora` | empreiteiro |
| Demolição | `demolicao` | `equipe-obra` | demolidora, quebra |
| Concretagem | `concretagem` | `equipe-obra` | concreto, laje |
| Terraplanagem | `terraplanagem` | `construtora` | terraplenagem, terra |
| Pavimentação | `pavimentacao` | `equipe-obra` | asfalto, calçada, bloco |
| Telhadista | `telhadista` | `equipe-obra` | telhado, cobertura, telha |
| Carpinteiro | `carpinteiro` | `peca-sob-medida` | madeira, forma, telhado de madeira |
| Calceteiro | `calceteiro` | `equipe-obra` | pedra, bloco intertravado |

---

## 2. Instalações — molde `equipe-obra` ou `oficina-tecnico`

| Nome | Slug | Molde | Busca também |
| --- | --- | --- | --- |
| Eletricista | `eletricista` | `equipe-obra` | elétrica, quadro, tomada |
| Encanador / hidráulico | `encanador` | `equipe-obra` | hidraulico, hidraulica, hidráulico, hidráulica, bombeiro hidráulico, cano, vazamento |
| Gesseiro | `gesseiro` | `equipe-obra` | gesso, drywall, forro, sanca |
| Instalador | `instalador` | `equipe-obra` | instalação em geral |
| Técnico de ar-condicionado | `ar-condicionado` | `oficina-tecnico` | climatização, split, AC, refrigeração |
| Gás | `gas` | `equipe-obra` | gás encanado, fogão, aquecedor a gás |
| Energia solar | `energia-solar` | `oficina-tecnico` | painel solar, fotovoltaico, aquecedor solar |
| Automação residencial | `automacao` | `oficina-tecnico` | casa inteligente, automação |
| Segurança eletrônica | `seguranca-eletronica` | `oficina-tecnico` | CFTV, câmera, alarme, cerca elétrica, interfone |
| Portão automático | `portao-automatico` | `oficina-tecnico` | motor de portão, basculante |
| Antenista | `antenista` | `oficina-tecnico` | antena, TV digital, parabólica |
| Redes e internet | `redes` | `oficina-tecnico` | cabeamento, Wi-Fi, rack |
| Irrigação | `irrigacao` | `equipe-obra` | aspersor, gotejo |

---

## 3. Acabamento e revestimento — molde `revestimento` ou `acabamento-visual`

| Nome | Slug | Molde | Busca também |
| --- | --- | --- | --- |
| Pintor | `pintor` | `acabamento-visual` | pintura, tinta, textura |
| Azulejista | `azulejista` | `revestimento` | porcelanato, cerâmica, pastilha, piso |
| Impermeabilizador | `impermeabilizador` | `revestimento` | infiltração, manta, impermeabilização |
| Aplicador de textura | `textura` | `acabamento-visual` | grafiato, textura, chapisco |
| Papel de parede | `papel-de-parede` | `acabamento-visual` | adesivo, revestimento de parede |
| Piso laminado / vinílico | `piso-laminado` | `revestimento` | vinílico, laminado, carpete |
| Polimento de pisos | `polimento-pisos` | `revestimento` | restauração de piso, brilho |
| Isolamento térmico e acústico | `isolamento` | `equipe-obra` | lã de vidro, acústica |
| Decorador | `decorador` | `acabamento-visual` | decoração, ambientação |

---

## 4. Madeira, metal, vidro, pedra — molde `peca-sob-medida`

| Nome | Slug | Molde | Busca também |
| --- | --- | --- | --- |
| Marceneiro | `marceneiro` | `peca-sob-medida` | marcenaria, madeira, armário |
| Montador de móveis | `montador-de-moveis` | `peca-sob-medida` | montagem, planejado, IKEA |
| Móveis planejados | `moveis-planejados` | `peca-sob-medida` | cozinha planejada, closet |
| Serralheiro | `serralheiro` | `peca-sob-medida` | grade, portão, estrutura metálica |
| Soldador | `soldador` | `peca-sob-medida` | solda, MIG, TIG |
| Vidraceiro | `vidraceiro` | `peca-sob-medida` | box, espelho, temperado, sacada |
| Esquadrias | `esquadrias` | `peca-sob-medida` | janela, alumínio, PVC |
| Marmorista | `marmorista` | `peca-sob-medida` | mármore, granito, quartzo, pia |
| Tapeceiro | `tapeceiro` | `peca-sob-medida` | estofado, sofá, tecido |
| Toldos e coberturas | `toldos` | `peca-sob-medida` | toldo, policarbonato, cobertura |
| Redes de proteção | `redes-protecao` | `peca-sob-medida` | tela, janela, sacada |

---

## 5. Oficinas e técnicos — molde `oficina-tecnico`

| Nome | Slug | Molde | Busca também |
| --- | --- | --- | --- |
| Técnico de informática | `informatica` | `oficina-tecnico` | computador, notebook, TI, formatação |
| Assistência técnica | `assistencia-tecnica` | `oficina-tecnico` | conserto, aparelho |
| Técnico de celular | `celular` | `oficina-tecnico` | smartphone, tela, iPhone |
| Técnico de eletrodomésticos | `eletrodomesticos` | `oficina-tecnico` | máquina, geladeira, fogão |
| Mecânico | `mecanico` | `oficina-tecnico` | carro, oficina, revisão |
| Funileiro | `funileiro` | `oficina-tecnico` | lataria, martelinho, funilaria |
| Borracharia | `borracharia` | `oficina-tecnico` | pneu, balanceamento, alinhamento |
| Pintor automotivo | `pintor-automotivo` | `oficina-tecnico` | pintura de carro |
| Chaveiro | `chaveiro` | `oficina-tecnico` | fechadura, chave, tetra |
| Refrigeração | `refrigeracao` | `oficina-tecnico` | câmara fria, freezer comercial |

---

## 6. Casa, quintal e manutenção — molde `recorrente` ou `equipe-obra`

| Nome | Slug | Molde | Busca também |
| --- | --- | --- | --- |
| Jardineiro | `jardineiro` | `recorrente` | jardim, poda, grama |
| Paisagista | `paisagista` | `projeto` | paisagismo, jardim projetado |
| Limpeza | `limpeza` | `recorrente` | faxina, limpeza comercial |
| Diarista | `diarista` | `recorrente` | faxineira, diária |
| Limpeza pós-obra | `limpeza-pos-obra` | `recorrente` | finalização de obra |
| Higienização de estofados | `higienizacao` | `recorrente` | sofá, colchão, lavagem |
| Dedetizador | `dedetizador` | `recorrente` | pragas, descupinização |
| Desentupidor | `desentupidor` | `oficina-tecnico` | entupimento, coluna |
| Marido de aluguel | `marido-de-aluguel` | `equipe-obra` | pequenos reparos, faz-tudo |
| Mudanças | `mudancas` | `base` | carreto, frete, transporte |
| Piscineiro | `piscineiro` | `recorrente` | piscina, tratamento |
| Poço artesiano | `poco-artesiano` | `construtora` | poço, água |
| Fossa e esgoto | `fossa` | `equipe-obra` | fossa séptica, sumidouro |
| Manutenção predial | `manutencao-predial` | `equipe-obra` | condomínio, predial |
| Manutenção geral | `manutencao` | `equipe-obra` | manutenção |

---

## 7. Projeto e criativo — molde `projeto`

| Nome | Slug | Molde | Busca também |
| --- | --- | --- | --- |
| Arquiteto | `arquiteto` | `projeto` | arquitetura, planta |
| Engenheiro civil | `engenheiro-civil` | `projeto` | engenharia, cálculo, ART |
| Designer de interiores | `interiores` | `projeto` | interiores, ambientação |
| Designer | `designer` | `projeto` | design gráfico, identidade |
| Fotógrafo | `fotografo` | `projeto` | ensaio, evento, foto |
| Videomaker | `videomaker` | `projeto` | vídeo, filmagem |
| Social media | `social-media` | `projeto` | Instagram, conteúdo |
| Agência | `agencia` | `projeto` | publicidade, marketing |
| Topógrafo | `topografo` | `projeto` | topografia, medição |

---

## 8. Sem família específica — molde `base`

| Nome | Slug | Molde | Busca também |
| --- | --- | --- | --- |
| Eventos | `eventos` | `base` | buffet, festa, cerimonial |
| Som e palco | `sonorizacao` | `base` | sonorização, DJ |
| Personal organizer | `personal-organizer` | `base` | organização, mudança |
| Outro | `outro` | `base` | demais, não listado |

---

## Lista plana (cadastro)

Ordem sugerida no select: **alfabética**, com **Outro** sempre por último. Campo de busca por nome e alias.

1. Agência  
2. Antenista  
3. Aplicador de textura  
4. Arquiteto  
5. Assistência técnica  
6. Automação residencial  
7. Azulejista  
8. Borracharia  
9. Calceteiro  
10. Carpinteiro  
10. Chaveiro  
11. Concretagem  
12. Construtora  
13. Decorador  
14. Dedetizador  
15. Demolição  
16. Desentupidor  
17. Designer  
18. Designer de interiores  
19. Diarista  
20. Eletricista  
21. Empreiteira  
22. Encanador / hidráulico  
23. Energia solar  
24. Engenheiro civil  
25. Equipe de obra  
26. Esquadrias  
27. Eventos  
28. Fossa e esgoto  
29. Fotógrafo  
30. Funileiro  
31. Gás  
32. Gesseiro  
33. Higienização de estofados  
34. Impermeabilizador  
35. Instalador  
36. Irrigação  
37. Jardineiro  
38. Limpeza  
39. Limpeza pós-obra  
40. Manutenção geral  
41. Manutenção predial  
42. Marceneiro  
43. Marido de aluguel  
44. Marmorista  
45. Mecânico  
46. Mestre de obras  
47. Montador de móveis  
48. Móveis planejados  
49. Mudanças  
50. Paisagista  
51. Papel de parede  
52. Pavimentação  
53. Pedreiro  
54. Pintor  
55. Pintor automotivo  
56. Piscineiro  
57. Piso laminado / vinílico  
58. Poço artesiano  
59. Polimento de pisos  
60. Portão automático  
61. Redes de proteção  
62. Redes e internet  
63. Refrigeração  
64. Segurança eletrônica  
65. Serralheiro  
66. Social media  
67. Soldador  
68. Som e palco  
69. Tapeceiro  
70. Técnico de ar-condicionado  
71. Técnico de celular  
72. Técnico de eletrodomésticos  
73. Técnico de informática  
74. Telhadista  
75. Terraplanagem  
76. Toldos e coberturas  
77. Topógrafo  
78. Vidraceiro  
79. Videomaker  
80. Isolamento térmico e acústico  
81. Personal organizer  
82. **Outro**

São **82 ramos** no seed. Cabe num select com busca. Não precisa mostrar todos de uma vez no onboarding: começar com os mais comuns no topo da busca (eletricista, encanador, pintor, pedreiro, marceneiro, montador de móveis) e o resto aparece digitando.

---

## Ramos que o Orçaki cita (não perder)

Do [orcaki.pro](https://www.orcaki.pro/): soldador, serralheiro, eletricista, encanador, pintor, gesseiro, azulejista, marceneiro.

Todos estão na lista. No Orçah entram ainda os que eles não destacam e que orçam o tempo todo: **hidráulico** (junto do encanador), **montador de móveis**, construtora, pedreiro, informática, ar-condicionado, marido de aluguel, impermeabilizador, energia solar.

---

## O que não entra (de propósito)

Manicure, cabeleireiro, clínica, restaurante, loja de produto, motorista de app. Não é o “orçamento de serviço” do produto. Se um dia pedir, cai em **Outro** + molde `base`.

Não duplicar: “hidráulico” não é ramo separado de encanador; “climatização” não é separado de técnico de ar-condicionado; “drywall” não é separado de gesseiro.

---

## Uso daqui pra frente

1. Seed de `business_categories` copia **nome + slug + molde** desta tabela.  
2. Cadastro mostra o **nome**, busca também os aliases.  
3. Orçamento usa o **molde** da família; textos e caixas do ramo entram depois, um a um, sem fork do motor.  
4. Ramo novo só nasce neste MD, depois vai pro seed.
