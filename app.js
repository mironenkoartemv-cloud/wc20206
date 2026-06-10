import { allocateThirdSlotsFor } from "./shared/third-place-matrix.mjs";
import {
  BRACKET_LAYOUT,
  QUARTERFINAL_DEFS,
  ROUND16_DEFS,
  SEMIFINAL_DEFS,
} from "./shared/bracket-topology.mjs";

const STORAGE_DRAFT = "wc2026-predictor-draft";
const STORAGE_PREDICTIONS = "wc2026-predictor-predictions";
const STORAGE_ACTUAL_RESULTS = "wc2026-actual-results";
const STORAGE_PLAYER_TOKEN = "wc2026-player-token";
const LIVE_REFRESH_INTERVAL_MS = 1000 * 60 * 5;
const NAME_CHECK_DEBOUNCE_MS = 300;
const API_BASE =
  typeof window !== "undefined" && ["3000", "5173", "5174"].includes(window.location?.port)
    ? "http://localhost:8787"
    : "";

const SCORING = {
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

const FLAG_CODES = {
  mexico: "mx",
  "south-korea": "kr",
  czechia: "cz",
  "south-africa": "za",
  canada: "ca",
  switzerland: "ch",
  qatar: "qa",
  bosnia: "ba",
  brazil: "br",
  morocco: "ma",
  scotland: "gb-sct",
  haiti: "ht",
  usa: "us",
  turkey: "tr",
  paraguay: "py",
  australia: "au",
  germany: "de",
  ecuador: "ec",
  "cote-divoire": "ci",
  curacao: "cw",
  netherlands: "nl",
  japan: "jp",
  sweden: "se",
  tunisia: "tn",
  belgium: "be",
  iran: "ir",
  egypt: "eg",
  "new-zealand": "nz",
  spain: "es",
  uruguay: "uy",
  "saudi-arabia": "sa",
  "cabo-verde": "cv",
  france: "fr",
  senegal: "sn",
  norway: "no",
  iraq: "iq",
  argentina: "ar",
  austria: "at",
  algeria: "dz",
  jordan: "jo",
  portugal: "pt",
  colombia: "co",
  uzbekistan: "uz",
  "dr-congo": "cd",
  england: "gb-eng",
  croatia: "hr",
  ghana: "gh",
  panama: "pa",
};

const GROUPS = [
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

const TEAM_BY_ID = Object.fromEntries(GROUPS.flatMap((group) => group.teams).map((item) => [item.id, item]));

const ROUND32_DEFS = [
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

const ROUND_NAMES = {
  r32: "1/16 финала",
  r16: "1/8 финала",
  qf: "1/4 финала",
  sf: "1/2 финала",
  final: "Финал",
  bronze: "3-е место",
};

const FLOW_STAGES = ["groups", "thirds", "bracket", "confirm", "live"];

const memoryStorage = new Map();
const state = loadDraft();
let flowStarted = false;
let dragged = null;
let liveRefreshTimer = null;
let backendMode = false;
let serverLeaderboard = null;
let serverActualResults = null;
let currentSavedPrediction = null;
let nameCheckTimer = null;
let nameCheckVersion = 0;

const nodes = {
  playerForm: document.querySelector("#playerForm"),
  playerName: document.querySelector("#playerName"),
  playerStart: document.querySelector("#playerStart"),
  predictionFlow: document.querySelector("#predictionFlow"),
  currentPlayer: document.querySelector("#currentPlayer"),
  groupsProgress: document.querySelector("#groupsProgress"),
  championProgress: document.querySelector("#championProgress"),
  thirdCounter: document.querySelector("#thirdCounter"),
  groupsGrid: document.querySelector("#groupsGrid"),
  thirdList: document.querySelector("#thirdList"),
  bracket: document.querySelector("#bracket"),
  savePrediction: document.querySelector("#savePrediction"),
  summaryTitle: document.querySelector("#summaryTitle"),
  summaryText: document.querySelector("#summaryText"),
  liveLeaderboard: document.querySelector("#liveLeaderboard"),
  refreshLive: document.querySelector("#refreshLive"),
  toThirds: document.querySelector("#toThirds"),
  backToGroups: document.querySelector("#backToGroups"),
  toBracket: document.querySelector("#toBracket"),
  backToThirds: document.querySelector("#backToThirds"),
  editBracket: document.querySelector("#editBracket"),
  goToLive: document.querySelector("#goToLive"),
  confirmChampionTeam: document.querySelector("#confirmChampionTeam"),
  savedSelection: document.querySelector("#savedSelection"),
  savedPredictionMeta: document.querySelector("#savedPredictionMeta"),
  savedGroups: document.querySelector("#savedGroups"),
  savedThirds: document.querySelector("#savedThirds"),
  savedBracket: document.querySelector("#savedBracket"),
  openLeaderboard: document.querySelector("#openLeaderboard"),
  closeLeaderboard: document.querySelector("#closeLeaderboard"),
  leaderboardModal: document.querySelector("#leaderboardModal"),
  leaderboard: document.querySelector("#leaderboard"),
  exportData: document.querySelector("#exportData"),
  resetPrediction: document.querySelector("#resetPrediction"),
};

boot();

function boot() {
  nodes.playerName.value = state.player?.name || "";
  nodes.playerForm.addEventListener("submit", handlePlayerSubmit);
  nodes.playerName.addEventListener("input", handlePlayerNameInput);
  nodes.toThirds?.addEventListener("click", () => setStage("thirds"));
  nodes.backToGroups?.addEventListener("click", () => setStage("groups"));
  nodes.toBracket?.addEventListener("click", handleBuildBracket);
  nodes.backToThirds?.addEventListener("click", () => setStage("thirds"));
  nodes.savePrediction?.addEventListener("click", savePrediction);
  nodes.editBracket?.addEventListener("click", () => setStage("bracket"));
  nodes.goToLive?.addEventListener("click", () => setStage("live"));
  nodes.refreshLive?.addEventListener("click", handleLiveRefresh);
  nodes.openLeaderboard?.addEventListener("click", openLeaderboard);
  nodes.closeLeaderboard?.addEventListener("click", () => nodes.leaderboardModal.close());
  nodes.exportData?.addEventListener("click", exportData);
  nodes.resetPrediction?.addEventListener("click", resetPrediction);

  render();
  handlePlayerNameInput();
  refreshActualResultsFromSource();
  liveRefreshTimer = window.setInterval(refreshActualResultsFromSource, LIVE_REFRESH_INTERVAL_MS);
}

function team(id, name, flag) {
  return { id, name, flag, flagCode: FLAG_CODES[id] };
}

function flagMarkup(item) {
  if (!item?.flagCode) return item?.flag || "·";
  return `<img class="flag-img" src="https://flagcdn.com/${item.flagCode}.svg" alt="" loading="lazy" decoding="async" />`;
}

function matchDef(id, home, away) {
  return { id: `m${id}`, code: `M${id}`, home, away };
}

function createInitialGroups() {
  return Object.fromEntries(GROUPS.map((group) => [group.id, group.teams.map((item) => item.id)]));
}

function loadDraft() {
  const fallback = {
    player: null,
    groups: createInitialGroups(),
    thirdGroups: [],
    picks: {},
    bracketBuilt: false,
    stage: "groups",
  };

  try {
    const draft = JSON.parse(readStorage(STORAGE_DRAFT));
    if (!draft) return fallback;
    return {
      ...fallback,
      ...draft,
      groups: { ...fallback.groups, ...(draft.groups || {}) },
      thirdGroups: draft.thirdGroups || [],
      picks: draft.picks || {},
      stage: FLOW_STAGES.includes(draft.stage) ? draft.stage : fallback.stage,
    };
  } catch {
    return fallback;
  }
}

function persistDraft() {
  writeStorage(STORAGE_DRAFT, JSON.stringify(state));
}

function readStorage(key) {
  try {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
  } catch {
    return memoryStorage.get(key) || null;
  }
  return memoryStorage.get(key) || null;
}

function writeStorage(key, value) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fallback below keeps the current tab usable when persistent storage is blocked.
  }
  memoryStorage.set(key, value);
}

function removeStorage(key) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
      return;
    }
  } catch {
    // Fallback below keeps memory storage in sync when persistent storage is blocked.
  }
  memoryStorage.delete(key);
}

async function apiRequest(path, options = {}) {
  if (typeof fetch !== "function") throw new Error("Fetch is unavailable");
  const headers = {
    "content-type": "application/json",
    ...(options.headers || {}),
  };
  const token = readStorage(STORAGE_PLAYER_TOKEN);
  if (token && !headers.authorization) headers.authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function checkPlayerNameAvailability(displayName) {
  return apiRequest(`/api/players/availability?displayName=${encodeURIComponent(displayName)}`);
}

function savePredictionToBackend(record) {
  return apiRequest("/api/predictions", {
    method: "POST",
    body: JSON.stringify({
      displayName: record.name,
      groups: record.groups,
      thirdGroups: record.thirdGroups,
      thirdPlaces: record.thirdGroups.map((groupId) => ({
        groupId,
        teamId: record.groups?.[groupId]?.[2],
      })),
      picks: record.picks,
      championTeamId: record.championId,
    }),
  });
}

function setStartButtonState({ disabled, message = "" }) {
  if (nodes.playerStart) nodes.playerStart.disabled = disabled;
  if (nodes.playerName) nodes.playerName.setCustomValidity(message);
}

function handlePlayerNameInput() {
  const name = nodes.playerName.value.trim();
  window.clearTimeout(nameCheckTimer);
  if (!name) {
    setStartButtonState({ disabled: true, message: "" });
    return;
  }

  const version = ++nameCheckVersion;
  setStartButtonState({ disabled: true, message: "" });
  nameCheckTimer = window.setTimeout(async () => {
    try {
      const response = await checkPlayerNameAvailability(name);
      if (version !== nameCheckVersion) return;
      if (response.available) {
        setStartButtonState({ disabled: false, message: "" });
        return;
      }
      setStartButtonState({
        disabled: true,
        message: "Игрок с таким именем уже сохранил прогноз.",
      });
    } catch {
      if (version !== nameCheckVersion) return;
      setStartButtonState({
        disabled: true,
        message: "Не удалось проверить имя. Попробуй еще раз.",
      });
    }
  }, NAME_CHECK_DEBOUNCE_MS);
}

async function ensurePlayerNameAvailable(displayName) {
  try {
    const response = await checkPlayerNameAvailability(displayName);
    if (response.available) {
      setStartButtonState({ disabled: false, message: "" });
      return true;
    }
    setStartButtonState({
      disabled: true,
      message: "Игрок с таким именем уже сохранил прогноз.",
    });
    nodes.playerName.reportValidity();
    return false;
  } catch {
    setStartButtonState({
      disabled: true,
      message: "Не удалось проверить имя. Попробуй еще раз.",
    });
    nodes.playerName.reportValidity();
    return false;
  }
}

async function syncBackendData() {
  const token = readStorage(STORAGE_PLAYER_TOKEN);
  const [leaderboard, actualResults, me] = await Promise.all([
    apiRequest("/api/leaderboard"),
    apiRequest("/api/actual-results"),
    token ? apiRequest("/api/me").catch(() => null) : Promise.resolve(null),
  ]);

  backendMode = true;
  serverLeaderboard = leaderboard;
  serverActualResults = actualResults.actualResults;
  if (me?.player) {
    state.player = {
      id: me.player.id,
      name: me.player.displayName,
      createdAt: me.player.createdAt || state.player?.createdAt || new Date().toISOString(),
    };
    flowStarted = true;
    nodes.playerName.value = state.player.name;
  }
  if (me) currentSavedPrediction = me.prediction;
}

async function handlePlayerSubmit(event) {
  event.preventDefault();
  const name = nodes.playerName.value.trim();
  if (!name) {
    nodes.playerName.focus();
    return;
  }

  if (!(await ensurePlayerNameAvailable(name))) return;

  removeStorage(STORAGE_PLAYER_TOKEN);
  backendMode = true;
  currentSavedPrediction = null;
  state.player = {
    id: `draft-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
  };

  state.stage = "groups";
  flowStarted = true;
  persistDraft();
  render();
  refreshActualResultsFromSource();
}

function render() {
  renderStatus();
  renderGroups();
  renderThirdPlaces();
  renderBracket();
  renderSummary();
  renderConfirmation();
  renderLiveLeaderboard();
  renderSavedPrediction();
}

function renderStatus() {
  if (nodes.predictionFlow) nodes.predictionFlow.hidden = !(state.player && flowStarted);
  if (nodes.currentPlayer) nodes.currentPlayer.textContent = state.player?.name || "не выбран";
  if (nodes.groupsProgress) nodes.groupsProgress.textContent = `${countTouchedGroups()}/12 групп изменено`;
  if (nodes.championProgress) nodes.championProgress.textContent = getChampion()
    ? `${getChampion().name} — выбранный чемпион`
    : "чемпион не выбран";
  if (nodes.thirdCounter) nodes.thirdCounter.textContent = `${state.thirdGroups.length}/8 выбрано`;
  if (nodes.toBracket) nodes.toBracket.disabled = state.thirdGroups.length !== 8;
  if (nodes.savePrediction) nodes.savePrediction.disabled = !isPredictionComplete();

  const activeStage = getActiveStage();
  document.querySelectorAll("[data-flow-stage]").forEach((stage) => {
    const active = stage.dataset.flowStage === activeStage;
    stage.hidden = !active;
    stage.classList.toggle("is-active", active);
  });
  document.querySelectorAll("[data-step-indicator]").forEach((step) => {
    const index = FLOW_STAGES.indexOf(step.dataset.stepIndicator);
    const activeIndex = FLOW_STAGES.indexOf(activeStage);
    step.classList.toggle("is-active", step.dataset.stepIndicator === activeStage);
    step.classList.toggle("is-done", index < activeIndex);
  });
}

function getActiveStage() {
  if (!state.player) return "groups";
  if (!FLOW_STAGES.includes(state.stage)) return "groups";
  if (state.stage === "bracket" && !state.bracketBuilt) return "thirds";
  if ((state.stage === "confirm" || state.stage === "live") && !getSavedCurrentPrediction()) return "bracket";
  return state.stage;
}

function setStage(stage) {
  if (!FLOW_STAGES.includes(stage)) return;
  state.stage = stage;
  persistDraft();
  render();
}

function countTouchedGroups() {
  return GROUPS.filter((group) => {
    const current = state.groups[group.id] || [];
    const initial = group.teams.map((item) => item.id);
    return current.some((id, index) => id !== initial[index]);
  }).length;
}

function renderGroups() {
  nodes.groupsGrid.innerHTML = "";
  GROUPS.forEach((group) => {
    const card = document.createElement("article");
    card.className = "group-card";
    card.innerHTML = `
      <div class="group-head">
        <h3>Группа ${group.id}</h3>
      </div>
      <div class="team-list" data-group="${group.id}"></div>
    `;

    const list = card.querySelector(".team-list");
    getGroupOrder(group.id).forEach((teamId, index) => {
      list.appendChild(createTeamRow(group.id, teamId, index));
    });

    nodes.groupsGrid.appendChild(card);
  });
}

function createTeamRow(groupId, teamId, index) {
  const row = document.createElement("div");
  const item = TEAM_BY_ID[teamId];
  row.className = "team-row";
  row.draggable = true;
  row.dataset.group = groupId;
  row.dataset.team = teamId;
  row.dataset.place = String(index + 1);
  row.innerHTML = `
    <span class="place-badge">${index + 1}</span>
    <span class="flag">${flagMarkup(item)}</span>
    <span class="team-name">${item.name}</span>
    <button class="move-button" type="button" aria-label="Поднять ${item.name}" ${index === 0 ? "disabled" : ""}>↑</button>
    <button class="move-button" type="button" aria-label="Опустить ${item.name}" ${index === 3 ? "disabled" : ""}>↓</button>
  `;

  const [up, down] = row.querySelectorAll(".move-button");
  up.addEventListener("click", () => moveTeam(groupId, teamId, -1));
  down.addEventListener("click", () => moveTeam(groupId, teamId, 1));

  row.addEventListener("dragstart", () => {
    dragged = { groupId, teamId };
    row.classList.add("dragging");
  });
  row.addEventListener("dragend", () => {
    dragged = null;
    row.classList.remove("dragging");
  });
  row.addEventListener("dragover", (event) => event.preventDefault());
  row.addEventListener("drop", (event) => {
    event.preventDefault();
    if (!dragged || dragged.groupId !== groupId || dragged.teamId === teamId) return;
    reorderTeam(groupId, dragged.teamId, teamId);
  });

  return row;
}

function moveTeam(groupId, teamId, direction) {
  const order = [...getGroupOrder(groupId)];
  const currentIndex = order.indexOf(teamId);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= order.length) return;
  [order[currentIndex], order[nextIndex]] = [order[nextIndex], order[currentIndex]];
  updateGroupOrder(groupId, order);
}

function reorderTeam(groupId, draggedTeamId, targetTeamId) {
  const order = [...getGroupOrder(groupId)];
  const from = order.indexOf(draggedTeamId);
  const to = order.indexOf(targetTeamId);
  if (from < 0 || to < 0) return;
  const [moved] = order.splice(from, 1);
  order.splice(to, 0, moved);
  updateGroupOrder(groupId, order);
}

function updateGroupOrder(groupId, order) {
  state.groups[groupId] = order;
  state.thirdGroups = state.thirdGroups.filter((id) => getThirdPlaceTeams().some((third) => third.groupId === id));
  state.bracketBuilt = false;
  state.picks = {};
  state.stage = "groups";
  persistDraft();
  render();
}

function getGroupOrder(groupId) {
  return state.groups[groupId] || GROUPS.find((group) => group.id === groupId).teams.map((item) => item.id);
}

function getTeamByPosition(position) {
  return getTeamByPositionFromGroups(position, state.groups);
}

function getTeamByPositionFromGroups(position, groups) {
  const [, place, groupId] = position.match(/^([123])([A-L])$/) || [];
  if (!place || !groupId) return null;
  return TEAM_BY_ID[groups?.[groupId]?.[Number(place) - 1]] || null;
}

function getThirdPlaceTeams() {
  return GROUPS.map((group) => ({
    groupId: group.id,
    team: TEAM_BY_ID[getGroupOrder(group.id)[2]],
  }));
}

function renderThirdPlaces() {
  const thirdTeams = getThirdPlaceTeams();
  nodes.thirdList.innerHTML = "";
  thirdTeams.forEach(({ groupId, team: item }) => {
    const card = document.createElement("label");
    const selected = state.thirdGroups.includes(groupId);
    card.className = `third-card${selected ? " selected" : ""}`;
    card.innerHTML = `
      <span class="flag">${flagMarkup(item)}</span>
      <span class="third-meta">
        <strong>${item.name}</strong>
      </span>
      <input type="checkbox" ${selected ? "checked" : ""} aria-label="Выбрать ${item.name}" />
    `;

    card.querySelector("input").addEventListener("change", (event) => {
      toggleThirdGroup(groupId, event.target.checked);
    });

    nodes.thirdList.appendChild(card);
  });
}

function toggleThirdGroup(groupId, checked) {
  const selected = new Set(state.thirdGroups);
  if (checked && selected.size >= 8) {
    alert("Можно выбрать только 8 команд с третьих мест.");
    renderThirdPlaces();
    return;
  }

  if (checked) selected.add(groupId);
  else selected.delete(groupId);

  state.thirdGroups = [...selected].sort();
  state.bracketBuilt = false;
  state.picks = {};
  state.stage = "thirds";
  persistDraft();
  render();
}

function handleBuildBracket() {
  if (state.thirdGroups.length !== 8) {
    alert("Для сетки нужно выбрать ровно 8 третьих мест.");
    return;
  }

  const allocation = allocateThirdSlots();
  if (!allocation) {
    alert("Эта комбинация третьих мест не раскладывается по текущей сетке. Измени выбор и попробуй еще раз.");
    return;
  }

  if (!state.bracketBuilt) state.picks = {};
  state.bracketBuilt = true;
  state.stage = "bracket";
  persistDraft();
  render();
}

function allocateThirdSlots() {
  return allocateThirdSlotsFor(state.thirdGroups);
}

function getBracketRounds() {
  if (!state.bracketBuilt || state.thirdGroups.length !== 8) return [];
  const thirdAllocation = allocateThirdSlots();
  if (!thirdAllocation) return [];

  const r32 = ROUND32_DEFS.map((def) =>
    createMatch(def.id, def.code, ROUND_NAMES.r32, resolveSlot(def.home, thirdAllocation), resolveSlot(def.away, thirdAllocation)),
  );
  const r16 = createLinkedRound(ROUND16_DEFS, ROUND_NAMES.r16, r32);
  const qf = createLinkedRound(QUARTERFINAL_DEFS, ROUND_NAMES.qf, r16);
  const sf = createLinkedRound(SEMIFINAL_DEFS, ROUND_NAMES.sf, qf);
  const final = [createMatch("m104", "M104", ROUND_NAMES.final, getWinner(sf[0]), getWinner(sf[1]))];
  const bronze = [createMatch("m103", "M103", ROUND_NAMES.bronze, getLoser(sf[0]), getLoser(sf[1]))];

  cleanupInvalidPicks([...r32, ...r16, ...qf, ...sf, ...final, ...bronze]);
  return [
    { key: "r32", title: ROUND_NAMES.r32, matches: r32 },
    { key: "r16", title: ROUND_NAMES.r16, matches: r16 },
    { key: "qf", title: ROUND_NAMES.qf, matches: qf },
    { key: "sf", title: ROUND_NAMES.sf, matches: sf },
    { key: "final", title: ROUND_NAMES.final, matches: [...final, ...bronze] },
  ];
}

function resolveSlot(slot, thirdAllocation) {
  if (slot.startsWith("3")) {
    const groupId = thirdAllocation[slot];
    if (!groupId) return null;
    return TEAM_BY_ID[getGroupOrder(groupId)[2]];
  }
  return getTeamByPosition(slot);
}

function resolveSlotForPrediction(slot, thirdAllocation, groups) {
  if (slot.startsWith("3")) {
    const groupId = thirdAllocation[slot];
    if (!groupId) return null;
    return TEAM_BY_ID[groups?.[groupId]?.[2]] || null;
  }
  return getTeamByPositionFromGroups(slot, groups);
}

function createLinkedRound(defs, title, previousRound) {
  const previousById = indexMatchesById(previousRound);
  return defs.map((def) =>
    createMatch(
      def.id,
      def.code,
      title,
      getWinner(previousById.get(def.homeSourceId)),
      getWinner(previousById.get(def.awaySourceId)),
    ),
  );
}

function indexMatchesById(matches) {
  return new Map(matches.map((match) => [match.id, match]));
}

function createMatch(id, code, title, home, away) {
  return {
    id,
    code,
    title,
    home,
    away,
    winnerId: state.picks[id] || null,
  };
}

function createSavedMatch(id, code, title, home, away, picks) {
  return {
    id,
    code,
    title,
    home,
    away,
    winnerId: picks?.[id] || null,
  };
}

function getBracketRoundsFromPrediction(record) {
  if (!record?.groups || !record.thirdGroups?.length) return [];
  const thirdAllocation = allocateThirdSlotsFor(record.thirdGroups);
  if (!thirdAllocation) return [];

  const r32 = ROUND32_DEFS.map((def) =>
    createSavedMatch(
      def.id,
      def.code,
      ROUND_NAMES.r32,
      resolveSlotForPrediction(def.home, thirdAllocation, record.groups),
      resolveSlotForPrediction(def.away, thirdAllocation, record.groups),
      record.picks,
    ),
  );
  const r16 = createSavedLinkedRound(ROUND16_DEFS, ROUND_NAMES.r16, r32, record.picks);
  const qf = createSavedLinkedRound(QUARTERFINAL_DEFS, ROUND_NAMES.qf, r16, record.picks);
  const sf = createSavedLinkedRound(SEMIFINAL_DEFS, ROUND_NAMES.sf, qf, record.picks);
  const final = [createSavedMatch("m104", "M104", ROUND_NAMES.final, getWinner(sf[0]), getWinner(sf[1]), record.picks)];
  const bronze = [createSavedMatch("m103", "M103", ROUND_NAMES.bronze, getLoser(sf[0]), getLoser(sf[1]), record.picks)];

  return [
    { key: "r32", title: ROUND_NAMES.r32, matches: r32 },
    { key: "r16", title: ROUND_NAMES.r16, matches: r16 },
    { key: "qf", title: ROUND_NAMES.qf, matches: qf },
    { key: "sf", title: ROUND_NAMES.sf, matches: sf },
    { key: "final", title: ROUND_NAMES.final, matches: [...final, ...bronze] },
  ];
}

function createSavedLinkedRound(defs, title, previousRound, picks) {
  const previousById = indexMatchesById(previousRound);
  return defs.map((def) =>
    createSavedMatch(
      def.id,
      def.code,
      title,
      getWinner(previousById.get(def.homeSourceId)),
      getWinner(previousById.get(def.awaySourceId)),
      picks,
    ),
  );
}

function getWinner(match) {
  if (!match?.winnerId) return null;
  if (match.home?.id === match.winnerId) return match.home;
  if (match.away?.id === match.winnerId) return match.away;
  return null;
}

function getLoser(match) {
  if (!match?.winnerId || !match.home || !match.away) return null;
  if (match.home.id === match.winnerId) return match.away;
  if (match.away.id === match.winnerId) return match.home;
  return null;
}

function cleanupInvalidPicks(matches) {
  let changed = false;
  matches.forEach((match) => {
    const picked = state.picks[match.id];
    if (!picked) return;
    if (match.home?.id !== picked && match.away?.id !== picked) {
      delete state.picks[match.id];
      changed = true;
    }
  });
  if (changed) persistDraft();
}

function renderBracket() {
  nodes.bracket.innerHTML = "";
  const rounds = getBracketRounds();

  if (!rounds.length) {
    nodes.bracket.className = "bracket";
    const empty = document.createElement("div");
    empty.className = "bracket-empty";
    empty.textContent = "Выбери 8 третьих мест и нажми «Далее».";
    nodes.bracket.appendChild(empty);
    return;
  }

  const layout = buildBracketLayout(rounds);

  nodes.bracket.className = "bracket bracket-tree";
  layout.forEach((column) => {
    const element = document.createElement("div");
    element.className = `round ${column.side}`;
    element.innerHTML = `<h3>${column.title}</h3>`;
    column.matches.forEach((match) => element.appendChild(renderMatch(match)));
    nodes.bracket.appendChild(element);
  });
}

function buildBracketLayout(rounds) {
  const byKey = Object.fromEntries(rounds.map((round) => [round.key, round]));
  const byId = indexMatchesById(rounds.flatMap((round) => round.matches));
  return BRACKET_LAYOUT.map((column) => ({
    side: column.side,
    title: byKey[column.key]?.title || "",
    matches: column.matchIds.map((matchId) => byId.get(matchId)).filter(Boolean),
  }));
}

function renderMatch(match) {
  const card = document.createElement("article");
  card.className = "match";
  card.dataset.code = match.code;
  card.innerHTML = `<div class="match-title">${match.title}</div>`;
  card.appendChild(renderPickButton(match, match.home));
  card.appendChild(renderPickButton(match, match.away));
  return card;
}

function renderPickButton(match, item) {
  const button = document.createElement("button");
  button.className = `pick-row${item && state.picks[match.id] === item.id ? " selected" : ""}`;
  button.type = "button";
  button.disabled = !item;
  button.innerHTML = item
    ? `<span class="flag">${flagMarkup(item)}</span><span>${item.name}</span>`
    : `<span class="flag">·</span><span>ожидает победителя</span>`;
  if (item) {
    button.addEventListener("click", () => pickWinner(match.id, item.id));
  }
  return button;
}

function pickWinner(matchId, teamId) {
  state.picks[matchId] = teamId;
  persistDraft();
  renderBracket();
  renderStatus();
  renderSummary();
}

function getChampion() {
  if (!state.bracketBuilt) return null;
  const rounds = getBracketRounds();
  const finalRound = rounds.find((round) => round.key === "final");
  const final = finalRound?.matches.find((match) => match.id === "m104");
  return getWinner(final);
}

function renderSummary() {
  const champion = getChampion();
  const complete = isPredictionComplete();

  if (nodes.savePrediction) nodes.savePrediction.disabled = !complete;
  if (complete) {
    nodes.summaryTitle.textContent = `${champion.name} — чемпион по прогнозу ${state.player.name}`;
    nodes.summaryText.textContent = "Прогноз заполнен полностью. Его можно сохранить.";
    return;
  }

  nodes.summaryTitle.textContent = "Прогноз пока не завершен";
  if (!state.player) nodes.summaryText.textContent = "Сначала укажи имя игрока.";
  else if (state.thirdGroups.length !== 8) nodes.summaryText.textContent = "Выбери восемь лучших третьих мест.";
  else if (!state.bracketBuilt) nodes.summaryText.textContent = "Построй сетку плей-офф.";
  else nodes.summaryText.textContent = "Докликай победителей всех матчей до чемпиона.";
}

function isPredictionComplete() {
  if (!state.player || state.thirdGroups.length !== 8 || !state.bracketBuilt || !getChampion()) return false;
  return getBracketRounds()
    .flatMap((round) => round.matches)
    .every((match) => match.home && match.away && state.picks[match.id]);
}

function getSavedCurrentPrediction() {
  if (!state.player) return null;
  if (backendMode) return currentSavedPrediction;
  return getPredictions().find((record) => record.id === state.player.id) || null;
}

function renderConfirmation(record = getSavedCurrentPrediction()) {
  const champion = record?.championName || getChampion()?.name || "—";
  if (nodes.confirmChampionTeam) nodes.confirmChampionTeam.textContent = champion;
}

async function savePrediction() {
  const champion = getChampion();
  if (!state.player || !champion || !isPredictionComplete()) return;
  const record = {
    id: state.player.id,
    name: state.player.name,
    savedAt: new Date().toISOString(),
    groups: Object.fromEntries(GROUPS.map((group) => [group.id, [...getGroupOrder(group.id)]])),
    thirdGroups: [...state.thirdGroups],
    picks: { ...state.picks },
    championId: champion.id,
    championName: champion.name,
  };

  try {
    const response = await savePredictionToBackend(record);
    backendMode = true;
    if (response.accessToken) writeStorage(STORAGE_PLAYER_TOKEN, response.accessToken);
    if (response.player) {
      state.player = {
        id: response.player.id,
        name: response.player.displayName,
        createdAt: response.player.createdAt || state.player.createdAt,
      };
    }
    currentSavedPrediction = response.prediction;
    state.stage = "confirm";
    persistDraft();
    renderConfirmation(currentSavedPrediction);
    await refreshActualResultsFromSource();
    renderSavedPrediction(currentSavedPrediction);
    renderStatus();
    return;
  } catch (error) {
    if (error.status === 409 || error.payload?.error === "prediction_locked" || error.payload?.error === "player_exists") {
      backendMode = true;
      currentSavedPrediction = error.payload?.prediction || currentSavedPrediction;
      state.stage = "confirm";
      persistDraft();
      renderConfirmation(currentSavedPrediction);
      renderSavedPrediction(currentSavedPrediction);
      renderStatus();
      return;
    }
    console.warn("Backend save failed.", error);
    if (nodes.summaryTitle) nodes.summaryTitle.textContent = "Не удалось сохранить прогноз";
    if (nodes.summaryText) nodes.summaryText.textContent = error.payload?.message || "Проверь подключение к серверу и попробуй еще раз.";
  }
}

function getPredictions() {
  try {
    return JSON.parse(readStorage(STORAGE_PREDICTIONS)) || [];
  } catch {
    return [];
  }
}

function getActualResults() {
  if (backendMode) return serverActualResults;
  try {
    return JSON.parse(readStorage(STORAGE_ACTUAL_RESULTS)) || null;
  } catch {
    return null;
  }
}

async function refreshActualResultsFromSource({ refreshProvider = false } = {}) {
  try {
    if (refreshProvider) {
      await apiRequest("/api/results/refresh", { method: "POST" });
    }
    await syncBackendData();
    renderStatus();
    renderConfirmation();
    renderLiveLeaderboard();
    renderSavedPrediction();
    return;
  } catch (error) {
    backendMode = false;
  }

  renderLiveLeaderboard();
  renderSavedPrediction();
}

async function handleLiveRefresh() {
  if (!nodes.refreshLive || nodes.refreshLive.disabled) return;
  nodes.refreshLive.disabled = true;
  nodes.refreshLive.textContent = "Обновляем";

  try {
    await refreshActualResultsFromSource({ refreshProvider: true });
  } finally {
    nodes.refreshLive.disabled = false;
    nodes.refreshLive.textContent = "Обновить";
  }
}

function renderLiveLeaderboard() {
  if (!nodes.liveLeaderboard) return;

  if (backendMode && serverLeaderboard) {
    nodes.liveLeaderboard.innerHTML = "";
    if (!serverLeaderboard.rows.length) {
      const empty = document.createElement("div");
      empty.className = "live-empty";
      empty.textContent = "Сохрани первый прогноз, чтобы он появился в таблице.";
      nodes.liveLeaderboard.appendChild(empty);
      return;
    }

    serverLeaderboard.rows.forEach((record) => {
      const row = document.createElement("div");
      row.className = "live-row";
      row.innerHTML = `
        <strong>${record.rank}</strong>
        <span>${record.displayName}</span>
        <span>${record.championName || "чемпион не выбран"}</span>
        <strong>${record.totalPoints}</strong>
      `;
      nodes.liveLeaderboard.appendChild(row);
    });
    return;
  }

  const actual = getActualResults();
  const predictions = getPredictions()
    .map((record) => ({
      ...record,
      score: calculateLiveScore(record, actual),
    }))
    .sort((a, b) => b.score - a.score || new Date(a.savedAt) - new Date(b.savedAt));

  nodes.liveLeaderboard.innerHTML = "";
  if (!predictions.length) {
    const empty = document.createElement("div");
    empty.className = "live-empty";
    empty.textContent = "Сохрани первый прогноз, чтобы он появился в таблице.";
    nodes.liveLeaderboard.appendChild(empty);
    return;
  }

  predictions.forEach((record, index) => {
    const row = document.createElement("div");
    row.className = "live-row";
    row.innerHTML = `
      <strong>${index + 1}</strong>
      <span>${record.name}</span>
      <span>${record.championName || "чемпион не выбран"}</span>
      <strong>${record.score}</strong>
    `;
    nodes.liveLeaderboard.appendChild(row);
  });
}

function renderSavedPrediction(record = getSavedCurrentPrediction()) {
  if (!nodes.savedSelection) return;
  if (!record) {
    nodes.savedSelection.hidden = true;
    return;
  }

  nodes.savedSelection.hidden = false;
  if (nodes.savedPredictionMeta) {
    const savedAt = record.savedAt ? ` · сохранено ${formatDate(record.savedAt)}` : "";
    nodes.savedPredictionMeta.textContent = `${record.name || "Игрок"} · ваш чемпион ${record.championName || "—"}${savedAt}`;
  }
  renderSavedGroups(record);
  renderSavedThirds(record);
  renderSavedBracket(record);
}

function renderSavedGroups(record) {
  if (!nodes.savedGroups) return;
  nodes.savedGroups.innerHTML = "";

  GROUPS.forEach((group) => {
    const card = document.createElement("div");
    card.className = "saved-group";
    card.innerHTML = `<h5>Группа ${group.id}</h5>`;

    (record.groups?.[group.id] || []).forEach((teamId, index) => {
      const item = TEAM_BY_ID[teamId];
      const row = document.createElement("div");
      row.className = "saved-team-row";
      row.innerHTML = item
        ? `<span>${index + 1}</span><span class="flag">${flagMarkup(item)}</span><span>${item.name}</span>`
        : `<span>${index + 1}</span><span class="flag">·</span><span>не выбрано</span>`;
      card.appendChild(row);
    });

    nodes.savedGroups.appendChild(card);
  });
}

function renderSavedThirds(record) {
  if (!nodes.savedThirds) return;
  nodes.savedThirds.innerHTML = "";

  (record.thirdGroups || []).forEach((groupId) => {
    const item = TEAM_BY_ID[record.groups?.[groupId]?.[2]];
    const card = document.createElement("div");
    card.className = "saved-third";
    card.innerHTML = item
      ? `<span class="flag">${flagMarkup(item)}</span><strong>${item.name}</strong>`
      : `<span class="flag">·</span><strong>не выбрано</strong>`;
    nodes.savedThirds.appendChild(card);
  });
}

function renderSavedBracket(record) {
  if (!nodes.savedBracket) return;
  nodes.savedBracket.innerHTML = "";

  const rounds = getBracketRoundsFromPrediction(record);
  if (!rounds.length) {
    const empty = document.createElement("div");
    empty.className = "live-empty";
    empty.textContent = "Сетка пока не сохранена.";
    nodes.savedBracket.appendChild(empty);
    return;
  }

  const tree = document.createElement("div");
  tree.className = "saved-bracket-tree";
  buildBracketLayout(rounds).forEach((round) => {
    const column = document.createElement("div");
    column.className = `saved-bracket-round ${round.side}`;
    column.innerHTML = `<h5>${round.title}</h5>`;
    round.matches.forEach((match) => column.appendChild(renderSavedMatch(match)));
    tree.appendChild(column);
  });
  nodes.savedBracket.appendChild(tree);
}

function renderSavedMatch(match) {
  const card = document.createElement("div");
  card.className = "saved-match";
  card.appendChild(renderSavedPick(match.home, match.winnerId));
  card.appendChild(renderSavedPick(match.away, match.winnerId));
  return card;
}

function renderSavedPick(item, winnerId) {
  const row = document.createElement("div");
  row.className = `saved-pick${item?.id === winnerId ? " selected" : ""}`;
  row.innerHTML = item
    ? `<span class="flag">${flagMarkup(item)}</span><span>${item.name}</span>`
    : `<span class="flag">·</span><span>ожидает победителя</span>`;
  return row;
}

function calculateLiveScore(record, actual) {
  if (!actual) return 0;
  let score = 0;

  if (actual.groups && record.groups) {
    GROUPS.forEach((group) => {
      const predicted = record.groups[group.id] || [];
      const real = actual.groups[group.id] || [];
      const exactPlaces = predicted.filter((teamId, index) => real[index] === teamId).length;
      if (exactPlaces === 4) score += SCORING.fullGroup;
      else if (exactPlaces === 2) score += SCORING.twoGroupPlaces;
      else if (exactPlaces === 1) score += SCORING.oneGroupPlace;
    });
  }

  if (actual.thirdGroups && record.thirdGroups) {
    const realThirdTeamIds = new Set(
      actual.thirdGroups.map((groupId) => actual.groups?.[groupId]?.[2]).filter(Boolean),
    );
    record.thirdGroups.forEach((groupId) => {
      const predictedThirdTeamId = record.groups?.[groupId]?.[2];
      if (realThirdTeamIds.has(predictedThirdTeamId)) score += SCORING.bestThird;
    });
  }

  if (actual.picks && record.picks) {
    Object.entries(record.picks).forEach(([matchId, teamId]) => {
      if (actual.picks[matchId] !== teamId) return;
      score += getMatchScore(matchId);
    });
  }

  return score;
}

function getMatchScore(matchId) {
  const number = Number(matchId.match(/(?:m|-)(\d+)$/)?.[1] || 0);
  if (matchId === "m104") return SCORING.champion;
  if (matchId === "m103") return SCORING.bronzeWinner;
  if (number >= 73 && number <= 88) return SCORING.r32Winner;
  if (number >= 89 && number <= 96) return SCORING.r16Winner;
  if (number >= 97 && number <= 100) return SCORING.qfWinner;
  if (number >= 101 && number <= 102) return SCORING.sfWinner;
  return 0;
}

function openLeaderboard() {
  renderLeaderboard();
  nodes.leaderboardModal.showModal();
}

function renderLeaderboard() {
  const predictions = getPredictions();
  nodes.leaderboard.innerHTML = "";
  if (!predictions.length) {
    nodes.leaderboard.textContent = "Пока нет сохраненных прогнозов.";
    return;
  }

  predictions.forEach((record, index) => {
    const row = document.createElement("div");
    row.className = "leader-row";
    row.innerHTML = `
      <strong>${index + 1}</strong>
      <strong>${record.name}</strong>
      <span>${record.championName}</span>
      <span>${formatDate(record.savedAt)}</span>
    `;
    nodes.leaderboard.appendChild(row);
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function exportData() {
  const payload = {
    draft: state,
    predictions: getPredictions(),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wc-2026-predictions.json";
  link.click();
  URL.revokeObjectURL(url);
}

function resetPrediction() {
  if (!confirm("Сбросить текущий черновик прогноза? Сохраненные прогнозы останутся в таблице.")) return;
  const fresh = {
    player: null,
    groups: createInitialGroups(),
    thirdGroups: [],
    picks: {},
    bracketBuilt: false,
    stage: "groups",
  };
  Object.assign(state, fresh);
  flowStarted = false;
  persistDraft();
  nodes.playerName.value = "";
  render();
}
