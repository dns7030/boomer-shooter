// Singapore: Marina Bay Sands conference scene, Gardens by the Bay, shophouses, HDB blocks, colonial hotels, finance towers.
// Same conventions as the other building files: origin = footprint centre on the ground, front faces local +Z,
// group.userData = { w, d, h[, cols] }.  Textures are prefixed s6sg_.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, decal, gableRoof } from './geo.js';
import { slab, tiledPlane, sign } from './buildings2.js';
import { addPainters, mulberry, tex } from './textures.js';
import { hall } from './interiors.js';

const G = () => new THREE.Group();
const NEO = 0x00e599;
const size = (g, w, d, h, cols) => { g.userData = { ...g.userData, w, d, h }; if (cols) g.userData.cols = cols; return g; };
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const pick = (r, a) => a[(r() * a.length) | 0];
const C = (hex, e) => color(hex, e === undefined ? {} : { emissive: e });
const glow = (hex) => color(hex, { emissive: hex });
const _m = {};
const keyed = (k, f) => _m[k] || (_m[k] = f());
const shiny = (hex, sh = 60) => keyed(`p${hex}_${sh}`, () => new THREE.MeshPhongMaterial({ color: hex, shininess: sh, specular: 0x666666 }));
const glassM = (hex, op) => keyed(`g${hex}_${op}`, () => new THREE.MeshLambertMaterial({ color: hex, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
const basic = (hex) => keyed(`b${hex}`, () => new THREE.MeshBasicMaterial({ color: hex }));
const basicA = (hex, op) => keyed(`ba${hex}_${op}`, () => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
const alphaMat = (name) => keyed(`a${name}`, () => new THREE.MeshLambertMaterial({ map: tex(name), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
const tint = (name, hex) => keyed(`t${name}${hex}`, () => new THREE.MeshLambertMaterial({ map: tex(name), color: hex }));
const tintA = (name, hex) => keyed(`ta${name}${hex}`, () => new THREE.MeshLambertMaterial({ map: tex(name), color: hex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
const flatMap = (name) => keyed(`f${name}`, () => new THREE.MeshBasicMaterial({ map: tex(name) }));
const flatMapD = (name) => keyed(`fd${name}`, () => new THREE.MeshBasicMaterial({ map: tex(name), side: THREE.DoubleSide }));
const lamb = (name) => keyed(`l${name}`, () => new THREE.MeshLambertMaterial({ map: tex(name), side: THREE.DoubleSide }));
const keep = (m) => { m.userData.keep = true; return m; };

const Bx = (g, w, h, d, m, x, y, z, tile = 3) => { const b = boxT(w, h, d, m, tile); b.position.set(x, y, z); g.add(b); return b; };
const Cy = (g, rt, rb, h, n, m, x, y, z, tile = 3) => { const b = cylT(rt, rb, h, n, m, tile); b.position.set(x, y, z); g.add(b); return b; };
const Ms = (g, geo, m, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); g.add(o); return o;
};
const SPH = (r = 1, a = 12, b = 8) => new THREE.SphereGeometry(r, a, b);
const Sg = (g, m, x, y, z, sx, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0, n = 10) => Ms(g, SPH(1, n, Math.max(4, Math.round(n * 0.6))), m, x, y, z, sx, sy, sz, rx, ry, rz);
const win = (g, w, h, x, y, z, ry = 0, o = {}) => { const d = decal('window', w, h, x, y, z, { c: '#f2efe6', ...o }); d.rotation.y = ry; g.add(d); return d; };
const door = (g, w, h, x, y, z, ry = 0, c = '#4a3a2a') => { const d = decal('door', w, h, x, y, z, { c }); d.rotation.y = ry; g.add(d); return d; };
const flat = (g, m, w, h, x, y, z, ry = 0, rx = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); g.add(p); return p; };
const sgn = (g, text, w, h, x, y, z, ry = 0, o = {}) => { const s = sign(text, w, h, o); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; };

function rod(a, b, r, seg = 5, open = false) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const geo = new THREE.CylinderGeometry(r, r, len, seg, 1, open);
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
const rods = (g, list, r, m, seg = 5) => { const me = new THREE.Mesh(merge(list.map(([a, b]) => rod(a, b, r, seg))), m); g.add(me); return me; };
const boxes = (g, list, m) => {
  const gs = list.map(([w, h, d, x, y, z]) => { const b = new THREE.BoxGeometry(w, h, d); b.translate(x, y, z); return b; });
  const me = new THREE.Mesh(merge(gs), m); g.add(me); return me;
};
const gT = (geo, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => {
  geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)));
  return geo;
};
const mg = (g, list, m) => { const me = new THREE.Mesh(merge(list), m); g.add(me); return me; };
const scaleUV = (geo, k) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k); return geo; };

// hip roof: base rect w x d at y=0, top rect inset by (ix, iz) at y=rise
function hip(w, d, rise, ix, iz, m, tile = 3) {
  const a = [[-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [w / 2, 0, d / 2], [-w / 2, 0, d / 2]];
  const t = [[-w / 2 + ix, rise, -d / 2 + iz], [w / 2 - ix, rise, -d / 2 + iz], [w / 2 - ix, rise, d / 2 - iz], [-w / 2 + ix, rise, d / 2 - iz]];
  const pos = [], uv = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4, A = a[i], B = a[j], Cc = t[j], D = t[i];
    const el = Math.hypot(B[0] - A[0], B[2] - A[2]), sl = Math.hypot(D[0] - A[0], D[1] - A[1], D[2] - A[2]);
    for (const [p, u, v] of [[A, 0, 0], [Cc, el, sl], [B, el, 0], [A, 0, 0], [D, 0, sl], [Cc, el, sl]]) { pos.push(...p); uv.push(u / tile, v / tile); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, m);
}
// stepped collider rectangles approximating an ellipse / dome footprint
function ellCols(cx, cz, rx, rz, h, n = 8, hy = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x0 = -rx + 2 * rx * i / n, x1 = -rx + 2 * rx * (i + 1) / n, xe = Math.max(Math.abs(x0), Math.abs(x1));
    const k = Math.sqrt(Math.max(0, 1 - (xe / rx) ** 2)), zh = rz * k, hh = hy ? Math.min(h, hy * k) : h;
    if (zh > 0.8 && hh > 0.3) out.push([+(cx + x0).toFixed(2), +(cx + x1).toFixed(2), +(cz - zh).toFixed(2), +(cz + zh).toFixed(2), +hh.toFixed(2)]);
  }
  return out;
}
const tubeMesh = (pts, r, seg, rad, m) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, rad, false), m);

// ---------- textures ----------
const noise = (g, w, h, r, n, cols, s = 1) => { for (let i = 0; i < n; i++) R(g, (r() * w) | 0, (r() * h) | 0, s, s, pick(r, cols)); };
const SH = [
  ['#f2b6c4', '#fff4e4', '#2f8a6a'], ['#a8dcc8', '#fffbea', '#c44a4a'], ['#f6dc84', '#ffffff', '#2b6aa0'],
  ['#9acbe9', '#fff6e0', '#d9714a'], ['#f49a7c', '#fff0d8', '#2f7a5a'], ['#c4b0e0', '#fff8ec', '#d4a030'],
];
function shopUpper(g, w, h, [base, trim, shut], seed) {            // 72x56: two storeys, three 3 m bays (period 24 px)
  const r = mulberry(seed); R(g, 0, 0, w, h, base);
  noise(g, w, h, r, 120, ['rgba(0,0,0,.05)', 'rgba(255,255,255,.08)']);
  for (let f = 0; f < 2; f++) {
    const y0 = f * 28;
    R(g, 0, y0 + 26, w, 2, trim); R(g, 0, y0 + 28 - 1, w, 1, 'rgba(0,0,0,.15)');
    for (let b = 0; b < 3; b++) {
      const x = b * 24 + 4, open = (b + f + seed) % 2 === 0;
      R(g, x - 1, y0 + 3, 18, 22, trim);
      R(g, x, y0 + 5, 16, 19, open ? '#243441' : shut);
      g.fillStyle = trim; g.beginPath(); g.arc(x + 8, y0 + 6, 8, Math.PI, 0); g.fill();
      g.fillStyle = open ? '#243441' : shut; g.beginPath(); g.arc(x + 8, y0 + 6, 7, Math.PI, 0); g.fill();
      if (open) { R(g, x, y0 + 5, 3, 19, shut); R(g, x + 13, y0 + 5, 3, 19, shut); R(g, x + 3, y0 + 10, 10, 1, 'rgba(255,255,255,.25)'); R(g, x + 6, y0 + 18, 4, 5, '#cfd8dc'); }
      else { for (let k = y0 + 3; k < y0 + 24; k += 2) R(g, x, k, 16, 1, 'rgba(0,0,0,.3)'); R(g, x + 7, y0 + 3, 2, 21, 'rgba(0,0,0,.25)'); }
      R(g, x - 2, y0 + 25, 20, 1, 'rgba(0,0,0,.2)');
    }
  }
  R(g, 0, 0, w, 2, trim);
  for (let x = 2; x < w; x += 6) R(g, x, 2, 2, 2, '#d8b84a');                     // tile frieze
}
function shopGround(g, w, h, [base, trim, shut], seed) {           // 72x34: a 9 m shop front (4.2 m)
  const r = mulberry(seed); R(g, 0, 0, w, h, base);
  noise(g, w, h, r, 100, ['rgba(0,0,0,.05)', 'rgba(255,255,255,.08)']);
  const tilesC = ['#2aa6a0', '#e8668a', '#f2c230', '#3a8a4a'];
  for (let x = 0; x < w; x += 6) for (let y = h - 8; y < h; y += 4) { R(g, x, y, 6, 4, tilesC[((x / 6) + (y / 4)) % 4 | 0]); R(g, x + 2, y + 1, 2, 2, trim); }
  const door = seed % 3, xs = [6, 27, 48];
  for (let i = 0; i < 3; i++) {
    const x = xs[i];
    if (i === door) { R(g, x - 1, 8, 20, 18, trim); R(g, x, 9, 18, 17, '#4a2a14'); R(g, x + 8, 9, 2, 17, '#2a1608'); R(g, x + 2, 11, 5, 10, '#6a3c1c'); R(g, x + 11, 11, 5, 10, '#6a3c1c'); R(g, x, 6, 18, 3, trim); }
    else { R(g, x - 1, 8, 20, 18, trim); R(g, x, 9, 18, 17, i % 2 ? '#c8ccd0' : '#e8dcc0'); for (let k = 9; k < 26; k += 2) R(g, x, k, 18, 1, 'rgba(0,0,0,.3)'); R(g, x, 25, 18, 1, shut); }
  }
  R(g, 0, 0, w, 6, trim); R(g, 0, 5, w, 1, 'rgba(0,0,0,.2)');
  g.fillStyle = '#d02020'; for (const x of [12, 36, 60]) { g.beginPath(); g.arc(x, 3, 2, 0, 6.3); g.fill(); }
}
function glassGrid(g, c1, c2, mull, spand, seed, stepY = 8, stepX = 16) {
  const r = mulberry(seed); R(g, 0, 0, 64, 64, c1);
  for (let y = 0; y < 64; y += stepY) {
    R(g, 0, y, 64, stepY - 2, c2); R(g, 0, y + stepY - 2, 64, 2, spand);
    R(g, 0, y, 64, 1, 'rgba(255,255,255,.28)');
    for (let x = 0; x < 64; x += stepX) if (r() < 0.55) R(g, x + 1, y + 1, stepX - 2, stepY - 4, 'rgba(255,255,255,.07)');
  }
  for (let x = 0; x < 64; x += stepX) R(g, x, 0, 1, 64, mull);
}
function ledPanel(g, w, h, a, b, text, sub, mode) {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = mulberry(w + text.length);
  if (mode === 0) { for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(255,255,255,${0.06 + r() * 0.1})`; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(0, r() * h); g.bezierCurveTo(w * 0.3, r() * h, w * 0.6, r() * h, w, r() * h); g.stroke(); } }
  if (mode === 1) { g.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 0; x < w; x += 6) { const bh = 4 + r() * h * 0.5; g.fillRect(x, h - bh, 4, bh); } }
  if (mode === 2) { g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; for (let i = 1; i < 6; i++) { g.beginPath(); g.ellipse(w * 0.78, h * 0.5, h * 0.12 * i, h * 0.45, 0, 0, 6.3); g.stroke(); g.beginPath(); g.moveTo(w * 0.78 - h * 0.7, h * (i / 6)); g.lineTo(w * 0.78 + h * 0.7, h * (i / 6)); g.stroke(); } }
  if (mode === 3) { for (let i = 0; i < 30; i++) { g.fillStyle = pick(r, ['rgba(255,255,255,.2)', 'rgba(0,229,153,.35)', 'rgba(255,200,60,.3)']); g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 8, 0, 6.3); g.fill(); } }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  g.font = `bold ${Math.round(h * 0.27)}px Arial, Helvetica, sans-serif`; g.fillText(text, w / 2, h * 0.42);
  g.font = `bold ${Math.round(h * 0.12)}px Arial, Helvetica, sans-serif`; g.fillStyle = '#00E599'; g.fillText(sub, w / 2, h * 0.72);
  R(g, w * 0.2, h * 0.84, w * 0.6, Math.max(2, h * 0.03), '#00E599');
}
function flagTex(g, w, h, k) {
  const d = [
    () => { R(g, 0, 0, w, h / 3, '#d62828'); R(g, 0, h / 3, w, h / 3, '#fff'); R(g, 0, 2 * h / 3, w, h / 3, '#2a4fb0'); },
    () => { R(g, 0, 0, w / 3, h, '#1a8a4a'); R(g, w / 3, 0, w / 3, h, '#fff'); R(g, 2 * w / 3, 0, w / 3, h, '#d62828'); },
    () => { R(g, 0, 0, w, h, '#d62828'); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.28, 0, 6.3); g.fill(); },
    () => { R(g, 0, 0, w, h, '#1e50a8'); R(g, 0, h * 0.42, w, h * 0.16, '#f4c820'); R(g, w * 0.3, 0, w * 0.16, h, '#f4c820'); },
    () => { R(g, 0, 0, w, h / 2, '#d62828'); R(g, 0, h / 2, w, h / 2, '#fff'); g.fillStyle = '#fff'; g.beginPath(); g.arc(w * 0.2, h * 0.25, h * 0.14, 0, 6.3); g.fill(); },
    () => { R(g, 0, 0, w, h, '#f4c820'); g.fillStyle = '#1a8a4a'; g.beginPath(); g.moveTo(w / 2, h * 0.1); g.lineTo(w * 0.9, h / 2); g.lineTo(w / 2, h * 0.9); g.lineTo(w * 0.1, h / 2); g.fill(); g.fillStyle = '#2a4fb0'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.2, 0, 6.3); g.fill(); },
    () => { R(g, 0, 0, w, h, '#1a2a6a'); g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke(); R(g, 0, h * 0.42, w, h * 0.16, '#d62828'); },
    () => { for (let i = 0; i < 7; i++) R(g, 0, i * h / 7, w, h / 7 + 1, i % 2 ? '#fff' : '#d62828'); R(g, 0, 0, w * 0.42, h * 0.55, '#2a4fb0'); },
  ];
  d[k % d.length]();
  R(g, 0, 0, 1, h, 'rgba(0,0,0,.2)');
}

const P = {};
SH.forEach((c, i) => { P[`s6sg_shU${i}`] = (g, w, h) => shopUpper(g, w, h, c, 600 + i); P[`s6sg_shG${i}`] = (g, w, h) => shopGround(g, w, h, c, 610 + i); });
for (let i = 0; i < 8; i++) P[`s6sg_flag${i}`] = (g, w, h) => flagTex(g, w, h, i);
[['#102a6a', '#1aa6c8', 'FUTURE SUMMIT', 'SINGAPORE 2026', 0], ['#3a0e5a', '#ff4a8a', 'KEYNOTE', 'MAIN STAGE', 1], ['#06323a', '#1a9a6a', 'WELCOME', 'DELEGATES', 2], ['#14264a', '#e8742a', 'CONFERENCE', 'INNOVATION DAY', 3]]
  .forEach(([a, b, t, s, m], i) => { P[`s6sg_led${i}`] = (g, w, h) => ledPanel(g, w, h, a, b, t, s, m); });
Object.assign(P, {
  s6sg_mbsGlass(g) {
    const r = mulberry(601); R(g, 0, 0, 64, 64, '#6f93ad');
    for (let y = 0; y < 64; y += 8) { R(g, 0, y, 64, 6, '#8fb4cc'); R(g, 0, y + 6, 64, 2, '#e8eef2'); R(g, 0, y, 64, 1, 'rgba(255,255,255,.35)'); for (let x = 0; x < 64; x += 16) if (r() < 0.4) R(g, x + 1, y + 1, 14, 4, 'rgba(255,255,255,.12)'); }
    for (let x = 0; x < 64; x += 16) R(g, x, 0, 1, 64, 'rgba(240,244,246,.85)');
  },
  s6sg_glassA: (g) => glassGrid(g, '#3f78a8', '#6aa6d0', '#cfe0ec', '#2a4f70', 602),
  s6sg_glassB: (g) => glassGrid(g, '#2a4a52', '#4f8a96', '#aab8bc', '#1c3036', 603, 8, 32),
  s6sg_glassC: (g) => glassGrid(g, '#8a7a5a', '#c8b88a', '#f0e8d0', '#5a4a30', 604, 6, 16),
  s6sg_glassD: (g) => glassGrid(g, '#2e3e66', '#5a78b0', '#b8c4dc', '#1c2640', 605, 4, 8),
  s6sg_carpet(g) {
    const r = mulberry(606); R(g, 0, 0, 64, 64, '#2a3550');
    for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { R(g, x + 1, y + 1, 14, 14, ((x + y) / 16) % 2 ? '#303d5c' : '#27304a'); R(g, x + 7, y + 7, 2, 2, '#3f9a8a'); }
    noise(g, 64, 64, r, 200, ['rgba(255,255,255,.04)', 'rgba(0,0,0,.08)']);
  },
  s6sg_hallWall(g) {
    const r = mulberry(607); R(g, 0, 0, 64, 64, '#c9ced2');
    for (let x = 0; x < 64; x += 16) { R(g, x, 0, 1, 64, 'rgba(0,0,0,.2)'); R(g, x + 2, 6, 12, 50, '#b9c0c6'); }
    R(g, 0, 58, 64, 6, '#3a4658'); R(g, 0, 0, 64, 4, '#e8ecee'); R(g, 0, 57, 64, 1, '#00E599');
    noise(g, 64, 64, r, 100, ['rgba(0,0,0,.05)', 'rgba(255,255,255,.1)']);
  },
  s6sg_ceil(g) {
    R(g, 0, 0, 64, 64, '#262b33');
    for (let i = 0; i < 64; i += 16) { R(g, i, 0, 1, 64, '#3a414c'); R(g, 0, i, 64, 1, '#3a414c'); }
    for (let y = 8; y < 64; y += 16) for (let x = 8; x < 64; x += 16) R(g, x - 2, y - 2, 4, 4, '#4a5260');
  },
  s6sg_hallOuter(g) {
    const r = mulberry(608); R(g, 0, 0, 64, 64, '#e6e9ea');
    for (let x = 0; x < 64; x += 16) { R(g, x, 0, 1, 64, 'rgba(0,0,0,.18)'); R(g, x + 1, 0, 1, 64, 'rgba(255,255,255,.4)'); }
    for (let y = 0; y < 64; y += 32) R(g, 0, y, 64, 1, 'rgba(0,0,0,.18)');
    R(g, 0, 56, 64, 8, '#5a6672'); noise(g, 64, 64, r, 60, ['rgba(0,0,0,.05)']);
  },
  s6sg_chairRow(g) {
    R(g, 0, 0, 64, 64, '#1c2230');
    for (let i = 0; i < 2; i++) { R(g, 3 + i * 32, 6, 26, 20, '#4a5878'); R(g, 5 + i * 32, 8, 22, 16, '#5a6a8c'); R(g, 3 + i * 32, 28, 26, 6, '#2a3248'); R(g, 3 + i * 32, 38, 26, 22, '#4a5878'); R(g, 5 + i * 32, 40, 22, 18, '#5a6a8c'); }
  },
  s6sg_tile(g) {
    const r = mulberry(609); R(g, 0, 0, 64, 64, '#b4573a');
    for (let y = 0; y < 64; y += 8) { R(g, 0, y + 6, 64, 2, 'rgba(60,20,10,.45)'); for (let x = (y / 8 % 2) * 4; x < 64; x += 8) R(g, x, y, 1, 6, 'rgba(60,20,10,.4)'); }
    noise(g, 64, 64, r, 140, ['rgba(255,200,150,.14)', 'rgba(60,20,10,.18)']);
  },
  s6sg_redRoof(g) {
    const r = mulberry(620); R(g, 0, 0, 64, 64, '#a8362a');
    for (let x = 0; x < 64; x += 8) { R(g, x, 0, 1, 64, 'rgba(50,10,5,.5)'); R(g, x + 4, 0, 1, 64, 'rgba(255,170,140,.15)'); }
    noise(g, 64, 64, r, 120, ['rgba(0,0,0,.14)', 'rgba(255,160,130,.12)']);
  },
  s6sg_archBay(g, w, h) {
    g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.beginPath();
    g.rect(0, 0, w, 20); g.moveTo(4, h); g.lineTo(4, 30); g.arc(w / 2, 30, w / 2 - 4, Math.PI, 0); g.lineTo(w - 4, h); g.closePath(); g.fill('evenodd');
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 19, w, 1); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; g.beginPath(); g.arc(w / 2, 30, w / 2 - 4, Math.PI, 0); g.stroke();
    g.fillStyle = '#e8d070'; g.beginPath(); g.arc(w / 2, 8, 3, 0, 6.3); g.fill();
  },
  s6sg_hdb0: (g) => hdbTex(g, '#f0e6cc', '#e8903a', '#b8d6e8', 611),
  s6sg_hdb1: (g) => hdbTex(g, '#dfeaf2', '#f2c230', '#6aa0c8', 612),
  s6sg_hdb2: (g) => hdbTex(g, '#f4d8d8', '#2a9a96', '#e8788a', 613),
  s6sg_hdbBack(g) {
    const r = mulberry(614); R(g, 0, 0, 64, 64, '#e4dccb');
    for (let f = 0; f < 2; f++) { const y0 = f * 32;
      R(g, 0, y0 + 26, 64, 6, '#c8c0ae'); R(g, 0, y0 + 24, 64, 2, '#8a8a88');
      for (let x = 0; x < 64; x += 2) R(g, x, y0 + 14, 1, 10, '#9a9a96');
      R(g, 0, y0 + 13, 64, 1, '#8a8a88');
      for (let b = 0; b < 2; b++) { R(g, b * 32 + 6, y0 + 4, 8, 20, pick(r, ['#5a7a9a', '#9a5a4a', '#4a7a5a', '#8a7a3a'])); R(g, b * 32 + 18, y0 + 6, 6, 8, '#2a3a46'); R(g, b * 32 + 18, y0 + 6, 6, 2, '#b8c8d0'); }
    }
    noise(g, 64, 64, r, 100, ['rgba(0,0,0,.06)', 'rgba(255,255,255,.1)']);
  },
  s6sg_limestone(g) {
    const r = mulberry(615); R(g, 0, 0, 64, 64, '#e2d6b8');
    for (let y = 0; y < 64; y += 16) { R(g, 0, y, 64, 1, 'rgba(110,90,60,.45)'); for (let x = (y / 16 % 2) * 16; x < 64; x += 32) R(g, x, y, 1, 16, 'rgba(110,90,60,.35)'); }
    noise(g, 64, 64, r, 220, ['rgba(120,100,60,.12)', 'rgba(255,255,240,.18)']);
  },
  s6sg_colWall(g) {
    const r = mulberry(616); R(g, 0, 0, 64, 64, '#f4f1ea');
    for (let y = 0; y < 64; y += 8) R(g, 0, y, 64, 1, 'rgba(0,0,0,.07)');
    noise(g, 64, 64, r, 100, ['rgba(120,110,90,.07)', 'rgba(255,255,255,.2)']);
  },
  s6sg_lotus(g) {
    const r = mulberry(617); R(g, 0, 0, 64, 64, '#e9e6de');
    for (let x = 0; x < 64; x += 8) { R(g, x, 0, 1, 64, 'rgba(90,90,80,.22)'); R(g, x + 1, 0, 1, 64, 'rgba(255,255,255,.4)'); }
    for (let y = 8; y < 64; y += 16) R(g, 0, y, 64, 2, 'rgba(70,90,110,.35)');
    noise(g, 64, 64, r, 140, ['rgba(80,80,70,.08)']);
  },
  s6sg_trunk(g) {
    const r = mulberry(618); R(g, 0, 0, 64, 64, '#8a8c86');
    for (let x = 0; x < 64; x += 4) { R(g, x, 0, 1, 64, 'rgba(0,0,0,.18)'); }
    for (let i = 0; i < 26; i++) { const x = (r() * 60) | 0, y = (r() * 56) | 0, w = 3 + ((r() * 6) | 0), h = 6 + ((r() * 24) | 0); R(g, x, y, w, h, pick(r, ['#3d7a3a', '#2f6a30', '#4a8a3c', '#2a5a2a'])); if (r() < 0.4) R(g, x + 1, y + 2, 2, 2, pick(r, ['#e8408a', '#f08a20', '#a050d0', '#f0e040'])); }
    noise(g, 64, 64, r, 100, ['rgba(0,0,0,.1)']);
  },
  s6sg_leaf(g) {
    const r = mulberry(619); g.clearRect(0, 0, 64, 64);
    for (let i = 0; i < 90; i++) { g.fillStyle = pick(r, ['#2f7a34', '#3f9a3c', '#58b04a', '#236a2c']); const x = r() * 64, y = r() * 64; g.beginPath(); g.ellipse(x, y, 2 + r() * 3.5, 1.5 + r() * 2.5, r() * 3, 0, 6.3); g.fill(); }
    for (let i = 0; i < 6; i++) { g.fillStyle = pick(r, ['#e8408a', '#f08a20', '#c060e0']); g.fillRect((r() * 62) | 0, (r() * 62) | 0, 3, 3); }
  },
  s6sg_frond(g, w, h) {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#3a6a28'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    for (let x = 2; x < w - 2; x += 3) { const l = (h / 2 - 1) * Math.sin((1 - x / w) * 2.2 + 0.4) * 0.95; g.strokeStyle = x % 6 ? '#3f8a30' : '#58a83c'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, h / 2); g.lineTo(x + 3, h / 2 - l); g.moveTo(x, h / 2); g.lineTo(x + 3, h / 2 + l); g.stroke(); }
  },
  s6sg_scales(g) {
    const r = mulberry(621); R(g, 0, 0, 64, 64, '#e4e8ea');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 9; x++) { g.fillStyle = (x + y) % 3 ? '#d6dcdf' : '#eef1f2'; g.beginPath(); g.arc(x * 8 + (y % 2 ? 4 : 0), y * 4, 4.2, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(90,110,120,.35)'; g.lineWidth = 1; g.stroke(); }
    noise(g, 64, 64, r, 60, ['rgba(0,0,0,.05)']);
  },
  s6sg_stripe(g) { for (let i = 0; i < 8; i++) R(g, i * 4, 0, 4, 32, i % 2 ? '#f4f0e4' : '#e0472f'); R(g, 0, 28, 32, 4, 'rgba(0,0,0,.2)'); },
  s6sg_stripeG(g) { for (let i = 0; i < 8; i++) R(g, i * 4, 0, 4, 32, i % 2 ? '#f4f0e4' : '#1f9a6a'); R(g, 0, 28, 32, 4, 'rgba(0,0,0,.2)'); },
  s6sg_deckWood(g) {
    const r = mulberry(622); R(g, 0, 0, 64, 64, '#a9814f');
    for (let y = 0; y < 64; y += 8) { R(g, 0, y, 64, 1, 'rgba(40,20,5,.45)'); }
    noise(g, 64, 64, r, 140, ['rgba(60,30,10,.2)', 'rgba(255,220,170,.12)']);
  },
  s6sg_tent(g) { for (let i = 0; i < 8; i++) R(g, i * 4, 0, 4, 32, i % 2 ? '#ffffff' : '#18a878'); R(g, 0, 28, 32, 4, 'rgba(0,0,0,.18)'); },
  s6sg_paver(g) {
    const r = mulberry(623); R(g, 0, 0, 64, 64, '#c9c1b2');
    for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { R(g, x, y, 16, 1, 'rgba(0,0,0,.18)'); R(g, x, y, 1, 16, 'rgba(0,0,0,.18)'); }
    noise(g, 64, 64, r, 100, ['rgba(0,0,0,.05)', 'rgba(255,255,255,.1)']);
  },
});
function hdbTex(g, wall, stripe, glassC, seed) {                   // 64x64 = 6 m x 6 m: two floors, two 3 m bays
  const r = mulberry(seed); R(g, 0, 0, 64, 64, wall);
  for (let f = 0; f < 2; f++) {
    const y0 = f * 32;
    R(g, 0, y0 + 29, 64, 3, stripe); R(g, 0, y0 + 28, 64, 1, 'rgba(0,0,0,.18)');
    for (let b = 0; b < 2; b++) {
      const x = b * 32;
      R(g, x + 3, y0 + 4, 12, 17, '#8a8f94'); R(g, x + 4, y0 + 5, 10, 15, glassC); R(g, x + 9, y0 + 5, 1, 15, '#8a8f94'); R(g, x + 4, y0 + 5, 10, 3, 'rgba(255,255,255,.35)');
      R(g, x + 18, y0 + 14, 12, 14, 'rgba(0,0,0,.14)');                                          // balcony recess
      R(g, x + 18, y0 + 20, 12, 8, stripe); R(g, x + 19, y0 + 21, 10, 6, wall);
      for (let k = 0; k < 12; k += 3) R(g, x + 18 + k, y0 + 15, 1, 5, '#6a6e70');
      R(g, x + 18, y0 + 14, 12, 1, '#6a6e70');
      if (r() < 0.5) R(g, x + 20, y0 + 16, 8, 1, pick(r, ['#e84a6a', '#4a8ae8', '#f2c230', '#fff']));
    }
  }
  R(g, 0, 0, 3, 64, 'rgba(255,255,255,.35)');
}
addPainters(P, {
  s6sg_shU0: [72, 56], s6sg_shU1: [72, 56], s6sg_shU2: [72, 56], s6sg_shU3: [72, 56], s6sg_shU4: [72, 56], s6sg_shU5: [72, 56],
  s6sg_shG0: [72, 34], s6sg_shG1: [72, 34], s6sg_shG2: [72, 34], s6sg_shG3: [72, 34], s6sg_shG4: [72, 34], s6sg_shG5: [72, 34],
  s6sg_flag0: [48, 32], s6sg_flag1: [48, 32], s6sg_flag2: [48, 32], s6sg_flag3: [48, 32], s6sg_flag4: [48, 32], s6sg_flag5: [48, 32], s6sg_flag6: [48, 32], s6sg_flag7: [48, 32],
  s6sg_led0: [128, 64], s6sg_led1: [128, 64], s6sg_led2: [128, 64], s6sg_led3: [128, 64],
  s6sg_archBay: [48, 64], s6sg_frond: [64, 24], s6sg_stripe: [32, 32], s6sg_stripeG: [32, 32], s6sg_tent: [32, 32],
});

// =====================================================================
// 1. Marina Bay Sands: three leaning towers + SkyPark
// =====================================================================
const shearZ = (geo, k) => { geo.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, 0, k, 1, 0, 0, 0, 0, 1)); return geo; };
function hullShape(pts) { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; }
export function marinaBaySands() {
  const g = G(), glass = mat('s6sg_mbsGlass'), conc = mat('concrete'), TH = 112, lean = 5.5 / TH, cxs = [-34, 0, 34];
  cxs.forEach((cx, i) => {
    for (const s of [1, -1]) {
      const m = boxT(s > 0 ? 27 : 26.7, TH, 14, glass, 8);
      m.geometry.translate(0, TH / 2, 0); shearZ(m.geometry, -s * lean);
      m.position.set(cx, 0, s * 9.5); g.add(m);
    }
    Bx(g, 26.2, 52, 5.2, glass, cx, 26, 0, 8);
    // roof crowns: little white caps on each tower top
    Bx(g, 24, 0.5, 12, C(0xe8eef2), cx, TH + 0.25, 0, 3);
  });
  // ---- SkyPark ----
  const deckPts = [[-55, 0], [-49, 8.2], [30, 8.8], [48, 8.2], [55, 0], [48, -8.2], [30, -8.8], [-49, -8.2]];
  const hullPts = [[-48, 0], [-42, 6.0], [40, 6.4], [47, 0], [40, -6.4], [-42, -6.0]];
  const deck = new THREE.Mesh(scaleUV(new THREE.ExtrudeGeometry(hullShape(deckPts), { depth: 2.8, bevelEnabled: false }), 0.1), mat('s6sg_hallOuter'));
  deck.rotation.x = -Math.PI / 2; deck.position.y = 112.2; g.add(deck);                       // y 112.2..115, shape y -> -z
  const hull = new THREE.Mesh(scaleUV(new THREE.ExtrudeGeometry(hullShape(hullPts), { depth: 2.6, bevelEnabled: false }), 0.1), mat('s6sg_hallOuter'));
  hull.rotation.x = -Math.PI / 2; hull.position.y = 109.6; g.add(hull);
  Bx(g, 62, 0.22, 0.22, glow(NEO), 3, 113.6, 8.95, 1);                                          // neo accent strip on the deck edge
  // top surface: pale paving, infinity pool, wood decks, hedges
  Bx(g, 90, 0.12, 14.6, mat('s6sg_paver'), 2, 115.06, 0, 3);
  Bx(g, 52, 0.18, 3.8, C(0xf4f4f0), 8, 115.1, 4.8, 1); Bx(g, 51.2, 0.2, 3.0, basic(0x38c8dc), 8, 115.12, 4.8, 1);
  Bx(g, 12, 0.14, 4, mat('s6sg_deckWood'), -34, 115.1, 0, 3); Bx(g, 14, 0.14, 4, mat('s6sg_deckWood'), -9, 115.1, -3.5, 3);
  Bx(g, 80, 0.8, 0.14, glassM(0xbfe4ee, 0.5), 0, 115.5, 8.3, 1);                              // glass edge screen
  const trunks = [], crowns = [], r = mulberry(31);
  for (let i = 0; i < 26; i++) {
    const x = -44 + i * 3.6 + r() * 1.2, z = (i % 3 - 1) * 4.2 - 1.2 + r(), hh = 2.2 + r() * 2.4;
    if (x > -24 && x < 34 && z > 2.5) continue;
    trunks.push(gT(new THREE.CylinderGeometry(0.1, 0.16, hh, 5), x, 115.1 + hh / 2, z));
    crowns.push(gT(SPH(1, 7, 5), x, 115.1 + hh + 0.5, z, 1.4 + r() * 0.8, 1.0 + r() * 0.5, 1.4 + r() * 0.8));
  }
  mg(g, trunks, C(0x5a4a38)); mg(g, crowns, tint('s6sg_leaf', 0x6fb85a));
  for (const x of [-46, 46]) Sg(g, C(0x2f7a34), x, 116.4, 0, 2.0, 1.6, 2.0, 0, 0, 0, 8);
  Bx(g, 8, 1.2, 4.2, C(0xe8eef2), 40, 115.7, -1, 2);                                           // service pavilion
  // ---- podium, lobby, entrance canopy ----
  const cols = [];
  cxs.forEach((cx) => cols.push([cx - 13.5, cx + 13.5, -16.5, 16.5, TH]));
  for (const cx of [-34, 34]) {
    Bx(g, 27, 9, 5, conc, cx, 4.5, 18.5, 3); cols.push([cx - 13.5, cx + 13.5, 16, 21, 9]);
    Bx(g, 27.4, 0.5, 5.4, C(0xe8eef2), cx, 9.25, 18.5, 2);
    flat(g, glassM(0x7fb4d4, 0.85), 24, 4.6, cx, 5.0, 21.08);
    for (let k = -3; k <= 3; k++) Bx(g, 0.18, 4.7, 0.12, C(0xeef2f4), cx + k * 4, 5.0, 21.14, 1);
    sgn(g, cx < 0 ? 'CONFERENCE' : 'REGISTRATION', 9, 1.3, cx, 7.8, 21.1, 0, { bg: '#0e2a4a', fg: '#ffffff', border: '#00E599' });
  }
  Bx(g, 22, 9, 3.2, glassM(0x7fb4d4, 0.9), 0, 4.5, 17.6, 3); cols.push([-11, 11, 16, 19.2, 9]);
  Bx(g, 22.4, 0.5, 3.6, C(0xe8eef2), 0, 9.25, 17.6, 2);
  Bx(g, 28, 0.6, 2.6, C(0xe8eef2), 0, 8.2, 19.6, 2);                                           // entrance canopy slab (above head height)
  for (const x of [-12, -4, 4, 12]) { Cy(g, 0.32, 0.36, 7.9, 8, conc, x, 3.95, 20.6, 2); cols.push([x - 0.4, x + 0.4, 20.2, 21, 8]); }
  sgn(g, 'FUTURE SUMMIT', 14, 1.6, 0, 6.2, 19.3, 0, { bg: '#0e2a4a', fg: '#ffffff', border: '#00E599' });
  sgn(g, 'WELCOME', 6, 0.9, 0, 1.2 + 0.6, 19.25, 0, { bg: '#0e2a4a', fg: '#00E599' });
  door(g, 3, 3.4, -4, 1.7, 19.28, 0, '#3a4a58'); door(g, 3, 3.4, 4, 1.7, 19.28, 0, '#3a4a58');
  return size(g, 110, 42, 120, cols);
}

// =====================================================================
// 2. Convention hall (enterable)
// =====================================================================
function chairBlock(g, cols, x0, x1, z0, z1, rowsAlong = 'z') {
  const w = x1 - x0, d = z1 - z0, n = Math.max(1, Math.floor(w / 1.1));
  for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * w / n; Bx(g, 0.7, 0.55, d, mat('s6sg_chairRow'), x, 0.28, (z0 + z1) / 2, 1.1); Bx(g, 0.18, 0.55, d, mat('s6sg_chairRow'), x + 0.32, 0.8, (z0 + z1) / 2, 1.1); }
  cols.push([x0, x1, z0, z1, 1.1]);
}
function roundTable(g, cols, x, z) {
  Cy(g, 0.12, 0.2, 0.85, 6, C(0x2a2e34), x, 0.43, z, 1); Cy(g, 1.05, 1.05, 0.08, 12, C(0xf4f4f0), x, 0.88, z, 1);
  Cy(g, 1.12, 1.35, 0.8, 12, C(0xf0f4f6), x, 0.45, z, 1);
  Cy(g, 0.12, 0.12, 0.5, 5, C(0x00a878), x, 1.15, z, 1);
  const ch = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ch.push(gT(new THREE.BoxGeometry(0.5, 0.5, 0.5), x + Math.cos(a) * 1.75, 0.28, z + Math.sin(a) * 1.75, 1, 1, 1, 0, -a, 0)); }
  mg(g, ch, C(0x3a4660));
  cols.push([x - 1.5, x + 1.5, z - 1.5, z + 1.5, 1.2]);
}
export function mbsConferenceHall() {
  const W = 60, D = 36, H = 18, CH = 14, T = 1.2, g = G(), cols = [];
  const base = hall({ w: W, d: D, h: H, ch: CH, t: T, outer: 's6sg_hallOuter', inner: 's6sg_hallWall', floor: 's6sg_carpet', ceil: 's6sg_ceil', roof: 'concrete', tile: 6,
    doors: [{ side: 'S', at: 0, w: 9, h: 6 }, { side: 'N', at: 0, w: 9, h: 6 }, { side: 'E', at: 0, w: 7, h: 5.2 }] });
  g.add(base); cols.push(...base.userData.cols);
  const ix = base.userData.inside, dk = C(0x20252c);
  Bx(g, ix.x1 - ix.x0, 0.05, ix.z1 - ix.z0, mat('s6sg_carpet'), 0, 0.025, 0, 8);                 // solid carpet slab (floor plane alone sorts under the ground)
  // ---- exterior ----
  Bx(g, W + 1.2, 0.8, D + 1.2, C(0xc8ced2), 0, H + 0.4, 0, 3);
  Bx(g, 9.6, 0.5, 2.2, C(0xf4f6f6), 0, 6.5, D / 2 + 0.9, 2);                                   // door canopies (above head height)
  Bx(g, 9.6, 0.5, 2.2, C(0xf4f6f6), 0, 6.5, -D / 2 - 0.9, 2);
  for (const z of [D / 2 + 0.06, -D / 2 - 0.06]) {
    const ry = z > 0 ? 0 : Math.PI;
    flat(g, flatMap('s6sg_led0'), 12, 4, -17, 12.5, z, ry); flat(g, flatMap('s6sg_led1'), 12, 4, 17, 12.5, z, ry);
    sgn(g, z > 0 ? 'FUTURE SUMMIT' : 'WELCOME', 12, 1.8, 0, 12.5, z, ry, { bg: '#0e2a4a', fg: '#ffffff', border: '#00E599' });
    Bx(g, 12.4, 0.12, 0.12, glow(NEO), 0, 11.3, z + (z > 0 ? 0.06 : -0.06), 1);
  }
  for (const s of [-1, 1]) sgn(g, 'KEYNOTE', 8, 1.5, s * (W / 2 + 0.06), 12.5, -8, s * Math.PI / 2, { bg: '#3a0e5a', fg: '#ffffff' });
  sgn(g, 'EXHIBITION', 6, 1.2, W / 2 + 0.07, 8.4, 0, Math.PI / 2, { bg: '#0e2a4a', fg: '#ffffff' });
  for (let i = 0; i < 4; i++) { const x = -22 + i * 14.7; Bx(g, 5, 2.4, 0.14, glassM(0x6aa0c8, 0.9), x, 9.2, D / 2 + 0.03, 1); }
  for (const s of [-1, 1]) for (const z of [-D / 2 + 0.1, D / 2 - 0.1]) Bx(g, 0.6, H, 0.6, C(0xdfe4e6), s * (W / 2 + 0.05), H / 2, z, 1);
  // ---- interior ----
  Bx(g, 7, 1.2, 26, C(0x2a3040), ix.x0 + 3.5, 0.6, 0, 3); cols.push([ix.x0, ix.x0 + 7, -13, 13, 1.2]);
  Bx(g, 6.9, 0.06, 25.9, mat('s6sg_carpet'), ix.x0 + 3.5, 1.23, 0, 3);
  Bx(g, 0.3, 9.2, 25.4, dk, ix.x0 + 0.25, 5.6, 0, 3);                                         // frame behind the LED wall
  flat(g, flatMap('s6sg_led0'), 24, 8.6, ix.x0 + 0.42, 5.6, 0, Math.PI / 2);
  for (const z of [-15, 15]) flat(g, flatMap('s6sg_led2'), 2.6, 5, ix.x0 + 0.1, 4, z, Math.PI / 2);
  Bx(g, 0.9, 1.1, 2.2, C(0xf4f4f0), ix.x0 + 5.0, 1.8, -4, 1); cols.push([ix.x0 + 4.5, ix.x0 + 5.5, -5.1, -2.9, 2.4]);   // lectern
  sgn(g, 'KEYNOTE', 2, 0.7, ix.x0 + 5.5, 1.7, -4, Math.PI / 2, { bg: '#0e2a4a', fg: '#00E599' });
  // truss with lights
  const lamps = [];
  for (const x of [-12, 0, 12, 24]) { Bx(g, 0.5, 0.5, ix.z1 - ix.z0 - 2, dk, x, CH - 1.5, 0, 2); for (let z = -14; z <= 14; z += 3.5) lamps.push(gT(new THREE.BoxGeometry(0.5, 0.35, 0.5), x, CH - 1.95, z)); }
  for (const z of [-12, -4, 4, 12]) Bx(g, ix.x1 - ix.x0 - 8, 0.5, 0.5, dk, 0, CH - 1.2, z, 2);
  const lm = mg(g, lamps, glow(0xfff2c8)); lm.userData.keep = true;
  Bx(g, 7.5, 0.4, 25, dk, ix.x0 + 4, 11.8, 0, 2);                                              // stage truss
  for (let z = -11; z <= 11; z += 3.7) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), glow(z % 2 ? 0xff7ab0 : 0x7ad0ff)); l.position.set(ix.x0 + 4, 11.4, z); l.userData.keep = true; g.add(l); }
  // seating & tables
  chairBlock(g, cols, -19, -7.5, -14, -4.5); chairBlock(g, cols, -19, -7.5, 3.8, 9);
  for (const [x, z] of [[12, 7.2], [19.5, 7.2], [12, -7.2], [19.5, -7.2], [25.5, 7.2], [25.5, -7.2]]) roundTable(g, cols, x, z);
  // registration desks near the entrance (front, +Z)
  for (const sx of [-1, 1]) {
    const x = sx * 11.5;
    Bx(g, 8, 1.05, 1.3, C(0xf4f6f6), x, 0.53, 14.6, 2); Bx(g, 8.2, 0.1, 1.5, C(0x20252c), x, 1.08, 14.6, 1); cols.push([x - 4.1, x + 4.1, 13.85, 15.35, 1.1]);
    sgn(g, 'REGISTRATION', 5, 0.8, x, 0.62, 15.3, 0, { bg: '#0e2a4a', fg: '#ffffff', border: '#00E599' });
    Bx(g, 1.4, 0.45, 0.06, glow(0x9fe8ff), x - 2, 1.36, 14.4, 1);
  }
  for (const [x, z, t] of [[-5.2, 12.5, 'REGISTRATION'], [5.2, 12.5, 'WELCOME'], [-5.2, -12.5, 'KEYNOTE'], [5.2, -12.5, 'CONFERENCE']]) {   // roll-up stands
    Bx(g, 0.9, 0.12, 0.5, dk, x, 0.06, z, 1); sgn(g, t, 0.85, 2.2, x, 1.25, z + 0.2, 0, { bg: '#0e2a4a', fg: '#ffffff', border: '#00E599' });
    cols.push([x - 0.45, x + 0.45, z - 0.25, z + 0.45, 2.3]);
  }
  // hanging banners
  [['CONFERENCE', -16, '#0e2a4a'], ['KEYNOTE', 0, '#3a0e5a'], ['FUTURE SUMMIT', 16, '#0a4a40']].forEach(([t, x, bg]) => {
    for (const z of [-8, 8]) { const s1 = sign(t, 8, 2.4, { bg, fg: '#fff', border: '#00E599' }); s1.position.set(x, 9.6, z); g.add(s1); const s2 = s1.clone(); s2.rotation.y = Math.PI; s2.position.z = z - 0.05; g.add(s2); }
  });
  for (const z of [-11, 11]) sgn(g, z < 0 ? 'FUTURE SUMMIT' : 'WELCOME', 6, 1.6, ix.x1 - 0.06, 8, z, -Math.PI / 2, { bg: '#0e2a4a', fg: '#fff', border: '#00E599' });
  // plants
  const pots = [], bush = [];
  for (const [x, z] of [[-27, 15.5], [27, 15.5], [27, -15.5], [-27, -15.5], [-19, 15.8], [19, 15.8], [-19, -15.8], [19, -15.8]]) {
    pots.push(gT(new THREE.CylinderGeometry(0.55, 0.42, 0.8, 8), x, 0.4, z)); bush.push(gT(SPH(1, 8, 6), x, 1.6, z, 0.8, 1.2, 0.8)); cols.push([x - 0.6, x + 0.6, z - 0.6, z + 0.6, 2.4]);
  }
  mg(g, pots, C(0xe8e8e0)); mg(g, bush, C(0x2f7a34));
  g.userData.inside = base.userData.inside; g.userData.doors = base.userData.doors;
  return size(g, W, D, H, cols);
}

// =====================================================================
// 3. Pop-up conference booths
// =====================================================================
export function conferenceBooth(opts = {}) {
  const v = (opts.variant | 0) % 3, g = G(), cols = [], dk = C(0x20252c), wh = C(0xf4f6f6);
  const rollup = (x, z, t, bg, ry = 0) => { Bx(g, 0.9, 0.1, 0.45, dk, x, 0.05, z, 1); const s = sign(t, 0.85, 2.1, { bg, fg: '#fff', border: '#00E599' }); s.position.set(x, 1.2, z + 0.12); s.rotation.y = ry; g.add(s); Bx(g, 0.04, 2.2, 0.04, dk, x, 1.15, z, 1).position.z = z - 0.05; cols.push([x - 0.45, x + 0.45, z - 0.25, z + 0.3, 2.2]); };
  Bx(g, 8, 0.07, 5, v === 1 ? mat('s6sg_carpet') : C(0x6a7480), 0, 0.035, 0, 3);
  if (v === 0) {                                                                                // pop-up gazebo tent
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { Cy(g, 0.06, 0.06, 3.2, 6, C(0xb8c0c6), sx * 2.9, 1.6, sz * 1.9, 1); cols.push([sx * 2.9 - 0.15, sx * 2.9 + 0.15, sz * 1.9 - 0.15, sz * 1.9 + 0.15, 3.2]); }
    const roof = hip(6.8, 4.8, 1.0, 2.2, 1.2, mat('s6sg_tent'), 2); roof.position.y = 3.2; g.add(roof);
    for (const s of [-1, 1]) Bx(g, 6.8, 0.5, 0.06, mat('s6sg_tent'), 0, 3.0, s * 2.42, 2);
    for (const s of [-1, 1]) Bx(g, 0.06, 0.5, 4.8, mat('s6sg_tent'), s * 3.42, 3.0, 0, 2);
    Bx(g, 5.6, 2.4, 0.1, wh, 0, 1.4, -2.0, 2); sgn(g, 'WELCOME', 4.4, 0.8, 0, 2.6, -1.93, 0, { bg: '#0e2a4a', fg: '#fff', border: '#00E599' });
    flat(g, flatMap('s6sg_led2'), 2.6, 1.3, 0, 1.2, -1.93);
    Bx(g, 3.6, 0.95, 1.1, wh, 0, 0.5, 0.8, 1); Bx(g, 3.7, 0.08, 1.2, dk, 0, 1.0, 0.8, 1); cols.push([-1.85, 1.85, 0.2, 1.4, 1.1]);
    sgn(g, 'REGISTRATION', 3, 0.55, 0, 0.55, 1.37, 0, { bg: '#0e2a4a', fg: '#fff' });
    rollup(-3.3, 1.4, 'KEYNOTE', '#3a0e5a'); rollup(3.3, 1.4, 'FUTURE SUMMIT', '#0a4a40');
  } else if (v === 1) {                                                                         // modular stand with LED screen
    Bx(g, 7.6, 3.6, 0.3, wh, 0, 1.8, -2.1, 2); cols.push([-3.8, 3.8, -2.25, -1.95, 3.6]);
    flat(g, flatMap('s6sg_led1'), 5.4, 2.4, 0, 1.9, -1.93);
    Bx(g, 8.0, 0.5, 0.5, C(0x00a878), 0, 3.85, -2.1, 1); sgn(g, 'KEYNOTE', 6, 0.5, 0, 3.85, -1.84, 0, { bg: '#0e2a4a', fg: '#fff' });
    for (const s of [-1, 1]) { Bx(g, 0.3, 3.6, 2.0, wh, s * 3.85, 1.8, -1.0, 2); cols.push([s * 3.85 - 0.15, s * 3.85 + 0.15, -2, 0, 3.6]); }
    Bx(g, 4.6, 1.0, 1.0, wh, -0.4, 0.55, 0.6, 1); Bx(g, 1.0, 1.0, 2.4, wh, 2.3, 0.55, 1.2, 1); cols.push([-2.7, 2.8, 0.1, 1.1, 1.1], [1.8, 2.8, 0.1, 2.4, 1.1]);
    Bx(g, 4.8, 0.08, 1.1, dk, -0.4, 1.08, 0.6, 1);
    sgn(g, 'CONFERENCE', 4, 0.55, -0.4, 0.55, 1.13, 0, { bg: '#0a4a40', fg: '#fff', border: '#00E599' });
    Bx(g, 0.5, 0.55, 0.5, C(0x2a3a60), -3.3, 0.28, 1.6, 1); Bx(g, 0.5, 0.55, 0.5, C(0x2a3a60), -3.3, 0.28, 0.8, 1);
    rollup(3.0, 2.0, 'WELCOME', '#14264a');
  } else {                                                                                       // curved-wall booth with a hanging ring
    const arc = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3.0, 14, 1, true, Math.PI * 0.5, Math.PI), keyed('boothArc', () => new THREE.MeshLambertMaterial({ color: 0xf0f4f6, side: THREE.DoubleSide })));
    arc.position.set(0, 1.5, 0); arc.scale.x = 1.6; g.add(arc); cols.push([-1.8, 1.8, -2.5, -1.6, 3], [-3.9, -1.8, -1.6, 0, 3], [1.8, 3.9, -1.6, 0, 3]);
    const led = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 1.8, 12, 1, true, Math.PI * 0.62, Math.PI * 0.76), flatMapD('s6sg_led3')); led.position.set(0, 1.7, 0); led.scale.x = -1.6; g.add(led);
    Ms(g, new THREE.TorusGeometry(1.9, 0.12, 6, 20), glow(NEO), 0, 3.5, 0.5, 1, 1, 1, Math.PI / 2);
    for (const a of [0.5, 2.6, 4.7]) rods(g, [[[Math.cos(a) * 1.9, 3.5, 0.5 + Math.sin(a) * 1.9], [Math.cos(a) * 1.9, 4.0, 0.5 + Math.sin(a) * 1.9]]], 0.02, dk, 3);
    sgn(g, 'FUTURE SUMMIT', 2.2, 0.6, 0, 3.52, 2.44, 0, { bg: '#0e2a4a', fg: '#fff' });
    Cy(g, 1.0, 1.0, 1.0, 14, wh, 0.2, 0.5, 1.0, 1); Cy(g, 1.1, 1.1, 0.08, 14, dk, 0.2, 1.04, 1.0, 1); cols.push([-0.8, 1.2, 0, 2, 1.1]);
    rollup(-3.4, 1.9, 'WELCOME', '#3a0e5a'); rollup(3.5, 1.9, 'KEYNOTE', '#0a4a40');
  }
  return size(g, 8, 5, v === 0 ? 4.0 : 4.2, cols);
}

// =====================================================================
// 4. Flag row, 5. LED wall
// =====================================================================
export function flagRow(opts = {}) {
  const g = G(), cols = [], pole = C(0xd8dcde);
  const n = 6, step = 4.4;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * step;
    Cy(g, 0.07, 0.1, 8, 6, pole, x, 4, 0, 1); Sg(g, C(0xe8c860), x, 8.05, 0, 0.14, 0.14, 0.14, 0, 0, 0, 5);
    Bx(g, 0.7, 0.3, 0.7, C(0x9aa0a4), x, 0.15, 0, 1);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.45, 4, 1), lamb(`s6sg_flag${(i + (opts.variant | 0) * 3) % 8}`));
    const p = fl.geometry.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin((p.getX(k) + 1.1) * 1.6) * 0.14 * ((p.getX(k) + 1.1) / 2.2));
    fl.geometry.computeVertexNormals(); fl.position.set(x + 1.17, 7.0, 0); g.add(fl);
    cols.push([x - 0.35, x + 0.35, -0.35, 0.35, 0.5]);
  }
  if (opts.arch) {
    Bx(g, 22, 1.4, 0.2, C(0x0e2a4a), 0, 6.2, 0.2, 2); sgn(g, 'WELCOME TO THE FUTURE SUMMIT', 21, 1.2, 0, 6.2, 0.33, 0, { bg: '#0e2a4a', fg: '#fff', border: '#00E599' });
  }
  return size(g, 24, 1, 8.3, cols);
}
export function ledWall(opts = {}) {
  const g = G(), v = (opts.variant | 0) % 4, dk = C(0x2a2e34);
  Bx(g, 11.6, 5.8, 0.4, dk, 0, 4.1, 0, 2);
  flat(g, flatMap(`s6sg_led${v}`), 11.0, 5.5, 0, 4.1, 0.27);
  flat(g, flatMap(`s6sg_led${(v + 1) % 4}`), 11.0, 5.5, 0, 4.1, -0.27, Math.PI);
  Bx(g, 11.8, 0.1, 0.5, glow(NEO), 0, 7.02, 0, 1);
  for (const s of [-1, 1]) {
    Bx(g, 0.35, 1.5, 0.35, dk, s * 5.2, 0.75, 0, 1); Bx(g, 0.28, 1.4, 0.28, dk, s * 5.2, 1.3, 0.9, 1).rotation.x = 0.5; Bx(g, 1.0, 0.18, 1.6, dk, s * 5.2, 0.09, 0.3, 1);
    Bx(g, 0.28, 1.4, 0.28, dk, s * 5.2, 1.3, -0.9, 1).rotation.x = -0.5; Bx(g, 1.0, 0.18, 1.6, dk, s * 5.2, 0.09, -0.3, 1);
  }
  return size(g, 12, 1.6, 7.1, [[-5.9, 5.9, -0.3, 0.3, 7]]);
}

// =====================================================================
// 6. Supertree
// =====================================================================
function stCanopy(g, y0, Rm, H, nRibs, cols3) {
  const rr = (t) => 0.9 + (Rm - 0.9) * Math.pow(Math.sin(t * Math.PI / 2), 0.62), yy = (t) => y0 + H * t;
  const ribs = [], T = [0, 0.25, 0.5, 0.75, 1];
  for (let i = 0; i < nRibs; i++) {
    const a = i / nRibs * Math.PI * 2;
    for (let k = 0; k < 4; k++) ribs.push([[Math.cos(a) * rr(T[k]), yy(T[k]), Math.sin(a) * rr(T[k])], [Math.cos(a) * rr(T[k + 1]), yy(T[k + 1]), Math.sin(a) * rr(T[k + 1])]]);
  }
  rods(g, ribs, 0.15, mat('s6sg_trunk'), 5);
  const prof = []; for (let k = 0; k <= 8; k++) { const t = k / 8; prof.push(new THREE.Vector2(rr(t) + 0.12, yy(t))); }
  const lg = scaleUV(new THREE.LatheGeometry(prof, 16), 3);
  g.add(new THREE.Mesh(lg, alphaMat('s6sg_leaf')));
  const lg2 = scaleUV(new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p.x - 0.4, p.y - 0.05)), 14), 2.5);
  g.add(new THREE.Mesh(lg2, alphaMat('s6sg_leaf')));
  for (const t of [0.5, 1]) Ms(g, new THREE.TorusGeometry(rr(t) + 0.1, 0.12, 4, 24), C(0x8a8c86), 0, yy(t), 0, 1, 1, 1, Math.PI / 2);
  const L = [[], [], []];
  for (let i = 0; i < nRibs; i++) {
    const a = i / nRibs * Math.PI * 2;
    L[i % 3].push(gT(SPH(1, 6, 4), Math.cos(a) * (rr(1) + 0.3), yy(1) + 0.15, Math.sin(a) * (rr(1) + 0.3), 0.38));
    L[(i + 1) % 3].push(gT(SPH(1, 6, 4), Math.cos(a + 0.2) * (rr(0.5) + 0.25), yy(0.5) - 0.2, Math.sin(a + 0.2) * (rr(0.5) + 0.25), 0.3));
  }
  L.forEach((l, i) => { const m = mg(g, l, glow(cols3[i])); m.userData.keep = true; });
}
export function superTree(opts = {}) {
  const v = (opts.variant | 0) % 2, g = G(), tm = mat('s6sg_trunk'), cl = [0xff3d9a, 0x38d8ff, NEO];
  Cy(g, 1.7, 2.1, 3, 12, tm, 0, 1.5, 0, 5);
  Ms(g, new THREE.CylinderGeometry(4.6, 4.8, 0.08, 20), mat('grass'), 0, 0.04, 0, 1, 1, 1);
  if (!v) {
    Cy(g, 1.0, 1.6, 26, 12, tm, 0, 16, 0, 5);
    stCanopy(g, 29, 8.8, 12, 16, cl);
    Cy(g, 0.05, 0.4, 9, 6, C(0xb8bcc0), 0, 45.5, 0, 1); Sg(g, glow(NEO), 0, 50.1, 0, 0.3);
  } else {
    Cy(g, 0.9, 1.6, 36, 12, tm, 0, 21, 0, 5);
    Cy(g, 0.5, 0.9, 10, 10, tm, 0, 43, 0, 5);
    stCanopy(g, 22, 8.6, 9, 16, cl); stCanopy(g, 37, 5.4, 8, 12, [cl[1], cl[2], cl[0]]);
    Cy(g, 0.05, 0.3, 4, 6, C(0xb8bcc0), 0, 48, 0, 1); Sg(g, glow(0xff3d9a), 0, 50.1, 0, 0.3);
  }
  return size(g, 18, 18, 50.4, [[-2.0, 2.0, -2.0, 2.0, 50]]);
}

// =====================================================================
// 7. Flower dome (glass conservatory, above ground only)
// =====================================================================
function ellRing(rx, rz, y, n, rr) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2; o.push([[Math.cos(a) * rx * rr, y, Math.sin(a) * rz * rr], [Math.cos(b) * rx * rr, y, Math.sin(b) * rz * rr]]); } return o; }
export function flowerDome() {
  const g = G(), rx = 30, rz = 20, by = 1.6, ry = 26.4, steel = C(0xe8ecee);
  Ms(g, new THREE.CylinderGeometry(1, 1, by, 32), C(0xcfd4d6), 0, by / 2, 0, rx, 1, rz);
  // interior glimpse (hills, trees, flower beds) - all inside the shell
  Ms(g, new THREE.CylinderGeometry(1, 1, 0.1, 28), mat('grass'), 0, 0.05, 0, rx * 0.97, 1, rz * 0.97);
  const hills = [[-14, -4, 9, 5, 7], [6, 3, 12, 7, 8], [16, -6, 8, 4, 6], [-6, 8, 8, 3, 6], [-20, 6, 5, 4, 4]];
  for (const [x, z, a, h, b] of hills) Ms(g, new THREE.SphereGeometry(1, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), C(0x4f9a44), x, 0.1, z, a, h, b);
  const trunks = [], crowns = [], fl = [[], [], [], []], r = mulberry(77);
  for (let i = 0; i < 7; i++) { const x = -22 + i * 7 + r() * 2, z = -9 + r() * 14, hh = 5 + r() * 5; trunks.push(gT(new THREE.CylinderGeometry(0.5, 0.9, hh, 6), x, hh / 2, z)); crowns.push(gT(SPH(1, 7, 5), x, hh + 0.5, z, 3 + r() * 1.5, 1.8 + r(), 3 + r() * 1.5)); }
  mg(g, trunks, C(0x6a5a44)); mg(g, crowns, C(0x7a9a4a));
  for (let i = 0; i < 44; i++) { const a = r() * 6.28, rd = Math.sqrt(r()) * 0.8; fl[i % 4].push(gT(new THREE.BoxGeometry(1.8, 0.7, 1.8), Math.cos(a) * rx * rd, 0.35, Math.sin(a) * rz * rd)); }
  [0xf0508a, 0xf4c020, 0xb060e0, 0xf07030].forEach((c, i) => mg(g, fl[i], C(c)));
  // glass shell + ribs
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 10, 0, Math.PI * 2, 0, Math.PI / 2), glassM(0xbfe6ee, 0.34));
  shell.scale.set(rx, ry, rz); shell.position.y = by; shell.renderOrder = 2; g.add(shell);
  const ribs = [];
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    for (let k = 0; k < 7; k++) {
      const p0 = k / 7 * Math.PI / 2, p1 = (k + 1) / 7 * Math.PI / 2;
      ribs.push([[Math.cos(a) * rx * Math.cos(p0), by + ry * Math.sin(p0), Math.sin(a) * rz * Math.cos(p0)], [Math.cos(a) * rx * Math.cos(p1), by + ry * Math.sin(p1), Math.sin(a) * rz * Math.cos(p1)]]);
    }
  }
  for (const p of [0.22, 0.45, 0.68, 0.88]) ribs.push(...ellRing(rx, rz, by + ry * Math.sin(p * Math.PI / 2), 32, Math.cos(p * Math.PI / 2)));
  ribs.push(...ellRing(rx, rz, by + 0.05, 32, 1));
  rods(g, ribs, 0.17, steel, 4);
  rods(g, ellRing(rx + 0.15, rz + 0.15, 1.1, 36, 1), 0.09, glow(NEO), 4).userData.keep = true;
  return size(g, 60, 40, 28, ellCols(0, 0, rx, rz, 28, 12, by + ry));
}

// =====================================================================
// 8. ArtScience museum (lotus)
// =====================================================================
export function artScienceMuseum() {
  const g = G(), zc = -4, cols = [], lot = mat('s6sg_lotus'), cap = C(0xdfe6ea);
  Cy(g, 9.7, 10, 6, 14, lot, 0, 3, zc, 6); Cy(g, 10.3, 10.3, 0.4, 14, C(0xc9ced0), 0, 6.2, zc, 2);
  Ms(g, new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), glassM(0x9fd0e4, 0.55), 0, 6.4, zc, 6.4, 5, 6.4);
  const petal = (r0, ang, L, tilt, th, hw) => {
    const geo = new THREE.CylinderGeometry(hw * 0.2, hw * 1.35, L, 4, 1, false); geo.rotateY(Math.PI / 4);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * L / 5);
    const piv = new THREE.Group(); piv.position.set(Math.cos(ang) * r0, 5.5, zc + Math.sin(ang) * r0); piv.rotation.y = -ang;
    const m = new THREE.Mesh(geo, lot); m.scale.set(th, 1, 1); m.rotation.z = -tilt; m.position.set(Math.sin(tilt) * L / 2, Math.cos(tilt) * L / 2, 0); piv.add(m); g.add(piv);
    const tg = new THREE.ConeGeometry(hw * 0.3, 1.2, 4); tg.rotateY(Math.PI / 4); const tip = new THREE.Mesh(tg, cap); tip.scale.set(th, 1, 1); tip.rotation.z = -tilt;
    tip.position.set(Math.sin(tilt) * (L + 0.5), Math.cos(tilt) * (L + 0.5), 0); piv.add(tip);
  };
  for (let i = 0; i < 9; i++) petal(7.4, i / 9 * Math.PI * 2 + 0.2, 20, 0.28, 0.5, 3.0);
  for (let i = 0; i < 6; i++) petal(3.6, i / 6 * Math.PI * 2, 19.2, 0.1, 0.45, 2.3);
  // entrance portal facing +Z, glass lobby
  Bx(g, 8, 4.6, 2.6, glassM(0x7fb8d8, 0.85), 0, 2.3, zc + 10.6, 3); cols.push([-4, 4, zc + 9.3, zc + 11.9, 4.6]);
  Bx(g, 8.8, 0.4, 3.2, cap, 0, 4.8, zc + 10.6, 2);
  sgn(g, 'DIGITAL LIGHT', 6.4, 0.9, 0, 3.9, zc + 11.96, 0, { bg: '#0e2a4a', fg: '#ffffff', border: '#00E599' });
  door(g, 2.6, 3.2, 0, 1.6, zc + 11.95, 0, '#4a5a68');
  cols.push([-10.5, 10.5, zc - 10.5, zc + 10.5, 26]);
  // (the reflecting pools and the little paved bridge in front of the door were removed: lizards got lost on the narrow path between them)
  return size(g, 36, 36, 26, cols);
}

// =====================================================================
// 9. Esplanade (twin durian domes)
// =====================================================================
function durian(g, cx, cz, rx, ry, rz, sp) {
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassM(0x5a86a8, 0.9));
  shell.scale.set(rx * 0.99, ry * 0.99, rz * 0.99); shell.position.set(cx, 0, cz); g.add(shell);
  Ms(g, new THREE.CylinderGeometry(1, 1, 1.5, 24), C(0xb8bec2), cx, 0.75, cz, rx * 1.005, 1, rz * 1.005);
  const ico = new THREE.IcosahedronGeometry(1, 2), pa = ico.attributes.position, pos = [];
  const V = (i) => new THREE.Vector3(pa.getX(i) * rx, pa.getY(i) * ry, pa.getZ(i) * rz);
  for (let f = 0; f < pa.count; f += 3) {
    const A = V(f), B = V(f + 1), Cc = V(f + 2);
    if (Math.min(A.y, B.y, Cc.y) < 1.4) continue;
    const M = A.clone().add(B).add(Cc).divideScalar(3), N = B.clone().sub(A).cross(Cc.clone().sub(A)).normalize();
    if (N.dot(M) < 0) N.negate();
    const apex = M.clone().addScaledVector(N, sp);
    for (const [P1, P2] of [[A, B], [B, Cc], [Cc, A]]) {
      const n = P2.clone().sub(P1).cross(apex.clone().sub(P1)); if (n.dot(M.clone().add(apex).multiplyScalar(0.5)) < 0) pos.push(...P2.toArray(), ...P1.toArray(), ...apex.toArray()); else pos.push(...P1.toArray(), ...P2.toArray(), ...apex.toArray());
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
  const sh = new THREE.Mesh(geo, shiny(0xc9ccc4, 90)); sh.position.set(cx, 0, cz); g.add(sh);
}
export function esplanade() {
  const g = G(), cols = [];
  Bx(g, 50, 0.12, 29, mat('s6sg_paver'), 0, 0.06, 0, 4);
  durian(g, -11.5, -0.5, 11.5, 13.4, 13, 1.8); durian(g, 13, 1.5, 10, 11.2, 11.5, 1.6);
  Bx(g, 7.4, 5.6, 9, glassM(0x7fb0cc, 0.9), 1.5, 2.8, 0.5, 3); Bx(g, 7.8, 0.4, 9.4, C(0xdfe4e6), 1.5, 5.8, 0.5, 2);
  Bx(g, 7.9, 0.14, 0.14, glow(NEO), 1.5, 6.1, 5.3, 1);
  sgn(g, 'CONCERT HALL', 5, 0.8, 1.5, 4.6, 5.07, 0, { bg: '#0e2a4a', fg: '#fff' });
  cols.push(...ellCols(-11.5, -0.5, 11.5, 13, 13.4, 8, 13.4), ...ellCols(13, 1.5, 10, 11.5, 11.2, 8, 11.2), [-2, 5.2, -4.2, 5.2, 5.8]);
  for (const [x, z] of [[-7, 12.6], [-16, 12.2], [7, 12.6], [18, 12.4]]) { Cy(g, 0.25, 0.25, 2.2, 6, C(0xe8ecee), x, 1.1, z, 1); Sg(g, glow(0xfff2c8), x, 2.35, z, 0.3, 0.3, 0.3, 0, 0, 0, 6); }
  return size(g, 50, 30, 16, cols);
}

// =====================================================================
// 10. Observation wheel
// =====================================================================
export function singaporeFlyer() {
  const g = G(), R_ = 24.5, cy = 32.5, zs = [-2.2, 2.2], steel = shiny(0xe4e8ea, 70), white = C(0xeef0f2), cols = [];
  for (const z of zs) { Ms(g, new THREE.TorusGeometry(R_, 0.42, 5, 44), steel, 0, cy, z); }
  const sp = [], tie = [], cap = [], frame = [], lite = [];
  for (const z of zs) for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, b = (i + 0.5) / 20 * Math.PI * 2; sp.push([[0, cy, z], [Math.cos(a) * R_, cy + Math.sin(a) * R_, z]]); sp.push([[Math.cos(a) * R_, cy + Math.sin(a) * R_, z], [Math.cos(a + 0.4) * R_, cy + Math.sin(a + 0.4) * R_, z]]); }
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2 + 0.15, x = Math.cos(a) * R_, y = cy + Math.sin(a) * R_;
    tie.push([[x, y, -2.2], [x, y, 2.2]]);
    cap.push(gT(new THREE.BoxGeometry(2.3, 2.3, 3.7), x, y - 1.55, 0));
    frame.push(gT(new THREE.BoxGeometry(2.5, 0.2, 3.9), x, y - 0.4, 0), gT(new THREE.BoxGeometry(2.5, 0.2, 3.9), x, y - 2.7, 0));
    lite.push(gT(new THREE.BoxGeometry(1.6, 0.1, 0.8), x, y - 2.85, 0));
    sp.push([[x, y, -2.2], [x, y - 0.4, -1.6]], [[x, y, 2.2], [x, y - 0.4, 1.6]]);
  }
  rods(g, sp, 0.07, steel, 3); rods(g, tie, 0.14, steel, 4);
  mg(g, cap, glassM(0x9fd4e8, 0.55)); mg(g, frame, white); mg(g, lite, glow(0xfff0c0)).userData.keep = true;
  Ms(g, new THREE.CylinderGeometry(1.5, 1.5, 7.4, 12), white, 0, cy, 0, 1, 1, 1, Math.PI / 2, 0, 0);
  Ms(g, new THREE.TorusGeometry(1.7, 0.12, 4, 16), glow(NEO), 0, cy, 3.75).userData.keep = true;
  const legs = [];
  for (const z of [-3.7, 3.7]) for (const s of [-1, 1]) {
    legs.push([[0, cy, z], [s * 15, 0.4, z * 1.12]]);
    const fx = s * 15, fz = z * 1.12; Bx(g, 3.0, 1.0, 3.0, mat('concrete'), fx, 0.5, fz, 2); cols.push([fx - 1.5, fx + 1.5, fz - 1.5, fz + 1.5, 1.0]);
  }
  rods(g, legs, 0.6, white, 6);
  rods(g, [[[-8, 16, -3.7], [8, 16, 3.7]], [[-8, 16, 3.7], [8, 16, -3.7]], [[0, cy, -3.7], [0, cy, 3.7]]], 0.22, steel, 4);
  Bx(g, 18, 4.4, 8.6, mat('s6sg_hallOuter'), 0, 2.2, 0, 4); Bx(g, 19, 0.4, 9.6, C(0x4a5660), 0, 4.6, 0, 3);
  cols.push([-9.5, 9.5, -4.8, 4.8, 4.8]);
  sgn(g, 'OBSERVATION WHEEL', 8, 0.9, 0, 3.4, 4.36, 0, { bg: '#0e2a4a', fg: '#fff', border: '#00E599' });
  door(g, 2.4, 2.8, -5, 1.4, 4.35, 0, '#4a5a68'); door(g, 2.4, 2.8, 5, 1.4, 4.35, 0, '#4a5a68');
  Cy(g, 0.06, 0.1, 2.4, 5, steel, 0, cy + R_ + 1.6, 0, 1); Sg(g, glow(0xff3030), 0, cy + R_ + 2.9, 0, 0.3, 0.3, 0.3, 0, 0, 0, 6).userData.keep = true;
  return size(g, 50, 10, 60.2, cols);
}

// =====================================================================
// 11. Peranakan shophouse row
// =====================================================================
function uvPlane(w, h, u0, u1) {
  const geo = new THREE.PlaneGeometry(w, h), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
  return geo;
}
export function shophouseRow(opts = {}) {
  const v = (opts.variant | 0) % 3, g = G(), cols = [];
  const ws = [[9, 9, 9, 9], [12, 12, 12], [6, 6, 6, 6, 6, 6]][v], ci = [[0, 1, 2, 3], [4, 5, 0], [3, 2, 5, 1, 4, 0]][v];
  const HG = 4.2, HU = 7.0, EV = HG + HU, hex = (s) => parseInt(s.slice(1), 16);
  let x0 = -18;
  const posts = new Set();
  ws.forEach((w, i) => {
    const c = SH[ci[i]], cx = x0 + w / 2, base = hex(c[0]), trim = hex(c[1]), k = ci[i];
    Bx(g, w, HG, 9.6, C(base), cx, HG / 2, -1.2, 3);
    Bx(g, w, HU, 12, C(base), cx, HG + HU / 2, 0, 3);
    const gw = Math.min(w, 9), gu = (9 - gw) / 18;
    const gf = new THREE.Mesh(uvPlane(gw, HG, gu, 1 - gu), mat(`s6sg_shG${k}`)); gf.position.set(cx, HG / 2, 3.66); g.add(gf);
    if (w > 9) for (const s of [-1, 1]) Bx(g, (w - 9) / 2, HG, 0.1, C(trim), cx + s * (4.5 + (w - 9) / 4), HG / 2, 3.64, 1);
    const up = new THREE.Mesh(uvPlane(w, HU, 0, w / 9), mat(`s6sg_shU${k}`)); up.position.set(cx, HG + HU / 2, 6.06); g.add(up);
    for (let b = 0; b <= w / 3; b++) posts.add((x0 + b * 3).toFixed(2));
    Bx(g, w - 0.04, 1.5, 0.5, C(trim), cx, EV + 0.75, 5.85, 1);
    Bx(g, w - 0.04, 0.35, 12.5, C(trim), cx, EV + 0.17, 0, 2);
    for (const s of [-1, 1]) Bx(g, 0.5, 0.9, 0.5, C(trim), cx + s * (w / 2 - 0.35), EV + 1.9, 5.85, 1);
    Ms(g, new THREE.CylinderGeometry(1.0, 1.0, 0.4, 3), C(trim), cx, EV + 1.5 + 0.5, 5.85, 1, 1, 1, -Math.PI / 2, 0, 0);
    Sg(g, C(0xd8b84a), cx, EV + 1.6, 6.15, 0.32, 0.32, 0.12, 0, 0, 0, 8);
    const roof = gableRoof(12, w, 2.0, 0.25, mat('s6sg_tile'), mat('s6sg_tile'), 3); roof.rotation.y = Math.PI / 2; roof.position.set(cx, EV + 0.35, 0); g.add(roof);
    // back windows
    for (let b = 0; b < w / 3; b++) for (const yy of [HG + 1.9, HG + 5.4]) win(g, 1.3, 2.4, x0 + b * 3 + 1.5, yy, -6.06, Math.PI, { fixed: true, c: '#ece6d6' });
    const names = ['KOPI TIAM', 'TEA HOUSE', 'NOODLES', 'BAKERY', 'LAUNDRY', 'SOUVENIRS'];
    sgn(g, names[(i + v * 2) % 6], 1.5, 0.5, cx + 1.9, 3.3, 4.6, Math.PI / 2, { bg: ['#7a1c14', '#0e4a3a', '#1a3a6a'][i % 3], fg: '#f4e6b0' });
    x0 += w;
  });
  for (const p of posts) { const x = +p; Bx(g, 0.5, HG, 0.5, C(0xf0e8d8), x, HG / 2, 5.4, 1); cols.push([x - 0.25, x + 0.25, 5.15, 5.65, HG]); }
  for (const s of [-1, 1]) for (const yy of [HG + 1.9, HG + 5.4]) for (const z of [-2.5, 2.5]) win(g, 1.3, 2.4, s * 18.06, yy, z, s * Math.PI / 2, { fixed: true, c: '#ece6d6' });
  cols.push([-18, 18, -6, 3.6, EV + 2.5]);
  return size(g, 36, 12, 14.2, cols);
}

// =====================================================================
// 12. HDB block
// =====================================================================
export function hdbBlock(opts = {}) {
  const v = (opts.variant | 0) % 3, g = G(), front = mat(`s6sg_hdb${v}`), back = mat('s6sg_hdbBack');
  const end = [mat('plainCream'), mat('plainBlue'), mat('plainPink')][v], acc = [0xe8903a, 0xf2c230, 0x2a9a96][v];
  const GH = 3.6, UH = 33;
  const m = boxT(50, UH, 11, front, 6); m.material = [end, end, mat('roofTar'), mat('concrete'), front, back];
  m.position.set(0, GH + UH / 2, 0); g.add(m);
  Bx(g, 50.2, GH, 11.2, mat('s6sg_hallOuter'), 0, GH / 2, 0, 4);
  for (let x = -22; x <= 22; x += 4.4) { Bx(g, 2.6, 2.6, 0.1, glassM(0x6aa0c8, 0.8), x, 1.9, 5.66, 1); }
  Bx(g, 50.4, 0.5, 11.6, C(acc), 0, GH + 0.25, 0, 2);
  for (const s of [-1, 1]) {                                                                    // lift & stair cores (front and back)
    Bx(g, 4.4, UH + 1.5, 1.4, C(acc), s * 12.5, GH + UH / 2 + 0.75, 6.2, 2); Bx(g, 4.4, UH + 1.5, 1.6, mat('s6sg_hdbBack'), s * 12.5, GH + UH / 2 + 0.75, -6.3, 4);
    for (let f = 0; f < 11; f++) win(g, 0.9, 1.4, s * 12.5, GH + 2.4 + f * 3, 6.96, 0, { fixed: true, c: '#f4f0e0' });
    sgn(g, v === 1 ? 'BLK 108' : v === 2 ? 'BLK 52' : 'BLK 21', 3.4, 0.9, s * 12.5, GH + 1.8, 6.95, 0, { bg: '#f4f0e0', fg: '#1a3a6a', border: '#1a3a6a' });
  }
  // end walls get windows
  for (const s of [-1, 1]) for (let f = 0; f < 11; f++) { win(g, 1.3, 1.5, s * 25.06, GH + 2 + f * 3, 0, s * Math.PI / 2, { fixed: true, c: '#e8e2d0' }); }
  // roof
  const rt = GH + UH;
  Bx(g, 50.4, 0.9, 11.4, C(0xd8d2c4), 0, rt + 0.45, 0, 3);
  Bx(g, 49.4, 0.5, 10.4, C(0x7a7a78), 0, rt + 0.7, 0, 3);
  for (const x of [-14, 14]) Bx(g, 5, 2.6, 4.2, C(acc), x, rt + 2.2, -1, 2);
  Cy(g, 1.6, 1.6, 2.2, 10, C(0x9aa4aa), 0, rt + 1.6, 1.5, 2); Cy(g, 1.8, 1.8, 0.2, 10, C(0x6a747a), 0, rt + 2.8, 1.5, 1);
  rods(g, [[[-5, rt + 1, -2], [-5, rt + 4.5, -2]], [[5, rt + 1, 2], [5, rt + 5, 2]]], 0.05, C(0x333333), 3);
  Bx(g, 2.6, 1.0, 0.1, glow(NEO), 0, rt + 1.0, 5.52, 1).userData.keep = true;
  // washing poles with laundry on some balconies
  const r = mulberry(40 + v), arms = [], cl = [[], [], [], []], palette = [0xe84a6a, 0x4a8ae8, 0xf2c230, 0xf4f4f0];
  for (let i = 0; i < 28; i++) {
    const bay = (r() * 16) | 0, f = (r() * 11) | 0, x = -25 + bay * 3 + 2.25, y = GH + 1.5 + f * 3;
    if (Math.abs(Math.abs(x) - 12.5) < 3) continue;
    arms.push([[x - 0.8, y, 5.5], [x - 0.8, y, 6.25]], [[x + 0.8, y, 5.5], [x + 0.8, y, 6.25]], [[x - 1.0, y, 6.25], [x + 1.0, y, 6.25]]);
    for (let k = 0; k < 3; k++) cl[(i + k) % 4].push(gT(new THREE.BoxGeometry(0.5, 0.8, 0.04), x - 0.55 + k * 0.55, y - 0.45, 6.25));
  }
  if (arms.length) rods(g, arms, 0.04, C(0x8a6a3a), 3);
  cl.forEach((l, i) => { if (l.length) mg(g, l, C(palette[i])); });
  return size(g, 50, 14, 41.6);
}

// =====================================================================
// 13. Colonial hotel
// =====================================================================
function veranda(g, cols, x, z, ry, L, floors = 2) {
  const grp = G(), D_ = 2.6, FH = 4.2, white = C(0xf7f5ee);
  const n = Math.round(L / 3);
  for (let f = 0; f < floors; f++) {
    Bx(grp, L, 0.3, D_, white, 0, f * FH + FH, D_ / 2, 2);
    Bx(grp, L, 0.9, 0.14, white, 0, f * FH + FH + 0.75, D_ - 0.25, 1);
  }
  for (let b = 0; b <= n; b++) Bx(grp, 0.4, floors * FH, 0.4, white, -L / 2 + b * 3, floors * FH / 2, D_ - 0.4, 1);
  for (let b = 0; b < n; b++) for (let f = 0; f < floors; f++) { win(grp, 1.4, 2.5, -L / 2 + b * 3 + 1.5, f * FH + 2.2, 0.07, 0, { c: '#ffffff' }); if (f === 0 && b % 2 === 0) door(grp, 1.5, 2.7, -L / 2 + b * 3 + 1.5, 1.4, 0.08, 0, '#e8e4d8'); }
  grp.position.set(x, 0, z); grp.rotation.y = ry; g.add(grp);
  const c = Math.cos(ry), s = Math.sin(ry);
  for (let b = 0; b <= n; b++) {
    const lx = -L / 2 + b * 3, lz = D_ - 0.4, wx = x + lx * c + lz * s, wz = z - lx * s + lz * c;
    cols.push([wx - 0.25, wx + 0.25, wz - 0.25, wz + 0.25, floors * FH]);
  }
}
function buildPalm(g, x, z, s = 1, seed = 1) {
  const r = mulberry(seed * 7 + 3), lean = (r() - 0.5) * 0.8 * s, hh = 11.2 * s;
  const P = [[0, 0, 0], [lean * 0.3, hh * 0.35, 0], [lean * 0.8, hh * 0.7, 0.1], [lean, hh, 0.1]];
  const tr = []; for (let k = 0; k < 3; k++) tr.push(rodT(P[k].map((q, i) => q + (i === 0 ? x : i === 2 ? z : 0)), P[k + 1].map((q, i) => q + (i === 0 ? x : i === 2 ? z : 0)), 0.3 * s * (1 - k * 0.2), 0.3 * s * (1 - (k + 1) * 0.2), 6));
  mg(g, tr, C(0x8a7a5e));
  const fr = [], N = 9;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2 + r() * 0.3, t1 = 0.35 + r() * 0.25;
    const s1 = new THREE.PlaneGeometry(1.1 * s, 0.95 * s).translate(0.55 * s, 0, 0).rotateX(-Math.PI / 2).rotateZ(t1);
    const s2 = new THREE.PlaneGeometry(1.0 * s, 0.8 * s).translate(0.5 * s, 0, 0).rotateX(-Math.PI / 2).rotateZ(-0.6).translate(1.1 * s * Math.cos(t1), 1.1 * s * Math.sin(t1), 0);
    fr.push(s1.rotateY(a).translate(x + lean, hh, z + 0.1), s2.rotateY(a).translate(x + lean, hh, z + 0.1));
  }
  const fm = new THREE.Mesh(merge(fr), alphaMat('s6sg_frond')); g.add(fm);
  mg(g, [gT(SPH(1, 6, 4), x + lean + 0.25 * s, hh - 0.3 * s, z + 0.3 * s, 0.22 * s), gT(SPH(1, 6, 4), x + lean - 0.2 * s, hh - 0.35 * s, z - 0.2 * s, 0.22 * s)], C(0x5a3a1c));
}
function rodT(a, b, r0, r1, seg = 6) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const geo = new THREE.CylinderGeometry(r1, r0, len, seg, 1, false);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  geo.translate(A.x + d.x * len / 2, A.y + d.y * len / 2, A.z + d.z * len / 2);
  return geo;
}
export function rafflesHotel() {
  const g = G(), cols = [], wall = mat('s6sg_colWall'), white = C(0xf7f5ee), red = mat('s6sg_redRoof');
  const WH = 12.6;
  Bx(g, 36, WH, 14, wall, 0, WH / 2, -8, 6); cols.push([-18, 18, -15, -1, 16.6]);
  for (const s of [-1, 1]) { Bx(g, 8, WH, 13, wall, s * 18, WH / 2, 5.5, 6); cols.push([s * 18 - 4, s * 18 + 4, -1, 12, 16.6]); }
  Bx(g, 36.6, 0.5, 14.6, white, 0, WH + 0.25, -8, 3); for (const s of [-1, 1]) Bx(g, 8.6, 0.5, 13.6, white, s * 18, WH + 0.25, 5.5, 3);
  const r1 = hip(38, 16, 4.0, 7.0, 7.0, red, 4); r1.position.set(0, WH + 0.5, -8); g.add(r1);
  for (const s of [-1, 1]) { const r2 = hip(10, 15, 3.6, 4.2, 4.2, red, 4); r2.position.set(s * 18, WH + 0.5, 5.5); g.add(r2); }
  // clock cupola
  Bx(g, 3.2, 2.6, 3.2, white, 0, WH + 4.4, -8, 2); for (const s of [-1, 1]) { win(g, 1.2, 1.8, s * 1.66, WH + 4.4, -8, s * Math.PI / 2, { fixed: true }); win(g, 1.2, 1.8, 0, WH + 4.4, -8 + s * 1.66, s > 0 ? 0 : Math.PI, { fixed: true }); }
  const cap = hip(4, 4, 1.7, 1.8, 1.8, red, 2); cap.position.set(0, WH + 5.7, -8); g.add(cap); Sg(g, C(0xd8b84a), 0, WH + 7.55, -8, 0.22, 0.22, 0.22, 0, 0, 0, 6);
  // verandas facing the palm court
  veranda(g, cols, 0, -1, 0, 33, 2);
  veranda(g, cols, -14, 6.5, Math.PI / 2, 9, 2);
  veranda(g, cols, 14, 6.5, -Math.PI / 2, 9, 2);
  // central pediment and sign
  Bx(g, 9, 1.4, 0.5, white, 0, WH + 1.0, -0.7, 1);
  Ms(g, new THREE.CylinderGeometry(3.4, 3.4, 0.5, 3), white, 0, WH + 2.72, -0.7, 1.3, 1, 0.6, -Math.PI / 2, 0, 0);
  sgn(g, 'COLONIAL HOTEL', 7, 0.8, 0, WH + 1.0, -0.38, 0, { bg: '#1a3a2a', fg: '#f4e6b0' });
  // upper-floor and flank windows
  for (let b = 0; b < 11; b++) win(g, 1.3, 2.3, -15 + b * 3, 10.6, -0.93, 0, { c: '#ffffff', lit: b % 4 === 1 });
  for (let b = 0; b < 12; b++) for (const yy of [2.4, 6.6, 10.8]) { win(g, 1.4, 2.4, -16.5 + b * 3, yy, -15.06, Math.PI, { fixed: true, c: '#ffffff' }); }
  for (const s of [-1, 1]) for (let b = 0; b < 4; b++) for (const yy of [2.4, 6.6, 10.8]) { win(g, 1.4, 2.4, s * 22.06, yy, 0.5 + b * 3, s * Math.PI / 2, { fixed: true, c: '#ffffff' }); }
  for (const s of [-1, 1]) for (const b of [-1, 1]) for (const yy of [2.4, 6.6, 10.8]) win(g, 1.5, 2.5, s * 18 + b * 2, yy, 12.07, 0, { c: '#ffffff', lit: yy > 8 && b > 0 });
  // palm court: lawn, path, fountain, palms, hedges, gate
  Bx(g, 28, 0.08, 15.4, mat('grass'), 0, 0.04, 6.3, 6); Bx(g, 4.4, 0.1, 15.4, mat('s6sg_paver'), 0, 0.06, 6.3, 3);
  Cy(g, 2.4, 2.5, 0.7, 14, C(0xe8e8e0), 0, 0.35, 6.5, 2); Ms(g, new THREE.CircleGeometry(2.1, 14), mat('water'), 0, 0.72, 6.5, 1, 1, 1, -Math.PI / 2);
  Cy(g, 0.3, 0.5, 1.8, 8, C(0xe8e8e0), 0, 1.6, 6.5, 1); Cy(g, 1.0, 0.3, 0.3, 10, C(0xe8e8e0), 0, 2.6, 6.5, 1); cols.push([-2.6, 2.6, 3.9, 9.1, 0.8]);
  [[-8, 2], [8, 2], [-8, 9.5], [8, 9.5], [-11.5, 5.5], [11.5, 5.5]].forEach(([x, z], i) => { buildPalm(g, x, z, 1, i + 1); cols.push([x - 0.35, x + 0.35, z - 0.35, z + 0.35, 11]); });
  for (const s of [-1, 1]) { Bx(g, 9.4, 1.0, 0.8, C(0x2f7a34), s * 9.7, 0.5, 14.4, 2); cols.push([s * 9.7 - 4.7, s * 9.7 + 4.7, 14, 14.8, 1.0]); Bx(g, 0.8, 2.4, 0.8, white, s * 5.0, 1.2, 14.4, 1); Sg(g, glow(0xfff2c8), s * 5.0, 2.7, 14.4, 0.3, 0.3, 0.3, 0, 0, 0, 6); cols.push([s * 5 - 0.45, s * 5 + 0.45, 14, 14.8, 2.4]); }
  Bx(g, 4.4, 0.06, 0.4, C(0x8a2a2a), 0, 0.1, 14.4, 1);
  return size(g, 44, 30, 20, cols);
}

// =====================================================================
// 14. Neoclassical grand hotel
// =====================================================================
export function fullertonHotel() {
  const g = G(), cols = [], st = mat('s6sg_limestone'), cream = C(0xe8dcc0), WH = 26;
  Bx(g, 50, WH, 20, st, 0, WH / 2, -4, 5); cols.push([-25, 25, -14, 6, WH + 1.2]);
  Bx(g, 50.8, 1.0, 20.8, cream, 0, WH + 0.5, -4, 3);
  for (const s of [-1, 1]) {                                                                    // corner pavilions
    Bx(g, 9, WH + 1.2, 2.6, st, s * 20.5, (WH + 1.2) / 2, 7.3, 5); cols.push([s * 20.5 - 4.5, s * 20.5 + 4.5, 6, 8.6, WH + 1.2]);
    Bx(g, 9.8, 1.2, 3.4, cream, s * 20.5, WH + 1.0, 7.3, 3); Bx(g, 9.8, 0.4, 3.4, cream, s * 20.5, 13.9, 7.3, 3);
    Ms(g, SPH(1, 8, 5), cream, s * 20.5, WH + 1.4, 7.3, 1.6, 0.9, 1.6);
  }
  // balustrade + urns on the roof
  Bx(g, 51, 0.9, 0.3, cream, 0, WH + 1.65, 6.3, 1); Bx(g, 51, 0.9, 0.3, cream, 0, WH + 1.65, -14.3, 1);
  for (let x = -24; x <= 24; x += 6) { Cy(g, 0.35, 0.25, 0.9, 8, cream, x, WH + 2.5, 6.3, 1); Cy(g, 0.35, 0.25, 0.9, 8, cream, x, WH + 2.5, -14.3, 1); }
  // giant-order colonnade
  const xs = [-13.1, -9.4, -5.6, -1.9, 1.9, 5.6, 9.4, 13.1];
  Bx(g, 32, 1.8, 5.2, cream, 0, 12.9, 8.4, 3); Bx(g, 33, 0.5, 5.8, cream, 0, 14.0, 8.4, 3);
  Bx(g, 32.6, 0.9, 0.25, cream, 0, 14.7, 11.0, 1);
  for (let x = -15; x <= 15; x += 2.5) Cy(g, 0.15, 0.12, 0.8, 6, cream, x, 14.6, 11.0, 1);
  xs.forEach((x) => { Cy(g, 0.6, 0.72, 11.6, 12, st, x, 6.8, 10.3, 2); Bx(g, 1.7, 0.5, 1.7, cream, x, 12.2, 10.3, 1); Bx(g, 1.5, 0.5, 1.5, cream, x, 0.75, 10.3, 1); cols.push([x - 0.7, x + 0.7, 9.6, 11, 12]); });
  Bx(g, 34, 0.5, 2.0, cream, 0, 0.25, 10.4, 2);
  Bx(g, 14.5, 0.45, 1.6, cream, -10.7, 0.22, 12.4, 2); Bx(g, 14.5, 0.45, 1.6, cream, 10.7, 0.22, 12.4, 2); cols.push([-18, -3.4, 11.6, 13.2, 0.5], [3.4, 18, 11.6, 13.2, 0.5]);
  Bx(g, 6.8, 0.2, 1.6, cream, 0, 0.1, 12.4, 1);
  sgn(g, 'HERITAGE HOTEL', 11, 1.1, 0, 12.9, 11.07, 0, { bg: '#2a2418', fg: '#e8d28a' });
  // central pediment
  Ms(g, new THREE.CylinderGeometry(7.5, 7.5, 0.8, 3), cream, 0, WH + 1.0 + 1.4, 3, 1, 1, 0.38, -Math.PI / 2, 0, 0);
  // windows (front, back, sides)
  for (let f = 0; f < 4; f++) {
    const yy = 3.4 + f * 5.9;
    for (let i = 0; i < 11; i++) {
      const x = -22.5 + i * 4.5; if (Math.abs(x) < 0.1 && f === 0) continue;
      win(g, 1.7, 3.2, x, yy, Math.abs(x) > 16 ? 8.67 : 6.07, 0, { lit: (i + f) % 5 === 0, c: '#fdf8ea' });
      win(g, 1.7, 3.2, x, yy, -14.07, Math.PI, { fixed: true, c: '#fdf8ea' });
    }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) win(g, 1.7, 3.2, s * 25.07, yy, -13 + i * 5.2, s * Math.PI / 2, { fixed: true, c: '#fdf8ea' });
  }
  door(g, 2.6, 4.0, 0, 2.0, 6.09, 0, '#3a2a1a');
  Bx(g, 8, 2.2, 6, C(0xc8ccce), -10, WH + 2.6, -9, 2); Bx(g, 8, 2.2, 6, C(0xc8ccce), 10, WH + 2.6, -9, 2);
  Bx(g, 12, 0.2, 0.2, glow(NEO), 0, 14.3, 11.0, 1).userData.keep = true;
  return size(g, 50, 28, 28, cols);
}

// =====================================================================
// 15. Merlion
// =====================================================================
export function merlion() {
  const g = G(), sc = mat('s6sg_scales'), wh = C(0xe8ecee), rock = C(0x9a9e9a);
  const rim = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(6.0, 0), new THREE.Vector2(6.0, 0.9), new THREE.Vector2(6.6, 0.9), new THREE.Vector2(6.6, 0)], 26), lamb('concrete'));
  g.add(rim);
  Ms(g, new THREE.CircleGeometry(6.0, 24), mat('water'), 0, 0.7, 0, 1, 1, 1, -Math.PI / 2);
  Cy(g, 3.0, 3.6, 1.0, 12, rock, 0, 0.5, 0, 3); Cy(g, 2.2, 2.9, 2.4, 10, rock, 0, 2.1, 0, 3); Cy(g, 2.6, 2.5, 0.2, 10, C(0xc8ccd0), 0, 3.3, 0, 2);
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; Sg(g, C(0xcfe6f0), Math.cos(a) * 2.9, 0.9, Math.sin(a) * 2.9, 0.8, 0.5, 0.8, 0, 0, 0, 6); }
  const parts = [[0, 4.2, -0.2, 2.2, 1.4, 2.2], [0, 6.0, 0, 1.9, 2.2, 1.9], [0, 8.2, 0.3, 1.7, 1.5, 1.7], [0, 3.8, -2.4, 1.4, 1.2, 1.5], [0, 4.7, -3.8, 1.15, 1.2, 1.15], [0, 6.1, -4.6, 0.95, 1.2, 0.95]];
  for (const [x, y, z, a, b, c] of parts) Sg(g, sc, x, y, z, a, b, c, 0, 0, 0, 12);
  for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; Bx(g, 0.22, 1.7, 0.9, wh, Math.sin(a) * 0.9, 7.9 + Math.cos(a) * 0.9 - 0.9, -4.9, 1).rotation.z = a * 0.8; }
  Sg(g, sc, 0, 10.4, 0.7, 2.25, 2.2, 2.2, 0, 0, 0, 14);
  const mane = [];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; mane.push(gT(new THREE.ConeGeometry(0.42, 1.5, 5), Math.cos(a) * 2.55, 10.4 + Math.sin(a) * 2.55, 0.0, 1, 1, 1, 0, 0, a - Math.PI / 2)); }
  mg(g, mane, wh);
  Bx(g, 1.9, 0.85, 1.7, wh, 0, 10.5, 2.4, 1); Bx(g, 1.6, 0.4, 1.4, wh, 0, 9.5, 2.2, 1); Bx(g, 1.5, 0.5, 1.3, C(0x2a2224), 0, 9.9, 2.25, 1);
  for (const s of [-1, 1]) { Sg(g, C(0x1a1a1c), s * 0.78, 10.95, 2.0, 0.2, 0.2, 0.2, 0, 0, 0, 6); Ms(g, new THREE.ConeGeometry(0.5, 0.8, 5), wh, s * 1.7, 12.3, 0.2, 1, 1, 1, 0, 0, -s * 0.35); Bx(g, 0.7, 0.14, 0.4, wh, s * 0.78, 11.3, 2.1, 1); }
  Sg(g, C(0x1a1a1c), 0, 10.85, 3.25, 0.26, 0.2, 0.2, 0, 0, 0, 6);
  const sp = tubeMesh([[0, 9.9, 3.0], [0, 10.6, 3.8], [0, 10.1, 4.5], [0, 7.5, 5.1], [0, 3.0, 5.4], [0, 0.8, 5.5]], 0.17, 18, 5, basicA(0xd8f4ff, 0.75));
  sp.renderOrder = 3; g.add(sp);
  Ms(g, new THREE.TorusGeometry(0.9, 0.08, 4, 14), basicA(0xffffff, 0.7), 0, 0.74, 5.5, 1, 1, 1, Math.PI / 2);
  Bx(g, 3.6, 0.1, 0.08, glow(NEO), 0, 0.62, 6.64, 1).userData.keep = true;
  return size(g, 14, 14, 14, ellCols(0, 0, 6.7, 6.7, 0.9, 6));
}

// =====================================================================
// 16. Helix bridge
// =====================================================================
export function helixBridge() {
  const g = G(), steel = shiny(0xdde2e4, 80), x0 = -21.5, x1 = 21.5, Rr = 3.3, cyy = 5.9, N = 66, A = [], B = [];
  for (let i = 0; i <= N; i++) { const t = i / N, x = x0 + (x1 - x0) * t, a = t * 3.5 * Math.PI * 2; A.push([x, cyy + Math.sin(a) * Rr * 0.9, Math.cos(a) * Rr]); B.push([x, cyy - Math.sin(a) * Rr * 0.9, -Math.cos(a) * Rr]); }
  const s1 = [], s2 = [], rung = [];
  for (let i = 0; i < N; i++) { s1.push([A[i], A[i + 1]]); s2.push([B[i], B[i + 1]]); }
  for (let i = 0; i <= N; i += 2) rung.push([A[i], B[i]]);
  rods(g, s1, 0.26, steel, 5); rods(g, s2, 0.26, C(0xc4cacd), 5); rods(g, rung, 0.06, steel, 3);
  Bx(g, 44, 0.45, 6.4, mat('s6sg_paver'), 0, 2.35, 0, 4);
  for (const s of [-1, 1]) { Bx(g, 44, 0.3, 0.3, C(0x6a747a), 0, 2.7, s * 3.2, 1); Bx(g, 44, 0.5, 0.2, C(0xcfd6d8), 0, 2.0, s * 3.1, 1); }
  const tr = []; for (let i = 0; i < 11; i++) { const x = -20 + i * 4; tr.push([[x, 2.1, -2.8], [x + 2, 1.0, 0]], [[x + 2, 1.0, 0], [x + 4, 2.1, 2.8]], [[x, 2.1, 2.8], [x + 2, 1.0, 0]], [[x + 2, 1.0, 0], [x + 4, 2.1, -2.8]]); }
  rods(g, tr, 0.07, steel, 3);
  const lights = [];
  for (let i = 0; i <= N; i += 3) lights.push(gT(SPH(1, 4, 3), A[i][0], 2.85, A[i][2] * 0.0 + (i % 6 ? 3.15 : -3.15), 0.12));
  mg(g, lights, glow(0xfff2c8)).userData.keep = true;
  const cols = [], cab = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const px = sx * 22.4, pz = sz * 3.5;
    Bx(g, 0.8, 12, 0.8, C(0xe4e8ea), px, 6, pz, 2); Bx(g, 1.3, 0.5, 1.3, C(0x6a747a), px, 0.25, pz, 1); Sg(g, glow(NEO), px, 12.3, pz, 0.28).userData.keep = true;
    cab.push([[px, 11.6, pz], [px - sx * 9, 2.6, pz * 0.9]], [[px, 11.6, pz], [px - sx * 17, 2.6, pz * 0.9]]);
    cols.push([px - 0.45, px + 0.45, pz - 0.45, pz + 0.45, 12]);
  }
  rods(g, cab, 0.05, steel, 3);
  return size(g, 46, 8, 12.6, cols);
}

// =====================================================================
// 17. Finance towers
// =====================================================================
export function financeTower(opts = {}) {
  const v = (opts.variant | 0) % 4, g = G(), cols = [], glass = [mat('s6sg_glassA'), mat('s6sg_glassB'), mat('s6sg_glassC'), mat('s6sg_glassD')][v], dk = C(0x2a323a), wh = C(0xe8eef2);
  const lobby = (w, d, h, label) => {
    Bx(g, w, h, d, glassM(0x6aa0c8, 0.88), 0, h / 2, 0, 3); Bx(g, w + 1, 0.5, d + 1, wh, 0, h + 0.25, 0, 2);
    for (let k = -2; k <= 2; k++) Bx(g, 0.3, h, 0.3, wh, k * w / 5, h / 2, d / 2 + 0.17, 1);
    sgn(g, label, 8, 0.9, 0, h - 1.0, d / 2 + 0.1, 0, { bg: '#10202c', fg: '#ffffff', border: '#00E599' });
    Bx(g, w * 0.5, 0.3, 1.8, wh, 0, h - 0.2, d / 2 + 0.9, 2);
    cols.push([-w / 2, w / 2, -d / 2, d / 2, h]);
  };
  if (v === 0) {
    lobby(22, 22, 6, 'CAPITAL TOWER');
    Bx(g, 17, 94, 17, glass, 0, 53, 0, 8);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) Bx(g, 1.2, 94.4, 1.2, wh, sx * 8.6, 53, sz * 8.6, 2);
    Bx(g, 14, 5, 14, glass, 0, 102.5, 0, 6); Bx(g, 15, 0.8, 15, wh, 0, 100.4, 0, 2); Bx(g, 9, 3, 9, dk, 0, 106.5, 0, 3);
    Bx(g, 15.4, 0.3, 15.4, glow(NEO), 0, 105.2, 0, 2).userData.keep = true;
    rods(g, [[[0, 108, 0], [0, 114, 0]]], 0.15, wh, 4);
    cols.push([-8.5, 8.5, -8.5, 8.5, 108]);
  } else if (v === 1) {
    lobby(22, 22, 6, 'TRADE CENTRE');
    const o1 = cylT(8.6, 9.0, 100, 8, glass, 8), o2 = cylT(7.4, 7.8, 76, 8, glass, 8);
    o1.geometry.rotateY(Math.PI / 8); o2.geometry.rotateY(Math.PI / 8);
    o1.position.set(-2, 56, -2.5); o2.position.set(3.5, 44, 3.5); g.add(o1, o2);
    Cy(g, 9.2, 9.2, 0.8, 8, wh, -2, 106.4, -2.5, 3).geometry.rotateY(Math.PI / 8); Cy(g, 8.0, 8.0, 0.8, 8, wh, 3.5, 82.4, 3.5, 3).geometry.rotateY(Math.PI / 8);
    rods(g, [[[-2, 107, -2.5], [-2, 112, -2.5]]], 0.12, wh, 4);
    cols.push([-10.3, 6.3, -10.8, 5.8, 106], [-3.7, 10.7, -3.7, 10.7, 82]);
  } else if (v === 2) {
    lobby(22, 22, 6, 'HARBOUR PLAZA');
    Bx(g, 20, 50, 20, glass, 0, 31, 0, 8); Bx(g, 20.8, 0.8, 20.8, wh, 0, 56.4, 0, 2);
    Bx(g, 16, 36, 16, glass, 0, 74, 0, 8); Bx(g, 16.8, 0.8, 16.8, wh, 0, 92.4, 0, 2);
    Bx(g, 11, 14, 11, glass, 0, 99.8, 0, 6); Bx(g, 11.8, 0.8, 11.8, wh, 0, 107.2, 0, 2);
    rods(g, [[[0, 107.5, 0], [0, 114, 0]]], 0.14, wh, 4);
    cols.push([-10, 10, -10, 10, 56], [-8, 8, -8, 8, 92], [-5.5, 5.5, -5.5, 5.5, 107]);
  } else {
    const t = cylT(8.6, 9.4, 108, 14, glass, 8); t.position.set(0, 54, 0); g.add(t);
    for (const y of [20, 40, 60, 80, 100]) Ms(g, new THREE.TorusGeometry(9.1 - (100 - y) * 0.0, 0.25, 4, 16), wh, 0, y, 0, 1, 1, 1, Math.PI / 2);
    Ms(g, new THREE.ConeGeometry(8.6, 8, 14), shiny(0xcfd8de, 50), 0, 112, 0);
    rods(g, [[[0, 115, 0], [0, 121, 0]]], 0.15, wh, 4);
    Bx(g, 8, 2.0, 0.2, glassM(0x6aa0c8, 0.9), 0, 3, 9.4, 1); sgn(g, 'MERIDIAN', 7, 0.9, 0, 4.4, 9.5, 0, { bg: '#10202c', fg: '#fff', border: '#00E599' });
    cols.push([-9.1, 9.1, -3.7, 3.7, 108], [-3.7, 3.7, -9.1, 9.1, 108], [-6.5, 6.5, -6.5, 6.5, 108]);
  }
  return size(g, 22, 22, v === 3 ? 121 : v === 1 ? 112 : v === 2 ? 114 : 114, cols);
}

// =====================================================================
// 18-23. Props
// =====================================================================
export function rainTree() {
  const g = G(), bark = C(0x6a5440);
  Cy(g, 0.45, 0.75, 5.6, 8, bark, 0.15, 2.8, 0, 2);
  rods(g, [[[0.2, 5, 0], [-2.2, 6.7, 0.6]], [[0.2, 5, 0], [2.4, 6.6, -0.5]], [[0.2, 5.2, 0], [0.3, 7.0, 2.3]], [[0.2, 5.2, 0], [-0.4, 6.8, -2.4]]], 0.3, bark, 5);
  const lumps = [[0, 8.1, 0, 3.8, 1.7, 3.8], [-2.6, 7.4, 0.8, 2.6, 1.3, 2.6], [2.8, 7.3, -0.6, 2.6, 1.3, 2.6], [0.3, 7.2, 2.7, 2.5, 1.2, 2.4], [-0.5, 7.3, -2.8, 2.5, 1.2, 2.4], [0.5, 8.9, 0.3, 2.6, 1.0, 2.5]];
  const a = [], b = [];
  lumps.forEach(([x, y, z, sx, sy, sz], i) => (i % 2 ? a : b).push(gT(SPH(1, 9, 6), x, y, z, sx, sy, sz)));
  mg(g, a, C(0x3f8c3c)); mg(g, b, C(0x4f9e46));
  const ep = []; for (let i = 0; i < 6; i++) ep.push(gT(new THREE.BoxGeometry(0.3, 0.3, 0.3), Math.cos(i * 1.1) * 2.8, 6.6, Math.sin(i * 1.1) * 2.8, 1, 1, 1, i, i, 0));
  mg(g, ep, C(0xe8508a));
  return size(g, 8, 8, 10, [[-0.6, 0.9, -0.6, 0.6, 10]]);
}
export function palm() {
  const g = G(); buildPalm(g, 0, 0, 1, 5);
  return size(g, 4.4, 4.4, 12, [[-0.35, 0.35, -0.35, 0.35, 12]]);
}
export function bayLamp() {
  const g = G(), dk = C(0x1f3a2e), gold = C(0xc8a850);
  Bx(g, 0.5, 0.25, 0.5, dk, 0, 0.125, 0, 1); Cy(g, 0.14, 0.2, 0.9, 8, dk, 0, 0.7, 0, 1); Cy(g, 0.07, 0.11, 3.6, 8, dk, 0, 2.7, 0, 1); Cy(g, 0.16, 0.1, 0.25, 8, gold, 0, 1.2, 0, 1);
  rods(g, [[[0, 4.1, 0], [-0.3, 4.45, 0]], [[0, 4.1, 0], [0.3, 4.45, 0]]], 0.04, dk, 4);
  for (const s of [-1, 1]) { Sg(g, glow(0xfff1c8), s * 0.3, 4.65, 0, 0.2, 0.24, 0.2, 0, 0, 0, 8).userData.keep = true; Cy(g, 0.04, 0.12, 0.15, 6, dk, s * 0.3, 4.9, 0, 1); }
  Cy(g, 0.03, 0.08, 0.3, 6, gold, 0, 4.25, 0, 1);
  return size(g, 0.6, 0.6, 5, [[-0.25, 0.25, -0.25, 0.25, 5]]);
}
function hullGeo(len, wid, h, seg, keel) {
  const geo = new THREE.BoxGeometry(len, h, wid, seg, 1, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = Math.abs(x) / (len / 2), tp = 1 - 0.82 * Math.pow(t, 2.4);
    p.setZ(i, z * tp * (y < 0 ? keel : 1)); p.setY(i, y + (y > 0 ? 0.5 * t * t * h : 0));
  }
  geo.translate(0, h / 2, 0); geo.computeVertexNormals(); return geo;
}
function boat(g, o) {
  const hull = new THREE.Mesh(hullGeo(o.len, o.wid, o.h, 10, 0.55), o.hullM); g.add(hull);
  const rimL = []; 
  for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const x = -o.len / 2 + o.len * i / 10, t = Math.abs(x) / (o.len / 2); pts.push([x, o.h + 0.5 * t * t * o.h + 0.03, s * o.wid / 2 * (1 - 0.82 * Math.pow(t, 2.4))]); } for (let i = 0; i < 10; i++) rimL.push([pts[i], pts[i + 1]]); }
  rods(g, rimL, 0.07, o.rimM, 4);
}
export function dragonBoat() {
  const g = G(), red = C(0xc8352a), gold = C(0xe8b838), green = C(0x2a8a5a), wood = C(0xb88c5a);
  boat(g, { len: 9.4, wid: 1.5, h: 0.65, hullM: red, rimM: gold });
  Bx(g, 7.8, 0.06, 1.0, wood, 0, 0.5, 0, 2);
  const seats = [], pad = [];
  for (let i = 0; i < 9; i++) { const x = -3.4 + i * 0.85; seats.push(gT(new THREE.BoxGeometry(0.28, 0.1, 1.3), x, 0.78, 0)); for (const s of [-1, 1]) pad.push(rod([x + 0.1, 0.95, s * 0.75], [x + 0.35, 0.05, s * 1.75], 0.03, 3)); }
  mg(g, seats, wood); mg(g, pad, C(0xe8c860));
  rods(g, [[[4.3, 0.7, 0], [4.9, 1.5, 0]], [[4.9, 1.5, 0], [5.1, 2.2, 0]]], 0.17, green, 5);
  Bx(g, 0.9, 0.55, 0.65, green, 5.35, 2.45, 0, 1); Bx(g, 0.5, 0.3, 0.55, gold, 5.9, 2.3, 0, 1); Bx(g, 0.5, 0.2, 0.5, red, 5.85, 2.1, 0, 1);
  for (const s of [-1, 1]) { Sg(g, C(0xffffff), 5.4, 2.7, s * 0.33, 0.1, 0.1, 0.1, 0, 0, 0, 6); Ms(g, new THREE.ConeGeometry(0.1, 0.7, 5), gold, 5.15, 3.0, s * 0.25, 1, 1, 1, 0, 0, 0.7); }
  Sg(g, red, 4.75, 2.15, 0, 0.12, 0.5, 0.35, 0, 0, 0, 6);
  rods(g, [[[-4.4, 0.7, 0], [-4.8, 1.2, 0]], [[-4.8, 1.2, 0], [-5.05, 1.9, 0]]], 0.12, green, 5);
  Ms(g, new THREE.ConeGeometry(0.35, 0.9, 4), gold, -5.05, 2.2, 0, 1, 1, 0.3);
  Bx(g, 0.5, 0.6, 0.5, red, -0.4, 1.0, 0, 1);
  g.userData.solid = false;
  return size(g, 12, 3.4, 3.3, []);
}
export function bumboat() {
  const g = G(), wood = C(0x8a5a30), blue = C(0x2a5a8a), white = C(0xf4f0e4);
  boat(g, { len: 7.4, wid: 2.0, h: 0.95, hullM: blue, rimM: C(0xe8e0c8) });
  Bx(g, 6.0, 0.08, 1.5, wood, 0.0, 0.8, 0, 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Cy(g, 0.05, 0.05, 1.7, 5, wood, sx * 2.3 - 0.4, 1.65, sz * 0.8, 1);
  Bx(g, 5.2, 0.1, 2.0, mat('s6sg_stripeG'), -0.4, 2.55, 0, 2);
  for (const s of [-1, 1]) Bx(g, 5.2, 0.35, 0.06, mat('s6sg_stripeG'), -0.4, 2.4, s * 1.0, 2);
  Bx(g, 1.2, 0.08, 0.6, wood, -0.4, 1.35, 0.55, 1); Bx(g, 1.2, 0.5, 0.4, white, 1.5, 1.05, -0.4, 1); Bx(g, 0.5, 0.5, 0.5, C(0xc8352a), -2.4, 1.1, 0.4, 1);
  for (const s of [-1, 1]) { Sg(g, white, 2.4, 0.62, s * 0.74, 0.2, 0.2, 0.04, 0, 0, 0, 8); Sg(g, C(0x101010), 2.44, 0.62, s * 0.77, 0.1, 0.1, 0.03, 0, 0, 0, 6); }
  rods(g, [[[3.5, 0.9, 0], [3.9, 1.7, 0]]], 0.08, wood, 4);
  for (const x of [-2.5, 1.7]) Sg(g, glow(0xff5a30), x, 2.1, 1.0, 0.16, 0.2, 0.16, 0, 0, 0, 6);
  Sg(g, glow(0xff5a30), 1.7, 2.1, -1.0, 0.16, 0.2, 0.16, 0, 0, 0, 6);
  g.userData.solid = false;
  return size(g, 8, 3, 3, []);
}
export function promenadeRail() {
  const g = G(), dk = C(0x1f3a2e), gold = C(0xc8a850), n = 9;
  Bx(g, 20, 0.2, 0.5, C(0xc9c1b2), 0, 0.1, 0, 3);
  const posts = [], balls = [];
  for (let i = 0; i < n; i++) { const x = -10 + 0.25 + i * 19.5 / (n - 1); posts.push(gT(new THREE.BoxGeometry(0.16, 1.1, 0.16), x, 0.75, 0)); balls.push(gT(SPH(1, 6, 4), x, 1.38, 0, 0.12)); }
  mg(g, posts, dk); mg(g, balls, gold);
  Bx(g, 19.5, 0.1, 0.16, dk, 0, 1.3, 0, 1); Bx(g, 19.5, 0.06, 0.1, dk, 0, 0.85, 0, 1); Bx(g, 19.5, 0.06, 0.1, dk, 0, 0.5, 0, 1);
  const bal = []; for (let i = 0; i < 38; i++) bal.push(gT(new THREE.BoxGeometry(0.04, 0.9, 0.04), -9.5 + i * 0.5, 0.82, 0)); mg(g, bal, dk);
  sgn(g, 'MARINA BAY WALK', 1.6, 0.3, 4, 1.0, 0.1, 0, { bg: '#1f3a2e', fg: '#f4e6b0' });
  return size(g, 20, 1, 1.4, [[-10, 10, -0.3, 0.3, 1.2]]);
}
export function merlionRegDesk() {
  const g = G(), wh = C(0xf4f6f6), dk = C(0x20252c);
  Bx(g, 5, 0.02, 2, mat('s6sg_carpet'), 0, 0.01, 0, 2);
  Bx(g, 4.8, 1.0, 1.1, wh, 0, 0.5, 0, 2); Bx(g, 5.0, 0.08, 1.3, dk, 0, 1.04, 0, 2);
  sgn(g, 'REGISTRATION', 4.2, 0.75, 0, 0.5, 0.6, 0, { bg: '#0e2a4a', fg: '#ffffff', border: '#00E599' });
  Bx(g, 4.6, 0.06, 0.06, glow(NEO), 0, 0.96, 0.58, 1).userData.keep = true;
  for (const x of [-1.6, 1.6]) { Bx(g, 0.7, 0.38, 0.05, dk, x, 1.3, -0.1, 1).rotation.x = -0.25; Bx(g, 0.1, 0.2, 0.1, dk, x, 1.18, -0.1, 1); flat(g, flatMap('s6sg_led2'), 0.62, 0.3, x, 1.3, -0.16, Math.PI, -0.25); }
  Bx(g, 0.5, 0.3, 0.04, C(0xe8c860), 0, 1.2, 0.3, 1); sgn(g, 'WELCOME', 0.46, 0.2, 0, 1.2, 0.35, 0, { bg: '#0e2a4a', fg: '#fff', border: null });
  return size(g, 5, 2, 1.45, [[-2.5, 2.5, -0.65, 0.65, 1.2]]);
}
