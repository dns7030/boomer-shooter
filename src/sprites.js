// Procedural pixel-art sprites: lizard invaders, pickups, plasma, particles.
import * as THREE from 'three';
import { makeCanvas, toTexture, mulberry } from './textures.js';

const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function ell(g, cx, cy, rx, ry, col) {
  g.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001))));
    g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}
function spike(g, x, y, w, h, col, down = false) {
  g.fillStyle = col;
  for (let i = 0; i < h; i++) {
    const ww = Math.max(1, Math.round(w * (down ? i + 1 : h - i) / h));
    g.fillRect(x + Math.round((w - ww) / 2), down ? y + i : y + i, ww, 1);
  }
}
const hash = (x, y, s = 0) => {
  let h = Math.imul(x + 17 * s, 374761393) ^ Math.imul(y + 31, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const SW = 64, SH = 80;
const PAL = {
  grunt: { skin: '#56633f', mid: '#6a784a', dark: '#2d3624', belly: '#a69d7c', bellyD: '#7d765c', eye: '#f0b020', claw: '#d8d2b8', mouth: '#4a0e14' },
  spitter: { skin: '#45585a', mid: '#587072', dark: '#232f33', belly: '#9aa39a', bellyD: '#737d75', eye: '#ff7a1a', claw: '#cfd2c8', mouth: '#3e1018', suit: '#26292f', suitL: '#3c4350', glow: '#58d078', frill: '#3a2a30' },
};

// lighting pass: left-lit, darker toward the right/bottom, rim shading, scale noise
function shade(c, seed) {
  const g = c.getContext('2d', { willReadFrequently: true });
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data, w = c.width, h = c.height;
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  const out = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (!d[i + 3]) continue;
    let f = 1.14 - 0.42 * (x / w) - 0.14 * (y / h) + (hash(x, y, seed) - 0.5) * 0.16;
    if (!A(x + 1, y) || !A(x, y + 1)) f *= 0.74;
    if (!A(x - 1, y) || !A(x, y - 1)) f *= 1.12;
    if (hash((x >> 1) + 3, (y >> 1) + 5, seed) > 0.86) f *= 0.8; // scale flecks
    out[i] = Math.min(255, d[i] * f); out[i + 1] = Math.min(255, d[i + 1] * f); out[i + 2] = Math.min(255, d[i + 2] * f);
  }
  img.data.set(out); g.putImageData(img, 0, 0);
}
function outline(c) {
  const g = c.getContext('2d', { willReadFrequently: true });
  const { width: w, height: h } = c;
  const src = g.getImageData(0, 0, w, h), out = g.getImageData(0, 0, w, h);
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src.data[(y * w + x) * 4 + 3]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (a(x, y) > 0) continue;
    if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) {
      const i = (y * w + x) * 4;
      out.data[i] = 9; out.data[i + 1] = 12; out.data[i + 2] = 7; out.data[i + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
}

function leg(g, P, cx, lift) {
  ell(g, cx, 61, 8, 9, P.skin);                    // thigh
  ell(g, cx - 2, 58, 4, 5, P.mid);
  R(g, cx - 3, 66, 7, 8 - lift, P.skin);           // shin
  R(g, cx - 4, 70 - lift, 9, 2, P.dark);           // ankle
  ell(g, cx, 75 - lift, 8, 3, P.dark);             // foot
}
function legClaws(g, P, cx, lift) {
  for (const dx of [-6, -1, 4]) R(g, cx + dx, 77 - lift, 2, 3, P.claw);
}

function lizardFrame(kind, pose) {
  const P = PAL[kind], sp = kind === 'spitter';
  const walk1 = pose === 'walk1', walk2 = pose === 'walk2', atk = pose === 'attack', pain = pose === 'pain';
  const hx = pain ? -3 : 0, hy = pain ? 3 : atk ? -1 : 0;
  const c = makeCanvas(SW, SH, (g) => {
    // tail
    [[47, 70, 6, 4], [53, 66, 5, 4], [57, 60, 4, 4], [59, 53, 3, 3], [58, 47, 2, 3]].forEach(([x, y, rx, ry], i) => ell(g, x, y, rx, ry, i % 2 ? P.mid : P.skin));
    // legs
    const lu = walk1 ? 5 : 0, ru = walk2 ? 5 : 0;
    leg(g, P, 23, lu); leg(g, P, 41, ru);
    // frill / dorsal ridge behind the head
    if (sp) { ell(g, 32 + hx, 15 + hy, 18, 12, P.frill); for (let i = -4; i <= 4; i++) spike(g, 32 + hx + i * 4 - 1, 2 + hy + Math.abs(i), 3, 8, P.dark); }
    // torso
    const tw = sp ? 12 : 15;
    ell(g, 32, 39, tw, 14, P.skin);
    ell(g, 32, 51, 11, 5, P.skin);
    ell(g, 17, 29, 7, 6, P.skin); ell(g, 47, 29, 7, 6, P.skin);
    ell(g, 15, 27, 4, 3, P.mid);
    R(g, 28, 20, 8, 9, P.skin);
    // belly plates
    for (let y = 30; y < 50; y += 3) { R(g, 28, y, 8, 3, P.belly); R(g, 28, y + 2, 8, 1, P.bellyD); }
    // ribs
    for (let y = 31; y < 46; y += 4) { R(g, 20, y, 5, 1, P.dark); R(g, 39, y, 5, 1, P.dark); }
    // arms
    const swing = walk1 ? 3 : walk2 ? -3 : 0;
    const arm = (x, dir, s) => {
      if (atk) { ell(g, x + dir * 1, 25, 4, 7, P.skin); R(g, x + dir * 4 - 3, 11, 6, 13, P.skin); ell(g, x + dir * 4, 10, 4, 3, P.mid); }
      else if (pain) { ell(g, x - dir * 3, 38, 4, 7, P.skin); R(g, x - dir * 7 - 3, 41, 6, 11, P.skin); }
      else { ell(g, x, 37 + s, 4, 8, P.skin); R(g, x - 3 + dir, 41 + s, 6, 13, P.skin); ell(g, x + dir, 55 + s, 4, 4, P.mid); }
    };
    arm(11, -1, swing); arm(53, 1, -swing);
    if (sp) { // body armour
      ell(g, 32, 38, 12, 11, P.suit); R(g, 24, 31, 16, 1, P.suitL); R(g, 24, 44, 16, 1, '#111'); ell(g, 18, 28, 6, 4, P.suitL); ell(g, 46, 28, 6, 4, P.suitL);
      R(g, 20, 29, 2, 18, P.suitL); R(g, 42, 29, 2, 18, P.suitL);
      const gy = atk ? 20 : 44;
      if (atk) { R(g, 40, gy, 12, 12, P.suit); R(g, 42, gy + 2, 8, 8, P.suitL); } else { R(g, 44, gy, 18, 7, P.suit); R(g, 44, gy, 18, 2, P.suitL); R(g, 56, gy + 1, 7, 4, '#111'); R(g, 40, gy + 6, 5, 9, P.suitL); }
    }
    // head
    ell(g, 32 + hx, 13 + hy, 10, 9, P.skin);
    ell(g, 32 + hx, 20 + hy, 7, 5, P.mid);
    spike(g, 20 + hx, 4 + hy, 4, 8, P.dark); spike(g, 40 + hx, 4 + hy, 4, 8, P.dark);
    spike(g, 25 + hx, 3 + hy, 3, 6, P.dark); spike(g, 36 + hx, 3 + hy, 3, 6, P.dark);
    R(g, 22 + hx, 10 + hy, 9, 2, P.dark); R(g, 33 + hx, 10 + hy, 9, 2, P.dark); // heavy brow
    R(g, 29 + hx, 19 + hy, 1, 1, P.dark); R(g, 34 + hx, 19 + hy, 1, 1, P.dark);
    if (atk || pain) { // jaw open
      R(g, 25 + hx, 22 + hy, 14, 7, P.mouth);
      R(g, 27 + hx, 27 + hy, 10, 2, '#7a2a30');
      ell(g, 32 + hx, 30 + hy, 6, 2, P.skin);
    } else { R(g, 26 + hx, 24 + hy, 12, 1, P.dark); ell(g, 32 + hx, 26 + hy, 6, 2, P.skin); }
  });
  shade(c, kind === 'grunt' ? 1 : 2);
  // unshaded details: eyes, teeth, claws, glow
  const g = c.getContext('2d');
  R(g, 25 + hx, 12 + hy, 5, 2, P.eye); R(g, 34 + hx, 12 + hy, 5, 2, P.eye);
  R(g, 27 + hx, 12 + hy, 1, 2, '#000'); R(g, 36 + hx, 12 + hy, 1, 2, '#000');
  if (atk || pain) { for (let x = 26; x < 38; x += 2) { R(g, x + hx, 22 + hy, 1, 3, '#d8d4c0'); R(g, x + 1 + hx, 26 + hy, 1, 2, '#d8d4c0'); } }
  legClaws(g, P, 23, walk1 ? 5 : 0); legClaws(g, P, 41, walk2 ? 5 : 0);
  const clawHand = (x, y) => { for (let i = 0; i < 3; i++) R(g, x + i * 2, y, 1, 5 + (i % 2), P.claw); };
  if (atk) { clawHand(7, 4); clawHand(52, 4); }
  else if (pain) { clawHand(4, 52); clawHand(56, 52); }
  else { const sw = walk1 ? 3 : walk2 ? -3 : 0; clawHand(8, 59 + sw); clawHand(53, 59 - sw); }
  if (sp) { R(g, 30, 34, 4, 2, P.glow); if (atk) ell(g, 46, 26, 3, 3, P.glow); else R(g, 61, 46, 2, 2, P.glow); }
  outline(c);
  return c;
}

// Doom-style death: recoil, fall, then a flat corpse seen from above (wider canvas, lies on the ground)
function deathFrames(base) {
  const DW = 96, mk = (draw) => { const c = makeCanvas(DW, SH, (g) => { g.imageSmoothingEnabled = false; draw(g); }); return c; };
  const pool = (g, rx, a) => { g.fillStyle = `rgba(28,44,18,${a})`; for (let y = -4; y <= 4; y++) { const w = Math.round(rx * Math.sqrt(1 - (y * y) / 17)); g.fillRect(48 - w, 75 + y, w * 2, 1); } };
  const tint = (g, a) => { g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(10,18,6,${a})`; g.fillRect(0, 0, DW, SH); g.globalCompositeOperation = 'source-over'; };
  const f1 = mk((g) => { g.translate(DW / 2, 56); g.rotate(-0.12); g.drawImage(base, -SW / 2, -56); });
  const f2 = mk((g) => { pool(g, 14, 0.7); g.translate(46, 44); g.rotate(0.95); g.drawImage(base, -32, -44 + 6); tint(g, 0.12); });
  const lying = (alpha, tn) => mk((g) => {
    pool(g, 27, alpha);
    g.save(); g.translate(50, 62); g.scale(1, 0.5); g.rotate(Math.PI / 2); g.drawImage(base, -32, -44); g.restore();
    tint(g, tn);
    g.fillStyle = 'rgba(36,70,20,0.55)'; g.fillRect(40, 70, 14, 1); g.fillRect(52, 72, 9, 1);
  });
  return [f1, f2, lying(0.7, 0.2), lying(0.9, 0.34)];
}

export function makeLizardTextures() {
  const out = {};
  for (const kind of ['grunt', 'spitter']) {
    const frames = {};
    for (const pose of ['idle', 'walk1', 'walk2', 'attack', 'pain']) frames[pose] = toTexture(lizardFrame(kind, pose), false);
    frames.dead = deathFrames(lizardFrame(kind, 'pain')).map((c) => toTexture(c, false));
    out[kind] = frames;
  }
  return out;
}

function icon(draw) {
  return toTexture(makeCanvas(32, 32, (g) => { g.clearRect(0, 0, 32, 32); draw(g); }), false);
}
export function makePickupTextures() {
  return {
    kvass: icon((g) => { // jug of kvass
      R(g, 9, 8, 14, 20, '#7a4a22'); R(g, 11, 6, 10, 4, '#7a4a22'); R(g, 13, 3, 6, 4, '#c9a060'); R(g, 11, 14, 10, 8, '#e8d8a0'); R(g, 14, 16, 4, 4, '#a03020'); R(g, 9, 8, 2, 20, '#9a6a3a'); R(g, 9, 26, 14, 2, '#4a2a10');
    }),
    powder: icon((g) => { // powder keg
      R(g, 7, 10, 18, 18, '#6a4a28'); R(g, 7, 10, 18, 2, '#3b3b40'); R(g, 7, 26, 18, 2, '#3b3b40'); R(g, 7, 18, 18, 2, '#3b3b40'); R(g, 9, 6, 14, 4, '#2a2a2a'); R(g, 15, 3, 2, 4, '#e8d8a0'); R(g, 12, 13, 8, 4, '#d8c898');
    }),
    shot: icon((g) => { // leather shot pouch
      R(g, 8, 12, 16, 16, '#7a5230'); R(g, 10, 8, 12, 5, '#5a3a20'); R(g, 14, 6, 4, 4, '#b43a2a'); R(g, 11, 17, 3, 3, '#aaa'); R(g, 16, 20, 3, 3, '#aaa'); R(g, 19, 16, 3, 3, '#aaa'); R(g, 8, 26, 16, 2, '#3a2412');
    }),
    w_blunder: icon((g) => { // pump shotgun
      R(g, 2, 13, 24, 4, '#3a3f47'); R(g, 2, 13, 24, 1, '#7d8590'); R(g, 6, 18, 12, 4, '#6a4426'); R(g, 6, 18, 12, 1, '#a8672e'); R(g, 20, 15, 8, 6, '#2a2d33'); R(g, 26, 14, 5, 10, '#6a4426'); R(g, 22, 21, 2, 3, '#1a1c20');
    }),
    w_skor: icon((g) => { // chaingun
      for (let i = 0; i < 3; i++) R(g, 1, 9 + i * 4, 17, 3, i === 1 ? '#7d8590' : '#4c525b');
      R(g, 17, 7, 7, 14, '#2a2d33'); R(g, 17, 7, 7, 2, '#555c66'); R(g, 24, 11, 6, 8, '#6a4426'); R(g, 19, 21, 3, 6, '#1a1c20'); R(g, 8, 22, 8, 3, '#c9a040');
    }),
  };
}

export function makePlasmaTexture() {
  const c = makeCanvas(32, 32, (g) => {
    const grd = g.createRadialGradient(16, 16, 1, 16, 16, 15);
    grd.addColorStop(0, '#f0fff0'); grd.addColorStop(0.35, '#6bff7a'); grd.addColorStop(0.7, 'rgba(40,200,70,0.55)'); grd.addColorStop(1, 'rgba(40,200,70,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
  });
  return toTexture(c, false);
}
export function makeBeamTexture() {
  const c = makeCanvas(16, 64, (g) => {
    const grd = g.createLinearGradient(0, 0, 16, 0);
    grd.addColorStop(0, 'rgba(90,255,120,0)'); grd.addColorStop(0.5, 'rgba(160,255,180,0.9)'); grd.addColorStop(1, 'rgba(90,255,120,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 16, 64);
  });
  return toTexture(c, false);
}
