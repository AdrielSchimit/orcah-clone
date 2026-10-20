# ORÇAH 1.0 — Gate de cobrança Asaas (20/10/2026)

## Correção isolada; NÃO aprovada para produção

O endpoint de cartão ativava a conta após POST /subscriptions. A documentação
Asaas esclarece que criar a assinatura NÃO confirma pagamento. Nesta branch,
o endpoint apenas registra a assinatura e retorna pending=true. O acesso
permanece no estado anterior até a confirmação real por webhook. A UI indica
pagamento em análise e tenta evitar cliques repetidos. As rotas Pix/cartão
não expõem erros crus do provedor.

Referências:
- https://docs.asaas.com/docs/criando-uma-assinatura
- https://docs.asaas.com/docs/eventos-de-webhooks

## Bloqueios de lançamento (continuam pendentes)

1. Implementar retentativa/troca de cartão após pagamento negado. Atualmente
   a proteção conservadora contra duplicação também impede nova cobrança
   enquanto existe uma assinatura Asaas não cancelada.
2. Webhooks: persistir event.id com unicidade em banco, confirmação após commit,
   processamento seguro de concorrência e retentativa automática.
3. Reconciliação por cobrança e competência para evitar que eventos repetidos
   estendam endsAt ou eventos antigos rebaixem assinaturas já renovadas.
4. Tratar corrida em que webhook chega antes da persistência do ID da assinatura.
5. Serializar POST /cartao e /pix por empresa contra requisições concorrentes;
   evitar duplicação após timeout do Asaas.
6. Testar Sandbox em ambiente isolado. Vercel tem SUPABASE_URL,
   SUPABASE_SERVICE_ROLE_KEY e ASAAS_API_KEY no escopo Preview/Production,
   sem prova de isolamento das instâncias.
7. Testar cartão aprovado, recusado, pendente, reenvio, Pix, renovação, estorno,
   downgrade, rollback e ausência de dados bancários nos logs.

Não executar nesta branch sobre dados de clientes reais. Nenhuma migration.
