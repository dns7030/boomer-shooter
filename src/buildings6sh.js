// Shanghai: the Bund (neoclassical + art-deco banks), Nanjing Road (shikumen, shophouses, department store, pailou),
// street props, river boats and the far Pudong skyline.  Bright, slightly hazy sunny day.
// Same conventions as the other building files: origin = footprint centre on the ground, front faces local +Z,
// group.userData = { w, d, h[, cols] }.  Textures are prefixed s6sh_.
import * as THREE from 'three';
import { mat, color, boxT, cylT, decal, gableRoof } from './geo.js';
import { slab, tiledPlane, sign } from './buildings2.js';
import { addPainters, mulberry, tex } from './textures.js';
import { hall } from './interiors.js';

const G = () => new THREE.Group();
const size = (g, w, d, h, cols) => { g.userData = { ...g.userData, w, d, h }; if (cols) g.userData.cols = cols; return g; };
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const pick = (r, a) => a[(r() * a.length) | 0];
const C = (hex, e) => color(hex, e === undefined ? {} : { emissive: e });
const glow = (hex) => color(hex, { emissive: hex });
const _m = {};
const keyed = (k, f) => _m[k] || (_m[k] = f());
const shiny = (hex, sh = 60) => keyed(`p${hex}_${sh}`, () => new THREE.MeshPhongMaterial({ color: hex, shininess: sh, specular: 0x666666 }));
const glassM = (hex, op) => keyed(`g${hex}_${op}`, () => new THREE.MeshLambertMaterial({ color: hex, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
const flatMap = (name) => keyed(`f${name}`, () => new THREE.MeshBasicMaterial({ map: tex(name) }));
const dbl = (hex) => keyed(`d${hex}`, () => new THREE.MeshLambertMaterial({ color: hex, side: THREE.DoubleSide }));
const dblE = (hex, em) => keyed(`de${hex}_${em}`, () => new THREE.MeshLambertMaterial({ color: hex, emissive: em, side: THREE.DoubleSide }));
const MD = (n) => mat(n, { double: true });

// ---- scene-building helpers (all add to g and return the mesh) ----
const Bx = (g, w, h, d, m, x, y, z, tile = 3) => { const b = boxT(w, h, d, m, tile); b.position.set(x, y, z); g.add(b); return b; };
const Cy = (g, rt, rb, h, n, m, x, y, z, tile = 3) => { const b = cylT(rt, rb, h, n, m, tile); b.position.set(x, y, z); g.add(b); return b; };
const Ms = (g, geo, m, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); g.add(o); return o;
};
const SPH = (r = 1, a = 12, b = 8) => new THREE.SphereGeometry(r, a, b);
const Sg = (g, m, x, y, z, sx, sy = sx, sz = sx, n = 10) => Ms(g, SPH(1, n, Math.max(4, Math.round(n * 0.6))), m, x, y, z, sx, sy, sz);
const win = (g, w, h, x, y, z, ry = 0, o = {}) => { const d = decal('window', w, h, x, y, z, { c: '#d8d2c0', ...o }); d.rotation.y = ry; g.add(d); return d; };
const door = (g, w, h, x, y, z, ry = 0, c = '#4a3a2a') => { const d = decal('door', w, h, x, y, z, { c }); d.rotation.y = ry; g.add(d); return d; };
const sgn = (g, text, w, h, x, y, z, ry = 0, o = {}) => { const s = sign(text, w, h, o); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; };
// stacked wall block (sides textured, roof plain), from y0 up by h
const Wb = (g, w, h, d, side, roof, x, y0, z, tile = 8) => { const b = slab(w, h, d, side, roof, tile); b.position.set(x, y0 + h / 2, z); g.add(b); return b; };

function rod(a, b, r, seg = 5) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const geo = new THREE.CylinderGeometry(r, r, len, seg, 1, false);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  geo.translate(A.x + d.x * len / 2, A.y + d.y * len / 2, A.z + d.z * len / 2);
  return geo;
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
function xf(geo, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  const gg = geo.index ? geo.toNonIndexed() : geo.clone(); gg.applyMatrix4(m); return gg;
}
const mergedMesh = (g, geos, m) => { const me = new THREE.Mesh(merge(geos), m); g.add(me); return me; };
const rods = (g, list, r, m, seg = 5) => mergedMesh(g, list.map(([a, b]) => rod(a, b, r, seg)), m);
const boxes = (g, list, m) => mergedMesh(g, list.map(([w, h, d, x, y, z]) => xf(new THREE.BoxGeometry(w, h, d), x, y, z)), m);
const flatten = (geo) => { const n = geo.index ? geo.toNonIndexed() : geo; n.computeVertexNormals(); return n; };
const scaleUV = (geo, su, sv) => { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * su, u.getY(i) * sv); return geo; };

// four-sided pyramid with a rectangular base (w x d), base at y=0
function pyrGeo(w, d, h, tile = 4) {
  const geo = new THREE.ConeGeometry(w / 2 * Math.SQRT2, h, 4, 1, true);
  geo.rotateY(Math.PI / 4); geo.scale(1, 1, d / w); geo.translate(0, h / 2, 0);
  const f = flatten(geo); return scaleUV(f, (w + d) / tile, Math.hypot(w / 2, h) / tile);
}
// concave "Chinese" roof: 4 sided lathe with a swept-up lip, base at y=0
function chinaRoofGeo(w, d, h, tile = 4) {
  const pts = [], n = 8;
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector2(Math.max(0.001, (w / 2 * Math.SQRT2) * Math.pow(1 - t, 1.7)), h * t + (t < 0.25 ? 0.45 * (1 - t * 4) : 0))); }
  const geo = new THREE.LatheGeometry(pts, 4); geo.rotateY(Math.PI / 4); geo.scale(1, 1, d / w);
  const f = flatten(geo); return scaleUV(f, (w + d) / tile, (h * 1.3) / tile);
}
// lathe dome (n sides), profile function r(t) in 0..1 -> fraction of R
function domeGeo(R_, h, n, fn = (t) => Math.cos(t * Math.PI / 2) ** 0.7, tile = 4) {
  const pts = []; const k = 10;
  for (let i = 0; i <= k; i++) { const t = i / k; pts.push(new THREE.Vector2(Math.max(0.001, R_ * fn(t)), h * t)); }
  return scaleUV(flatten(new THREE.LatheGeometry(pts, n)), n / 4, h / tile);
}
// triangular pediment, front face +z
function pedi(w, rise, dep, m, tile = 6) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, rise); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: dep, bevelEnabled: false }); geo.translate(0, 0, -dep / 2);
  scaleUV(geo, 1 / tile, 1 / tile);
  return new THREE.Mesh(geo, m);
}

// merged red paper lanterns: [[x,y,z,scale], ...]  (red body glows, gold caps)
const LANT_RED = () => color(0xd8201c, { emissive: 0x8a1410 });
const LANT_GOLD = () => color(0xe0b030, { emissive: 0x403008 });
function lanterns(g, list) {
  const body = [], caps = [];
  for (const [x, y, z, s = 1] of list) {
    body.push(xf(SPH(0.3, 8, 6), x, y, z, s, s * 1.12, s));
    caps.push(xf(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 6), x, y + 0.34 * s, z, s));
    caps.push(xf(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 6), x, y - 0.34 * s, z, s));
    caps.push(xf(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 4), x, y - 0.58 * s, z, s));
  }
  mergedMesh(g, body, LANT_RED()); mergedMesh(g, caps, LANT_GOLD());
}
// air conditioners on a +z wall: [[x,y,z],...] (z = wall surface)
function acUnits(g, list) {
  const bodies = [], grills = [];
  for (const [x, y, z] of list) { bodies.push(xf(new THREE.BoxGeometry(0.95, 0.6, 0.45), x, y, z + 0.25)); grills.push(xf(new THREE.BoxGeometry(0.6, 0.4, 0.06), x - 0.1, y, z + 0.5)); }
  mergedMesh(g, bodies, C(0xd2d6d6)); mergedMesh(g, grills, C(0x2c3034));
}
// hanging laundry on bamboo poles projecting from a +z wall at (x, y, z0), pole length L
function laundry(g, x, y, z0, L, seed) {
  const r = mulberry(seed), cols = [0xe8e0d0, 0x3a6ab0, 0xd04a4a, 0xe8c840, 0x58a868, 0xd890b8];
  g.add(Object.assign(new THREE.Mesh(rod([x, y, z0], [x, y + 0.35, z0 + L], 0.045, 4), C(0xb89858)), {}));
  const byCol = {};
  const n = 3 + ((r() * 2) | 0);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.7) / (n + 0.4), c = pick(r, cols), w = 0.45 + r() * 0.3, h = 0.7 + r() * 0.5;
    (byCol[c] = byCol[c] || []).push(xf(new THREE.PlaneGeometry(w, h), x + 0.02, y + 0.35 * t - h / 2 - 0.02, z0 + L * t, 1, 1, 1, 0, Math.PI / 2, 0));
  }
  for (const c of Object.keys(byCol)) mergedMesh(g, byCol[c], dbl(+c));
}
// vertical neon sign box perpendicular to a +z wall (faces +-x)
function neonBox(g, name, w, h, x, y, z, ry = 0) {
  const fm = flatMap(name), dk = C(0x20242a);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, h, w), [fm, fm, dk, dk, dk, dk]);
  b.position.set(x, y, z); b.rotation.y = ry; b.userData.keep = true; g.add(b); return b;
}

// ---------- textures ----------
const noise = (g, w, h, r, n, cols, s = 1) => { for (let i = 0; i < n; i++) R(g, (r() * w) | 0, (r() * h) | 0, s, s, pick(r, cols)); };
function blocks(g, base, seed, row = 8, tone = 0.12) {
  const r = mulberry(seed); R(g, 0, 0, 64, 64, base);
  for (let y = 0; y < 64; y += row) { R(g, 0, y, 64, 1, `rgba(0,0,0,${tone})`); for (let x = ((y / row) % 2) * (row * 1); x < 64; x += row * 2) R(g, x, y, 1, row, `rgba(0,0,0,${tone * 0.8})`); }
  noise(g, 64, 64, r, 140, ['rgba(255,255,255,.08)', 'rgba(0,0,0,.07)']);
}
// 2x2 cells (32px each = 4 m): classical window with surround
function classicWin(g, x, y, frame, glass, lit) {
  R(g, x + 8, y + 5, 16, 24, frame); R(g, x + 10, y + 8, 12, 20, lit ? '#f1d98a' : glass); R(g, x + 15, y + 8, 2, 20, frame); R(g, x + 10, y + 15, 12, 1, frame);
  R(g, x + 6, y + 3, 20, 3, '#d9d5cb'); R(g, x + 7, y + 28, 18, 2, '#d9d5cb'); if (!lit) R(g, x + 11, y + 9, 2, 8, 'rgba(255,255,255,.14)');
}
function archWin(g, x, y, frame, glass) {
  R(g, x + 7, y + 10, 18, 20, frame); R(g, x + 9, y + 12, 14, 18, glass); g.fillStyle = frame; g.beginPath(); g.arc(x + 16, y + 11, 9, Math.PI, 0); g.fill();
  g.fillStyle = glass; g.beginPath(); g.arc(x + 16, y + 12, 7, Math.PI, 0); g.fill(); R(g, x + 15, y + 5, 2, 25, frame); R(g, x + 9, y + 18, 14, 1, frame);
  R(g, x + 12, y + 14, 2, 8, 'rgba(255,255,255,.14)'); R(g, x + 5, y + 30, 22, 2, '#d9d5cb');
}
function shopTex(g, base, shut, seed) {
  const r = mulberry(seed); R(g, 0, 0, 64, 64, base);
  noise(g, 64, 64, r, 120, ['rgba(0,0,0,.07)', 'rgba(255,255,255,.1)']);
  R(g, 0, 60, 64, 4, 'rgba(0,0,0,.18)'); R(g, 0, 0, 64, 3, 'rgba(255,255,255,.3)');
  for (const x of [8, 40]) {        // two storeys per tile? no: one storey of 4 m = 32px -> two bays across 64px
    for (const y of [0, 32]) {
      R(g, x + 1, y + 6, 16, 22, '#f2eee0'); R(g, x + 3, y + 8, 12, 18, '#27343e'); R(g, x + 8, y + 8, 2, 18, '#f2eee0'); R(g, x + 3, y + 16, 12, 1, '#f2eee0');
      R(g, x - 3, y + 6, 4, 22, shut); R(g, x + 15, y + 6, 4, 22, shut); R(g, x - 3, y + 11, 4, 1, 'rgba(0,0,0,.25)'); R(g, x + 15, y + 11, 4, 1, 'rgba(0,0,0,.25)');
      R(g, x - 1, y + 28, 22, 2, '#bdb8a8'); R(g, x + 4, y + 9, 2, 6, 'rgba(255,255,255,.14)');
    }
  }
}
function glassTex(g, base, hi, line, seed, lit = 0.05) {
  const r = mulberry(seed); R(g, 0, 0, 64, 64, line);
  for (let cy = 0; cy < 8; cy++) for (let cx = 0; cx < 4; cx++) {
    const x = cx * 16, y = cy * 8, l = r() < lit;
    R(g, x + 1, y + 1, 14, 6, l ? '#e8d890' : base); R(g, x + 1, y + 1, 14, 2, l ? '#f4e8b0' : hi);
  }
  R(g, 0, 0, 1, 64, 'rgba(0,0,0,.3)');
}
const stripes = (g, w, h, a, b, n) => { const s = w / n; for (let i = 0; i < n; i++) R(g, i * s, 0, s, h, i % 2 ? b : a); R(g, 0, h - 4, w, 4, 'rgba(0,0,0,.2)'); };
function neon(g, w, h, kind, seed) {
  const r = mulberry(seed); R(g, 0, 0, w, h, '#0d0f16');
  const cols = [['#ff2d95', '#38e8ff', '#ffe83a'], ['#ff7a1a', '#7cffb0', '#ff3a3a'], ['#38e8ff', '#ff2d95', '#a45bff'], ['#ffe83a', '#ff3a3a', '#38e8ff']][kind % 4];
  g.lineWidth = 2; g.strokeStyle = cols[0]; g.strokeRect(2, 2, w - 4, h - 4); g.strokeStyle = cols[1]; g.strokeRect(5, 5, w - 10, h - 10);
  let y = 10;
  const block = (k) => {
    g.fillStyle = cols[k % 3]; g.strokeStyle = cols[k % 3];
    const c = w / 2, t = k % 5;
    if (t === 0) { g.beginPath(); g.arc(c, y + 9, 8, 0, 6.28); g.lineWidth = 3; g.stroke(); g.beginPath(); g.arc(c, y + 9, 3, 0, 6.28); g.fill(); y += 22; }
    else if (t === 1) { for (let i = 0; i < 3; i++) R(g, 8, y + i * 5, w - 16, 3, cols[(k + i) % 3]); y += 18; }
    else if (t === 2) { g.beginPath(); g.moveTo(c, y); g.lineTo(c + 9, y + 10); g.lineTo(c + 3, y + 10); g.lineTo(c + 3, y + 22); g.lineTo(c - 3, y + 22); g.lineTo(c - 3, y + 10); g.lineTo(c - 9, y + 10); g.closePath(); g.fill(); y += 26; }
    else if (t === 3) { g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 6; i++) g.lineTo(i % 2 ? 9 : w - 9, y + i * 4); g.stroke(); y += 24; }
    else { g.beginPath(); for (let j = 0; j < 10; j++) { const a = j * 0.628 - 1.57, rr = j % 2 ? 4 : 9; g.lineTo(c + Math.cos(a) * rr, y + 10 + Math.sin(a) * rr); } g.closePath(); g.fill(); y += 24; }
  };
  let k = kind;
  while (y < h - 30) { block(k++); }
  const word = ['BAR', 'HOTEL', 'TEA', 'DISCO', 'CAFE'][(kind + ((r() * 2) | 0)) % 5];
  g.fillStyle = cols[2]; g.font = `bold ${Math.min(14, (w - 8) / 1.5)}px Arial, Helvetica, sans-serif`; g.textAlign = 'center';
  let ty = y + 12; for (const ch of word) { if (ty < h - 6) g.fillText(ch, w / 2, ty); ty += 13; }
}
function foliageTex(g, w, h, seed, pal) {
  const r = mulberry(seed); R(g, 0, 0, w, h, pal[0]);
  for (let i = 0; i < 160; i++) R(g, (r() * w) | 0, (r() * h) | 0, 2 + ((r() * 3) | 0), 2, pick(r, pal));
}

addPainters({
  s6sh_gran(g) { blocks(g, '#a39f98', 601); for (const cy of [0, 1]) for (const cx of [0, 1]) classicWin(g, cx * 32, cy * 32, '#c4c0b6', '#2a3946', false); R(g, 0, 31, 64, 1, 'rgba(0,0,0,.2)'); R(g, 0, 63, 64, 1, 'rgba(0,0,0,.2)'); },
  s6sh_granLit(g) { blocks(g, '#a39f98', 602); for (const cy of [0, 1]) for (const cx of [0, 1]) classicWin(g, cx * 32, cy * 32, '#c4c0b6', '#2a3946', (cx + cy) % 2 === 0 && (cy === 0)); },
  s6sh_granRust(g) {       // heavy rusticated base with arched windows (2 bays, 2 floors)
    blocks(g, '#948f88', 603, 4, 0.2); for (const cy of [0, 1]) for (const cx of [0, 1]) archWin(g, cx * 32, cy * 32, '#bdb8ae', '#1e2a35'); R(g, 0, 31, 64, 2, 'rgba(0,0,0,.25)');
  },
  s6sh_granPlain(g) { blocks(g, '#aaa69e', 604); R(g, 0, 31, 64, 1, 'rgba(0,0,0,.18)'); },
  s6sh_decoOchre(g) {      // art-deco sandstone: piers + vertical window pairs, 2 bays x 2 floors
    const r = mulberry(605); R(g, 0, 0, 64, 64, '#c7ab7f'); noise(g, 64, 64, r, 200, ['rgba(255,240,200,.1)', 'rgba(80,50,20,.08)']);
    for (const x of [0, 32]) { R(g, x, 0, 4, 64, '#dcc79f'); R(g, x + 28, 0, 4, 64, '#dcc79f'); }
    for (const cy of [0, 1]) for (const cx of [0, 1]) { const x = cx * 32, y = cy * 32; R(g, x + 6, y + 5, 20, 22, '#e6d6b2'); R(g, x + 8, y + 7, 7, 18, r() < 0.1 ? '#f0d890' : '#27323d'); R(g, x + 17, y + 7, 7, 18, '#27323d'); R(g, x + 6, y + 28, 20, 3, '#8a6e44'); }
    R(g, 0, 31, 64, 1, 'rgba(0,0,0,.25)'); R(g, 0, 63, 64, 1, 'rgba(0,0,0,.25)');
  },
  s6sh_decoCream(g) {      // department-store cream tile with bronze window columns
    const r = mulberry(606); R(g, 0, 0, 64, 64, '#e6dcc8'); noise(g, 64, 64, r, 140, ['rgba(120,100,70,.08)', 'rgba(255,255,255,.2)']);
    for (const cy of [0, 1]) for (const cx of [0, 1]) { const x = cx * 32, y = cy * 32; R(g, x + 4, y + 5, 24, 22, '#cdbf9f'); for (let i = 0; i < 3; i++) { R(g, x + 6 + i * 7.5, y + 7, 5, 18, r() < 0.08 ? '#f0d890' : '#2e4452'); R(g, x + 6 + i * 7.5, y + 7, 1, 18, 'rgba(255,255,255,.2)'); } R(g, x + 3, y + 27, 26, 3, '#b8a888'); R(g, x + 2, y + 3, 28, 2, '#f4ecdc'); }
    for (const x of [0, 31]) R(g, x, 0, 2, 64, '#f2eadb');
    R(g, 0, 31, 64, 1, 'rgba(0,0,0,.2)');
  },
  s6sh_decoGrey(g) {       // pale grey-green stone, narrow tall windows
    const r = mulberry(607); R(g, 0, 0, 64, 64, '#b6b9ae'); noise(g, 64, 64, r, 160, ['rgba(255,255,255,.12)', 'rgba(40,50,40,.09)']);
    for (const cy of [0, 1]) for (const cx of [0, 1]) { const x = cx * 32, y = cy * 32; R(g, x + 3, y + 3, 4, 26, '#d4d6cb'); R(g, x + 25, y + 3, 4, 26, '#d4d6cb'); R(g, x + 10, y + 4, 12, 24, '#cfd1c6'); R(g, x + 12, y + 6, 8, 20, r() < 0.07 ? '#f0d890' : '#2a3a46'); R(g, x + 15, y + 6, 2, 20, '#cfd1c6'); }
    R(g, 0, 31, 64, 1, 'rgba(0,0,0,.2)');
  },
  s6sh_relief(g) {         // frieze: repeating key pattern in relief
    R(g, 0, 0, 64, 64, '#b9b5a8'); for (let y = 0; y < 64; y += 16) { R(g, 0, y, 64, 2, '#d8d4c8'); R(g, 0, y + 14, 64, 2, '#8c887c'); for (let x = 0; x < 64; x += 16) { R(g, x + 3, y + 4, 10, 2, '#8c887c'); R(g, x + 3, y + 4, 2, 8, '#8c887c'); R(g, x + 7, y + 8, 6, 2, '#d8d4c8'); R(g, x + 11, y + 6, 2, 6, '#8c887c'); } }
  },
  s6sh_brick(g) {          // shikumen blue-grey/red brick with white pointing
    const r = mulberry(608); R(g, 0, 0, 64, 64, '#d8d0c4');
    for (let row = 0; row < 8; row++) { const off = row % 2 ? 8 : 0; for (let bx = -8; bx < 64; bx += 16) R(g, bx + off + 1, row * 8 + 1, 14, 6, pick(r, ['#a8452f', '#b24e34', '#9a3e2a', '#b85a3c', '#a04230'])); }
    noise(g, 64, 64, r, 100, ['rgba(0,0,0,.12)', 'rgba(255,255,255,.08)']);
  },
  s6sh_stoneGate(g) { blocks(g, '#e4e0d4', 609, 8, 0.1); },
  s6sh_tile(g) {           // grey clay roof tiles, ridges run down the slope
    const r = mulberry(610); R(g, 0, 0, 64, 64, '#5b524c');
    for (let x = 0; x < 64; x += 4) { R(g, x, 0, 2, 64, '#6e635b'); R(g, x + 2, 0, 1, 64, '#3c3632'); }
    for (let y = 0; y < 64; y += 8) R(g, 0, y, 64, 1, 'rgba(0,0,0,.25)'); noise(g, 64, 64, r, 100, ['rgba(255,255,255,.08)', 'rgba(0,0,0,.14)']);
  },
  s6sh_tileRed(g) {
    const r = mulberry(611); R(g, 0, 0, 64, 64, '#a4502f');
    for (let x = 0; x < 64; x += 4) { R(g, x, 0, 2, 64, '#bb633d'); R(g, x + 2, 0, 1, 64, '#74361f'); }
    for (let y = 0; y < 64; y += 8) R(g, 0, y, 64, 1, 'rgba(0,0,0,.25)'); noise(g, 64, 64, r, 100, ['rgba(255,255,255,.1)', 'rgba(0,0,0,.14)']);
  },
  s6sh_tileGreen(g) {      // glazed green tile (pailou)
    const r = mulberry(612); R(g, 0, 0, 64, 64, '#2f7d5e');
    for (let x = 0; x < 64; x += 4) { R(g, x, 0, 2, 64, '#3f9a74'); R(g, x + 2, 0, 1, 64, '#1d5640'); }
    for (let y = 0; y < 64; y += 8) R(g, 0, y, 64, 1, 'rgba(0,0,0,.25)'); noise(g, 64, 64, r, 60, ['rgba(255,255,255,.14)']);
  },
  s6sh_copper(g) {         // verdigris standing-seam copper
    const r = mulberry(613); R(g, 0, 0, 64, 64, '#6fae96');
    for (let x = 0; x < 64; x += 8) { R(g, x, 0, 1, 64, '#3f7d68'); R(g, x + 1, 0, 1, 64, '#92cdb4'); }
    noise(g, 64, 64, r, 200, ['rgba(255,255,255,.12)', 'rgba(20,70,50,.14)']);
    for (let y = 6; y < 64; y += 14) R(g, 0, y, 64, 1, 'rgba(30,80,60,.25)');
  },
  s6sh_shopA: (g) => shopTex(g, '#e6d79a', '#3f7d58', 620), s6sh_shopB: (g) => shopTex(g, '#dc9f86', '#2d5a78', 621),
  s6sh_shopC: (g) => shopTex(g, '#a9cdb6', '#8a3a30', 622), s6sh_shopD: (g) => shopTex(g, '#a8bfd2', '#4a6a40', 623),
  s6sh_shopE: (g) => shopTex(g, '#dcd9cc', '#6a4a8a', 624), s6sh_shopF: (g) => shopTex(g, '#d4bd8c', '#a43c3c', 625),
  s6sh_shopfront(g) {      // lit ground-floor shop (2 shops across, 4 m tall cell = 32 px) with fascia
    const r = mulberry(626); R(g, 0, 0, 64, 64, '#3a3532');
    for (const x of [0, 32]) for (const y of [0, 32]) {
      R(g, x + 2, y + 9, 28, 20, '#f6e6b8'); R(g, x + 2, y + 9, 28, 3, '#fff6d6');
      for (let i = 0; i < 9; i++) R(g, x + 3 + ((r() * 24) | 0), y + 14 + ((r() * 12) | 0), 3, 3, pick(r, ['#d8473a', '#3a8ad8', '#e8b020', '#4aa860', '#d86aa8']));
      R(g, x + 2, y + 27, 28, 2, '#8a7a5a'); R(g, x + 15, y + 9, 2, 20, '#3a3532'); R(g, x, y + 2, 32, 6, pick(r, ['#8a2a22', '#1f5a46', '#2a3f6a', '#6a4a18']));
    }
  },
  s6sh_awnA: (g) => stripes(g, 32, 32, '#d8372c', '#f4efe0', 8), s6sh_awnB: (g) => stripes(g, 32, 32, '#f0c030', '#f4efe0', 8),
  s6sh_awnC: (g) => stripes(g, 32, 32, '#1f8a82', '#f4efe0', 8), s6sh_awnD: (g) => stripes(g, 32, 32, '#e8782a', '#f4efe0', 8),
  s6sh_neon0: (g, w, h) => neon(g, w, h, 0, 630), s6sh_neon1: (g, w, h) => neon(g, w, h, 1, 631),
  s6sh_neon2: (g, w, h) => neon(g, w, h, 2, 632), s6sh_neon3: (g, w, h) => neon(g, w, h, 3, 633),
  s6sh_led(g, w, h) {      // LED board: colourful geometric animation frame
    R(g, 0, 0, w, h, '#06070c'); const r = mulberry(634);
    for (let i = 0; i < 9; i++) { g.fillStyle = pick(r, ['#ff2d95', '#38e8ff', '#ffe83a', '#7cffb0', '#a45bff', '#ff7a1a']); const x = i * w / 9; g.beginPath(); g.moveTo(x, h); g.lineTo(x + 26, 0); g.lineTo(x + 40, 0); g.lineTo(x + 14, h); g.fill(); }
    for (let i = 0; i < 5; i++) { g.strokeStyle = pick(r, ['#fff', '#38e8ff', '#ffe83a']); g.lineWidth = 3; g.beginPath(); g.arc(20 + i * 52 + r() * 10, 12 + r() * 40, 5 + r() * 9, 0, 6.28); g.stroke(); }
    g.fillStyle = '#ffffff'; g.font = 'bold 22px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.fillText('SALE 50', w * 0.5, 40);
    for (let y = 0; y < h; y += 3) R(g, 0, y, w, 1, 'rgba(0,0,0,.28)');
  },
  s6sh_beam(g) {           // red lacquer with gold patterns (pailou)
    R(g, 0, 0, 64, 64, '#a8201c'); for (let x = 0; x < 64; x += 16) { R(g, x + 2, 8, 12, 48, '#c43428'); R(g, x + 5, 12, 6, 6, '#e0b030'); R(g, x + 5, 46, 6, 6, '#e0b030'); R(g, x + 7, 18, 2, 28, '#2a7a68'); }
    R(g, 0, 0, 64, 4, '#2a7a68'); R(g, 0, 60, 64, 4, '#2a7a68'); R(g, 0, 4, 64, 2, '#e0b030'); R(g, 0, 58, 64, 2, '#e0b030');
  },
  s6sh_lacquer(g) { const r = mulberry(635); R(g, 0, 0, 64, 64, '#9a1c18'); for (let x = 0; x < 64; x += 8) R(g, x, 0, 1, 64, 'rgba(0,0,0,.2)'); noise(g, 64, 64, r, 60, ['rgba(255,255,255,.1)']); },
  s6sh_marble(g) {         // black/cream marble checker with gold line
    const r = mulberry(636);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) R(g, x * 32, y * 32, 32, 32, (x + y) % 2 ? '#26262a' : '#eee6d4');
    for (let i = 0; i < 80; i++) R(g, (r() * 64) | 0, (r() * 64) | 0, 1 + ((r() * 5) | 0), 1, r() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.2)');
    R(g, 0, 0, 64, 1, '#c9a24a'); R(g, 0, 32, 64, 1, '#c9a24a'); R(g, 0, 0, 1, 64, '#c9a24a'); R(g, 32, 0, 1, 64, '#c9a24a');
  },
  s6sh_lobbyWall(g) {      // walnut panels with gold inlay, dado + cornice
    const r = mulberry(637); R(g, 0, 0, 64, 64, '#6e4a30'); for (let x = 0; x < 64; x += 16) { R(g, x + 1, 6, 14, 52, '#7e5638'); R(g, x + 3, 8, 10, 48, '#6a4630'); R(g, x + 7, 8, 2, 48, '#c9a24a'); }
    noise(g, 64, 64, r, 140, ['rgba(0,0,0,.12)', 'rgba(255,220,160,.08)']); R(g, 0, 0, 64, 5, '#d8c9a0'); R(g, 0, 5, 64, 1, '#c9a24a'); R(g, 0, 58, 64, 6, '#3c2a1c'); R(g, 0, 57, 64, 1, '#c9a24a');
  },
  s6sh_octCeil(g) {        // coffered ceiling with octagonal coffers and gold bosses
    R(g, 0, 0, 64, 64, '#efe5cc'); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const cx = x * 32 + 16, cy = y * 32 + 16; g.fillStyle = '#d6c9a4'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; g.lineTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14); } g.fill();
      g.fillStyle = '#f6efd8'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; g.lineTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10); } g.fill(); R(g, cx - 2, cy - 2, 4, 4, '#c9a24a');
    }
  },
  s6sh_tram(g, w, h) {     // white trolley side with red band and windows
    R(g, 0, 0, w, h, '#f4f1ea'); R(g, 0, h - 8, w, 8, '#cc2a24'); R(g, 0, h - 10, w, 2, '#e8c860'); R(g, 0, 0, w, 3, '#cc2a24');
    for (let i = 0; i < 7; i++) { const x = 4 + i * 17; R(g, x, 6, 14, 12, '#38505e'); R(g, x + 1, 7, 12, 4, '#6a8c9c'); }
    R(g, w / 2 - 14, 22, 28, 3, '#cc2a24');
  },
  s6sh_glassTeal: (g) => glassTex(g, '#3f6f7c', '#6fa3ae', '#1b2c33', 640),
  s6sh_glassBlue: (g) => glassTex(g, '#35609a', '#6c9ad0', '#17263f', 641),
  s6sh_glassGold: (g) => glassTex(g, '#9a7a3c', '#d0b070', '#3a2c14', 642),
  s6sh_glassGrey: (g) => glassTex(g, '#6c7680', '#a4aeb8', '#2a3036', 643),
  s6sh_silver(g) {         // Jin Mao: ribbed silver-grey louvres
    const r = mulberry(644); R(g, 0, 0, 64, 64, '#aeb6bb'); for (let x = 0; x < 64; x += 4) { R(g, x, 0, 1, 64, '#d2d8dc'); R(g, x + 2, 0, 1, 64, '#7c858a'); }
    for (let y = 0; y < 64; y += 8) R(g, 0, y, 64, 2, '#56606a'); noise(g, 64, 64, r, 80, ['rgba(255,255,255,.2)']);
  },
  s6sh_bark(g) {
    const r = mulberry(645); R(g, 0, 0, 64, 64, '#8a8470');
    for (let i = 0; i < 26; i++) R(g, (r() * 56) | 0, (r() * 56) | 0, 6 + ((r() * 12) | 0), 5 + ((r() * 10) | 0), pick(r, ['#c9c2a4', '#b9b090', '#6a6a52', '#9c9674', '#d6d0b4']));
    for (let i = 0; i < 12; i++) R(g, (r() * 64) | 0, 0, 1, 64, 'rgba(40,36,28,.2)');
  },
  s6sh_leaf: (g, w, h) => foliageTex(g, w, h, 646, ['#6aa04a', '#7cb455', '#5a9040', '#8cc060', '#4c7e38']),
  s6sh_sail(g) {           // junk sail: ochre-red cloth with horizontal battens
    const r = mulberry(647); R(g, 0, 0, 64, 64, '#a8532a'); for (let i = 0; i < 40; i++) R(g, (r() * 60) | 0, (r() * 64) | 0, 2 + ((r() * 8) | 0), 3, pick(r, ['#b8643a', '#984a24', '#c07040']));
    for (let y = 0; y < 64; y += 8) { R(g, 0, y, 64, 1, '#3a2418'); R(g, 0, y + 1, 64, 1, 'rgba(0,0,0,.2)'); }
  },
  s6sh_boatWin(g, w, h) {  // cruise boat deck: row of lit windows (4 m x 2 m tile)
    R(g, 0, 0, w, h, '#f2f0ea'); for (let i = 0; i < 4; i++) { const x = 2 + i * 15; R(g, x, 5, 13, 14, '#6a98b4'); R(g, x + 1, 6, 11, 12, i % 2 ? '#ffe8a0' : '#fff0c0'); R(g, x + 6, 6, 1, 12, '#f2f0ea'); }
    R(g, 0, h - 5, w, 5, '#d8d4c8'); R(g, 0, 0, w, 3, '#d8d4c8');
  },
  s6sh_flute(g) {
    const r = mulberry(649); R(g, 0, 0, 64, 64, '#e6dcc4'); for (let x = 0; x < 64; x += 8) { R(g, x, 0, 1, 64, '#c2b798'); R(g, x + 1, 0, 2, 64, '#f2e9d2'); R(g, x + 5, 0, 1, 64, 'rgba(0,0,0,.08)'); }
    R(g, 0, 0, 64, 2, '#c9a24a'); R(g, 0, 31, 64, 2, '#c9a24a'); noise(g, 64, 64, r, 60, ['rgba(0,0,0,.05)']);
  },
  s6sh_granTower(g) {      // plain stepped-deco stone with fine vertical fluting (no windows)
    const r = mulberry(648); R(g, 0, 0, 64, 64, '#b8b4a6'); for (let x = 0; x < 64; x += 4) { R(g, x, 0, 1, 64, 'rgba(0,0,0,.12)'); R(g, x + 2, 0, 1, 64, 'rgba(255,255,255,.14)'); } noise(g, 64, 64, r, 100, ['rgba(0,0,0,.06)']);
  },
}, {
  s6sh_neon0: [32, 128], s6sh_neon1: [32, 128], s6sh_neon2: [32, 128], s6sh_neon3: [32, 128],
  s6sh_led: [256, 64], s6sh_tram: [128, 32], s6sh_leaf: [32, 32], s6sh_boatWin: [64, 32],
  s6sh_awnA: [32, 32], s6sh_awnB: [32, 32], s6sh_awnC: [32, 32], s6sh_awnD: [32, 32],
});

// =====================================================================
// shared bits for the Bund buildings
// =====================================================================
const ROOF = () => mat('concrete');
const STONE = () => mat('s6sh_stoneGate');
const BRONZE = () => shiny(0x8a6a34, 70);
const cornice = (g, w, d, x, y, z, m = STONE()) => { Bx(g, w + 1.2, 0.6, d + 1.2, m, x, y + 0.3, z, 4); Bx(g, w + 0.5, 0.5, d + 0.5, m, x, y - 0.25, z, 4); };
function lion(g, x, z, ry) {   // small bronze lion on a plinth, facing +z of its own frame
  const l = G(), br = BRONZE();
  Bx(l, 1.6, 1.0, 2.6, mat('granite'), 0, 0.5, 0, 2);
  Sg(l, br, 0, 1.75, -0.2, 0.55, 0.5, 0.95, 8);
  Sg(l, br, 0, 2.05, 0.55, 0.5, 0.55, 0.5, 8);
  Sg(l, br, 0, 2.2, 0.95, 0.34, 0.34, 0.32, 8);
  for (const sx of [-1, 1]) { Cy(l, 0.12, 0.14, 0.8, 5, br, sx * 0.3, 1.4, 0.7, 1); Cy(l, 0.12, 0.13, 0.7, 5, br, sx * 0.3, 1.35, -0.8, 1); }
  Cy(l, 0.05, 0.05, 0.9, 4, br, 0, 1.7, -1.35, 1).rotation.x = 0.7;
  l.position.set(x, 0, z); l.rotation.y = ry; g.add(l);
}
// Greek/Roman style columns in a row along x at depth z (merged mesh): xs, base y, height, radius
function colRow(g, xs, z, y0, h, r, m, capM) {
  for (const x of xs) {
    Cy(g, r * 0.9, r, h, 12, m, x, y0 + h / 2, z, 3);
    Bx(g, r * 2.5, 0.45, r * 2.5, capM, x, y0 + 0.22, z, 2);
    Bx(g, r * 2.7, 0.65, r * 2.7, capM, x, y0 + h - 0.32, z, 2);
  }
}
const BG = (g, hex, w, h, d, x, y, z) => Bx(g, w, h, d, C(hex), x, y, z, 2);

// =====================================================================
// 1. HSBC-style bank: grey granite, columned portico, octagonal copper dome
// =====================================================================
export function hsbcBank() {
  const g = G(), BZ = -3, roof = ROOF(), GR = mat('s6sh_gran'), GB = mat('s6sh_granRust'), ST = STONE(), COP = MD('s6sh_copper');
  Wb(g, 44, 8, 26, GB, roof, 0, 0, BZ);
  Bx(g, 44.6, 0.5, 26.6, ST, 0, 8.25, BZ, 4);
  Wb(g, 43.2, 16, 25.2, GR, roof, 0, 8.5, BZ);          // 8.5 .. 24.5
  cornice(g, 43.2, 25.2, 0, 25, BZ);
  Wb(g, 41.5, 2, 23.5, mat('s6sh_granPlain'), roof, 0, 25.2, BZ, 6);
  // octagonal drum + copper dome + lantern
  const ry = Math.PI / 8;
  Cy(g, 9.6, 9.6, 4, 8, GR, 0, 29.2, BZ, 8).rotation.y = ry;
  const rim = Cy(g, 10.2, 10.2, 0.5, 8, ST, 0, 31.45, BZ, 4); rim.rotation.y = ry;
  const dome = Ms(g, domeGeo(9.4, 6.2, 8), COP, 0, 31.7, BZ); dome.rotation.y = ry;
  Cy(g, 1.5, 1.7, 2.2, 8, ST, 0, 38.0, BZ, 4);
  Ms(g, domeGeo(1.8, 1.4, 8), COP, 0, 39.1, BZ);
  Cy(g, 0.03, 0.12, 1.6, 4, C(0xd8b040), 0, 40.4, BZ, 1);
  // portico
  const plat = Bx(g, 27, 1.2, 8, ST, 0, 0.6, 8, 4); plat.material = [ST, ST, mat('granite'), ST, ST, ST];
  Bx(g, 28, 0.6, 0.8, ST, 0, 0.3, 11.6, 4);
  colRow(g, [-10, -6, -2, 2, 6, 10], 9.6, 1.2, 16, 0.85, ST, ST);
  Bx(g, 26.6, 1.8, 6.6, ST, 0, 18.1, 7.7, 4);
  const pd = pedi(26.6, 3.2, 6.4, ST); pd.position.set(0, 19, 7.7); g.add(pd);
  Bx(g, 5, 2.6, 0.2, C(0x39434c), 0, 20.0, 10.85, 1);   // tympanum recess
  door(g, 4, 6, 0, 4.2, 4.12, 0, '#3a2a1a');
  sgn(g, 'GRAND BANK', 7, 0.9, 0, 11.4, 4.12, 0, { bg: '#2a3a30', fg: '#e8d08a', border: '#c9a24a' });
  lion(g, -17.5, 14.3, 0); lion(g, 17.5, 14.3, 0);   // out in front of the portico steps, clear of the building
  for (const x of [-18, 18]) { win(g, 2, 3.2, x, 4.3, 4.08, 0, { c: '#c4c0b6', fixed: true }); }
  const cols = [[-22, 22, -16, 4, 27], [-13.5, 13.5, 4, 12, 1.2], [-6.5, 6.5, -9.5, 3.5, 38]];
  for (const x of [-10, -6, -2, 2, 6, 10]) cols.push([x - 1, x + 1, 8.6, 10.6, 19]);
  cols.push([-18.4, -16.6, 12.9, 15.7, 3], [16.6, 18.4, 12.9, 15.7, 3]);
  return size(g, 44, 32, 42, cols);
}

// =====================================================================
// 2. Customs House: granite block with clock tower and stepped crown
// =====================================================================
export function customsHouse() {
  const g = G(), roof = ROOF(), GR = mat('s6sh_gran'), GB = mat('s6sh_granRust'), ST = STONE(), BZ = -2;
  Wb(g, 36, 8, 22, GB, roof, 0, 0, BZ);
  Bx(g, 36.6, 0.5, 22.6, ST, 0, 8.25, BZ, 4);
  Wb(g, 35.2, 12, 21.2, GR, roof, 0, 8.5, BZ);         // to 20.5
  cornice(g, 35.2, 21.2, 0, 21, BZ);
  // tower
  Wb(g, 14, 16, 12, GR, roof, 0, 20.5, -5);            // 20.5 .. 36.5
  cornice(g, 14, 12, 0, 37, -5);
  Wb(g, 12, 9, 10, mat('s6sh_granPlain'), roof, 0, 37.4, -5, 6);   // clock stage 37.4 .. 46.4
  const clk = mat('clock'), dk = C(0x20242a);
  for (const [x, z, ry] of [[0, 0.1, 0], [0, -10.1, Math.PI], [6.1, -5, Math.PI / 2], [-6.1, -5, -Math.PI / 2]]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.4, 20), [dk, clk, clk]);
    c.rotation.set(Math.PI / 2, 0, 0); const holder = G(); holder.add(c); holder.position.set(x, 42, z); holder.rotation.y = ry; g.add(holder);
    Bx(holder, 5.6, 0.4, 0.4, ST, 0, 2.95, 0.05, 2); Bx(holder, 5.6, 0.4, 0.4, ST, 0, -2.95, 0.05, 2);
  }
  cornice(g, 12, 10, 0, 47, -5);
  Wb(g, 10, 3, 8, mat('s6sh_granTower'), roof, 0, 47.4, -5, 6);   // crown 1: 47.4..50.4
  Wb(g, 7.4, 2.6, 5.4, mat('s6sh_granTower'), roof, 0, 50.4, -5, 6);   // crown 2: ..53
  Cy(g, 0.06, 0.14, 1.6, 5, C(0xd8b040), 0, 53.8, -5, 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Bx(g, 0.9, 1.4, 0.9, ST, sx * 4.8, 48.1, -5 + sz * 3.8, 1);
  // portico + door
  const plat = Bx(g, 24, 0.5, 4.2, ST, 0, 0.25, 11, 4);
  Bx(g, 22, 0.5, 3.4, ST, 0, 0.75, 10.6, 4);
  colRow(g, [-7.5, -2.5, 2.5, 7.5], 11.2, 1.0, 11, 0.8, ST, ST);
  Bx(g, 20.8, 1.6, 4.4, ST, 0, 12.8, 10.8, 4);
  const pd = pedi(20.8, 2.4, 4.2, ST); pd.position.set(0, 13.6, 10.8); g.add(pd);
  door(g, 3.4, 5.6, 0, 1.0 + 2.8, 9.08, 0, '#2a2a2a');
  sgn(g, 'CUSTOMS', 5, 0.8, 0, 10.4, 9.08, 0, { bg: '#28303a', fg: '#e8e0c8', border: '#c9a24a' });
  // flag pole on the tower crown
  const cols = [[-18, 18, -13, 9, 21], [-12, 12, 9, 13, 1.0], [-7, 7, -11, 1, 54]];
  for (const x of [-7.5, -2.5, 2.5, 7.5]) cols.push([x - 0.9, x + 0.9, 10.3, 12.1, 13]);
  return size(g, 36, 26, 54, cols);
}

// =====================================================================
// 3. Peace Hotel: art-deco corner hotel, green pyramid roof
// =====================================================================
export function peaceHotel() {
  const g = G(), roof = ROOF(), OC = mat('s6sh_decoOchre'), ST = STONE(), COP = MD('s6sh_copper'), dark = C(0x2a2622), FL = mat('s6sh_granTower');
  Wb(g, 34, 28, 28, OC, roof, 0, 0, 0);
  cornice(g, 34, 28, 0, 28.4, 0, ST);
  Wb(g, 26, 8, 22, OC, roof, 0, 28.6, -1);           // 28.6 .. 36.6
  cornice(g, 26, 22, 0, 37, -1, ST);
  Wb(g, 16, 4, 16, OC, roof, 4, 36.6, -1);            // tower 36.6 .. 40.6
  Bx(g, 17.2, 0.4, 17.2, dark, 4, 40.8, -1, 2);
  Ms(g, pyrGeo(17.2, 17.2, 10.6, 4), COP, 4, 41.0, -1);
  Cy(g, 0.05, 0.16, 1.6, 5, C(0xd8b040), 4, 51.2, -1, 1);
  // little pyramid-roofed corner pavilions on the second setback
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * 11, z = -1 + sz * 9;
    Bx(g, 4, 3, 4, OC, x, 36.6 + 1.5, z, 4);
    Ms(g, pyrGeo(4.8, 4.8, 3, 4), COP, x, 39.7, z);
  }
  // vertical piers (deco fins) on the front of the lower block
  for (const x of [-15.5, -8, 8, 15.5]) Bx(g, 0.9, 27, 0.5, FL, x, 13.5, 14.25, 2);
  // balconies on the front
  for (const y of [12, 24]) {
    Bx(g, 30, 0.3, 1.1, ST, 0, y, 14.55, 4);
    Bx(g, 30, 0.1, 0.1, dark, 0, y + 1.0, 15.0, 1);
    const posts = []; for (let i = 0; i <= 30; i++) posts.push([0.06, 0.9, 0.06, -15 + i, y + 0.6, 15.0]);
    boxes(g, posts, dark);
  }
  // entrance canopy, door and signs
  Bx(g, 10, 0.4, 1.0, dark, 0, 6.2, 14.5, 2);
  Bx(g, 9.6, 0.08, 0.9, glow(0xffe0a0), 0, 6.0, 14.5, 1);
  door(g, 5, 5.2, 0, 2.6, 14.07, 0, '#2a1c10');
  sgn(g, 'PEACE', 4.4, 1.1, 0, 7.4, 14.07, 0, { bg: '#16090a', fg: '#ff5a3c', border: '#ff5a3c' });
  neonBox(g, 's6sh_neon1', 1.0, 6, -14.6, 17, 14.55, 0);
  neonBox(g, 's6sh_neon0', 1.0, 6, 14.6, 17, 14.55, 0);
  for (const x of [-11, 11]) { Bx(g, 4, 5, 0.12, C(0x2a2622), x, 3.0, 14.06, 1); win(g, 3.2, 4.2, x, 3.0, 14.14, 0, { lit: true, fixed: true, c: '#6a4a24' }); }
  return size(g, 34, 30, 52, [[-17, 17, -14, 14, 28.6], [-13, 13, -12, 10, 37], [-4, 12, -9, 7, 52]]);
}

// =====================================================================
// 4. Bund bank (three facades)
// =====================================================================
export function bundBank(opts = {}) {
  const v = (opts.variant | 0) % 3, g = G(), roof = ROOF(), GR = mat('s6sh_gran'), GB = mat('s6sh_granRust'), ST = STONE(), COP = MD('s6sh_copper');
  if (v === 0) {                                  // colonnade + tholos
    Wb(g, 30, 8, 16, GB, roof, 0, 0, -4);
    Bx(g, 30.6, 0.5, 16.6, ST, 0, 8.25, -4, 4);
    Wb(g, 29.4, 16, 15.4, GR, roof, 0, 8.5, -4);
    cornice(g, 29.4, 15.4, 0, 25, -4);
    Wb(g, 28, 2, 14, mat('s6sh_granPlain'), roof, 0, 25.2, -4, 6);
    Cy(g, 4.2, 4.2, 3.4, 10, mat('s6sh_granTower'), 0, 28.9, -4, 6);
    Ms(g, domeGeo(4.4, 3.2, 10), COP, 0, 30.6, -4);
    Cy(g, 0.04, 0.14, 1.6, 4, C(0xd8b040), 0, 34.2, -4, 1);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; Cy(g, 0.14, 0.14, 3.4, 5, ST, Math.sin(a) * 4.3, 28.9, -4 + Math.cos(a) * 4.3, 1); }
    Bx(g, 29, 1.0, 8, ST, 0, 0.5, 8, 4);
    colRow(g, [-12.25, -8.75, -5.25, -1.75, 1.75, 5.25, 8.75, 12.25], 9.4, 1.0, 16, 0.75, ST, ST);
    Bx(g, 29.4, 1.8, 6.6, ST, 0, 17.9, 7.7, 4);
    const pd = pedi(14, 2.6, 6.4, ST); pd.position.set(0, 18.8, 7.7); g.add(pd);
    door(g, 4, 6, 0, 4.0, 4.08, 0, '#3a2a1a');
    sgn(g, 'TRUST BANK', 6, 0.8, 0, 11.0, 4.08, 0, { bg: '#2a2a2e', fg: '#e8d08a', border: '#c9a24a' });
    const cols = [[-15, 15, -12, 4, 27], [-14.5, 14.5, 4, 12, 1.0], [-5, 5, -9, 1, 34]];
    for (const x of [-12.25, -8.75, -5.25, -1.75, 1.75, 5.25, 8.75, 12.25]) cols.push([x - 0.9, x + 0.9, 8.5, 10.3, 18]);
    return size(g, 30, 24, 34, cols);
  }
  if (v === 1) {                                  // arched facade + mansard
    Wb(g, 30, 12, 20, GB, roof, 0, 0, -1);
    Bx(g, 30.6, 0.5, 20.6, ST, 0, 12.25, -1, 4);
    Wb(g, 29.4, 12, 19.4, GR, roof, 0, 12.5, -1);
    for (const x of [-14.5, -7.5, 0, 7.5, 14.5]) Bx(g, 1.0, 11.8, 0.5, ST, x, 18.5, 9.2, 2);
    cornice(g, 29.4, 19.4, 0, 24.5, -1);
    const f = new THREE.CylinderGeometry(17.2 / 2 * Math.SQRT2, 29.6 / 2 * Math.SQRT2, 5, 4, 1, true);
    f.rotateY(Math.PI / 4); f.scale(1, 1, 19.4 / 29.4); f.translate(0, 2.5, 0);
    const fr = scaleUV(flatten(f), 12, 2); Ms(g, fr, COP, 0, 25.0, -1);
    Wb(g, 17, 0.8, 11.2, mat('s6sh_granPlain'), roof, 0, 30, -1, 6);
    Cy(g, 3.0, 3.0, 1.2, 8, ST, 0, 31.4, -1, 4);
    Ms(g, domeGeo(3.1, 1.6, 8), COP, 0, 32.0, -1);
    Cy(g, 0.03, 0.1, 0.8, 4, C(0xd8b040), 0, 33.8, -1, 1);
    for (const x of [-10, -5, 0, 5, 10]) {          // dormers on the front slope
      const z = 7.6, y = 26.4;
      Bx(g, 1.8, 2.0, 1.4, ST, x, y + 1.0, z, 2);
      const gp = pedi(2.4, 0.9, 1.6, COP); gp.position.set(x, y + 2.0, z); g.add(gp);
      win(g, 1.2, 1.5, x, y + 1.0, z + 0.72, 0, { c: '#d8d2c0' });
    }
    Bx(g, 8, 0.4, 2.4, C(0x2a2e32), 0, 5.8, 10.6, 2);
    colRow(g, [-3.5, 3.5], 10.8, 0, 5.8, 0.5, ST, ST);
    door(g, 3.6, 5.2, 0, 2.6, 9.08, 0, '#3a2a1a');
    sgn(g, 'BANK', 4, 0.8, 0, 7.5, 9.1, 0, { bg: '#2a2a2e', fg: '#e8d08a', border: '#c9a24a' });
    const cols = [[-15, 15, -11, 9, 25], [-9, 9, -7, 5, 34]];
    cols.push([-4.1, -2.9, 10.2, 11.4, 6], [2.9, 4.1, 10.2, 11.4, 6]);
    return size(g, 30, 24, 34, cols);
  }
  // v === 2 : stepped deco
  const DG = mat('s6sh_decoGrey'), FIN = mat('s6sh_granTower'), RL = mat('s6sh_relief');
  Wb(g, 30, 12, 22, DG, roof, 0, 0, 0);
  Bx(g, 30.4, 1.4, 22.4, RL, 0, 12.7, 0, 4);
  Wb(g, 24, 12, 18, DG, roof, 0, 13.4, 0);             // to 25.4
  Bx(g, 24.4, 1.2, 18.4, RL, 0, 26.0, 0, 4);
  Wb(g, 16, 6, 12, DG, roof, 0, 26.6, 0);             // to 32.6
  Wb(g, 8, 1.4, 6, FIN, roof, 0, 32.6, 0, 4);
  Cy(g, 0.1, 0.4, 2.6, 4, C(0x9aa0a4), 0, 34.2, 0, 1);
  for (const x of [-9, -6, -3, 3, 6, 9]) { Bx(g, 0.7, 11, 0.7, FIN, x, 6.4, 11.3, 2); Bx(g, 0.7, 11, 0.7, FIN, x * 0.8, 20.4, 9.35, 2); }
  for (const [w, h, y, z] of [[10, 9.4, 4.7, 10.9], [8.4, 8.6, 4.3, 11.15], [6.8, 7.8, 3.9, 11.4]]) Bx(g, w, h, 0.5, w > 9 ? FIN : (w > 8 ? RL : FIN), 0, y, z, 2);
  Bx(g, 5.2, 7.0, 0.2, C(0x1c2024), 0, 3.5, 11.7, 1);
  door(g, 4.6, 6.4, 0, 3.3, 11.85, 0, '#3a2a14');
  Bx(g, 5, 0.2, 0.2, glow(0xffe0a0), 0, 7.2, 11.8, 1);
  sgn(g, 'NATIONAL', 5, 0.8, 0, 9.0, 11.69, 0, { bg: '#1a1e22', fg: '#e8d08a', border: '#c9a24a' });
  return size(g, 30, 24, 34, [[-15, 15, -11, 11.5, 12.5], [-12, 12, -9, 9, 26], [-8, 8, -6, 6, 34]]);
}

// =====================================================================
// 5. Bank of China: art-deco tower, Chinese green pyramid roof, relief bands
// =====================================================================
export function bankOfChina() {
  const g = G(), roof = ROOF(), DG = mat('s6sh_decoGrey'), RL = mat('s6sh_relief'), ST = STONE(), COP = MD('s6sh_copper'), jade = C(0x2f7d5e);
  Wb(g, 28, 20, 20, DG, roof, 0, 0, -1);
  Bx(g, 28.5, 1.6, 20.5, RL, 0, 10.0, -1, 4);
  Bx(g, 28.5, 1.4, 20.5, RL, 0, 19.2, -1, 4);
  cornice(g, 28, 20, 0, 20.4, -1);
  Wb(g, 20, 10, 14, DG, roof, 0, 20.4, -1);          // to 30.4
  Bx(g, 20.5, 1.4, 14.5, RL, 0, 24.0, -1, 4);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Bx(g, 1.2, 10, 1.2, ST, sx * 10, 25.4, -1 + sz * 7, 2);
  Bx(g, 23, 0.6, 17, jade, 0, 30.7, -1, 3);
  Bx(g, 22, 0.5, 16, C(0x1d5a43), 0, 31.25, -1, 3);
  Ms(g, chinaRoofGeo(21, 15, 8, 3), COP, 0, 31.5, -1);
  Cy(g, 0.12, 0.3, 1.0, 5, C(0xd8b040), 0, 39.5, -1, 1); Sg(g, C(0xd8b040), 0, 40.1, -1, 0.35, 0.5, 0.35, 6);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Sg(g, C(0xd8b040), sx * 11.2, 31.2, -1 + sz * 8.2, 0.35, 0.35, 0.35, 5);
  // entrance
  Bx(g, 24, 0.5, 2.4, ST, 0, 0.25, 11, 4); Bx(g, 20, 1.0, 1.4, ST, 0, 0.5, 10.7, 4);
  Bx(g, 7, 9.5, 0.6, mat('s6sh_granTower'), 0, 4.75, 9.3, 3);
  Bx(g, 5.6, 8.2, 0.3, C(0x1c2024), 0, 4.1, 9.65, 1);
  door(g, 4.2, 6.2, 0, 3.1 + 1.0, 9.85, 0, '#3a2a14');
  sgn(g, 'BANK', 4, 0.8, 0, 9.6, 9.86, 0, { bg: '#1d3a2e', fg: '#e8d08a', border: '#c9a24a' });
  for (const x of [-7.5, 7.5]) { Cy(g, 0.8, 0.8, 8.6, 10, mat('s6sh_granTower'), x, 5.0, 9.6, 3); Bx(g, 1.8, 0.5, 1.8, ST, x, 9.5, 9.6, 2); }
  return size(g, 28, 24, 40, [[-14, 14, -11, 9, 20.5], [-12, 12, 9, 12, 1.0], [-10.5, 10.5, -8, 6, 40]]);
}

// =====================================================================
// 6. Bund lobby hall: ENTERABLE art-deco hotel lobby (hall())
//    doors: S (front) at x=0 w9, N (back) at x=0 w9, E and W (sides) at z=0 w7
// =====================================================================
function chandelier(g, x, y, z, r = 2) {
  const gold = shiny(0xd9a62a, 80), warm = color(0xfff0b8, { emissive: 0xffe9a0 }), bulbs = [], gems = [];
  Cy(g, 0.06, 0.06, 2.6, 5, C(0x2a2a2c), x, y + 1.3, z, 1);
  for (let t = 0; t < 3; t++) {
    const rr = r * (1 - t * 0.3), yy = y - t * 0.55;
    Ms(g, new THREE.TorusGeometry(rr, 0.07, 5, 16), gold, x, yy, z, 1, 1, 1, Math.PI / 2);
    const n = 8 - t * 2;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; bulbs.push(xf(SPH(0.15, 6, 4), x + Math.cos(a) * rr, yy + 0.18, z + Math.sin(a) * rr)); gems.push(xf(new THREE.OctahedronGeometry(0.13), x + Math.cos(a) * rr, yy - 0.3, z + Math.sin(a) * rr, 1, 1.9, 1)); }
  }
  bulbs.push(xf(SPH(r * 0.28, 8, 6), x, y - 1.2, z));
  mergedMesh(g, bulbs, warm); mergedMesh(g, gems, color(0xe8f4ff, { emissive: 0x6a7a8a }));
}
function sofa(g, cols, x, z, front, hex) {     // front = +1: faces +z ; -1: faces -z
  const m = C(hex), lt = C(hex + 0x181010), s = G();
  Bx(s, 3.4, 0.5, 1.3, m, 0, 0.45, 0, 1); Bx(s, 3.0, 0.2, 1.0, lt, 0, 0.8, 0.1, 1); Bx(s, 3.4, 0.9, 0.35, m, 0, 1.0, -0.5, 1);
  Bx(s, 0.3, 0.8, 1.3, m, -1.6, 0.8, 0, 1); Bx(s, 0.3, 0.8, 1.3, m, 1.6, 0.8, 0, 1);
  Bx(s, 3.4, 0.12, 1.3, C(0x2a1c10), 0, 0.12, 0, 1);
  s.position.set(x, 0, z); s.rotation.y = front > 0 ? 0 : Math.PI; g.add(s);
  cols.push([x - 1.75, x + 1.75, z - 0.7, z + 0.7, 1.4]);
}
function floorLamp(g, cols, x, z) {
  Cy(g, 0.05, 0.05, 2.2, 5, C(0x2a2622), x, 1.2, z, 1); Cy(g, 0.3, 0.3, 0.1, 8, C(0x2a2622), x, 0.05, z, 1);
  Cy(g, 0.28, 0.4, 0.6, 8, color(0xfff0c0, { emissive: 0xffe090 }), x, 2.5, z, 1);
  cols.push([x - 0.3, x + 0.3, z - 0.3, z + 0.3, 2.8]);
}
function palmPot(g, cols, x, z) {
  Cy(g, 0.55, 0.42, 0.75, 8, C(0x2a2e32), x, 0.38, z, 1);
  const leaf = C(0x2f6a30);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; Ms(g, new THREE.ConeGeometry(0.16, 1.7, 4), leaf, x + Math.cos(a) * 0.35, 1.7, z + Math.sin(a) * 0.35, 1, 1, 1, Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); }
  Cy(g, 0.05, 0.07, 1.2, 5, C(0x5a3d26), x, 1.3, z, 1);
  cols.push([x - 0.6, x + 0.6, z - 0.6, z + 0.6, 2.4]);
}
function doorFrame(g, x, z, ry, w, h, m) {     // deco portal posts + lintel on the OUTER wall face at (x,z), ry turns +z to the outside
  const f = G();
  for (const s of [-1, 1]) Bx(f, 0.9, h, 0.7, m, s * (w / 2 + 0.45), h / 2, 0.35, 2);
  Bx(f, w + 1.8, 0.7, 0.8, m, 0, h + 0.35, 0.4, 2);
  f.position.set(x, 0, z); f.rotation.y = ry; g.add(f);
}
export function bundLobbyHall() {
  const W = 44.8, D = 31.6, H = 14, CH = 11, T = 1.4, cols = [], g = G();
  const doors = [{ side: 'S', at: 0, w: 9, h: 6.5 }, { side: 'N', at: 0, w: 9, h: 6.5 }, { side: 'E', at: 0, w: 7, h: 5.5 }, { side: 'W', at: 0, w: 7, h: 5.5 }];
  const base = hall({ w: W, d: D, h: H, ch: CH, t: T, outer: 's6sh_decoOchre', inner: 's6sh_lobbyWall', floor: 's6sh_marble', ceil: 's6sh_octCeil', roof: 'concrete', tile: 8, doors });
  g.add(base); cols.push(...base.userData.cols);
  const ix = base.userData.inside, CR = mat('s6sh_decoCream'), FLU = mat('s6sh_flute'), ST = STONE(), COP = MD('s6sh_copper'), dk = C(0x3a2e22), gold = shiny(0xd9a62a, 80);
  // ---------------- exterior ----------------
  cornice(g, W, D, 0, H, 0, ST);
  Wb(g, 14, 3, 14, CR, ROOF(), 0, H + 0.6, 0, 8);        // lantern base 14.6 .. 17.6 (octagon-ish block)
  Cy(g, 6.6, 7.2, 2.8, 8, CR, 0, H + 2.0, 0, 6);
  Cy(g, 5.4, 5.8, 1.6, 8, color(0xe8e0b8, { emissive: 0x5a5030 }), 0, H + 3.8, 0, 3);
  Ms(g, domeGeo(5.6, 1.5, 8), COP, 0, H + 4.6, 0);
  Cy(g, 0.04, 0.1, 1.0, 4, C(0xd8b040), 0, H + 6.3, 0, 1);
  // fins around the door and along the front
  for (const x of [-9, 9, -15, 15]) Bx(g, 0.9, H, 0.5, mat('s6sh_granTower'), x, H / 2, D / 2 + 0.25, 2);
  doorFrame(g, 0, D / 2, 0, 9, 6.5, dk); doorFrame(g, 0, -D / 2, Math.PI, 9, 6.5, dk);
  doorFrame(g, W / 2, 0, Math.PI / 2, 7, 5.5, dk); doorFrame(g, -W / 2, 0, -Math.PI / 2, 7, 5.5, dk);
  Bx(g, 13, 0.5, 1.5, dk, 0, 7.9, D / 2 + 0.75 + 0.1, 2);                 // marquee
  Bx(g, 12.4, 0.1, 1.3, glow(0xffe0a0), 0, 7.6, D / 2 + 0.8 + 0.1, 1);
  for (const s of [-1, 1]) { Cy(g, 0.22, 0.22, 7.7, 8, dk, s * 6.0, 3.85, D / 2 + 1.1, 1); cols.push([s * 6 - 0.3, s * 6 + 0.3, D / 2 + 0.8, D / 2 + 1.4, 8]); }
  sgn(g, 'GRAND HOTEL', 10, 1.3, 0, 10.2, D / 2 + 0.07, 0, { bg: '#16090a', fg: '#ffcf5a', border: '#ffcf5a' });
  neonBox(g, 's6sh_neon2', 1.0, 6.4, -19, 9.6, D / 2 + 0.55, 0); neonBox(g, 's6sh_neon0', 1.0, 6.4, 19, 9.6, D / 2 + 0.55, 0);
  Bx(g, 11, 0.12, 1.4, mat('s4i_carpet'), 0, 0.06, D / 2 + 0.8, 3);        // red carpet outside
  for (const x of [-18, -12, 12, 18]) win(g, 2.2, 3.6, x, 3.4, D / 2 + 0.08, 0, { c: '#6a4a24', lit: x % 12 === 0 });
  // ---------------- interior ----------------
  const midZ = (ix.z0 + ix.z1) / 2;
  Bx(g, ix.x1 - ix.x0, 0.05, ix.z1 - ix.z0, mat('s6sh_marble'), 0, 0.025, 0, 8);          // solid floor slab
  { const cm = mat('s4i_carpet').clone(); cm.depthWrite = false; const c = tiledPlane(5, ix.z1 - ix.z0 - 5, 2, 8, cm, 0, 0.07, 2.5); c.rotation.x = -Math.PI / 2; c.renderOrder = -3; g.add(c); }
  // columns in two rows
  for (const sx of [-1, 1]) for (const z of [-9.5, -3.2, 3.2, 9.5]) {
    const x = sx * 9;
    Cy(g, 0.75, 0.82, CH - 0.8, 12, FLU, x, CH / 2, z, 4); Bx(g, 1.9, 0.5, 1.9, gold, x, 0.25, z, 1); Bx(g, 2.2, 0.8, 2.2, gold, x, CH - 0.4, z, 1);
    cols.push([x - 0.9, x + 0.9, z - 0.9, z + 0.9, CH]);
  }
  // octagonal drop ceiling + chandeliers
  Cy(g, 9.2, 9.2, 0.9, 8, mat('s6sh_octCeil'), 0, CH - 0.45, 0, 6).rotation.y = Math.PI / 8;
  Cy(g, 9.6, 9.6, 0.25, 8, gold, 0, CH - 0.95, 0, 2).rotation.y = Math.PI / 8;
  Cy(g, 6.0, 6.0, 0.08, 8, glow(0xfff0c0), 0, CH - 1.1, 0, 2).rotation.y = Math.PI / 8;
  chandelier(g, 0, CH - 4.2, 0, 3.4);
  for (const z of [-9.5, 9.5]) chandelier(g, 0, CH - 3.4, z, 1.8);
  for (const sx of [-1, 1]) chandelier(g, sx * 15.5, CH - 3.4, 0, 1.6);
  // reception counters at the back (door gap in the middle stays free)
  for (const sx of [-1, 1]) {
    const cx = sx * 12.5;
    Bx(g, 10, 1.2, 2.0, mat('planks'), cx, 0.6, ix.z0 + 2.4, 2); Bx(g, 10.3, 0.12, 2.3, gold, cx, 1.26, ix.z0 + 2.4, 2);
    Bx(g, 0.35, 0.5, 0.35, glow(0xfff0b8), cx - 3, 1.6, ix.z0 + 2.6, 1); Bx(g, 0.35, 0.5, 0.35, glow(0xfff0b8), cx + 3, 1.6, ix.z0 + 2.6, 1);
    cols.push([cx - 5, cx + 5, ix.z0 + 1.4, ix.z0 + 3.4, 1.3]);
    Bx(g, 9, 3.4, 0.25, dk, cx, 3.2, ix.z0 + 0.35, 1);
    for (let i = 0; i < 6; i++) Bx(g, 0.5, 0.5, 0.1, gold, cx - 3.5 + i * 1.4, 3.2 + (i % 2) * 0.9, ix.z0 + 0.52, 1);
  }
  sgn(g, 'RECEPTION', 5, 0.8, -12.5, 6.3, ix.z0 + 0.07, 0, { bg: '#2a1c10', fg: '#e8c870', border: '#c9a24a' });
  sgn(g, 'CONCIERGE', 5, 0.8, 12.5, 6.3, ix.z0 + 0.07, 0, { bg: '#2a1c10', fg: '#e8c870', border: '#c9a24a' });
  { const c = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 20), [dk, mat('clock'), mat('clock')]); c.rotation.x = Math.PI / 2; c.position.set(0, 8.2, ix.z0 + 0.2); g.add(c); }
  // sofa groups in the four corners (side-door lane at z=0 stays open)
  const sc = [0xa8322a, 0x1f6a6a, 0x2a4a7a, 0x8a5a1a];
  [[-15, -8.4], [15, -8.4], [-15, 8.4], [15, 8.4]].forEach(([cx, cz], i) => {
    sofa(g, cols, cx, cz - 1.9, 1, sc[i]); sofa(g, cols, cx, cz + 1.9, -1, sc[(i + 1) % 4]);
    Cy(g, 0.8, 0.8, 0.5, 8, mat('s6sh_marble'), cx, 0.25, cz, 2); Cy(g, 0.85, 0.85, 0.06, 8, gold, cx, 0.52, cz, 1);
    cols.push([cx - 0.9, cx + 0.9, cz - 0.9, cz + 0.9, 0.6]);
  });
  for (const [x, z] of [[-19.8, -12.5], [19.8, -12.5], [-19.8, 12.5], [19.8, 12.5], [-19.8, 5], [19.8, 5], [-19.8, -5], [19.8, -5]]) floorLamp(g, cols, x, z);
  for (const [x, z] of [[-6.2, 12.6], [6.2, 12.6], [-6.2, -3], [6.2, -3]]) if (z > 0) palmPot(g, cols, x, z);
  const wl = []; for (const sx of [-1, 1]) for (const z of [-11.5, -5.5, 5.5, 11.5]) for (const y of [4.6, 8.4]) wl.push([0.3, 1.3, 0.5, sx * (ix.x1 - 0.12), y, z]);
  boxes(g, wl, glow(0xfff0b8));
  // lift doors on the side walls (decor)
  for (const sx of [-1, 1]) for (const z of [-10, 10]) { Bx(g, 0.2, 4.4, 2.6, shiny(0x6a5a3a, 90), sx * (ix.x1 - 0.1), 2.2, z, 1); Bx(g, 0.1, 3.8, 0.08, C(0x1c1612), sx * (ix.x1 - 0.22), 2.1, z, 1); }
  g.userData.inside = ix;
  g.userData.doors = [
    { side: 'S', x: 0, z: D / 2, at: 0, w: 9, h: 6.5 }, { side: 'N', x: 0, z: -D / 2, at: 0, w: 9, h: 6.5 },
    { side: 'E', x: W / 2, z: 0, at: 0, w: 7, h: 5.5 }, { side: 'W', x: -W / 2, z: 0, at: 0, w: 7, h: 5.5 },
  ];
  return size(g, 46, 34, 20.6, cols);
}

// =====================================================================
// 7. Shikumen row: red-brick lilong houses, white stone gates, clay tile roofs
// =====================================================================
export function shikumenRow() {
  const g = G(), BR = mat('s6sh_brick'), STN = mat('s6sh_stoneGate'), TL = mat('s6sh_tile'), TR = mat('s6sh_tileRed');
  const BZ = -0.6, DEP = 12.4, FZ = BZ + DEP / 2;         // front wall plane z = 5.6
  const ARCH = (() => { const s = new THREE.Shape(); s.absarc(0, 0, 1.15, 0, Math.PI, false); s.lineTo(1.15, 0); return s; })();
  const archGeo = new THREE.ExtrudeGeometry(ARCH, { depth: 0.5, bevelEnabled: false });
  for (let i = 0; i < 6; i++) {
    const x = -15 + i * 6, seed = 700 + i;
    Bx(g, 6, 6.4, DEP, BR, x, 3.2, BZ, 2);
    const roofM = i % 3 === 1 ? TR : TL;
    const rf = pedi(6.2, 3.4, DEP, BR, 3); rf.material = [BR, roofM]; rf.position.set(x, 6.4, BZ); g.add(rf);
    // stone gate
    for (const s of [-1, 1]) Bx(g, 0.5, 3.4, 0.6, STN, x + s * 1.1, 1.7, FZ + 0.3, 2);
    Bx(g, 3.0, 0.5, 0.7, STN, x, 3.65, FZ + 0.35, 2);
    Bx(g, 3.5, 0.25, 0.8, STN, x, 3.98, FZ + 0.4, 2);
    const ar = new THREE.Mesh(archGeo, STN); ar.position.set(x, 3.95, FZ + 0.05); ar.scale.set(0.95, 0.75, 1); g.add(ar);
    Bx(g, 1.9, 3.3, 0.2, C(0x1c1612), x, 1.65, FZ + 0.12, 1);
    door(g, 1.7, 3.0, x, 1.5, FZ + 0.25, 0, '#2a1a10');
    // windows (stone framed)
    win(g, 1.1, 1.6, x - 1.5, 5.0, FZ + 0.07, 0, { c: '#f0ece0', fixed: false });
    win(g, 1.1, 1.6, x + 1.5, 5.0, FZ + 0.07, 0, { c: '#f0ece0', fixed: false });
    Bx(g, 3.9, 0.15, 0.3, STN, x, 4.15, FZ + 0.15, 2);
    // small window up in the gable + stone cap
    win(g, 0.9, 1.0, x, 7.6, FZ + 0.07, 0, { c: '#f0ece0', fixed: true });
    Bx(g, 0.5, 0.35, 0.3, STN, x, 9.7, FZ + 0.1, 1);
    for (const yy of [1.8, 4.9]) for (const dx of [-1.3, 1.3]) win(g, 0.9, 1.3, x + dx, yy, BZ - DEP / 2 - 0.07, Math.PI, { c: '#f0ece0', fixed: true });
    lanterns(g, [[x + (i % 2 ? -1.55 : 1.55), 3.1, FZ + 0.45, 0.75]]);
    if (i % 2 === 0) laundry(g, x + 1.5, 4.9, FZ + 0.1, 1.25, seed); else laundry(g, x - 1.5, 4.9, FZ + 0.1, 1.0, seed);
  }
  // party-wall brick blocks poking above the eaves between houses
  for (let i = 0; i <= 6; i++) { const x = -18 + i * 6; Bx(g, 0.4, 7.4, DEP + 0.2, BR, x, 3.7, BZ, 2); }
  // chimneys
  for (const x of [-12, 0, 12]) Bx(g, 0.7, 1.6, 0.7, BR, x + 1.0, 9.4, BZ - 1.5, 1);
  return size(g, 36, 14, 10, [[-18, 18, -7, 6.0, 10]]);
}

// =====================================================================
// 8. Old shophouse row (variant 0|1): awnings, balconies, lanterns, vertical neon, AC units
// =====================================================================
export function oldShopRow(opts = {}) {
  const v = (opts.variant | 0) % 2, g = G(), roof = ROOF(), ST = STONE(), iron = C(0x2c3034);
  const mats = ['s6sh_shopA', 's6sh_shopB', 's6sh_shopC', 's6sh_shopD', 's6sh_shopE', 's6sh_shopF'].map((n) => mat(n));
  const awn = ['s6sh_awnA', 's6sh_awnB', 's6sh_awnC', 's6sh_awnD'].map((n) => mat(n));
  const BZ = -0.8, DEP = 14.4, FZ = BZ + DEP / 2;           // front wall z = 6.4
  { const gb = Bx(g, 40, 4, DEP, mat('s6sh_shopfront'), 0, 2, BZ, 8); gb.material = [mats[1], mats[1], roof, roof, mat('s6sh_shopfront'), mats[3]]; }
  const heights = v === 0 ? [16, 16, 16, 16, 16, 16, 16, 16, 16, 16] : [16, 12, 16, 12, 12, 16, 12, 16, 12, 16];
  const order = v === 0 ? [0, 1, 2, 3, 4, 5, 2, 1, 5, 0] : [3, 5, 1, 4, 0, 2, 5, 3, 1, 4];
  const words = v === 0 ? ['TEA', 'SILK', 'NOODLE', 'CAFE', 'TOYS'] : ['BAKERY', 'PEARL', 'CANDY', 'TAILOR', 'KITES'];
  const ac = [], lant = [], balc = [], rails = [];
  for (let i = 0; i < 10; i++) {
    const x = -18 + i * 4, hh = heights[i], mm = mats[order[i]];
    const upper = hh - 4;
    const b = slab(4, upper, DEP, mm, roof, 8); b.position.set(x, 4 + upper / 2, BZ); g.add(b);
    if (hh === 16) { Bx(g, 4.1, 0.5, DEP + 0.2, ST, x, 16.25, BZ, 4); Bx(g, 4.05, 0.7, 0.2, ST, x, 16.85, FZ - 0.05, 4); }
    else {           // 3 floors: pitched tile roof, ridge along x
      const gr = gableRoof(4, DEP, 2.4, 0.1, i % 2 ? MD('s6sh_tileRed') : MD('s6sh_tile'), mm, 3); gr.position.set(x, hh, BZ); g.add(gr);
    }
    // awning + lanterns + shop sign
    const a = Bx(g, 3.7, 0.12, 1.7, awn[(i + v) % 4], x, 3.3, FZ + 0.85, 4); a.rotation.x = 0.3;
    lant.push([x - 1.2, 2.5, FZ + 1.55, 0.8], [x + 1.2, 2.5, FZ + 1.55, 0.8]);
    sgn(g, words[i % 5], 3.4, 0.62, x, 3.65, FZ + 0.07, 0, { bg: ['#2a1210', '#10222a', '#2a2210', '#1a1030', '#102a16'][i % 5], fg: ['#ffd23a', '#7cffb0', '#ff8a3a', '#38e8ff', '#ff6aa0'][i % 5], border: '' });
    // balcony and AC
    if (i % 2 === 0 && hh >= 12) { balc.push([3.3, 0.25, 1.2, x, 8.0, FZ + 0.6]); rails.push([3.3, 0.9, 0.08, x, 8.65, FZ + 1.16], [0.08, 0.9, 1.1, x - 1.62, 8.65, FZ + 0.6], [0.08, 0.9, 1.1, x + 1.62, 8.65, FZ + 0.6]); }
    if (i % 3 === 0 && hh >= 16) { balc.push([3.3, 0.25, 1.2, x, 12.0, FZ + 0.6]); rails.push([3.3, 0.9, 0.08, x, 12.65, FZ + 1.16], [0.08, 0.9, 1.1, x - 1.62, 12.65, FZ + 0.6], [0.08, 0.9, 1.1, x + 1.62, 12.65, FZ + 0.6]); }
    ac.push([x + 0.9, 5.35 + (i % 3) * 4 - (i % 3 === 2 ? 0 : 0), FZ], [x - 0.9, 9.4 + (i % 2) * 4, FZ]);
  }
  boxes(g, balc, ST); boxes(g, rails, iron);
  acUnits(g, ac.filter(([x, y]) => y < 15));
  lanterns(g, lant);
  // vertical neon signs
  [[-16, 'a'], [-8, 'b'], [0, 'c'], [8, 'd'], [16, 'e']].forEach(([x, k], j) => neonBox(g, `s6sh_neon${(j + v * 2) % 4}`, 1.0, j % 2 ? 4.8 : 6.4, x + 2, j % 2 ? 11.2 : 12.8, FZ + 0.62, 0));
  // roof clutter
  for (const [x, z] of [[-14, -3], [-2, -4], [10, -2], [16, -5]]) { Cy(g, 0.8, 0.8, 1.4, 8, C(0x5a5e60), x, 16.7, z, 1); Cy(g, 0.85, 0.85, 0.15, 8, C(0x3a3e40), x, 17.5, z, 1); }
  for (const x of [-9, 5, 13]) { Cy(g, 0.04, 0.04, 2.2, 4, iron, x, 17.1, -4, 1); Bx(g, 1.0, 0.05, 0.05, iron, x, 17.8, -4, 1); }
  return size(g, 40, 16, 18);
}

// =====================================================================
// 9. Art-deco department store with LED board
// =====================================================================
export function deptStoreDeco() {
  const g = G(), roof = ROOF(), CR = mat('s6sh_decoCream'), RL = mat('s6sh_relief'), ST = STONE(), dk = C(0x2c2620);
  Wb(g, 36, 12, 24, CR, roof, 0, 0, -2);                       // z -14..10
  Bx(g, 36.5, 1.2, 24.5, RL, 0, 12.6, -2, 4);
  Wb(g, 30, 12, 20, CR, roof, 0, 13.2, -1);                     // 13.2..25.2, front z=9
  Bx(g, 30.5, 1.0, 20.5, RL, 0, 25.7, -1, 4);
  Wb(g, 20, 4, 14, CR, roof, 0, 26.2, -1);                      // ..30.2, front z=6
  for (const sx of [-1, 1]) { Bx(g, 1.4, 9, 1.4, ST, sx * 10.2, 33.0 - 3, 6.2, 2); }
  // LED board on the second tier
  Bx(g, 19, 7.6, 0.25, dk, 0, 19.2, 9.125, 1);
  const led = new THREE.Mesh(new THREE.PlaneGeometry(18, 6.6), flatMap('s6sh_led')); led.position.set(0, 19.2, 9.3); led.userData.keep = true; g.add(led);
  Bx(g, 19, 0.2, 0.3, glow(0x38e8ff), 0, 23.1, 9.3, 1); Bx(g, 19, 0.2, 0.3, glow(0xff2d95), 0, 15.3, 9.3, 1);
  // top sign
  sgn(g, 'GRAND MALL', 12, 1.9, 0, 28.2, 6.08, 0, { bg: '#12080a', fg: '#ffd23a', border: '#ff3a3a' });
  Bx(g, 36.2, 0.2, 0.2, glow(0xffe0a0), 0, 12.0, 10.1, 1);
  // pylon + side entrances + steps
  Bx(g, 5, 22, 1.2, CR, 0, 11, 10.6, 3);
  for (const x of [-1.6, 0, 1.6]) Bx(g, 0.5, 22.4, 0.3, ST, x, 11.2, 11.3, 2);
  neonBox(g, 's6sh_neon3', 1.2, 8, -3.3, 16, 11.0, 0); neonBox(g, 's6sh_neon1', 1.2, 8, 3.3, 16, 11.0, 0);
  for (const sx of [-1, 1]) {
    const x = sx * 9;
    for (const [w, h, z] of [[7, 8, 10.25], [6, 7.2, 10.45], [5, 6.4, 10.65]]) Bx(g, w, h, 0.3, w === 6 ? RL : ST, x, h / 2, z, 2);
    Bx(g, 4.2, 5.8, 0.2, C(0x1c2024), x, 2.9, 10.9, 1);
    door(g, 3.6, 5.2, x, 2.6, 11.02, 0, '#3a2a14');
    Bx(g, 4.6, 0.15, 0.2, glow(0xffe0a0), x, 6.15, 11.05, 1);
    for (const dx of [-1, 1]) win(g, 1.8, 3.6, x + dx * 6.1, 3.3, 10.08, 0, { lit: true, c: '#4a3c2c' });
  }
  const st1 = Bx(g, 30, 0.5, 4, ST, 0, 0.25, 12, 4), st2 = Bx(g, 26, 0.5, 3, ST, 0, 0.75, 11.5, 4), st3 = Bx(g, 22, 0.5, 2, ST, 0, 1.25, 11, 4);
  return size(g, 36, 28, 30.2, [[-18, 18, -14, 10, 12.6], [-15, 15, 10, 14, 1.5], [-2.5, 2.5, 10, 11.2, 22], [-15, 15, -11, 9, 25.2], [-10, 10, -8, 6, 30.2]]);
}

// =====================================================================
// 10. Nanjing Road pailou (ceremonial arch). Colliders: the four posts only.
// =====================================================================
export function nanjingGate() {
  const g = G(), GRN = mat('s6sh_tileGreen'), BM = mat('s6sh_beam'), LQ = mat('s6sh_lacquer'), gold = C(0xe0b030, 0x302006), granite = mat('granite');
  const posts = [-9.6, -5, 5, 9.6], cols = [];
  for (const x of posts) {
    Bx(g, 1.7, 1.1, 1.7, granite, x, 0.55, 0, 2);
    Bx(g, 1.0, 6.6, 1.0, LQ, x, 4.4, 0, 3);
    Bx(g, 1.1, 0.3, 1.1, gold, x, 1.3, 0, 1); Bx(g, 1.1, 0.3, 1.1, gold, x, 6.3, 0, 1);
    cols.push([x - 0.85, x + 0.85, -0.85, 0.85, 10]);
  }
  Bx(g, 10.2, 0.8, 0.9, BM, 0, 6.2, 0, 2); Bx(g, 4.6, 0.7, 0.8, BM, -7.3, 6.2, 0, 2); Bx(g, 4.6, 0.7, 0.8, BM, 7.3, 6.2, 0, 2);
  Bx(g, 11, 0.9, 1.1, BM, 0, 7.6, 0, 2);
  for (const s of [-1, 1]) sgn(g, 'NANJING ROAD', 6, 0.95, 0, 6.85, s * 0.58, s > 0 ? 0 : Math.PI, { bg: '#1a0a08', fg: '#f0d060', border: '#e0b030' });
  const bk = []; for (let i = 0; i < 12; i++) bk.push([0.5, 0.45, 1.3, -5.4 + i * 0.98, 8.3, 0]);
  for (let i = 0; i < 5; i++) { bk.push([0.45, 0.4, 1.0, 5.6 + i * 0.9, 7.0, 0], [0.45, 0.4, 1.0, -5.6 - i * 0.9, 7.0, 0]); }
  boxes(g, bk, BM);
  const cr = gableRoof(12.6, 3.0, 1.5, 0.4, MD('s6sh_tileGreen'), mat('s6sh_decoGrey'), 3); cr.position.set(0, 8.5, 0); g.add(cr);
  for (const s of [-1, 1]) { const sr = gableRoof(5.0, 2.6, 1.1, 0.4, MD('s6sh_tileGreen'), mat('s6sh_decoGrey'), 3); sr.position.set(s * 7.5, 7.05, 0); g.add(sr); }
  for (const s of [-1, 1]) {
    Bx(g, 0.35, 0.8, 0.35, gold, s * 6.9, 10.2, 0, 1); Bx(g, 0.3, 0.6, 0.3, gold, s * 9.6, 8.7, 0, 1);
  }
  Sg(g, gold, 0, 10.2, 0, 0.3, 0.3, 0.3, 6);
  lanterns(g, [[-2.5, 5.0, 0, 1.0], [2.5, 5.0, 0, 1.0], [-7.3, 5.1, 0, 0.9], [7.3, 5.1, 0, 0.9]]);
  return size(g, 22, 4, 10.4, cols);
}

// =====================================================================
// street props
// =====================================================================
const IRON = () => C(0x24302c);
const OPAL = () => color(0xfff4d6, { emissive: 0xffe6a0 });

// 11. Bund double lamp post, 5.5 m
export function bundLamp() {
  const g = G(), iron = IRON(), opal = OPAL();
  Cy(g, 0.28, 0.4, 0.9, 8, iron, 0, 0.45, 0, 1); Cy(g, 0.3, 0.3, 0.14, 8, shiny(0xb08a3a), 0, 0.96, 0, 1);
  Cy(g, 0.1, 0.16, 3.2, 8, iron, 0, 2.6, 0, 1); Cy(g, 0.2, 0.2, 0.18, 8, shiny(0xb08a3a), 0, 3.9, 0, 1);
  Cy(g, 0.08, 0.1, 0.5, 6, iron, 0, 4.2, 0, 1);
  const arms = [];
  for (const s of [-1, 1]) {
    arms.push([[0, 4.3, 0], [s * 0.55, 4.75, 0]], [[s * 0.55, 4.75, 0], [s * 0.95, 4.8, 0]]);
    Cy(g, 0.22, 0.14, 0.18, 8, iron, s * 0.95, 4.82, 0, 1);
    Sg(g, opal, s * 0.95, 5.15, 0, 0.32, 0.36, 0.32, 8);
    Cy(g, 0.1, 0.24, 0.15, 8, iron, s * 0.95, 5.46, 0, 1);
  }
  rods(g, arms, 0.05, iron, 5);
  Sg(g, shiny(0xb08a3a), 0, 4.55, 0, 0.14, 0.14, 0.14, 6);
  return size(g, 2.4, 0.8, 5.55);
}

// 12. single hanging red lantern, 1.2 m
export function redLantern() {
  const g = G();
  Cy(g, 0.012, 0.012, 0.26, 4, C(0x3a2a1a), 0, 1.07, 0, 1);
  Cy(g, 0.17, 0.2, 0.1, 8, LANT_GOLD(), 0, 0.99, 0, 1);
  Sg(g, LANT_RED(), 0, 0.64, 0, 0.44, 0.33, 0.44, 12);
  Cy(g, 0.2, 0.17, 0.1, 8, LANT_GOLD(), 0, 0.29, 0, 1);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; Cy(g, 0.012, 0.012, 0.22, 3, C(0xe0b030), Math.cos(a) * 0.05, 0.16, Math.sin(a) * 0.05, 1); }
  Sg(g, LANT_GOLD(), 0, 0.02 + 0.06, 0, 0.05, 0.05, 0.05, 5);
  return size(g, 0.9, 0.9, 1.2);
}

// 13. 12 m string of lanterns between two poles
export function lanternString() {
  const g = G(), iron = IRON(), pole = C(0x4a2a1a), pts = [], N = 12, SAG = 0.8, TOP = 5.1;
  for (const s of [-1, 1]) { Cy(g, 0.1, 0.16, 5.4, 6, pole, s * 6, 2.7, 0, 1); Sg(g, LANT_GOLD(), s * 6, 5.5, 0, 0.14, 0.14, 0.14, 6); Cy(g, 0.3, 0.3, 0.15, 6, iron, s * 6, 0.07, 0, 1); }
  const yAt = (x) => TOP - SAG * (1 - (x / 6) ** 2);
  const wire = []; for (let i = 0; i < N; i++) { const x0 = -6 + i, x1 = -5 + i; wire.push([[x0, yAt(x0), 0], [x1, yAt(x1), 0]]); }
  rods(g, wire, 0.025, iron, 4);
  const l = []; for (let i = 1; i < 12; i++) { const x = -6 + i; l.push([x, yAt(x) - 0.55, 0, 1.0]); }
  lanterns(g, l);
  const ties = []; for (let i = 1; i < 12; i++) { const x = -6 + i; ties.push([[x, yAt(x), 0], [x, yAt(x) - 0.3, 0]]); }
  rods(g, ties, 0.012, iron, 3);
  return size(g, 12.4, 0.6, 5.6);
}

// 14. vertical neon sign on a pole, 8 m
export function neonSignPole() {
  const g = G(), iron = C(0x30343a);
  Cy(g, 0.1, 0.14, 8, 6, iron, 0, 4, 0, 1); Cy(g, 0.25, 0.3, 0.3, 6, iron, 0, 0.15, 0, 1);
  const panel = (name, w, h, y) => {
    const fm = flatMap(name), b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.22), [C(0x20242a), C(0x20242a), C(0x20242a), C(0x20242a), fm, fm]);
    b.position.set(0.0, y, 0.18); b.userData.keep = true; g.add(b);
  };
  panel('s6sh_neon0', 1.25, 4.6, 5.0); panel('s6sh_neon2', 1.0, 2.6, 2.1);
  for (const y of [7.3, 2.0]) Bx(g, 0.14, 0.2, 0.3, iron, 0, y - 0.4, 0.1, 1);
  Ms(g, new THREE.TorusGeometry(0.55, 0.06, 5, 16), glow(0xff2d95), 0, 7.4, 0.14);
  Ms(g, new THREE.TorusGeometry(0.32, 0.05, 5, 14), glow(0x38e8ff), 0, 7.4, 0.14);
  Bx(g, 0.18, 1.4, 0.18, glow(0xffe83a), 1.3, 3.5, 0.18, 1);
  Ms(g, new THREE.ConeGeometry(0.4, 0.8, 3), glow(0x7cffb0), 1.3, 4.5, 0.18, 1, 1, 1, 0, 0, 0);
  Bx(g, 1.4, 0.1, 0.1, iron, 0.65, 3.0, 0.18, 1);
  return size(g, 2.2, 0.6, 8);
}

// 15. Nanjing Road tourist tram (white + red), long side faces +z
export function touristTram() {
  const g = G(), white = C(0xf4f1ea), red = C(0xcc2a24), dark = C(0x20262c), glass = glassM(0x4a6a7a, 0.8);
  Bx(g, 13.4, 0.5, 2.5, dark, 0, 0.55, 0, 1);
  Bx(g, 13.4, 2.4, 2.7, white, 0, 1.95, 0, 2);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 2.4), mat('s6sh_tram')); p.position.set(0, 1.95, s * 1.36); p.rotation.y = s > 0 ? 0 : Math.PI; g.add(p); }
  Bx(g, 13.7, 0.22, 2.9, red, 0, 3.26, 0, 2);
  Bx(g, 12.6, 0.12, 2.3, white, 0, 3.43, 0, 2);
  for (const s of [-1, 1]) {
    Bx(g, 0.12, 1.4, 2.1, glass, s * 6.72, 2.2, 0, 1);
    Bx(g, 0.2, 0.5, 2.7, red, s * 6.72, 1.0, 0, 1);
    Sg(g, glow(0xfff0b0), s * 6.78, 1.35, 0.7, 0.2, 0.2, 0.12, 6); Sg(g, glow(0xfff0b0), s * 6.78, 1.35, -0.7, 0.2, 0.2, 0.12, 6);
  }
  for (const x of [-4.4, 4.4]) for (const z of [-1.0, 1.0]) { const w = Cy(g, 0.36, 0.36, 0.2, 10, dark, x, 0.36, z, 1); w.rotation.x = Math.PI / 2; }
  for (const x of [-4.4, 4.4]) Bx(g, 1.8, 0.3, 2.2, dark, x, 0.4, 0, 1);
  // pantograph
  rods(g, [[[3.6, 3.5, 0], [2.4, 3.95, 0.0]], [[2.4, 3.95, 0], [3.3, 3.5, 0.5]]], 0.04, dark, 4);
  Bx(g, 0.1, 0.06, 1.0, dark, 2.4, 3.98, 0, 1);
  Bx(g, 2.2, 0.3, 1.0, C(0xd8d4c8), -3, 3.62, 0, 1);
  // little red flag
  Bx(g, 0.04, 0.5, 0.02, dark, 6.3, 3.7, 0.9, 1);
  return size(g, 14, 3, 4);
}

// 16. Bund bull (bronze), facing +x
export function bundBull() {
  const g = G(), br = shiny(0x8a5e2a, 90), dk = shiny(0x5a3c1c, 80);
  Bx(g, 5.8, 0.5, 2.6, mat('granite'), 0, 0.25, 0, 3);
  Sg(g, br, -0.3, 2.0, 0, 1.75, 0.85, 0.9, 12);                // body
  Sg(g, br, 1.0, 2.45, 0, 0.95, 0.8, 0.85, 10);                // hump / shoulders
  Sg(g, br, 1.95, 2.1, 0, 0.8, 0.62, 0.6, 10);                 // neck
  Sg(g, br, 2.7, 1.8, 0, 0.62, 0.5, 0.46, 10);                 // head (lowered)
  Sg(g, dk, 3.15, 1.55, 0, 0.3, 0.28, 0.3, 8);                 // muzzle
  const horn = [], leg = [];
  for (const s of [-1, 1]) {
    horn.push([[2.5, 2.05, s * 0.4], [2.7, 2.25, s * 0.9]], [[2.7, 2.25, s * 0.9], [3.1, 2.65, s * 0.85]]);
    Ms(g, new THREE.ConeGeometry(0.1, 0.3, 5), dk, 3.2, 2.76, s * 0.84, 1, 1, 1, 0, 0, -0.9);
    leg.push([[1.2, 1.7, s * 0.45], [1.75, 1.0, s * 0.45]], [[1.75, 1.0, s * 0.45], [1.5, 0.55, s * 0.45]]);
    leg.push([[-1.3, 1.8, s * 0.45], [-1.9, 1.0, s * 0.45]], [[-1.9, 1.0, s * 0.45], [-1.55, 0.55, s * 0.45]]);
    Bx(g, 0.4, 0.14, 0.34, dk, 1.52, 0.57, s * 0.45, 1); Bx(g, 0.4, 0.14, 0.34, dk, -1.57, 0.57, s * 0.45, 1);
    Sg(g, C(0xf4f0e0), 2.82, 1.95, s * 0.36, 0.07, 0.07, 0.05, 5);
  }
  rods(g, horn, 0.1, dk, 6); rods(g, leg, 0.2, br, 7);
  rods(g, [[[-2.0, 2.3, 0], [-2.55, 2.8, 0]], [[-2.55, 2.8, 0], [-2.7, 2.2, 0]]], 0.07, br, 5);
  Sg(g, dk, -2.7, 2.05, 0, 0.14, 0.2, 0.14, 6);
  return size(g, 6, 3, 3.5);
}

// 17. stone balustrade with lamp stubs; tile along x
export function promenadeRail() {
  const g = G(), st = mat('granite'), ST = STONE();
  Bx(g, 20, 0.3, 0.9, st, 0, 0.15, 0, 3);
  Bx(g, 20, 0.22, 0.65, ST, 0, 1.0, 0, 3);
  const bal = []; for (let i = 0; i < 40; i++) bal.push([0.16, 0.7, 0.16, -9.75 + i * 0.5, 0.65, 0]);
  boxes(g, bal, ST);
  Bx(g, 20, 0.12, 0.42, st, 0, 0.36, 0, 3);
  for (const x of [-9.6, 0, 9.6]) {
    Bx(g, 0.8, 1.0, 0.8, st, x, 0.5, 0, 2); Bx(g, 0.95, 0.14, 0.95, ST, x, 1.07, 0, 2);
    Cy(g, 0.1, 0.14, 0.14, 6, IRON(), x, 1.2, 0, 1); Sg(g, OPAL(), x, 1.2 + 0.14, 0, 0.1, 0.12, 0.1, 6);
  }
  return size(g, 20, 1, 1.3, [[-10, 10, -0.45, 0.45, 1.1]]);
}

// 18. plane (sycamore) street tree
export function planeTree() {
  const g = G(), bark = mat('s6sh_bark'), leaf = mat('s6sh_leaf');
  Cy(g, 0.26, 0.38, 3.6, 8, bark, 0, 1.8, 0, 2);
  Cy(g, 0.3, 0.55, 0.5, 8, bark, 0, 0.25, 0, 2);
  rods(g, [[[0, 3.4, 0], [-0.9, 6.2, 0.3]], [[0, 3.4, 0], [0.8, 6.0, -0.4]], [[0, 3.2, 0], [0.2, 6.4, 0.8]], [[-0.3, 5.0, 0.1], [-0.9, 8.0, -0.3]], [[0.3, 5.0, 0], [0.9, 8.2, 0.4]]], 0.14, bark, 5);
  const blobs = [[0, 8.8, 0, 1.7], [-1.0, 7.2, 0.3, 1.5], [1.0, 7.4, -0.3, 1.5], [0.2, 6.5, 1.0, 1.2], [-0.4, 6.6, -1.0, 1.2], [-0.8, 9.4, -0.4, 1.2], [0.8, 9.6, 0.4, 1.2], [0.1, 10.0, 0.1, 0.9]];
  for (const [x, y, z, r] of blobs) Ms(g, new THREE.IcosahedronGeometry(1, 1), leaf, x, y, z, r, r * 0.85, r, x, y, z);
  return size(g, 5, 5, 11, [[-0.35, 0.35, -0.35, 0.35, 11]]);
}

// =====================================================================
// river boats
// =====================================================================
// 19. river cruise boat with lit decks, bow towards +x
export function cruiseBoat() {
  const g = G(), white = C(0xf2f0ea), navy = C(0x1d2a4a), red = C(0xc02a28), dk = C(0x20262c), fm = flatMap('s6sh_boatWin');
  const hs = new THREE.Shape(); hs.moveTo(-15, -3.6); hs.lineTo(8.5, -3.9); hs.quadraticCurveTo(13.5, -2.6, 15, 0); hs.quadraticCurveTo(13.5, 2.6, 8.5, 3.9); hs.lineTo(-15, 3.6); hs.closePath();
  const hg = new THREE.ExtrudeGeometry(hs, { depth: 2.0, bevelEnabled: false }); hg.rotateX(-Math.PI / 2); scaleUV(hg, 0.25, 0.25);
  g.add(new THREE.Mesh(hg, [navy, navy]));
  const stripe = new THREE.ExtrudeGeometry(hs, { depth: 0.3, bevelEnabled: false }); stripe.rotateX(-Math.PI / 2); stripe.translate(0, 2.0, 0); scaleUV(stripe, 0.25, 0.25);
  Ms(g, stripe, red, 0, 0, 0, 1.0, 1, 1.0);
  const deck = (len, wd, x, y0, hh) => {
    Bx(g, len, hh, wd, white, x, y0 + hh / 2, 0, 2);
    for (const s of [-1, 1]) { const p = tiledPlane(len - 0.6, hh - 0.2, (len - 0.6) / 4, 1, fm, x, y0 + hh / 2, s * (wd / 2 + 0.05)); if (s < 0) p.rotation.y = Math.PI; p.userData.keep = true; g.add(p); }
    Bx(g, len + 0.5, 0.25, wd + 0.5, dk, x, y0 + hh + 0.12, 0, 2);
    Bx(g, len + 0.5, 0.08, 0.1, glow(0x38e8ff), x, y0 + hh + 0.3, wd / 2 + 0.25, 1); Bx(g, len + 0.5, 0.08, 0.1, glow(0xff2d95), x, y0 + hh + 0.3, -wd / 2 - 0.25, 1);
  };
  deck(24, 6.6, -3, 2.3, 2.4);
  deck(17, 5.4, -5.5, 5.05, 2.3);
  deck(7, 4.0, -4, 7.65, 1.5);
  Bx(g, 0.1, 1.2, 3.6, glassM(0x3a5a6a, 0.8), 3.55, 8.3, 0, 1);
  Cy(g, 0.9, 1.1, 2.0, 8, red, -9.5, 8.4, 0, 2); Cy(g, 0.95, 1.15, 0.3, 8, white, -9.5, 8.0, 0, 1);
  Cy(g, 0.04, 0.06, 1.2, 4, dk, -4, 9.0 - 0.0, 0, 1);
  // bow rail + lifeboats
  for (const s of [-1, 1]) Ms(g, new THREE.CapsuleGeometry(0.4, 2.4, 3, 6), C(0xe8782a), -1.5, 7.9 - 0.0 + 0.0, s * 2.2, 1, 1, 1, 0, 0, Math.PI / 2).position.y = 7.55 + 0.0 + 0.05;
  for (const s of [-1, 1]) { const sg = sign('HUANGPU CRUISE', 9, 1.2, { bg: '#10203a', fg: '#ffe9a0', border: '#ffe9a0' }); sg.position.set(-1, 1.1, s * 3.93); if (s < 0) sg.rotation.y = Math.PI; g.add(sg); }
  return size(g, 30, 8, 9.3);
}

// 20. traditional sail junk, bow towards +x
export function junkBoat() {
  const g = G(), wood = C(0x6a3a22), wood2 = C(0x8a5430), dk = C(0x2a1a10), SAIL = MD('s6sh_sail');
  const P = [[-8, 2.8], [-7.4, 0], [6.4, 0], [8, 1.7], [8, 1.95], [-5, 1.95]];
  const s = new THREE.Shape(); P.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath();
  const hg = new THREE.ExtrudeGeometry(s, { depth: 3.6, bevelEnabled: false }); hg.translate(0, 0, -1.8); scaleUV(hg, 0.3, 0.3);
  g.add(new THREE.Mesh(hg, [wood, wood2]));
  Bx(g, 14, 0.12, 3.8, C(0x4a2a18), 0.5, 1.95, 0, 2);
  Bx(g, 3.4, 1.7, 3.0, wood2, -6.0, 2.85, 0, 2); Bx(g, 3.8, 0.2, 3.4, C(0x4a2a18), -6.0, 3.8, 0, 2);
  Bx(g, 2.2, 0.9, 2.2, wood2, 5.6, 2.45, 0, 2); Bx(g, 2.5, 0.15, 2.5, C(0x4a2a18), 5.6, 2.95, 0, 2);
  for (const sz of [-1, 1]) { Sg(g, C(0xf4f0e0), 7.3, 1.2, sz * 1.83, 0.28, 0.28, 0.1, 8); Sg(g, dk, 7.35, 1.2, sz * 1.9, 0.12, 0.12, 0.06, 6); }
  Bx(g, 0.3, 0.3, 4.4, C(0x5a3420), 7.9, 1.8, 0, 1);       // bow beam
  Bx(g, 1.6, 0.12, 0.5, dk, -8.7, 1.4, 0, 1); Bx(g, 0.15, 0.2, 4.4, wood, -8.1, 3.2, 0, 1);   // rudder + tiller
  const mast = (x, h, r) => { const m = Cy(g, r * 0.7, r, h, 6, C(0x4a2a18), x, 1.95 + h / 2, 0, 1); m.rotation.z = -0.03; };
  mast(-1.5, 12.0, 0.2); mast(4.0, 8.4, 0.16); mast(-6.0, 6.6, 0.12);
  const sailGeo = (xa, xb, y0a, y0b, y1a, y1b, bulge) => {
    const pos = [], uv = [], idx = [], N = 5;
    for (let i = 0; i <= N; i++) { const t = i / N, x = xa + (xb - xa) * t, y0 = y0a + (y0b - y0a) * t, y1 = y1a + (y1b - y1a) * t, z = bulge * Math.sin(t * Math.PI);
      pos.push(x, y0, z, x, y1, z); uv.push(t, 0, t, 1); }
    for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.setIndex(idx); gg.computeVertexNormals(); return gg;
  };
  const sail = (xa, xb, y0a, y0b, y1a, y1b, bul, nb) => {
    g.add(new THREE.Mesh(sailGeo(xa, xb, y0a, y0b, y1a, y1b, bul), SAIL));
    const bt = []; for (let k = 0; k <= nb; k++) { const t = k / nb; bt.push([[xa + 0.05, y0a + (y1a - y0a) * t, 0.02], [xb, y0b + (y1b - y0b) * t, 0.02]]); }
    rods(g, bt, 0.04, dk, 3);
  };
  sail(-1.6, -7.2, 2.9, 3.4, 13.4 - 1.0, 11.0, 0.6, 7);
  sail(3.9, 0.6, 2.9, 3.2, 9.6, 8.4, 0.5, 5);
  sail(-6.1, -8.6, 4.0, 4.4, 8.4, 7.2, 0.4, 4);
  Ms(g, new THREE.PlaneGeometry(1.0, 0.5), dblE(0xe8c030, 0x302000), -1.1, 13.55, 0.0, 1, 1, 1, 0, 0, 0);
  lanterns(g, [[-7.9, 3.0, 1.5, 0.9], [7.6, 2.5, 0, 0.8]]);
  return size(g, 16, 5, 14);
}

// =====================================================================
// Pudong skyline (far scenery, never walkable)
// =====================================================================
// 21. Oriental Pearl style: three spheres on slanted pylons, spire
export function orientalPearl() {
  const g = G(), pink = shiny(0xe08ab4, 90), silver = shiny(0xc4cad4, 90), band = C(0x2a3a5a), gl = color(0xffd8e8, { emissive: 0x6a4a58 });
  Cy(g, 14.5, 15, 1.2, 12, mat('concrete'), 0, 0.6, 0, 6);
  const A = [0, 1, 2].map((i) => Math.PI / 2 + i * Math.PI * 2 / 3);
  const legs = [], mid = [];
  A.forEach((a) => {
    legs.push([[Math.cos(a) * 12.5, 0.8, Math.sin(a) * 12.5], [Math.cos(a) * 4.5, 40, Math.sin(a) * 4.5]]);
    mid.push([[Math.cos(a + 0.6) * 5.5, 57, Math.sin(a + 0.6) * 5.5], [Math.cos(a + 0.6) * 5.5, 113, Math.sin(a + 0.6) * 5.5]]);   // vertical tubes from the lower ball up into the upper ball
  });
  rods(g, legs, 1.5, silver, 7); rods(g, mid, 1.2, silver, 6);
  Cy(g, 2.0, 2.4, 112, 8, silver, 0, 56.5, 0, 8);   // the fourth, central column: from the ground right up to the upper ball
  Sg(g, pink, 0, 50, 0, 11.5, 11.5, 11.5, 16);
  Ms(g, new THREE.TorusGeometry(11.55, 0.8, 5, 20), band, 0, 50, 0, 1, 1, 1, Math.PI / 2);
  Ms(g, new THREE.TorusGeometry(10.3, 0.3, 5, 20), gl, 0, 56, 0, 1, 1, 1, Math.PI / 2);
  Sg(g, pink, 0, 124, 0, 14.5, 14.5, 14.5, 16);
  Ms(g, new THREE.TorusGeometry(14.55, 0.9, 5, 22), band, 0, 124, 0, 1, 1, 1, Math.PI / 2);
  Ms(g, new THREE.TorusGeometry(13.0, 0.3, 5, 22), gl, 0, 132, 0, 1, 1, 1, Math.PI / 2);
  Sg(g, silver, 0, 86, 0, 4.2, 4.2, 4.2, 10);
  Cy(g, 1.0, 1.6, 40, 8, silver, 0, 165, 0, 8);
  Sg(g, pink, 0, 188, 0, 5.2, 5.2, 5.2, 12);
  Ms(g, new THREE.TorusGeometry(5.25, 0.35, 4, 14), band, 0, 188, 0, 1, 1, 1, Math.PI / 2);
  Cy(g, 0.25, 0.8, 38, 6, silver, 0, 212, 0, 8);
  Sg(g, color(0xff3030, { emissive: 0xaa1010 }), 0, 231.5, 0, 0.6, 0.6, 0.6, 5);
  return size(g, 30, 30, 232);
}

// twisting, tapering tower (Shanghai Tower)
function twistGeo(H, R0, taper, twist, segs, rings, slantTop) {
  const pos = [], uv = [], idx = [], rr = (th) => 1 + 0.12 * Math.cos(3 * th);
  const rows = rings + 1;
  for (let k = 0; k <= rings; k++) {
    const t = k / rings, s = 1 - taper * Math.pow(t, 1.15), rot = twist * t, y = t * H;
    for (let i = 0; i <= segs; i++) {
      const th = i / segs * Math.PI * 2, r = R0 * s * rr(th - rot);
      const yy = (k === rings && slantTop) ? y - slantTop * (0.5 - 0.5 * Math.cos(th)) : y;
      pos.push(Math.cos(th) * r, yy, Math.sin(th) * r); uv.push(i / segs * R0 * 2 * Math.PI * (0.6 + 0.4 * s) / 16, y / 28);
    }
  }
  for (let k = 0; k < rings; k++) for (let i = 0; i < segs; i++) { const a = k * (segs + 1) + i, b = a + segs + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const top = rings * (segs + 1);
  const cIdx = pos.length / 3; pos.push(0, H - slantTop * 0.5 + 1.5, 0); uv.push(0.5, H / 28);
  for (let i = 0; i < segs; i++) idx.push(top + i, cIdx, top + i + 1);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.setIndex(idx); gg.computeVertexNormals();
  return gg;
}
// 22. Shanghai Tower
export function shanghaiTower() {
  const g = G(), GL = MD('s6sh_glassTeal');
  Cy(g, 14.5, 15, 3, 14, mat('concrete'), 0, 1.5, 0, 6);
  Ms(g, twistGeo(224, 14.2, 0.78, 2.1, 24, 22, 7), GL, 0, 3, 0);
  for (const y of [28, 80, 132, 182]) Ms(g, new THREE.TorusGeometry(11 * (1 - 0.78 * Math.pow(y / 224, 1.15)) + 1.2, 0.35, 4, 22), C(0xaab4bc), 0, y + 3, 0, 1, 1, 1, Math.PI / 2);
  Cy(g, 0.12, 0.45, 8, 5, C(0xc0c8d0), 0, 231, 0, 1);
  return size(g, 30, 30, 238);
}

// 23. Jin Mao: tiered pagoda-like octagonal tower
export function jinMao() {
  const g = G(), SL = mat('s6sh_silver'), dk = C(0x4a5058), pale = shiny(0xd2d8dc, 70);
  Cy(g, 14.8, 15, 3, 12, mat('concrete'), 0, 1.5, 0, 6);
  let y = 3, r = 13.6;
  for (let k = 0; k < 13; k++) {
    const h = 14.4, rn = r * 0.93;
    Cy(g, r * 0.98, r, h, 8, SL, 0, y + h / 2, 0, 8).rotation.y = Math.PI / 8;
    Cy(g, r * 0.97, r * 1.03, 0.9, 8, dk, 0, y + h - 0.2, 0, 4).rotation.y = Math.PI / 8;
    y += h; r = rn;
  }
  Cy(g, r * 1.0, r * 1.05, 4, 8, pale, 0, y + 2, 0, 4);
  Cy(g, 0.2, 1.1, 20, 6, pale, 0, y + 14, 0, 4);
  return size(g, 30, 30, y + 24);
}

// 24. SWFC: "bottle opener" with a trapezoid aperture at the top
export function swfc() {
  const g = G(), H = 205, GL = mat('s6sh_glassGrey'), side = shiny(0x7c8892, 60);
  const sh = new THREE.Shape(); sh.moveTo(-14, 0); sh.lineTo(14, 0); sh.lineTo(10.5, H); sh.lineTo(-10.5, H); sh.closePath();
  const hole = new THREE.Path(); hole.moveTo(-4, H - 52); hole.lineTo(4, H - 52); hole.lineTo(7.2, H - 17); hole.lineTo(-7.2, H - 17); hole.closePath(); sh.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 20, bevelEnabled: false }); geo.translate(0, 3, -10); scaleUV(geo, 1 / 16, 1 / 28);
  g.add(new THREE.Mesh(geo, [GL, side]));
  Cy(g, 14.8, 15, 3, 12, mat('concrete'), 0, 1.5, 0, 6);
  Bx(g, 22, 1.0, 21, C(0x56606a), 0, H + 3.5, 0, 4);
  Bx(g, 7, 0.5, 20.4, glow(0xffe0a0), 0, H - 52 + 3.3, 0, 1);       // sky-deck glow in the aperture
  return size(g, 30, 22, H + 4);
}

// 25. generic Pudong glass towers (opts.variant 0..3)
export function pudongTower(opts = {}) {
  const v = (opts.variant | 0) & 3, g = G();
  const pod = (r) => Cy(g, r, r + 0.4, 3, 12, mat('concrete'), 0, 1.5, 0, 6);
  if (v === 0) {                                  // blue tapered square tower with setback crown
    const GL = mat('s6sh_glassBlue');
    pod(15);
    const a = new THREE.CylinderGeometry(8.5 * Math.SQRT2, 12.5 * Math.SQRT2, 130, 4, 1, true); a.rotateY(Math.PI / 4); scaleUV(flatten(a), 3, 4.6);
    Ms(g, a, GL, 0, 68, 0);
    Bx(g, 14.5, 38, 14.5, GL, 0, 152, 0, 28);
    Bx(g, 9, 14, 9, GL, 0, 178, 0, 28);
    Bx(g, 15.4, 1.2, 15.4, C(0x9aa4ac), 0, 133.6, 0, 4);
    Cy(g, 0.15, 0.7, 24, 5, C(0xb0b8c0), 0, 197, 0, 2);
    return size(g, 30, 30, 209);
  }
  if (v === 1) {                                  // teal cylinder with cone top
    const GL = mat('s6sh_glassTeal');
    pod(15.5);
    Cy(g, 11, 12.5, 150, 16, GL, 0, 78, 0, 28);
    for (const y of [38, 76, 114, 150]) Cy(g, 12.2 - (y / 150) * 1.4, 12.2 - (y / 150) * 1.4, 1.2, 16, C(0xa8b4b8), 0, y + 3, 0, 4);
    Ms(g, new THREE.ConeGeometry(11, 22, 16), shiny(0x4a8a98, 70), 0, 164, 0);
    Cy(g, 0.15, 0.6, 22, 5, C(0xb0b8c0), 0, 186, 0, 2);
    return size(g, 30, 30, 198);
  }
  if (v === 2) {                                  // stacked, rotated golden cubes
    const GL = mat('s6sh_glassGold');
    pod(15);
    for (let i = 0; i < 5; i++) {
      const w = 22 - i * 2.2, h = 32; const b = Bx(g, w, h, w, GL, Math.sin(i * 1.3) * 2.2, 3 + i * 31 + h / 2 - (i ? 1 : 0), Math.cos(i * 1.3) * 2.2, 28);
      b.rotation.y = i * 0.28;
    }
    Bx(g, 8, 6, 8, C(0x8a6a2a), 0, 3 + 4 * 31 + 32 + 2.5, 0, 4).rotation.y = 1.1;
    return size(g, 30, 30, 3 + 4 * 31 + 32 + 6);
  }
  // twin prisms with slanted tops and a sky bridge (red-brown glass)
  const GL = mat('s6sh_glassGold'), H = 188;
  pod(15.5);
  for (const sx of [-1, 1]) {
    const s = new THREE.Shape(); s.moveTo(-7, 0); s.lineTo(7, 0); s.lineTo(7, H); s.lineTo(-7, H - 18); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 11, bevelEnabled: false }); geo.translate(0, 3, -5.5); geo.rotateY(sx > 0 ? Math.PI / 2 : -Math.PI / 2); scaleUV(geo, 1 / 16, 1 / 28);
    const m = new THREE.Mesh(geo, [GL, shiny(0x6a4a3a, 40)]); m.position.set(sx * 8.5, 0, 0); g.add(m);
  }
  Bx(g, 8, 6, 12, C(0x9a8a7a), 0, 150, 0, 4); Bx(g, 8.2, 0.4, 12.2, glow(0xffe0a0), 0, 153.2, 0, 1);
  return size(g, 30, 30, H + 3);
}
