// Companion characters: a retro pixel-art portrait (drawn in code, 48x48, limited palette) + their one-liners.
// Style target: 8/16-bit era cutscene portraits (Contra / Mortal Kombat / Serious Sam attitude), not anime.
const PAL = {
  ol: '#150d12', hair: '#2b1e1b', hairHi: '#4d3b35', skin: '#e2a977', skinLt: '#f3cc9f', skinSh: '#b87a56', skinDk: '#86503a',
  brow: '#171011', eyeW: '#f3efe6', iris: '#3b4c5c', stub: '#7b5b4b', mouth: '#8a3b3b', tooth: '#f1e8dc',
  shirt: '#4f7183', shirtSh: '#355160', collar: '#2c4452', bg1: '#2a2f4a', bg2: '#3a4063',
};

// GYL: man with short, swept dark hair, strong straight brows, light stubble and a calm half-smirk.
export function paintAce(cv) {
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
  for (const ex of [17, 28]) { px(ex, 21, 'eyeW', 5, 2); px(ex + 1 + (ex > 24 ? 1 : 0), 21, 'iris', 2, 2); px(ex, 20, 'ol', 5, 1); px(ex, 23, 'skinSh', 5, 1); }
  // nose
  px(23, 22, 'skinSh', 1, 6); px(22, 27, 'skinDk', 4, 1); px(21, 26, 'skinSh', 1, 1); px(26, 26, 'skinSh', 1, 1);
  // stubble: dithered across jaw, chin and upper lip
  for (let y = 27; y <= 36; y++) for (let x = 14; x <= 34; x++) if (((x * 3 + y * 5) % 7 < 2) && inEll(x, y, 24, 24, 13.5, 14) && (y > 28 || Math.abs(x - 24) > 3)) px(x, y, 'stub');
  px(19, 29, 'stub', 11, 1);
  // mouth: calm half-smirk (right corner up)
  px(20, 31, 'mouth', 9, 1); px(29, 30, 'mouth', 2, 1); px(20, 32, 'skinSh', 8, 1); px(24, 32, 'tooth', 3, 1);
  px(23, 35, 'skinSh', 3, 1);
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

export const CHARACTERS = {
  gyl: {
    name: 'GYL', paint: paintAce,
    lines: {
      start: ['LIZARDS ON MY STREET. THIS WILL BE QUICK.', 'FIVE MINUTES TO SAVE THE CHAIN. I NEED FOUR.'],
      wave: ['MORE OF THEM. GOOD. I WAS WARMING UP.', 'THEY KEEP COMING. SO DO MY BULLETS.', 'EVERY WAVE THEY BRING LESS BRAIN AND MORE TEETH.'],
      boss: ['BIG ONE. HIT IT IN THE BACK.', 'THAT ONE HAS A BACK. SHOW IT SOME LEAD.'],
      low: ['I HAVE HAD WORSE MONDAYS.', 'NOT DEAD. JUST VERY ANNOYED.'],
      node: ['THE TOWER IS HURT. NOBODY HURTS MY TOWER.', 'KEEP THEM OFF THE BUILDING!'],
      clear: ['ONE WAVE DOWN. THEY ARE ALREADY SORRY.', 'THAT WAS A WARM-UP. NEXT.'],
      any: ['THEY SAID LIZARDS WERE EXTINCT. THEY LIED.', 'I CAME FOR A COFFEE. NOW I AM DOING THIS.', 'SMILE. IT MAKES THEM NERVOUS.', 'DO NOT STOP. THE CHAIN NEVER STOPS.', 'GRAB THE GAS. SHOOT THE LIZARDS. EASY.', 'COOL FACE, HOT BARREL.', 'THIS IS WHY I NEVER TAKE VACATION.'],
      map: {
        moscow: ['STALIN-ERA SKYLINE, MODERN ENEMIES. I LIKE IT.', 'BIG BUILDINGS, BIGGER LIZARDS. FINE.'],
        seattle: ['RAIN, COFFEE, LIZARDS. A NORMAL TUESDAY.', 'EVEN THE LIZARDS NEED A LATTE HERE.'],
        dubai: ['GOLD EVERYWHERE. THE LIZARDS WILL LOVE IT. NOT FOR LONG.', 'HOT DESERT, HOTTER LEAD.'],
        shanghai: ['THE BUND AT SUNSET. SHAME ABOUT THE GUESTS.', 'NANJING ROAD, NOW WITH EXTRA LIZARDS.'],
        singapore: ['A CONFERENCE? PERFECT. IT IS NETWORKING TIME.', 'MARINA BAY SANDS HAS NEVER SEEN A KEYNOTE LIKE THIS.'],
        tokyo: ['NEON, RAMEN, LIZARDS. I WILL TAKE THE RAMEN LATER.', 'SHIBUYA ON A NIGHT LIKE THIS? LET US DANCE.'],
        rio: ['SAMBA TIME. THE LIZARDS BRING THE DRUMS.', 'BEACH, SUN, CARNIVAL. AND NOW TARGET PRACTICE.'],
      },
    },
  },
};
