import assert from "node:assert/strict";
import { PrismaClient, type Prisma } from "@prisma/client";
import { supportInbox } from "../src/lib/support/service";

const tables = ["support_threads", "support_messages"] as const;
const roles = ["support_qa_public", "anon", "authenticated"] as const;
const privileges = ["SELECT", "INSERT", "UPDATE", "DELETE"] as const;
const rollback = new Error("qa_rollback");

function pgCode(error: unknown) {
  return (error as { meta?: { code?: string } })?.meta?.code;
}
async function quietTransaction<T>(db: PrismaClient, operation: (tx: Prisma.TransactionClient) => Promise<T>) {
  return db.$transaction(async tx => {
    // Expected negative probes must not persist SQL payloads or failing-row details in PG logs.
    await tx.$executeRawUnsafe("SET LOCAL log_min_error_statement = 'panic'");
    await tx.$executeRawUnsafe("SET LOCAL log_error_verbosity = 'terse'");
    await tx.$executeRawUnsafe("SET LOCAL log_parameter_max_length_on_error = 0");
    return operation(tx);
  });
}
async function rolledBack(db: PrismaClient, role: string, operation: (tx: Prisma.TransactionClient) => Promise<unknown>) {
  try {
    await quietTransaction(db, async tx => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
      await operation(tx);
      throw rollback;
    });
    assert.fail("Expected rollback");
  } catch (error) { if (error !== rollback) throw error; }
}

export async function verifySupportDatabase(db: PrismaClient, fixtureThreadId: string, databaseUrl: string, queryPrefix: string) {
  const url = new URL(databaseUrl);
  assert.equal(url.protocol, "postgresql:"); assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.port, "55439"); assert.equal(url.pathname, "/orcah_support_test"); assert.equal(url.search, ""); assert.equal(url.hash, "");
  const protectedTables = await db.$queryRaw<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }[]>`
    SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname IN ('support_threads', 'support_messages')`;
  assert.equal(protectedTables.length, 2); assert.ok(protectedTables.every(t => t.relrowsecurity && !t.relforcerowsecurity));
  const identity = await db.$queryRaw<{ role: string }[]>`SELECT current_user::text AS role`;
  const originalOwner = identity[0].role;
  assert.match(originalOwner, /^[a-zA-Z_][a-zA-Z0-9_]*$/);
  const thread = await db.supportThread.findUniqueOrThrow({ where: { id: fixtureThreadId } });
  let deniedOperations = 0;
  for (const role of roles) for (const table of tables) for (const privilege of privileges) {
    const rows = await db.$queryRaw<{ allowed: boolean }[]>`SELECT has_table_privilege(${role}, ${table}, ${privilege}) AS allowed`;
    assert.equal(rows[0].allowed, false, `${role}/${table}/${privilege} unexpectedly granted`);
    const statement = privilege === "SELECT" ? `SELECT * FROM ${table} LIMIT 1`
      : privilege === "DELETE" ? `DELETE FROM ${table} WHERE id = $1`
      : privilege === "UPDATE" ? `UPDATE ${table} SET ${table === "support_threads" ? "priority = 'HIGH'" : "read_at = CURRENT_TIMESTAMP"} WHERE id = $1`
      : table === "support_threads" ? "INSERT INTO support_threads (id, company_id, user_id, updated_at) VALUES ('qa_forbidden', $1, $2, CURRENT_TIMESTAMP)"
      : "INSERT INTO support_messages (id, thread_id, sender_type, content) VALUES ('qa_forbidden', $1, 'USER', 'QA')";
    const params = privilege === "SELECT" ? [] : privilege === "INSERT" && table === "support_threads" ? [thread.companyId, thread.userId] : [fixtureThreadId];
    await assert.rejects(quietTransaction(db, async tx => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
      return privilege === "SELECT" ? tx.$queryRawUnsafe(statement, ...params) : tx.$executeRawUnsafe(statement, ...params);
    }), error => pgCode(error) === "42501");
    deniedOperations++;
  }
  console.log(`PASS: effective PUBLIC/anon/authenticated grants denied; ${deniedOperations} real CRUD attempts denied; RLS active`);

  // Prove an actual non-superuser table owner can use the private support tables.
  for (const table of tables) await db.$executeRawUnsafe(`ALTER TABLE ${table} OWNER TO support_qa_owner`);
  try {
    await rolledBack(db, "support_qa_owner", async tx => {
      const rows = await tx.$queryRaw<{ count: bigint }[]>`SELECT count(*) AS count FROM support_threads`;
      assert.ok(rows[0].count > BigInt(0));
      assert.equal(await tx.$executeRaw`UPDATE support_threads SET priority = 'HIGH' WHERE id = ${fixtureThreadId}`, 1);
      assert.equal(await tx.$executeRaw`DELETE FROM support_threads WHERE id = ${fixtureThreadId}`, 1);
      await tx.$executeRaw`INSERT INTO support_threads (id, company_id, user_id, status, queued_at, updated_at) VALUES (${fixtureThreadId}, ${thread.companyId}, ${thread.userId}, 'QUEUED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      await tx.$executeRaw`INSERT INTO support_messages (id, thread_id, sender_type, content) VALUES ('qa_owner', ${fixtureThreadId}, 'USER', 'QA')`;
      assert.equal(await tx.$executeRaw`UPDATE support_messages SET read_at = CURRENT_TIMESTAMP WHERE id = 'qa_owner'`, 1);
      assert.equal(await tx.$executeRaw`DELETE FROM support_messages WHERE id = 'qa_owner'`, 1);
    });
    for (const table of tables) await db.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${table} TO support_qa_nonowner`);
    const nonownerProperties = await db.$queryRaw<{ rolsuper: boolean; rolbypassrls: boolean }[]>`SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname IN ('support_qa_nonowner', 'support_qa_owner')`;
    assert.equal(nonownerProperties.length, 2);
    assert.ok(nonownerProperties.every(r => !r.rolsuper && !r.rolbypassrls));
    await rolledBack(db, "support_qa_nonowner", async tx => {
      for (const table of tables) {
        const rows = await tx.$queryRawUnsafe<{ count: bigint }[]>(`SELECT count(*) AS count FROM ${table}`);
        assert.equal(rows[0].count, BigInt(0));
        assert.equal(await tx.$executeRawUnsafe(`DELETE FROM ${table}`), 0);
        assert.equal(await tx.$executeRawUnsafe(`UPDATE ${table} SET ${table === "support_threads" ? "priority = 'HIGH'" : "read_at = CURRENT_TIMESTAMP"}`), 0);
      }
    });
    await assert.rejects(quietTransaction(db, async tx => {
      await tx.$executeRawUnsafe('SET LOCAL ROLE support_qa_nonowner');
      return tx.$executeRaw`INSERT INTO support_messages (id, thread_id, sender_type, content) VALUES ('qa_nonowner', ${fixtureThreadId}, 'USER', 'QA')`;
    }), error => pgCode(error) === "42501");
    await assert.rejects(quietTransaction(db, async tx => {
      await tx.$executeRawUnsafe('SET LOCAL ROLE support_qa_nonowner');
      return tx.$executeRaw`INSERT INTO support_threads (id, company_id, user_id, updated_at) VALUES ('qa_nonowner_thread', ${thread.companyId}, ${thread.userId}, CURRENT_TIMESTAMP)`;
    }), error => pgCode(error) === "42501");
    console.log("PASS: non-superuser table owner CRUD allowed; nonowner with explicit CRUD grants sees zero rows and INSERT denied by RLS");
  } finally {
    for (const table of tables) {
      await db.$executeRawUnsafe(`REVOKE ALL ON TABLE ${table} FROM support_qa_nonowner`);
      await db.$executeRawUnsafe(`ALTER TABLE ${table} OWNER TO ${originalOwner}`);
    }
  }
  for (const data of [
    { status: "HUMAN", assignedOperatorId: null, assignedOperator: null },
    { status: "HUMAN", assignedOperatorId: "1", assignedOperator: null },
    { status: "BOT", assignedOperatorId: "1", assignedOperator: "Adriel" },
    { status: "QUEUED", assignedOperatorId: null, assignedOperator: "Adriel" },
  ] as const) {
    await assert.rejects(quietTransaction(db, tx => tx.$executeRaw`UPDATE support_threads SET status = ${data.status}::"SupportStatus", assigned_operator_id = ${data.assignedOperatorId}, assigned_operator = ${data.assignedOperator} WHERE id = ${fixtureThreadId}`), error => pgCode(error) === "23514");
  }
  await assert.rejects(quietTransaction(db, tx => tx.$executeRaw`INSERT INTO support_messages (id, thread_id, sender_type, content) VALUES ('qa_too_large', ${fixtureThreadId}, 'USER', ${"x".repeat(2001)})`), error => pgCode(error) === "23514");
  console.log("PASS: persisted HUMAN/assignment pair and message length CHECK constraints reject invalid SQL state");

  const cycleCheck = "CHECK ((status = 'BOT' AND queued_at IS NULL AND human_started_at IS NULL AND resolved_at IS NULL) OR (status = 'QUEUED' AND queued_at IS NOT NULL AND human_started_at IS NULL AND resolved_at IS NULL) OR (status = 'HUMAN' AND queued_at IS NOT NULL AND human_started_at IS NOT NULL AND resolved_at IS NULL) OR (status = 'RESOLVED' AND queued_at IS NOT NULL AND human_started_at IS NOT NULL AND resolved_at IS NOT NULL))";
  const installedCycle = await db.$queryRaw<{ count: bigint }[]>`SELECT count(*) AS count FROM pg_constraint WHERE conrelid = 'support_threads'::regclass AND conname = 'support_threads_cycle_check'`;
  const invalidCycles = [
    "status = 'BOT', assigned_operator_id = NULL, assigned_operator = NULL, queued_at = CURRENT_TIMESTAMP, human_started_at = NULL, resolved_at = NULL",
    "status = 'QUEUED', assigned_operator_id = NULL, assigned_operator = NULL, queued_at = NULL, human_started_at = NULL, resolved_at = NULL",
    "status = 'QUEUED', assigned_operator_id = NULL, assigned_operator = NULL, queued_at = CURRENT_TIMESTAMP, human_started_at = CURRENT_TIMESTAMP, resolved_at = NULL",
    "status = 'HUMAN', assigned_operator_id = '1', assigned_operator = 'Adriel', queued_at = CURRENT_TIMESTAMP, human_started_at = NULL, resolved_at = NULL",
    "status = 'HUMAN', assigned_operator_id = '1', assigned_operator = 'Adriel', queued_at = CURRENT_TIMESTAMP, human_started_at = CURRENT_TIMESTAMP, resolved_at = CURRENT_TIMESTAMP",
    "status = 'RESOLVED', assigned_operator_id = NULL, assigned_operator = NULL, queued_at = CURRENT_TIMESTAMP, human_started_at = CURRENT_TIMESTAMP, resolved_at = NULL",
  ];
  for (const state of invalidCycles) {
    await assert.rejects(quietTransaction(db, async tx => {
      // Rehearse a pending additive CHECK without changing already-applied local migrations.
      if (installedCycle[0].count === BigInt(0)) await tx.$executeRawUnsafe(`ALTER TABLE support_threads ADD CONSTRAINT support_threads_cycle_check ${cycleCheck}`);
      return tx.$executeRawUnsafe(`UPDATE support_threads SET ${state} WHERE id = $1`, fixtureThreadId);
    }), error => pgCode(error) === "23514");
  }
  console.log(`PASS: 6 impossible cycle timestamp states rejected (${installedCycle[0].count === BigInt(0) ? "pending CHECK rehearsed with transactional rollback" : "installed CHECK"})`);

  const foreignKeys = await db.$queryRaw<{ conname: string; confdeltype: string }[]>`SELECT conname, confdeltype::text FROM pg_constraint WHERE conrelid IN ('support_threads'::regclass, 'support_messages'::regclass) AND contype = 'f'`;
  assert.equal(foreignKeys.length, 3); assert.ok(foreignKeys.every(fk => fk.confdeltype === "c"));
  for (const entity of ["company", "user"] as const) {
    try {
      await quietTransaction(db, async tx => {
        if (entity === "company") await tx.company.delete({ where: { id: thread.companyId } });
        else await tx.user.delete({ where: { id: thread.userId } });
        assert.equal(await tx.supportThread.count({ where: { id: fixtureThreadId } }), 0);
        assert.equal(await tx.supportMessage.count({ where: { threadId: fixtureThreadId } }), 0);
        if (entity === "company") assert.equal(await tx.user.count({ where: { id: thread.userId } }), 1);
        else assert.equal(await tx.company.count({ where: { id: thread.companyId } }), 0);
        throw rollback;
      });
    } catch (error) { if (error !== rollback) throw error; }
  }
  console.log("PASS: all 3 support FKs are ON DELETE CASCADE; independent Company/User deletes leave no orphan thread/messages (rolled back)");

  const observed = new PrismaClient({ datasources: { db: { url: databaseUrl } }, log: [{ emit: "event", level: "query" }] });
  let count = 0;
  observed.$on("query", () => { count++; });
  try {
    count = 0; const single = await supportInbox(observed, { kind: "operator", id: "1", name: "Adriel" }, "QUEUED", `${queryPrefix}only-one`); const oneQueries = count;
    assert.equal(single.rows.length, 1);
    count = 0; const sixty = await supportInbox(observed, { kind: "operator", id: "1", name: "Adriel" }, "QUEUED", queryPrefix); const sixtyQueries = count;
    assert.equal(sixty.rows.length, 60); assert.equal(sixty.nextOffset, 60); assert.equal(sixtyQueries, oneQueries);
    console.log(`PASS: actual supportInbox SQL query count: 1 item=${oneQueries}; 60 items=${sixtyQueries}; no per-item SQL growth`);
  } finally { await observed.$disconnect(); }
  await db.$executeRawUnsafe('ANALYZE support_threads'); await db.$executeRawUnsafe('ANALYZE support_messages');
  const indexes = await db.$queryRaw<{ indexname: string }[]>`SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('support_threads', 'support_messages')`;
  assert.ok(indexes.some(i => i.indexname === "support_messages_thread_id_created_at_id_idx"));
  assert.ok(indexes.some(i => i.indexname === "support_threads_status_priority_queued_at_idx"));
  const history = await db.$queryRawUnsafe<{ "QUERY PLAN": { Plan: Plan }[] }[]>("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id FROM support_messages WHERE thread_id = $1 ORDER BY created_at DESC, id DESC LIMIT 101", fixtureThreadId);
  const queued = await db.$queryRawUnsafe<{ "QUERY PLAN": { Plan: Plan }[] }[]>("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id FROM support_threads WHERE status = 'QUEUED' ORDER BY priority DESC, queued_at ASC, id ASC LIMIT 61");
  console.log(`PASS: EXPLAIN ANALYZE actual history path=${planPath(history[0]["QUERY PLAN"][0].Plan)}; queue path=${planPath(queued[0]["QUERY PLAN"][0].Plan)}; declared supporting indexes exist`);
}

type Plan = { "Node Type": string; "Index Name"?: string; Plans?: Plan[] };
function planPath(plan: Plan): string {
  return `${plan["Node Type"]}${plan["Index Name"] ? `(${plan["Index Name"]})` : ""}${plan.Plans?.length ? ` -> ${plan.Plans.map(planPath).join(" + ")}` : ""}`;
}
