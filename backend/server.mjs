import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDb, saveDb } from "./src/store.mjs";
import {
  TEAM_BY_ID,
  calculateLiveScoreDetailed,
  getChampionFromPrediction,
  normalizePredictionPayload,
  normalizeWorldCupApiResults,
  toFrontendPrediction,
  validatePrediction,
} from "./src/tournament.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 8787);
const WORLD_CUP_API_BASE = process.env.WORLD_CUP_API_BASE || "https://worldcup26.ir";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const TOKEN_BYTES = 32;

const server = http.createServer(async (request, response) => {
  try {
    setCorsHeaders(response);
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await routeApi(request, response, url);
      return;
    }

    await serveStatic(response, url.pathname);
  } catch (error) {
    console.error(error);
    if (error.status === 400) {
      sendJson(response, 400, { error: "bad_request", message: "Некорректный JSON." });
      return;
    }
    sendJson(response, 500, { error: "internal_error", message: "Внутренняя ошибка сервера." });
  }
});

server.listen(PORT, () => {
  console.log(`Chexx backend is running on http://localhost:${PORT}`);
});

async function routeApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, service: "chexx-wc2026-backend" });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/players") {
    const body = await readJsonBody(request);
    const db = await loadDb();
    const displayName = normalizeDisplayName(body.displayName).slice(0, 32).trim();
    if (!displayName) {
      sendJson(response, 400, { error: "validation_error", message: "Имя игрока обязательно." });
      return;
    }
    const displayNameKey = normalizeDisplayNameKey(displayName);
    const existingPlayer = db.players.find((player) => normalizeDisplayNameKey(player.displayName) === displayNameKey);
    if (existingPlayer) {
      sendJson(response, 409, {
        error: "player_exists",
        message: "Игрок с таким именем уже зарегистрирован. Используй другое имя.",
      });
      return;
    }

    const token = createToken();
    const player = {
      id: crypto.randomUUID(),
      displayName,
      displayNameKey,
      accessTokenHash: hashToken(token),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.players.push(player);
    await saveDb(db);

    sendJson(response, 201, {
      player: publicPlayer(player),
      accessToken: token,
      prediction: null,
      canEditPrediction: true,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/me") {
    const context = await requirePlayer(request, response);
    if (!context) return;
    const prediction = context.db.predictions.find((item) => item.playerId === context.player.id) || null;
    sendJson(response, 200, {
      player: publicPlayer(context.player),
      prediction: prediction ? toFrontendPrediction(prediction, context.player) : null,
      canEditPrediction: !prediction,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/predictions/me") {
    const context = await requirePlayer(request, response);
    if (!context) return;
    const prediction = context.db.predictions.find((item) => item.playerId === context.player.id) || null;
    sendJson(response, 200, {
      prediction: prediction ? toFrontendPrediction(prediction, context.player) : null,
    });
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/predictions/me") {
    const context = await requirePlayer(request, response);
    if (!context) return;
    const existingPrediction = context.db.predictions.find((item) => item.playerId === context.player.id);
    if (existingPrediction) {
      sendJson(response, 409, {
        error: "prediction_locked",
        message: "Прогноз уже сохранен. Повторное сохранение недоступно.",
        prediction: toFrontendPrediction(existingPrediction, context.player),
      });
      return;
    }
    const body = await readJsonBody(request);
    const validation = validatePrediction(body);
    if (!validation.ok) {
      sendJson(response, 400, {
        error: "validation_error",
        message: "Прогноз не прошел серверную проверку.",
        details: validation.errors,
      });
      return;
    }

    const normalized = normalizePredictionPayload(body);
    const champion = getChampionFromPrediction(normalized);
    const now = new Date().toISOString();
    const record = {
      id: crypto.randomUUID(),
      playerId: context.player.id,
      tournamentCode: "wc2026",
      status: "submitted",
      groups: normalized.groups,
      thirdGroups: normalized.thirdGroups,
      thirdPlaces: normalized.thirdPlaces,
      picks: normalized.picks,
      championId: champion.id,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    context.db.predictions.push(record);
    await saveDb(context.db);

    sendJson(response, 200, {
      prediction: toFrontendPrediction(record, context.player),
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/leaderboard") {
    const db = await loadDb();
    sendJson(response, 200, buildLeaderboard(db));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/actual-results") {
    const db = await loadDb();
    sendJson(response, 200, { actualResults: sanitizeActualResults(db.actualResults) });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/results/refresh") {
    const db = await loadDb();
    try {
      db.actualResults = await refreshActualResults();
      await saveDb(db);
      sendJson(response, 200, {
        actualResults: sanitizeActualResults(db.actualResults),
        leaderboard: buildLeaderboard(db),
      });
    } catch (error) {
      console.warn("Results refresh failed", error);
      sendJson(response, 502, {
        error: "results_source_unavailable",
        message: "Не удалось обновить результаты турнира.",
        actualResults: sanitizeActualResults(db.actualResults),
        leaderboard: buildLeaderboard(db),
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/admin/reset") {
    if (!isAdmin(request)) {
      sendJson(response, 401, { error: "unauthorized", message: "Нужен admin token." });
      return;
    }
    const fresh = {
      players: [],
      predictions: [],
      actualResults: {
        source: "not-connected",
        updatedAt: null,
        groups: {},
        thirdGroups: [],
        thirdPlaces: [],
        picks: {},
      },
    };
    await saveDb(fresh);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/admin/results/refresh") {
    if (!isAdmin(request)) {
      sendJson(response, 401, { error: "unauthorized", message: "Нужен admin token." });
      return;
    }
    const db = await loadDb();
    const actualResults = await refreshActualResults();
    db.actualResults = actualResults;
    await saveDb(db);
    sendJson(response, 200, {
      actualResults: sanitizeActualResults(actualResults),
      leaderboard: buildLeaderboard(db),
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/admin/results/mock") {
    if (!isAdmin(request)) {
      sendJson(response, 401, { error: "unauthorized", message: "Нужен admin token." });
      return;
    }
    const body = await readJsonBody(request);
    const db = await loadDb();
    db.actualResults = {
      source: "mock",
      updatedAt: new Date().toISOString(),
      groups: body.groups || {},
      thirdGroups: body.thirdGroups || [],
      thirdPlaces: body.thirdPlaces || [],
      picks: body.picks || {},
    };
    await saveDb(db);
    sendJson(response, 200, {
      actualResults: sanitizeActualResults(db.actualResults),
      leaderboard: buildLeaderboard(db),
    });
    return;
  }

  sendJson(response, 404, { error: "not_found", message: "Endpoint не найден." });
}

async function refreshActualResults() {
  const [groupsResponse, gamesResponse] = await Promise.all([
    fetch(`${WORLD_CUP_API_BASE}/get/groups`),
    fetch(`${WORLD_CUP_API_BASE}/get/games`),
  ]);
  if (!groupsResponse.ok) throw new Error(`Groups source failed: ${groupsResponse.status}`);
  if (!gamesResponse.ok) throw new Error(`Games source failed: ${gamesResponse.status}`);
  return normalizeWorldCupApiResults(await groupsResponse.json(), await gamesResponse.json());
}

function buildLeaderboard(db) {
  const rows = db.predictions
    .filter((prediction) => prediction.status === "submitted" || prediction.status === "locked")
    .map((prediction) => {
      const player = db.players.find((item) => item.id === prediction.playerId);
      const score = calculateLiveScoreDetailed(prediction, db.actualResults);
      const champion = TEAM_BY_ID[prediction.championId] || null;
      return {
        playerId: prediction.playerId,
        displayName: player?.displayName || "Игрок",
        championTeamId: prediction.championId,
        championName: champion?.name || "не выбран",
        totalPoints: score.total,
        groupPoints: score.groups,
        thirdPlacePoints: score.thirdPlaces,
        playoffPoints: score.playoff,
        submittedAt: prediction.submittedAt,
        breakdown: score,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || new Date(a.submittedAt) - new Date(b.submittedAt))
    .map((row, index) => ({ rank: index + 1, ...row }));

  return {
    updatedAt: db.actualResults?.updatedAt || null,
    source: db.actualResults?.source || "not-connected",
    rows,
  };
}

async function requirePlayer(request, response) {
  const token = getBearerToken(request);
  if (!token) {
    sendJson(response, 401, { error: "unauthorized", message: "Нужен access token." });
    return null;
  }
  const db = await loadDb();
  const tokenHash = hashToken(token);
  const player = db.players.find((item) => item.accessTokenHash === tokenHash);
  if (!player) {
    sendJson(response, 401, { error: "unauthorized", message: "Игрок не найден." });
    return null;
  }
  return { db, player };
}

function getBearerToken(request) {
  const header = request.headers.authorization || "";
  const [, token] = header.match(/^Bearer\s+(.+)$/i) || [];
  return token || "";
}

function createToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicPlayer(player) {
  return {
    id: player.id,
    displayName: player.displayName,
    createdAt: player.createdAt,
  };
}

function normalizeDisplayName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeDisplayNameKey(value) {
  return normalizeDisplayName(value).toLocaleLowerCase("ru-RU");
}

function sanitizeActualResults(actualResults) {
  const { raw, ...safe } = actualResults || {};
  return safe;
}

function isAdmin(request) {
  if (!ADMIN_TOKEN) return true;
  return request.headers["x-admin-token"] === ADMIN_TOKEN || getBearerToken(request) === ADMIN_TOKEN;
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("Invalid JSON");
    error.status = 400;
    throw error;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function setCorsHeaders(response) {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,authorization,x-admin-token");
}

async function serveStatic(response, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.resolve(ROOT_DIR, `.${cleanPath}`);
  if (!filePath.startsWith(ROOT_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const file = await fs.readFile(filePath);
    response.writeHead(200, {
      "content-type": getMimeType(filePath),
      "cache-control": "no-cache",
    });
    response.end(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    throw error;
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".mjs": "text/javascript; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".otf": "font/otf",
      ".ttf": "font/ttf",
      ".json": "application/json; charset=utf-8",
    }[ext] || "application/octet-stream"
  );
}
