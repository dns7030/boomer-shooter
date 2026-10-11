// Procedural pixel-art sprites: lizard invaders, pickups, plasma, particles.
import * as THREE from 'three';
import { makeCanvas, toTexture, mulberry } from './textures.js';

const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

const PAL = {
  grunt: { skin: '#4b9a3a', dark: '#2a6428', light: '#86c94f', belly: '#cfdc8d', eye: '#ffd21a' },
  spitter: { skin: '#3a8f7a', dark: '#1f5a4e', light: '#6fd0b0', belly: '#bfe3c8', eye: '#ff6a1a' },
};

function outline(c) {
  const g = c.getContext('2d');
  const { width: w, height: h } = c;
  const src = g.getImageData(0, 0, w, h);
  const out = g.getImageData(0, 0, w, h);
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src.data[(y * w + x) * 4 + 3]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (a(x, y) > 0) continue;
    if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) {
      const i = (y * w + x) * 4;
      out.data[i] = 12; out.data[i + 1] = 28; out.data[i + 2] = 14; out.data[i + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
  return c;
}

function lizardFrame(kind, pose) {
  const P = PAL[kind];
  const c = makeCanvas(48, 64, (g) => {
    const rnd = mulberry(kind === 'grunt' ? 5 : 9);
    const lu = pose === 'walk1' ? 3 : 0, ru = pose === 'walk2' ? 3 : 0;
    const attack = pose === 'attack', pain = pose === 'pain';
    const hx = pain ? -2 : 0, hy = pain ? 2 : 0;
    // tail
    R(g, 31, 50, 8, 4, P.skin); R(g, 37, 46, 6, 4, P.skin); R(g, 41, 39, 4, 7, P.dark); R(g, 33, 52, 6, 2, P.dark);
    // legs and feet
    R(g, 14, 40, 8, 17 - lu, P.skin); R(g, 12, 57 - lu, 11, 3, P.dark); R(g, 12, 59 - lu, 2, 1, P.light); R(g, 16, 59 - lu, 2, 1, P.light); R(g, 20, 59 - lu, 2, 1, P.light);
    R(g, 26, 40, 8, 17 - ru, P.skin); R(g, 25, 57 - ru, 11, 3, P.dark); R(g, 25, 59 - ru, 2, 1, P.light); R(g, 29, 59 - ru, 2, 1, P.light); R(g, 33, 59 - ru, 2, 1, P.light);
    // torso
    R(g, 13, 22, 22, 20, P.skin); R(g, 15, 20, 18, 2, P.skin);
    R(g, 19, 24, 10, 16, P.belly);
    for (let y = 26; y < 40; y += 3) R(g, 19, y, 10, 1, '#a9bd6c');
    for (let i = 0; i < 40; i++) R(g, 13 + ((rnd() * 22) | 0), 22 + ((rnd() * 18) | 0), 1, 1, P.dark);
    // arms
    if (attack) {
      R(g, 5, 14, 6, 14, P.skin); R(g, 2, 9, 9, 5, P.light); R(g, 3, 8, 1, 2, '#fff'); R(g, 6, 7, 1, 2, '#fff'); R(g, 9, 8, 1, 2, '#fff');
      R(g, 37, 14, 6, 14, P.skin); R(g, 37, 9, 9, 5, P.light); R(g, 38, 8, 1, 2, '#fff'); R(g, 41, 7, 1, 2, '#fff'); R(g, 44, 8, 1, 2, '#fff');
    } else if (pain) {
      R(g, 8, 24, 6, 12, P.skin); R(g, 7, 36, 8, 3, P.light);
      R(g, 34, 22, 6, 12, P.skin); R(g, 33, 34, 8, 3, P.light);
    } else {
      R(g, 7, 23, 6, 16, P.skin); R(g, 6, 39, 8, 3, P.light); R(g, 6, 42, 1, 2, '#fff'); R(g, 9, 42, 1, 2, '#fff'); R(g, 12, 42, 1, 2, '#fff');
      R(g, 35, 23, 6, 16, P.skin); R(g, 34, 39, 8, 3, P.light);
    }
    if (kind === 'spitter') {
      R(g, 13, 22, 22, 10, '#4c5170'); R(g, 20, 24, 8, 3, '#7cff7c'); R(g, 13, 31, 22, 1, '#2a2e44');
      R(g, 9, 21, 6, 4, '#5a6080'); R(g, 33, 21, 6, 4, '#5a6080');
      const gy = attack ? 16 : 28;
      R(g, 36, gy, 10, 5, '#555a70'); R(g, 44, gy + 1, 3, 3, attack ? '#d0ffd0' : '#7cff7c'); R(g, 36, gy + 5, 3, 3, '#3a3e54');
    }
    // head
    R(g, 16 + hx, 6 + hy, 16, 13, P.skin);
    R(g, 18 + hx, 13 + hy, 12, 7, P.light);
    R(g, 21 + hx, 14 + hy, 1, 1, P.dark); R(g, 26 + hx, 14 + hy, 1, 1, P.dark);
    R(g, 17 + hx, 9 + hy, 5, pain ? 2 : 3, P.eye); R(g, 26 + hx, 9 + hy, 5, pain ? 2 : 3, P.eye);
    R(g, 19 + hx, 9 + hy, 1, 3, '#000'); R(g, 28 + hx, 9 + hy, 1, 3, '#000');
    R(g, 16 + hx, 8 + hy, 6, 1, P.dark); R(g, 26 + hx, 8 + hy, 6, 1, P.dark);
    R(g, 22 + hx, 2 + hy, 4, 4, P.dark); R(g, 20 + hx, 4 + hy, 2, 3, P.dark); R(g, 26 + hx, 4 + hy, 2, 3, P.dark);
    if (attack || pain) {
      R(g, 19 + hx, 17 + hy, 10, 4, '#7a1020');
      R(g, 20 + hx, 17 + hy, 1, 2, '#fff'); R(g, 23 + hx, 17 + hy, 1, 2, '#fff'); R(g, 27 + hx, 17 + hy, 1, 2, '#fff');
    } else R(g, 19 + hx, 18 + hy, 10, 1, P.dark);
  });
  return outline(c);
}

// death frames: crumple the 'pain' frame
function deathFrame(base, t) {
  return makeCanvas(48, 64, (g) => {
    const sy = 1 - t * 0.68, sx = 1 + t * 0.35;
    const w = 48 * sx, h = 64 * sy;
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 1;
    // green blood pool
    g.fillStyle = '#2f7a2a';
    g.fillRect(24 - w * 0.5, 61, w, 3);
    g.drawImage(base, 0, 0, 48, 64, 24 - w / 2 + t * 4, 64 - h - 1, w, h);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = `rgba(0,20,0,${0.15 + t * 0.35})`; g.fillRect(0, 0, 48, 64);
  });
}

export function makeLizardTextures() {
  const out = {};
  for (const kind of ['grunt', 'spitter']) {
    const frames = {};
    for (const pose of ['idle', 'walk1', 'walk2', 'attack', 'pain']) frames[pose] = toTexture(lizardFrame(kind, pose), false);
    const painCanvas = lizardFrame(kind, 'pain');
    frames.dead = [0.3, 0.65, 1].map((t) => toTexture(deathFrame(painCanvas, t), false));
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
    w_blunder: icon((g) => { // blunderbuss
      R(g, 3, 12, 8, 8, '#555a60'); R(g, 1, 10, 4, 12, '#6a7076'); R(g, 10, 14, 14, 4, '#4a4e54'); R(g, 20, 12, 10, 9, '#6a4426'); R(g, 14, 13, 2, 6, '#d9a62a'); R(g, 2, 14, 2, 4, '#111');
    }),
    w_skor: icon((g) => { // organ gun
      for (let i = 0; i < 5; i++) R(g, 2, 7 + i * 4, 18, 3, i % 2 ? '#6a7076' : '#555a60');
      R(g, 18, 6, 4, 20, '#6a4426'); R(g, 22, 12, 8, 8, '#6a4426'); R(g, 4, 28, 12, 2, '#3a2412'); R(g, 14, 2, 2, 5, '#d9a62a');
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
