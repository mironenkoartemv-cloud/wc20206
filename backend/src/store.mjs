import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.CHEXX_DB_FILE
  ? path.resolve(process.cwd(), process.env.CHEXX_DB_FILE)
  : path.resolve(__dirname, "../data/db.json");
const DATABASE_URL = process.env.DATABASE_URL || "";
const STATE_ID = "wc2026";

let pool = null;
let postgresReady = false;

export async function loadDb() {
  if (DATABASE_URL) return loadDbFromPostgres();
  return loadDbFromFile();
}

export async function saveDb(db) {
  if (DATABASE_URL) {
    await saveDbToPostgres(db);
    return;
  }
  await saveDbToFile(db);
}

async function loadDbFromFile() {
  try {
    return normalizeDb(JSON.parse(await fs.readFile(DATA_FILE, "utf8")));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const fresh = normalizeDb({});
    await saveDbToFile(fresh);
    return fresh;
  }
}

async function saveDbToFile(db) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(normalizeDb(db), null, 2), "utf8");
}

async function loadDbFromPostgres() {
  await ensurePostgres();
  const result = await getPool().query("select data from app_state where id = $1", [STATE_ID]);
  if (result.rows[0]?.data) return normalizeDb(result.rows[0].data);

  const fresh = await loadInitialPostgresState();
  await saveDbToPostgres(fresh);
  return fresh;
}

async function saveDbToPostgres(db) {
  await ensurePostgres();
  await getPool().query(
    `
      insert into app_state (id, data, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (id)
      do update set data = excluded.data, updated_at = now()
    `,
    [STATE_ID, JSON.stringify(normalizeDb(db))],
  );
}

async function ensurePostgres() {
  if (postgresReady) return;
  await getPool().query(`
    create table if not exists app_state (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  postgresReady = true;
}

function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: shouldUseSsl() ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

function shouldUseSsl() {
  if (process.env.PGSSLMODE === "disable") return false;
  if (process.env.PGSSLMODE === "require") return true;
  return /render\.com|amazonaws\.com|neon\.tech|supabase\.co/i.test(DATABASE_URL);
}

async function loadInitialPostgresState() {
  try {
    return await loadDbFromFile();
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("Could not seed Postgres from file DB.", error);
    return normalizeDb({});
  }
}

function normalizeDb(db) {
  return {
    players: Array.isArray(db.players) ? db.players : [],
    predictions: Array.isArray(db.predictions) ? db.predictions : [],
    actualResults: db.actualResults || {
      source: "not-connected",
      updatedAt: null,
      groups: {},
      thirdGroups: [],
      thirdPlaces: [],
      picks: {},
    },
  };
}
