import {
  GROUPS,
  getBracketRoundsFromPrediction,
  getChampionFromPrediction,
} from "../src/tournament.mjs";

const API_BASE = process.env.API_BASE || "http://localhost:8787";

const health = await request("/api/health");
const playerResponse = await request("/api/players", {
  method: "POST",
  body: {
    displayName: `Smoke ${Date.now()}`,
  },
});

const prediction = createPrediction();
const saveResponse = await request("/api/predictions/me", {
  method: "PUT",
  token: playerResponse.accessToken,
  body: prediction,
});

await request("/api/admin/results/mock", {
  method: "POST",
  body: {
    groups: prediction.groups,
    thirdGroups: prediction.thirdGroups,
    thirdPlaces: prediction.thirdPlaces,
    picks: prediction.picks,
  },
});

const leaderboard = await request("/api/leaderboard");
const currentRow = leaderboard.rows.find((row) => row.playerId === playerResponse.player.id);

console.log(
  JSON.stringify(
    {
      health,
      player: playerResponse.player,
      savedChampion: saveResponse.prediction.championName,
      leaderboardRow: currentRow,
    },
    null,
    2,
  ),
);

if (!currentRow) throw new Error("Saved player is missing from leaderboard");
if (currentRow.totalPoints !== 119) throw new Error(`Expected perfect score 119, got ${currentRow.totalPoints}`);

function createPrediction() {
  const groups = Object.fromEntries(GROUPS.map((group) => [group.id, group.teams.map((team) => team.id)]));
  const thirdGroups = findValidThirdGroups(groups);
  const record = { groups, thirdGroups, picks: {} };

  for (let pass = 0; pass < 80; pass += 1) {
    const pending = getBracketRoundsFromPrediction(record)
      .flatMap((round) => round.matches)
      .find((match) => match.home && match.away && !record.picks[match.id]);
    if (!pending) break;
    record.picks[pending.id] = pending.home.id;
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

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "content-type": "application/json",
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(payload)}`);
  return payload;
}
