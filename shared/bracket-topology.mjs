// Official FIFA World Cup 26 knockout bracket topology.
// Source: https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf

export const BRACKET_TOPOLOGY_SOURCE = {
  name: "FIFA World Cup 26 Match Schedule",
  url: "https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf",
};

export const ROUND16_DEFS = [
  linkDef("r16-89", "M89", "m73", "m75"),
  linkDef("r16-90", "M90", "m74", "m77"),
  linkDef("r16-91", "M91", "m76", "m78"),
  linkDef("r16-92", "M92", "m79", "m80"),
  linkDef("r16-93", "M93", "m83", "m84"),
  linkDef("r16-94", "M94", "m81", "m82"),
  linkDef("r16-95", "M95", "m86", "m88"),
  linkDef("r16-96", "M96", "m85", "m87"),
];

export const QUARTERFINAL_DEFS = [
  linkDef("qf-97", "M97", "r16-89", "r16-90"),
  linkDef("qf-98", "M98", "r16-93", "r16-94"),
  linkDef("qf-99", "M99", "r16-91", "r16-92"),
  linkDef("qf-100", "M100", "r16-95", "r16-96"),
];

export const SEMIFINAL_DEFS = [
  linkDef("sf-101", "M101", "qf-97", "qf-98"),
  linkDef("sf-102", "M102", "qf-99", "qf-100"),
];

export const BRACKET_LAYOUT = [
  { side: "left", key: "r32", matchIds: ["m74", "m77", "m73", "m75", "m83", "m84", "m81", "m82"] },
  { side: "left", key: "r16", matchIds: ["r16-90", "r16-89", "r16-93", "r16-94"] },
  { side: "left", key: "qf", matchIds: ["qf-97", "qf-98"] },
  { side: "left", key: "sf", matchIds: ["sf-101"] },
  { side: "center", key: "final", matchIds: ["m104", "m103"] },
  { side: "right", key: "sf", matchIds: ["sf-102"] },
  { side: "right", key: "qf", matchIds: ["qf-99", "qf-100"] },
  { side: "right", key: "r16", matchIds: ["r16-91", "r16-92", "r16-95", "r16-96"] },
  { side: "right", key: "r32", matchIds: ["m76", "m78", "m79", "m80", "m86", "m88", "m85", "m87"] },
];

function linkDef(id, code, homeSourceId, awaySourceId) {
  return { id, code, homeSourceId, awaySourceId };
}
