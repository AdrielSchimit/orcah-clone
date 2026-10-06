# Capas placeholder por ramo

O placeholder aparece somente quando `Company.coverPath` está vazio, na página
`/empresa/[slug]` e no perfil desktop/mobile da busca. Upload, seleção de capa,
histórico e estilos das imagens personalizadas continuam no fluxo existente.
Galeria e logo não são tratados como capa personalizada pelo perfil da busca.

## Adicionar um ramo

1. Em `src/lib/service-cover-themes.ts`, adicione uma entrada em
   `serviceCoverThemes` com a chave igual ao slug de `BusinessCategory`
   (catálogo: `prisma/data/ramos.ts`). Copie a paleta comum para manter a identidade.
2. Configure quatro `icons` na ordem: superior direito, canto superior direito
   cortado, inferior direito, canto inferior esquerdo cortado. Reutilize os desenhos
   de `serviceCoverIcons`; novos objetos são arrays de caminhos SVG `d` em 100 × 100.
3. Configure `pattern` com poucos caminhos decorativos no canvas 1500 × 500,
   preferencialmente nas bordas e após x=1000. Não coloque texto ou logotipo.

Nenhuma alteração no renderer, banco, API ou página é necessária para novos temas.
O campo público `coverCategory` transporta o slug do ramo (ou nome personalizado).
Nomes/slugs são normalizados com trim, caixa baixa e remoção de acentos; o match é
exato para evitar aplicar Pintor a Pintor automotivo. Categorias não configuradas
usam `generic`. Não adicionar aliases amplos por substring.

## Composição e integração

`ServiceCoverPlaceholder` monta um SVG inline, decorativo e não interativo, sem
IDs globais, downloads, animações ou dependências novas. A composição é fixa e
determinística, com fundo off-white, `currentColor`, traços finos e baixa opacidade.
As classes Tailwind existentes mantêm 3:1 em qualquer largura e escalam os desenhos sem distorção.
A área esquerda/central fica livre; os desenhos se concentram à direita e nos
cantos. O mesmo componente pode ser usado sob um overlay externo.

As superfícies atuais não aplicam overlay escuro sobre a capa. A página pública
mantém seu brilho dourado e a cor configurada na região de informações abaixo.
Não foi introduzido um overlay novo nem alterada a posição das informações.
O fundo do SVG permanece off-white também em tema escuro.

Validação: `npm run typecheck`, `npm test` e ESLint dos arquivos alterados.
Os testes cobrem resolução/fallback e a prioridade da capa personalizada sobre
o SVG, incluindo prestadores que têm logo e fotos mas nenhuma capa.

## Revisão visual do catálogo

Execute `npx tsx scripts/preview-service-covers.tsx` para gerar uma galeria local
em `artifacts/service-cover-catalog/index.html`, cinco pranchas de ícones ampliados
(`icons-*.png`) e sete pranchas com as capas (`covers-*.png`). O gerador usa os
desenhos e o componente reais. A galeria HTML escala as capas em 3:1 conforme a
largura da janela; não é uma nova rota pública nem exige acesso ao banco.
Um diretório de saída alternativo pode ser passado como primeiro argumento.

Foram revisados os 225 ícones e as composições dos 83 ramos. O acabamento corrigiu
88 desenhos compartilhados: círculos e rodas incompletos, peças desconectadas,
degraus deslocados, contornos pouco reconhecíveis e cantos excessivamente duros.
As formas técnicas que precisam de linhas retas foram mantidas.
O teste de rasterização verifica todos os ícones em um canvas com margem externa
para detectar cortes acidentais, além de validar o mapeamento por nome/slug e a
renderização SVG dos 83 ramos. Os cortes decorativos feitos pela composição da
capa são intencionais e independentes dessa verificação do desenho individual.
