/** Disposable localhost-only migration rehearsal. Never reads deployment DB variables. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

async function runPrisma(args: string[], databaseUrl: string) {
  const child = spawn(process.execPath, [join(process.cwd(), "node_modules/prisma/build/index.js"), ...args], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl }, windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout?.on("data", chunk => { output += chunk.toString(); });
  child.stderr?.on("data", chunk => { output += chunk.toString(); });
  const code = await new Promise<number | null>((resolve, reject) => { child.once("error", reject); child.once("exit", resolve); });
  if (code !== 0) throw new Error(`Local Prisma ${args[0]} ${args[1] || ""} failed (exit ${code}); details withheld to avoid credential logs.`);
  console.log(`PASS: local Prisma ${args[0]} ${args[1] || ""}`);
  return output;
}

async function main() {
  const databaseUrl = process.env.SUPPORT_TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error("SUPPORT_TEST_DATABASE_URL is required.");
  const url = new URL(databaseUrl);
  assert.equal(url.protocol, "postgresql:"); assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.port, "55439"); assert.equal(url.pathname, "/orcah_support_test"); assert.equal(url.search, ""); assert.equal(url.hash, "");
  const adminUrl = new URL(url); adminUrl.pathname = "/postgres";
  const admin = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } });
  try {
    await admin.$executeRawUnsafe('DROP DATABASE IF EXISTS orcah_support_test WITH (FORCE)');
    await admin.$executeRawUnsafe('CREATE DATABASE orcah_support_test');
    for (const role of ["anon", "authenticated", "support_qa_public", "support_qa_owner", "support_qa_nonowner"]) {
      await admin.$executeRawUnsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN CREATE ROLE ${role} NOLOGIN NOSUPERUSER NOBYPASSRLS; END IF; END $$`);
      await admin.$executeRawUnsafe(`ALTER ROLE ${role} NOLOGIN NOSUPERUSER NOBYPASSRLS`);
    }
  } finally { await admin.$disconnect(); }
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    // Rehearse platform-style default grants before the migration must revoke them.
    await db.$executeRawUnsafe('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO PUBLIC, anon, authenticated');
    await db.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO anon, authenticated, support_qa_public, support_qa_owner, support_qa_nonowner');
  } finally { await db.$disconnect(); }
  await runPrisma(["migrate", "deploy"], databaseUrl);
  const second = await runPrisma(["migrate", "deploy"], databaseUrl);
  assert.match(second, /No pending migrations/i);
  await runPrisma(["validate"], databaseUrl);
  const diff = await runPrisma(["migrate", "diff", "--from-url", databaseUrl, "--to-schema-datamodel", "prisma/schema.prisma", "--script"], databaseUrl);
  const statements = diff.split(/\r?\n/).filter(line => /^(?:ALTER|CREATE|DROP|INSERT|UPDATE|DELETE)\s/.test(line));
  const existingIndexes = new Set(["budgets_customer_id_idx", "budgets_service_state_id_idx", "customers_state_id_idx", "quote_requests_state_id_idx"]);
  assert.ok(statements.every(statement => { const match = statement.match(/^DROP INDEX "([^"]+)";$/); return match && existingIndexes.has(match[1]); }), "Unexpected schema drift");
  console.log(`PASS: support schema has no Prisma drift; ${statements.length} pre-existing baseline-only extra indexes retained without applying diff SQL`);
  console.log("PASS: full migration chain and no-op rerun on disposable loopback PostgreSQL only");
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Local migration rehearsal failed"); process.exitCode = 1; });
