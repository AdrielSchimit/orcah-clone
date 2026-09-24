# Concorrente — Orçaki

Fonte: [orcaki.pro](https://www.orcaki.pro/) (análise em 16/09/2026).

O Orçaki é o vizinho mais óbvio: mesmo público (prestador de serviço no Brasil), mesma dor (orçamento no caderno/Excel/WhatsApp) e a mesma promessa de PDF + celular. Não copiar a cara. Copiar o que **funciona na venda**.

## O que eles são

Landing de conversão, não um ERP. Headline: *“Crie Orçamentos Profissionais em Minutos e Aumente suas Vendas em Até 40%”*.

Promessa em uma linha: PDF profissional, histórico de clientes e análise de lucro.

CTA repetido: **Começar grátis** / 7 dias sem cartão.

## Stack que dá para ver

Não é Laravel. É um front Vite empacotado, gerado no **Hostinger Horizons**, com:

- SPA (`/assets/index-*.js`)
- PWA (`manifest.json`, ícones 72–512, `display: standalone`)
- OneSignal (push)
- Stripe (pagamento)
- App em `/app`, login em `/login`, cadastro em `/cadastro`
- Dark mode só dentro de `/app/*`
- `theme-color` e fundo PWA `#FFCC00`

Isso importa: o concorrente já é **app no celular sem loja**, como o Orçah precisa ser. A diferença é a identidade (amarelo fita) e o produto (PDF + lucro, não link público + perfil).

## Pontos fortes (levar em conta)

1. **Fricção zero no trial.** 7 dias, sem cartão, “menos de 1 minuto”. O Orçah deve nascer assim.
2. **Um resultado, não um sistema.** “Primeiro orçamento em menos de 2 minutos, direto do celular. Sem treinamento.”
3. **Prova social de ofício.** Serralheiro, eletricista, pintor, encanador — cidade no depoimento. Não “empresas”.
4. **Antes / depois.** Caderno e Excel vs PDF e clientes no mesmo lugar. Linguagem de bolso, não de software.
5. **WhatsApp aparece na história de uso**, mesmo sem ser o centro da landing.
6. **PWA de verdade.** Manifest, ícones, theme-color, “adicionar à tela inicial”. Não falar de PWA: entregar.
7. **FAQ que mata objeção.** Preço, facilidade, segurança, cancelamento. Sem contrato, sem multa, usa até o fim do período pago.
8. **CTA sempre visível.** Header com *Entrar* + *Começar grátis* em botão amarelo.

## O que eles vendem de fato

Pelo site, o núcleo é:

- gerar PDF bonito
- guardar cliente
- ver lucro por serviço/mês
- enviar pelo celular

Não aparece (pelo menos na vitrine):

- página pública da empresa
- galeria de trabalhos
- link da bio
- pedido de orçamento do cliente
- aprovação / recusa / alteração no link
- rastreio de visualização

Eles competem como **gerador de PDF + mini-financeiro**. O Orçah compete como **orçamento + presença digital + conversão**.

## Preço

| Plano | Preço | Limite |
| --- | --- | --- |
| Trial | 7 dias grátis | — |
| Profissional | R$ 19,90/mês (riscado R$ 29,90) | 30 orçamentos |
| Avançado | R$ 49,90/mês | 50 orçamentos |
| Empresarial | R$ 79,90/mês | ilimitado + bônus R$ 50 |

Eles entram barato e travam volume. O Orçah, no spec, é **um plano R$ 49** com volume alto/ilimitado. Não ganha no “mais barato”. Ganha no “não me faz contar orçamento” + perfil público.

Cuidado: R$ 49 contra R$ 19,90 na mesma frase de venda perde. A landing do Orçah precisa justificar o preço com o que o Orçaki **não tem** (link com aprovação, mini-site, galeria, lead).

## Pontos fracos (espaço do Orçah)

- Amarelo `#FFCC00` puxa 99 / fita de obra. Energia de rua, pouca de proposta profissional.
- Vários planos cedo demais, com limite de orçamento — exatamente o que o spec do Orçah pediu para evitar.
- Landing genérica de builder (Horizons). Depoimentos e “+40%” / “1.200+” / “98%” soam de template.
- Foco em PDF. O cliente ainda responde no Zap, fora do sistema.
- Sem mini-site / Instagram bio, que é o diferencial escrito no produto Orçah.
- App com dark mode — pior na obra, no sol.

## O que basear no Orçah

Levar:

- Trial 7 ou 14 dias **sem cartão**
- Cadastro em menos de 1 minuto
- Primeiro orçamento em poucos minutos no celular
- Landing mobile-first, um CTA, prova social de ofício
- FAQ de risco zero
- PWA com nome curto, ícone e theme-color da paleta
- Envio pelo WhatsApp como passo 3 do onboarding

Não levar:

- Amarelo chapado como identidade
- Três planos no lançamento
- Teto de 30/50 orçamentos
- “Análise de lucro” como feature de MVP (é Fase 4 / financeiro)
- Dark mode no app do prestador

## Posicionamento contra eles

Orçaki: *PDF profissional e você sabe o lucro.*

Orçah: *Crie, envie pelo WhatsApp, o cliente abre o link e responde. E você ganha um perfil para a bio.*

Na prática, o Orçah só ganha se o fluxo **criar → link → visualizar → aprovar** for mais rápido que o PDF deles — e se o perfil público existir desde o MVP.
