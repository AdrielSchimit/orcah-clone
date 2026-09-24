import mysql from "mysql2/promise";
import pg from "pg";

const { Client } = pg;

const SOURCE_DATABASE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL;
const CONFIRM = process.env.MIGRATION_CONFIRM;

if (!SOURCE_DATABASE_URL || !TARGET_DATABASE_URL) {
  throw new Error("SOURCE_DATABASE_URL e TARGET_DATABASE_URL são obrigatórias.");
}
if (CONFIRM !== "YES_COPY_ORCAH_DATA") {
  throw new Error("MIGRATION_CONFIRM inválido. Migração não autorizada.");
}

const tables = [
  "states",
  "business_categories",
  "users",
  "cities",
  "companies",
  "customers",
  "services",
  "budgets",
  "budget_items",
  "budget_versions",
  "budget_events",
  "budget_photos",
  "company_photos",
  "quote_requests",
  "subscriptions",
];

const appTables = [
  "users",
  "companies",
  "customers",
  "services",
  "budgets",
  "budget_items",
  "budget_versions",
  "budget_events",
  "budget_photos",
  "company_photos",
  "quote_requests",
  "subscriptions",
];

function quotePgIdent(value) {
  return '"' + String(value).replaceAll('"', '""') + '"';
}

function quoteMysqlIdent(value) {
  return "`" + String(value).replaceAll("`", "``") + "`";
}

async function sourceCounts(source) {
  const result = {};
  for (const table of tables) {
    const [rows] = await source.query(`SELECT COUNT(*) AS count FROM ${quoteMysqlIdent(table)}`);
    result[table] = Number(rows[0].count);
  }
  return result;
}

async function targetCounts(target) {
  const result = {};
  for (const table of tables) {
    const { rows } = await target.query(`SELECT COUNT(*)::int AS count FROM ${quotePgIdent(table)}`);
    result[table] = Number(rows[0].count);
  }
  return result;
}

async function copyTable(source, target, table) {
  const [rows] = await source.query(`SELECT * FROM ${quoteMysqlIdent(table)} ORDER BY id`);
  if (!rows.length) return 0;

  for (const row of rows) {
    const columns = Object.keys(row);
    const names = columns.map(quotePgIdent).join(", ");
    const params = columns.map((_, index) => `$${index + 1}`).join(", ");
    const values = columns.map((column) => row[column]);
    await target.query(
      `INSERT INTO ${quotePgIdent(table)} (${names}) VALUES (${params})`,
      values,
    );
  }

  return rows.length;
}

async function resetSequence(target, table) {
  await target.query(
    `SELECT setval(
       pg_get_serial_sequence($1, 'id'),
       COALESCE((SELECT MAX(id) FROM ${quotePgIdent(table)}), 1),
       EXISTS(SELECT 1 FROM ${quotePgIdent(table)})
     )`,
    [`public.${table}`],
  );
}

const source = await mysql.createConnection({
  uri: SOURCE_DATABASE_URL,
  decimalNumbers: false,
  dateStrings: false,
  supportBigNumbers: true,
});

const target = new Client({
  connectionString: TARGET_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await target.connect();

try {
  await source.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
  await source.beginTransaction();

  const beforeSource = await sourceCounts(source);
  const beforeTarget = await targetCounts(target);

  const existingAppRows = appTables.reduce((sum, table) => sum + beforeTarget[table], 0);
  if (existingAppRows > 0 && process.env.MIGRATION_ALLOW_TARGET_RESET !== "YES") {
    throw new Error(
      `Destino contém ${existingAppRows} linhas de aplicação. Defina MIGRATION_ALLOW_TARGET_RESET=YES somente após conferir o destino.`,
    );
  }

  console.log("SOURCE_COUNTS", JSON.stringify(beforeSource));
  console.log("TARGET_COUNTS_BEFORE", JSON.stringify(beforeTarget));

  await target.query("BEGIN");
  await target.query(
    `TRUNCATE TABLE ${tables.map(quotePgIdent).join(", ")} RESTART IDENTITY CASCADE`,
  );

  const copied = {};
  for (const table of tables) {
    copied[table] = await copyTable(source, target, table);
  }

  for (const table of tables) {
    await resetSequence(target, table);
  }

  await target.query("COMMIT");
  await source.commit();

  const afterTarget = await targetCounts(target);
  const mismatches = tables.filter((table) => beforeSource[table] !== afterTarget[table]);

  console.log("COPIED_COUNTS", JSON.stringify(copied));
  console.log("TARGET_COUNTS_AFTER", JSON.stringify(afterTarget));

  if (mismatches.length) {
    throw new Error(`Contagens divergentes após migração: ${mismatches.join(", ")}`);
  }

  console.log("MIGRATION_OK");
} catch (error) {
  try {
    await target.query("ROLLBACK");
  } catch {}
  try {
    await source.rollback();
  } catch {}
  throw error;
} finally {
  await source.end();
  await target.end();
}
