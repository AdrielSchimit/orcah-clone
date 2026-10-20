# Plano de correções e critérios de aceite

Este documento recomenda trabalho futuro. Nenhuma correção de produto ou alteração no banco real foi aplicada pela auditoria.

## 1. Contenção do banco — P0, A01/A17

Responsável sugerido: backend/banco, com operador de produção.

Concluir #7, inventariar roles efetivas e criadores de migrations, corrigir default privileges e gate dinâmico. Separar autenticação de servidor de autorização por tenant. Confirmar destinos Preview/Production sem registrar segredos em tickets/logs.

Aceite:

- Anon/authenticated negados em SELECT/INSERT/UPDATE/DELETE de todas as tabelas privadas, incluindo futuras tabelas/sequências criadas por cada owner.
- Duas roles servidor sem superuser/BYPASSRLS completam cadastro, CRM, orçamento, PDF, suporte e billing em clone isolado.
- Preview não pode consultar/escrever produção; prova por dados canário fictícios e conexões isoladas.
- Backup restaurado com sucesso em banco separado, permissões incluídas, com RPO/RTO e responsável conhecidos.
- Inventário completo antes/depois, SQL revisado, observabilidade e janela aprovadas antes de rollout.

Rollout recomendado: ensaio em clone descartável → backup/restore verificado → pré-check read-only de drift/roles → transação de hardening → smoke de aplicação e negação anônima → observação. Só operador autorizado executa em produção.

Rollback: corrigir grants/policy específicos necessários à role servidor; se preciso, reverter versão da aplicação compatível. **Não reabrir anon/PUBLIC como recuperação padrão.** Manter snapshot anterior das ACLs para diagnóstico, sem aplicar restauração ampla cegamente.

Investigar logs disponíveis para sinais de exposição anterior. Nenhuma violação passada foi comprovada por esta auditoria.

## 2. Credenciais do cadastro — P1, A02; P2/P3 A14/A15/A21

Responsável: autenticação.

Eliminar ativação de senha pré-cadastrada por terceiro. Usar intenção verificada/definição de senha do dono e invalidar sessões anteriores por versão persistida. Unificar política de senha e validar origem/tipo do login.

Aceite: sequência atacante A→vítima B→confirmação nunca autentica A; conta já verificada permanece protegida; senhas curtas/comuns rejeitadas; cross-site/text/plain não emite cookie; troca revoga qualquer token anterior, inclusive no mesmo segundo. Preservar rate limits, anti-enumeração e expiração/uso único dos resets.

Os testes testemunhas devem ser convertidos para expectativa segura quando as correções forem feitas; mantê-los passando sobre o bug não é aceite.

## 3. Financeiro antes de novas cobranças — P1 A03/A04; P2 A07/A08/A09

Responsável: backend financeiro e produto.

Definir competência, atraso, cancelamento, reembolso e chargeback antes de codificar a máquina de estados. Criar operação persistida de checkout com claim atômico e referência rastreável; tratar timeout como resultado indeterminado até reconciliar.

Implementar inbox durável antes do ACK, deduplicação por eventId e ledger por paymentId/competência. Projetar vigência a partir de cobranças elegíveis, sem rebaixar renovação nova por evento antigo. Validar associação de empresa/customer/assinatura/valor conforme contrato.

Aceite:

- Conta vencida só recebe acesso após confirmação financeira válida; trial vigente é preservado sem falsificar quitação.
- Dois cliques/métodos concorrentes e retry pós-timeout geram uma operação remota.
- Evento antes/durante/depois do commit converge; duplicatas e qualquer ordem relevante produzem estado final correto.
- Recusa, Pix vencido e pending sem paymentId têm saída recuperável sem nova cobrança duplicada.
- Renovação, atraso, cancelamento, reembolso parcial/total e disputa têm estados e trilha auditável.
- Reconciliação periódica identifica órfãos/divergências, com alertas e procedimento de recuperação.
- Homologação posterior em sandbox isolado com credenciais próprias, nunca produção/cartão real.

PR11 deve permanecer draft até esses gates. Seus ganhos específicos podem ser preservados na correção; não confundir o helper sequencial com garantia de idempotência.

## 4. Kanban — P1 A05/A06; P2 A16

Responsável: operação/backend/frontend.

Autenticar membros no servidor/Supabase Auth; política por membership e autoria derivada da sessão. Corrigir validação de documentos e construção de DOM por contexto. Adotar concorrência otimista/merge ou gravação por entidade.

Aceite: anônimo nega leitura/escrita; localStorage forjado não concede acesso; campos de ID/largura não produzem tags/handlers; execução de payloads inofensivos em browser isolado permanece inerte; duas edições preservam alterações ou retornam conflito recuperável.

Revisar branch audit/2026-10-15-secure-workspace-auth separadamente antes de aproveitá-la. Não usar o Kanban real para testar payload ou sincronização ofensiva.

## 5. Privacidade, integridade e abuso — P2 A10/A11/A12/A13/A18

Responsáveis: backend/frontend.

- Worker: allowlist pública e migração/purga de cache antigo; logout/offline não retorna HTML/RSC privado.
- Cidade: entrada pública não altera catálogo canônico.
- Leads: limites de corpo/campos, rate/quota, antispam e paginação; excesso não grava.
- Orçamento: CAS de estado e evento transacional; concorrência não rebaixa aprovação.
- Imagens: atualizar Sharp/Next em branch própria, bloquear SVG não necessário e verificar bytes/formato real. Testar runtime Linux e regressão de OG/PDF/galeria.

Aceite baseado nos cenários identificados em cada achado. Não usar advisory de versão como substituto de trace de alcance; não alegar RCE remediado sem validar a configuração relevante.

## 6. Fotos, CI e UX — A19/A20 e PRs #8/#9/#10

#8 é a primeira integração técnica recomendada. Rebasear #7/#9/#10 e retarget/rebase #11 após #8; repetir CI na combinação atual. Corrigir lint Control mantendo regras.

Para fotos, testar Storage isolado real, galeria cheia, capa/ordem/legendas, reenvio, falhas/cleanup e reload. Inventariar legado e buscar originais/backup; comunicar quando reenvio é obrigatório.

Para Dock, obter aceite em 320/360/390/430 px, touch real, teclado, foco, leitor de tela, áudio desativado e movimento reduzido. Testar navegação e formulários com refresh/erro de rede sem perda não intencional.

Aceite: lint/typecheck/build/test verdes nos dois apps; nenhum gate visual ou Storage apresentado como concluído só porque VM passou.

## 7. Operação e documentação — P3 A22/A23

Separar liveness público barato de readiness autenticado/cacheado; deadlines de integração e limites. Atualizar README/runbooks para PostgreSQL, roles reais, políticas, deploy e rollback.

Implantar métricas de falha de upload/cleanup, eventos financeiros órfãos, fila de webhook e divergência de entitlement, sem payload privado ou segredo. Documentar retenção, backup e restore testado.

Aceite: exercício de recuperação em ambiente descartável por operador diferente do autor, com resultado registrado. Performance deve ser medida com dados sintéticos representativos/EXPLAIN e orçamento de latência acordado; nenhum benchmark foi inventado nesta auditoria.

## Gate para avançar

Conter A01, fechar P1 com regressões seguras, CI limpo, isolamento comprovado, restore ensaiado e homologação financeira/Storage isolados. Depois validar browser/mobile e autorizar avanço gradual. O relatório atual **não aprova expansão de produção**.
