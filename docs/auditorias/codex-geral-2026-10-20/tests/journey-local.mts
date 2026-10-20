/* eslint-disable @typescript-eslint/no-explicit-any */
// Standalone integration harness. Uses only the disposable PostgreSQL cluster and loopback HTTP.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const database = 'postgresql://postgres@127.0.0.1:55449/orcah_audit_test';
assert.equal(process.env.ORCAH_AUDIT_LOCAL_URL, database, 'Explicit disposable database guard required');
const db = new PrismaClient({ datasourceUrl: database });
const base = 'http://127.0.0.1:3200';
const objects = new Map<string, Buffer>();
const storage = createServer(async (req, res) => {
  const url = req.url ?? '';
  if (req.method === 'POST' && url.startsWith('/storage/v1/object/')) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    objects.set(url.replace('/object/', '/object/public/'), Buffer.concat(chunks));
    res.writeHead(200, { 'Content-Type': 'application/json' }).end('{}');
  } else if (objects.has(url)) {
    res.writeHead(200, { 'Content-Type': 'image/webp' }).end(objects.get(url));
  } else res.writeHead(404).end();
});
await new Promise<void>(resolve => storage.listen(3202, '127.0.0.1', resolve));
const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: database.replace('postgres@', 'orcah_preview_app@'), DIRECT_URL: database,
  AUTH_SECRET: 'disposable-local-audit-secret-20261020-only', NEXT_PUBLIC_APP_URL: base,
  SUPABASE_URL: 'http://127.0.0.1:3202', SUPABASE_SERVICE_ROLE_KEY: 'disposable-mock-storage-only',
  ASAAS_API_KEY: '', RESEND_API_KEY: '', OPENAI_API_KEY: '', NODE_ENV: 'production' };
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3200'],
  { cwd: process.cwd(), env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
child.stdout?.on('data', data => { serverLog += data.toString(); });
child.stderr?.on('data', data => { serverLog += data.toString(); });
let cookie = '';
let passed = 0;
function check(label: string, condition: unknown) { assert.ok(condition, label); passed++; console.log(`PASS ${passed}: ${label}`); }
async function api(url: string, body?: unknown, auth = true) {
  const headers: Record<string, string> = {};
  if (auth && cookie) headers.Cookie = cookie;
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + url, { method: body === undefined ? 'GET' : 'POST', headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
  const set = response.headers.getSetCookie().find(value => value.startsWith('orcah_session='));
  if (set && auth) cookie = set.split(';')[0];
  const text = await response.text();
  let data: any; try { data = JSON.parse(text); } catch { data = text; }
  return { response, data };
}
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base + '/login')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Local production server starts');
  const state = await db.state.upsert({ where: { uf: 'ZZ' }, update: {}, create: { name: 'Estado fictício QA', uf: 'ZZ', ibgeCode: '99' } });
  const category = await db.businessCategory.upsert({ where: { slug: 'pintura-auditoria' }, update: {}, create: { name: 'Pintura fictícia QA', slug: 'pintura-auditoria' } });
  const phone = '11900000009';
  assert.equal(await db.user.count({ where: { phone } }), 0, 'Start with fresh disposable fixture');
  let r = await api('/api/auth/register', { name: 'Prestador fictício QA', phone, password: 'AuditLocal-Only-2026!' });
  check('Cadastro telefônico cria sessão e direciona onboarding', r.response.ok && r.data.next === '/onboarding' && cookie.length > 20);
  r = await api('/api/onboarding', { name: 'Empresa Fictícia Auditoria', whatsapp: phone, businessCategoryId: category.id, stateId: state.id, cityName: 'Cidade QA' });
  check('Empresa criada sob RLS com role NONBYPASSRLS', r.response.ok && r.data.ok);
  const user = await db.user.findFirstOrThrow({ where: { phone }, include: { company: { include: { subscription: true } } } });
  const company = user.company!;
  check('Novo prestador inicia em trial; não está isento por ID interno', user.id > 2 && company.subscription?.status === 'trialing');
  r = await api('/empresa/' + company.slug, undefined, false);
  check('Vitrine pública responde com nome fictício', r.response.ok && String(r.data).includes('Empresa Fictícia Auditoria'));
  r = await api('/api/clientes', { name: 'Cliente fictício QA', phone: '11900000008', stateId: state.id, cityId: company.cityId });
  check('Cliente persiste', r.response.ok && r.data.customer?.id);
  const customerId = r.data.customer.id;
  r = await api('/api/servicos', { name: 'Pintura fictícia', defaultPrice: '100', unit: 'm²', showPrice: true });
  check('Serviço persiste', r.response.ok && r.data.service?.id);
  const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#447788' } }).png().toBuffer();
  const form = new FormData(); form.set('file', new File([image], 'foto-ficticia.png', { type: 'image/png' })); form.set('title', 'Foto fictícia QA');
  r = await api('/api/empresa/fotos', form);
  check('Upload processa Sharp real e grava referência (Storage HTTP simulado)', r.response.ok && r.data.photo?.id);
  check('Objeto WebP pode ser lido após upload', (await fetch(r.data.photo.path)).ok);
  r = await api('/api/empresa/fotos'); check('Foto continua no GET após nova requisição', Array.isArray(r.data) && r.data.length === 1);
  r = await api('/api/publico/empresas/' + company.slug + '/pedir', { customerName: 'Visitante fictício', customerPhone: '11900000007', desiredService: 'Pintura', description: 'Solicitação fictícia de auditoria', stateId: state.id, cityName: 'Cidade QA' }, false);
  check('Solicitação pública aceita dados fictícios', r.response.ok);
  const lead = await db.quoteRequest.findFirstOrThrow({ where: { companyId: company.id } });
  r = await api('/api/pedidos'); check('Prestador recebe solicitação', r.response.ok && JSON.stringify(r.data).includes('Visitante fictício'));
  const payload = { customerId, serviceStateId: state.id, serviceCityId: company.cityId, items: [{ description: 'Pintura fictícia', quantity: '2', unit: 'm²', unitPrice: '100' }], paymentMethod: 'pix', paymentCondition: 'cash', notes: 'Observação fictícia', quoteRequestId: lead.id };
  r = await api('/api/orcamentos', payload);
  check('Proposta calcula R$ 200 corretamente', r.response.ok && Number(r.data.budget?.total) === 200);
  const budget = await db.budget.findFirstOrThrow({ where: { companyId: company.id } });
  check('Pedido convertido na mesma transação', (await db.quoteRequest.findUniqueOrThrow({ where: { id: lead.id } })).status === 'converted');
  r = await api('/api/orcamentos'); check('Proposta persiste após novo GET', r.response.ok && JSON.stringify(r.data).includes('200'));
  const pdf = await fetch(base + '/api/orcamentos/' + budget.id + '/pdf', { headers: { Cookie: cookie } });
  const pdfBytes = Buffer.from(await pdf.arrayBuffer());
  check('PDF real gerado com assinatura %PDF e conteúdo não vazio', pdf.ok && pdfBytes.subarray(0, 4).toString() === '%PDF' && pdfBytes.length > 1000);
  const evidence = path.join(process.cwd(), 'docs/auditorias/codex-geral-2026-10-20/evidencias'); await mkdir(evidence, { recursive: true });
  await writeFile(path.join(evidence, 'proposta-ficticia.pdf'), pdfBytes);
  r = await api('/api/orcamentos/' + budget.id + '/enviar', {});
  check('Compartilhamento prepara wa.me e marca enviado sem transmitir mensagem', r.response.ok && String(r.data.href).startsWith('https://wa.me/') && r.data.status === 'sent');
  r = await api('/orcamento/' + budget.publicToken, undefined, false); check('Cliente abre proposta pública', r.response.ok && String(r.data).includes('Cliente fictício QA'));
  r = await api('/api/publico/orcamentos/' + budget.publicToken + '/visualizar', {}, false); check('Acompanhamento registra visualização', r.response.ok);
  r = await api('/api/publico/orcamentos/' + budget.publicToken + '/responder', { action: 'approve' }, false); check('Cliente aprova proposta', r.response.ok && r.data.status === 'approved');
  r = await api('/api/publico/orcamentos/' + budget.publicToken + '/responder', { action: 'revision', message: 'Alterar escopo' }, false); check('Resposta sequencial após aprovação é recusada', r.response.status === 409);
  r = await api('/api/clientes', undefined, false); check('API privada sem sessão nega acesso', r.response.status === 401);
  cookie = '';
  r = await api('/api/auth/login', { email: phone, password: 'AuditLocal-Only-2026!' }); check('Novo login recupera sessão', r.response.ok && cookie.length > 20);
  r = await api('/api/plano/status'); check('Trial consultado sem chamar Asaas', r.response.ok && r.data.kind === 'trial');
  await db.subscription.update({ where: { companyId: company.id }, data: { status: 'past_due', endsAt: new Date('2020-01-01') } });
  r = await api('/api/orcamentos', payload); check('Plano vencido bloqueia nova proposta', r.response.status === 402 || r.response.status === 403);
  await db.subscription.update({ where: { companyId: company.id }, data: { status: 'trialing', endsAt: new Date(Date.now() + 86400000) } });
  // SVG payload is harmless. Proves parser reachability only, NOT execution of a vulnerability.
  const svg = new FormData(); svg.set('file', new File(['<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="blue"/></svg>'], 'svg-disfarcado.png', { type: 'image/png' }));
  r = await api('/api/empresa/fotos', svg); check('BUG testemunha: SVG declarado PNG alcança e passa pelo parser Sharp', r.response.ok && r.data.photo?.id);
  await writeFile(path.join(evidence, 'jornada-local.json'), JSON.stringify({ database: 'loopback:55449/orcah_audit_test', app: base, build: 'dac0418', assertions: passed, passed, failed: 0, storage: 'HTTP mock loopback:3202; Sharp real', slug: company.slug, pdfBytes: pdfBytes.length, network: 'No production services invoked', limitations: ['No physical mobile browser', 'No real Storage/SaaS integration', 'No real billing', 'API integration is not browser E2E'] }, null, 2));
  console.log(`RESULTADO: ${passed} assertions passed; 0 failed.`);
} catch (error) {
  console.error(error);
  console.error('SERVER DIAGNOSTIC (local fixtures only):', serverLog.slice(-5000));
  process.exitCode = 1;
} finally {
  child.kill(); storage.close(); await db.$disconnect();
}
