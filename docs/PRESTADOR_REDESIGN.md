# Redesign da página pública — 09/10/2026

Implementado a partir do registro `AVALIACAO_PAGINA_PRESTADOR.md`.

- Capa, logo e identidade integradas em um card, com sobreposição para leitura e topo compacto.
- Conteúdo em superfícies claras, independentemente da preferência de tema do dispositivo.
- Navegação por âncoras para trabalhos (quando disponíveis), serviços, contato e orçamento.
- Galeria colocada antes dos serviços quando existem fotos.
- Cards com bordas, cantos e espaçamento consistentes com home/editor.
- Contato e formulário lado a lado no desktop; empilhados em telas menores.
- Rótulos visíveis, campos obrigatórios identificados e formulário em uma coluna no celular.
- Logo com object-contain para preservar a marca; fallback de capa com contraste baseado no tema do ramo.

Verificação: TypeScript e ESLint passaram. Os 35 testes existentes de página, serviços e métricas passaram. Navegador conferido em 390px e 1440px, sem overflow horizontal; pedido pelo card continua preenchendo Pintura Interna. Nenhum pedido foi enviado nem dados da empresa modificados. A galeria não pôde ser exercitada com a Pintada, que não possui fotos cadastradas.

Capturas em `docs/prestador-redesign/`: mobile-topo, mobile-formulario, desktop-topo e desktop-completa.
