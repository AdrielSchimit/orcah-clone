/** Destructive ONLY to two named disposable databases in the audit-owned loopback cluster. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const ROOT = process.cwd();
const PR7 = resolve(ROOT, "../pr7");
const BASE = "postgresql://postgres@127.0.0.1:55449/";
const roles = ["anon", "authenticated", "service_role", "orcah_production_app", "orcah_preview_app"];
let assertions = 0;
const pass = (label: string) => { assertions++; console.log(`PASS ${assertions}: ${label}`); };
const code = (error: unknown) => (error as { meta?: { code?: string } }).meta?.code;
async function cli(args: string[], databaseUrl: string) {
  const child = spawn(process.execPath, [join(ROOT, "node_modules/prisma/build/index.js"), ...args], {
    cwd: ROOT, windowsHide: true, env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl }, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout?.on("data", d => { output += d.toString(); }); child.stderr?.on("data", d => { output += d.toString(); });
  const exit = await new Promise<number | null>((ok, fail) => { child.once("error", fail); child.once("exit", ok); });
  assert.equal(exit, 0, `Local Prisma ${args[0]} failed; output withheld`);
  return output;
}
async function sqlFile(url: string, file: string) { await cli(["db", "execute", "--url", url, "--file", file], url); }
async function asRole(db: PrismaClient, role: string, query: string) {
  assert.ok(roles.includes(role));
  return db.$transaction(async tx => { await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`); return tx.$queryRawUnsafe(query); });
}
async function main() {
  const input = process.env.ORCAH_AUDIT_LOCAL_URL;
  assert.equal(input, `${BASE}orcah_audit_test`, "Only the explicitly audit-owned loopback URL is allowed");
  const admin = new PrismaClient({ datasources: { db: { url: `${BASE}postgres` } } });
  const temp = await mkdtemp(join(tmpdir(), "orcah-audit-sql-"));
  try {
    for (const role of roles) await admin.$executeRawUnsafe(`DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='${role}') THEN CREATE ROLE ${role} LOGIN NOSUPERUSER NOBYPASSRLS; END IF; END $$`);
    for (const name of ["orcah_audit_test", "orcah_audit_rls_fixture"]) {
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await admin.$executeRawUnsafe(`CREATE DATABASE ${name}`);
    }
  } finally { await admin.$disconnect(); }
  const fixtureUrl = `${BASE}orcah_audit_rls_fixture`;
  const fixture = new PrismaClient({ datasources: { db: { url: fixtureUrl } } });
  try {
    const source = await readFile(join(PR7, "docs/security/test-fixtures/bootstrap.sql"), "utf8");
    const adapted = source.split(/\r?\n/).filter(line => !/^CREATE ROLE /.test(line)).join("\n");
    const fixtureFile = join(temp, "bootstrap-with-existing-local-roles.sql"); await writeFile(fixtureFile, adapted);
    await sqlFile(fixtureUrl, fixtureFile);
    await fixture.$executeRawUnsafe("INSERT INTO public.users(id) VALUES(1)");
    assert.deepEqual(await asRole(fixture, "anon", "SELECT id FROM public.users"), [{ id: BigInt(1) }]);
    pass("Synthetic pre-hardening anon read reaches fake user row");
    const hardening = join(PR7, "docs/security/manual/2026-10-15-hardening-public-prisma.sql");
    await sqlFile(fixtureUrl, hardening);
    await sqlFile(fixtureUrl, join(PR7, "docs/security/test-fixtures/assert-hardening.sql"));
    pass("Unchanged PR7 SQL and CI assertions execute on PostgreSQL17 synthetic schema");
    for (const role of ["anon", "authenticated"]) await assert.rejects(asRole(fixture, role, "SELECT id FROM public.users"), e => code(e) === "42501");
    pass("anon/authenticated actual reads denied after hardening");
    for (const role of ["orcah_production_app", "orcah_preview_app"]) {
      assert.deepEqual(await asRole(fixture, role, "SELECT id FROM public.users"), [{ id: BigInt(1) }]);
      await fixture.$transaction(async tx => { await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`); await tx.$executeRawUnsafe("INSERT INTO public.users(id) VALUES(2)"); assert.equal(await tx.$executeRawUnsafe("UPDATE public.users SET id=3 WHERE id=2"),1); assert.equal(await tx.$executeRawUnsafe("DELETE FROM public.users WHERE id=3"),1); });
    }
    pass("Both non-BYPASSRLS server roles perform real SELECT/INSERT/UPDATE/DELETE");
    await sqlFile(fixtureUrl, hardening); pass("PR7 SQL rerun preserves policy and remains executable");
  } finally { await fixture.$disconnect(); }

  const db = new PrismaClient({ datasources: { db: { url: input } } });
  try {
    await db.$executeRawUnsafe("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated");
    await db.$executeRawUnsafe("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated");
    await cli(["migrate", "deploy"], input);
    pass("Full current main migration chain applies on a fresh disposable PostgreSQL17 database");
    await db.$executeRawUnsafe("GRANT USAGE ON SCHEMA public TO anon, authenticated, orcah_production_app, orcah_preview_app");
    await db.$executeRawUnsafe("GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO orcah_production_app,orcah_preview_app");
    await db.$executeRawUnsafe("GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO orcah_production_app,orcah_preview_app");
    const user = await db.user.create({ data: { name: "Audit fake account", phone: "11900000000", passwordHash: "fictitious-test-hash" } });
    assert.equal((await asRole(db,"anon","SELECT id FROM users") as unknown[]).length,1); pass("Main real schema reproduces anonymous access using only a fake account");
    await sqlFile(input, join(PR7,"docs/security/manual/2026-10-15-hardening-public-prisma.sql"));
    for (const role of ["anon","authenticated"]) for (const operation of ["SELECT * FROM users","INSERT INTO users(name,password_hash,updated_at) VALUES('fake','fake',CURRENT_TIMESTAMP)","UPDATE users SET name='fake'","DELETE FROM users"]) {
      await assert.rejects(asRole(db,role,operation), e=>code(e)==="42501");
    }
    pass("Eight real-schema browser-role CRUD operations denied");
    for (const role of ["orcah_production_app","orcah_preview_app"]) {
      const appDb: PrismaClient=new PrismaClient({datasources:{db:{url:input.replace("postgres@",`${role}@`)}}});
      try {
        const fake=await appDb.user.create({data:{name:"Audit server role",phone:role==="orcah_preview_app"?"11900000001":"11900000002",passwordHash:"fictitious-test-hash"}});
        assert.equal((await appDb.user.findUniqueOrThrow({where:{id:fake.id}})).name,"Audit server role");
        await appDb.user.update({where:{id:fake.id},data:{name:"Audit updated"}}); await appDb.user.delete({where:{id:fake.id}});
        assert.equal((await appDb.user.findUniqueOrThrow({where:{id:user.id}})).id,user.id);
      } finally {await appDb.$disconnect();}
    }
    pass("Actual Prisma connections for both app roles retain CRUD on real User schema");
    assert.match(await cli(["migrate","deploy"],input),/No pending migrations/i); pass("Standard migration rerun has no pending migrations");
    await db.$executeRawUnsafe("CREATE TABLE audit_future_model(id integer)");
    const future=await db.$queryRaw<{allowed:boolean;rls:boolean}[]>`SELECT has_table_privilege('anon','public.audit_future_model','SELECT') AS allowed,relrowsecurity AS rls FROM pg_class WHERE relname='audit_future_model'`;
    assert.equal(future[0].allowed,true); assert.equal(future[0].rls,false); pass("BUG witness: PR7 leaves unsafe creator default grants on a later table");
    await db.$executeRawUnsafe("DROP TABLE audit_future_model");
    const rows=await db.$queryRaw<{table_name:string;rls:boolean;anon_read:boolean}[]>`SELECT relname AS table_name,relrowsecurity AS rls,has_table_privilege('anon',c.oid,'SELECT') AS anon_read FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY relname`;
    assert.ok(rows.every(r=>r.rls&&!r.anon_read)); pass(`All ${rows.length} main tables protected after hardening, including existing support tables`);
    console.log(`SUMMARY: ${assertions} audit assertions passed; no production database contacted`);
  } finally {await db.$disconnect();}
}
main().catch(error=>{console.error(`FAIL: ${error instanceof Error?error.name:"Error"}; local-only SQL audit failed; credentials and payload omitted`); if(error instanceof Error) console.error(error.stack?.split("\n").filter(line=>line.trim().startsWith("at ")).slice(0,4).join("\n")); process.exitCode=1;});
