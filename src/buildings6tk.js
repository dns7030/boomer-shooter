// Tokyo: a neon-drenched dusk/night district (Shibuya + Shinjuku + Asakusa stereotypes).
// Same conventions as the other building files: origin = footprint centre on the ground, front faces local +Z,
// group.userData = { w, d, h[, cols] }.  Textures are prefixed s6tk_.  NO CJK glyphs anywhere: signs are graphic or Latin.
// Night look: facades are Lambert + emissiveMap (lit windows), signs are MeshBasicMaterial (glow), lanterns are emissive.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, decal } from './geo.js';
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
const basic = (hex) => keyed(`b${hex}`, () => new THREE.MeshBasicMaterial({ color: hex }));
const flatM = (name) => keyed(`f${name}`, () => new THREE.MeshBasicMaterial({ map: tex(name) }));
const flatD = (name) => keyed(`fd${name}`, () => new THREE.MeshBasicMaterial({ map: tex(name), side: THREE.DoubleSide }));
// facade: diffuse map + emissive map (name + 'E') so lit windows glow at night
const litM = (name, e = 0xffffff) => keyed(`l${name}${e}`, () => new THREE.MeshLambertMaterial({ map: tex(name), emissiveMap: tex(name + 'E'), emissive: e }));
// texture that is its own (dim) emissive map: paper noren, interior walls ...
const selfLit = (name, e = 0x707070, dbl = false) => keyed(`s${name}${e}${dbl}`, () => new THREE.MeshLambertMaterial({ map: tex(name), emissiveMap: tex(name), emissive: e, side: dbl ? THREE.DoubleSide : THREE.FrontSide }));
const glassM = (hex, op) => keyed(`g${hex}_${op}`, () => new THREE.MeshLambertMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.25, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
const shiny = (hex, sh = 60) => keyed(`p${hex}_${sh}`, () => new THREE.MeshPhongMaterial({ color: hex, shininess: sh, specular: 0x666666 }));
const tileRoofM = () => keyed('tileRoof', () => new THREE.MeshLambertMaterial({ map: tex('s6tk_tile'), emissive: 0x1a2028, side: THREE.DoubleSide }));

// ---- scene-building helpers (add to g, return the mesh) ----
const Bx = (g, w, h, d, m, x, y, z, tile = 3) => { const b = boxT(w, h, d, m, tile); b.position.set(x, y, z); g.add(b); return b; };
const Cy = (g, rt, rb, h, n, m, x, y, z, tile = 3) => { const b = cylT(rt, rb, h, n, m, tile); b.position.set(x, y, z); g.add(b); return b; };
const Ms = (g, geo, m, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); g.add(o); return o;
};
const _sph = {};
const SPH = (a = 12, b = 8) => _sph[`${a}_${b}`] || (_sph[`${a}_${b}`] = new THREE.SphereGeometry(1, a, b));
const Sg = (g, m, x, y, z, sx, sy = sx, sz = sx, n = 12) => Ms(g, SPH(n, Math.max(4, Math.round(n * 0.65))), m, x, y, z, sx, sy, sz);
const win = (g, w, h, x, y, z, ry = 0, o = {}) => { const d = decal('window', w, h, x, y, z, { c: '#d8d2c0', ...o }); d.rotation.y = ry; g.add(d); return d; };
const door = (g, w, h, x, y, z, ry = 0, c = '#4a3a2a') => { const d = decal('door', w, h, x, y, z, { c }); d.rotation.y = ry; g.add(d); return d; };
const pl = (g, m, w, h, x, y, z, ry = 0, rx = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); g.add(p); return p; };
const sgn = (g, text, w, h, x, y, z, ry = 0, o = {}) => { const s = sign(text, w, h, o); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; };
const panel = (g, name, w, h, x, y, z, ry = 0) => pl(g, flatM(name), w, h, x, y, z, ry);

function rod(a, b, r, seg = 5) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const geo = new THREE.CylinderGeometry(r, r, len, seg, 1, true);
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
const rods = (g, list, r, m, seg = 5) => { if (!list.length) return null; const me = new THREE.Mesh(merge(list.map(([a, b]) => rod(a, b, r, seg))), m); g.add(me); return me; };
// merged boxes: [[w,h,d,x,y,z], ...]
const boxes = (g, list, m) => {
  if (!list.length) return null;
  const gs = list.map(([w, h, d, x, y, z]) => { const b = new THREE.BoxGeometry(w, h, d); b.translate(x, y, z); return b; });
  const me = new THREE.Mesh(merge(gs), m); g.add(me); return me;
};
// box with a lit facade texture on the four sides (integer texture repeats) and a plain roof
function fbox(g, w, h, d, name, x, y, z, tile = 12, roof = null) {
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [a, b] = dims[f]; const nu = Math.max(1, Math.round(a / tile)), nv = Math.max(1, Math.round(b / tile));
    for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * (f === 2 || f === 3 ? a / 6 : nu), uv.getY(k) * (f === 2 || f === 3 ? b / 6 : nv)); }
  }
  const s = litM(name), t = roof || C(0x3a3d48);
  const m = new THREE.Mesh(geo, [s, s, t, t, s, s]); m.position.set(x, y, z); g.add(m); return m;
}
// concave hip-roof lofted through rectangular rings [{y,hx,hz}] (outer ring first); double sided
function loft(g, rings, m, x, y, z, tile = 3) {
  const pos = [], uv = [];
  const cn = (r, k) => [[-r.hx, r.y, r.hz], [r.hx, r.y, r.hz], [r.hx, r.y, -r.hz], [-r.hx, r.y, -r.hz]][k];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < 4; k++) {
    const a = cn(rings[i], k), b = cn(rings[i], (k + 1) % 4), c = cn(rings[i + 1], (k + 1) % 4), d = cn(rings[i + 1], k);
    const lab = dist(a, b) / tile, lcd = dist(d, c) / tile, V = dist([(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2], [(c[0] + d[0]) / 2, c[1], (c[2] + d[2]) / 2]) / tile;
    const U = (lab - lcd) / 2;
    for (const [p, u, v] of [[a, 0, 0], [b, lab, 0], [c, lab - U, V], [a, 0, 0], [c, lab - U, V], [d, U, V]]) { pos.push(...p); uv.push(u, v); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
  const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); g.add(me); return me;
}
// Japanese curved-eave roof: eave tip at y0, low point, concave rise to a ridge.  hx,hz = half sizes at the eave tip.
function curvedRoof(g, hx, hz, rise, x, y, z, m = tileRoofM(), ridge = 0.25) {
  const k = (f) => Math.max(0.01, f);
  loft(g, [
    { y: 0.45, hx, hz }, { y: 0, hx: hx - 1.1, hz: hz - 1.1 },
    { y: rise * 0.45, hx: k(hx * 0.62 - 0.2), hz: k(hz * 0.62 - 0.2) },
    { y: rise * 0.8, hx: k(hx * 0.3), hz: k(hz * 0.3) }, { y: rise, hx: Math.max(ridge, hx * 0.12), hz: Math.max(0.02, hz * 0.12) },
  ].map((r) => ({ ...r, y: r.y })), m, x, y, z, 3);
  Bx(g, 2 * (hx - 1.1) + 0.2, 0.25, 2 * (hz - 1.1) + 0.2, C(0x2b1d17), x, y - 0.1, z, 2);   // dark soffit under the eave
}
// footprint rectangles approximating a circle (conservative: strip uses the far edge)
function circleCols(r, h, n = 8) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const z0 = -r + (2 * r * i) / n, z1 = -r + (2 * r * (i + 1)) / n, zf = Math.max(Math.abs(z0), Math.abs(z1));
    const hx = Math.sqrt(Math.max(0, r * r - zf * zf)) * 0.98; if (hx > 0.3) out.push([-hx, hx, z0, z1, h]);
  }
  return out;
}
function lantern(g, x, y, z, r = 0.35, h = 0.55, m = null) {
  m = m || flatM('s6tk_lantern');
  Ms(g, SPH(10, 7), m, x, y, z, r, h, r);
  Cy(g, r * 0.55, r * 0.55, 0.07, 8, basic(0x15110f), x, y + h * 0.98, z, 1);
  Cy(g, r * 0.55, r * 0.55, 0.07, 8, basic(0x15110f), x, y - h * 0.98, z, 1);
}

// ---------- textures ----------
const noise = (g, w, h, r, n, cols, s = 1) => { for (let i = 0; i < n; i++) R(g, (r() * w) | 0, (r() * h) | 0, s, s, pick(r, cols)); };
const NEON = ['#ff2d95', '#19e6ff', '#ffe81a', '#ff2a2a', '#ffffff', '#b06cff', '#52ff9a'];
const WORDS = ['RAMEN', 'GAME', 'BAR', 'SUSHI', '24H', 'KARAOKE', 'MART', 'CAFE', 'BEER', 'DISCO', 'PUB', 'SPA', 'PIZZA', 'LOVE', 'MEOW', 'BOWL'];
function neonStroke(g, c, lw, path) {
  g.save(); g.shadowColor = c; g.shadowBlur = 6; g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); path(); g.stroke(); g.restore();
}
function cellArt(g, x, y, w, h, kind, c, c2, r) {
  const cx = x + w / 2, cy = y + h / 2, m = Math.min(w, h) / 2 - 4;
  if (kind === 0) {                 // word
    const t = pick(r, WORDS); let s = Math.round(h * 0.5); g.font = `bold ${s}px Arial, Helvetica, sans-serif`;
    while (g.measureText(t).width > w - 8 && s > 8) { s -= 2; g.font = `bold ${s}px Arial, Helvetica, sans-serif`; }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.save(); g.shadowColor = c; g.shadowBlur = 5; g.fillStyle = c; g.fillText(t, cx, cy + 1); g.restore();
    R(g, x + 6, y + h - 5, w - 12, 2, c2);
  } else if (kind === 1) {          // concentric rings
    for (let i = 0; i < 3; i++) neonStroke(g, i % 2 ? c2 : c, 2.2, () => g.arc(cx, cy, m * (1 - i * 0.32), 0, 6.283));
  } else if (kind === 2) {          // arrow
    g.fillStyle = c; g.beginPath(); g.moveTo(cx - m, cy - m * 0.3); g.lineTo(cx, cy - m * 0.3); g.lineTo(cx, cy - m); g.lineTo(cx + m, cy); g.lineTo(cx, cy + m); g.lineTo(cx, cy + m * 0.3); g.lineTo(cx - m, cy + m * 0.3); g.fill();
    R(g, x + 4, y + 3, w - 8, 2, c2);
  } else if (kind === 3) {          // cat face
    neonStroke(g, c, 2.4, () => { g.arc(cx, cy + 2, m * 0.8, 0, 6.283); g.moveTo(cx - m * 0.75, cy - m * 0.3); g.lineTo(cx - m * 0.7, cy - m); g.lineTo(cx - m * 0.2, cy - m * 0.6); g.moveTo(cx + m * 0.75, cy - m * 0.3); g.lineTo(cx + m * 0.7, cy - m); g.lineTo(cx + m * 0.2, cy - m * 0.6); });
    R(g, cx - m * 0.4, cy - 2, 3, 4, c2); R(g, cx + m * 0.4 - 3, cy - 2, 3, 4, c2);
    neonStroke(g, c2, 1.2, () => { g.moveTo(cx - m * 1.0, cy + 3); g.lineTo(cx - m * 0.45, cy + 5); g.moveTo(cx + m * 1.0, cy + 3); g.lineTo(cx + m * 0.45, cy + 5); });
  } else if (kind === 4) {          // equalizer bars
    const n = Math.max(3, Math.floor(w / 9)); for (let i = 0; i < n; i++) { const bh = (0.25 + r() * 0.7) * (h - 10); R(g, x + 5 + i * ((w - 10) / n), y + h - 5 - bh, (w - 10) / n - 2, bh, i % 2 ? c : c2); }
  } else if (kind === 5) {          // star
    g.fillStyle = c; g.beginPath(); for (let j = 0; j < 10; j++) { const a = j * 0.628 - 1.571, rr = j % 2 ? m * 0.42 : m; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.fill();
  } else {                          // diagonal stripes
    g.save(); g.beginPath(); g.rect(x + 3, y + 3, w - 6, h - 6); g.clip();
    for (let i = -h; i < w + h; i += 9) { g.fillStyle = (i / 9) % 2 ? c : c2; g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + 5, y + h); g.lineTo(x + i + 5 + h, y); g.lineTo(x + i + h, y); g.fill(); }
    g.restore();
  }
}
function neonPanel(g, w, h, seed, vert) {
  const r = mulberry(seed), bg = pick(r, ['#12061f', '#08122a', '#1c0614', '#0a1a22', '#190a38']), c1 = pick(r, NEON), c2 = pick(r, NEON.filter((q) => q !== c1));
  R(g, 0, 0, w, h, bg);
  R(g, 0, 0, w, h, 'rgba(255,255,255,0.05)');
  neonStroke(g, c1, 3, () => g.rect(3, 3, w - 6, h - 6));
  g.strokeStyle = c2; g.lineWidth = 1; g.strokeRect(7, 7, w - 14, h - 14);
  if (vert && r() < 0.45) {         // stacked letters
    const t = pick(r, ['BAR', 'GAME', 'SUSHI', 'KARAOKE', 'LOVE', 'CAFE', 'DISCO']).slice(0, 6), n = t.length, s = Math.min(w * 0.6, (h - 20) / n);
    g.font = `bold ${Math.round(s * 0.92)}px Arial, Helvetica, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.save(); g.shadowColor = c1; g.shadowBlur = 6; g.fillStyle = c1;
    for (let i = 0; i < n; i++) g.fillText(t[i], w / 2, 10 + s * (i + 0.5) + (h - 20 - s * n) / 2);
    g.restore(); return;
  }
  const cells = vert ? [[0, 0, w, h / 2], [0, h / 2, w, h / 2]] : [[0, 0, w / 2, h], [w / 2, 0, w / 2, h]];
  for (const [x, y, cw, ch] of cells) cellArt(g, x, y, cw, ch, (r() * 7) | 0, pick(r, NEON), pick(r, NEON), r);
}
function facade(g, w, h, o, emit) {
  const r = mulberry(o.seed);
  if (emit) R(g, 0, 0, w, h, '#000');
  else { R(g, 0, 0, w, h, o.base); noise(g, w, h, mulberry(o.seed + 7), (w * h) / 10, ['rgba(0,0,0,.13)', 'rgba(255,255,255,.07)']); }
  for (let cy = 0; cy < h / o.ch; cy++) for (let cx = 0; cx < w / o.cw; cx++) {
    const on = r() < o.p, col = pick(r, o.pal), x = cx * o.cw + o.x, y = cy * o.ch + o.y;
    if (emit) { if (on) R(g, x, y, o.ww, o.wh, col); } else {
      R(g, x - 1, y - 1, o.ww + 2, o.wh + 2, o.frame); R(g, x, y, o.ww, o.wh, on ? col : o.dark);
      if (!on) R(g, x, y, o.ww, 2, 'rgba(130,160,200,.4)'); else R(g, x, y + o.wh - 1, o.ww, 1, 'rgba(0,0,0,.2)');
    }
  }
  if (o.extra) o.extra(g, w, h, emit);
}
const WARM = ['#ffe9a8', '#fff4d0', '#bfe9ff', '#ffd27a', '#ffd0e8'];
const FAC = {
  offA: { seed: 601, base: '#575b6a', cw: 16, ch: 16, x: 2, y: 4, ww: 12, wh: 8, p: 0.42, pal: WARM, frame: '#3a3d4a', dark: '#222a38', extra: (g, w, h, e) => { if (!e) for (let y = 0; y < h; y += 16) R(g, 0, y + 14, w, 2, 'rgba(0,0,0,.28)'); } },
  offB: { seed: 602, base: '#44607a', cw: 16, ch: 16, x: 1, y: 2, ww: 14, wh: 12, p: 0.32, pal: ['#d8f4ff', '#fff8e0', '#aef0ff'], frame: '#2c4056', dark: '#1d3248', extra: (g, w, h, e) => { if (!e) for (let x = 0; x < w; x += 16) R(g, x, 0, 1, h, 'rgba(255,255,255,.22)'); } },
  offC: { seed: 603, base: '#a29282', cw: 16, ch: 16, x: 3, y: 3, ww: 10, wh: 9, p: 0.5, pal: WARM, frame: '#6d5f52', dark: '#2a2f3c', extra: (g, w, h, e) => { if (!e) for (let y = 0; y < h; y += 16) { R(g, 0, y + 12, w, 3, '#d6cab8'); R(g, 0, y + 15, w, 1, 'rgba(0,0,0,.35)'); } } },
  capsule: { seed: 604, base: '#8d939e', cw: 8, ch: 8, x: 1, y: 2, ww: 6, wh: 4, p: 0.55, pal: ['#d8f6ff', '#ffe9b0', '#ffffff'], frame: '#585e69', dark: '#2a323f' },
  mall: { seed: 605, base: '#8a6a86', cw: 8, ch: 16, x: 0, y: 3, ww: 7, wh: 8, p: 0.85, pal: ['#ffd0e8', '#ffe8f4', '#fff2c8'], frame: '#5f4260', dark: '#3a2a46', extra: (g, w, h, e) => { if (!e) for (let y = 0; y < h; y += 16) R(g, 0, y + 13, w, 3, '#c9a8c4'); } },
  train: { seed: 606, base: '#b9bfc8', cw: 16, ch: 32, x: 2, y: 7, ww: 12, wh: 11, p: 0.95, pal: ['#fff6cf', '#fffbe8'], frame: '#6f7580', dark: '#222', extra: (g, w, h, e) => { if (!e) { R(g, 0, 21, w, 3, '#2fae62'); R(g, 0, 25, w, 1, '#d8d8d8'); R(g, 0, 0, w, 3, '#8d939c'); } else R(g, 0, 21, w, 3, '#0c3a1c'); } },
};
const P = {}, S = {};
for (const [k, o] of Object.entries(FAC)) {
  const sz = k === 'train' ? [128, 32] : [64, 64];
  P[`s6tk_${k}`] = (g, w, h) => facade(g, w, h, o, false); P[`s6tk_${k}E`] = (g, w, h) => facade(g, w, h, o, true);
  S[`s6tk_${k}`] = sz; S[`s6tk_${k}E`] = sz;
}
for (let i = 0; i < 8; i++) {
  P[`s6tk_nv${i}`] = (g, w, h) => neonPanel(g, w, h, 700 + i * 13, true); S[`s6tk_nv${i}`] = [64, 128];
  P[`s6tk_nh${i}`] = (g, w, h) => neonPanel(g, w, h, 900 + i * 17, false); S[`s6tk_nh${i}`] = [128, 64];
}
Object.assign(P, {
  s6tk_screen0(g, w, h) {   // sunset over the skyline
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a0f5a'); gr.addColorStop(0.55, '#ff3d8b'); gr.addColorStop(1, '#ffb347'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffe36b'; g.beginPath(); g.arc(w * 0.5, h * 0.62, h * 0.3, 0, 6.283); g.fill();
    for (let i = 0; i < 6; i++) R(g, w * 0.5 - h * 0.32, h * 0.55 + i * 5, h * 0.64, 2 + i * 0.6, i % 2 ? '#ff3d8b' : '#ff7a5a');
    const r = mulberry(61); g.fillStyle = '#1a0b36'; for (let x = 0; x < w; x += 10) { const bh = 14 + r() * 26; R(g, x, h - bh, 9, bh, '#1a0b36'); for (let k = 0; k < 3; k++) R(g, x + 2, h - bh + 4 + k * 8, 2, 2, '#ffe36b'); }
    g.font = 'bold 22px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('TOKYO NIGHT', w / 2, 24);
  },
  s6tk_screen1(g, w, h) {   // equalizer + rings
    R(g, 0, 0, w, h, '#0a0620'); const r = mulberry(62);
    for (let i = 0; i < 24; i++) { const bh = 12 + r() * (h - 30); R(g, 6 + i * 10, h - 6 - bh, 8, bh, i % 3 === 0 ? '#19e6ff' : i % 3 === 1 ? '#ff2d95' : '#ffe81a'); }
    for (let i = 0; i < 4; i++) { g.strokeStyle = ['#19e6ff', '#ff2d95', '#ffe81a', '#fff'][i]; g.lineWidth = 3; g.beginPath(); g.arc(w - 40, 36, 10 + i * 8, 0, 6.283); g.stroke(); }
    g.font = 'bold 20px Arial, Helvetica, sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText('SUPER SALE', 10, 24);
  },
  s6tk_screen2(g, w, h) {   // big cat
    R(g, 0, 0, w, h, '#19e6ff'); for (let i = 0; i < 9; i++) R(g, i * 32, 0, 16, h, '#44f0ff');
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(w / 2, h * 0.58, 58, 44, 0, 0, 6.283); g.fill();
    g.beginPath(); g.moveTo(w / 2 - 54, h * 0.4); g.lineTo(w / 2 - 50, h * 0.08); g.lineTo(w / 2 - 18, h * 0.24); g.fill(); g.beginPath(); g.moveTo(w / 2 + 54, h * 0.4); g.lineTo(w / 2 + 50, h * 0.08); g.lineTo(w / 2 + 18, h * 0.24); g.fill();
    g.fillStyle = '#ff2d95'; g.beginPath(); g.moveTo(w / 2 - 46, h * 0.32); g.lineTo(w / 2 - 44, h * 0.16); g.lineTo(w / 2 - 28, h * 0.26); g.fill(); g.beginPath(); g.moveTo(w / 2 + 46, h * 0.32); g.lineTo(w / 2 + 44, h * 0.16); g.lineTo(w / 2 + 28, h * 0.26); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.ellipse(w / 2 - 22, h * 0.52, 6, 9, 0, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(w / 2 + 22, h * 0.52, 6, 9, 0, 0, 6.283); g.fill();
    g.fillStyle = '#ff2d95'; g.beginPath(); g.moveTo(w / 2 - 5, h * 0.62); g.lineTo(w / 2 + 5, h * 0.62); g.lineTo(w / 2, h * 0.68); g.fill();
    g.strokeStyle = '#222'; g.lineWidth = 2; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(w / 2 + s * 30, h * 0.64 + k * 4); g.lineTo(w / 2 + s * 66, h * 0.58 + k * 9); g.stroke(); }
    g.font = 'bold 20px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ff2d95'; g.fillText('MEOW!', w / 2, h - 6);
  },
  s6tk_tile(g) {            // grey kawara
    R(g, 0, 0, 64, 64, '#6a7380'); const r = mulberry(610);
    for (let row = 0; row < 8; row++) for (let c = 0; c < 8; c++) { const x = c * 8, y = row * 8; R(g, x, y, 7, 7, pick(r, ['#59626f', '#646d7b', '#6e7886', '#525b68'])); R(g, x, y + 6, 8, 2, '#323943'); R(g, x + 7, y, 1, 8, 'rgba(25,30,40,.55)'); R(g, x + 1, y + 1, 5, 1, 'rgba(255,255,255,.10)'); }
  },
  s6tk_slats(g) {
    R(g, 0, 0, 64, 64, '#7a5236'); const r = mulberry(611);
    for (let x = 0; x < 64; x += 4) { R(g, x, 0, 1, 64, '#3a2416'); R(g, x + 1, 0, 2, 64, pick(r, ['#86593a', '#7a4f33', '#8c5f3e'])); }
    noise(g, 64, 64, r, 120, ['rgba(0,0,0,.16)', 'rgba(255,220,170,.1)']);
  },
  s6tk_plaster(g) {
    R(g, 0, 0, 64, 64, '#c3baa6'); noise(g, 64, 64, mulberry(612), 260, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.12)']);
    R(g, 0, 56, 64, 8, '#3d3a3a'); R(g, 0, 55, 64, 1, 'rgba(0,0,0,.3)');
  },
  s6tk_shoji(g) {
    R(g, 0, 0, 64, 64, '#ffdc96'); for (let i = 0; i < 4; i++) { R(g, i * 16, 0, 2, 64, '#6b4426'); R(g, 0, i * 16, 64, 2, '#6b4426'); }
    R(g, 62, 0, 2, 64, '#6b4426'); R(g, 0, 62, 64, 2, '#6b4426'); R(g, 6, 6, 8, 3, '#ffe8b6'); R(g, 38, 22, 8, 3, '#ffe8b6');
  },
  s6tk_noren(g) {
    R(g, 0, 0, 64, 64, '#22336e'); R(g, 0, 0, 64, 5, '#141c3c');
    for (const x of [21, 42]) R(g, x, 5, 1, 59, '#0e1430');
    for (const cx of [10, 31, 53]) { g.fillStyle = '#f2ecdf'; g.beginPath(); g.arc(cx, 28, 7, 0, 6.283); g.fill(); g.fillStyle = '#d8261c'; g.beginPath(); g.arc(cx, 28, 3.5, 0, 6.283); g.fill(); }
    R(g, 0, 58, 64, 6, '#f2ecdf'); R(g, 0, 56, 64, 2, '#d8261c');
  },
  s6tk_carpet(g) {
    R(g, 0, 0, 64, 64, '#34205a'); const r = mulberry(613);
    for (let i = 0; i < 26; i++) { const x = (r() * 62) | 0, y = (r() * 62) | 0, c = pick(r, ['#19e6ff', '#ff2d95', '#ffe81a', '#8a5cff']); R(g, x, y, 2, 2, c); R(g, x - 1, y, 1, 1, c); R(g, x + 2, y + 1, 1, 1, c); }
    for (let i = 0; i < 4; i++) { R(g, i * 16, 0, 1, 64, 'rgba(255,255,255,.07)'); R(g, 0, i * 16, 64, 1, 'rgba(255,255,255,.07)'); }
  },
  s6tk_ceil(g) {
    R(g, 0, 0, 64, 64, '#3a3158'); for (let i = 0; i < 4; i++) { R(g, i * 16, 0, 1, 64, '#1c1630'); R(g, 0, i * 16, 64, 1, '#1c1630'); }
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) R(g, i * 16 + 6, j * 16 + 6, 4, 4, '#8f86c0');
  },
  s6tk_pachIn(g) {
    R(g, 0, 0, 64, 64, '#43306e'); for (let x = 0; x < 64; x += 16) { R(g, x, 0, 3, 64, '#ff2d95'); R(g, x + 6, 0, 1, 64, '#19e6ff'); }
    R(g, 0, 46, 64, 18, '#2b1c4a'); R(g, 0, 45, 64, 1, '#ffe81a'); R(g, 0, 0, 64, 4, '#1a1030');
  },
  s6tk_pachOut(g) {
    R(g, 0, 0, 64, 64, '#34205c'); for (let i = -4; i < 12; i++) { g.fillStyle = ['#ff2d95', '#19e6ff', '#ffe81a'][((i % 3) + 3) % 3]; g.beginPath(); g.moveTo(i * 8, 64); g.lineTo(i * 8 + 4, 64); g.lineTo(i * 8 + 4 + 64, 0); g.lineTo(i * 8 + 64, 0); g.fill(); }
    R(g, 0, 0, 64, 64, 'rgba(20,10,40,.32)');
  },
  s6tk_marquee(g) {
    R(g, 0, 0, 32, 32, '#1a0c2e'); const c = ['#ffe81a', '#ff2d95', '#19e6ff', '#ffffff'];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = c[(i + j * 2) % 4]; g.beginPath(); g.arc(4 + i * 8, 4 + j * 8, 2.6, 0, 6.283); g.fill(); }
  },
  s6tk_conc(g) {
    R(g, 0, 0, 64, 64, '#7a7c82'); noise(g, 64, 64, mulberry(614), 360, ['rgba(0,0,0,.14)', 'rgba(255,255,255,.1)', 'rgba(80,100,70,.12)']);
    R(g, 0, 31, 64, 1, 'rgba(0,0,0,.25)'); R(g, 31, 0, 1, 64, 'rgba(0,0,0,.18)'); for (let i = 0; i < 6; i++) R(g, (i * 11 + 3) % 64, 0, 1, 64, 'rgba(0,0,0,.1)');
  },
  s6tk_shelf(g) {
    R(g, 0, 0, 128, 64, '#eef2fb'); const r = mulberry(615), pc = ['#e8312a', '#2a9de8', '#ffd21a', '#3ac45a', '#ff7fb0', '#8a5cff', '#ff8a2a', '#ffffff'];
    for (let row = 0; row < 4; row++) { const y = 6 + row * 14; R(g, 0, y + 11, 128, 2, '#8a93a8'); for (let x = 2; x < 126; x += 5) { const hh = 6 + ((r() * 5) | 0); R(g, x, y + 11 - hh, 4, hh, pick(r, pc)); R(g, x, y + 11 - hh, 4, 1, 'rgba(255,255,255,.55)'); } }
    R(g, 0, 0, 128, 4, '#c8d2ea');
    for (let x = 30; x < 128; x += 64) R(g, x, 0, 2, 64, '#a8b2c8');
  },
  s6tk_vend(g) {
    R(g, 0, 0, 32, 64, '#f4f8ff'); const r = mulberry(616), pc = ['#e8312a', '#2a9de8', '#ffd21a', '#3ac45a', '#ff8a2a', '#8a5cff'];
    for (let row = 0; row < 4; row++) { for (let c = 0; c < 4; c++) { R(g, 2 + c * 7, 3 + row * 11, 5, 8, pick(r, pc)); R(g, 3 + c * 7, 4 + row * 11, 1, 5, 'rgba(255,255,255,.6)'); } R(g, 0, 11 + row * 11, 32, 1, '#9aa4b8'); }
    R(g, 0, 48, 32, 16, '#2a2f3c'); for (let c = 0; c < 4; c++) R(g, 3 + c * 7, 50, 5, 3, '#ff2a2a'); R(g, 8, 56, 16, 5, '#111');
  },
  s6tk_lantern(g) {
    R(g, 0, 0, 64, 64, '#ee2e22'); for (let y = 6; y < 64; y += 7) { R(g, 0, y, 64, 1, '#8a120c'); R(g, 0, y + 1, 64, 1, '#ff6a4a'); }
    R(g, 0, 0, 64, 4, '#2a0c08'); R(g, 0, 60, 64, 4, '#2a0c08');
    g.fillStyle = 'rgba(255,200,120,.9)'; g.fillRect(14, 22, 5, 20); g.fillRect(46, 22, 5, 20); g.fillRect(12, 30, 9, 3); g.fillRect(44, 30, 9, 3);
  },
  s6tk_lanternW(g) {
    R(g, 0, 0, 64, 64, '#fff0d0'); for (let y = 6; y < 64; y += 7) { R(g, 0, y, 64, 1, '#c8a878'); }
    R(g, 0, 0, 64, 5, '#2a0c08'); R(g, 0, 59, 64, 5, '#2a0c08'); g.font = 'bold 13px Arial, Helvetica, sans-serif'; g.fillStyle = '#d8261c'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('RAMEN', 16, 32); g.fillText('RAMEN', 48, 32);
  },
  s6tk_biglantern(g, w, h) {
    R(g, 0, 0, w, h, '#e8281c'); for (let y = 8; y < h - 8; y += 6) { R(g, 0, y, w, 1, '#6a0e0a'); R(g, 0, y + 1, w, 1, '#ff5e40'); }
    R(g, 0, 0, w, 10, '#15100e'); R(g, 0, h - 10, w, 10, '#15100e'); R(g, 0, 10, w, 2, '#f0d890'); R(g, 0, h - 12, w, 2, '#f0d890');
    for (const cx of [16, 48]) { R(g, cx - 8, 18, 16, h - 36, '#fff4dc'); g.font = 'bold 11px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#15100e'; const t = 'KAMINARI'; for (let i = 0; i < t.length; i++) g.fillText(t[i], cx, 24 + i * ((h - 44) / 7)); }
  },
  s6tk_drum(g, w, h) {
    R(g, 0, 0, w, h, '#1a0b30'); const r = mulberry(617), words = ['KAWAII', 'MODE', 'STYLE', 'LOVE', 'MIX', 'POP'];
    g.font = `bold ${h * 0.55}px Arial, Helvetica, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    words.forEach((t, i) => { const c = NEON[(i * 2 + 1) % NEON.length]; g.save(); g.shadowColor = c; g.shadowBlur = 8; g.fillStyle = c; g.fillText(t, (i + 0.5) * (w / words.length), h / 2 + 2); g.restore(); });
    R(g, 0, 0, w, 3, '#ff2d95'); R(g, 0, h - 3, w, 3, '#19e6ff'); noise(g, w, h, r, 0, ['#000']);
  },
  s6tk_mallWall(g) {
    R(g, 0, 0, 64, 64, '#9a7a94'); noise(g, 64, 64, mulberry(618), 200, ['rgba(0,0,0,.1)', 'rgba(255,255,255,.1)']);
  },
});
addPainters(P, { ...S, s6tk_screen0: [256, 128], s6tk_screen1: [256, 128], s6tk_screen2: [256, 128], s6tk_shelf: [128, 64], s6tk_vend: [32, 64], s6tk_marquee: [32, 32], s6tk_biglantern: [64, 128], s6tk_drum: [512, 48] });

// ---------- shared pieces ----------
const tint = (name, hex) => keyed(`t${name}${hex}`, () => new THREE.MeshLambertMaterial({ map: tex(name), color: hex }));
// vertical blade sign: thin box + panel(s) on both big faces (faces +-x). bx,z0 = centre; w = depth along z; n panels stacked
function blade(g, bx, z0, y0, w, n, k0, thick = 0.3) {
  const H = w * 2 * n; Bx(g, thick, H, w, C(0x1a1424), bx, y0 + H / 2, z0, 2);
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) panel(g, `s6tk_nv${(k0 + i * 3 + (s > 0 ? 1 : 0)) % 8}`, w - 0.1, w * 2 - 0.1, bx + s * (thick / 2 + 0.03), y0 + w + i * 2 * w, z0, s > 0 ? Math.PI / 2 : -Math.PI / 2);
}
// grid of neon panels on a wall. face '+z' at z, or '+x'/'-x'
function coverWall(g, face, at, c0, y0, cols, rows, pw, ph, vert, k0 = 0) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = (k0 + r * 3 + c * 5 + (r * c)) % 8, n = `s6tk_n${vert ? 'v' : 'h'}${k}`, a = c0 + (c + 0.5) * pw, y = y0 + (r + 0.5) * ph;
    if (face === '+z') panel(g, n, pw - 0.1, ph - 0.1, a, y, at, 0);
    else if (face === '-z') panel(g, n, pw - 0.1, ph - 0.1, a, y, at, Math.PI);
    else if (face === '+x') panel(g, n, pw - 0.1, ph - 0.1, at, y, a, Math.PI / 2);
    else panel(g, n, pw - 0.1, ph - 0.1, at, y, a, -Math.PI / 2);
  }
}
function roofClutter(g, w, d, y, seed, n = 4) {
  const r = mulberry(seed); const list = [];
  for (let i = 0; i < n; i++) list.push([1 + r() * 1.2, 0.8 + r() * 0.8, 1 + r(), (r() - 0.5) * (w - 4), y + 0.5, (r() - 0.5) * (d - 3)]);
  boxes(g, list, C(0x6a707a));
  Cy(g, 0.05, 0.08, 4 + r() * 3, 5, C(0x777c88), (r() - 0.5) * w * 0.5, y + 2.5, (r() - 0.5) * d * 0.5, 1);
}
function ground(g, w, d, m = mat('s6tk_conc')) { Bx(g, w, 0.16, d, m, 0, 0.08, 0, 4); }

// =====================================================================
// 1. izakayaRow  30 x 10 x 12
// =====================================================================
export function izakayaRow() {
  const g = G(), N = 6, W = 5, DZ = 9.0, zc = -0.5, F = 4.0;      // body z -5 .. 4
  const wall = [0xcdbb9a, 0x9a8878, 0xc09a94, 0xa4abbe, 0xcdb086, 0x9fb4a6], up = [0x76607e, 0x607486, 0x865f5f, 0x5f8070, 0x867552, 0x6c5f90];
  const words = ['SAKE', 'BEER', 'YAKITORI', 'BAR NYAN', 'GRILL', 'OPEN 24H'], sc = ['#ff2d95', '#19e6ff', '#ffe81a', '#ff2a2a', '#52ff9a', '#ffffff'];
  const wood = tint('s6tk_slats', 0xb09070), dark = C(0x2a1c14), tile = tileRoofM();
  ground(g, 30, 10);
  for (let i = 0; i < N; i++) {
    const cx = -12.5 + i * W, lm = i % 2 ? 1 : -1;
    Bx(g, 4.9, 3.6, DZ, tint('s6tk_plaster', wall[i]), cx, 0.16 + 1.8, zc, 3);
    Bx(g, 4.9, 3.4, DZ, tint('s6tk_plaster', up[i]), cx, 3.76 + 1.7, zc, 3);
    Bx(g, 4.9, 0.4, DZ + 0.2, wood, cx, 3.76, zc + 0.1, 2);                                        // fascia band between floors
    Bx(g, 5.1, 0.3, DZ + 1.0, tile, cx, 7.3, zc + 0.5, 3);                                         // eave roof
    Bx(g, 5.1, 0.5, 0.3, C(0x3a3040), cx, 7.65, F + 0.5, 2);
    // ground floor: door, noren, window, lantern, sign
    const dx = cx - 0.6 * lm;
    pl(g, flatM('s6tk_shoji'), 1.5, 2.2, dx, 1.3, F + 0.07);
    Bx(g, 0.14, 2.4, 0.14, dark, dx - 0.82, 1.3, F + 0.1, 1); Bx(g, 0.14, 2.4, 0.14, dark, dx + 0.82, 1.3, F + 0.1, 1); Bx(g, 1.8, 0.14, 0.14, dark, dx, 2.5, F + 0.1, 1);
    pl(g, selfLit('s6tk_noren', 0x888888, true), 1.5, 0.95, dx, 2.0, F + 0.3);
    const wx = cx + 1.5 * lm;
    pl(g, flatM('s6tk_shoji'), 1.3, 1.1, wx, 1.75, F + 0.07);
    for (let k = 0; k < 4; k++) Bx(g, 0.05, 1.2, 0.05, dark, wx - 0.5 + k * 0.33, 1.75, F + 0.12, 1);
    Bx(g, 1.5, 0.1, 0.12, dark, wx, 1.18, F + 0.1, 1);
    lantern(g, cx + 2.0 * lm, 2.6, F + 0.65, 0.3, 0.42);
    Bx(g, 0.05, 0.05, 0.6, dark, cx + 2.0 * lm, 3.1, F + 0.35, 1);
    if (i % 2 === 0) lantern(g, cx - 2.0 * lm, 2.6, F + 0.65, 0.3, 0.42);
    sgn(g, words[i], 2.7, 0.6, cx, 3.4, F + 0.07, 0, { bg: '#16061c', fg: sc[i], border: sc[i] });
    // upper floor
    win(g, 1.2, 1.5, cx - 1.1, 5.4, F + 0.07, 0, { lit: true }); win(g, 1.2, 1.5, cx + 1.1, 5.4, F + 0.07, 0, { lit: i % 3 !== 0 });
    Bx(g, 3.8, 0.1, 0.5, dark, cx, 4.5, F + 0.3, 2);
    Bx(g, 0.9, 0.6, 0.5, C(0x8a9098), cx + 1.9, 6.3, F + 0.28, 1);
    // back
    win(g, 1.2, 1.4, cx, 5.4, -5.07, Math.PI, { fixed: true, lit: i % 2 === 0 }); win(g, 1.2, 1.4, cx, 1.9, -5.07, Math.PI, { fixed: true, lit: i % 2 === 1 });
    door(g, 1.0, 2.1, cx + 1.4, 1.2, -5.07, Math.PI, '#5a4030');
    // roof clutter + beer crates
    Bx(g, 1.2, 0.9, 0.9, C(0x6a707a), cx - 1, 7.95, -1.5, 1);
    if (i % 2) boxes(g, [[0.5, 0.35, 0.35, cx - 2.1, 0.33, F + 0.6], [0.5, 0.35, 0.35, cx - 2.1, 0.7, F + 0.6]], C(0xd8442a));
  }
  // blade signs and roof signs
  [1, 3, 5].forEach((i, k) => blade(g, -12.5 + i * W - 2.5, 3.6, 3.9, 1.5, 2 + k % 2, i * 2));
  [0, 2, 4].forEach((i, k) => { const cx = -12.5 + i * W; Bx(g, 0.15, 3.2, 0.15, dark, cx - 1, 9.0, 0.5, 1); Bx(g, 0.15, 3.2, 0.15, dark, cx + 1, 9.0, 0.5, 1); Bx(g, 2.4, 0.2, 0.25, dark, cx, 7.5, 0.5, 1); panel(g, `s6tk_nv${(i * 3 + 2) % 8}`, 2.0, 4.0, cx, 9.6, 0.68, 0); panel(g, `s6tk_nv${(i * 3 + 5) % 8}`, 2.0, 4.0, cx, 9.6, 0.32, Math.PI); });
  { const cx = -12.5 + 3 * W; Bx(g, 4.2, 0.3, 0.4, dark, cx, 8.05, 2.5, 1); sgn(g, 'KARAOKE', 4.6, 1.5, cx, 8.9, 2.55, 0, { bg: '#10061c', fg: '#ff2d95', border: '#19e6ff' }); }
  // festival lantern string + wire
  Bx(g, 30, 0.03, 0.03, dark, 0, 3.55, 4.95, 1);
  for (let i = 0; i < 25; i++) Ms(g, SPH(8, 5), flatM('s6tk_lantern'), -14.4 + i * 1.2, 3.35, 4.95, 0.16, 0.2, 0.16);
  // end walls
  for (const s of [-1, 1]) { win(g, 1.2, 1.5, s * 15.07, 5.4, 0, s * Math.PI / 2, { fixed: true, lit: true }); }
  return size(g, 30, 10, 12);
}

// =====================================================================
// 2. neonTower  20 x 16 x 50   variant 0 | 1 | 2
// =====================================================================
export function neonTower(opts = {}) {
  const v = (opts.variant | 0) % 3, g = G();
  ground(g, 19, 15);
  if (v === 0) {                       // billboard stack (Shibuya)
    fbox(g, 19, 44, 15, 's6tk_offA', 0, 22.1, 0, 12);
    for (let k = 0; k < 4; k++) coverWall(g, '+z', 7.56, -9.5, 3.4 + k * 4.5, 2, 1, 9.5, 4.5, false, k * 2);
    panel(g, 's6tk_screen0', 14, 7, 0, 25.5, 7.57, 0);
    coverWall(g, '+z', 7.56, -9.5, 29.7, 6, 2, 3.17, 6.4, true, 3);
    for (const s of [-1, 1]) { coverWall(g, s > 0 ? '+x' : '-x', s * 9.56, -7.5, 3.4, 2, 7, 7.5, 5.2, true, 1 + (s > 0 ? 2 : 0)); }
    [-1, 1].forEach((s) => blade(g, s * 9.7, 6.8, 6, 1.6, 6, 2 + (s > 0 ? 1 : 0)));
    // rooftop billboard
    Bx(g, 14, 0.4, 0.8, C(0x23202e), 0, 44.4, 0, 2);
    for (const x of [-6, 6]) Bx(g, 0.3, 3.2, 0.3, C(0x23202e), x, 46, 0, 1);
    panel(g, 's6tk_screen1', 13, 4.8, 0, 46.8, 0.42, 0); panel(g, 's6tk_screen2', 13, 4.8, 0, 46.8, -0.42, Math.PI);
    Bx(g, 14, 0.3, 1, C(0x23202e), 0, 49.4, 0, 2);
    Bx(g, 0.1, 6, 0.1, C(0x888c94), 7, 47.5, -5, 1); Ms(g, SPH(6, 4), glow(0xff2a2a), 7, 50.6, -5, 0.25);
  } else if (v === 1) {                // tall vertical sign columns (Kabukicho)
    fbox(g, 17, 46, 13, 's6tk_offB', 0, 23.1, 0, 12);
    coverWall(g, '+z', 6.56, -8.5, 2.2, 5, 7, 3.4, 6.2, true, 0);
    for (const s of [-1, 1]) coverWall(g, s > 0 ? '+x' : '-x', s * 8.56, -5.5, 2.2, 2, 7, 5.5, 6.2, true, 4);
    [-1, 1].forEach((s) => { blade(g, s * 9.6, 6.0, 8, 1.8, 5, 1); blade(g, s * 9.6, -1.5, 14, 1.6, 4, 5 + (s > 0 ? 1 : 0)); });
    panel(g, 's6tk_screen2', 12, 6, 0, 47.2, 6.57, 0);
    Bx(g, 12.4, 0.4, 0.5, C(0x23202e), 0, 44.2, 6.4, 2); Bx(g, 12.4, 0.4, 0.5, C(0x23202e), 0, 50.2, 6.4, 2);
    Ms(g, new THREE.TorusGeometry(2.6, 0.18, 6, 20), glow(0xff2d95), 0, 47.2, 0.5, 1, 1, 1);
    Ms(g, new THREE.TorusGeometry(1.7, 0.14, 6, 18), glow(0x19e6ff), 0, 47.2, 0.5, 1, 1, 1);
    Bx(g, 0.12, 8, 0.12, C(0x888c94), -5, 49.5, -4, 1);
  } else {                             // stepped cat tower
    fbox(g, 19, 22, 15, 's6tk_offC', 0, 11.1, 0, 12);
    fbox(g, 15, 17, 11, 's6tk_offA', 0, 30.6, -1.6, 12);
    coverWall(g, '+z', 7.56, -9.5, 3.4, 4, 2, 4.75, 4.7, false, 2);
    for (const s of [-1, 1]) coverWall(g, s > 0 ? '+x' : '-x', s * 9.56, -6.5, 3.4, 2, 3, 6.5, 6, true, 5);
    panel(g, 's6tk_screen2', 15, 7.5, 0, 24.5 + 3.75 + 0.2, 3.97, 0);
    Bx(g, 15.6, 0.3, 0.3, C(0x23202e), 0, 24.4, 3.95, 1); Bx(g, 15.6, 0.3, 0.3, C(0x23202e), 0, 32.3, 3.95, 1);
    for (const s of [-1, 1]) { Bx(g, 0.3, 8, 0.3, C(0x23202e), s * 7.7, 28.4, 3.95, 1); }
    coverWall(g, '+z', 4.16, -7.5, 33.5, 5, 1, 3, 6, true, 6);
    const dr = Cy(g, 4.5, 4.5, 5, 18, flatM('s6tk_drum'), 0, 42.6, -1.6, 4); dr.rotation.y = 0.3;
    Cy(g, 4.7, 4.7, 0.3, 18, C(0x23202e), 0, 40.25, -1.6, 2); Cy(g, 4.7, 4.7, 0.3, 18, C(0x23202e), 0, 45.15, -1.6, 2);
    Ms(g, new THREE.TorusGeometry(4.6, 0.12, 5, 20), glow(0x19e6ff), 0, 40.5, -1.6, 1, 1, 1, Math.PI / 2);
    Ms(g, new THREE.TorusGeometry(4.6, 0.12, 5, 20), glow(0xff2d95), 0, 44.9, -1.6, 1, 1, 1, Math.PI / 2);
    Cy(g, 0.06, 0.1, 5, 5, C(0x888c94), 0, 48, -1.6, 1); Ms(g, SPH(6, 4), glow(0xff2a2a), 0, 50.4, -1.6, 0.25);
    for (const x of [-9.65, 9.65]) Bx(g, 0.2, 22, 0.2, glow(x < 0 ? 0xff2d95 : 0x19e6ff), x, 11.1, 7.65, 1);
  }
  roofClutter(g, 17, 13, v === 1 ? 46 : v === 0 ? 44 : 22, 40 + v, 3);
  const body = [[[-9.5, 9.5, -7.5, 7.5, 44]], [[-8.5, 8.5, -6.5, 6.5, 46]], [[-9.5, 9.5, -7.5, 7.5, 22], [-7.5, 7.5, -7.2, 3.9, 40]]][v];
  return size(g, 20, 16, 50, body);
}

// =====================================================================
// 3. cylinderMall  26 x 26 x 40   (round fashion tower)
// =====================================================================
function lcyl(g, r, h, y, name, seg = 22, tile = 12) {
  const geo = new THREE.CylinderGeometry(r, r, h, seg, 1, false), uv = geo.attributes.uv;
  const sideN = (seg + 1) * 2, nu = Math.max(1, Math.round(2 * Math.PI * r / tile)), nv = Math.max(1, Math.round(h / tile));
  for (let i = 0; i < sideN; i++) uv.setXY(i, uv.getX(i) * nu, uv.getY(i) * nv);
  const s = litM(name), t = C(0x3a2f44);
  const m = new THREE.Mesh(geo, [s, t, t]); m.position.set(0, y + h / 2, 0); g.add(m); return m;
}
export function cylinderMall() {
  const g = G(), R0 = 12.4;
  Cy(g, 12.9, 12.9, 0.3, 24, mat('s6tk_conc'), 0, 0.15, 0, 4);
  lcyl(g, R0, 22.7, 0.3, 's6tk_mall');
  // ground-floor glazing band (bright shop windows)
  Cy(g, R0 + 0.12, R0 + 0.12, 3.2, 22, glow(0xffe0f0), 0, 2.0, 0, 4).material = keyed('shopband', () => new THREE.MeshLambertMaterial({ color: 0xb08aa8, emissive: 0xc08ab0 }));
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; Bx(g, 0.18, 3.4, 0.18, C(0x2a1c30), Math.sin(a) * (R0 + 0.16), 2.0, Math.cos(a) * (R0 + 0.16), 1); }
  // sign drum
  Cy(g, R0 + 0.5, R0 + 0.5, 4.2, 24, flatM('s6tk_drum'), 0, 25.1, 0, 4);
  Cy(g, R0 + 0.62, R0 + 0.62, 0.3, 24, C(0x2a1c30), 0, 22.85, 0, 2); Cy(g, R0 + 0.62, R0 + 0.62, 0.3, 24, C(0x2a1c30), 0, 27.35, 0, 2);
  lcyl(g, 11.2, 9.0, 27.5, 's6tk_mall');
  Cy(g, 11.7, 11.7, 0.7, 24, C(0x2a1c30), 0, 36.85, 0, 2);
  Cy(g, 11.75, 11.75, 0.9, 24, glow(0xff4fa8), 0, 37.8, 0, 2);           // lit band
  Cy(g, 11.6, 11.6, 0.35, 24, glow(0x19e6ff), 0, 38.45, 0, 2);
  Cy(g, 10.2, 11.2, 0.5, 20, C(0x3a2f44), 0, 38.9, 0, 2);
  Cy(g, 3, 3, 1.2, 12, C(0x666c78), 4, 39.6, -3, 2);
  Cy(g, 0.08, 0.12, 6, 5, C(0x888c94), -3, 42, 3, 1); Ms(g, SPH(6, 4), glow(0xff2a2a), -3, 45.1, 3, 0.3);
  // vertical banners around the lower drum
  for (let i = 0; i < 12; i++) {
    const a = (i + 0.5) / 12 * Math.PI * 2 + 0.26; if (Math.abs(Math.sin(a)) < 0.2 && Math.cos(a) > 0) continue;
    const b = Bx(g, 1.8, 3.6, 0.16, C(0x1a1424), Math.sin(a) * (R0 + 0.16), 8.4, Math.cos(a) * (R0 + 0.16), 1); b.rotation.y = a;
    const p = panel(g, `s6tk_nv${i % 8}`, 1.6, 3.4, Math.sin(a) * (R0 + 0.26), 8.4, Math.cos(a) * (R0 + 0.26), a);
  }
  // entrance vestibule + canopy
  Bx(g, 5.4, 3.8, 1.8, C(0x3a2f44), 0, 1.9, 12.0, 2);
  Bx(g, 6.4, 0.35, 2.6, C(0x2a1c30), 0, 4.1, 12.1, 2); Bx(g, 6.4, 0.1, 2.6, glow(0xff4fa8), 0, 3.9, 12.1, 2);
  pl(g, basic(0xfff0d8), 3.6, 3.0, 0, 1.6, 12.92); Bx(g, 0.1, 3.0, 0.08, C(0x2a1c30), 0, 1.6, 12.96, 1);
  sgn(g, 'MALL 9', 4.2, 0.9, 0, 4.9, 12.5, 0, { bg: '#2a0a24', fg: '#ff4fa8', border: '#ff4fa8' });
  return size(g, 26, 26, 40, [...circleCols(12.7, 40, 10), [-2.7, 2.7, 11.1, 12.9, 4]]);
}
