# Resumo para Adriel — 20/10/2026

**O fluxo principal funciona, mas o ORÇAH ainda não está pronto para ampliar operação e cobranças.**

Passaram 427 verificações locais; nenhuma assertion falhou na execução final. Parte dos testes foi criada para comprovar bugs e passou justamente porque o bug aconteceu. O lint dos dois aplicativos falhou. Há 23 achados: **1 crítico, 5 altos, 13 médios e 4 baixos**.

## Cinco maiores riscos

1. **Banco exposto:** 21 tabelas, incluindo usuários, hashes, clientes e assinaturas, dão permissões amplas ao papel público e estão sem RLS. A contagem inclui a tabela de migrations.
2. **Cadastro de conta:** alguém pode cadastrar antes o e-mail de outra pessoa; depois da confirmação pelo dono, a senha original do terceiro continua válida.
3. **Plano liberado sem prova de pagamento:** o cartão em main ativa a assinatura ao criá-la no Asaas.
4. **Cobranças duplicadas e inconsistentes:** cliques simultâneos/timeout podem criar duas assinaturas; eventos antigos/repetidos podem bloquear pagante ou reativar acesso indevido.
5. **Kanban vulnerável:** documentos podem ser acessados/alterados sem autenticação efetiva, aceitam marcação insegura e perdem alterações concorrentes.

## PRs

| PR | Recomendação |
| --- | --- |
| #8 CI/lint | Pode fazer merge agora, tecnicamente |
| #7 RLS | Corrigir defaults futuros e concluir gates de rollout |
| #11 Asaas | Corrigir concorrência, reconciliação e recuperação |
| #10 fotos | Corrigir CI herdado e validar Storage isolado |
| #9 Dock | Corrigir CI herdado e obter aceite visual/mobile |
| #3 senha antigo | Não integrar no formato atual; conflita e sobrepõe trabalho |

O #7 foi testado com PostgreSQL real descartável e a aplicação funcionou com a role limitada. É boa base para fechar a exposição atual, mas ainda pode deixar tabelas futuras nascerem abertas. Não foi aplicado em produção.

O #10 permite reenviar foto preservando cadastro/legenda/ordem. Ele não recupera automaticamente um arquivo que desapareceu e não tem backup.

## O que fazer primeiro

Conter acesso público do banco, corrigir a falha de cadastro e estabilizar cobranças antes de abrir novos pagamentos. Proteger o Kanban e depois concluir cache/concorrência/abuso, imagens e homologação visual.

A jornada local incluiu cadastro, empresa, foto, serviço, pedido, orçamento de R$200, PDF, link de compartilhamento preparado, aprovação e bloqueio por plano vencido. Não houve envio de WhatsApp, cobrança ou e-mail real.

O navegador não pôde ser validado pelo Computer Use por falha em determinar a URL com segurança. Não há screenshots de defeitos nem aprovação de mobile/acessibilidade. O PDF fictício foi renderizado e conferido.

Leia MATRIZ_MERGE.md para os PRs e PLANO_CORRECOES.md para execução. RELATORIO_COMPLETO.md contém causas, arquivos/linhas, provas e limites. RESULTADOS_TESTES.md registra comandos e resultados.

Nenhum merge, deploy de produção ou mudança no banco real foi feito. O trabalho dos desenvolvedores foi preservado.
