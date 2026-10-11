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

const cache = {};
export function tex(name) {
  if (!cache[name]) {
    const sizes = { arcade: [128, 64], awningRed: [32, 32], awningBlue: [32, 32], lattice: [32, 128], clock: [64, 64], treeline: [512, 64], sky: [512, 256], ironDoor: [32, 64] };
    const [w, h] = sizes[name] || [64, 64];
    const noRepeat = name === 'clock' || name === 'sky';
    cache[name] = toTexture(makeCanvas(w, h, painters[name]), !noRepeat);
  }
  return cache[name];
}
