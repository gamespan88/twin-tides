// scenes.js — TWIN TIDES scene data: six illustrated coastal scenes, each a deterministic
// list of drawable elements. The left panel draws the list as-is; the right panel draws the
// same list with exactly nine mutations applied (see diffsFor). One scene graph, two renders,
// so the panels are near-identical except for the nine differences.
//
// Scene coordinate space: SW x SH, drawn 1:1 into each panel.

export const SW = 600;
export const SH = 624;

export function mulberry(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
const between = (r, lo, hi) => lo + r() * (hi - lo);

// Element: {id, kind, x, y, s(scale), c, c2, flip, n(extra count)}
function el(id, kind, x, y, o = {}) {
  return Object.assign({ id, kind, x, y, s: 1, c: '#ffffff', c2: '#33404f', flip: false, n: 3 }, o);
}

// Kinds a difference may target (big enough to be fair), with base region radius.
export const DIFF_KINDS = {
  boat: 46, house: 48, lighthouse: 50, tree: 40, palm: 44, person: 34, stall: 48,
  lantern: 34, umbrella: 42, buoy: 34, ball: 32, cloud: 46, sign: 38, kite: 36,
  rock: 36, fish: 32, crab: 30, flag: 36,
};

const MUTATIONS = ['color', 'remove', 'scale', 'move', 'flip', 'detail', 'remove', 'color', 'move'];

// Build the nine differences for a scene: candidates spread evenly across the picture by x,
// mutation types cycled, regions kept off the very edges. Deterministic per scene.
export function diffsFor(scene) {
  const cand = scene.elements
    .filter((e) => DIFF_KINDS[e.kind] && e.x > 56 && e.x < SW - 56 && e.y > 64 && e.y < SH - 56)
    .slice()
    .sort((a, b) => a.x - b.x);
  const diffs = [];
  const used = new Set();
  for (let i = 0; i < 9; i++) {
    const idx = Math.floor(((i + 0.5) / 9) * cand.length);
    let e = cand[idx];
    let guard = 0;
    while (e && used.has(e.id) && guard++ < cand.length) e = cand[(idx + guard) % cand.length];
    if (!e || used.has(e.id)) continue;
    used.add(e.id);
    diffs.push({
      id: 'd' + i,
      obj: e.id,
      kind: e.kind,
      x: e.x,
      y: e.y,
      r: Math.max(32, Math.min(54, DIFF_KINDS[e.kind] * (0.8 + e.s * 0.25))),
      mut: MUTATIONS[i % MUTATIONS.length],
      alt: ALT_COLORS[i % ALT_COLORS.length],
    });
  }
  return diffs;
}

const ALT_COLORS = ['#ff5964', '#ffd23f', '#3ec1d3', '#9b5de5', '#f15bb5', '#00c9a7', '#ff9f1c', '#4cc9f0', '#e63946'];

// Apply one mutation to a cloned element (right panel only). Returns null when removed.
export function mutated(elx, diff) {
  const e = Object.assign({}, elx);
  switch (diff.mut) {
    case 'remove': return null;
    case 'color': e.c = diff.alt; break;
    case 'detail': e.c2 = diff.alt; e.n = (e.n + 1) % 5 + 2; break;
    case 'scale': e.s = e.s * 1.5; break;
    case 'move': e.x += 34; e.y -= 14; break;
    case 'flip': e.flip = !e.flip; break;
  }
  return e;
}

// ---------------------------------------------------------------- scene builders
// Each builder returns 44+ elements. Layered bands: sky (y<210), shore (210-430), front (430-624).

function skySet(els, r, id, o) {
  const n = o.clouds ?? 4;
  for (let i = 0; i < n; i++) els.push(el(id(), 'cloud', between(r, 50, 550), between(r, 28, 120), { s: between(r, 0.8, 1.5), c: o.cloudC }));
  if (o.sun) els.push(el(id(), 'sun', o.sun[0], o.sun[1], { s: 1.2, c: o.sunC, c2: o.sunC2 }));
  if (o.moon) els.push(el(id(), 'moon', o.moon[0], o.moon[1], { s: 1.1, c: '#f4f1de' }));
  const stars = o.stars ?? 0;
  for (let i = 0; i < stars; i++) els.push(el(id(), 'star', between(r, 16, 584), between(r, 14, 170), { s: between(r, 0.5, 1), c: '#ffe66d' }));
  const birds = o.birds ?? 3;
  for (let i = 0; i < birds; i++) els.push(el(id(), 'bird', between(r, 60, 540), between(r, 40, 150), { s: between(r, 0.7, 1.2), c: o.birdC || '#33404f' }));
}

function waterSet(els, r, id, o) {
  const boats = o.boats ?? 3;
  for (let i = 0; i < boats; i++)
    els.push(el(id(), 'boat', between(r, 60, 540), between(r, o.y0, o.y1), { s: between(r, 0.8, 1.35), c: pick(r, o.boatC), c2: pick(r, o.sailC), flip: r() < 0.5 }));
  const buoys = o.buoys ?? 3;
  for (let i = 0; i < buoys; i++) els.push(el(id(), 'buoy', between(r, 40, 560), between(r, o.y0 + 30, o.y1 + 44), { s: between(r, 0.8, 1.1), c: pick(r, ['#e63946', '#ffd23f', '#ffffff']) }));
  const fish = o.fish ?? 2;
  for (let i = 0; i < fish; i++) els.push(el(id(), 'fish', between(r, 50, 550), between(r, o.y1 + 46, o.y1 + 96), { s: between(r, 0.8, 1.2), c: pick(r, ['#ff9f1c', '#4cc9f0', '#f15bb5']), flip: r() < 0.5 }));
}

function shoreSet(els, r, id, o) {
  const houses = o.houses ?? 0;
  for (let i = 0; i < houses; i++)
    els.push(el(id(), 'house', 52 + i * (496 / Math.max(1, houses - 1 || 1)) + between(r, -12, 12), between(r, o.y0, o.y0 + 26), { s: between(r, 0.9, 1.2), c: pick(r, o.houseC), c2: pick(r, o.roofC), n: 2 + Math.floor(r() * 3) }));
  const trees = o.trees ?? 0;
  for (let i = 0; i < trees; i++) els.push(el(id(), 'tree', between(r, 36, 564), between(r, o.y0 + 6, o.y0 + 60), { s: between(r, 0.8, 1.3), c: pick(r, o.treeC) }));
  const palms = o.palms ?? 0;
  for (let i = 0; i < palms; i++) els.push(el(id(), 'palm', between(r, 36, 564), between(r, o.y0 + 10, o.y0 + 66), { s: between(r, 0.85, 1.3), c: pick(r, o.treeC) }));
  const people = o.people ?? 0;
  for (let i = 0; i < people; i++)
    els.push(el(id(), 'person', between(r, 30, 570), between(r, o.y1, o.y1 + 60), { s: between(r, 0.85, 1.15), c: pick(r, o.shirtC), c2: pick(r, o.hatC) }));
  const signs = o.signs ?? 0;
  for (let i = 0; i < signs; i++) els.push(el(id(), 'sign', between(r, 50, 550), between(r, o.y0 + 20, o.y0 + 70), { s: 1, c: pick(r, o.signC), c2: '#ffffff' }));
}

function buildScene(def) {
  const r = mulberry(def.seed);
  const els = [];
  let n = 0;
  const id = () => 'e' + n++;
  def.build(els, r, id);
  return Object.assign({}, def.head, { elements: els });
}

const BOATS = ['#e63946', '#1d3557', '#2a9d8f', '#e9c46a', '#ffffff'];
const SAILS = ['#ffffff', '#ffd23f', '#f4a261', '#a8dadc', '#ffb4a2'];
const SHIRTS = ['#e63946', '#ffd23f', '#3ec1d3', '#9b5de5', '#f15bb5', '#2a9d8f', '#ff9f1c'];
const HATS = ['#ffffff', '#e63946', '#1d3557', '#ffd23f', '#2a9d8f'];

export const SCENES = [
  buildScene({
    seed: 1101,
    head: { name: 'Dawn Harbour', sub: 'gold light, first boats out', bg: 'harbour', pvY: 40, pal: { skyTop: '#f7b267', skyBot: '#f4845f', sea: '#2a9d8f', seaDark: '#1d7874', ground: '#e9c46a', trim: '#7f5539' } },
    build(els, r, id) {
      skySet(els, r, id, { clouds: 4, cloudC: '#ffe8d6', sun: [492, 74], sunC: '#ffd23f', sunC2: '#ff9f1c', birds: 4 });
      waterSet(els, r, id, { boats: 6, buoys: 4, fish: 3, y0: 268, y1: 330, boatC: BOATS, sailC: SAILS });
      shoreSet(els, r, id, { houses: 5, y0: 196, houseC: ['#fff3e4', '#ffe0b5', '#ffd6a5', '#fefae0'], roofC: ['#bc4749', '#7f5539', '#386641'], trees: 3, treeC: ['#386641', '#588157'], people: 5, y1: 452, shirtC: SHIRTS, hatC: HATS, signs: 2, signC: ['#bc4749', '#1d7874'] });
      els.push(el(id(), 'lighthouse', 556, 300, { s: 0.95, c: '#ffffff', c2: '#e63946' }));
      els.push(el(id(), 'flag', 84, 208, { s: 1, c: '#e63946' }));
      els.push(el(id(), 'kite', 210, 96, { s: 0.95, c: '#3ec1d3', c2: '#ffd23f' }));
      els.push(el(id(), 'crab', 330, 560, { s: 1, c: '#e63946' }));
      els.push(el(id(), 'ball', 470, 520, { s: 1.1, c: '#ff5964', c2: '#ffffff' }));
      els.push(el(id(), 'ball', 120, 545, { s: 0.95, c: '#3ec1d3', c2: '#ffffff' }));
      els.push(el(id(), 'crab', 520, 585, { s: 0.9, c: '#ff9f1c' }));
      els.push(el(id(), 'rock', 150, 420, { s: 1.1, c: '#8d8577' }));
      els.push(el(id(), 'rock', 452, 428, { s: 0.9, c: '#8d8577' }));
    },
  }),
  buildScene({
    seed: 2202,
    head: { name: 'Lighthouse Point', sub: 'violet dusk, the beam sweeps', bg: 'point', pvY: 30, pal: { skyTop: '#3a2e5c', skyBot: '#9b5de5', sea: '#27396b', seaDark: '#1b2547', ground: '#4a4360', trim: '#ffd23f' } },
    build(els, r, id) {
      skySet(els, r, id, { clouds: 3, cloudC: '#cdb4db', moon: [86, 66], stars: 16, birds: 2, birdC: '#1b2547' });
      els.push(el(id(), 'lighthouse', 300, 268, { s: 1.9, c: '#f1fa8c', c2: '#e63946' }));
      waterSet(els, r, id, { boats: 4, buoys: 4, fish: 2, y0: 356, y1: 408, boatC: BOATS, sailC: SAILS });
      shoreSet(els, r, id, { houses: 3, y0: 226, houseC: ['#e0d7f5', '#cdb4db', '#b8b8ff'], roofC: ['#3a2e5c', '#5a189a'], trees: 4, treeC: ['#2d6a4f', '#40916c'], people: 4, y1: 470, shirtC: SHIRTS, hatC: HATS, signs: 1, signC: ['#ffd23f'] });
      els.push(el(id(), 'rock', 92, 330, { s: 1.4, c: '#6c6778' }));
      els.push(el(id(), 'rock', 500, 336, { s: 1.2, c: '#6c6778' }));
      els.push(el(id(), 'rock', 196, 452, { s: 0.9, c: '#6c6778' }));
      els.push(el(id(), 'kite', 452, 120, { s: 1, c: '#f15bb5', c2: '#ffd23f' }));
    },
  }),
  buildScene({
    seed: 3303,
    head: { name: 'Night Market', sub: 'steam, spice and lantern glow', bg: 'market', pvY: 100, pal: { skyTop: '#1d1b2e', skyBot: '#3d2c4e', sea: '#241f38', seaDark: '#191426', ground: '#4e342e', trim: '#ffb703' } },
    build(els, r, id) {
      skySet(els, r, id, { clouds: 2, cloudC: '#574b90', moon: [520, 54], stars: 12, birds: 0 });
      for (let i = 0; i < 7; i++) els.push(el(id(), 'stall', 48 + i * 84, 268, { s: 1, c: pick(r, ['#e63946', '#fb8500', '#2a9d8f', '#9b5de5']), c2: '#fff3e4', n: 2 + Math.floor(r() * 3) }));
      for (let i = 0; i < 10; i++) els.push(el(id(), 'lantern', between(r, 30, 570), between(r, 120, 210), { s: between(r, 0.85, 1.2), c: pick(r, ['#ff5964', '#ffd23f', '#ff9f1c', '#f15bb5']), c2: '#ffe66d' }));
      shoreSet(els, r, id, { people: 9, y0: 330, y1: 400, shirtC: SHIRTS, hatC: HATS, signs: 4, signC: ['#ffb703', '#ff5964', '#3ec1d3', '#9b5de5'] });
      for (let i = 0; i < 4; i++) els.push(el(id(), 'ball', between(r, 40, 560), between(r, 500, 580), { s: between(r, 0.8, 1.1), c: pick(r, SHIRTS) }));
      els.push(el(id(), 'flag', 300, 128, { s: 1.1, c: '#ffd23f' }));
      els.push(el(id(), 'flag', 120, 140, { s: 0.9, c: '#ff5964' }));
      els.push(el(id(), 'flag', 480, 140, { s: 0.9, c: '#3ec1d3' }));
    },
  }),
  buildScene({
    seed: 4404,
    head: { name: 'Coral Beach', sub: 'noon turquoise, low tide', bg: 'beach', pvY: 215, pal: { skyTop: '#4cc9f0', skyBot: '#b8f0ff', sea: '#2ec4b6', seaDark: '#1d9e92', ground: '#ffe8b3', trim: '#ff9f1c' } },
    build(els, r, id) {
      skySet(els, r, id, { clouds: 5, cloudC: '#ffffff', sun: [84, 62], sunC: '#ffd23f', sunC2: '#fff3b0', birds: 5 });
      waterSet(els, r, id, { boats: 3, buoys: 2, fish: 4, y0: 240, y1: 292, boatC: BOATS, sailC: SAILS });
      for (let i = 0; i < 6; i++) els.push(el(id(), 'umbrella', between(r, 48, 552), between(r, 400, 470), { s: between(r, 0.9, 1.25), c: pick(r, ['#ff5964', '#ffd23f', '#3ec1d3', '#f15bb5', '#ff9f1c']), c2: '#ffffff' }));
      shoreSet(els, r, id, { palms: 5, y0: 330, treeC: ['#2a9d8f', '#38b000'], people: 7, y1: 470, shirtC: SHIRTS, hatC: HATS });
      for (let i = 0; i < 4; i++) els.push(el(id(), 'ball', between(r, 40, 560), between(r, 500, 586), { s: between(r, 0.9, 1.3), c: pick(r, SHIRTS), c2: '#ffffff' }));
      for (let i = 0; i < 3; i++) els.push(el(id(), 'crab', between(r, 50, 550), between(r, 540, 600), { s: 1, c: '#e63946' }));
      els.push(el(id(), 'kite', 430, 110, { s: 1.15, c: '#ffd23f', c2: '#e63946' }));
      els.push(el(id(), 'sign', 300, 356, { s: 1, c: '#ff9f1c', c2: '#ffffff' }));
    },
  }),
  buildScene({
    seed: 5505,
    head: { name: 'Fishing Village', sub: 'nets mended, gulls waiting', bg: 'village', pvY: 70, pal: { skyTop: '#8ecae6', skyBot: '#e8f6ff', sea: '#219ebc', seaDark: '#126782', ground: '#95d5b2', trim: '#606c38' } },
    build(els, r, id) {
      skySet(els, r, id, { clouds: 5, cloudC: '#ffffff', sun: [520, 58], sunC: '#ffd23f', sunC2: '#ff9f1c', birds: 6 });
      shoreSet(els, r, id, { houses: 6, y0: 190, houseC: ['#ffffff', '#ffe0b5', '#d8f3dc', '#fefae0', '#e0d7f5'], roofC: ['#bc4749', '#606c38', '#1d3557', '#7f5539'], trees: 5, treeC: ['#40916c', '#2d6a4f', '#74c69d'] });
      waterSet(els, r, id, { boats: 6, buoys: 3, fish: 3, y0: 330, y1: 388, boatC: BOATS, sailC: SAILS });
      shoreSet(els, r, id, { people: 6, y0: 430, y1: 452, shirtC: SHIRTS, hatC: HATS, signs: 3, signC: ['#606c38', '#bc4749', '#126782'] });
      els.push(el(id(), 'flag', 168, 214, { s: 1, c: '#bc4749' }));
      els.push(el(id(), 'rock', 528, 470, { s: 1, c: '#8d8577' }));
      els.push(el(id(), 'rock', 66, 486, { s: 0.85, c: '#8d8577' }));
    },
  }),
  buildScene({
    seed: 6606,
    head: { name: 'Lantern Festival', sub: 'a river of floating light', bg: 'festival', pvY: 80, pal: { skyTop: '#0b1d3a', skyBot: '#274690', sea: '#14264c', seaDark: '#0d1830', ground: '#1f2a4d', trim: '#ffd23f' } },
    build(els, r, id) {
      skySet(els, r, id, { clouds: 2, cloudC: '#3d5a99', moon: [90, 60], stars: 20, birds: 0 });
      for (let i = 0; i < 12; i++) els.push(el(id(), 'lantern', between(r, 26, 574), between(r, 108, 220), { s: between(r, 0.85, 1.3), c: pick(r, ['#ff5964', '#ffd23f', '#ff9f1c', '#f15bb5', '#3ec1d3']), c2: '#ffe66d' }));
      waterSet(els, r, id, { boats: 5, buoys: 2, fish: 2, y0: 330, y1: 384, boatC: ['#5a189a', '#1d3557', '#7f1d3a', '#274690'], sailC: ['#ffd23f', '#ff9f1c', '#f15bb5'] });
      for (let i = 0; i < 8; i++) els.push(el(id(), 'lantern', between(r, 30, 570), between(r, 430, 560), { s: between(r, 0.9, 1.25), c: pick(r, ['#ff5964', '#ffd23f', '#ff9f1c']), c2: '#ffe66d' }));
      shoreSet(els, r, id, { people: 7, y0: 250, y1: 400, shirtC: SHIRTS, hatC: HATS, signs: 2, signC: ['#ffd23f', '#ff5964'] });
      els.push(el(id(), 'kite', 470, 96, { s: 1.1, c: '#3ec1d3', c2: '#ffd23f' }));
      els.push(el(id(), 'flag', 300, 240, { s: 1.15, c: '#ffd23f' }));
    },
  }),
];
