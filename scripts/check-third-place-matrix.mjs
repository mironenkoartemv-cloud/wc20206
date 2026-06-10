import {
  THIRD_PLACE_MATRIX,
  allocateThirdSlotsFor,
  getThirdPlaceMatrixKey,
} from "../shared/third-place-matrix.mjs";

const GROUP_IDS = "ABCDEFGHIJKL".split("");
const EXPECTED_COMBINATIONS = 495;
const ROUND32_THIRD_SLOTS = [
  "3A/B/C/D/F",
  "3C/D/F/G/H",
  "3C/E/F/H/I",
  "3E/H/I/J/K",
  "3B/E/F/I/J",
  "3A/E/H/I/J",
  "3E/F/G/I/J",
  "3D/E/I/J/L",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function combinations(items, size, start = 0, prefix = [], result = []) {
  if (prefix.length === size) {
    result.push([...prefix]);
    return result;
  }

  for (let index = start; index <= items.length - (size - prefix.length); index += 1) {
    prefix.push(items[index]);
    combinations(items, size, index + 1, prefix, result);
    prefix.pop();
  }

  return result;
}

const keys = Object.keys(THIRD_PLACE_MATRIX);
assert(keys.length === EXPECTED_COMBINATIONS, `Expected ${EXPECTED_COMBINATIONS} rows, got ${keys.length}`);
assert(new Set(keys).size === EXPECTED_COMBINATIONS, "Matrix keys must be unique");

for (const groups of combinations(GROUP_IDS, 8)) {
  const key = getThirdPlaceMatrixKey(groups);
  const row = THIRD_PLACE_MATRIX[key];
  assert(row, `Missing matrix row for ${key}`);

  const allocation = allocateThirdSlotsFor(groups);
  assert(allocation, `Missing allocation for ${key}`);

  const allocatedGroups = Object.values(allocation).sort();
  assert(allocatedGroups.join(",") === groups.join(","), `Allocation groups mismatch for ${key}`);

  for (const slot of ROUND32_THIRD_SLOTS) {
    const groupId = allocation[slot];
    assert(groupId, `Missing slot ${slot} for ${key}`);
    assert(slot.slice(1).split("/").includes(groupId), `Group ${groupId} is not allowed in slot ${slot} for ${key}`);
  }
}

console.log(`Third-place matrix OK: ${EXPECTED_COMBINATIONS} FIFA Annexe C combinations verified.`);
