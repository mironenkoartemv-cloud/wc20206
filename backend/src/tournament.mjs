import { allocateThirdSlotsFor } from "../../shared/third-place-matrix.mjs";
import {
  QUARTERFINAL_DEFS,
  ROUND16_DEFS,
  SEMIFINAL_DEFS,
} from "../../shared/bracket-topology.mjs";

export const SCORING = {
  fullGroup: 3,
  twoGroupPlaces: 2,
  oneGroupPlace: 1,
  bestThird: 2,
  r32Winner: 1,
  r16Winner: 2,
  qfWinner: 3,
  sfWinner: 4,
  bronzeWinner: 5,
  champion: 10,
};

export const GROUPS = [
  {
    id: "A",
    teams: [
      team("mexico", "Мексика", "🇲🇽"),
      team("south-korea", "Южная Корея", "🇰🇷"),
      team("czechia", "Чехия", "🇨🇿"),
      team("south-africa", "ЮАР", "🇿🇦"),
    ],
  },
  {
    id: "B",
    teams: [
      team("canada", "Канада", "🇨🇦"),
      team("switzerland", "Швейцария", "🇨🇭"),
      team("qatar", "Катар", "🇶🇦"),
      team("bosnia", "Босния и Герцеговина", "🇧🇦"),
    ],
  },
  {
    id: "C",
    teams: [
      team("brazil", "Бразилия", "🇧🇷"),
      team("morocco", "Марокко", "🇲🇦"),
      team("scotland", "Шотландия", "🏴"),
      team("haiti", "Гаити", "🇭🇹"),
    ],
  },
  {
    id: "D",
    teams: [
      team("usa", "США", "🇺🇸"),
      team("turkey", "Турция", "🇹🇷"),
      team("paraguay", "Парагвай", "🇵🇾"),
      team("australia", "Австралия", "🇦🇺"),
    ],
  },
  {
    id: "E",
    teams: [
      team("germany", "Германия", "🇩🇪"),
      team("ecuador", "Эквадор", "🇪🇨"),
      team("cote-divoire", "Кот-д’Ивуар", "🇨🇮"),
      team("curacao", "Кюрасао", "🇨🇼"),
    ],
  },
  {
    id: "F",
    teams: [
      team("netherlands", "Нидерланды", "🇳🇱"),
      team("japan", "Япония", "🇯🇵"),
      team("sweden", "Швеция", "🇸🇪"),
      team("tunisia", "Тунис", "🇹🇳"),
    ],
  },
  {
    id: "G",
    teams: [
      team("belgium", "Бельгия", "🇧🇪"),
      team("iran", "Иран", "🇮🇷"),
      team("egypt", "Египет", "🇪🇬"),
      team("new-zealand", "Новая Зеландия", "🇳🇿"),
    ],
  },
  {
    id: "H",
    teams: [
      team("spain", "Испания", "🇪🇸"),
      team("uruguay", "Уругвай", "🇺🇾"),
      team("saudi-arabia", "Саудовская Аравия", "🇸🇦"),
      team("cabo-verde", "Кабо-Верде", "🇨🇻"),
    ],
  },
  {
    id: "I",
    teams: [
      team("france", "Франция", "🇫🇷"),
      team("senegal", "Сенегал", "🇸🇳"),
      team("norway", "Норвегия", "🇳🇴"),
      team("iraq", "Ирак", "🇮🇶"),
    ],
  },
  {
    id: "J",
    teams: [
      team("argentina", "Аргентина", "🇦🇷"),
      team("austria", "Австрия", "🇦🇹"),
      team("algeria", "Алжир", "🇩🇿"),
      team("jordan", "Иордания", "🇯🇴"),
    ],
  },
  {
    id: "K",
    teams: [
      team("portugal", "Португалия", "🇵🇹"),
      team("colombia", "Колумбия", "🇨🇴"),
      team("uzbekistan", "Узбекистан", "🇺🇿"),
      team("dr-congo", "ДР Конго", "🇨🇩"),
    ],
  },
  {
    id: "L",
    teams: [
      team("england", "Англия", "🏴"),
      team("croatia", "Хорватия", "🇭🇷"),
      team("ghana", "Гана", "🇬🇭"),
      team("panama", "Панама", "🇵🇦"),
    ],
  },
];

export const TEAM_BY_ID = Object.fromEntries(GROUPS.flatMap((group) => group.teams).map((item) => [item.id, item]));
export const TEAM_GROUP_BY_ID = Object.fromEntries(
  GROUPS.flatMap((group) => group.teams.map((item) => [item.id, group.id])),
);

export const API_TEAM_ID_TO_LOCAL_ID = {
  1: "mexico",
  2: "south-africa",
  3: "south-korea",
  4: "czechia",
  5: "canada",
  6: "bosnia",
  7: "qatar",
  8: "switzerland",
  9: "brazil",
  10: "morocco",
  11: "haiti",
  12: "scotland",
  13: "usa",
  14: "paraguay",
  15: "australia",
  16: "turkey",
  17: "germany",
  18: "curacao",
  19: "cote-divoire",
  20: "ecuador",
  21: "netherlands",
  22: "japan",
  23: "sweden",
  24: "tunisia",
  25: "belgium",
  26: "egypt",
  27: "iran",
  28: "new-zealand",
  29: "spain",
  30: "cabo-verde",
  31: "saudi-arabia",
  32: "uruguay",
  33: "france",
  34: "senegal",
  35: "iraq",
  36: "norway",
  37: "argentina",
  38: "algeria",
  39: "austria",
  40: "jordan",
  41: "portugal",
  42: "dr-congo",
  43: "uzbekistan",
  44: "colombia",
  45: "england",
  46: "croatia",
  47: "ghana",
  48: "panama",
};

const CHAMPIONAT_TEAM_NAME_TO_LOCAL_ID = {
  "Мексика": "mexico",
  "ЮАР": "south-africa",
  "Южная Корея": "south-korea",
  "Чехия": "czechia",
  "Канада": "canada",
  "Катар": "qatar",
  "Швейцария": "switzerland",
  "Босния и Герцеговина": "bosnia",
  "Бразилия": "brazil",
  "Марокко": "morocco",
  "Гаити": "haiti",
  "Шотландия": "scotland",
  "США": "usa",
  "Парагвай": "paraguay",
  "Австралия": "australia",
  "Турция": "turkey",
  "Германия": "germany",
  "Кюрасао": "curacao",
  "Кот-д’Ивуар": "cote-divoire",
  "Кот-д'Ивуар": "cote-divoire",
  "Эквадор": "ecuador",
  "Нидерланды": "netherlands",
  "Япония": "japan",
  "Швеция": "sweden",
  "Тунис": "tunisia",
  "Бельгия": "belgium",
  "Египет": "egypt",
  "Иран": "iran",
  "Новая Зеландия": "new-zealand",
  "Испания": "spain",
  "Кабо-Верде": "cabo-verde",
  "Саудовская Аравия": "saudi-arabia",
  "Уругвай": "uruguay",
  "Франция": "france",
  "Сенегал": "senegal",
  "Ирак": "iraq",
  "Норвегия": "norway",
  "Аргентина": "argentina",
  "Алжир": "algeria",
  "Австрия": "austria",
  "Иордания": "jordan",
  "Португалия": "portugal",
  "ДР Конго": "dr-congo",
  "Демократическая Республика Конго": "dr-congo",
  "Узбекистан": "uzbekistan",
  "Колумбия": "colombia",
  "Англия": "england",
  "Хорватия": "croatia",
  "Гана": "ghana",
  "Панама": "panama",
};

export const ROUND32_DEFS = [
  matchDef(73, "2A", "2B"),
  matchDef(74, "1E", "3A/B/C/D/F"),
  matchDef(75, "1F", "2C"),
  matchDef(76, "1C", "2F"),
  matchDef(77, "1I", "3C/D/F/G/H"),
  matchDef(78, "2E", "2I"),
  matchDef(79, "1A", "3C/E/F/H/I"),
  matchDef(80, "1L", "3E/H/I/J/K"),
  matchDef(81, "1D", "3B/E/F/I/J"),
  matchDef(82, "1G", "3A/E/H/I/J"),
  matchDef(83, "2K", "2L"),
  matchDef(84, "1H", "2J"),
  matchDef(85, "1B", "3E/F/G/I/J"),
  matchDef(86, "1J", "2H"),
  matchDef(87, "1K", "3D/E/I/J/L"),
  matchDef(88, "2D", "2G"),
];

export const ROUND_NAMES = {
  r32: "1/16 финала",
  r16: "1/8 финала",
  qf: "1/4 финала",
  sf: "1/2 финала",
  final: "Финал",
  bronze: "3-е место",
};

function team(id, name, flag) {
  return { id, name, flag };
}

function matchDef(id, home, away) {
  return { id: `m${id}`, code: `M${id}`, home, away };
}

export function createInitialGroups() {
  return Object.fromEntries(GROUPS.map((group) => [group.id, group.teams.map((item) => item.id)]));
}

export function normalizePredictionPayload(payload) {
  const groups = payload?.groups || {};
  const explicitThirdPlaces = Array.isArray(payload?.thirdPlaces) ? payload.thirdPlaces : null;
  const thirdGroups = Array.isArray(payload?.thirdGroups)
    ? payload.thirdGroups
    : explicitThirdPlaces
      ? explicitThirdPlaces.map((item) => item.groupId)
      : [];
  const picks = payload?.picks || {};
  const thirdPlaces =
    explicitThirdPlaces ||
    thirdGroups.map((groupId) => ({
      groupId,
      teamId: groups?.[groupId]?.[2],
    }));
  return {
    groups,
    thirdGroups,
    thirdPlaces,
    picks,
    championId: payload?.championId || payload?.championTeamId || null,
  };
}

export function validatePrediction(payload) {
  const errors = [];
  const prediction = normalizePredictionPayload(payload);
  const groupIds = GROUPS.map((group) => group.id);

  for (const group of GROUPS) {
    const order = prediction.groups[group.id];
    const allowed = new Set(group.teams.map((item) => item.id));
    if (!Array.isArray(order) || order.length !== 4) {
      errors.push(`В группе ${group.id} должно быть 4 команды.`);
      continue;
    }
    const unique = new Set(order);
    if (unique.size !== 4) errors.push(`В группе ${group.id} есть повторяющиеся команды.`);
    order.forEach((teamId) => {
      if (!allowed.has(teamId)) errors.push(`Команда ${teamId} не принадлежит группе ${group.id}.`);
    });
  }

  if (!Array.isArray(prediction.thirdGroups) || prediction.thirdGroups.length !== 8) {
    errors.push("Нужно выбрать ровно 8 третьих мест.");
  }
  if (!Array.isArray(prediction.thirdPlaces) || prediction.thirdPlaces.length !== prediction.thirdGroups.length) {
    errors.push("Список thirdPlaces должен соответствовать выбранным третьим группам.");
  }
  const uniqueThirdGroups = new Set(prediction.thirdGroups);
  if (uniqueThirdGroups.size !== prediction.thirdGroups.length) errors.push("Третьи места не должны повторяться.");
  const explicitThirdGroups = new Set(prediction.thirdPlaces.map((item) => item?.groupId).filter(Boolean));
  if (explicitThirdGroups.size !== prediction.thirdPlaces.length) errors.push("thirdPlaces не должны повторяться.");
  prediction.thirdGroups.forEach((groupId) => {
    if (!groupIds.includes(groupId)) errors.push(`Неизвестная группа третьего места: ${groupId}.`);
    const predictedThird = prediction.groups?.[groupId]?.[2];
    const explicitThird = prediction.thirdPlaces.find((item) => item.groupId === groupId)?.teamId;
    if (!predictedThird) errors.push(`В группе ${groupId} нет команды на третьем месте.`);
    if (!explicitThird) errors.push(`В thirdPlaces нет команды для группы ${groupId}.`);
    if (explicitThird && !TEAM_BY_ID[explicitThird]) errors.push(`Неизвестная команда третьего места: ${explicitThird}.`);
    if (explicitThird && explicitThird !== predictedThird) {
      errors.push(`Третье место группы ${groupId} не совпадает с порядком команд.`);
    }
  });

  const rounds = getBracketRoundsFromPrediction(prediction);
  if (!rounds.length) {
    errors.push("Выбранные третьи места не раскладываются по сетке плей-офф.");
  } else {
    const matches = rounds.flatMap((round) => round.matches);
    matches.forEach((match) => {
      const picked = prediction.picks[match.id];
      if (!match.home || !match.away) {
        errors.push(`Матч ${match.id} не может быть построен.`);
        return;
      }
      if (!picked) {
        errors.push(`В матче ${match.id} не выбран победитель.`);
        return;
      }
      if (match.home.id !== picked && match.away.id !== picked) {
        errors.push(`Победитель матча ${match.id} не участвует в этом матче.`);
      }
    });

    const final = rounds.find((round) => round.key === "final")?.matches.find((match) => match.id === "m104");
    const champion = getWinner(final);
    if (!champion) errors.push("Не выбран чемпион.");
    if (prediction.championId && champion && prediction.championId !== champion.id) {
      errors.push("championId не совпадает с победителем финала.");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    prediction,
  };
}

export function getBracketRoundsFromPrediction(record) {
  if (!record?.groups || !record.thirdGroups?.length) return [];
  const thirdAllocation = allocateThirdSlotsFor(record.thirdGroups);
  if (!thirdAllocation) return [];

  const r32 = ROUND32_DEFS.map((def) =>
    createMatch(
      def.id,
      def.code,
      ROUND_NAMES.r32,
      resolveSlotForPrediction(def.home, thirdAllocation, record.groups),
      resolveSlotForPrediction(def.away, thirdAllocation, record.groups),
      record.picks,
    ),
  );
  const r16 = createLinkedRound(ROUND16_DEFS, ROUND_NAMES.r16, r32, record.picks);
  const qf = createLinkedRound(QUARTERFINAL_DEFS, ROUND_NAMES.qf, r16, record.picks);
  const sf = createLinkedRound(SEMIFINAL_DEFS, ROUND_NAMES.sf, qf, record.picks);
  const final = [createMatch("m104", "M104", ROUND_NAMES.final, getWinner(sf[0]), getWinner(sf[1]), record.picks)];
  const bronze = [createMatch("m103", "M103", ROUND_NAMES.bronze, getLoser(sf[0]), getLoser(sf[1]), record.picks)];

  return [
    { key: "r32", title: ROUND_NAMES.r32, matches: r32 },
    { key: "r16", title: ROUND_NAMES.r16, matches: r16 },
    { key: "qf", title: ROUND_NAMES.qf, matches: qf },
    { key: "sf", title: ROUND_NAMES.sf, matches: sf },
    { key: "final", title: ROUND_NAMES.final, matches: [...final, ...bronze] },
  ];
}

function resolveSlotForPrediction(slot, thirdAllocation, groups) {
  if (slot.startsWith("3")) {
    const groupId = thirdAllocation[slot];
    if (!groupId) return null;
    return TEAM_BY_ID[groups?.[groupId]?.[2]] || null;
  }
  const [, place, groupId] = slot.match(/^([123])([A-L])$/) || [];
  if (!place || !groupId) return null;
  return TEAM_BY_ID[groups?.[groupId]?.[Number(place) - 1]] || null;
}

function createMatch(id, code, title, home, away, picks) {
  return {
    id,
    code,
    title,
    home,
    away,
    winnerId: picks?.[id] || null,
  };
}

function createLinkedRound(defs, title, previousRound, picks) {
  const previousById = indexMatchesById(previousRound);
  return defs.map((def) =>
    createMatch(
      def.id,
      def.code,
      title,
      getWinner(previousById.get(def.homeSourceId)),
      getWinner(previousById.get(def.awaySourceId)),
      picks,
    ),
  );
}

function indexMatchesById(matches) {
  return new Map(matches.map((match) => [match.id, match]));
}

export function getWinner(match) {
  if (!match?.winnerId) return null;
  if (match.home?.id === match.winnerId) return match.home;
  if (match.away?.id === match.winnerId) return match.away;
  return null;
}

export function getLoser(match) {
  if (!match?.winnerId || !match.home || !match.away) return null;
  if (match.home.id === match.winnerId) return match.away;
  if (match.away.id === match.winnerId) return match.home;
  return null;
}

export function calculateLiveScore(record, actual) {
  return calculateLiveScoreDetailed(record, actual).total;
}

export function calculateLiveScoreDetailed(record, actual) {
  const breakdown = {
    total: 0,
    groups: 0,
    thirdPlaces: 0,
    playoff: 0,
    groupRows: [],
    thirdRows: [],
    playoffRows: [],
  };
  if (!actual) return breakdown;

  if (actual.groups && record.groups) {
    GROUPS.forEach((group) => {
      const predicted = record.groups[group.id] || [];
      const real = getScorableGroupOrder(actual, group.id);
      const exactPlaces = predicted.filter((teamId, index) => real[index] === teamId).length;
      const points =
        exactPlaces === 4
          ? SCORING.fullGroup
          : exactPlaces === 2
            ? SCORING.twoGroupPlaces
            : exactPlaces === 1
              ? SCORING.oneGroupPlace
              : 0;
      breakdown.groups += points;
      breakdown.groupRows.push({ groupId: group.id, exactPlaces, points });
    });
  }

  const actualThirdTeamIds = new Set(getThirdPlaceTeamIds(actual));
  const predictedThirdPlaces = getPredictionThirdPlaces(record);
  predictedThirdPlaces.forEach((item) => {
    const hit = actualThirdTeamIds.has(item.teamId);
    const points = hit ? SCORING.bestThird : 0;
    breakdown.thirdPlaces += points;
    breakdown.thirdRows.push({ ...item, hit, points });
  });

  if (actual.picks && record.picks) {
    Object.entries(record.picks).forEach(([matchId, teamId]) => {
      const hit = actual.picks[matchId] === teamId;
      const points = hit ? getMatchScore(matchId) : 0;
      breakdown.playoff += points;
      breakdown.playoffRows.push({ matchId, teamId, hit, points });
    });
  }

  breakdown.total = breakdown.groups + breakdown.thirdPlaces + breakdown.playoff;
  return breakdown;
}

function getPredictionThirdPlaces(record) {
  if (Array.isArray(record.thirdPlaces) && record.thirdPlaces.length) {
    return record.thirdPlaces.filter((item) => item?.groupId && item?.teamId);
  }
  return (record.thirdGroups || [])
    .map((groupId) => ({ groupId, teamId: record.groups?.[groupId]?.[2] }))
    .filter((item) => item.teamId);
}

function getScorableGroupOrder(actual, groupId) {
  const tableRows = actual.groupTables?.[groupId];
  if (Array.isArray(tableRows)) {
    if (!isGroupTableStarted(tableRows)) return [];
    return tableRows.map((row) => row.teamId).filter(Boolean);
  }
  return actual.groups?.[groupId] || [];
}

function getThirdPlaceTeamIds(actual) {
  if (Array.isArray(actual.thirdPlaces) && actual.thirdPlaces.length) {
    return actual.thirdPlaces.map((item) => item.teamId).filter(Boolean);
  }
  return (actual.thirdGroups || []).map((groupId) => actual.groups?.[groupId]?.[2]).filter(Boolean);
}

export function getMatchScore(matchId) {
  const number = Number(matchId.match(/(?:m|-)(\d+)$/)?.[1] || 0);
  if (matchId === "m104") return SCORING.champion;
  if (matchId === "m103") return SCORING.bronzeWinner;
  if (number >= 73 && number <= 88) return SCORING.r32Winner;
  if (number >= 89 && number <= 96) return SCORING.r16Winner;
  if (number >= 97 && number <= 100) return SCORING.qfWinner;
  if (number >= 101 && number <= 102) return SCORING.sfWinner;
  return 0;
}

export function getChampionFromPrediction(record) {
  const final = getBracketRoundsFromPrediction(record)
    .find((round) => round.key === "final")
    ?.matches.find((match) => match.id === "m104");
  return getWinner(final);
}

export function toFrontendPrediction(prediction, player) {
  const champion = TEAM_BY_ID[prediction.championId] || null;
  return {
    id: player.id,
    predictionId: prediction.id,
    name: player.displayName,
    savedAt: prediction.submittedAt || prediction.updatedAt,
    groups: prediction.groups,
    thirdGroups: prediction.thirdGroups,
    thirdPlaces: prediction.thirdPlaces,
    picks: prediction.picks,
    championId: prediction.championId,
    championName: champion?.name || "не выбран",
  };
}

export function normalizeWorldCupApiResults(groupsPayload, gamesPayload) {
  const finishedGroupMatches = countFinishedApiGroupMatches(gamesPayload.games || []);
  const { groupTables, invalidGroups } = normalizeApiGroupTables(groupsPayload.groups || [], finishedGroupMatches);
  const groups = getStartedGroupsFromTables(groupTables);
  const thirdGroups = normalizeThirdGroupsFromTables(groupTables);
  const thirdPlaces = thirdGroups
    .map((groupId) => ({ groupId, teamId: groupTables?.[groupId]?.[2]?.teamId }))
    .filter((item) => item.teamId);
  const picks = normalizeApiKnockoutPicks(gamesPayload.games || []);

  return {
    source: "worldcup26.ir",
    updatedAt: new Date().toISOString(),
    groups,
    groupTables,
    thirdGroups,
    thirdPlaces,
    picks,
    validation: {
      invalidGroups,
      finishedGroupMatches,
    },
    raw: {
      groupsPayload,
      gamesPayload,
    },
  };
}

export function normalizeChampionatResults(html) {
  const groupTables = parseChampionatGroupTables(html);
  const groups = getStartedGroupsFromTables(groupTables);
  const thirdGroups = normalizeThirdGroupsFromTables(groupTables);
  const thirdPlaces = thirdGroups
    .map((groupId) => ({ groupId, teamId: groupTables?.[groupId]?.[2]?.teamId }))
    .filter((item) => item.teamId);

  return {
    source: "championat.com",
    updatedAt: new Date().toISOString(),
    groups,
    groupTables,
    thirdGroups,
    thirdPlaces,
    picks: {},
    raw: {},
  };
}

function normalizeApiGroupTables(apiGroups, finishedGroupMatches = {}) {
  const invalidGroups = [];
  const groupTables = Object.fromEntries(
    apiGroups
      .filter((group) => /^[A-L]$/.test(group.name))
      .map((group) => {
        const rows = [...group.teams]
          .sort(compareApiTableRows)
          .map((row) => apiTableRowToActualRow(group.name, row))
          .filter((row) => row.teamId);
        const expectedFinishedMatches = finishedGroupMatches[group.name] || 0;
        if (!isGroupTableConsistentWithSchedule(rows, expectedFinishedMatches)) {
          invalidGroups.push(group.name);
          return [group.name, resetGroupTableRows(rows)];
        }
        return [group.name, rows];
      }),
  );
  return { groupTables, invalidGroups };
}

function normalizeThirdGroupsFromTables(groupTables) {
  const completedGroups = Object.entries(groupTables).filter(([, rows]) => isGroupTableComplete(rows));
  if (completedGroups.length < 12) return [];

  return completedGroups
    .map(([groupId, rows]) => ({ groupId, row: rows[2] }))
    .filter((item) => item.row)
    .sort((a, b) => compareApiTableRows(a.row, b.row))
    .slice(0, 8)
    .map((item) => item.groupId);
}

function getStartedGroupsFromTables(groupTables) {
  return Object.fromEntries(
    Object.entries(groupTables)
      .filter(([, rows]) => isGroupTableStarted(rows))
      .map(([groupId, rows]) => [groupId, rows.map((row) => row.teamId)]),
  );
}

function normalizeApiKnockoutPicks(apiGames) {
  return Object.fromEntries(
    apiGames
      .filter((game) => Number(game.id) >= 73 && isApiGameFinished(game))
      .map((game) => [apiMatchIdToPickId(Number(game.id)), getApiGameWinnerLocalId(game)])
      .filter(([, winnerId]) => Boolean(winnerId)),
  );
}

function countFinishedApiGroupMatches(apiGames) {
  return apiGames
    .filter((game) => game.type === "group" && /^[A-L]$/.test(game.group) && isApiGameFinished(game))
    .reduce((acc, game) => {
      acc[game.group] = (acc[game.group] || 0) + 1;
      return acc;
    }, {});
}

function compareApiTableRows(a, b) {
  return (
    Number(b.pts) - Number(a.pts) ||
    Number(b.gd) - Number(a.gd) ||
    Number(b.gf) - Number(a.gf) ||
    Number(a.ga) - Number(b.ga) ||
    Number(a.team_id) - Number(b.team_id)
  );
}

function apiTableRowToActualRow(groupId, row) {
  const teamId = API_TEAM_ID_TO_LOCAL_ID[Number(row.team_id)];
  return {
    groupId,
    teamId,
    mp: Number(row.mp) || 0,
    w: Number(row.w) || 0,
    d: Number(row.d) || 0,
    l: Number(row.l) || 0,
    gf: Number(row.gf) || 0,
    ga: Number(row.ga) || 0,
    gd: Number(row.gd) || 0,
    pts: Number(row.pts) || 0,
  };
}

function isGroupTableStarted(rows) {
  if (!Array.isArray(rows)) return false;
  const playedRows = rows.filter((row) => Number(row.mp) > 0).length;
  const totalPlayedRows = rows.reduce((sum, row) => sum + (Number(row.mp) || 0), 0);
  return playedRows >= 2 && totalPlayedRows > 0 && totalPlayedRows % 2 === 0;
}

function isGroupTableConsistentWithSchedule(rows, expectedFinishedMatches) {
  if (!Array.isArray(rows)) return false;
  const expectedTeamAppearances = Number(expectedFinishedMatches || 0) * 2;
  const totalPlayedRows = rows.reduce((sum, row) => sum + (Number(row.mp) || 0), 0);
  if (totalPlayedRows !== expectedTeamAppearances) return false;
  return rows.every((row) => Number(row.mp) <= Number(expectedFinishedMatches || 0));
}

function resetGroupTableRows(rows) {
  return rows.map((row) => ({
    ...row,
    mp: 0,
    w: 0,
    d: 0,
    l: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0,
  }));
}

function isGroupTableComplete(rows) {
  return Array.isArray(rows) && rows.length === 4 && rows.every((row) => Number(row.mp) >= 3);
}

function isApiGameFinished(game) {
  return String(game.finished).toLowerCase() === "true";
}

function getApiGameWinnerLocalId(game) {
  const homeScore = Number(game.home_score);
  const awayScore = Number(game.away_score);
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore) || homeScore === awayScore) return null;
  const winnerApiId = homeScore > awayScore ? game.home_team_id : game.away_team_id;
  return API_TEAM_ID_TO_LOCAL_ID[Number(winnerApiId)] || null;
}

function apiMatchIdToPickId(matchNumber) {
  if (matchNumber >= 73 && matchNumber <= 88) return `m${matchNumber}`;
  if (matchNumber >= 89 && matchNumber <= 96) return `r16-${matchNumber}`;
  if (matchNumber >= 97 && matchNumber <= 100) return `qf-${matchNumber}`;
  if (matchNumber >= 101 && matchNumber <= 102) return `sf-${matchNumber}`;
  if (matchNumber === 103 || matchNumber === 104) return `m${matchNumber}`;
  return `m${matchNumber}`;
}

function parseChampionatGroupTables(html) {
  const groupTables = {};
  for (const group of GROUPS) {
    const titlePattern = new RegExp(`<div[^>]*results-table__title[^>]*>\\s*Группа\\s+${group.id}\\s*<\\/div>`, "i");
    const titleMatch = titlePattern.exec(html);
    const start = titleMatch ? titleMatch.index + titleMatch[0].length : -1;
    if (start === -1) continue;
    const tableStart = html.indexOf("<tbody", start);
    const tableEnd = html.indexOf("</tbody>", tableStart);
    if (tableStart === -1 || tableEnd === -1) continue;
    const rows = parseChampionatGroupRows(group.id, html.slice(tableStart, tableEnd)).sort(compareApiTableRows);
    if (rows.length) groupTables[group.id] = rows;
  }
  return groupTables;
}

function parseChampionatGroupRows(groupId, tbodyHtml) {
  return [...String(tbodyHtml || "").matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
    .map(([rowHtml]) => {
      const nameMatch = rowHtml.match(
        /<td[^>]*results-table__item[\s\S]*?<span[^>]*table-item__name[^>]*>([\s\S]*?)<\/span>/i,
      );
      if (!nameMatch) return null;
      const name = htmlToText(nameMatch[1]);
      const teamId = CHAMPIONAT_TEAM_NAME_TO_LOCAL_ID[normalizeChampionatTeamName(name)];
      if (!teamId) return null;

      const statCells = [...rowHtml.matchAll(/<td[^>]*data-fix="right"[^>]*>([\s\S]*?)<\/td>/gi)].map(([, cell]) =>
        htmlToText(cell),
      );
      const [mp, w, d, l, goals = "0-0", pts] = statCells;
      const [gf, ga] = String(goals).split("-").map((value) => Number(value) || 0);
      const goalsFor = Number(gf) || 0;
      const goalsAgainst = Number(ga) || 0;
      return {
        groupId,
        teamId,
        mp: Number(mp) || 0,
        w: Number(w) || 0,
        d: Number(d) || 0,
        l: Number(l) || 0,
        gf: goalsFor,
        ga: goalsAgainst,
        gd: goalsFor - goalsAgainst,
        pts: Number(pts) || 0,
      };
    })
    .filter(Boolean);
}

function normalizeChampionatTeamName(name) {
  return name.replace(/[«»]/g, "").replace(/\s+/g, " ").trim();
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:div|tr|td|th|li|p|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
