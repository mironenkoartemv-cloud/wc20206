import {
  BRACKET_LAYOUT,
  QUARTERFINAL_DEFS,
  ROUND16_DEFS,
  SEMIFINAL_DEFS,
} from "../shared/bracket-topology.mjs";

const EXPECTED_R16 = [
  ["r16-89", "m73", "m75"],
  ["r16-90", "m74", "m77"],
  ["r16-91", "m76", "m78"],
  ["r16-92", "m79", "m80"],
  ["r16-93", "m83", "m84"],
  ["r16-94", "m81", "m82"],
  ["r16-95", "m86", "m88"],
  ["r16-96", "m85", "m87"],
];

const EXPECTED_QF = [
  ["qf-97", "r16-89", "r16-90"],
  ["qf-98", "r16-93", "r16-94"],
  ["qf-99", "r16-91", "r16-92"],
  ["qf-100", "r16-95", "r16-96"],
];

const EXPECTED_SF = [
  ["sf-101", "qf-97", "qf-98"],
  ["sf-102", "qf-99", "qf-100"],
];

const EXPECTED_LAYOUT = [
  ["left", "r32", "m74,m77,m73,m75,m83,m84,m81,m82"],
  ["left", "r16", "r16-90,r16-89,r16-93,r16-94"],
  ["left", "qf", "qf-97,qf-98"],
  ["left", "sf", "sf-101"],
  ["center", "final", "m104,m103"],
  ["right", "sf", "sf-102"],
  ["right", "qf", "qf-99,qf-100"],
  ["right", "r16", "r16-91,r16-92,r16-95,r16-96"],
  ["right", "r32", "m76,m78,m79,m80,m86,m88,m85,m87"],
];

assertLinks(ROUND16_DEFS, EXPECTED_R16, "Round of 16");
assertLinks(QUARTERFINAL_DEFS, EXPECTED_QF, "Quarterfinals");
assertLinks(SEMIFINAL_DEFS, EXPECTED_SF, "Semifinals");

for (const [index, [side, key, matchIds]] of EXPECTED_LAYOUT.entries()) {
  const column = BRACKET_LAYOUT[index];
  assert(column, `Missing layout column ${index}`);
  assert(column.side === side, `Layout column ${index} side mismatch`);
  assert(column.key === key, `Layout column ${index} key mismatch`);
  assert(column.matchIds.join(",") === matchIds, `Layout column ${index} match order mismatch`);
}

console.log("Bracket topology OK: official match links and visual layout verified.");

function assertLinks(actual, expected, label) {
  assert(actual.length === expected.length, `${label}: expected ${expected.length} links, got ${actual.length}`);
  expected.forEach(([id, homeSourceId, awaySourceId], index) => {
    const item = actual[index];
    assert(item.id === id, `${label}: link ${index} id mismatch`);
    assert(item.homeSourceId === homeSourceId, `${label}: ${id} home source mismatch`);
    assert(item.awaySourceId === awaySourceId, `${label}: ${id} away source mismatch`);
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
