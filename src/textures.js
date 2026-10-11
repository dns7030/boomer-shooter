// Procedural, pixel-art style textures drawn on canvases. No external assets.
import * as THREE from 'three';

export function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  draw(g, w, h);
  return c;
}

export function toTexture(canvas, repeat = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapLinearFilter;
  t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function speckle(g, w, h, rnd, count, colors) {
  for (let i = 0; i < count; i++) R(g, (rnd() * w) | 0, (rnd() * h) | 0, 1, 1, colors[(rnd() * colors.length) | 0]);
}
const pick = (rnd, a) => a[(rnd() * a.length) | 0];

const painters = {
  logs(g, w, h) {
    const rnd = mulberry(11);
    const pal = ['#6b4423', '#7a4e2a', '#5e3a1e', '#70461f'];
    for (let r = 0; r < 8; r++) {
      const y = r * 8;
      R(g, 0, y, w, 8, pick(rnd, pal));
      R(g, 0, y, w, 1, '#9a6a3c');
      R(g, 0, y + 6, w, 2, '#3a2312');
      for (let k = 0; k < 3; k++) R(g, (rnd() * 56) | 0, y + 2 + ((rnd() * 3) | 0), 6 + ((rnd() * 8) | 0), 1, '#54341a');
      if (rnd() < 0.5) { const kx = (rnd() * 56) | 0; R(g, kx, y + 2, 3, 3, '#3a2312'); R(g, kx + 1, y + 3, 1, 1, '#1e120a'); }
    }
  },
  planks(g, w, h) {
    const rnd = mulberry(12);
    const pal = ['#8a6d4b', '#7d6244', '#957650', '#73593d'];
    for (let c = 0; c < 8; c++) {
      R(g, c * 8, 0, 8, h, pick(rnd, pal));
      R(g, c * 8, 0, 1, h, '#4a3825');
      R(g, c * 8 + 7, 0, 1, h, '#5a4631');
      for (let k = 0; k < 6; k++) R(g, c * 8 + 1 + ((rnd() * 5) | 0), (rnd() * 56) | 0, 1, 4 + ((rnd() * 8) | 0), '#5e4830');
    }
  },
  plaster(g, w, h) {
    const rnd = mulberry(13);
    R(g, 0, 0, w, h, '#e8e0cc');
    speckle(g, w, h, rnd, 260, ['#d9d0b8', '#f4eedd', '#cfc5aa']);
    for (let k = 0; k < 3; k++) { let x = (rnd() * w) | 0, y = (rnd() * h) | 0; for (let i = 0; i < 10; i++) { R(g, x, y, 1, 1, '#b8ad92'); x += ((rnd() * 3) | 0) - 1; y += 1; } }
  },
  brick(g, w, h) {
    const rnd = mulberry(14);
    R(g, 0, 0, w, h, '#b9a78a');
    const pal = ['#9b3a28', '#8c3323', '#a8442f', '#7d2e20'];
    for (let r = 0; r < 8; r++) {
      const off = r % 2 ? 8 : 0;
      for (let c = -1; c < 5; c++) {
        const x = c * 16 + off;
        R(g, x + 1, r * 8 + 1, 15, 7, pick(rnd, pal));
        R(g, x + 1, r * 8 + 1, 15, 1, '#b85a42');
      }
    }
    speckle(g, w, h, rnd, 120, ['#6e2a1c', '#c46a50']);
  },
  stone(g, w, h) {
    const rnd = mulberry(15);
    R(g, 0, 0, w, h, '#5d5a55');
    const pal = ['#9a968c', '#a8a498', '#8e8a80', '#b2ad9e'];
    for (let r = 0; r < 4; r++) {
      let x = -(rnd() * 8) | 0;
      while (x < w) {
        const bw = 12 + ((rnd() * 10) | 0);
        R(g, x + 1, r * 16 + 1, bw - 1, 15, pick(rnd, pal));
        R(g, x + 1, r * 16 + 1, bw - 1, 1, '#c8c3b2');
        x += bw;
      }
    }
    speckle(g, w, h, rnd, 160, ['#7b776d', '#bdb8a8']);
  },
  cobble(g, w, h) {
    const rnd = mulberry(16);
    R(g, 0, 0, w, h, '#3b342c');
    const pal = ['#6f665a', '#7d7366', '#605850', '#857a6b'];
    for (let r = 0; r < 8; r++) {
      const off = r % 2 ? 4 : 0;
      for (let c = -1; c < 8; c++) {
        const x = c * 8 + off + (((rnd() * 2) | 0));
        R(g, x + 1, r * 8 + 1, 6, 6, pick(rnd, pal));
        R(g, x + 1, r * 8 + 1, 6, 1, '#988c7a');
      }
    }
  },
  dirt(g, w, h) {
    const rnd = mulberry(17);
    R(g, 0, 0, w, h, '#6b5640');
    speckle(g, w, h, rnd, 500, ['#5a4733', '#7a634a', '#4a3a2a', '#8a7358']);
    for (let i = 0; i < 14; i++) R(g, (rnd() * w) | 0, (rnd() * h) | 0, 2, 2, '#9a8a70');
  },
  shingleBrown: (g, w, h) => shingles(g, w, h, ['#6a4b34', '#5c4030', '#765439', '#4f372a'], 21),
  shingleGreen: (g, w, h) => shingles(g, w, h, ['#4f7a5a', '#456e51', '#5a8664', '#3d6046'], 22),
  shingleRed: (g, w, h) => shingles(g, w, h, ['#a8452c', '#98391f', '#b65236', '#873220'], 23),
  shingleGrey: (g, w, h) => shingles(g, w, h, ['#7d8588', '#6f787b', '#8a9396', '#626b6e'], 24),
  domeSilver(g, w, h) { shingles(g, w, h, ['#8fa6a2', '#9fb6b0', '#7d9490', '#a9c0ba'], 25); },
  domeGold(g, w, h) { shingles(g, w, h, ['#d9a62a', '#e6b83a', '#c2921d', '#f0c850'], 26); },
  domeBlue(g, w, h) { shingles(g, w, h, ['#2f5fa8', '#3a6cb8', '#264f90', '#4a7ac8'], 27); },
  arcade(g, w, h) {
    const rnd = mulberry(31);
    R(g, 0, 0, w, h, '#e8e0cc');
    speckle(g, w, h, rnd, 200, ['#d9d0b8', '#f4eedd']);
    R(g, 0, h - 6, w, 6, '#9a968c');
    // arch opening
    const x0 = 22, x1 = 106, top = 20;
    for (let x = x0; x < x1; x++) {
      const cx = (x - (x0 + x1) / 2) / ((x1 - x0) / 2);
      const ay = top + Math.round((1 - Math.sqrt(Math.max(0, 1 - cx * cx))) * 18);
      R(g, x, ay, 1, h - 6 - ay, '#2b1d14');
      R(g, x, ay - 1, 1, 1, '#c2b79c');
    }
    R(g, x0 - 3, 30, 3, h - 36, '#cfc5aa'); R(g, x1, 30, 3, h - 36, '#cfc5aa');
    // wares inside
    R(g, 30, 44, 68, 3, '#7a5a38');
    const cols = ['#c04030', '#d8b040', '#4a7ac0', '#6aa050', '#e0e0d0'];
    for (let i = 0; i < 14; i++) R(g, 32 + i * 4, 38 + ((rnd() * 4) | 0), 3, 6, pick(rnd, cols));
    R(g, 24, 32, 3, 26, '#4a3825'); R(g, 101, 32, 3, 26, '#4a3825');
  },
  awningRed(g, w, h) { for (let i = 0; i < 8; i++) R(g, i * 4, 0, 4, h, i % 2 ? '#e8e0cc' : '#b8352a'); },
  awningBlue(g, w, h) { for (let i = 0; i < 8; i++) R(g, i * 4, 0, 4, h, i % 2 ? '#e8e0cc' : '#2f5fa8'); },
  crate(g, w, h) {
    painters.planks(g, w, h);
    R(g, 0, 0, w, 4, '#4a3320'); R(g, 0, h - 4, w, 4, '#4a3320'); R(g, 0, 0, 4, h, '#4a3320'); R(g, w - 4, 0, 4, h, '#4a3320');
    for (let i = 0; i < w; i++) { R(g, i, i, 1, 1, '#3a2818'); R(g, w - 1 - i, i, 1, 1, '#3a2818'); }
  },
  barrel(g, w, h) {
    painters.planks(g, w, h);
    R(g, 0, 8, w, 4, '#3b3b40'); R(g, 0, h - 12, w, 4, '#3b3b40');
  },
  ironDoor(g, w, h) {
    const rnd = mulberry(41);
    R(g, 0, 0, w, h, '#4a3620');
    for (let c = 0; c < w; c += 8) R(g, c, 0, 1, h, '#2a1c10');
    for (let r = 10; r < h; r += 18) { R(g, 0, r, w, 3, '#2d2d33'); for (let c = 3; c < w; c += 9) R(g, c, r, 2, 3, '#6a6a72'); }
    speckle(g, w, h, rnd, 80, ['#3a2a18', '#5a4630']);
  },
  lattice(g, w, h) {
    g.clearRect(0, 0, w, h);
    R(g, 0, 0, 2, h, '#6a4b2c'); R(g, w - 2, 0, 2, h, '#6a4b2c');
    for (let y = 0; y < h; y += 8) R(g, 0, y, w, 1, '#8a6a42');
    R(g, w / 2 - 1, 0, 2, h, '#6a4b2c');
  },
  clock(g, w, h) {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#d8b040'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 1, 0, 7); g.fill();
    g.fillStyle = '#f2ecd8'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 5, 0, 7); g.fill();
    g.fillStyle = '#222'; for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; R(g, Math.round(w / 2 + Math.sin(a) * 22) - 1, Math.round(h / 2 - Math.cos(a) * 22) - 1, 3, 3, '#222'); }
    R(g, w / 2 - 1, h / 2 - 18, 2, 18, '#222'); R(g, w / 2, h / 2 - 1, 12, 2, '#222');
  },
  treeline(g, w, h) {
    const rnd = mulberry(51);
    g.clearRect(0, 0, w, h);
    for (let x = 0; x < w; x += 6) {
      const th = 20 + ((rnd() * 36) | 0), tw = 10 + ((rnd() * 8) | 0);
      for (let y = 0; y < th; y++) {
        const ww = Math.max(1, Math.round((tw * (y + 4)) / th));
        R(g, x + 4 - (ww >> 1), h - th + y, ww, 1, y % 5 === 0 ? '#16281e' : '#1d3326');
      }
    }
  },
  sky(g, w, h) {
    const rnd = mulberry(61);
    const grd = g.createLinearGradient(0, 0, 0, h * 0.62);
    grd.addColorStop(0, '#2a2547'); grd.addColorStop(0.45, '#7a4668'); grd.addColorStop(0.8, '#e07f4e'); grd.addColorStop(1, '#f6b872');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    R(g, 0, h * 0.62, w, h, '#5a3a30');
    for (let i = 0; i < 70; i++) {
      g.globalAlpha = 0.1 + rnd() * 0.18;
      g.fillStyle = rnd() < 0.5 ? '#f8c9a0' : '#3a2a4a';
      const cx = rnd() * w, cy = h * (0.18 + rnd() * 0.4), rw = 20 + rnd() * 60;
      g.fillRect(cx, cy, rw, 2 + rnd() * 3);
    }
    g.globalAlpha = 1;
  },
  glass(g, w, h) { R(g, 0, 0, w, h, '#fff'); },
};

function shingles(g, w, h, pal, seed) {
  const rnd = mulberry(seed);
  for (let r = 0; r < 8; r++) {
    const off = r % 2 ? 4 : 0;
    for (let c = -1; c < 9; c++) {
      const x = c * 8 + off;
      R(g, x, r * 8, 8, 8, pick(rnd, pal));
      R(g, x, r * 8, 8, 1, 'rgba(255,255,255,0.18)');
      R(g, x, r * 8 + 7, 8, 1, 'rgba(0,0,0,0.45)');
      R(g, x + 7, r * 8, 1, 8, 'rgba(0,0,0,0.3)');
    }
  }
}

// Non-tiled decals: windows / doors, parameterised by trim colour.
export function windowCanvas(trim, lit) {
  return makeCanvas(32, 48, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    R(g, 2, 8, 28, 38, trim);
    R(g, 0, 6, 32, 4, trim);
    R(g, 3, 2, 26, 4, trim); R(g, 8, 0, 16, 3, trim);
    R(g, 6, 12, 20, 30, lit ? '#f0b050' : '#1b2331');
    if (lit) { R(g, 6, 12, 20, 6, '#ffd890'); R(g, 6, 36, 20, 6, '#c47a2a'); }
    R(g, 15, 12, 2, 30, trim); R(g, 6, 24, 20, 2, trim);
    R(g, 6, 12, 20, 1, 'rgba(0,0,0,.4)');
    R(g, 3, 44, 26, 3, 'rgba(0,0,0,.35)');
  });
}
export function doorCanvas(color) {
  return makeCanvas(32, 56, (g, w, h) => {
    const rnd = mulberry(77);
    g.clearRect(0, 0, w, h);
    R(g, 2, 8, 28, 48, '#3a2615');
    R(g, 4, 10, 24, 46, color);
    for (let c = 4; c < 28; c += 6) R(g, c, 10, 1, 46, 'rgba(0,0,0,.35)');
    R(g, 3, 4, 26, 5, '#e8d7a0'); R(g, 0, 6, 32, 3, '#e8d7a0');
    R(g, 22, 32, 2, 4, '#d8b040');
    speckle(g, w, h, rnd, 30, ['rgba(0,0,0,.25)']);
  });
}
export function archDecal(w, h) { // dark arched opening (belfry / gate)
  return makeCanvas(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#1c130c';
    g.beginPath(); g.moveTo(2, h); g.lineTo(2, h * 0.4); g.arc(w / 2, h * 0.4, w / 2 - 2, Math.PI, 0); g.lineTo(w - 2, h); g.fill();
    R(g, 0, h - 3, w, 3, '#cfc5aa');
  });
}


// ---------- Soviet-era textures ----------
function stain(g, w, h, rnd, n) {
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(60,52,44,${0.04 + rnd() * 0.08})`; g.fillRect((rnd() * w) | 0, (rnd() * h) | 0, 2 + ((rnd() * 4) | 0), 8 + ((rnd() * 24) | 0)); }
}
function glassPane(g, x, y, w, h, rnd, litChance = 0.18) {
  const r = rnd();
  if (r < litChance) { R(g, x, y, w, h, '#e6c277'); R(g, x, y, w, 3, '#fbe3a0'); }
  else if (r < litChance + 0.18) R(g, x, y, w, h, pick(rnd, ['#9a5a48', '#5a7a5a', '#c8b090', '#7a6a8a']));
  else { R(g, x, y, w, h, '#2c3b4c'); R(g, x, y, w, Math.max(2, h >> 2), '#4a6580'); }
}
Object.assign(painters, {
  concrete(g, w, h) {
    const rnd = mulberry(101);
    R(g, 0, 0, w, h, '#8f8d86');
    speckle(g, w, h, rnd, 500, ['#7d7b74', '#a09e96', '#6f6d67']);
    R(g, 0, 0, w, 1, '#a8a69e'); R(g, 0, h - 1, w, 1, '#6a6862');
  },
  concreteDark(g, w, h) {
    const rnd = mulberry(102);
    R(g, 0, 0, w, h, '#6a6863');
    speckle(g, w, h, rnd, 600, ['#5a5853', '#7a7872', '#4e4c48']);
    stain(g, w, h, rnd, 10);
  },
  panel(g, w, h) { // 2x2 cells of 64px (3 m each): window per cell
    const rnd = mulberry(103);
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
      const x0 = cx * 64, y0 = cy * 64;
      R(g, x0, y0, 64, 64, '#bab6aa');
      speckle(g.__proto__ === undefined ? g : g, w, h, rnd, 0, ['#000']);
      for (let i = 0; i < 70; i++) R(g, x0 + ((rnd() * 64) | 0), y0 + ((rnd() * 64) | 0), 1, 1, rnd() < 0.5 ? '#a8a498' : '#c8c4b8');
      R(g, x0, y0, 64, 1, '#8a867c'); R(g, x0, y0, 1, 64, '#d0ccc0');
      R(g, x0 + 13, y0 + 12, 38, 38, '#ecebe4');
      glassPane(g, x0 + 16, y0 + 15, 32, 32, rnd);
      R(g, x0 + 31, y0 + 15, 2, 32, '#ecebe4'); R(g, x0 + 16, y0 + 24, 32, 2, '#ecebe4');
      R(g, x0 + 11, y0 + 50, 42, 3, '#7a766c');
    }
    stain(g, w, h, rnd, 14);
  },
  panelLoggia(g, w, h) {
    const rnd = mulberry(104);
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
      const x0 = cx * 64, y0 = cy * 64;
      R(g, x0, y0, 64, 64, '#c6c1b2');
      for (let i = 0; i < 60; i++) R(g, x0 + ((rnd() * 64) | 0), y0 + ((rnd() * 64) | 0), 1, 1, rnd() < 0.5 ? '#b0ab9c' : '#d6d2c4');
      R(g, x0, y0, 64, 1, '#8a867c'); R(g, x0, y0, 1, 64, '#d8d4c6');
      R(g, x0 + 6, y0 + 8, 36, 44, '#3b3a38');                      // loggia recess
      R(g, x0 + 6, y0 + 8, 36, 3, '#8c887c');
      glassPane(g, x0 + 10, y0 + 14, 14, 26, rnd, 0.22);
      R(g, x0 + 28, y0 + 14, 11, 28, rnd() < 0.5 ? '#2c3b4c' : '#e6c277');
      const rail = pick(rnd, ['#d8d4c4', '#2f5fa8', '#c86a2a', '#6a9a5a']);
      R(g, x0 + 6, y0 + 40, 36, 12, rail); R(g, x0 + 6, y0 + 40, 36, 1, 'rgba(0,0,0,.35)');
      for (let b = 9; b < 42; b += 6) R(g, x0 + b, y0 + 43, 1, 8, 'rgba(0,0,0,.3)');
      R(g, x0 + 46, y0 + 8, 14, 44, '#bcb7a8');                     // solid panel strip
      if (rnd() < 0.3) R(g, x0 + 12 + ((rnd() * 22) | 0), y0 + 18, 5, 12, pick(rnd, ['#d04040', '#4a7ac0', '#e0e0d0']));
    }
    stain(g, w, h, rnd, 12);
  },
  ribbon(g, w, h) {
    const rnd = mulberry(105);
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
      const x0 = cx * 64, y0 = cy * 64;
      R(g, x0, y0, 64, 64, '#bcb8ac');
      for (let i = 0; i < 50; i++) R(g, x0 + ((rnd() * 64) | 0), y0 + ((rnd() * 22) | 0), 1, 1, rnd() < 0.5 ? '#a8a498' : '#cdc9bd');
      R(g, x0, y0, 64, 1, '#8a867c');
      R(g, x0, y0 + 22, 64, 34, '#d6d4ca');
      for (let b = 0; b < 4; b++) glassPane(g, x0 + b * 16 + 1, y0 + 24, 14, 29, rnd, 0.16);
      R(g, x0, y0 + 56, 64, 8, '#a6a296');
    }
  },
  curtain(g, w, h) {
    const rnd = mulberry(106);
    R(g, 0, 0, w, h, '#2a2f33');
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const t = rnd();
      g.fillStyle = grdv(g, y * 16 + 1, 14, t < 0.1 ? ['#e6c277', '#c49a50'] : t < 0.5 ? ['#7fa3b6', '#4a6e82'] : ['#5d8196', '#36556a']);
      g.fillRect(x * 16 + 1, y * 16 + 1, 14, 14);
    }
  },
  stalin(g, w, h) {
    const rnd = mulberry(107);
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
      const x0 = cx * 64, y0 = cy * 64;
      R(g, x0, y0, 64, 64, '#d9cba2');
      for (let i = 0; i < 90; i++) R(g, x0 + ((rnd() * 64) | 0), y0 + ((rnd() * 64) | 0), 1, 1, rnd() < 0.5 ? '#c8b98e' : '#e6d9b4');
      R(g, x0 + 16, y0 + 6, 32, 50, '#efe5c6');
      R(g, x0 + 19, y0 + 9, 26, 44, '#26303a'); R(g, x0 + 19, y0 + 9, 26, 8, '#3c4c60');
      if (rnd() < 0.3) { R(g, x0 + 19, y0 + 9, 26, 44, '#d8b868'); }
      R(g, x0 + 31, y0 + 9, 2, 44, '#efe5c6'); R(g, x0 + 19, y0 + 22, 26, 2, '#efe5c6');
      R(g, x0 + 12, y0 + 56, 40, 3, '#b8a878'); R(g, x0, y0 + 62, 64, 2, '#bfae80');
    }
    stain(g, w, h, rnd, 10);
  },
  asphalt(g, w, h) {
    const rnd = mulberry(108);
    R(g, 0, 0, w, h, '#3c3c3e');
    speckle(g, w, h, rnd, 700, ['#4a4a4d', '#2e2e30', '#555558']);
    for (let k = 0; k < 2; k++) { let x = (rnd() * w) | 0, y = (rnd() * h) | 0; for (let i = 0; i < 14; i++) { R(g, x, y, 1, 1, '#222'); x += ((rnd() * 3) | 0) - 1; y += 1; } }
  },
  paving(g, w, h) {
    const rnd = mulberry(109);
    R(g, 0, 0, w, h, '#6a6862');
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { R(g, x * 16 + 1, y * 16 + 1, 15, 15, pick(rnd, ['#a09e96', '#96948c', '#aaa8a0'])); }
    speckle(g, w, h, rnd, 80, ['#8a8880', '#b4b2aa']);
  },
  pavingDark(g, w, h) {
    const rnd = mulberry(110);
    R(g, 0, 0, w, h, '#4e4c48');
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { R(g, x * 32 + 1, y * 32 + 1, 31, 31, pick(rnd, ['#6a6862', '#625f5a', '#726f69'])); }
    speckle(g, w, h, rnd, 120, ['#52504b', '#7c7a74']);
  },
  grass(g, w, h) {
    const rnd = mulberry(111);
    R(g, 0, 0, w, h, '#586d3c');
    speckle(g, w, h, rnd, 900, ['#677f46', '#4a5e32', '#74894e', '#5e7340']);
    for (let i = 0; i < 20; i++) R(g, (rnd() * w) | 0, (rnd() * h) | 0, 2, 1, '#8a7a58');
  },
  metalRoof(g, w, h) {
    for (let x = 0; x < w; x += 4) { R(g, x, 0, 3, h, '#767c82'); R(g, x + 3, 0, 1, h, '#4e5358'); R(g, x, 0, 1, h, '#9aa0a6'); }
  },
  roofTar(g, w, h) {
    const rnd = mulberry(112);
    R(g, 0, 0, w, h, '#34332f');
    speckle(g, w, h, rnd, 500, ['#2a2926', '#403f3a', '#4a4944']);
  },
  chimney(g, w, h) {
    R(g, 0, 0, w, h, '#b8362a');
    for (let y = 0; y < h; y += 32) R(g, 0, y, w, 16, '#e8e4dc');
    R(g, 0, 0, 3, h, 'rgba(255,255,255,.18)'); R(g, w - 4, 0, 4, h, 'rgba(0,0,0,.25)');
  },
  circus(g, w, h) {
    for (let x = 0; x < w; x += 8) { R(g, x, 0, 8, h, (x / 8) % 2 ? '#c9c5b8' : '#e8e4d8'); }
    R(g, 0, 40, w, 14, '#2f5fa8'); R(g, 0, 38, w, 2, '#d9a62a'); R(g, 0, 54, w, 2, '#d9a62a');
  },
  skyGrey(g, w, h) {
    const rnd = mulberry(113);
    const gr = g.createLinearGradient(0, 0, 0, h * 0.62);
    gr.addColorStop(0, '#4c5563'); gr.addColorStop(0.5, '#8d98a5'); gr.addColorStop(0.85, '#cfc8b8'); gr.addColorStop(1, '#e6d8bc');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    R(g, 0, h * 0.62, w, h, '#5a554e');
    for (let i = 0; i < 90; i++) { g.globalAlpha = 0.08 + rnd() * 0.16; g.fillStyle = rnd() < 0.5 ? '#e8e2d4' : '#39414e'; g.fillRect(rnd() * w, h * (0.1 + rnd() * 0.45), 30 + rnd() * 90, 2 + rnd() * 4); }
    g.globalAlpha = 1;
  },
  tramSide(g, w, h) { // 128x32
    R(g, 0, 0, w, h, '#b8352a'); R(g, 0, 20, w, 12, '#e8e0c8'); R(g, 0, 19, w, 1, '#7a1c14');
    for (let x = 4; x < w - 8; x += 22) { R(g, x, 5, 18, 12, '#26323e'); R(g, x, 5, 18, 3, '#4a6075'); }
    R(g, 0, 29, w, 3, '#2a2a2a');
  },
  flame(g, w, h) {
    g.clearRect(0, 0, w, h);
    const rg = g.createRadialGradient(w / 2, h * 0.7, 2, w / 2, h * 0.6, h * 0.5);
    rg.addColorStop(0, 'rgba(255,250,200,1)'); rg.addColorStop(0.3, 'rgba(255,170,40,0.9)'); rg.addColorStop(0.7, 'rgba(220,70,10,0.5)'); rg.addColorStop(1, 'rgba(160,30,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  },
  steam(g, w, h) {
    g.clearRect(0, 0, w, h);
    const rnd = mulberry(114);
    for (let i = 0; i < 26; i++) {
      const x = w / 2 + (rnd() - 0.5) * w * 0.5, y = h / 2 + (rnd() - 0.5) * h * 0.5, r = 10 + rnd() * 18;
      const rg = g.createRadialGradient(x, y, 1, x, y, r);
      rg.addColorStop(0, 'rgba(235,235,232,0.5)'); rg.addColorStop(1, 'rgba(235,235,232,0)');
      g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  },
});
function grdv(g, y, h, [a, b]) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; }

// Text signs (Cyrillic works if the browser has a font for it)
export function textTexture(text, w = 512, h = 128, { bg = '#b8352a', fg = '#f4efe0', font = 'bold 72px Arial, Helvetica, sans-serif', border = '#f4efe0' } = {}) {
  const c = makeCanvas(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (border) { g.strokeStyle = border; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); }
    g.font = font; g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = parseInt(font.match(/(\d+)px/)[1], 10);
    while (g.measureText(text).width > w - 36 && size > 12) { size -= 4; g.font = font.replace(/\d+px/, `${size}px`); }
    g.fillText(text, w / 2, h / 2 + 4);
  });
  return toTexture(c, false);
}

const cache = {};
export function tex(name) {
  if (!cache[name]) {
    const sizes = { panel: [128, 128], panelLoggia: [128, 128], ribbon: [128, 128], stalin: [128, 128], tramSide: [128, 32], flame: [64, 96], steam: [128, 128], skyGrey: [512, 256], chimney: [32, 64], metalRoof: [32, 32], arcade: [128, 64], awningRed: [32, 32], awningBlue: [32, 32], lattice: [32, 128], clock: [64, 64], treeline: [512, 64], sky: [512, 256], ironDoor: [32, 64] };
    const [w, h] = sizes[name] || [64, 64];
    const noRepeat = name === 'clock' || name === 'sky' || name === 'skyGrey' || name === 'flame' || name === 'steam' || name === 'tramSide';
    cache[name] = toTexture(makeCanvas(w, h, painters[name]), !noRepeat);
  }
  return cache[name];
}
