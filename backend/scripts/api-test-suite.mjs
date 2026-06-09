import assert from "node:assert/strict";
import {
  GROUPS,
  getBracketRoundsFromPrediction,
  getChampionFromPrediction,
} from "../src/tournament.mjs";

const API_BASE = process.env.API_BASE || "http://localhost:8788";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "test-admin";

const results = [];

await test("health returns ok", async () => {
  const response = await request("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
});

await test("admin reset clears isolated DB", async () => {
  const response = await request("/api/admin/reset", {
    method: "POST",
    admin: true,
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
});

await test("static index is served", async () => {
  const response = await request("/", { parseJson: false });
  assert.equal(response.status, 200);
  assert.match(response.body, /Chexx/);
});

await test("leaderboard starts empty on isolated DB", async () => {
  const response = await request("/api/leaderboard");
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.rows, []);
  assert.equal(response.body.source, "not-connected");
});

await test("me requires access token", async () => {
  const response = await request("/api/me", { expectedStatus: 401 });
  assert.equal(response.body.error, "unauthorized");
});

await test("blank player name is rejected", async () => {
  const response = await request("/api/players", {
    method: "POST",
    body: { displayName: "   " },
    expectedStatus: 400,
  });
  assert.equal(response.body.error, "validation_error");
});

await test("invalid JSON returns 400", async () => {
  const response = await request("/api/players", {
    method: "POST",
    rawBody: "{bad-json",
    expectedStatus: 400,
  });
  assert.equal(response.body.error, "bad_request");
});

await test("unfinished player name is released", async () => {
  await createPlayer("Temporary");
  const availability = await request("/api/players/availability?displayName=temporary");
  assert.equal(availability.body.available, true);
  const reused = await createPlayer(" temporary ");
  assert.equal(reused.player.displayName, "temporary");
});

const perfectPrediction = createPrediction("home");
const altPrediction = createPrediction("away");

await test("available player name returns true", async () => {
  const response = await request("/api/players/availability?displayName=Alpha");
  assert.equal(response.body.available, true);
});

await test("atomic prediction submit creates player and locks name", async () => {
  const gamma = await submitPrediction("Gamma", altPrediction);
  assert.equal(gamma.player.displayName, "Gamma");
  assert.ok(gamma.accessToken);
  const duplicate = await request("/api/predictions", {
    method: "POST",
    body: {
      displayName: " gamma ",
      ...altPrediction,
    },
    expectedStatus: 409,
  });
  assert.equal(duplicate.body.error, "player_exists");
});

const alpha = await submitPrediction("Alpha", perfectPrediction);
const beta = await submitPrediction("Beta", altPrediction);

await test("saved player can be fetched by token", async () => {
  const response = await request("/api/me", { token: alpha.accessToken });
  assert.equal(response.status, 200);
  assert.equal(response.body.player.displayName, "Alpha");
  assert.equal(response.body.prediction.championId, perfectPrediction.championTeamId);
  assert.equal(response.body.canEditPrediction, false);
});

await test("prediction save requires token", async () => {
  const response = await request("/api/predictions/me", {
    method: "PUT",
    body: perfectPrediction,
    expectedStatus: 401,
  });
  assert.equal(response.body.error, "unauthorized");
});

await test("prediction with repeated group team is rejected", async () => {
  const invalid = clone(perfectPrediction);
  invalid.groups.A[1] = invalid.groups.A[0];
  const response = await request("/api/predictions", {
    method: "POST",
    body: { displayName: "Invalid Repeat", ...invalid },
    expectedStatus: 400,
  });
  assert.equal(response.body.error, "validation_error");
  assert.ok(response.body.details.some((line) => line.includes("повторяющиеся")));
});

await test("prediction with wrong team in group is rejected", async () => {
  const invalid = clone(perfectPrediction);
  invalid.groups.A[0] = "brazil";
  const response = await request("/api/predictions", {
    method: "POST",
    body: { displayName: "Invalid Group", ...invalid },
    expectedStatus: 400,
  });
  assert.equal(response.body.error, "validation_error");
  assert.ok(response.body.details.some((line) => line.includes("не принадлежит")));
});

await test("prediction with 7 third places is rejected", async () => {
  const invalid = clone(perfectPrediction);
  invalid.thirdGroups = invalid.thirdGroups.slice(0, 7);
  invalid.thirdPlaces = invalid.thirdPlaces.slice(0, 7);
  const response = await request("/api/predictions", {
    method: "POST",
    body: { displayName: "Invalid Thirds", ...invalid },
    expectedStatus: 400,
  });
  assert.equal(response.body.error, "validation_error");
  assert.ok(response.body.details.some((line) => line.includes("ровно 8")));
});

await test("prediction with mismatched thirdPlaces teamId is rejected", async () => {
  const invalid = clone(perfectPrediction);
  invalid.thirdPlaces[0] = {
    ...invalid.thirdPlaces[0],
    teamId: invalid.groups[invalid.thirdPlaces[0].groupId][3],
  };
  const response = await request("/api/predictions", {
    method: "POST",
    body: { displayName: "Invalid Third Team", ...invalid },
    expectedStatus: 400,
  });
  assert.equal(response.body.error, "validation_error");
  assert.ok(response.body.details.some((line) => line.includes("не совпадает")));
});

await test("prediction with mismatched champion is rejected", async () => {
  const invalid = clone(perfectPrediction);
  invalid.championTeamId = "brazil";
  const response = await request("/api/predictions", {
    method: "POST",
    body: { displayName: "Invalid Champion", ...invalid },
    expectedStatus: 400,
  });
  assert.equal(response.body.error, "validation_error");
  assert.ok(response.body.details.some((line) => line.includes("championId")));
});

await test("saved player name is unavailable", async () => {
  const availability = await request("/api/players/availability?displayName=alpha");
  assert.equal(availability.body.available, false);
  const duplicatePlayer = await request("/api/players", {
    method: "POST",
    body: { displayName: " alpha " },
    expectedStatus: 409,
  });
  assert.equal(duplicatePlayer.body.error, "player_exists");
});

await test("saved prediction locks the player from editing", async () => {
  const response = await request("/api/me", { token: alpha.accessToken });
  assert.equal(response.body.canEditPrediction, false);
  assert.equal(response.body.prediction.championId, perfectPrediction.championTeamId);
});

await test("same player cannot save prediction twice", async () => {
  const secondSave = await request("/api/predictions/me", {
    method: "PUT",
    token: beta.accessToken,
    body: perfectPrediction,
    expectedStatus: 409,
  });
  assert.equal(secondSave.body.error, "prediction_locked");
  assert.equal(beta.prediction.predictionId, secondSave.body.prediction.predictionId);
  const leaderboard = await request("/api/leaderboard");
  assert.equal(leaderboard.body.rows.filter((row) => row.playerId === beta.player.id).length, 1);
});

await test("admin mock requires token when ADMIN_TOKEN is configured", async () => {
  const response = await request("/api/admin/results/mock", {
    method: "POST",
    body: {},
    expectedStatus: 401,
  });
  assert.equal(response.body.error, "unauthorized");
});

await test("third-place scoring compares teamId, not only groupId", async () => {
  await request("/api/admin/results/mock", {
    method: "POST",
    admin: true,
    body: {
      groups: perfectPrediction.groups,
      thirdGroups: perfectPrediction.thirdGroups,
      thirdPlaces: perfectPrediction.thirdGroups.map((groupId) => ({
        groupId,
        teamId: perfectPrediction.groups[groupId][3],
      })),
      picks: perfectPrediction.picks,
    },
  });
  const leaderboard = await request("/api/leaderboard");
  const alphaRow = leaderboard.body.rows.find((row) => row.playerId === alpha.player.id);
  assert.equal(alphaRow.groupPoints, 36);
  assert.equal(alphaRow.thirdPlacePoints, 0);
  assert.equal(alphaRow.playoffPoints, 67);
  assert.equal(alphaRow.totalPoints, 103);
});

await test("perfect mock result gives 119 points and sorts leaderboard", async () => {
  await request("/api/admin/results/mock", {
    method: "POST",
    admin: true,
    body: {
      groups: perfectPrediction.groups,
      thirdGroups: perfectPrediction.thirdGroups,
      thirdPlaces: perfectPrediction.thirdPlaces,
      picks: perfectPrediction.picks,
    },
  });
  const leaderboard = await request("/api/leaderboard");
  const alphaRow = leaderboard.body.rows.find((row) => row.playerId === alpha.player.id);
  const betaRow = leaderboard.body.rows.find((row) => row.playerId === beta.player.id);
  assert.equal(alphaRow.totalPoints, 119);
  assert.ok(betaRow.totalPoints < alphaRow.totalPoints);
  assert.equal(leaderboard.body.rows[0].playerId, alpha.player.id);
});

await test("unknown API route returns 404", async () => {
  const response = await request("/api/nope", { expectedStatus: 404 });
  assert.equal(response.body.error, "not_found");
});

printSummary();

async function createPlayer(displayName) {
  const response = await request("/api/players", {
    method: "POST",
    body: { displayName },
    expectedStatus: 201,
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.player.displayName, displayName.replace(/\s+/g, " ").trim());
  assert.ok(response.body.accessToken);
  return response.body;
}

async function submitPrediction(displayName, prediction) {
  const response = await request("/api/predictions", {
    method: "POST",
    body: { displayName, ...prediction },
    expectedStatus: 201,
  });
  return response.body;
}

function createPrediction(mode) {
  const groups = Object.fromEntries(GROUPS.map((group) => [group.id, group.teams.map((team) => team.id)]));
  const thirdGroups = findValidThirdGroups(groups);
  const record = { groups, thirdGroups, picks: {} };

  for (let pass = 0; pass < 80; pass += 1) {
    const pending = getBracketRoundsFromPrediction(record)
      .flatMap((round) => round.matches)
      .find((match) => match.home && match.away && !record.picks[match.id]);
    if (!pending) break;
    record.picks[pending.id] = mode === "away" ? pending.away.id : pending.home.id;
  }

  const champion = getChampionFromPrediction(record);
  return {
    groups,
    thirdGroups,
    thirdPlaces: thirdGroups.map((groupId) => ({
      groupId,
      teamId: groups[groupId][2],
    })),
    picks: record.picks,
    championTeamId: champion.id,
  };
}

function findValidThirdGroups(groups) {
  const groupIds = GROUPS.map((group) => group.id);
  const combinations = choose(groupIds, 8);
  const valid = combinations.find((thirdGroups) =>
    getBracketRoundsFromPrediction({ groups, thirdGroups, picks: {} }).length,
  );
  if (!valid) throw new Error("No valid third-place combination found");
  return valid;
}

function choose(items, size, start = 0, prefix = [], result = []) {
  if (prefix.length === size) {
    result.push([...prefix]);
    return result;
  }
  for (let index = start; index < items.length; index += 1) {
    prefix.push(items[index]);
    choose(items, size, index + 1, prefix, result);
    prefix.pop();
  }
  return result;
}

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`ok - ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error });
    console.error(`not ok - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "content-type": "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.admin ? { "x-admin-token": ADMIN_TOKEN } : {}),
    },
    body:
      options.rawBody !== undefined
        ? options.rawBody
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
  });
  const text = await response.text();
  const body = options.parseJson === false ? text : text ? JSON.parse(text) : null;
  const expectedStatus = options.expectedStatus || 200;
  assert.equal(response.status, expectedStatus, `${path} expected ${expectedStatus}, got ${response.status}: ${text}`);
  return { status: response.status, body };
}

function printSummary() {
  const failed = results.filter((item) => !item.ok);
  console.log("");
  console.log(`API tests: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
