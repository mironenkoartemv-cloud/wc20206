import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.CHEXX_DB_FILE
  ? path.resolve(process.cwd(), process.env.CHEXX_DB_FILE)
  : path.resolve(__dirname, "../data/db.json");

export async function loadDb() {
  try {
    return normalizeDb(JSON.parse(await fs.readFile(DATA_FILE, "utf8")));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const fresh = normalizeDb({});
    await saveDb(fresh);
    return fresh;
  }
}

export async function saveDb(db) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(normalizeDb(db), null, 2), "utf8");
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
