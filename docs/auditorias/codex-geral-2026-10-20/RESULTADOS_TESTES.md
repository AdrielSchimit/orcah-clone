# Resultados reais dos testes

Data: 20/10/2026. Ambiente Windows/PowerShell, Node 24.18.0. Snapshots e heads em RELATORIO_COMPLETO/MATRIZ_MERGE.

## Contagem sem inflar repetições

| Grupo principal | Aprovadas | Falhas finais |
| --- | ---: | ---: |
| Suíte main | 275 | 0 |
| Suíte Control | 37 | 0 |
| Testes novos da auditoria | 78 | 0 |
| Verificações SQL em PostgreSQL real | 12 | 0 |
| Jornada HTTP real local | 25 | 0 |
| **Total de testes/assertions principais** | **427** | **0** |

As 78 se dividem em 46 financeiras, 9 de auth/cache/sessão, 8 de fronteiras públicas e 15 frontend/Kanban/Control/PRs. **BUG aprovado é defeito reproduzido, não comportamento aprovado.** Controles negativos e positivos são explicitamente nomeados.

Verificações auxiliares de extração/renderização do PDF, TypeScript, Prisma, lint, build e sintaxe JS não foram somadas como testes unitários. Dois comandos lint falharam; npm audit retornou vulnerabilidades. Isso não foi escondido na contagem de assertions.

## Aplicação principal — main dac0418

Comandos executados no checkout de auditoria:

    npm ci --ignore-scripts --no-audit --no-fund
    npx prisma generate
    npm test
    npm run typecheck
    npm run db:validate
    npm run lint
    npm run build

Generate/validate/build usaram URL fictícia/local; não houve migration real. Testes 275/275, TypeScript, Prisma validate e build passaram. Lint falhou com um erro react-hooks/set-state-in-effect em send-whatsapp-button.tsx:40 e warning STAT_FIELDS em page-stats.ts:20.

Depois de adicionar os harnesses, TypeScript foi repetido e passou. Lint isolado da pasta tests da auditoria passou. Lint completo repetido manteve somente o erro/warning preexistentes.

## Control — develop e375dca

Mesmos comandos apropriados: npm ci, test, typecheck, lint, build e db:validate. 37/37 testes, build e Prisma validate passaram.

Typecheck no checkout fresco inicialmente falhou por LayoutProps gerado ausente em src/app/layout.tsx:28. Após build gerar tipos, typecheck passou. É limitação de bootstrap do comando isolado, não foi omitida.

Lint falhou com dois erros: setState em effect de template-reviewer.tsx:697 e no-explicit-any em queries.ts:3. Não houve mudança de produto para removê-los.

## Kanban — 62f68bc

Não tem package.json/build/test runner próprio. Foram executados node --check em app.js, access.js, sync.js, ux-studio.js e ux-snapshot.js: todos exit0.

Os módulos foram exercitados em VM no harness frontend-operacao. **O Kanban real não foi aberto para testes de sincronização**, pois seu bootstrap poderia escrever nos documentos de produção.

Uma tentativa inicial de npm ci sem manifesto resolveu o prefixo npm do diretório de usuário; não constituiu teste do Kanban e não foi contada como resultado. Depois disso somente checks compatíveis com o projeto estático foram usados.

## Heads dos PRs — execuções adicionais, com testes sobrepostos

| Head | Resultado local | Outros resultados |
| --- | --- | --- |
| #8 c527b2a | 275/275 | Typecheck, lint sem erros/1 warning, build passaram |
| #7 e29abfc | SQL intacto validado, 12 assertions já contadas | CI principal falho por municípios; smoke SQL verde observado |
| #11 03d6bef | 278/278 | CI verde observado; falhas financeiras reproduzidas pelo harness |
| #10 d04a78a | 277/277 | Rota real em mocks: ownership/CAS/cleanup/galeria cheia |
| #9 ceb5dd9 | 275/275 | Dock real em mock: links/gesto/cancel/silêncio |
| #3 00f91f6 | 36/36 auth/comercial antigos | Conflito GitHub; cinco patches equivalentes já presentes em main |

Essas cinco suítes de PR totalizam 1.141 execuções adicionais, com grande sobreposição entre si e main. Não são 1.141 cenários novos. O subconjunto atual de auth 47/47 também foi executado e já está dentro dos 275 main.

As heads #7/#9/#10 apresentavam CI Linux vermelho no teste de municípios. Windows local não reproduziu essa falha; #8 traz correção específica com CI verde. Não se chamou o produto seguro apenas por CI.

Dependências idênticas de algumas heads foram reutilizadas por junction para testes. Uma tentativa inicial de build PR8 falhou por junction fora do root Turbopack: falha do harness, não do produto. Após instalação independente no PR8, o build passou. PR3 usou runner local disponível para o subconjunto antigo; não foi alegado build completo dessa branch.

## Como reproduzir os 78 testes

Executar na raiz do checkout de auditoria, com dependências instaladas:

    node --import tsx --test docs/auditorias/codex-geral-2026-10-20/tests/*.test.ts
    npx eslint docs/auditorias/codex-geral-2026-10-20/tests
    npm run typecheck

Os harnesses financeiros/frontend requerem checkouts irmãos ../pr11, ../pr10, ../pr9, ../orcah-control e ../operacao-orcah nos SHAs declarados. Não seguem refs mutáveis automaticamente. Criar os checkouts isolados correspondentes antes de reproduzir fora desta máquina.

Os loaders transpilem fonte real e permitem somente dependências explicitamente mockadas; chamadas não previstas falham. Não há envio de e-mail/Asaas/Supabase nesses 78 testes. A VM de DOM captura HTML sem executar onerror, portanto a prova de XSS é de source-to-sink, sem execução browser observada.

Log da execução final: evidencias/auditoria-78.txt. O arquivo backend-financial.raw.txt registra execução financeira anterior, com o mesmo resultado 46/46. Espaços finais dos logs de texto foram normalizados para revisão Git; conteúdo e contagens foram preservados.

## SQL local — 12 verificações

PostgreSQL portátil 17.10, cluster exclusivo de auditoria, escutando 127.0.0.1:55449. Guard do script exige exatamente a URL abaixo. Ele recria apenas orcah_audit_test e orcah_audit_rls_fixture nesse cluster; não o executar apontado a outro serviço.

    $env:ORCAH_AUDIT_LOCAL_URL='postgresql://postgres@127.0.0.1:55449/orcah_audit_test'
    node --import tsx docs/auditorias/codex-geral-2026-10-20/tests/rls-local.ts

Requer ../pr7 na head auditada. Provas: acesso anon antes, SQL PR7 e assertions CI intactos, negação anon/auth após, CRUD real das duas roles NONBYPASSRLS, reaplicação, cadeia real de migrations, migrate deploy sem pendências, nova tabela herdando grant inseguro e 23 tabelas atuais protegidas.

O primeiro bootstrap local precisou criação da role service_role ausente; isso foi corrigido somente no harness. Execução final 12/12. Log: evidencias/rls-local.txt.

## Jornada real local — 25 verificações

Rodar após rls-local em banco fresco:

    $env:ORCAH_AUDIT_LOCAL_URL='postgresql://postgres@127.0.0.1:55449/orcah_audit_test'
    node --import tsx docs/auditorias/codex-geral-2026-10-20/tests/journey-local.mts

Usa next start, build main previamente gerado, app em 127.0.0.1:3200 e Storage HTTP simulado em :3202. DATABASE_URL da aplicação é orcah_preview_app; apenas preparação/assertions locais usam postgres. Chaves do harness são fictícias, integrações reais ficam desativadas. A rede funcional é loopback.

Cadastro telefônico → sessão → empresa → trial não isento → vitrine → cliente → serviço → Sharp/upload mock → leitura e persistência da foto → lead → fila → proposta de R$200 → conversão do pedido → novo GET → PDF → wa.me preparado sem envio → página pública → visualização → aprovação → rejeição de resposta sequencial → API sem sessão negada → novo login → plano trial → mutação vencida bloqueada → SVG inofensivo declarado PNG aceito (testemunha A18).

Inicialmente o arquivo .ts precisou ser .mts por top-level await; depois a readiness usou /login em vez de caminho inexistente /entrar. Erros de setup foram corrigidos, sem tratar essas tentativas como defeito do produto. Execução final 25/25, repetida após reset do banco. O script encerra seus servidores ao terminar.

Logs/manifesto: evidencias/jornada-local.txt e jornada-local.json. Artefatos fictícios: proposta-ficticia.pdf/.txt/.png.

## PDF

Extração por pdfplumber confirmou cliente fictício, serviço e total R$200. A página foi rasterizada e inspecionada: uma página legível, sem corte/sobreposição nessa fixture. Tamanho do PDF: 53.983 bytes. Verificação adicional não somada às 427 assertions.

## Dependências

    npm audit --omit=dev --json

Main: 7 pacotes, 1 critical/6 high. Control: 7 pacotes, 7 high. Exit1 por advisories é esperado e não foi registrado como limpo. JSONs em tests/dependencies-main.json e dependencies-control.json.

Reachability e limites de Next/Sharp estão no relatório; não são 14 vulnerabilidades remotas comprovadas.

## Não executado / não comprovado

- E2E de UI/mobile/acessibilidade real, áudio/gestos em browser e screenshots de defeitos: Computer Use interrompeu por URL do navegador não determinada com confiança suficiente. Nenhum input adicional de UI foi tentado.
- Asaas real e sandbox: não acionados; cobertura financeira usa mocks para evitar cobranças.
- Supabase Storage real de teste: não houve ambiente isolado validado; usou-se HTTP mock.
- SQL de alteração, migrations, escrita/ataque REST ou dados privados em produção: não executados por restrição explícita.
- WhatsApp/e-mail/Instagram: nenhum envio real.
- Backup restore, failover, RPO/RTO, EXPLAIN com dados reais, carga e Core Web Vitals: sem ambiente/evidência autorizada suficiente.
- Isolamento efetivo Vercel Preview/Production: nomes de roles e um projeto Supabase não provam destinos de conexão.
- Todos os moldes PDF, textos longos/fotos reais e todos os formulários: amostra limitada.

Esses itens permanecem gates de aceite; não foram inventados resultados.
