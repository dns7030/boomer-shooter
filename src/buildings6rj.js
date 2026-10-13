// Rio de Janeiro: bright, saturated, tropical landmarks, colonial Lapa, Copacabana beach props and a samba club.
// Same conventions as the other building files: origin = footprint centre on the ground, front faces local +Z,
// group.userData = { w, d, h[, cols] }.  Textures are prefixed s6rj_.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, decal } from './geo.js';
import { slab, tiledPlane, sign } from './buildings2.js';
import { addPainters, mulberry, tex } from './textures.js';
import { hall } from './interiors.js';

const G = () => new THREE.Group();
const NEO = 0x00e599;
const PI = Math.PI;
const size = (g, w, d, h, cols, extra) => { g.userData = { ...g.userData, w, d, h, ...(extra || {}) }; if (cols) g.userData.cols = cols; return g; };
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const pick = (r, a) => a[(r() * a.length) | 0];
const C = (hex, e) => color(hex, e === undefined ? {} : { emissive: e });
const glow = (hex) => color(hex, { emissive: hex });
const _m = {};
const keyed = (k, f) => _m[k] || (_m[k] = f());
const shiny = (hex, sh = 60, em = 0) => keyed(`p${hex}_${sh}_${em}`, () => new THREE.MeshPhongMaterial({ color: hex, shininess: sh, specular: 0x777777, emissive: em }));
const dbl = (hex, em = 0) => keyed(`d${hex}_${em}`, () => new THREE.MeshLambertMaterial({ color: hex, emissive: em, side: THREE.DoubleSide }));
const basic = (hex) => keyed(`b${hex}`, () => new THREE.MeshBasicMaterial({ color: hex }));
const glassM = (hex, op) => keyed(`g${hex}_${op}`, () => new THREE.MeshLambertMaterial({ color: hex, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
const alphaMat = (name) => keyed(`a${name}`, () => new THREE.MeshLambertMaterial({ map: tex(name), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
const tint = (name, hex) => keyed(`t${name}${hex}`, () => new THREE.MeshLambertMaterial({ map: tex(name), color: hex }));
const flatMap = (name) => keyed(`f${name}`, () => new THREE.MeshBasicMaterial({ map: tex(name) }));

// ---- scene-building helpers ----
const Bx = (g, w, h, d, m, x, y, z, tile = 3) => { const b = boxT(w, h, d, m, tile); b.position.set(x, y, z); g.add(b); return b; };
const Cy = (g, rt, rb, h, n, m, x, y, z, tile = 3) => { const b = cylT(rt, rb, h, n, m, tile); b.position.set(x, y, z); g.add(b); return b; };
const Ms = (g, geo, m, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); g.add(o); return o;
};
const sgn = (g, text, w, h, x, y, z, ry = 0, o = {}) => { const s = sign(text, w, h, o); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; };
const win = (g, w, h, x, y, z, ry = 0, o = {}) => { const d = decal('window', w, h, x, y, z, { c: '#fbfaf4', ...o }); d.rotation.y = ry; g.add(d); return d; };

const _M4 = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _P = new THREE.Vector3(), _S = new THREE.Vector3();
function xf(geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _E.set(rx, ry, rz); _Q.setFromEuler(_E); _M4.compose(_P.set(x, y, z), _Q, _S.set(sx, sy, sz)); geo.applyMatrix4(_M4); return geo;
}
const gb = (w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) => xf(new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz);
const gcy = (rt, rb, h, n, x, y, z, rx = 0, ry = 0, rz = 0) => xf(new THREE.CylinderGeometry(rt, rb, h, n), x, y, z, rx, ry, rz);
const gsp = (r, x, y, z, sx = 1, sy = 1, sz = 1, n = 8) => xf(new THREE.SphereGeometry(r, n, Math.max(4, n >> 1)), x, y, z, 0, 0, 0, sx, sy, sz);
const gco = (r, h, n, x, y, z, rx = 0, ry = 0, rz = 0) => xf(new THREE.ConeGeometry(r, h, n), x, y, z, rx, ry, rz);
const gpl = (w, h, x, y, z, rx = 0, ry = 0, rz = 0) => xf(new THREE.PlaneGeometry(w, h), x, y, z, rx, ry, rz);
function rodG(a, b, r, seg = 5) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const geo = new THREE.CylinderGeometry(r, r, len, seg, 1, false);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  geo.translate(A.x + d.x * len / 2, A.y + d.y * len / 2, A.z + d.z * len / 2);
  return geo;
}
function triG(a, b, c) {   // single triangle (use with double-sided material)
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c]), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0.5, 1]), 2));
  geo.computeVertexNormals(); return geo;
}
function merge(list) {
  const gs = list.map((x) => (x.index ? x.toNonIndexed() : x));
  let n = 0; gs.forEach((x) => { n += x.attributes.position.count; });
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
  for (const x of gs) {
    P.set(x.attributes.position.array, o * 3); N.set(x.attributes.normal.array, o * 3);
    if (x.attributes.uv) U.set(x.attributes.uv.array, o * 2);
    o += x.attributes.position.count;
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.BufferAttribute(P, 3)); r.setAttribute('normal', new THREE.BufferAttribute(N, 3)); r.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  return r;
}
// collects geometries per material and emits one merged mesh per material
class Pack {
  constructor() { this.m = new Map(); }
  add(geo, m) { if (typeof m === 'number') m = C(m); let l = this.m.get(m); if (!l) { l = []; this.m.set(m, l); } l.push(geo); return this; }
  build(g, ud) { for (const [m, l] of this.m) { const me = new THREE.Mesh(merge(l), m); if (ud) Object.assign(me.userData, ud); g.add(me); } return g; }
}
const uvScale = (geo, s) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * s, uv.getY(i) * s); return geo; };
const rgb = (hex) => new THREE.Color(hex);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- textures ----------
const noise = (g, w, h, r, n, cols, s = 1) => { for (let i = 0; i < n; i++) R(g, (r() * w) | 0, (r() * h) | 0, s, s, pick(r, cols)); };
const archPath = (g, x, y, w, h) => { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, PI, 0); g.lineTo(x + w, y + h); g.closePath(); };
const stripe = (c) => (g) => { for (let i = 0; i < 8; i++) R(g, i * 4, 0, 4, 32, i % 2 ? '#f6f2e6' : c); R(g, 0, 28, 32, 4, 'rgba(0,0,0,.14)'); };
const archWin = (shut) => (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#fffaf0'; archPath(g, 0, 0, 32, 48); g.fill();
  g.fillStyle = '#16324a'; archPath(g, 5, 4, 22, 41); g.fill();
  g.fillStyle = '#3a86b8'; g.fillRect(7, 14, 18, 5);
  R(g, 0, 20, 6, 24, shut); R(g, 26, 20, 6, 24, shut);
  for (let y = 22; y < 44; y += 3) { R(g, 0, y, 6, 1, 'rgba(0,0,0,.25)'); R(g, 26, y, 6, 1, 'rgba(0,0,0,.25)'); }
  R(g, 15, 12, 2, 33, '#fffaf0'); R(g, 6, 26, 20, 2, '#fffaf0'); R(g, 0, 45, 32, 3, '#fffaf0');
};
const MOSAIC = ['#1f5fc0', '#f2c71a', '#1f9a4a', '#d8302a', '#f4f4ee', '#18a8c8'];

addPainters({
  s6rj_wave(g) {
    const r = mulberry(601);
    for (let x = 0; x < 64; x++) { const w = Math.sin(x / 64 * PI * 2) * 9; for (let y = 0; y < 64; y++) R(g, x, y, 1, 1, (Math.floor((y - w + 128) / 16) & 1) ? '#ece9df' : '#17161a'); }
    noise(g, 64, 64, r, 240, ['rgba(128,128,128,.25)'], 1);
    for (let i = 0; i < 64; i += 4) { R(g, i, 0, 1, 64, 'rgba(130,130,130,.14)'); R(g, 0, i, 64, 1, 'rgba(130,130,130,.14)'); }
  },
  s6rj_stucco(g) {
    const r = mulberry(602); R(g, 0, 0, 64, 64, '#f6f1e6');
    noise(g, 64, 64, r, 260, ['rgba(120,100,70,.09)', 'rgba(255,255,255,.4)']);
    for (let i = 0; i < 6; i++) R(g, (r() * 64) | 0, 0, 1, 64, 'rgba(90,80,60,.05)');
    R(g, 0, 58, 64, 6, 'rgba(70,60,40,.07)');
  },
  s6rj_roofTile(g) {
    const r = mulberry(603);
    for (let row = 0; row < 8; row++) for (let x = -4; x < 64; x += 8) {
      const xx = x + (row % 2 ? 4 : 0); R(g, xx, row * 8, 8, 8, '#8f3418'); R(g, xx + 1, row * 8, 6, 7, pick(r, ['#d0603a', '#c4552c', '#d86e44', '#bf4f2a'])); R(g, xx + 1, row * 8 + 6, 6, 1, 'rgba(0,0,0,.3)');
    }
  },
  s6rj_thatch(g) {
    const r = mulberry(604); R(g, 0, 0, 64, 64, '#c9a24c');
    for (let i = 0; i < 220; i++) R(g, (r() * 64) | 0, (r() * 60) | 0, 1, 4 + ((r() * 8) | 0), pick(r, ['#a8822e', '#e2c26e', '#8f6d28', '#d4b25a']));
    for (let y = 14; y < 64; y += 16) R(g, 0, y, 64, 2, 'rgba(70,45,10,.35)');
  },
  s6rj_stripeRed: stripe('#e03030'), s6rj_stripeBlue: stripe('#1f6fd0'), s6rj_stripeYel: stripe('#f4c814'), s6rj_stripeGreen: stripe('#1fa04a'), s6rj_stripePink: stripe('#e8348c'),
  s6rj_archwin0: archWin('#1f6fc0'), s6rj_archwin1: archWin('#1f9a4a'), s6rj_archwin2: archWin('#d83030'),
  s6rj_mosaic(g) {
    const r = mulberry(605); R(g, 0, 0, 64, 64, '#e8e4d8');
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const k = (i * 2 + j * 3 + ((i ^ j) & 1)) % 6, x = i * 8, y = j * 8, c = MOSAIC[(k + ((r() < 0.15) ? 2 : 0)) % 6];
      R(g, x + 1, y + 1, 7, 7, c); R(g, x + 1, y + 1, 7, 1, 'rgba(255,255,255,.3)');
      if ((i + j * 2) % 5 === 0) { g.fillStyle = MOSAIC[(k + 3) % 6]; g.beginPath(); g.arc(x + 4.5, y + 4.5, 2.4, 0, 6.3); g.fill(); R(g, x + 4, y + 4, 1, 1, '#f2c71a'); }
    }
  },
  s6rj_paintwall(g) {
    const r = mulberry(606); const bands = ['#1f5fc0', '#f2c71a', '#1f9a4a', '#d8302a'];
    for (let i = 0; i < 4; i++) R(g, 0, i * 16, 64, 16, bands[i]);
    for (let i = 0; i < 4; i++) { R(g, 0, i * 16 + 14, 64, 2, '#f4f4ee'); for (let x = 4; x < 64; x += 16) { g.fillStyle = bands[(i + 2) % 4]; g.beginPath(); g.arc(x + (i % 2) * 8, i * 16 + 7, 3.5, 0, 6.3); g.fill(); } }
    noise(g, 64, 64, r, 140, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.12)']);
  },
  s6rj_sambaOuter(g) {
    const r = mulberry(607); const c = ['#d81e86', '#14b8b0', '#f6c814', '#ff7a1a'];
    for (let i = 0; i < 8; i++) R(g, i * 8, 0, 8, 64, c[i % 4]);
    for (let i = 0; i < 5; i++) { const x = 4 + r() * 56, y = 8 + r() * 48; g.fillStyle = '#fff4d6'; g.beginPath(); for (let j = 0; j < 10; j++) { const a = j * 0.628 - 1.57, rr = j % 2 ? 2 : 5; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
    noise(g, 64, 64, r, 80, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.1)']); R(g, 0, 60, 64, 4, 'rgba(0,0,0,.18)');
  },
  s6rj_sambaInner(g) {
    const r = mulberry(608); R(g, 0, 0, 64, 64, '#35104c');
    for (let x = 0; x < 64; x += 16) R(g, x + 6, 6, 3, 52, pick(r, ['#d81e86', '#14b8b0', '#f6c814']));
    for (let x = 0; x < 64; x += 8) { g.fillStyle = pick(r, ['#ff7a1a', '#14b8b0', '#f6c814', '#d81e86']); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, 0); g.lineTo(x + 4, 7); g.fill(); }
    R(g, 0, 48, 64, 16, '#241035'); R(g, 0, 47, 64, 1, '#f6c814');
    noise(g, 64, 64, r, 60, ['rgba(255,255,255,.1)']);
  },
  s6rj_danceFloor(g) {
    const c = ['#d81e86', '#14b8b0', '#f6c814', '#3a4fd8'];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { R(g, i * 16, j * 16, 16, 16, c[(i + j * 2) % 4]); R(g, i * 16 + 2, j * 16 + 2, 12, 12, c[(i + j * 2 + 1) % 4]); R(g, i * 16 + 5, j * 16 + 5, 6, 6, '#fff4d6'); }
    R(g, 0, 0, 64, 1, 'rgba(0,0,0,.4)'); R(g, 0, 0, 1, 64, 'rgba(0,0,0,.4)');
  },
  s6rj_sambaCeil(g) {
    const r = mulberry(609); R(g, 0, 0, 64, 64, '#1c0c2c');
    for (let i = 0; i < 40; i++) R(g, (r() * 64) | 0, (r() * 64) | 0, 2, 2, pick(r, ['#d81e86', '#14b8b0', '#f6c814', '#ffffff']));
  },
  s6rj_stadiumWall(g) {
    const r = mulberry(610); R(g, 0, 0, 64, 64, '#eeeae0');
    R(g, 0, 0, 64, 7, '#2a5fb8'); R(g, 0, 7, 64, 1, '#c8c4b8');
    for (let b = 0; b < 2; b++) { const x = b * 32; R(g, x + 3, 14, 26, 44, '#d2cec2'); g.fillStyle = '#3a4250'; archPath(g, x + 5, 16, 22, 42); g.fill(); R(g, x + 9, 34, 14, 1, '#8a8f98'); R(g, x + 9, 44, 14, 1, '#8a8f98'); }
    R(g, 0, 58, 64, 6, '#cfcbbd'); noise(g, 64, 64, r, 120, ['rgba(0,0,0,.06)', 'rgba(255,255,255,.2)']);
  },
  s6rj_cathConcrete(g) {
    const r = mulberry(611); R(g, 0, 0, 64, 64, '#c2beb2');
    for (let x = 0; x < 64; x += 8) { R(g, x, 0, 1, 64, 'rgba(0,0,0,.2)'); R(g, x + 1, 0, 1, 64, 'rgba(255,255,255,.12)'); }
    for (let y = 0; y < 64; y += 16) R(g, 0, y, 64, 1, 'rgba(0,0,0,.14)');
    noise(g, 64, 64, r, 300, ['rgba(0,0,0,.07)', 'rgba(255,255,255,.12)']);
  },
  s6rj_net(g) {
    g.clearRect(0, 0, 32, 32); g.fillStyle = '#1a1a1a';
    for (let i = 0; i < 32; i += 4) { g.fillRect(i, 0, 1, 32); g.fillRect(0, i, 32, 1); }
  },
  s6rj_sequin(g) {
    const r = mulberry(612); R(g, 0, 0, 64, 64, '#2a1048');
    for (let i = 0; i < 260; i++) R(g, (r() * 64) | 0, (r() * 64) | 0, 2, 2, pick(r, ['#f6c814', '#d81e86', '#14d8d0', '#ffffff', '#ff7a1a', '#7a3af0']));
  },
  s6rj_palmTrunk(g) {
    const r = mulberry(613); R(g, 0, 0, 64, 64, '#8a6a48');
    for (let y = 0; y < 64; y += 6) { R(g, 0, y, 64, 2, '#5e442c'); R(g, 0, y + 2, 64, 1, 'rgba(255,230,190,.2)'); }
    noise(g, 64, 64, r, 140, ['rgba(0,0,0,.14)', 'rgba(255,230,190,.12)']);
  },
  s6rj_theatre(g) {
    const r = mulberry(614); R(g, 0, 0, 64, 64, '#f4e8c8');
    for (let y = 0; y < 64; y += 8) { R(g, 0, y, 64, 1, 'rgba(120,90,50,.28)'); R(g, 0, y + 1, 64, 1, 'rgba(255,255,255,.3)'); }
    noise(g, 64, 64, r, 200, ['rgba(120,90,50,.08)', 'rgba(255,255,255,.3)']);
  },
  s6rj_pavement(g) {
    const r = mulberry(615); R(g, 0, 0, 64, 64, '#d8cfc0');
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) R(g, x * 8 + 1, y * 8 + 1, 7, 7, pick(r, ['#d6ccb8', '#dcd2c0', '#cfc4b0']));
  },
  s6rj_water(g) { const r = mulberry(616); R(g, 0, 0, 64, 64, '#1c8ed8'); for (let i = 0; i < 20; i++) R(g, (r() * 56) | 0, (r() * 64) | 0, 6, 1, 'rgba(255,255,255,.5)'); },
}, {
  s6rj_archwin0: [32, 48], s6rj_archwin1: [32, 48], s6rj_archwin2: [32, 48], s6rj_stripeRed: [32, 32], s6rj_stripeBlue: [32, 32], s6rj_stripeYel: [32, 32], s6rj_stripeGreen: [32, 32], s6rj_stripePink: [32, 32],
  s6rj_net: [32, 32],
});

// =====================================================================
// shared: vertex-coloured polar heightfield hills (Corcovado, Sugarloaf)
// =====================================================================
const hsh = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
function polarHill({ cx = 0, cz = 0, rx, rz, H, segs, rings, prof, colF }) {
  const pos = [cx, H * prof(0, 0), cz], meta = [[0, 0]], idx = [];
  const rho = (k) => Math.sin(k / rings * PI / 2);
  for (let k = 1; k <= rings; k++) for (let j = 0; j < segs; j++) {
    const th = j / segs * PI * 2, r = rho(k);
    pos.push(cx + r * rx * Math.cos(th), k === rings ? 0 : Math.max(0, H * prof(r, th)), cz + r * rz * Math.sin(th)); meta.push([r, th]);
  }
  const at = (k, j) => 1 + (k - 1) * segs + (j % segs);
  for (let j = 0; j < segs; j++) idx.push(0, at(1, j + 1), at(1, j));
  for (let k = 1; k < rings; k++) for (let j = 0; j < segs; j++) { idx.push(at(k, j), at(k, j + 1), at(k + 1, j)); idx.push(at(k, j + 1), at(k + 1, j + 1), at(k + 1, j)); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const n = geo.attributes.normal, col = new Float32Array(pos.length), c = new THREE.Color();
  for (let i = 0; i < meta.length; i++) {
    colF(c, pos[i * 3 + 1] / H, n.getY(i), pos[i * 3], pos[i * 3 + 2], meta[i][0], meta[i][1]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const me = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  me.userData.keep = true; me.receiveShadow = true;
  return me;
}
const FA = rgb(0x2c8a3a), FB = rgb(0x4aa642), FD = rgb(0x1d6a30), RK = rgb(0xa5a29a), RD = rgb(0x6e6c68), RL = rgb(0xc8c4b6), TOPC = rgb(0x6f9a52);
function forestRock(c, hf, ny, x, z, rock0, rock1, tufts) {   // shared colour rule
  const n = hsh(Math.round(x * 0.3), Math.round(z * 0.3)), n2 = hsh(x * 0.11, z * 0.17);
  const rockness = Math.max(smooth(rock0, rock1, hf + (n - 0.5) * 0.16), smooth(0.42, 0.75, 1 - ny));
  c.copy(FD).lerp(FA, n2).lerp(FB, n * 0.5);
  const streak = 0.5 + 0.5 * Math.sin(x * 0.32 + z * 0.21 + n * 4);
  const rk = new THREE.Color().copy(RK).lerp(RD, streak * 0.55).lerp(RL, n * 0.35);
  if (tufts && rockness > 0.5 && n > 0.78) rk.lerp(FA, 0.6);
  c.lerp(rk, rockness);
}
// scatter cone-trees on gentle, low parts of a hill
function forest(hillH, cx, cz, rx, rz, n, seed, maxHf, H, rMin = 0.1) {
  const r = mulberry(seed), pk = new Pack(), mats = [0x1f7a30, 0x2b8f3a, 0x37a043, 0x2a6e2e];
  for (let i = 0, t = 0; i < n && t < n * 6; t++) {
    const rho = rMin + (0.9 - rMin) * Math.sqrt(r()), th = r() * PI * 2, x = cx + rho * rx * Math.cos(th), z = cz + rho * rz * Math.sin(th);
    const h = hillH(x, z); if (h / H > maxHf || h < 1) continue;
    const sl = Math.abs(hillH(x + 2.5, z) - hillH(x - 2.5, z)) / 5 + Math.abs(hillH(x, z + 2.5) - hillH(x, z - 2.5)) / 5; if (sl > 1.4) continue;
    const rr = 2.6 + r() * 2, hh = 7 + r() * 6;
    pk.add(gco(rr, hh, 5, x, h + hh / 2 - 1.2, z, 0, r() * 6), mats[(r() * 4) | 0]); i++;
  }
  return pk;
}

// =====================================================================
// 1. Christ the Redeemer
// =====================================================================
export function christRedeemer() {
  const g = G(), pk = new Pack();
  const stone = 0xb8b4a4, pale = 0xd9dfd3, paleD = 0xc4cbbd;
  pk.add(gb(14, 1.2, 14, 0, 0.6, 0), stone);
  pk.add(gb(11, 4, 11, 0, 3.2, 0), 0xcfcab8);
  pk.add(gb(8.6, 4.4, 8.6, 0, 7.4, 0), 0xd8d4c4);
  pk.add(gb(9.8, 0.5, 9.8, 0, 9.85, 0), stone);
  pk.add(gb(12, 0.35, 12, 0, 1.35, 0), 0xa09c8a);
  // robe: wide skirt rising to a narrow chest
  pk.add(gcy(2.7, 3.3, 14.4, 8, 0, 17.4, 0), pale);
  pk.add(gcy(2.0, 2.7, 10, 8, 0, 29.6, 0), paleD);
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + 0.2; pk.add(gcy(0.22, 0.4, 12, 4, Math.cos(a) * 2.75, 17.2, Math.sin(a) * 2.75), pale); }
  pk.add(gb(4.4, 1.9, 2.4, 0, 34.5, 0), pale);
  pk.add(gcy(0.55, 0.65, 1.0, 8, 0, 35.8, 0), pale);
  pk.add(gsp(1.25, 0, 37.4, 0, 1, 1.3, 1.05, 10), pale);
  pk.add(gsp(1.35, 0, 37.9, -0.15, 1, 1.0, 1.05, 10), paleD);      // hair / hood
  pk.add(gb(0.3, 0.6, 0.4, 0, 37.2, 1.25), paleD);                  // nose
  // arms (sleeves taper outward), hands, cloak drapes under the arms
  for (const s of [-1, 1]) {
    pk.add(gcy(0.95, 1.25, 9.6, 8, s * 6.6, 34.3, 0, 0, 0, PI / 2), pale);
    pk.add(gb(1.1, 1.5, 0.6, s * 11.5, 34.3, 0), paleD);
    for (let f = 0; f < 4; f++) pk.add(gb(0.12, 0.5, 0.5, s * (11.8 + f * 0.1), 33.7 + f * 0.0, 0.1), paleD);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(s * 8.8, 0); sh.lineTo(0, -7.2);
    const dr = new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }); dr.translate(s * 1.6, 33.3, -0.3); pk.add(dr, shiny(0xcad2c2, 20));
  }
  pk.build(g);
  // chapel door + gilded plaque on the pedestal
  { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.4), alphaMat('s6rj_archwin0')); p.position.set(0, 3.1, 5.55); g.add(p); }
  { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.0), alphaMat('s6rj_archwin0')); p.position.set(0, 7.2, 4.35); g.add(p); }
  sgn(g, 'RIO', 3.4, 0.9, 0, 9.0, 4.36, 0, { bg: '#d9dfd3', fg: '#1f6a3a', border: '#d9dfd3' });
  Bx(g, 4.0, 0.12, 0.3, glow(NEO), 0, 5.2, 5.62, 1);
  const cols = [[-7, 7, -7, 7, 1.2], [-5.5, 5.5, -5.5, 5.5, 5.2], [-4.3, 4.3, -4.3, 4.3, 10], [-2.8, 2.8, -2.8, 2.8, 40]];
  return size(g, 24, 14, 40, cols);
}

// =====================================================================
// 2. Corcovado mountain
// =====================================================================
const corcF = (rho, th) => {
  let f = Math.min(1, Math.pow(Math.max(0, (1 - rho) / 0.84), 0.8));
  const w = smooth(0.14, 0.45, rho) * (1 - smooth(0.88, 1, rho));
  f *= 1 + w * (0.11 * Math.sin(5 * th + rho * 7) + 0.07 * Math.sin(9 * th - rho * 11 + 1.3) + 0.05 * Math.sin(3 * th + 2));
  return Math.max(0, Math.min(1, f));
};
export function corcovadoMountain() {
  const g = G(), RX = 110, RZ = 80, H = 110;
  const hill = polarHill({
    rx: RX, rz: RZ, H, segs: 64, rings: 22, prof: corcF,
    colF: (c, hf, ny, x, z) => { forestRock(c, hf, ny, x, z, 0.66, 0.88, false); if (hf > 0.985) c.copy(TOPC).lerp(RK, hsh(x, z) * 0.4); },
  });
  g.add(hill);
  const hAt = (x, z) => { const rho = Math.hypot(x / RX, z / RZ), th = Math.atan2(z / RZ, x / RX); return rho >= 1 ? 0 : H * corcF(rho, th); };
  forest(hAt, 0, 0, RX, RZ, 750, 6101, 0.74, H, 0.16).build(g);
  return size(g, 220, 160, 110, [], { solid: false });
}

// =====================================================================
// 3. Sugarloaf
// =====================================================================
const SLd = { cx: 20, rx: 40, rz: 45, H: 88 }, SLu = { cx: -38, rx: 22, rz: 22, H: 38 };
const sugF = (rho, th) => Math.min(1, Math.sqrt(Math.max(0, 1 - rho * rho)) * (1 + smooth(0.12, 0.5, rho) * (1 - smooth(0.8, 1, rho)) * (0.05 * Math.sin(4 * th + rho * 5) + 0.04 * Math.sin(7 * th + 1))));
const urcaF = (rho, th) => Math.min(1, Math.pow(Math.max(0, 1 - rho * rho), 0.6) * (1 + smooth(0.15, 0.5, rho) * (1 - smooth(0.8, 1, rho)) * (0.08 * Math.sin(3 * th + 1) + 0.05 * Math.sin(8 * th))));
const sugH = (S, f) => (x, z) => { const rho = Math.hypot((x - S.cx) / S.rx, z / S.rz); return rho >= 1 ? 0 : S.H * f(rho, Math.atan2(z / S.rz, (x - S.cx) / S.rx)); };
export function sugarloaf() {
  const g = G();
  const dome = polarHill({
    cx: SLd.cx, rx: SLd.rx, rz: SLd.rz, H: SLd.H, segs: 56, rings: 18, prof: sugF,
    colF: (c, hf, ny, x, z) => {
      const n = hsh(Math.round(x * 0.4), Math.round(z * 0.4)), st = 0.5 + 0.5 * Math.sin(Math.atan2(z, x - SLd.cx) * 14 + n * 3);
      c.copy(RK).lerp(RD, st * 0.5).lerp(RL, n * 0.4);
      const gr = smooth(0.34, 0.14, hf) * 0.95 + (ny > 0.8 && n > 0.7 ? 0.5 : 0); c.lerp(new THREE.Color().copy(FA).lerp(FB, n), Math.min(1, gr));
      if (hf > 0.97) c.lerp(TOPC, 0.5);
    },
  });
  const urca = polarHill({
    cx: SLu.cx, rx: SLu.rx, rz: SLu.rz, H: SLu.H, segs: 40, rings: 12, prof: urcaF,
    colF: (c, hf, ny, x, z) => { forestRock(c, hf, ny, x, z, 0.62, 0.85, true); if (hf > 0.97) c.copy(TOPC); },
  });
  g.add(dome, urca);
  forest(sugH(SLu, urcaF), SLu.cx, 0, SLu.rx, SLu.rz, 90, 6201, 0.7, SLu.H, 0.1).build(g);
  forest(sugH(SLd, sugF), SLd.cx, 0, SLd.rx, SLd.rz, 90, 6202, 0.26, SLd.H, 0.35).build(g);
  // stations + taut cables + gondolas
  const hu = SLu.H, ux = SLu.cx, dxS = -2, dyS = sugH(SLd, sugF)(dxS, 0);
  const pk = new Pack();
  pk.add(gb(6, 3.6, 5, ux, hu + 0.6, 0), 0xe8e4d8); pk.add(gb(6.6, 0.5, 5.6, ux, hu + 2.6, 0), 0xd8302a);
  pk.add(gb(6.5, 9, 5.5, dxS + 0.5, dyS - 1.2, 0), 0xe8e4d8); pk.add(gb(7.1, 0.5, 6.1, dxS + 0.5, dyS + 3.5, 0), 0xd8302a);
  const A = [ux + 2.4, hu + 3.2, 0], B = [dxS - 2.4, dyS + 3.6, 0];
  const lerp = (t, dz) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, dz];
  for (const dz of [-0.9, 0.9]) pk.add(rodG([A[0], A[1], dz], [B[0], B[1], dz], 0.13, 4), 0x2a2a2e);
  const gondola = (t, dz, hex) => { const p = lerp(t, dz); pk.add(rodG(p, [p[0], p[1] - 1.1, dz], 0.1, 4), 0x2a2a2e); pk.add(gb(3.2, 1.9, 1.7, p[0], p[1] - 2.1, dz), hex); pk.add(gb(3.3, 0.25, 1.8, p[0], p[1] - 1.1, dz), 0xf4f0e4); pk.add(gb(2.5, 0.8, 1.76, p[0], p[1] - 1.9, dz), 0x9fd8f4); };
  gondola(0.4, 0.9, 0xd8302a); gondola(0.78, -0.9, 0xf2c71a);
  pk.build(g);
  // top flag and the green 'Neo' accent on the summit station
  Bx(g, 0.25, 0.25, 5.8, glow(NEO), dxS + 0.5, dyS + 3.85, 0, 1);
  return size(g, 120, 100, 90, [], { solid: false });
}

// =====================================================================
// 4. Escadaria Selaron
// =====================================================================
function bxG(w, h, d, x, y, z, tile) { const m = boxT(w, h, d, mat('concrete'), tile); const geo = m.geometry; geo.translate(x, y, z); return geo; }
export function escadariaSelaron() {
  const g = G(), pk = new Pack(), mos = mat('s6rj_mosaic'), paint = mat('s6rj_paintwall');
  // 20 mosaic steps rising towards -z
  for (let i = 0; i < 20; i++) { const h = (i + 1) * 0.2; pk.add(bxG(13.9, h, 1.5, 0, h / 2, 15 - 1.5 * (i + 0.5), 1.5), mos); }
  pk.build(g);
  // painted house-walls on both sides, stepping up the hill
  const secs = [[8, 5, 15], [11, -5, 5], [14, -15, -5]], tops = C(0xf2ead6);
  for (const s of [-1, 1]) secs.forEach(([h, z0, z1], k) => {
    const d = z1 - z0, m = boxT(8, h, d, paint, 3), x = s * 11;
    const inner = s > 0 ? 1 : 0, mats = [paint, paint, tops, tops, paint, paint];
    mats[inner] = k === 1 ? paint : mos;                       // inner face: mosaic (middle section painted bands)
    m.material = mats; m.position.set(x, h / 2, (z0 + z1) / 2); g.add(m);
    // window frames and mosaic panels on the inner faces
    const pk2 = new Pack();
    for (let zz = z0 + 2.5; zz < z1 - 1; zz += 5) {
      const px = s * 6.93;
      pk2.add(gpl(3.2, 2.4, px, h - 3.4, zz - 0.9, 0, -s * PI / 2), flatMap(k === 1 ? 's6rj_mosaic' : 's6rj_paintwall'));
      pk2.add(gpl(1.4, 2.2, px, h - 3.4, zz + 1.3, 0, -s * PI / 2), alphaMat(`s6rj_archwin${(((k + (zz | 0)) % 3) + 3) % 3}`));
    }
    pk2.build(g);
  });
  // front gate posts, arch windows on the front faces, sign
  { const pk3 = new Pack();
    for (const s of [-1, 1]) {
      pk3.add(gpl(1.6, 2.6, s * 11 - 1.5, 5.2, 15.06), alphaMat('s6rj_archwin0')); pk3.add(gpl(1.6, 2.6, s * 11 + 1.5, 5.2, 15.06), alphaMat('s6rj_archwin2'));
      pk3.add(gcy(0.45, 0.55, 2.2, 8, s * 7.5, 1.1, 14.4), C(0xd8302a)); pk3.add(gsp(0.6, s * 7.5, 2.5, 14.4, 1, 1, 1, 8), C(0xf2c71a));
    }
    pk3.build(g); }
  sgn(g, 'ESCADARIA', 8.5, 1.3, -11, 6.6, 15.07, 0, { bg: '#1f5fc0', fg: '#f6e24a', border: '#f6e24a' });
  sgn(g, 'SELARON', 8.5, 1.3, 11, 6.6, 15.07, 0, { bg: '#d8302a', fg: '#f6e24a', border: '#f6e24a' });
  Bx(g, 8.2, 0.12, 0.2, glow(NEO), 11, 5.85, 15.12, 1);
  // flower pots + top rail
  { const pk4 = new Pack(), fl = [0xe8348c, 0xf6c814, 0xff7a1a, 0xd8302a];
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const i = 2 + k * 4, z = 15 - 1.5 * (i + 0.5), y = (i + 1) * 0.2; pk4.add(gcy(0.36, 0.28, 0.5, 7, s * 6.3, y + 0.25, z), C(0xb8562c)); pk4.add(gsp(0.42, s * 6.3, y + 0.7, z, 1, 0.85, 1, 7), fl[(k + (s > 0 ? 1 : 0)) % 4]); }
    pk4.add(gb(14, 0.9, 0.3, 0, 4.45, -14.7), C(0xf4f0e4));
    for (let x = -6.5; x <= 6.5; x += 1.3) pk4.add(gb(0.25, 0.9, 0.25, x, 4.45, -14.2), C(0xf4f0e4));
    pk4.build(g); }
  const cols = [[-15, -7, 5, 15, 8], [-15, -7, -5, 5, 11], [-15, -7, -15, -5, 14], [7, 15, 5, 15, 8], [7, 15, -5, 5, 11], [7, 15, -15, -5, 14]];
  for (let s = 0; s < 5; s++) cols.push([-7, 7, 15 - 6 * (s + 1), 15 - 6 * s, 0.8 * (s + 1)]);
  return size(g, 30, 30, 14, cols);
}

// =====================================================================
// 5. Arcos da Lapa
// =====================================================================
export function arcosDaLapa() {
  const g = G(), W = 60, T = 7, HW = 14.5, PW = 2.4, span = 9.6, r1 = 3.6;
  const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0);
  const pierC = []; for (let i = 0; i < 7; i++) pierC.push(-28.8 + i * span);
  for (let j = 0; j < 6; j++) {
    const x0 = pierC[j] + PW / 2, x1 = pierC[j + 1] - PW / 2, yc = 9 - r1, c = (x0 + x1) / 2;
    sh.lineTo(x0, 0); sh.lineTo(x0, yc); sh.absarc(c, yc, r1, PI, 0, true); sh.lineTo(x1, 0);
  }
  sh.lineTo(W / 2, 0); sh.lineTo(W / 2, HW); sh.lineTo(-W / 2, HW); sh.lineTo(-W / 2, 0);
  for (let k = 0; k < 12; k++) {   // upper tier arches
    const c = -26.4 + k * 4.8, x0 = c - 1.4, x1 = c + 1.4, y0 = 10.0, yc = y0 + 1.7, h = new THREE.Path();
    h.moveTo(x0, y0); h.lineTo(x1, y0); h.lineTo(x1, yc); h.absarc(c, yc, 1.4, 0, PI, false); h.lineTo(x0, y0); sh.holes.push(h);
  }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 8 }); geo.translate(0, 0, -T / 2); uvScale(geo, 0.25);
  const white = tint('s6rj_stucco', 0xfbf8ee);
  g.add(new THREE.Mesh(geo, white));
  const pk = new Pack(), cream = C(0xf4efe2);
  pk.add(gb(W + 0.4, 0.4, T + 0.4, 0, 9.4, 0), cream);                                   // string course between the tiers
  pk.add(gb(W + 0.8, 1.0, 9.6, 0, HW + 0.5, 0), cream);                                  // channel deck (overhangs)
  pk.add(gb(W + 0.8, 1.1, 0.4, 0, HW + 1.55, 4.6), cream); pk.add(gb(W + 0.8, 1.1, 0.4, 0, HW + 1.55, -4.6), cream);
  for (const s of [-1, 1]) pk.add(gb(0.4, 1.1, 9.6, s * (W / 2 + 0.2), HW + 1.55, 0), cream);
  for (const x of pierC) { pk.add(gb(PW + 0.2, 0.3, T + 0.2, x, 0.15 + 3.0, 0), cream); }  // impost blocks
  // yellow Santa Teresa tram on the deck
  const tx = -9, ty = HW + 1.0;
  pk.add(gb(1.0, 0.5, 9, tx - 3, ty + 0.9, 0), C(0x333338)); pk.add(gb(1.0, 0.5, 9, tx + 3, ty + 0.9, 0), C(0x333338));
  pk.add(gb(6.4, 2.0, 2.6, tx, ty + 2.2, 0), C(0xf6c814)); pk.add(gb(6.6, 0.3, 2.8, tx, ty + 3.35, 0), C(0xf4f0e4)); pk.add(gb(6.5, 0.3, 2.7, tx, ty + 1.2, 0), C(0xd8302a));
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) pk.add(gb(1.1, 0.9, 0.06, tx - 2.3 + i * 1.5, ty + 2.5, s * 1.33), C(0x2a4a68));
  pk.add(rodG([tx, ty + 3.5, 0], [tx + 1.5, ty + 4.4, 0], 0.07, 4), C(0x222222));
  pk.add(gb(0.5, 0.15, 0.5, tx + 1.5, ty + 4.45, 0), C(0x222222));
  pk.build(g);
  Bx(g, 0.18, 0.18, 9.4, glow(NEO), 24, HW + 1.15, 0, 1);
  sgn(g, 'LAPA', 5, 1.2, 0, 12.2, 3.55, 0, { bg: '#d81e86', fg: '#fff4d6', border: '#fff4d6' });
  const cols = pierC.map((x) => [x - PW / 2, x + PW / 2, -T / 2, T / 2, 18]);
  return size(g, 60, 10, 18, cols);
}

// =====================================================================
// 6. Maracana
// =====================================================================
addPainters({
  s6rj_seats(g) {
    const r = mulberry(617); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) R(g, x * 4, y * 4, 4, 4, pick(r, y < 6 ? ['#1f5fc0', '#2a6ad0', '#f4f4ee'] : y < 11 ? ['#f4f4ee', '#1f9a4a', '#f2c71a'] : ['#f2c71a', '#1f5fc0', '#1f9a4a']));
    for (let y = 0; y < 64; y += 4) R(g, 0, y + 3, 64, 1, 'rgba(0,0,0,.25)');
  },
  s6rj_pitch(g) {
    for (let i = 0; i < 8; i++) R(g, 0, i * 8, 64, 8, i % 2 ? '#2f9a3a' : '#38a843');
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.strokeRect(3, 3, 58, 58); g.beginPath(); g.moveTo(3, 32); g.lineTo(61, 32); g.stroke(); g.beginPath(); g.arc(32, 32, 9, 0, 6.3); g.stroke();
  },
});
export function maracana() {
  const g = G(), RX = 33.5, RZ = 28, N = 32, WH = 17;
  // outer arcaded wall (two storeys of arches)
  const wall = Ms(g, new THREE.CylinderGeometry(1, 1, WH, N, 1, true), mat('s6rj_stadiumWall'), 0, WH / 2, 0, RX, 1, RZ);
  { const uv = wall.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 25, uv.getY(i) * 2); }
  // stands bowl (visible from above) and pitch
  const bowl = Ms(g, new THREE.CylinderGeometry(0.88, 0.5, 15.5, N, 1, true), keyed('seatsD', () => new THREE.MeshLambertMaterial({ map: tex('s6rj_seats'), side: THREE.DoubleSide })), 0, 1.5 + 7.75, 0, RX, 1, RZ);
  { const uv = bowl.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 40, uv.getY(i) * 3); }
  Ms(g, new THREE.CylinderGeometry(0.5, 0.5, 1.5, N, 1, true), C(0x2a4ab0), 0, 0.75, 0, RX, 1, RZ);
  { const p = Ms(g, new THREE.CircleGeometry(0.5, N), mat('s6rj_pitch'), 0, 0.08, 0, RX, RZ, 1, -PI / 2); p.rotation.x = -PI / 2; p.scale.set(RX, RZ, 1); }
  { const rim = Ms(g, new THREE.RingGeometry(0.86, 1.0, N), C(0xe8e4d8), 0, WH + 0.02, 0, RX, RZ, 1); rim.rotation.x = -PI / 2; rim.material = dbl(0xe8e4d8); }
  // cantilever roof ring + blue edge band
  Ms(g, new THREE.CylinderGeometry(1, 0.68, 3, N, 1, true), dbl(0xf4f2ea), 0, 23.5, 0, 35, 1, 30);
  Ms(g, new THREE.CylinderGeometry(1, 1, 1.0, N, 1, true), C(0x1f4fb0), 0, 25.0, 0, 35.02, 1, 30.02);
  const pk = new Pack();
  for (let i = 0; i < N; i++) {                      // pillars + roof ribs + pennants
    const a = i / N * PI * 2, c = Math.cos(a), s = Math.sin(a);
    pk.add(gcy(0.4, 0.5, 24, 6, c * 34.3, 12, s * 28.9), C(0xeceae0));
    if (i % 2 === 0) pk.add(rodG([c * 24, 22.2, s * 20.3], [c * 34.6, 25, s * 29.2], 0.12, 4), C(0xcfcbbf));
  }
  const flagC = [0x1fa04a, 0xf6c814, 0x1f5fd0, 0xf4f4ee];
  for (let i = 0; i < 24; i++) { const a = (i + 0.5) / 24 * PI * 2, c = Math.cos(a) * 34.3, s = Math.sin(a) * 28.8; pk.add(gcy(0.07, 0.07, 3, 4, c, 26.9, s), C(0xdddddd)); const nx = -Math.sin(a) * 0.9, nz = Math.cos(a) * 0.9; pk.add(triG([c, 28.2, s], [c, 26.8, s], [c + nx * 1.6, 27.5, s + nz * 1.6 * 0.82]), dbl(flagC[i % 4])); }
  // floodlight masts on the roof (4)
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = sx * 24, z = sz * 19;
    for (const [dx, dz] of [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]]) pk.add(gcy(0.12, 0.16, 5.4, 4, x + dx, 25.3, z + dz), C(0x666a72));
    pk.add(gb(4.4, 2.4, 0.5, x, 27.0, z - sz * 0.9, 0, sz * 0.15), glow(0xfff6d0)); pk.add(gb(4.8, 0.2, 0.7, x, 28.25, z - sz * 0.9), C(0x444850));
    for (const gx of [-1.3, 0, 1.3]) pk.add(gb(0.3, 2.0, 0.2, x + gx, 27.0, z - sz * 0.9 + sz * 0.34, 0, sz * 0.15), C(0x333840));
  }
  pk.build(g);
  // main entrance block on the +z side
  Bx(g, 16, 12, 4, tint('s6rj_stucco', 0xf4f1e6), 0, 6, 28, 4);
  Bx(g, 16.6, 1.4, 4.6, C(0x1f4fb0), 0, 12.3, 28, 3);
  Bx(g, 6.2, 0.4, 1.0, C(0xe8e4d8), 0, 5.3, 30.2, 2);
  g.add(Object.assign(decal('door', 5.5, 4.4, 0, 2.25, 30.07, { c: '#1f5fc0' }), {}));
  sgn(g, 'MARACANA', 12, 1.8, 0, 9.0, 30.06, 0, { bg: '#1f4fb0', fg: '#f6e24a', border: '#f6e24a' });
  Bx(g, 12.4, 0.12, 0.2, glow(NEO), 0, 7.9, 30.12, 1);
  for (const s of [-1, 1]) { Cy(g, 0.12, 0.12, 6, 5, C(0xdddddd), s * 6.8, 15.2, 29.4, 1); const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), dbl(s < 0 ? 0x1fa04a : 0xf6c814)); fl.position.set(s * 7.9, 17.4, 29.4); g.add(fl); }
  // simplified solid footprint: an octagon-ish union of three rectangles (+ entrance block)
  const o = (a) => a;
  const cols = [[-RX * .924, RX * .924, -RZ * .383, RZ * .383, 24], [-RX * .383, RX * .383, -RZ * .924, RZ * .924, 24], [-RX * .653, RX * .653, -RZ * .653, RZ * .653, 24], [-8, 8, 26, 30, 12]];
  return size(g, 70, 60, 28, cols);
}

// =====================================================================
// 7. Metropolitan Cathedral (cone, stained-glass slits, separate bell tower)
// =====================================================================
function quadG(a, b, c, d) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c, ...a, ...c, ...d]), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(12), 2)); geo.computeVertexNormals(); return geo;
}
const octCols = (cx, cz, r, h) => [[cx - r * .924, cx + r * .924, cz - r * .383, cz + r * .383, h], [cx - r * .383, cx + r * .383, cz - r * .924, cz + r * .924, h], [cx - r * .653, cx + r * .653, cz - r * .653, cz + r * .653, h]];
export function metropolitanCathedral() {
  const g = G(), CX = -2, RB = 16.5, RT = 7.5, CH = 42, rAt = (y) => RB - (RB - RT) * y / CH;
  Cy(g, 18, 18.2, 0.8, 16, mat('pavingDark'), CX, 0.4, 0, 4);                       // plaza disc
  const cone = Cy(g, RT, RB, CH, 16, mat('s6rj_cathConcrete'), CX, 0.8 + CH / 2, 0, 6);
  cone.position.y = 0.8 + CH / 2;
  const sc = (y) => rAt(y); // radius on the cone relative to its base at y=0.8 (cone base at y=0.8)
  const pk = new Pack(), cl = [0x1f5fe0, 0xe03030, 0xf6c814, 0x20a050, 0xd81e86];
  const base = 0.8;
  for (let i = 0; i < 16; i++) {
    const a = (i + 0.5) / 16 * PI * 2, da = 0.115;
    [[2.5, 14], [14.2, 27], [27.2, 40.2]].forEach(([y0, y1], k) => {
      const r0 = rAt(y0) + 0.28, r1 = rAt(y1) + 0.28, P = (r, ang, y) => [CX + Math.cos(ang) * r, base + y, Math.sin(ang) * r];
      pk.add(quadG(P(r0, a - da, y0), P(r0, a + da, y0), P(r1, a + da, y1), P(r1, a - da, y1)), dbl(cl[(i + k * 2) % 5], cl[(i + k * 2) % 5]));
    });
  }
  for (const y of [13.5, 27, 40.6]) pk.add(new THREE.CylinderGeometry(rAt(y) + 0.38, rAt(y) + 0.38, 0.7, 16).translate(CX, base + y, 0), C(0xaaa69a));
  pk.add(new THREE.CylinderGeometry(8.6, 8.0, 1.6, 16).translate(CX, base + CH + 0.4, 0), C(0xaaa69a));
  // skylight cross + gilded cross
  pk.add(gb(12, 0.8, 2.4, CX, base + CH + 1.4, 0), dbl(0x4aa8ff, 0x2a78d0)); pk.add(gb(2.4, 0.8, 12, CX, base + CH + 1.4, 0), dbl(0xf6c814, 0xb89010));
  pk.add(gb(0.6, 6, 0.6, CX, base + CH + 4.4, 0), C(0xe4b030, 0x403008)); pk.add(gb(3.4, 0.6, 0.6, CX, base + CH + 6.0, 0), C(0xe4b030, 0x403008));
  // entrance porch
  pk.add(gb(10, 5.6, 3.4, CX, 0.8 + 2.8, 15.6), C(0xb4b0a4)); pk.add(gb(10.6, 0.5, 4.0, CX, 6.7, 15.6), C(0x8a8678));
  // bell tower
  const tx = 16.5, tz = -8;
  pk.add(gb(4.4, 29, 4.4, tx, 14.5, tz), C(0xbebaae)); pk.add(gb(5.6, 5.4, 5.6, tx, 31.7, tz), C(0xaaa69a)); pk.add(gb(6.0, 0.6, 6.0, tx, 34.7, tz), C(0x8a8678));
  for (const [dx, dz, ry] of [[0, 2.83, 0], [0, -2.83, PI], [2.83, 0, PI / 2], [-2.83, 0, -PI / 2]]) {
    pk.add(gpl(2.0, 3.6, tx + dx, 31.8, tz + dz, 0, ry), basic(0x16161c));
    for (let k = 0; k < 3; k++) pk.add(gpl(0.55, 20, tx + (dx ? dx * 0.78 : (k - 1) * 1.0), 14 + (k % 2) * 0.01, tz + (dz ? dz * 0.78 + Math.sign(dz) * 0.01 : (k - 1) * 1.0), 0, ry), dbl(cl[(k + 1) % 5], cl[(k + 1) % 5]));
  }
  pk.add(gco(0.85, 1.6, 6, tx, 31.4, tz), C(0xe4b030)); pk.add(gb(0.5, 4.5, 0.5, tx, 37.4, tz), C(0xe4b030, 0x403008)); pk.add(gb(2.4, 0.5, 0.5, tx, 38.4, tz), C(0xe4b030, 0x403008));
  pk.build(g);
  g.add(Object.assign(decal('door', 4.2, 3.9, CX, 2.8, 17.36, { c: '#7a2a1a' }), {}));
  sgn(g, 'CATEDRAL', 7, 1.0, CX, 5.4, 17.34, 0, { bg: '#2a2a30', fg: '#f6e24a', border: '#f6e24a' });
  Bx(g, 7, 0.1, 0.2, glow(NEO), CX, 4.6, 17.4, 1);
  const cols = [...octCols(CX, 0, 18, 0.8), ...octCols(CX, 0, 14.4, 14), ...octCols(CX, 0, 11.4, 28), ...octCols(CX, 0, 8.4, 43), [CX - 5, CX + 5, 14, 17.4, 6.4], [tx - 2.8, tx + 2.8, tz - 2.8, tz + 2.8, 35]];
  return size(g, 40, 40, 50, cols);
}

// =====================================================================
// 8. Theatro Municipal
// =====================================================================
export function theatroMunicipal() {
  const g = G(), pk = new Pack(), cream = tint('s6rj_theatre', 0xfaf0d0), white = C(0xf8f4ea), gold = shiny(0xe4b030, 80, 0x2a1c00), green = shiny(0x2f9a6a, 40);
  // plinth + body
  pk.add(gb(40.2, 1.5, 24.4, 0, 0.75, -2.9), C(0xb8b2a0));
  Bx(g, 40, 15, 24, cream, 0, 1.5 + 7.5, -3, 5);
  Bx(g, 40.8, 0.9, 24.8, white, 0, 16.9, -3, 3);
  for (let x = -19.5; x <= 19.5; x += 1.5) { pk.add(gb(0.5, 1.1, 0.5, x, 17.9, 9.2), white); pk.add(gb(0.5, 1.1, 0.5, x, 17.9, -15.2), white); }
  for (let z = -14; z <= 8.5; z += 1.5) for (const s of [-1, 1]) pk.add(gb(0.5, 1.1, 0.5, s * 20.2, 17.9, z), white);
  pk.add(gb(41, 0.25, 0.5, 0, 18.55, 9.2), white); pk.add(gb(41, 0.25, 0.5, 0, 18.55, -15.2), white); for (const s of [-1, 1]) pk.add(gb(0.5, 0.25, 24.6, s * 20.2, 18.55, -3), white);
  // front colonnade pavilion
  pk.add(gb(22, 1.5, 3.6, 0, 0.75, 11), C(0xb8b2a0));
  for (const [hw, z0, z1, h] of [[12.5, 13.1, 14.0, 0.5], [11.8, 14.0, 15.0, 0.25]]) pk.add(gb(hw * 2, h, z1 - z0, 0, h / 2, (z0 + z1) / 2), C(0xc8c2b0));
  pk.add(gb(21, 1.0, 4.6, 0, 1.0, 11.2), C(0xc8c2b0));
  const colX = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5];
  for (const x of colX) { pk.add(gcy(0.62, 0.7, 10.2, 10, x, 6.6, 11.6), white); pk.add(gb(1.7, 0.5, 1.7, x, 11.95, 11.6), gold); pk.add(gb(1.5, 0.4, 1.5, x, 1.7, 11.6), white); }
  pk.add(gb(21, 1.6, 3.8, 0, 12.9, 11.4), white);
  pk.add(gb(15, 0.4, 4.0, 0, 13.9, 11.4), gold);
  const pedS = new THREE.Shape(); pedS.moveTo(-10.5, 0); pedS.lineTo(10.5, 0); pedS.lineTo(0, 3.6);
  pk.add(new THREE.ExtrudeGeometry(pedS, { depth: 3.6, bevelEnabled: false }).translate(0, 13.7, 9.6), white);
  pk.add(gcy(1.5, 1.5, 0.2, 14, 0, 14.9, 13.25, PI / 2), gold);                       // gold medallion
  for (const x of [-10.2, 10.2]) pk.add(gsp(0.55, x, 14.2, 12.8, 1, 1.5, 1, 6), gold);  // acroteria
  // corner towers with little green domes
  for (const s of [-1, 1]) {
    const x = s * 16.8;
    pk.add(gb(5.4, 19.5, 5.4, x, 9.75, 8.6), white);
    pk.add(gb(6.0, 0.7, 6.0, x, 19.8, 8.6), gold);
    pk.add(new THREE.SphereGeometry(2.6, 10, 5, 0, PI * 2, 0, PI / 2).translate(x, 20.15, 8.6), green); pk.add(gsp(0.4, x, 23.1, 8.6, 1, 1, 1, 6), gold);
  }
  // main dome on a drum
  pk.add(gcy(5.5, 5.7, 3.5, 12, 0, 18.25, -3), white);
  pk.add(gcy(6.0, 6.0, 0.4, 12, 0, 20.2, -3), gold);
  pk.add(new THREE.SphereGeometry(5.6, 12, 6, 0, PI * 2, 0, PI / 2).translate(0, 20.4, -3), green);
  for (let i = 0; i < 8; i++) pk.add(new THREE.TorusGeometry(5.65, 0.13, 4, 12, PI).rotateY(i / 8 * PI).translate(0, 20.4, -3), gold);
  pk.add(gcy(1.0, 1.25, 1.8, 10, 0, 26.7, -3), white);
  pk.add(new THREE.SphereGeometry(1.15, 8, 4, 0, PI * 2, 0, PI / 2).translate(0, 27.6, -3), gold);
  pk.add(gcy(0.1, 0.1, 2.0, 4, 0, 29.6, -3), gold);
  pk.add(new THREE.CapsuleGeometry(0.26, 0.9, 3, 6).translate(0, 30.6, -3), gold); pk.add(gb(1.8, 0.8, 0.08, 0, 30.9, -3, 0, 0, 0.2), gold);
  pk.build(g);
  // windows (arched) & doors
  { const wp = new Pack(), a0 = alphaMat('s6rj_archwin0'), a1 = alphaMat('s6rj_archwin1'), a2 = alphaMat('s6rj_archwin2');
    const row = (y, hh, mt, xs) => xs.forEach((x) => wp.add(gpl(1.8, hh, x, y, 9.06), mt));
    row(4.0, 3.4, a0, [-18, -14.5, -11.5, 11.5, 14.5, 18]); row(10.5, 3.4, a1, [-18, -14.5, -11.5, 11.5, 14.5, 18]);
    for (let k = 0; k < 6; k++) { const z = 5 - k * 3.6; for (const s of [-1, 1]) { wp.add(gpl(1.8, 3.4, s * 20.06, 4.0, z, 0, s * PI / 2), a2); wp.add(gpl(1.8, 3.4, s * 20.06, 10.5, z, 0, s * PI / 2), a0); } }
    for (let k = 0; k < 11; k++) { const x = -18 + k * 3.6; wp.add(gpl(1.8, 3.4, x, 4.0, -15.06, 0, PI), a2); wp.add(gpl(1.8, 3.4, x, 10.5, -15.06, 0, PI), a1); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + 0.2; wp.add(gpl(1.4, 2.0, Math.sin(a) * 5.75, 18.3, -3 + Math.cos(a) * 5.75, 0, a), a1); }
    wp.build(g); }
  for (const x of [-4.5, 0, 4.5]) g.add(decal('door', 3.0, 4.6, x, 1.5 + 2.3, 9.07, { c: '#d9a62a' }));
  for (const x of [-6, 6]) win(g, 1.8, 3.2, x, 8.2, 9.07, 0, { fixed: true, c: '#d9a62a' });
  sgn(g, 'THEATRO MUNICIPAL', 15, 1.2, 0, 12.9, 13.35, 0, { bg: '#f8f4ea', fg: '#a07410', border: '#e4b030' });
  Bx(g, 14.4, 0.12, 0.2, glow(NEO), 0, 12.15, 13.4, 1);
  const cols = [[-20, 20, -15, 9, 18.6], [-11, 11, 9, 12.8, 1.5], [-11.8, 11.8, 12.8, 14.0, 0.5], [-11.8, 11.8, 14.0, 15.0, 0.3], [-19.6, -14.0, 5.9, 11.3, 20], [14.0, 19.6, 5.9, 11.3, 20]];
  for (const x of colX) cols.push([x - 0.7, x + 0.7, 10.9, 12.3, 13]);
  return size(g, 40, 30, 32, cols);
}

// =====================================================================
// 9. Favela hill (cheap but dense)
// =====================================================================
export function favelaHill() {
  const g = G(), r = mulberry(6301), body = new Pack(), fx = new Pack();
  const pal = [0xf06aa0, 0x18b8c8, 0xf6d23a, 0xff8a2a, 0x7cd24a, 0xe8e4d8, 0xd8302a, 0x9a6ae0, 0x2f8fe0];
  const roofC = [0xd0602a, 0x8a8e96, 0xb85a2a, 0x6a7078], tank = 0x2f8fe0;
  const ROWS = 9, rowTop = [], cols = [];
  for (let k = 0; k < ROWS; k++) {
    const z = 13.2 - 3.3 * k; let x = -30, maxT = 0;
    while (x < 29.5) {
      let w = 3 + r() * 1.7; if (x + w > 29.2) w = 30 - x;
      if (x + w / 2 > 7.4 && x < 9.6) { x = 9.6; continue; }      // corridor for the staircase
      if (x < 7.4 && x + w > 7.4) w = 7.4 - x;
      const T = 3.2 + k * 2.9 + r() * 1.5, cx = x + w / 2, c = pal[(r() * pal.length) | 0];
      body.add(gb(w - 0.04, T, 3.4, cx, T / 2, z), c);
      // storey line / trim
      if (T > 5) body.add(gb(w - 0.04 + 0.1, 0.18, 3.5, cx, T - 0.1, z), 0xfff4dc);
      // window (frame + glass) on the exposed upper part of the front face, lit sometimes
      const wy = T - 1.5; body.add(gb(1.15, 1.15, 0.07, cx - w * 0.18, wy, z + 1.72), 0xfff4dc); body.add(gb(0.85, 0.85, 0.09, cx - w * 0.18, wy, z + 1.72), r() < 0.2 ? 0xf6d27a : 0x24344c);
      if (w > 3.7) { body.add(gb(0.8, 1.1, 0.07, cx + w * 0.22, wy - 0.1, z + 1.72), 0x3a2a22); }
      // roof
      const rc = roofC[(r() * 4) | 0];
      if (r() < 0.5) body.add(gb(w + 0.15, 0.22, 3.7, cx, T + 0.11, z + (r() < 0.5 ? 0 : 0.1), 0, (r() - 0.5) * 0.12), rc);
      if (r() < 0.28) { body.add(gcy(0.6, 0.6, 1.1, 8, cx + (r() - 0.5), T + 0.9, z - 0.3), tank); body.add(gb(0.15, 0.4, 0.15, cx, T + 0.2, z - 0.3), 0x444444); }
      else if (r() < 0.12) { fx.add(gcy(0.03, 0.03, 1.8, 4, cx, T + 1.0, z), 0x666666); fx.add(gsp(0.5, cx, T + 1.9, z + 0.2, 1, 0.3, 1, 6), 0xdddddd); }
      if (r() < 0.12 && k < 6) { body.add(gb(w * 0.6, 0.1, 0.9, cx, T - 2.6, z + 2.15), 0xfff4dc); fx.add(gb(w * 0.6, 0.55, 0.04, cx, T - 2.2, z + 2.58), 0xd8302a); }
      maxT = Math.max(maxT, T); x += w;
    }
    rowTop.push(maxT); cols.push([-30, 30, z - 1.7, z + 1.7, maxT]);
  }
  // concrete staircase climbing through the corridor (x = 7.4..9.6)
  for (let i = 0; i < 31; i++) { const hh = 0.9 + i * 0.86, z = 14.6 - i * 0.95; body.add(gb(2.2, hh, 1.0, 8.5, hh / 2, z), i % 2 ? 0xb8b4a8 : 0xaaa69a); if (i % 6 === 0) body.add(gb(0.1, 1.6, 0.1, 7.5, hh + 0.8, z), 0x888888); }
  // laundry, bushes, flags
  for (let i = 0; i < 10; i++) { const k = (r() * 8) | 0, z = 13.2 - 3.3 * k + 1.75; fx.add(gsp(0.9 + r() * 0.5, -28 + r() * 36, 0.5 + (k * 2.9) * 0.2, z + 0.5, 1, 0.8, 1, 6), pick(r, [0x2f8a3a, 0x4aa642])); }
  body.build(g); fx.build(g);
  sgn(g, 'FESTA', 5, 1.1, -14, 5.2, 15.1, 0, { bg: '#d81e86', fg: '#fff4d6', border: '#fff4d6' });
  Bx(g, 4.6, 0.1, 0.12, glow(NEO), -14, 4.55, 15.16, 1);
  return size(g, 60, 30, 30, cols);
}

// =====================================================================
// 10. Colonial row
// =====================================================================
const ROWS_DEF = [
  [{ w: 10, f: 3, c: 0xf4a6bc, sh: 0, t: 'BAR' }, { w: 9, f: 3, c: 0x8fd8d0, sh: 1, t: 'CAFE' }, { w: 10, f: 3, c: 0xfbe38a, sh: 2, t: 'HOTEL' }, { w: 11, f: 3, c: 0xf6b478, sh: 0, t: 'SAMBA' }],
  [{ w: 12, f: 3, c: 0xcfe8a8, sh: 2, t: 'PRAIA' }, { w: 8, f: 2, c: 0xf4a6bc, sh: 1, t: 'CAFE' }, { w: 10, f: 3, c: 0x9ac4f0, sh: 0, t: 'BAR' }, { w: 10, f: 2, c: 0xfbe38a, sh: 1, t: 'FESTA' }],
  [{ w: 8, f: 3, c: 0xf6b478, sh: 1, t: 'HOTEL' }, { w: 12, f: 2, c: 0x8fd8d0, sh: 2, t: 'SAMBA' }, { w: 9, f: 3, c: 0xe8a0d8, sh: 0, t: 'BAR' }, { w: 11, f: 3, c: 0xfbe38a, sh: 1, t: 'CAFE' }],
];
const SIGNBG = ['#d81e86', '#1f5fc0', '#1fa04a', '#e8501a', '#7a3af0'];
export function colonialRow(opts = {}) {
  const v = ((opts.variant | 0) % 3 + 3) % 3, def = ROWS_DEF[v], g = G();
  const pk = new Pack(), wp = new Pack(), white = C(0xfffaf0), iron = C(0x2a2a30), tile = mat('s6rj_roofTile');
  let x0 = -20;
  def.forEach((b, i) => {
    const bw = b.w, cx = x0 + bw / 2, zf = i % 2 ? 4.95 : 4.75, fh0 = 4.3, fh = 3.6, H = fh0 + (b.f - 1) * fh, t = b.t;
    Bx(g, bw, H, zf + 6, tint('s6rj_stucco', b.c), cx, H / 2, (zf - 6) / 2, 4);
    pk.add(gb(bw + 0.1, 0.45, 0.9, cx, H - 0.1, zf + 0.2), white);
    for (let f = 1; f < b.f; f++) pk.add(gb(bw - 0.1, 0.22, 0.16, cx, fh0 + (f - 1) * fh - 0.05, zf + 0.04), white);
    for (const s of [-1, 1]) pk.add(gb(0.5, H - 0.4, 0.16, cx + s * (bw / 2 - 0.27), (H - 0.4) / 2, zf + 0.03), white);
    // roof: prism, ridge along x, tile texture
    const rs = new THREE.Shape(); rs.moveTo(-6.2, 0); rs.lineTo(zf + 0.7, 0); rs.lineTo(-0.6, 2.0);
    const rg = new THREE.ExtrudeGeometry(rs, { depth: bw, bevelEnabled: false }); rg.translate(0, 0, -bw / 2); rg.rotateY(-PI / 2); uvScale(rg, 0.3); rg.translate(cx, H + 0.1, 0); pk.add(rg, tile);
    // windows
    const n = Math.max(2, Math.round(bw / 3.3)), wm = alphaMat(`s6rj_archwin${b.sh}`);
    for (let f = 0; f < b.f; f++) for (let k = 0; k < n; k++) {
      const x = cx - bw / 2 + (k + 0.5) * bw / n, base = f === 0 ? 0 : fh0 + (f - 1) * fh;
      if (f === 0) {
        if (k === (n >> 1)) { g.add(decal('door', 1.9, 3.3, x, 1.75, zf + 0.07, { c: ['#2a6ad0', '#d8302a', '#1fa04a'][i % 3] })); continue; }
        wp.add(gpl(1.5, 2.3, x, 2.2, zf + 0.05), wm);
      } else {
        wp.add(gpl(1.5, 2.4, x, base + 1.95, zf + 0.05), wm);
        if (f === 1 && (k > 0 && k < n - 1) === false) { pk.add(gb(1.3, 0.22, 0.34, x, base + 0.62, zf + 0.2), C(0x2f8a3a)); pk.add(gsp(0.2, x - 0.35, base + 0.82, zf + 0.2, 1, 1, 1, 5), C([0xe8348c, 0xf6c814, 0xff4a2a][(i + k) % 3])); pk.add(gsp(0.2, x + 0.3, base + 0.82, zf + 0.2, 1, 1, 1, 5), C([0xf6c814, 0xe8348c, 0xffffff][(i + k) % 3])); }
      }
    }
    // balcony on the 2nd storey
    if (b.f >= 2 && n >= 3) {
      const bwid = bw * 0.62, y = fh0 + 0.55, z = zf + 0.5;
      pk.add(gb(bwid, 0.18, 1.0, cx, y, z), white); pk.add(gb(bwid, 0.07, 0.07, cx, y + 1.0, zf + 0.97), iron); pk.add(gb(0.07, 1.0, 0.9, cx - bwid / 2 + 0.04, y + 0.5, z), iron); pk.add(gb(0.07, 1.0, 0.9, cx + bwid / 2 - 0.04, y + 0.5, z), iron);
      for (let bx = -bwid / 2 + 0.3; bx < bwid / 2; bx += 0.36) pk.add(gb(0.04, 0.95, 0.04, cx + bx, y + 0.5, zf + 0.97), iron);
    }
    // shop sign band, awning, hanging sign
    sgn(g, t, Math.min(4.6, bw - 2), 0.8, cx, 3.85, zf + 0.07, 0, { bg: SIGNBG[(i + v) % 5], fg: '#fff8e0', border: (i + v) % 4 === 2 ? '#00E599' : '#fff8e0' });
    if (t === 'CAFE' || t === 'BAR' || t === 'PRAIA') pk.add(gb(bw * 0.7, 0.08, 1.3, cx, 3.35, zf + 0.62, 0, 0.28), mat([ 's6rj_stripeRed', 's6rj_stripeBlue', 's6rj_stripeYel'][(i + v) % 3]));
    const hx = cx + bw / 2 - 0.95; pk.add(gb(0.08, 0.08, 0.95, hx, 5.3, zf + 0.5), iron);
    const hs = ['HOTEL', 'SAMBA', 'FESTA', 'BAR', 'CAFE'][(i * 2 + v) % 5];
    for (const s of [-1, 1]) sgn(g, hs, 0.9, 0.7, hx + s * 0.05, 4.95, zf + 0.5, s * PI / 2, { bg: SIGNBG[(i + 2 + v) % 5], fg: '#fff8e0' });
    x0 += bw;
  });
  pk.build(g); wp.build(g);
  return size(g, 40, 12, 14);
}

// =====================================================================
// 11. Copacabana kiosk
// =====================================================================
export function copacabanaKiosk() {
  const g = G(), pk = new Pack();
  Bx(g, 7.6, 0.25, 7.6, mat('planks'), 0, 0.125, 0, 2);
  Bx(g, 4.3, 2.7, 4.3, tint('s6rj_stucco', 0x6fd6d0), 0, 0.25 + 1.35, -0.25, 3);
  pk.add(gb(4.6, 0.25, 4.6, 0, 3.05, -0.25), 0xfff4dc);
  pk.add(gpl(3.6, 1.3, 0, 1.9, 1.92), basic(0x2a1a14));                              // open serving hatch
  pk.add(gb(3.9, 0.12, 0.2, 0, 1.2, 1.95), 0xfff4dc);
  pk.add(gb(4.5, 1.0, 1.0, 0, 0.75, 2.45), 0xf6d23a); pk.add(gb(4.8, 0.12, 1.2, 0, 1.31, 2.45), 0xfff4dc);
  for (let i = 0; i < 4; i++) { pk.add(gcy(0.04, 0.04, 0.5, 4, -1.5 + i, 0.5, 3.4), 0x444444); pk.add(gcy(0.24, 0.2, 0.12, 8, -1.5 + i, 0.8, 3.4), [0xd8302a, 0xf6c814, 0x1f5fc0, 0x1fa04a][i]); }
  for (let i = 0; i < 4; i++) pk.add(gsp(0.2, -1.5 + i * 0.5, 1.5, 2.4, 1, 1, 1, 6), 0x4aa642);              // coconuts on the counter
  pk.add(gb(0.7, 0.55, 0.5, 1.7, 1.65, 2.4), 0x1f6fd0); pk.add(gb(0.72, 0.08, 0.52, 1.7, 1.95, 2.4), 0xf4f4ee);
  for (let i = 0; i < 3; i++) pk.add(gcy(0.07, 0.07, 0.4, 5, -0.4 + i * 0.35, 1.55, 2.0), [0x1fa04a, 0xd8302a, 0xf6c814][i]);
  pk.add(gcy(0.06, 0.06, 2.6, 5, -2.2, 1.5, 1.95), 0x8a6a48); pk.add(gcy(0.06, 0.06, 2.6, 5, 2.2, 1.5, 1.95), 0x8a6a48);
  pk.build(g);
  Bx(g, 4.8, 0.08, 1.7, mat('s6rj_stripeRed'), 0, 2.78, 2.75, 1).rotation.x = 0.3;
  const thatch = Ms(g, new THREE.ConeGeometry(3.9, 2.0, 8), dbl(0xffffff), 0, 3.9, -0.25); thatch.material = keyed('thatchD', () => new THREE.MeshLambertMaterial({ map: tex('s6rj_thatch'), side: THREE.DoubleSide }));
  { const uv = thatch.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 1.2); }
  Cy(g, 0.05, 0.05, 1.2, 5, C(0x8a6a48), 0, 4.95, -0.25, 1);
  { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), dbl(0x1fa04a)); f.position.set(0.37, 5.0 - 0.02, -0.25); g.add(f); }
  sgn(g, 'PRAIA BAR', 4.0, 0.7, 0, 2.55, 2.0, 0, { bg: '#e8501a', fg: '#fff8e0', border: '#fff8e0' });
  sgn(g, 'CAFE', 2.4, 0.6, 2.23, 2.0, -0.25, PI / 2, { bg: '#1f5fc0', fg: '#fff8e0' });
  sgn(g, 'FESTA', 2.4, 0.6, -2.23, 2.0, -0.25, -PI / 2, { bg: '#d81e86', fg: '#fff8e0' });
  Bx(g, 3.9, 0.07, 0.1, glow(NEO), 0, 2.24, 2.04, 1);
  return size(g, 8, 8, 5, [[-3.8, 3.8, -3.8, 3.8, 0.25], [-2.2, 2.2, -2.4, 1.9, 3], [-2.3, 2.3, 1.95, 2.95, 1.3]]);
}

// =====================================================================
// 12. Beach umbrella / 13. Volleyball net / 14. Surfboard stand
// =====================================================================
const UMB = [['s6rj_stripeRed', 0xf4f4ee, 0xd8302a], ['s6rj_stripeBlue', 0xf6c814, 0x1f5fd0], ['s6rj_stripeYel', 0x1fa04a, 0xe8348c]];
export function beachUmbrella(opts = {}) {
  const v = ((opts.variant | 0) % 3 + 3) % 3, g = G(), pk = new Pack(), u = UMB[v];
  pk.add(gcy(0.04, 0.045, 2.5, 6, 0, 1.25, 0), 0xe8e4d8); pk.add(gcy(0.3, 0.34, 0.1, 8, 0, 0.05, 0), 0xe6cf9a);
  pk.add(gsp(0.06, 0, 2.58, 0, 1, 1, 1, 6), 0xf6c814);
  if (v === 0) pk.add(gpl(1.0, 1.9, 0.9, 0.025, 1.0, -PI / 2, 0, 0.4), basic(0xf2c71a));
  if (v === 1) { pk.add(gb(0.7, 0.1, 1.5, -0.7, 0.35, 0.9), 0xf4f4ee); pk.add(gb(0.7, 0.08, 0.6, -0.7, 0.6, 0.32, 0, 0.7), 0x1f5fd0); for (const [dx, dz] of [[-.3, .2], [.3, .2], [-.3, 1.5], [.3, 1.5]]) pk.add(gb(0.06, 0.32, 0.06, -0.7 + dx, 0.17, dz), 0x888888); }
  if (v === 2) { pk.add(gcy(0.22, 0.22, 0.5, 8, 0.8, 0.28, 0.7), 0xff8a2a); pk.add(gsp(0.18, 0.8, 0.62, 0.7, 1, 0.5, 1, 6), 0x4aa642); pk.add(gb(0.9, 0.04, 1.8, -0.7, 0.025, 0.8), 0xe8348c); }
  pk.build(g);
  const m = new THREE.MeshLambertMaterial({ map: tex(u[0]), side: THREE.DoubleSide }), c = Ms(g, new THREE.ConeGeometry(1.5, 0.52, 8, 1, true), m, 0, 2.3, 0);
  { const uv = c.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i)); }
  return size(g, 3, 3, 2.6, [[-0.12, 0.12, -0.12, 0.12, 2.6]]);
}
export function volleyballNet() {
  const g = G(), pk = new Pack(), W = 4.7;
  for (const s of [-1, 1]) {
    pk.add(gcy(0.05, 0.06, 2.5, 6, s * W, 1.25, 0), 0xdddddd); pk.add(gcy(0.07, 0.07, 0.3, 6, s * W, 0.2, 0), 0xd8302a);
    pk.add(rodG([s * W, 2.2, 0], [s * (W + 0.5), 0.05, 1.0], 0.012, 3), 0x222222); pk.add(rodG([s * W, 2.2, 0], [s * (W + 0.5), 0.05, -1.0], 0.012, 3), 0x222222);
    pk.add(gcy(0.025, 0.025, 0.8, 4, s * (W - 0.2), 2.8 - 0.4, 0), 0xd8302a);
  }
  pk.add(gb(2 * W, 0.1, 0.03, 0, 2.43, 0), 0xf8f8f8); pk.add(gb(2 * W, 0.05, 0.03, 0, 1.45, 0), 0xf8f8f8);
  pk.add(gsp(0.11, 1.4, 0.11, 0.8, 1, 1, 1, 8), 0xf6e24a); pk.add(gb(0.05, 0.1, 0.05, 1.4, 0.11, 0.8), 0x1f5fd0);
  pk.build(g);
  const net = tiledPlane(2 * W, 0.98, 2 * W / 0.4, 0.98 / 0.4, alphaMat('s6rj_net'), 0, 1.94, 0); g.add(net);
  Bx(g, 2 * W - 0.2, 0.06, 0.04, C(0xd8302a), 0, 2.36, 0.03, 1);
  return size(g, 10, 2, 2.5, [[-W - 0.1, -W + 0.1, -0.1, 0.1, 2.5], [W - 0.1, W + 0.1, -0.1, 0.1, 2.5]]);
}
export function surfboardStand() {
  const g = G(), pk = new Pack(), cl = [0xff3d6e, 0x18c8e0, 0xf6d23a, 0x7cd24a, 0xff8a2a, 0xf4f4ee], st = [0xffffff, 0xff3d6e, 0x2a4ab0, 0xd81e86, 0xffffff, 0x18c8e0];
  pk.add(gb(3, 0.4, 1.0, 0, 0.2, 0), 0x8a5a32); pk.add(gb(3, 0.06, 1.04, 0, 0.43, 0), 0xc8884a);
  for (const s of [-1, 1]) pk.add(gb(0.12, 2.1, 0.12, s * 1.42, 1.45, -0.38), 0x8a5a32);
  pk.add(gb(3, 0.1, 0.14, 0, 2.2, -0.38), 0x8a5a32); pk.add(gb(3, 0.1, 0.14, 0, 1.1, -0.38), 0x8a5a32);
  for (let i = 0; i < 6; i++) {
    const x = -1.2 + i * 0.48, L = 1.0 + (i % 3) * 0.06, tilt = 0.06 + (i % 2) * 0.02;
    pk.add(xf(new THREE.SphereGeometry(1, 10, 6), x, 0.45 + L * 0.96, -0.12, tilt, 0, 0, 0.26, L, 0.045), cl[i]);
    pk.add(xf(new THREE.SphereGeometry(1, 8, 4), x, 0.45 + L * 0.96, -0.1, tilt, 0, 0, 0.07, L * 0.97, 0.05), st[i]);
    pk.add(gb(0.02, 0.2, 0.18, x, 0.62, -0.2), 0x222222);
  }
  pk.build(g);
  sgn(g, 'SURF', 2.2, 0.34, 0, 0.22, 0.52, 0, { bg: '#1f5fc0', fg: '#fff8e0' });
  Bx(g, 2.1, 0.05, 0.05, glow(NEO), 0, 0.46, 0.5, 1);
  return size(g, 3, 1, 2.4, [[-1.5, 1.5, -0.5, 0.5, 2.4]]);
}

// =====================================================================
// shared bits for the remaining builders
// =====================================================================
function frond(L = 2.3, W = 0.5, up = 1.0, droop = 1.5) {
  const n = 6, pos = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = L * t, y = 1.1 * up * t - droop * t * t, w = W * Math.sin(PI * Math.min(1, 0.18 + 0.9 * t)) * (1 - 0.3 * t);
    pos.push(x, y, -w, x, y + 0.14, 0, x, y, w);
  }
  for (let i = 0; i < n; i++) { const a = i * 3, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); geo.setIndex(idx); geo.computeVertexNormals();
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return geo;
}
function bladeG(s, dir, L, w, flat = 0.3) {   // feather: flattened 4-sided cone from point s along unit dir
  const geo = new THREE.ConeGeometry(w, L, 4); geo.scale(1, 1, flat); geo.translate(0, L / 2, 0);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize()));
  return geo.translate(s[0], s[1], s[2]);
}
const RAINBOW = [0xd8302a, 0xff8a1a, 0xf6c814, 0x7cd24a, 0x18b8c8, 0x2f6fe0, 0xd81e86];

// =====================================================================
// 15. Samba club hall (enterable)
// =====================================================================
export function sambaClubHall() {
  const W = 46, D = 34, H = 16, CH = 10.5, T = 1.4, g = G(), cols = [], pk = new Pack(), fx = new Pack();
  const base = hall({
    w: W, d: D, h: H, ch: CH, t: T, outer: 's6rj_sambaOuter', inner: 's6rj_sambaInner', floor: 's6rj_danceFloor', ceil: 's6rj_sambaCeil', roof: 'roofTar', tile: 10,
    doors: [{ side: 'S', at: 0, w: 9, h: 6 }, { side: 'N', at: 0, w: 9, h: 6 }, { side: 'E', at: 0, w: 7, h: 5.5 }],
  });
  g.add(base); cols.push(...base.userData.cols);
  const ix = base.userData.inside, X0 = ix.x0, X1 = ix.x1, Z0 = ix.z0, Z1 = ix.z1;
  const hot = [0xd81e86, 0x14b8b0, 0xf6c814, 0xff7a1a], tri = [0x1fa04a, 0xf6c814, 0x1f5fd0];
  // ---------- exterior ----------
  for (let i = 0, x = -22; x <= 22; x += 2, i++) for (const s of [-1, 1]) if (Math.abs(x) > 0.1 || true) pk.add(gb(1.4, 1.2, 1.0, x, H + 0.6, s * (D / 2 - 0.5)), hot[(i + (s > 0 ? 1 : 0)) % 4]);
  for (let i = 0, z = -15; z <= 15; z += 2, i++) for (const s of [-1, 1]) pk.add(gb(1.0, 1.2, 1.4, s * (W / 2 - 0.5), H + 0.6, z), hot[(i + 2 + (s > 0 ? 1 : 0)) % 4]);
  [7.5, 12, 16.5, 20.8].forEach((x, i) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) pk.add(gb(1.2, H, 0.4, sx * x, H / 2, sz * (D / 2 + 0.15)), tri[(i + (sx > 0 ? 1 : 0)) % 3]); });
  [6, 10.5, 15].forEach((z, i) => { for (const sz of [-1, 1]) for (const sx of [-1, 1]) pk.add(gb(0.4, H, 1.2, sx * (W / 2 + 0.15), H / 2, sz * z), tri[(i + 1) % 3]); });
  for (const sz of [-1, 1]) {                                            // door frames N / S
    for (const sx of [-1, 1]) pk.add(gb(0.8, 6.6, 0.5, sx * 5.3, 3.3, sz * (D / 2 + 0.2)), 0xf6c814);
    pk.add(gb(11.4, 0.9, 0.5, 0, 6.5, sz * (D / 2 + 0.2)), 0xd81e86);
    pk.add(gb(15.2, 3.6, 0.3, 0, 9.9, sz * (D / 2 + 0.1)), 0x1c0c2c);
  }
  // side door frame (E)
  for (const sz of [-1, 1]) pk.add(gb(0.5, 6.0, 0.8, W / 2 + 0.2, 3.0, sz * 4.0), 0xf6c814);
  pk.add(gb(0.5, 0.9, 8.4, W / 2 + 0.2, 6.0, 0), 0xd81e86);
  // arch windows
  [-1, 1].forEach((sz) => [9.75, 14.25, 18.65].forEach((x, i) => { for (const sx of [-1, 1]) fx.add(gpl(1.6, 2.5, sx * x, 11.0, sz * (D / 2 + 0.06), 0, sz > 0 ? 0 : PI), alphaMat(`s6rj_archwin${(i + (sx > 0 ? 1 : 0)) % 3}`)); }));
  [-1, 1].forEach((sx) => [-13, -8.2, 8.2, 13].forEach((z, i) => fx.add(gpl(1.6, 2.5, sx * (W / 2 + 0.06), 11.0, z, 0, sx * PI / 2), alphaMat(`s6rj_archwin${i % 3}`))));
  // rooftop disco ball
  pk.add(gcy(0.08, 0.08, 1.6, 5, 0, H + 1.9, D / 2 - 5), 0x444444);
  fx.add(new THREE.IcosahedronGeometry(1.25, 1).translate(0, H + 3.4, D / 2 - 5), shiny(0xe8e8f4, 90, 0x303050));
  sgn(g, 'SAMBA', 14, 2.8, 0, 9.9, D / 2 + 0.3, 0, { bg: '#1c0c2c', fg: '#f6c814', border: '#d81e86' });
  sgn(g, 'FESTA', 14, 2.8, 0, 9.9, -D / 2 - 0.3, PI, { bg: '#1c0c2c', fg: '#14b8b0', border: '#f6c814' });
  sgn(g, 'CARNAVAL', 10, 2.2, W / 2 + 0.3, 9.6, 0, PI / 2, { bg: '#1c0c2c', fg: '#ff7a1a', border: '#14b8b0' });
  sgn(g, 'CLUBE', 10, 2.2, -W / 2 - 0.3, 9.6, 0, -PI / 2, { bg: '#1c0c2c', fg: '#d81e86', border: '#f6c814' });
  Bx(g, 13.6, 0.12, 0.12, glow(NEO), 0, 8.0, D / 2 + 0.34, 1);
  // ---------- interior ----------
  const wood = mat('planks');
  // stage on the west wall (6 deep, 18 long, 1.2 high)
  Bx(g, 6, 1.2, 18, wood, X0 + 3, 0.6, 0, 2); cols.push([X0, X0 + 6, -9, 9, 1.2]);
  pk.add(gb(0.15, 0.4, 18, X0 + 6.05, 0.9, 0), 0xd81e86);
  { const cur = tiledPlane(18, 7, 9, 3.5, flatMap('s6rj_sequin'), X0 + 0.05, 4.7, 0); cur.rotation.y = PI / 2; g.add(cur); }
  sgn(g, 'SAMBA', 7, 1.2, X0 + 0.07, 9.0, 0, PI / 2, { bg: '#d81e86', fg: '#fff4d6', border: '#f6c814' });
  pk.add(gb(0.25, 0.25, 18, X0 + 5, 7.8, 0), 0x2a2a34);
  for (const z of [-8.8, 8.8]) pk.add(gb(0.1, 2.6, 0.1, X0 + 5, 9.1, z), 0x2a2a34);
  for (let i = 0; i < 7; i++) { pk.add(gb(0.5, 0.5, 0.5, X0 + 5, 7.4, -7.5 + i * 2.5), 0x444455); fx.add(gb(0.36, 0.1, 0.36, X0 + 5, 7.12, -7.5 + i * 2.5), glow(hot[i % 4])); }
  for (let i = 0; i < 5; i++) { const z = -6 + i * 3, c = hot[(i + 1) % 4]; pk.add(gcy(0.5, 0.46, 1.0, 12, X0 + 3.4, 1.7, z), c); pk.add(gcy(0.48, 0.48, 0.04, 12, X0 + 3.4, 2.22, z), 0xf4f4ee); pk.add(gcy(0.51, 0.51, 0.08, 12, X0 + 3.4, 1.5, z), 0xf6c814); }
  pk.add(gcy(0.75, 0.7, 1.4, 12, X0 + 1.4, 1.9, 0), 0xd81e86); pk.add(gcy(0.72, 0.72, 0.04, 12, X0 + 1.4, 2.62, 0), 0xf4f4ee);
  pk.add(gcy(0.02, 0.02, 1.5, 4, X0 + 5.6, 1.95, 3), 0x222222); pk.add(gsp(0.07, X0 + 5.6, 2.75, 3, 1, 1, 1, 5), 0x222222);
  for (const z of [-10.4, 10.4]) { pk.add(gb(1.4, 2.8, 1.6, X0 + 4.4, 1.4, z), 0x1c1c22); for (const yy of [0.9, 1.9]) pk.add(gcy(0.42, 0.42, 0.05, 10, X0 + 5.15, yy, z, 0, 0, PI / 2), 0x4a4a54); cols.push([X0 + 3.6, X0 + 5.2, z - 0.8, z + 0.8, 2.8]); }
  // dance floor + light discs + disco ball
  { const dm = flatMap('s6rj_danceFloor').clone(); dm.depthWrite = false; const df = tiledPlane(14, 14, 3.5, 3.5, dm, 0.5, 0.05, 0); df.rotation.x = -PI / 2; df.renderOrder = -3; g.add(df); }
  hot.concat([0xffffff]).forEach((c, i) => { for (let k = 0; k < 2; k++) { const a = (i * 2 + k) * 0.8 + 0.3, rr = 1.5 + (i + k) % 4 * 1.3; const d = new THREE.Mesh(new THREE.CircleGeometry(0.9 + (i % 2) * 0.4, 14), keyed(`spot${c}`, () => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }))); d.rotation.x = -PI / 2; d.position.set(0.5 + Math.cos(a) * rr, 0.07, Math.sin(a) * rr); d.renderOrder = -2; g.add(d); } });
  pk.add(gcy(0.03, 0.03, 1.4, 4, 0.5, CH - 0.7, 0), 0x333333);
  fx.add(new THREE.IcosahedronGeometry(1.0, 2).translate(0.5, CH - 2.2, 0), shiny(0xdcdce8, 100, 0x383850));
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; fx.add(gb(0.2, 0.2, 0.2, 0.5 + Math.cos(a) * 1.1, CH - 2.2 + Math.sin(i * 2.1) * 0.5, Math.sin(a) * 1.1), glow(hot[i % 4])); }
  // bar on the east wall (north part), stools
  pk.add(gb(1.5, 1.1, 9, X1 - 2.2, 0.55, 10), 0xd81e86); pk.add(gb(1.9, 0.1, 9.4, X1 - 2.2, 1.15, 10), 0xf8f0d8);
  pk.add(gb(0.05, 0.06, 9.2, X1 - 2.97, 0.95, 10), glow(NEO));
  pk.add(gb(0.5, 2.6, 9, X1 - 0.3, 1.3, 10), 0x4a2a1a);
  for (let i = 0; i < 18; i++) { const z = 6 + i * 0.5, sh = i % 3; pk.add(gcy(0.07, 0.08, 0.45 + sh * 0.1, 6, X1 - 0.65, 1.2 + (i % 2) * 0.95 + 0.25, z), RAINBOW[i % 7]); }
  pk.add(gb(0.5, 0.06, 9, X1 - 0.65, 1.1, 10), 0xe8d8b0); pk.add(gb(0.5, 0.06, 9, X1 - 0.65, 2.05, 10), 0xe8d8b0);
  for (let i = 0; i < 6; i++) { pk.add(gcy(0.04, 0.04, 0.7, 4, X1 - 4.2, 0.35, 6.9 + i * 1.3), 0x666666); pk.add(gcy(0.24, 0.2, 0.12, 8, X1 - 4.2, 0.74, 6.9 + i * 1.3), hot[i % 4]); }
  cols.push([X1 - 3.0, X1, 5.3, 14.7, 1.2]);
  sgn(g, 'BAR', 3, 0.9, X1 - 0.06, 4.4, 10, -PI / 2, { bg: '#241035', fg: '#f6c814', border: '#d81e86' });
  // tables with stools
  for (const [tx, tz] of [[-10, -11.5], [-10, 11.5], [10, -11.5], [8, -5.5]]) {
    pk.add(gcy(0.07, 0.1, 1.0, 6, tx, 0.5, tz), 0x333333); pk.add(gcy(0.2, 0.2, 0.05, 8, tx, 0.03, tz), 0x333333);
    pk.add(gcy(0.85, 0.85, 0.08, 14, tx, 1.04, tz), hot[(tx + tz) & 3 & 3 || 0]);
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + tz, sx = tx + Math.cos(a) * 1.35, sz = tz + Math.sin(a) * 1.35; pk.add(gcy(0.04, 0.04, 0.5, 4, sx, 0.3, sz), 0x555555); pk.add(gcy(0.24, 0.22, 0.1, 8, sx, 0.6, sz), 0xf6c814); }
    cols.push([tx - 0.9, tx + 0.9, tz - 0.9, tz + 0.9, 1.1]);
  }
  // potted palms
  for (const [px, pz] of [[-19.5, 13.5], [-19.5, -13.5], [19.5, -13.5]]) {
    pk.add(gcy(0.5, 0.38, 0.8, 8, px, 0.4, pz), 0xb8562c);
    for (let k = 0; k < 7; k++) fx.add(xf(frond(1.5, 0.3, 1.0, 1.0), px, 1.0, pz, 0, k / 7 * PI * 2, 0.5 + (k % 2) * 0.35), dbl(k % 2 ? 0x2e9d3a : 0x44b24a));
    cols.push([px - 0.55, px + 0.55, pz - 0.55, pz + 0.55, 2.6]);
  }
  // hanging streamers and bunting
  const r = mulberry(6401);
  for (let i = 0; i < 110; i++) { const x = (r() - 0.5) * 34, z = (r() - 0.5) * 26, len = 2 + r() * 3.2; fx.add(gpl(0.16, len, x, CH - len / 2 - 0.02, z, 0, r() * 3), dbl(pick(r, hot.concat(RAINBOW)))); }
  for (const bz of [-10.5, -3.8, 3.8, 10.5]) {
    const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20, x = X0 + 0.3 + u * (X1 - X0 - 0.6); pts.push([x, CH - 0.5 - 1.3 * Math.sin(u * PI), bz]); }
    for (let i = 0; i < 20; i++) pk.add(rodG(pts[i], pts[i + 1], 0.018, 3), 0x333333);
    for (let i = 0; i < 40; i++) { const u = (i + 0.5) / 40, x = X0 + 0.3 + u * (X1 - X0 - 0.6), y = CH - 0.5 - 1.3 * Math.sin(u * PI); fx.add(triG([x - 0.25, y, bz], [x + 0.25, y, bz], [x, y - 0.65, bz]), dbl(hot.concat(tri)[i % 7])); }
  }
  sgn(g, 'CARNAVAL', 9, 1.6, 0, 8.0, Z0 + 0.07, 0, { bg: '#d81e86', fg: '#fff4d6', border: '#f6c814' });
  sgn(g, 'FESTA', 9, 1.6, 0, 8.0, Z1 - 0.07, PI, { bg: '#14b8b0', fg: '#241035', border: '#f6c814' });
  pk.build(g); fx.build(g);
  size(g, W, D, H + 3.6, cols);
  g.userData.inside = { ...ix }; g.userData.doors = base.userData.doors;
  return g;
}

// =====================================================================
// 16. Sambadrome grandstand
// =====================================================================
export function sambadromeStand() {
  const g = G(), pk = new Pack(), cols = [], concrete = mat('concrete');
  const sec = [0xd8302a, 0xf6c814, 0x1fa04a, 0x1f5fd0, 0xd81e86, 0xff7a1a];
  for (let j = 0; j < 10; j++) {
    const h = 2.0 + 0.9 * j, z1 = 8 - 1.5 * j, z0 = z1 - 1.5, zc = (z0 + z1) / 2;
    Bx(g, 60, h, 1.5, concrete, 0, h / 2, zc, 3);
    for (let s = 0; s < 6; s++) { const x = -25 + s * 10; pk.add(gb(9.2, 0.5, 1.0, x, h + 0.25, zc + 0.15), sec[(s + j) % 6]); pk.add(gb(9.2, 0.45, 0.2, x, h + 0.75, z0 + 0.15), sec[(s + j) % 6]); }
    cols.push([-30, 30, z0, z1, h]);
  }
  Bx(g, 60, 12.2, 1.0, concrete, 0, 6.1, -7.5, 3); cols.push([-30, 30, -8, -7, 12.2]);
  // canopy on posts, trim, flags
  pk.add(gb(60.4, 0.4, 9.2, 0, 12.5, -3.4), 0xf4f0e4); pk.add(gb(60.6, 0.5, 0.3, 0, 12.35, 1.3), 0xd81e86); pk.add(gb(60.6, 0.12, 0.3, 0, 12.8, 1.3), 0xf6c814);
  for (let i = 0; i < 7; i++) pk.add(gcy(0.22, 0.26, 12.4 - 5.6, 8, -30 + 0.6 + i * 9.8, 5.6 + (12.4 - 5.6) / 2, 0.9), 0xe8e4d8);
  const fc = [0x1fa04a, 0xf6c814, 0x1f5fd0, 0xf4f4ee];
  for (let i = 0; i < 11; i++) { const x = -29 + i * 5.8; pk.add(gcy(0.05, 0.05, 2.2, 4, x, 13.2, -7.6), 0xdddddd); pk.add(triG([x, 14.2, -7.6], [x, 13.2, -7.6], [x + 1.4, 13.7, -7.6]), dbl(fc[i % 4])); }
  for (let i = 0; i < 60; i++) { const x = -29.5 + i, y = 2.0 + Math.sin(i * 0.5) * 0.0; pk.add(triG([x - 0.4, y + 0.2, 8.14], [x + 0.4, y + 0.2, 8.14], [x, y - 0.5, 8.14]), dbl([0xd81e86, 0x14b8b0, 0xf6c814, 0xff7a1a][i % 4])); }
  pk.build(g);
  [['SAMBA', '#d81e86'], ['CARNAVAL', '#1f5fc0'], ['FESTA', '#1fa04a'], ['RIO', '#e8501a']].forEach(([t, bg], i) => sgn(g, t, 9, 1.2, -22.5 + i * 15, 0.95, 8.06, 0, { bg, fg: '#fff8e0', border: '#f6e24a' }));
  Bx(g, 59, 0.1, 0.1, glow(NEO), 0, 1.75, 8.1, 1);
  return size(g, 60, 16, 14, cols);
}

// =====================================================================
// 17. Carnival float (variant 0 dragon, 1 bird)
// =====================================================================
export function carnivalFloat(opts = {}) {
  const v = (opts.variant | 0) & 1, g = G(), pk = new Pack(), r = mulberry(6500 + v);
  Bx(g, 14, 1.5, 6, tint('s6rj_sequin', 0xffffff), 0, 1.15, 0, 3);
  pk.add(gb(14.3, 0.22, 6.3, 0, 2.0, 0), 0xe4b030); pk.add(gb(14.3, 0.22, 6.3, 0, 0.45, 0), 0xd81e86);
  for (const x of [-4.8, 4.8]) for (const z of [-2.7, 2.7]) pk.add(gcy(0.7, 0.7, 0.5, 12, x, 0.7, z * 1.06, PI / 2), 0x222226);
  for (let i = 0; i < 14; i++) for (const s of [-1, 1]) pk.add(gsp(0.1, -6.5 + i, 2.12, s * 3.0, 1, 1, 1, 5), glow(0xfff0a0));
  if (v === 0) {                                       // dragon
    const N = 12, Pt = (t) => [-5.4 + 10.8 * t, 3.4 + 3.2 * Math.pow(Math.sin(PI * Math.min(1, t * 0.95)), 0.8) + 2.4 * t * t * t, 1.0 * Math.sin(PI * 2 * t)];
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = Pt(t), rad = 0.55 + 0.75 * Math.sin(PI * (0.15 + 0.7 * t)), c = [0x1fa04a, 0xf6c814, 0xd81e86, 0x18b8c8][i % 4];
      pk.add(gsp(rad, p[0], p[1], p[2], 1, 1, 1, 8), c);
      pk.add(gco(0.28, 0.9 + rad * 0.4, 5, p[0], p[1] + rad + 0.3, p[2]), 0xe4b030);
      if (i < N) { const q = Pt((i + 0.5) / N); pk.add(gsp(rad * 0.85, q[0], q[1], q[2], 1, 1, 1, 7), c); }
    }
    const hp = Pt(1);
    pk.add(gsp(1.15, hp[0] + 0.3, hp[1] + 0.2, hp[2], 1.15, 0.9, 0.95, 10), 0xd81e86); pk.add(gb(1.7, 0.7, 1.0, hp[0] + 1.65, hp[1] - 0.05, hp[2]), 0xe8348c); pk.add(gb(1.6, 0.18, 0.9, hp[0] + 1.6, hp[1] - 0.5, hp[2]), 0xf4f4ee);
    for (const s of [-1, 1]) { pk.add(gco(0.2, 1.4, 5, hp[0] - 0.1, hp[1] + 1.4, hp[2] + s * 0.6, 0, 0, s * -0.4 + 0.5), 0xf6c814); pk.add(gsp(0.2, hp[0] + 0.85, hp[1] + 0.55, hp[2] + s * 0.62, 1, 1, 1, 6), 0xffffff); pk.add(gsp(0.1, hp[0] + 0.97, hp[1] + 0.55, hp[2] + s * 0.66, 1, 1, 1, 5), 0xd8302a); }
    for (let i = 0; i < 5; i++) pk.add(gco(0.08, 0.35, 4, hp[0] + 1.0 + i * 0.28, hp[1] - 0.62, hp[2] + (i % 2 ? 0.3 : -0.3), PI), 0xffffff);
    for (const s of [-1, 1]) for (let k = 0; k < 8; k++) { const a = (-0.15 + k * 0.2) * 1.0, wp = Pt(0.36); pk.add(bladeG([wp[0], wp[1] + 0.5, wp[2] + s * 0.5], [(k - 3.5) * 0.06, Math.sin(a + 0.55), s * Math.cos(a + 0.35) * 0.9], 1.7 + (k % 3) * 0.25, 0.22, 0.25), RAINBOW[k % 7]); }
    for (let k = 0; k < 5; k++) pk.add(bladeG([-5.8, 3.6, 0], [-0.6 - k * 0.1, 0.5 + k * 0.18, (k - 2) * 0.3], 1.8, 0.2, 0.3), RAINBOW[(k + 2) % 7]);
  } else {                                             // bird
    pk.add(gcy(2.2, 2.6, 1.0, 12, 0, 2.6, 0), 0xe4b030);
    pk.add(gsp(1.0, 0, 4.3, 0, 1.15, 1.5, 1.0, 10), 0xd8302a);
    pk.add(gsp(0.55, 1.5, 5.8, 0, 1, 1, 1, 8), 0xd8302a); pk.add(gsp(0.55, 2.0, 6.7, 0, 1, 1, 1, 8), 0xd8302a);
    pk.add(gsp(0.85, 2.5, 7.4, 0, 1, 1, 0.9, 10), 0xf6c814); pk.add(gco(0.38, 1.2, 6, 3.35, 7.1, 0, 0, 0, -2.3), 0xf4f4ee); pk.add(gco(0.3, 0.7, 5, 3.4, 6.7, 0, 0, 0, 2.6), 0x222222);
    for (const s of [-1, 1]) { pk.add(gsp(0.2, 2.95, 7.6, s * 0.55, 1, 1, 1, 6), 0xffffff); pk.add(gsp(0.1, 3.05, 7.6, s * 0.58, 1, 1, 1, 5), 0x111111); }
    for (let k = 0; k < 7; k++) pk.add(bladeG([2.2, 8.0, 0], [-0.5 + k * 0.12, 1, (k - 3) * 0.16], 1.5 + (k % 3) * 0.3, 0.2, 0.3), RAINBOW[k % 7]);
    for (const s of [-1, 1]) for (let k = 0; k < 10; k++) { const a = -0.15 + k * 0.17; pk.add(bladeG([-0.3, 4.6, s * 0.9], [-0.15 + k * 0.01, Math.sin(a), s * Math.cos(a)], 2.1 + (k % 3) * 0.2, 0.28, 0.25), RAINBOW[(k + (s > 0 ? 2 : 0)) % 7]); }
    for (let k = 0; k < 9; k++) { const a = k / 8 * 0.9 - 0.2; pk.add(bladeG([-0.8, 4.0, (k - 4) * 0.12], [-Math.cos(a + 0.2), -Math.sin(a) * 0.4 - 0.05, (k - 4) * 0.09], 4.4 + (k % 3) * 0.3, 0.3, 0.25), RAINBOW[(k + 1) % 7]); }
    pk.add(gcy(0.1, 0.1, 1.8, 5, 0.6, 3.3, 0.6), 0x555555); pk.add(gcy(0.1, 0.1, 1.8, 5, 0.6, 3.3, -0.6), 0x555555);
  }
  pk.build(g);
  sgn(g, v ? 'FESTA' : 'CARNAVAL', 5.4, 0.9, 0, 1.15, 3.07, 0, { bg: '#241035', fg: '#f6c814', border: '#d81e86' });
  sgn(g, v ? 'SAMBA' : 'RIO', 5.4, 0.9, 0, 1.15, -3.07, PI, { bg: '#241035', fg: '#14b8b0', border: '#d81e86' });
  Bx(g, 7, 0.07, 0.07, glow(NEO), 0, 0.62, 3.08, 1);
  const cols = [[-7, 7, -3, 3, 2.1]];
  if (v === 0) cols.push([-6.4, -2, -2.2, 2.2, 5.6], [-2, 2, -2.2, 2.2, 7], [2, 6.4, -2.2, 2.2, 9]); else cols.push([-1.9, 1.9, -1.9, 1.9, 5.8], [1.2, 3.4, -1.0, 1.0, 9]);
  return size(g, 14, 6, 9, cols);
}

// =====================================================================
// 18. Cable-car pylon + gondola
// =====================================================================
export function cableCarPylon() {
  const g = G(), pk = new Pack(), red = 0xd8302a, wht = 0xf4f4ee;
  pk.add(gb(3.0, 0.5, 3.0, 0, 0.25, 0), 0x9a9a94);
  const L = (y) => 1.3 - (y / 30) * 0.8;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let s = 0; s < 6; s++) pk.add(rodG([sx * L(s * 5), s * 5, sz * L(s * 5)], [sx * L(s * 5 + 5), s * 5 + 5, sz * L(s * 5 + 5)], 0.11, 5), s % 2 ? wht : red);
  for (let s = 0; s < 6; s++) {
    const y0 = s * 5, y1 = y0 + 5, a = L(y0), b = L(y1);
    for (const [p, q] of [[[-a, y0, -a], [-b, y1, b]], [[a, y0, -a], [-b, y1, -b]], [[a, y0, a], [b, y1, -b]], [[-a, y0, a], [b, y1, b]]]) pk.add(rodG(p, q, 0.04, 4), 0x8a8e94);
    pk.add(gb(2 * b, 0.1, 0.1, 0, y1, b), 0x8a8e94); pk.add(gb(2 * b, 0.1, 0.1, 0, y1, -b), 0x8a8e94); pk.add(gb(0.1, 0.1, 2 * b, b, y1, 0), 0x8a8e94); pk.add(gb(0.1, 0.1, 2 * b, -b, y1, 0), 0x8a8e94);
  }
  pk.add(gb(0.6, 0.5, 3.0, 0, 29.4, 0), red); pk.add(gb(1.0, 0.25, 3.0, 0, 29.8, 0), wht);
  for (const z of [-0.9, 0.9]) { pk.add(gcy(0.42, 0.42, 0.22, 10, 0, 30.0 - 0.0, z, PI / 2), 0x333338); }
  pk.add(gsp(0.3, 0, 29.9, 1.35, 1, 1, 1, 6), 0xff8a1a);
  pk.build(g);
  Bx(g, 0.5, 0.06, 0.06, glow(NEO), 0, 29.2, 1.52, 1);
  return size(g, 3, 3, 30, [[-1.5, 1.5, -1.5, 1.5, 30]]);
}
export function cableCar() {
  const g = G(), pk = new Pack();
  pk.add(gb(3.4, 1.5, 1.5, 0, 0.9, 0), 0xd8302a); pk.add(gb(3.44, 0.7, 1.54, 0, 1.15, 0), glassM(0x9fd8f4, 0.75));
  pk.add(gb(3.6, 0.16, 1.7, 0, 1.76, 0), 0xf4f4ee); pk.add(gb(3.5, 0.14, 1.6, 0, 0.12, 0), 0x2a2a30);
  for (const x of [-1.7, 0, 1.7]) pk.add(gb(0.1, 0.72, 1.6, x, 1.15, 0), 0xf4f4ee);
  pk.add(gb(0.14, 0.7, 0.14, 0, 2.15, 0), 0x333338); pk.add(gb(0.6, 0.22, 0.5, 0, 2.4, 0), 0x555a62);
  pk.add(gcy(0.06, 0.06, 4, 5, 0, 2.45, 0, 0, 0, PI / 2), 0x222226);
  pk.add(gb(3.4, 0.07, 0.07, 0, 0.45, 0.78), glow(NEO));
  pk.build(g);
  return size(g, 4, 2, 2.5, [[-1.8, 1.8, -0.8, 0.8, 1.8]]);
}

// =====================================================================
// 19-23. palm, paving, lamp, fruit stand, bay boat
// =====================================================================
export function palmRio() {
  const g = G(), pk = new Pack(), r = mulberry(6601);
  let x = -0.9, y = 0;
  const trunkM = mat('s6rj_palmTrunk');
  for (let k = 0; k < 6; k++) {
    const a = 0.04 + 0.025 * k, len = 1.85, rb = 0.44 - k * 0.03, rt = rb - 0.03;
    const c = cylT(rt, rb, len + 0.05, 7, trunkM, 1.5); c.position.set(x + Math.sin(a) * len / 2, y + Math.cos(a) * len / 2, 0); c.rotation.z = -a; g.add(c);
    x += Math.sin(a) * len; y += Math.cos(a) * len;
  }
  const g1 = dbl(0x2e9d3a), g2 = dbl(0x4ab04e);
  for (let k = 0; k < 11; k++) {
    const yaw = k / 11 * PI * 2 + r() * 0.3, pitch = -0.1 + (k % 3) * 0.28 + r() * 0.1;
    pk.add(xf(frond(2.6 + r() * 0.3, 0.68, 1.0, 1.6 + (k % 2) * 0.4), x, y + 0.1, 0, 0, yaw, pitch), k % 2 ? g1 : g2);
  }
  pk.add(gco(0.14, 1.3, 4, x, y + 0.8, 0), 0x4ab04e);
  for (let k = 0; k < 4; k++) pk.add(gsp(0.26, x + Math.cos(k * 1.6) * 0.32, y - 0.2, Math.sin(k * 1.6) * 0.32, 1, 1, 1, 6), k % 2 ? 0x6a4a28 : 0x8aa838);
  pk.build(g);
  return size(g, 4, 4, 13, [[-1.2, -0.45, -0.38, 0.38, 13]]);
}
export function promenadePaving() {
  const g = G();
  const m = keyed('pave', () => { const q = new THREE.MeshLambertMaterial({ map: tex('s6rj_wave') }); q.polygonOffset = true; q.polygonOffsetFactor = -2; q.polygonOffsetUnits = -2; return q; });
  const p = tiledPlane(40, 10, 10, 2.5, m, 0, 0.02, 0); p.rotation.x = -PI / 2; g.add(p);
  return size(g, 40, 10, 0.02, [], { solid: false });
}
export function lampRio() {
  const g = G(), pk = new Pack(), dk = 0x1f4a3a;
  pk.add(gcy(0.26, 0.3, 0.5, 8, 0, 0.25, 0), 0xb8b4a4); pk.add(gcy(0.14, 0.2, 0.5, 8, 0, 0.75, 0), dk);
  pk.add(gcy(0.07, 0.1, 3.0, 7, 0, 2.5, 0), dk); for (const y of [1.2, 2.6, 3.9]) pk.add(gcy(0.13, 0.13, 0.1, 8, 0, y, 0), 0xe4b030);
  pk.add(gcy(0.2, 0.1, 0.3, 8, 0, 4.1, 0), dk); pk.add(gsp(0.27, 0, 4.45, 0, 1, 1.15, 1, 8), color(0xfff0b0, { emissive: 0xffe08a }));
  pk.add(gco(0.34, 0.45, 8, 0, 4.88, 0), 0x2f7a5a); pk.add(gsp(0.07, 0, 5.0 - 0.0, 0, 1, 1, 1, 5), 0xe4b030);
  pk.add(triG([0.07, 3.3, 0], [0.07, 3.0, 0], [0.34, 3.15, 0]), dbl(0xf6c814)); pk.add(gcy(0.095, 0.095, 0.04, 8, 0, 1.9, 0), glow(NEO));
  pk.build(g);
  return size(g, 0.6, 0.6, 5, [[-0.2, 0.2, -0.2, 0.2, 5]]);
}
export function fruitStand() {
  const g = G(), pk = new Pack(), r = mulberry(6701);
  pk.add(gb(3.6, 0.95, 1.2, 0, 0.475, 0.1), 0xf6c814); pk.add(gb(3.8, 0.08, 1.4, 0, 0.99, 0.1), 0x8a5a32);
  pk.add(gb(3.62, 0.12, 1.22, 0, 0.5, 0.1), 0x1fa04a);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) pk.add(gcy(0.05, 0.05, 2.6, 5, sx * 1.85, 1.3, sz * 0.75 + 0.1), 0x8a5a32);
  const fr = [[0xff8a1a, 8], [0xd8302a, 6], [0xf6e24a, 7], [0x4aa642, 5], [0xe8348c, 5]];
  fr.forEach(([c, n], k) => { const x0 = -1.5 + k * 0.72; pk.add(gb(0.66, 0.2, 0.95, x0, 1.12, 0.1, 0, -0.2), 0xc8884a); for (let i = 0; i < n; i++) pk.add(gsp(0.13, x0 + (r() - 0.5) * 0.4, 1.3 + (i % 3) * 0.1, 0.1 + (r() - 0.5) * 0.5, 1, 1, 1, 6), c); });
  for (let i = 0; i < 3; i++) pk.add(gsp(0.32, -1.2 + i * 0.8, 0.44 + 0.0, 1.0, 1, 0.85, 1.1, 8), 0x2f8a3a);
  pk.add(gcy(0.16, 0.16, 0.45, 7, 1.5, 1.35, 0.5), 0xd8a21a); pk.add(gco(0.15, 0.4, 5, 1.5, 1.77, 0.5), 0x2f8a3a);
  pk.build(g);
  Bx(g, 4.1, 0.07, 1.9, mat('s6rj_stripeGreen'), 0, 2.66, 0.1, 1).rotation.x = 0.0;
  Bx(g, 4.1, 0.32, 0.06, C(0xd8302a), 0, 2.4, 1.09, 1);
  sgn(g, 'FRUTAS', 3.4, 0.5, 0, 2.4, 1.13, 0, { bg: '#d81e86', fg: '#fff8e0', border: '#f6e24a' });
  Bx(g, 3.2, 0.05, 0.05, glow(NEO), 0, 2.2, 1.12, 1);
  return size(g, 4, 2, 2.8, [[-1.9, 1.9, -0.5, 0.7, 1.05]]);
}
export function bayBoat() {
  const g = G(), pk = new Pack();
  const hs = new THREE.Shape(); hs.moveTo(-6.5, -1.5); hs.lineTo(-6.5, 1.5); hs.lineTo(-1, 1.9); hs.quadraticCurveTo(3.5, 1.7, 7, 0); hs.quadraticCurveTo(3.5, -1.7, -1, -1.9); hs.lineTo(-6.5, -1.5);
  const hull = new THREE.ExtrudeGeometry(hs, { depth: 0.9, bevelEnabled: false, curveSegments: 6 }); hull.rotateX(-PI / 2);
  pk.add(hull, 0x1f3a8a);
  const up = new THREE.ExtrudeGeometry(hs, { depth: 0.5, bevelEnabled: false, curveSegments: 6 }); up.scale(0.98, 0.98, 1); up.rotateX(-PI / 2); up.translate(0, 0.9, 0); pk.add(up, 0xf8f6ee);
  pk.add(gb(10, 0.04, 0.5, 0, 0.88, 0), 0xd8302a);
  pk.add(new THREE.ExtrudeGeometry(hs, { depth: 0.04, bevelEnabled: false, curveSegments: 6 }).scale(0.9, 0.9, 1).rotateX(-PI / 2).translate(0, 1.42, 0), 0xc8884a);
  pk.add(gb(3.4, 1.0, 2.0, -2.2, 1.9, 0), 0xf8f6ee); pk.add(gb(3.6, 0.12, 2.2, -2.2, 2.46, 0), 0x1f3a8a);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) pk.add(gb(0.7, 0.4, 0.05, -3.2 + i * 1.0, 2.0, s * 1.03), 0x2a4a68);
  pk.add(gcy(0.09, 0.12, 3.6, 6, 0.8, 3.2, 0), 0xdddddd); pk.add(gcy(0.05, 0.05, 3.4, 5, -1.7, 2.3, 0, 0, 0, PI / 2 - 0.05), 0xdddddd);
  pk.add(gcy(0.03, 0.03, 0.5, 4, 0.8, 5.0, 0), 0xdddddd);
  pk.add(triG([6.4, 1.5, 0], [0.9, 1.6, 0], [0.9, 4.6, 0]), dbl(0xf6c814)); pk.add(triG([0.7, 1.9, 0.02], [-4.1, 2.0, 0.02], [0.7, 4.9, 0.02]), dbl(0xfdfcf6));
  pk.add(triG([0.7, 3.0, 0.03], [-1.1, 2.0, 0.03], [0.7, 2.0, 0.03]), dbl(0x1fa04a));
  pk.add(triG([0.85, 5.0, 0], [0.85, 4.65, 0], [1.6, 4.82, 0]), dbl(0x1fa04a));
  pk.add(gb(1.6, 0.8, 0.3, -6.2, 1.9, 0), 0x666a72);
  pk.build(g);
  return size(g, 14, 4, 5, [], { solid: false });
}
