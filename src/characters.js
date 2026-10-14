// Companion characters: a retro pixel-art portrait (drawn in code, 48x48, limited palette) + their one-liners.
// Style target: 8/16-bit era cutscene portraits (Contra / Mortal Kombat / Serious Sam attitude), not anime.
const PAL = {
  ol: '#150d12', hair: '#2b1e1b', hairHi: '#4d3b35', skin: '#e2a977', skinLt: '#f3cc9f', skinSh: '#b87a56', skinDk: '#86503a',
  brow: '#171011', eyeW: '#f3efe6', iris: '#3b4c5c', stub: '#7b5b4b', mouth: '#8a3b3b', tooth: '#f1e8dc',
  shirt: '#4f7183', shirtSh: '#355160', collar: '#2c4452', bg1: '#2a2f4a', bg2: '#3a4063',
};

// GYL: man with short, swept dark hair, strong straight brows, light stubble and a calm half-smirk.
export function paintAce(cv, st = {}) {
  const N = 48; cv.width = N; cv.height = N;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const px = (x, y, c, w = 1, h = 1) => { g.fillStyle = PAL[c] || c; g.fillRect(x, y, w, h); };
  const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  // background: two-tone with a diagonal split
  px(0, 0, 'bg1', N, N); for (let y = 0; y < N; y++) px(N - 1 - Math.floor(y * 0.55) - 8, y, 'bg2', N, 1);
  // shoulders + shirt
  for (let y = 40; y < N; y++) { const half = 12 + (y - 40) * 2.3; for (let x = 0; x < N; x++) if (Math.abs(x - 24) <= half) px(x, y, (x < 24 - half * 0.45 || (x + y) % 9 === 0) && x < 24 ? 'shirtSh' : 'shirt'); }
  px(18, 40, 'collar', 12, 2); px(16, 41, 'ol', 2, 1); px(30, 41, 'ol', 2, 1);
  // neck
  for (let y = 33; y < 42; y++) for (let x = 19; x <= 29; x++) px(x, y, x < 22 || y < 37 ? 'skinSh' : 'skin');
  px(19, 37, 'skinDk', 11, 1);
  // head (slightly square jaw)
  for (let y = 9; y <= 36; y++) for (let x = 10; x <= 38; x++) {
    const w = y < 14 ? 0.0 : 0;
    const top = inEll(x, y, 24, 22, 14.2, 15.5), jaw = y > 27 && x >= 13 && x <= 35 && y <= 36 - Math.max(0, Math.abs(x - 24) - 7) * 0.9;
    if (top || jaw) px(x, y, x < 15 ? 'skinSh' : x > 33 ? 'skinSh' : 'skin');
  }
  // ears
  for (const [ex, s] of [[9, -1], [38, 1]]) { px(ex, 21, 'skinSh', 2, 6); px(ex + (s > 0 ? 1 : 0), 22, 'skinDk', 1, 3); }
  // forehead light, cheeks light
  px(18, 14, 'skinLt', 12, 3); px(17, 24, 'skinLt', 4, 3); px(28, 24, 'skinLt', 4, 3);
  // hair: tousled, swept to the right; irregular hairline and tufts so it reads as hair, not a cap
  const tufts = [0, 1, 0, 2, 1, 0, 3, 1, 2, 0, 1, 2, 0, 3, 1, 0, 2, 1, 0, 1, 3, 0, 2, 1, 0, 2, 1, 0, 1];
  for (let x = 9; x <= 39; x++) {
    const topY = 6 - tufts[(x - 9) % tufts.length] + Math.floor(Math.abs(x - 24) / 8) + (x > 28 ? -1 : 0);   // ragged top edge
    const lineY = 13 + ((x * 7) % 5 === 0 ? 1 : 0) + (x < 16 ? Math.floor((16 - x) * 0.9) : 0) + (x > 31 ? Math.floor((x - 31) * 0.9) : 0);   // hairline
    for (let y = topY; y <= lineY; y++) { if (y < 4) continue; const edge = (x < 12 && y < 9) || (x > 36 && y < 9); if (edge) continue; px(x, y, (x * 2 + y * 3) % 6 < 1 ? 'hairHi' : (x + y) % 11 === 0 ? 'brow' : 'hair'); }
  }
  for (let y = 12; y <= 21; y++) { px(10, y, 'hair'); px(11, y + (y > 19 ? 0 : 0), 'hair'); px(37, y, 'hair'); px(38, y, 'hair'); }
  for (let i = 0; i < 9; i++) px(14 + i * 2, 12 + (i % 3), 'hairHi');            // loose strands over the forehead
  px(17, 14, 'hair', 2, 1); px(23, 14, 'hair', 3, 1); px(30, 14, 'hair', 2, 1);
  px(11, 22, 'hair'); px(37, 22, 'hair');                                          // sideburns
  // brows: heavy, slightly furrowed
  for (const [bx, tilt] of [[15, 1], [27, -1]]) for (let i = 0; i < 8; i++) px(bx + i, 18 + (tilt > 0 ? (i > 4 ? 0 : 0) : 0) + (tilt > 0 ? Math.floor((7 - i) / 4) : Math.floor(i / 4)), 'brow', 1, 2);
  // eyes
  for (const ex of [17, 28]) {
    if (st.blink) { px(ex, 21, 'skinSh', 5, 2); px(ex, 22, 'ol', 5, 1); continue; }
    const lx = Math.max(0, Math.min(3, 1 + (ex > 24 ? 1 : 0) + (st.look || 0))), ly = st.up ? 0 : 1;
    px(ex, 21, 'eyeW', 5, 2); px(ex + lx, 21 + (ly ? 0 : 0), 'iris', 2, st.up ? 1 : 2); px(ex, 20, 'ol', 5, 1); px(ex, 23, 'skinSh', 5, 1);
  }
  // nose
  px(23, 22, 'skinSh', 1, 6); px(22, 27, 'skinDk', 4, 1); px(21, 26, 'skinSh', 1, 1); px(26, 26, 'skinSh', 1, 1);
  // stubble: dithered across jaw, chin and upper lip
  for (let y = 27; y <= 36; y++) for (let x = 14; x <= 34; x++) if (((x * 3 + y * 5) % 7 < 2) && inEll(x, y, 24, 24, 13.5, 14) && (y > 28 || Math.abs(x - 24) > 3)) px(x, y, 'stub');
  px(19, 29, 'stub', 11, 1);
  // mouth: calm half-smirk (right corner up)
  px(20, 31, 'mouth', 9, 1); px(29, 30, 'mouth', 2, 1); px(20, 32, 'skinSh', 8, 1); px(24, 32, 'tooth', 3, 1);
  px(23, 35, 'skinSh', 3, 1);
  if (st.talk) { px(21, 31, 'ol', 7, 2); px(22, 32, 'mouth', 5, 1); px(22, 31, 'tooth', 5, 1); }
  // outline (1 px) around the head silhouette
  const id = g.getImageData(0, 0, N, N), d = id.data, o = new Uint8ClampedArray(d);
  const isSkin = (x, y) => { if (x < 0 || y < 0 || x >= N || y >= N) return false; const i = (y * N + x) * 4; return d[i] > 100 && d[i + 1] > 60 && d[i] > d[i + 2] + 40; };
  const isHair = (x, y) => { if (x < 0 || y < 0 || x >= N || y >= N) return false; const i = (y * N + x) * 4; return d[i] < 90 && d[i + 1] < 70 && d[i + 2] < 70; };
  const bgc = (x, y) => { const i = (y * N + x) * 4; return d[i + 2] > d[i] + 15; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (bgc(x, y) && y < 40) {
    if (isSkin(x - 1, y) || isSkin(x + 1, y) || isSkin(x, y - 1) || isSkin(x, y + 1) || isHair(x - 1, y) || isHair(x + 1, y) || isHair(x, y - 1) || isHair(x, y + 1)) { const i = (y * N + x) * 4; o[i] = 21; o[i + 1] = 13; o[i + 2] = 18; }
  }
  id.data.set(o); g.putImageData(id, 0, 0);
}

import { LINES } from './character_lines.js';
// Event lines (start / boss / low health / tower hit / wave cleared); everything else comes from LINES in the character's own voice.
const EV = {
  skip: { start: ['Here we go! This is gonna be so cool!'], boss: ['Whoa, that one is HUGE! Awesome!'], low: ['Ow! I am fine! I am totally fine!'], node: ['Hey, they are hitting our tower! Rude!'], clear: ['Wave cleared! Who wants a high five?'] },
  duke: { start: ['Lizards on my street. This will be quick.', 'Friends, the chain is counting on us. Forward!'], boss: ['A giant approaches. Shields up, friends!'], low: ['A scratch! Naught but a scratch!'], node: ['They strike the tower! Defend it with your lives!'], clear: ['A fine victory! Reload, and onward!'] },
  walt: { start: ['Okay. Let us begin. Calmly.'], boss: ['That one is big. Aim for the back.'], low: ['I am hurt. Staying calm. Still going.'], node: ['The tower is under attack. Let us help it.'], clear: ['One wave done. Next one.'] },
  wes: { start: ['Okay, plan: shoot lizards. Or maybe not... no, yes. Shoot.'], boss: ['Big boss. Aim for the weak spot. Or the other weak spot.'], low: ['My health is low. Or is it? It is low. Yes.'], node: ['The tower is taking damage. That is a critical bug.'], clear: ['Wave done. Tests green. Mostly.'] },
  norm: { start: ['Commencing lizard removal. Please stand clear.'], boss: ['Target: large. Probability of survival for him: low.'], low: ['Health at critical levels. I find this inconvenient.'], node: ['Warning: tower integrity decreasing. Unacceptable.'], clear: ['Wave complete. Time for a beer. Almost.'] },
  kelsey: { start: ['Let us go, team! Big game today!'], boss: ['Their star player just arrived! Stay sharp!'], low: ['I am hurt, but I never quit!'], node: ['They are hitting our tower! Defend it!'], clear: ['Wave cleared! That is how we win!'] },
};
const NAMES = { skip: 'SKIP', duke: 'DUKE', walt: 'WALT', wes: 'WES', norm: 'NORM', kelsey: 'KELSEY' };
const PAINT = { skip: paintDealone, duke: paintAce, walt: paintDing, wes: paintJimbo, norm: paintTilah, kelsey: paintHelga };
const MAPLINES = {   // Duke keeps his city-specific lines
  duke: {
    moscow: ['Stalin-era skyline, modern enemies. Splendid!', 'Big buildings, bigger lizards. Fine by me!'],
    seattle: ['Rain, coffee, lizards. A fine Tuesday for a knight!', 'Even the lizards need a latte here!'],
    dubai: ['Gold everywhere! The lizards shall not keep it!', 'Hot desert, hotter lead. Onward!'],
    shanghai: ['The Bund at sunset. A noble place to make a stand!', 'Nanjing Road shall be defended!'],
    singapore: ['A conference? Splendid. Let us network with our swords!', 'Marina Bay has never seen a keynote like this!'],
    tokyo: ['Neon and honour! Let us dance with the lizards!', 'Shibuya at night. A worthy battlefield!'],
    rio: ['Samba and steel! Forward, friends!', 'Sun, sand and a worthy cause!'],
  },
};
export const CHARACTER_ORDER = ['duke', 'skip', 'walt', 'wes', 'norm', 'kelsey'];
export const CHARACTERS = {};
for (const id of CHARACTER_ORDER) {
  const any = LINES[id] || [], ev = EV[id];
  CHARACTERS[id] = { id, name: NAMES[id], paint: PAINT[id], lines: { start: ev.start, wave: any, boss: ev.boss, low: ev.low, node: ev.node, clear: ev.clear, any, map: MAPLINES[id] || null } };
}

// ---------------- more portraits (transparent background, same pixel style) ----------------
const PX = (cv, st = {}) => {
  const N = 48; cv.width = N; cv.height = N;
  const g = cv.getContext('2d'); g.clearRect(0, 0, N, N); g.imageSmoothingEnabled = false;
  const px = (x, y, c, w = 1, h = 1) => { g.fillStyle = PAL[c] || c; g.fillRect(x | 0, y | 0, w, h); };
  const ell = (cx, cy, rx, ry, c, f) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) px(x, y, f ? f(x, y) : c); };
  const poly = (pts, c, f) => {
    let x0 = 99, x1 = -1, y0 = 99, y1 = -1; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) {
      let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside; }
      if (inside) px(x, y, f ? f(x, y) : c);
    }
  };
  const outline = () => {   // 1 px dark outline around everything drawn
    const id = g.getImageData(0, 0, N, N), d = id.data, o = new Uint8ClampedArray(d);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = (y * N + x) * 4; if (d[i + 3] > 0) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue; if (d[(yy * N + xx) * 4 + 3] > 0) { o[i] = 21; o[i + 1] = 13; o[i + 2] = 18; o[i + 3] = 255; break; } } }
    id.data.set(o); g.putImageData(id, 0, 0);
  };
  return { N, g, px, ell, poly, outline, st };
};
const SK = { skin: '#e2a977', skinLt: '#f3cc9f', skinSh: '#b87a56', skinDk: '#86503a' };
const SK2 = { skin: '#eab98e', skinLt: '#f8d8b4', skinSh: '#c58c66', skinDk: '#93603f' };   // paler
Object.assign(PAL, { black: '#1b1517', blk2: '#2b2428', grey: '#8a8f98', greyDk: '#5a5f69', greyLt: '#b8bcc4', brown: '#5a3d2b', brownDk: '#3a271c', brownLt: '#7a573d', blond: '#9a7a52', blondLt: '#c4a26c', red: '#d8283a', redDk: '#8a1624', redLt: '#ff5a66', glass: '#c9d6dc', teal: '#2e6e7a', paisley: '#2e2d3a', paisley2: '#6a6a82', white: '#f3efe6' });

function headBase(P, sk, o = {}) {
  const { px, ell } = P, rx = o.rx || 14, ry = o.ry || 15.5, cx = o.cx || 24, cy = o.cy || 22;
  ell(cx, cy, rx, ry, null, (x) => (x < cx - rx + 3 || x > cx + rx - 3 ? sk.skinSh : sk.skin));
  for (let y = cy + 6; y <= cy + ry + 1; y++) for (let x = cx - 9; x <= cx + 9; x++) if (y <= cy + ry + 1 - Math.max(0, Math.abs(x - cx) - 6) * 0.9) px(x, y, sk.skin);   // squarer jaw
  px(cx - 7, cy - 8, sk.skinLt, 14, 3); px(cx - 8, cy + 2, sk.skinLt, 4, 3); px(cx + 4, cy + 2, sk.skinLt, 4, 3);
}
function neckShirt(P, sk, shirt, shirtSh, y0 = 38) {
  const { px } = P;
  for (let y = 33; y < y0 + 3; y++) for (let x = 19; x <= 29; x++) px(x, y, x < 22 ? sk.skinSh : sk.skin);
  for (let y = y0; y < 48; y++) { const half = 12 + (y - y0) * 2.3; for (let x = 0; x < 48; x++) if (Math.abs(x - 24) <= half) px(x, y, x < 24 - half * 0.45 && (x + y) % 3 ? shirtSh : shirt); }
}
const eyesAt = (P, y, o = {}) => {
  const { px, st } = P, gap = o.gap || 11;
  for (const ex of [18, 18 + gap - 1]) {
    if (st.blink) { px(ex, y, o.lid || 'skinSh', 4, 2); px(ex, y + 1, 'ol', 4, 1); continue; }
    const lx = Math.max(0, Math.min(2, 1 + (ex > 24 ? 1 : 0) - (ex > 24 ? 1 : 0) + (st.look || 0) + (ex > 24 ? 1 : 0) - (ex > 24 ? 1 : 0)));
    px(ex, y, 'eyeW', 4, 2); px(ex + Math.max(0, Math.min(2, 1 + (st.look || 0))), y + (st.up ? 0 : 0), o.iris || 'iris', 2, st.up ? 1 : 2); px(ex, y - 1, 'ol', 4, 1);
  }
};
const talkAt = (P, x, y, w) => { if (!P.st.talk) return; const { px } = P; px(x, y, 'ol', w, 3); px(x + 1, y + 1, 'mouth', w - 2, 1); };
const noseAt = (P, y) => { const { px } = P; px(23, y, 'skinSh', 1, 5); px(22, y + 5, 'skinDk', 4, 1); px(21, y + 4, 'skinSh', 1, 1); px(26, y + 4, 'skinSh', 1, 1); };

// DING: thick dark beard, black rectangular glasses, short tousled brown hair, black tee, a tabby cat on his shoulder.
export function paintDing(cv, st = {}) {
  const P = PX(cv, st), { px, ell, poly } = P;
  // cat (behind, left shoulder)
  poly([[1, 32], [3, 20], [5, 16], [7, 20], [11, 20], [13, 15], [14, 21], [15, 36], [8, 42], [2, 42]], '#8a7a62', (x, y) => ((x * 2 + y) % 5 === 0 ? '#4a3f33' : (x + y) % 7 === 0 ? '#b0a086' : '#8a7a62'));
  px(4, 24, '#f0e6c8', 2, 2); px(9, 24, '#f0e6c8', 2, 2); px(5, 25, 'ol', 1, 1); px(10, 25, 'ol', 1, 1); px(7, 27, '#c07a7a', 2, 1);
  px(2, 31, '#2a2024', 12, 2);                                                                   // collar
  neckShirt(P, SK2, 'blk2', 'black');
  headBase(P, SK2, { rx: 13.5, ry: 15 });
  for (let y = 4; y <= 14; y++) for (let x = 11; x <= 37; x++) { const top = 6 + Math.floor(Math.abs(x - 26) / 6) - ((x * 5) % 3 === 0 ? 1 : 0), line = 13 + (x < 15 ? Math.floor((15 - x)) : 0) + (x > 34 ? Math.floor((x - 34)) : 0); if (y >= top && y <= line) px(x, y, (x * 2 + y * 3) % 6 < 1 ? 'brownLt' : 'brown'); }
  px(11, 14, 'brown', 2, 8); px(36, 14, 'brown', 2, 8);
  // beard + moustache (dark, full)
  for (let y = 27; y <= 41; y++) for (let x = 11; x <= 37; x++) { const cx = 24, d = ((x - cx) / 13) ** 2 + ((y - 29) / 12.5) ** 2; if (d <= 1 && y >= 27 + Math.max(0, 3 - Math.abs(x - cx) * 0.4)) px(x, y, (x * 3 + y * 5) % 9 < 1 ? 'brown' : 'brownDk'); }
  px(19, 28, 'brownDk', 11, 2); px(17, 27, 'brownDk', 4, 1); px(27, 27, 'brownDk', 4, 1);   // moustache
  px(21, 32, '#8a3b3b', 6, 1);                                                                    // mouth line in the beard
  talkAt(P, 21, 31, 6);
  // brows + eyes + glasses
  for (const [bx, t] of [[16, 1], [27, -1]]) for (let i = 0; i < 7; i++) px(bx + i, 17 + (t > 0 ? (i < 3 ? 1 : 0) : (i > 3 ? 1 : 0)), 'brownDk', 1, 2);
  eyesAt(P, 20); noseAt(P, 21);
  for (const gx of [14, 26]) { px(gx, 18, 'black', 9, 1); px(gx, 25, 'black', 9, 1); px(gx, 18, 'black', 1, 8); px(gx + 8, 18, 'black', 1, 8); px(gx + 1, 19, 'glass', 7, 1); }
  px(23, 20, 'black', 3, 1); px(9, 20, 'black', 5, 1); px(35, 20, 'black', 4, 1);
  P.outline();
}

// DEALONE: long windswept brown hair, thin round-rectangular glasses, big open smile, light stubble, paisley bandana, grey jacket.
export function paintDealone(cv, st = {}) {
  const P = PX(cv, st), { px, ell, poly } = P;
  // hair behind the head: long, to the shoulders, with a flyaway tuft up-left
  poly([[8, 12], [10, 4], [16, 1], [24, 2], [33, 3], [39, 8], [41, 20], [42, 36], [36, 38], [12, 38], [6, 34], [6, 20]], null, (x, y) => ((x * 3 + y * 2) % 7 < 1 ? 'brownLt' : (x + y * 3) % 11 === 0 ? 'brownDk' : 'brown'));
  poly([[12, 4], [8, 0], [13, 2]], 'brownLt'); poly([[16, 2], [14, -1], [20, 1]], 'brown');
  neckShirt(P, SK2, '#6b7078', '#4c5058');
  for (let y = 36; y < 44; y++) for (let x = 14; x <= 36; x++) { const t = (x - 14) / 22; if (y - 36 < 3 + t * 5 && y - 36 > t * 2 - 1) px(x, y, (x + y) % 3 === 0 ? 'paisley2' : 'paisley'); }   // bandana knot
  px(20, 42, 'paisley', 3, 4);
  headBase(P, SK2, { rx: 14, ry: 15.5 });
  for (let y = 28; y <= 38; y++) for (let x = 11; x <= 37; x++) if (y <= 38 - Math.max(0, Math.abs(x - 24) - 11) * 1.6 && y >= 28) px(x, y, 'skin');   // broad, square jaw
  // hair on top / fringe falling to the sides, parted in the middle
  for (let y = 5; y <= 22; y++) for (let x = 9; x <= 39; x++) { const part = Math.abs(x - 24), line = 13 + Math.floor(part * 0.5) - (part < 2 ? 2 : 0), inner = part < 11 ? 0 : 1; if (y >= 5 + Math.floor(part / 5) && ((y <= line && part <= 15) || (part >= 12 && y <= 24 && part <= 16))) px(x, y, (x * 2 + y) % 6 < 1 ? 'brownLt' : (x + y) % 9 === 0 ? 'brownDk' : 'brown'); }
  // brows (relaxed, raised), eyes, thin glasses
  for (const [bx, t] of [[15, 1], [27, -1]]) for (let i = 0; i < 8; i++) px(bx + i, 17 + (t > 0 ? (i < 3 ? 1 : 0) : (i > 4 ? 1 : 0)), 'brownDk', 1, 2);   // heavy brows
  eyesAt(P, 20); noseAt(P, 21); px(21, 26, 'skinDk', 1, 1); px(27, 26, 'skinDk', 1, 1);
  for (const gx of [14, 26]) { px(gx, 18, '#6a7078', 9, 1); px(gx, 24, '#6a7078', 9, 1); px(gx, 18, '#6a7078', 1, 7); px(gx + 8, 18, '#6a7078', 1, 7); }
  px(23, 19, '#6a7078', 3, 1); px(10, 19, '#6a7078', 4, 1); px(35, 19, '#6a7078', 4, 1);
  // big smile with teeth
  px(18, 30, 'ol', 13, 1); px(19, 31, 'tooth', 11, st.talk ? 1 : 2); if (st.talk) px(19, 32, 'mouth', 11, 2); px(20, 33, 'ol', 9, 1); px(17, 29, 'ol', 1, 1); px(31, 29, 'ol', 1, 1);
  for (let y = 28; y <= 38; y++) for (let x = 12; x <= 36; x++) if ((((x * 73856093) ^ (y * 19349663)) >> 4) % 3 === 0 && !(y >= 30 && y <= 33 && x >= 17 && x <= 31)) px(x, y, 'stub');
  px(17, 28, 'brownDk', 14, 1); px(19, 29, 'stub', 11, 1);   // moustache shadow
  talkAt(P, 19, 31, 11);
  P.outline();
}

// JIMBO: short black hair, thin rectangular glasses, calm serious look, clean-shaven, black polo, hands clasped in front of the chin.
export function paintJimbo(cv, st = {}) {
  const P = PX(cv, st), { px, ell, poly } = P;
  neckShirt(P, SK2, 'blk2', 'black', 40);
  px(22, 40, 'black', 4, 3); px(23, 42, 'blk2', 1, 6);
  headBase(P, SK2, { rx: 13.5, ry: 15.5, cy: 21 });
  // short flat-top hair
  for (let y = 3; y <= 12; y++) for (let x = 10; x <= 38; x++) { const dx = Math.abs(x - 24), top = 4 + Math.floor(dx * dx / 40), line = 11 + (dx > 11 ? Math.floor(dx - 11) : 0); if (y >= top && y <= line) px(x, y, (x * 3 + y) % 9 < 1 ? 'blk2' : 'black'); }
  px(10, 12, 'black', 2, 7); px(37, 12, 'black', 2, 7);
  for (const [bx, t] of [[16, 1], [27, -1]]) for (let i = 0; i < 7; i++) px(bx + i, 16 + (t > 0 ? (i > 4 ? 0 : 0) : 0), 'black', 1, 2);
  eyesAt(P, 19, { iris: 'black' }); noseAt(P, 20);
  for (const gx of [14, 26]) { px(gx, 17, '#3a3f48', 9, 1); px(gx, 23, '#3a3f48', 9, 1); px(gx, 17, '#3a3f48', 1, 7); px(gx + 8, 17, '#3a3f48', 1, 7); px(gx + 1, 18, 'glass', 6, 1); }
  px(23, 18, '#3a3f48', 3, 1);
  px(20, 29, '#9a5a4a', 9, 1); px(21, 30, 'skinSh', 7, 1);                                         // serious mouth
  talkAt(P, 21, 29, 7);
  // clasped hands under the chin: two fists with finger lines and knuckles
  for (let y = 33; y <= 42; y++) for (let x = 16; x <= 32; x++) { const dx = Math.abs(x - 24); if (dx <= 8 - Math.max(0, y - 40) * 2 && y >= 33 + (dx > 6 ? 2 : 0)) px(x, y, y > 39 ? 'skinSh' : x < 24 ? 'skin' : 'skinLt'); }
  px(23, 33, 'skinSh', 1, 9); for (const y of [35, 37, 39]) px(17, y, 'skinSh', 15, 1);
  for (const x of [18, 21, 26, 29]) px(x, 34, 'skinDk', 1, 1);
  px(19, 33, 'skinLt', 3, 1); px(26, 33, 'skinLt', 3, 1);
  px(32, 41, 'black', 6, 2); px(33, 41, '#8a8f98', 4, 2);                                           // watch
  P.outline();
}

// HELGA: long straight light-brown hair parted in the middle, calm slight smile, grey sweatshirt with a white collar.
export function paintHelga(cv, st = {}) {
  const P = PX(cv, st), { px, poly } = P;
  poly([[9, 10], [12, 3], [19, 0], [29, 0], [36, 3], [39, 10], [41, 26], [44, 47], [4, 47], [7, 26]], null, (x, y) => ((x * 2 + y) % 6 < 1 ? 'blondLt' : (x + y * 2) % 13 === 0 ? 'brown' : 'blond'));
  neckShirt(P, SK2, '#7a7f88', '#5a5f69', 39);
  px(18, 39, 'white', 5, 3); px(25, 39, 'white', 5, 3); px(22, 40, 'greyLt', 4, 2);
  // oval face with a narrow, slightly pointed chin and a long neck (no squared jaw)
  for (let y = 8; y <= 38; y++) { const t = Math.max(0, (y - 24) / 14), half = y < 24 ? 12 - Math.max(0, (14 - y)) * 0.18 : 12 - t * t * 8.5 - t * 3; for (let x = Math.ceil(24 - half); x <= 24 + half; x++) px(x, y, x < 24 - half + 2 || x > 24 + half - 2 ? SK2.skinSh : SK2.skin); }
  px(18, 14, 'skinLt', 12, 3); px(16, 24, 'skinLt', 4, 3); px(28, 24, 'skinLt', 4, 3); px(16, 26, '#e8a08e', 3, 2); px(29, 26, '#e8a08e', 3, 2);   // forehead light + soft blush
  // hair framing the face, parted in the middle
  for (let y = 5; y <= 26; y++) for (let x = 9; x <= 39; x++) { const dx = Math.abs(x - 24), part = dx < 1; const edge = 12 - (y > 18 ? 0 : 0); if (!part && dx >= (y < 12 ? 11 - Math.floor((12 - y) * 0.1) : 12) && y <= 26 + (dx > 12 ? 8 : 0)) px(x, y, (x * 2 + y) % 6 < 1 ? 'blondLt' : 'blond'); if (y < 12 && dx < 12 && y >= 5 + Math.floor(dx * 0.25) && y <= 11 + Math.floor(dx * 0.35) && !part) px(x, y, (x + y * 2) % 7 < 1 ? 'blondLt' : 'blond'); }
  for (const bx of [16, 27]) px(bx, 17, 'brown', 6, 1);
  eyesAt(P, 20, { iris: 'brownDk', gap: 10 }); noseAt(P, 22);
  for (const [lx, d] of [[17, -1], [29, 1]]) { px(lx - 1 + (d > 0 ? 4 : 0), 19, 'ol', 1, 1); px(lx + (d > 0 ? 4 : 0), 19, 'ol', 1, 1); }   // lashes
  px(20, 31, '#b0585a', 9, 1); px(29, 30, '#b0585a', 1, 1); px(19, 30, '#b0585a', 1, 1); px(21, 32, '#c4747a', 7, 1); px(22, 33, 'skinSh', 5, 1);   // gentle smile, fuller lips
  talkAt(P, 21, 31, 7);
  P.outline();
}

// TILAH: seen from the side (facing left): shaved sides, tall spiky red mohawk, light stubble, black top.
export function paintTilah(cv, st = {}) {
  const P = PX(cv, st), { px, ell, poly } = P;
  // mohawk spikes (behind the head)
  const spikes = [[14, 12, 8, 2], [18, 8, 10, 1], [22, 5, 12, 0], [27, 4, 14, 0], [31, 5, 16, 1], [35, 9, 18, 2], [38, 14, 20, 3], [40, 20, 22, 3], [41, 26, 24, 4]];
  for (const [x, y, len, k] of spikes) poly([[x - 3, y + 8], [x - 1 + (k - 1) * 0.5, y - 1 + (k > 2 ? 3 : 0)], [x + 3, y + 8]], null, (xx, yy) => ((xx + yy) % 4 === 0 ? 'redLt' : (xx * 2 + yy) % 5 === 0 ? 'redDk' : 'red'));
  poly([[12, 14], [16, 5], [24, 1], [32, 2], [40, 8], [43, 18], [42, 30], [36, 34], [20, 18]], null, (x, y) => ((x * 3 + y) % 5 === 0 ? 'redLt' : (x + y * 2) % 7 === 0 ? 'redDk' : 'red'));
  // neck + shirt
  for (let y = 32; y < 42; y++) for (let x = 20; x <= 33; x++) px(x, y, x < 24 ? 'skinSh' : 'skinSh');
  for (let y = 40; y < 48; y++) for (let x = 10; x < 48; x++) px(x, y, (x + y) % 5 === 0 ? 'blk2' : 'black');
  // cranium (shaved sides: dark stubble) + face profile polygon (nose pointing left)
  ell(27, 20, 12.5, 14, null, (x, y) => (y < 12 || x > 28 ? ((x * 3 + y * 5) % 4 === 0 ? 'brown' : 'brownDk') : '#7a5a4a'));
  poly([[16, 15], [15, 20], [11, 25], [13, 27], [15, 28], [14, 31], [16, 33], [17, 36], [22, 38], [28, 36], [30, 28], [24, 15]], null, (x, y) => (y < 20 ? 'skinLt' : x > 24 ? 'skin' : 'skinLt'));
  poly([[15, 17], [13, 19], [14, 22]], 'skinLt');
  // ear
  ell(31, 24, 3, 4.5, null, (x, y) => ((x + y) % 4 === 0 ? 'skinDk' : 'skinSh')); px(30, 23, 'skinDk', 1, 3);
  // brow, eye, mouth, stubble
  px(14, 19, 'brownDk', 6, 1); px(15, 20, 'brownDk', 4, 1); px(17, 22, 'eyeW', 3, 2); px(17, 22, 'iris', 2, 2); px(16, 21, 'ol', 4, 1);
  px(13, 31, '#a85a5a', 4, 1); px(14, 32, 'skinSh', 3, 1);
  if (st.talk) { px(13, 31, 'ol', 3, 3); px(14, 32, 'mouth', 2, 1); }
  px(15, 27, 'skinSh');
  P.outline();
}
