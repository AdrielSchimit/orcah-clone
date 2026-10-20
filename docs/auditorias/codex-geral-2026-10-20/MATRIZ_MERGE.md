# Matriz de merge — 20/10/2026

Decisões técnicas sobre as heads abaixo. Nenhum merge/deploy de produção foi executado. MERGEABLE significa ausência de conflito detectado pelo GitHub, sem garantir correção. Draft permanece impedimento de fluxo até revisão humana.

| PR | Base / head | Decisão agora |
| --- | --- | --- |
| [#8 CI/lint](https://github.com/AdrielSchimit/orcah-clone/pull/8) | main dac0418 / c527b2a | **PODE FAZER MERGE AGORA** |
| [#7 RLS](https://github.com/AdrielSchimit/orcah-clone/pull/7) | main dac0418 / e29abfc | **PRECISA DE CORREÇÃO** |
| [#11 cobranças](https://github.com/AdrielSchimit/orcah-clone/pull/11) | branch PR8 c527b2a / 03d6bef | **PRECISA DE CORREÇÃO** |
| [#10 fotos](https://github.com/AdrielSchimit/orcah-clone/pull/10) | main dac0418 / d04a78a | **PRECISA DE CORREÇÃO** do CI e validação operacional |
| [#9 Dock](https://github.com/AdrielSchimit/orcah-clone/pull/9) | main dac0418 / ceb5dd9 | **PRECISA DE CORREÇÃO** do CI e validação visual |
| [#3 senha](https://github.com/AdrielSchimit/orcah-clone/pull/3) | develop 88f3ef5 no metadado PR / 00f91f6 | **NÃO DEVE SER INTEGRADO** no formato atual |

## #8 — CI e lint

Head c527b2a9463a036ce37babe39530949f2edb05f3. Três arquivos: import explícito .ts no script de municípios, allowImportingTsExtensions com noEmit e restauração de sessionStorage via timer cancelado no cleanup.

Revisão do diff e validação local: 275/275 testes, typecheck, lint sem erros (um warning) e build passaram. CI Build diagnostic observado verde no commit; PR não é draft e GitHub indica mergeable.

O teste Windows não reproduz a falha Linux original, mas o import explícito resolve a ambiguidade e CI verde fornece evidência nessa plataforma. Timer preserva o tratamento de erro e cancela atualização após desmontagem.

É mudança pequena e tecnicamente pronta. Main é branch de produção na integração Vercel: o responsável deve escolher janela de release. Esta decisão não aprova o estado geral de segurança nem libera aplicar SQL junto.

## #7 — hardening RLS

Head e29abfc0f47b63739beff256029faeb6bba1bd45. Draft, mergeable; CI principal observado falho no problema de municípios, smoke SQL verde.

Revisados SQL manual, fixture, assertions, workflow e runbook. Pré-condições conferem nomes esperados, roles, owner e políticas; transação revoga privilégios públicos, cria política ALL para roles servidor e habilita RLS. Não é policy por tenant.

**12/12 verificações locais SQL aprovadas**, incluindo cadeia real main, anon/auth negados, Prisma CRUD real por ambas as roles NONBYPASSRLS e reaplicação. A jornada HTTP de 25 verificações rodou com role preview sobre o schema endurecido.

Bloqueios:

- Corrigir default privileges/gate de novas tabelas: A17 foi reproduzido.
- Integrar/rebasear #8 para eliminar CI vermelho de base.
- Inventariar criadores de migrations e grants/policies novos antes de aplicar lista fixa; confirmar role efetiva em cada runtime.
- Provar isolamento de Preview/Production e restore de backup em ambiente separado.
- Revisar impacto das revogações em sequências de todo public e manter contrato de outras aplicações.

O SQL não é migration Prisma automática. Merge documental não equivale a executar hardening. Após correções, rollout humano deve manter aplicativo funcional sem reabrir acesso anônimo; não usar anon amplo como rollback.

## #11 — confirmação e repetição de cobranças

Head 03d6befdd2516e69836e8ffdb04565f1986299ac. Base explícita fix/municipios-script-tsx-resolution (PR8), não main. Draft/mergeable. Sete arquivos modificados; CI observado verde, **278/278 testes locais aprovados**.

Melhoria comprovada: remove ativação só por criar assinatura (A03) e bloqueia repetição sequencial após IDs salvos. Conta vencida permanece bloqueada enquanto cartão está pending.

As três assertions novas do helper não cobrem interleavings de HTTP/DB/provedor. O harness da auditoria reproduz em PR11 duplicidade concorrente, timeout após aceite remoto, Pix/cartão simultâneos, evento antecipado perdido, replay/ordem e recuperação negado/past_due presa. Ver A04/A07/A08/A09.

Antes de merge: claim persistido atômico, reconciliação de resultado incerto, inbox/ledger e recuperação de recusa/troca com aceites definidos. #8 precisa ser integrado primeiro; retarget/rebase e repetir checks na combinação atual. A melhoria é válida, mas não suficiente para lançamento financeiro.

## #10 — fotos legadas

Head d04a78a8f525e89678447017f67877ced91295cd. Seis arquivos; draft/mergeable. CI observado com falha herdada de municípios; Preview READY não comprova fluxo de imagem.

**277/277 testes locais aprovados.** O harness executa rota real de substituição: galeria com 12 fotos, preservação de ID/legenda/descrição/ordem; negação sem sessão/outra empresa; arquivo inválido; corrida/deleção com 409 e limpeza; erro de DB com cleanup; filtro de path local em produção e retenção em dev.

Não foi encontrado defeito novo confirmado na substituição. O código resolve reenvio e tratamento de referências; não recria pixels desaparecidos. O nome “recuperação” não pode prometer restauração sem arquivo original/backup.

Antes de merge: rebasear #8 e obter CI Linux verde; testar em Storage isolado upload real, URL persistente, substituição de foto de capa, falha de rede/cleanup e reload da galeria; confirmar mensagem de reenvio com responsável. Esse gate ficou aberto por não haver Storage de teste isolado validado.

## #9 — Liquid Dock

Head ceb5dd9cfb6e50c1b57ec9e8c501ccf8fc15971e. Cinco arquivos; draft/mergeable. CI observado com falha herdada de municípios. **275/275 testes locais aprovados.**

Harness do componente real com React/DOM mock verifica ausência de autoplay no mount, links nativos com rótulos e aria-current, navegação por gesto, pointercancel sem navegação e silêncio com som desativado.

Nenhum bug novo confirmado nesses testes. Eles não comprovam hit targets, foco, leitura de tela, layout estreito, áudio/gestos reais ou desempenho. Computer Use não conseguiu aplicar política por URL desconhecida e encerrou antes dessa validação.

Antes de merge: #8/CI verde e aceite visual em 320/360/390/430 px, teclado/leitor de tela, preferência de movimento e interação touch real. Manter draft até validação. O recurso visual tem prioridade posterior à contenção de segurança/pagamentos.

## #3 — recuperação de senha antiga

Head 00f91f6bd62d180b6ddf0a37f294251ea818b9d3. Draft; GitHub mergeable=false/conflito. Base develop do metadado PR é 88f3ef5; refs atuais de develop também foram consultados, sem supor equivalência entre SHA histórico e tip atual.

Revisão de commits por patch equivalence encontrou cinco de seis patches já representados em main. A implementação atual evoluiu política de senha, verificação e suporte. Os 36 testes antigos de auth/comercial passaram; no main os 47 testes atuais de auth também passaram, já incluídos na suíte de 275.

Não integrar a branch antiga como atalho. Examinar somente intenção residual ainda necessária, portar em branch nova baseada no destino atual e repetir fluxo completo. Não reverter evolução atual ao resolver conflitos.

Uma comparação de trees com muitas diferenças não foi tratada como prova de que o merge excluiria todos esses arquivos: diff entre pontas e patch real do PR são coisas distintas. A decisão é sobre obsolescência, sobreposição e conflito concreto.

## Sequência recomendada

1. #8 isoladamente.
2. Concluir #7 e tratar a exposição real com rollout separado.
3. Corrigir A02 e o conjunto financeiro de #11 antes de abrir cobranças.
4. #10 após CI e Storage isolado; #9 após CI e QA visual.
5. Não integrar #3 na forma atual.

Todos os estados são fotografia de 20/10; novo commit ou mudança de base invalida aprovação automática e exige rechecagem do delta.
