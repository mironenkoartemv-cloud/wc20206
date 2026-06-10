import {
  GROUPS,
  SCORING,
  TEAM_BY_ID,
  calculateLiveScore,
  getBracketRoundsFromPrediction,
} from "../backend/src/tournament.mjs";

const SEED = 20260609;
const USER_COUNT = 10;

const rng = createRng(SEED);
const actual = createActualTournament();
const predictions = createPredictions(actual);
const report = predictions.map((record) => {
  const appScore = calculateLiveScore(record, actual);
  const expected = calculateExpectedScore(record, actual);
  return {
    player: record.name,
    champion: record.championName,
    appScore,
    expectedScore: expected.total,
    delta: appScore - expected.total,
    breakdown: expected,
  };
});

printReport(actual, report);

function createRng(seed) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function createActualTournament() {
  const groups = Object.fromEntries(
    GROUPS.map((group) => [group.id, shuffle(group.teams.map((team) => team.id))]),
  );
  const thirdGroups = randomValidThirdGroups(groups);
  const base = {
    source: "mock-simulation",
    updatedAt: new Date("2026-07-20T21:00:00.000Z").toISOString(),
    groups,
    thirdGroups,
    picks: {},
  };
  const withPicks = fillBracketPicks(base, () => rng() < 0.54);
  return { ...withPicks, source: base.source, updatedAt: base.updatedAt };
}

function createPredictions(actual) {
  const records = [];
  records.push(createRecord("user-01", "Игрок 1 · идеальный", actual.groups, actual.thirdGroups, actual.picks));

  for (let index = 2; index <= USER_COUNT; index += 1) {
    const groups = index === 2 ? clone(actual.groups) : randomGroups();
    const thirdGroups = index === 2 ? [...actual.thirdGroups] : randomValidThirdGroups(groups);
    const base = {
      id: `user-${String(index).padStart(2, "0")}`,
      name: `Игрок ${index}`,
      savedAt: new Date(Date.UTC(2026, 5, 9, 10, index)).toISOString(),
      groups,
      thirdGroups,
      picks: {},
    };
    const prediction = fillBracketPicks(base, () => rng() < 0.5);
    records.push(finalizeRecord(prediction));
  }

  return records;
}

function createRecord(id, name, groups, thirdGroups, picks) {
  return finalizeRecord({
    id,
    name,
    savedAt: new Date(Date.UTC(2026, 5, 9, 10, 1)).toISOString(),
    groups: clone(groups),
    thirdGroups: [...thirdGroups],
    picks: clone(picks),
  });
}

function randomGroups() {
  return Object.fromEntries(
    GROUPS.map((group) => [group.id, shuffle(group.teams.map((team) => team.id))]),
  );
}

function randomValidThirdGroups(groups) {
  const groupIds = GROUPS.map((group) => group.id);
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const thirdGroups = shuffle(groupIds).slice(0, 8).sort();
    const rounds = getBracketRoundsFromPrediction({ groups, thirdGroups, picks: {} });
    if (rounds.length) return thirdGroups;
  }
  throw new Error("Could not generate a valid third-place allocation");
}

function fillBracketPicks(record, chooseHome) {
  const next = { ...record, groups: clone(record.groups), thirdGroups: [...record.thirdGroups], picks: { ...record.picks } };
  for (let pass = 0; pass < 80; pass += 1) {
    const rounds = getBracketRoundsFromPrediction(next);
    const pending = rounds
      .flatMap((round) => round.matches)
      .find((match) => match.home && match.away && !next.picks[match.id]);
    if (!pending) break;
    const winner = chooseHome(pending) ? pending.home : pending.away;
    next.picks[pending.id] = winner.id;
  }
  return finalizeRecord(next);
}

function finalizeRecord(record) {
  const final = getBracketRoundsFromPrediction(record)
    .find((round) => round.key === "final")
    ?.matches.find((match) => match.id === "m104");
  const champion = getWinner(final);
  return {
    ...record,
    championId: champion?.id || null,
    championName: champion?.name || "не выбран",
  };
}

function getWinner(match) {
  if (!match?.winnerId) return null;
  if (match.home?.id === match.winnerId) return match.home;
  if (match.away?.id === match.winnerId) return match.away;
  return null;
}

function calculateExpectedScore(record, actual) {
  const groupRows = GROUPS.map((group) => {
    const predicted = record.groups[group.id] || [];
    const real = actual.groups[group.id] || [];
    const exactPlaces = predicted.filter((teamId, index) => real[index] === teamId).length;
    const points = exactPlaces === 4 ? 3 : exactPlaces === 2 ? 2 : exactPlaces === 1 ? 1 : 0;
    return { groupId: group.id, exactPlaces, points };
  });

  const actualBestThirdTeamIds = new Set(
    (actual.thirdGroups || []).map((groupId) => actual.groups?.[groupId]?.[2]).filter(Boolean),
  );
  const predictedThirdTeamIds = (record.thirdGroups || [])
    .map((groupId) => record.groups?.[groupId]?.[2])
    .filter(Boolean);
  const thirdTeamHits = predictedThirdTeamIds.filter((teamId) => actualBestThirdTeamIds.has(teamId));
  const thirdGroupHits = (record.thirdGroups || []).filter((groupId) => (actual.thirdGroups || []).includes(groupId));

  const playoffHits = Object.entries(record.picks || [])
    .filter(([matchId, teamId]) => actual.picks?.[matchId] === teamId)
    .map(([matchId]) => ({ matchId, points: expectedMatchScore(matchId), round: getRoundKey(matchId) }));

  const roundBreakdown = playoffHits.reduce((acc, hit) => {
    acc[hit.round] = (acc[hit.round] || 0) + hit.points;
    return acc;
  }, {});

  const groups = groupRows.reduce((sum, row) => sum + row.points, 0);
  const thirds = thirdTeamHits.length * SCORING.bestThird;
  const playoff = playoffHits.reduce((sum, hit) => sum + hit.points, 0);

  return {
    total: groups + thirds + playoff,
    groups,
    thirds,
    playoff,
    groupRows,
    thirdTeamHits: thirdTeamHits.length,
    thirdGroupHits: thirdGroupHits.length,
    roundBreakdown,
  };
}

function expectedMatchScore(matchId) {
  const number = Number(matchId.match(/(?:m|-)(\d+)$/)?.[1] || 0);
  if (matchId === "m104") return 10;
  if (matchId === "m103") return 5;
  if (number >= 73 && number <= 88) return 1;
  if (number >= 89 && number <= 96) return 2;
  if (number >= 97 && number <= 100) return 3;
  if (number >= 101 && number <= 102) return 4;
  return 0;
}

function getRoundKey(matchId) {
  const number = Number(matchId.match(/(?:m|-)(\d+)$/)?.[1] || 0);
  if (matchId === "m104") return "final";
  if (matchId === "m103") return "bronze";
  if (number >= 73 && number <= 88) return "r32";
  if (number >= 89 && number <= 96) return "r16";
  if (number >= 97 && number <= 100) return "qf";
  if (number >= 101 && number <= 102) return "sf";
  return "unknown";
}

function printReport(actual, report) {
  const actualChampion = TEAM_BY_ID[actual.picks.m104] || { name: "не выбран" };
  console.log(`Seed: ${SEED}`);
  console.log(`Моковый чемпион: ${actualChampion.name}`);
  console.log(
    `Лучшие третьи места: ${actual.thirdGroups
      .map((groupId) => TEAM_BY_ID[actual.groups[groupId][2]].name)
      .join(", ")}`,
  );
  console.log("");
  console.table(
    report.map((row) => ({
      Игрок: row.player,
      Чемпион: row.champion,
      "Скрипт": row.appScore,
      "Ожидаемо": row.expectedScore,
      "Δ": row.delta,
      "Группы": row.breakdown.groups,
      "3-и места": row.breakdown.thirds,
      "Плей-офф": row.breakdown.playoff,
      "3-и команды": row.breakdown.thirdTeamHits,
      "3-и группы": row.breakdown.thirdGroupHits,
    })),
  );

  const mismatches = report.filter((row) => row.delta !== 0);
  if (!mismatches.length) {
    console.log("Расхождений между скриптом и независимой разбивкой не найдено.");
    return;
  }

  console.log("Найдены расхождения:");
  mismatches.forEach((row) => {
    console.log(
      `- ${row.player}: скрипт ${row.appScore}, ожидаемо ${row.expectedScore}, delta ${row.delta}; ` +
        `совпадений третьих команд ${row.breakdown.thirdTeamHits}, групп ${row.breakdown.thirdGroupHits}`,
    );
  });
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const next = Math.floor(rng() * (index + 1));
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
