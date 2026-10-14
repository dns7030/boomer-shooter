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
// Japanese curved-eave roof: eave tip at y+0.45, low point at y, concave rise to the top ring.  hx,hz = half sizes at the eave tip.
// o.top = [hx,hz] size of the top ring (default: a short ridge), o.soffit = false to skip the dark underside box.
function curvedRoof(g, hx, hz, rise, x, y, z, o = {}) {
  const m = o.m || tileRoofM(), [thx, thz] = o.top || [Math.max(0.25, hx * 0.12), Math.max(0.03, hz * 0.12)];
  const k = (f) => Math.max(0.01, f);
  loft(g, [
    { y: 0.45, hx, hz }, { y: 0, hx: hx - 1.1, hz: hz - 1.1 },
    { y: rise * 0.45, hx: Math.max(thx, k(hx * 0.62 - 0.2)), hz: Math.max(thz, k(hz * 0.62 - 0.2)) },
    { y: rise * 0.8, hx: Math.max(thx, hx * 0.3), hz: Math.max(thz, hz * 0.3) }, { y: rise, hx: thx, hz: thz },
  ], m, x, y, z, 3);
  if (o.soffit !== false) Bx(g, 2 * (hx - 1.1) + 0.2, 0.25, 2 * (hz - 1.1) + 0.2, C(0x2b1d17), x, y - 0.1, z, 2);   // dark soffit under the eave
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
  } else {                          // calm solid panel with a thin inner frame (stripes removed: harsh high-contrast patterns)
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 4, y + 4, w - 8, h - 8); g.strokeStyle = c; g.lineWidth = 1.5; g.strokeRect(x + 6, y + 6, w - 12, h - 12);
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
function ground(g, w, d, m = mat('s6tk_conc')) { Bx(g, w, 0.06, d, m, 0, 0.03, 0, 4); }

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
    Bx(g, 4.9, 3.6, DZ, tint('s6tk_plaster', wall[i]), cx, 0.06 + 1.8, zc, 3);
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
  Bx(g, 30, 0.03, 0.03, dark, 0, 4.5, 4.95, 1);
  for (let i = 0; i < 25; i++) Ms(g, SPH(8, 5), flatM('s6tk_lantern'), -14.4 + i * 1.2, 4.3, 4.95, 0.16, 0.2, 0.16);
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
    [-1, 1].forEach((s) => { blade(g, s * 8.8, 6.0, 8, 1.8, 5, 1); blade(g, s * 8.8, -1.5, 14, 1.6, 4, 5 + (s > 0 ? 1 : 0)); });
    panel(g, 's6tk_screen2', 12, 6, 0, 47.2, 6.72, 0); panel(g, 's6tk_screen1', 12, 6, 0, 47.2, 6.68, Math.PI);
    Bx(g, 12.4, 0.4, 0.5, C(0x23202e), 0, 44.2, 6.7, 2); Bx(g, 12.4, 0.4, 0.5, C(0x23202e), 0, 50.2, 6.7, 2);
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
    coverWall(g, '+z', 3.96, -7.5, 33.5, 5, 1, 3, 5.6, true, 6);
    const dr = Cy(g, 4.5, 4.5, 5, 18, flatM('s6tk_drum'), 0, 41.7, -1.6, 4); dr.rotation.y = 0.3;
    Cy(g, 4.7, 4.7, 0.3, 18, C(0x23202e), 0, 39.2, -1.6, 2); Cy(g, 4.7, 4.7, 0.3, 18, C(0x23202e), 0, 44.35, -1.6, 2);
    Ms(g, new THREE.TorusGeometry(4.6, 0.12, 5, 20), glow(0x19e6ff), 0, 39.6, -1.6, 1, 1, 1, Math.PI / 2);
    Ms(g, new THREE.TorusGeometry(4.6, 0.12, 5, 20), glow(0xff2d95), 0, 44.1, -1.6, 1, 1, 1, Math.PI / 2);
    Cy(g, 0.06, 0.1, 5, 5, C(0x888c94), 0, 47, -1.6, 1); Ms(g, SPH(6, 4), glow(0xff2a2a), 0, 49.6, -1.6, 0.25);
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
  Cy(g, 12.6, 12.6, 0.3, 24, mat('s6tk_conc'), 0, 0.15, 0, 4);
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
  Bx(g, 6.4, 0.35, 2.0, C(0x2a1c30), 0, 4.1, 12.0, 2); Bx(g, 6.4, 0.1, 2.0, glow(0xff4fa8), 0, 3.9, 12.0, 2);
  pl(g, basic(0xfff0d8), 3.6, 3.0, 0, 1.6, 12.92); Bx(g, 0.1, 3.0, 0.08, C(0x2a1c30), 0, 1.6, 12.96, 1);
  sgn(g, 'MALL 9', 4.2, 0.9, 0, 4.9, 12.5, 0, { bg: '#2a0a24', fg: '#ff4fa8', border: '#ff4fa8' });
  return size(g, 26, 26, 40, [...circleCols(12.7, 40, 10), [-2.7, 2.7, 11.1, 12.9, 4]]);
}

// =====================================================================
// 4. pachinkoParlor  36 x 24 x 18  -- ENTERABLE (hall)
//    inside = { x0:-17, x1:17, z0:-11, z1:11 }; doors: S(front,+z) at x=0 w9, N(back,-z) at x=0 w9, E at z=0 w6.4
// =====================================================================
export function pachinkoParlor() {
  const W = 36, D = 24, H = 14, CH = 5.6, T = 1.0, g = G(), cols = [];
  for (const [n, e] of [['s6tk_pachOut', 0x8a8a8a], ['s6tk_pachIn', 0x909090], ['s6tk_carpet', 0x8c8c8c], ['s6tk_ceil', 0x808080]]) { const m = mat(n); m.emissiveMap = m.map; m.emissive.setHex(e); }
  const base = hall({ w: W, d: D, h: H, ch: CH, t: T, outer: 's6tk_pachOut', inner: 's6tk_pachIn', floor: 's6tk_carpet', ceil: 's6tk_ceil', roof: 'roofTar', tile: 6,
    doors: [{ side: 'S', at: 0, w: 9, h: 4.8 }, { side: 'N', at: 0, w: 9, h: 4.8 }, { side: 'E', at: 0, w: 6.4, h: 4.4 }] });
  g.add(base); cols.push(...base.userData.cols);
  const ix = base.userData.inside, dk = C(0x1a1030), marq = flatM('s6tk_marquee');
  // ---------------- exterior ----------------
  const zf = D / 2 + 0.06;
  for (const s of [-1, 1]) for (let r = 0; r < 2; r++) coverWall(g, '+z', zf, s < 0 ? -17.5 : 5, 0.6 + r * 5.2, 5, 1, 2.5, 5.2, true, r * 3 + (s > 0 ? 2 : 0));
  Bx(g, 9.2, 0.3, 0.3, dk, 0, 14.0, zf + 0.1, 1);
  { const t = tiledPlane(0.5, 4.8, 1, 5, marq, -4.75, 2.4, zf + 0.01); g.add(t); const t2 = tiledPlane(0.5, 4.8, 1, 5, marq, 4.75, 2.4, zf + 0.01); g.add(t2); g.add(tiledPlane(10, 0.7, 8, 1, marq, 0, 5.15, zf + 0.01)); }
  sgn(g, 'PACHINKO', 8.8, 2.6, 0, 8.6, zf + 0.01, 0, { bg: '#12061f', fg: '#ffe81a', border: '#ff2d95' });
  sgn(g, 'OPEN 24H', 5.2, 1.3, 0, 11.4, zf + 0.01, 0, { bg: '#12061f', fg: '#19e6ff', border: '#19e6ff' });
  panel(g, 's6tk_nh1', 3, 1.5, -2.9, 6.5 + 0.2, zf + 0.02, 0); panel(g, 's6tk_nh4', 3, 1.5, 2.9, 6.7, zf + 0.02, 0);
  g.add(tiledPlane(36, 0.9, 18, 1, marq, 0, 13.0, zf + 0.01));
  Bx(g, W, 3.3, 1.5, dk, 0, 15.55, 11.3, 4);
  sgn(g, 'PACHINKO', 27, 2.5, 0, 15.6, 12.09, 0, { bg: '#12061f', fg: '#ff2d95', border: '#ffe81a' });
  g.add(tiledPlane(36, 0.5, 18, 1, marq, 0, 14.3, 12.1)); g.add(tiledPlane(36, 0.5, 18, 1, marq, 0, 16.9, 12.1));
  Bx(g, W, 0.4, 1.7, C(0x2a1c3a), 0, 17.4, 11.3, 2);
  for (const x of [-16, -8, 0, 8, 16]) { Sg(g, glow(0xe8eeff), x, 18.15, 11.3, 0.55, 0.55, 0.55, 10); }
  for (const s of [-1, 1]) { blade(g, s * 18.2, 10.8, 6.5, 1.5, 4, 3 + (s > 0 ? 2 : 0)); }
  sgn(g, 'GAME', 5, 1.4, 18.06, 2.4, -8, Math.PI / 2, { bg: '#12061f', fg: '#52ff9a', border: '#52ff9a' }); sgn(g, 'GAME', 5, 1.4, -18.06, 2.4, 8, -Math.PI / 2, { bg: '#12061f', fg: '#52ff9a', border: '#52ff9a' });
  for (const s of [-1, 1]) coverWall(g, s > 0 ? '+x' : '-x', s * 18.06, -11.5, 4.6, 2, 2, 4.5, 4.4, true, 2 + (s > 0 ? 1 : 0));
  coverWall(g, '+x', 18.06, 4.2, 0.6, 3, 1, 2.6, 4, true, 4); coverWall(g, '-x', -18.06, -11.5, 0.6, 1, 1, 5, 4, true, 6);
  // back
  for (const s of [-1, 1]) coverWall(g, '-z', -D / 2 - 0.06, s < 0 ? -17.5 : 5.5, 0.6, 4, 2, 3.1, 5.3, true, 1 + (s > 0 ? 3 : 0));
  sgn(g, 'EXIT', 4, 1, 0, 6.2, -D / 2 - 0.07, Math.PI, { bg: '#0a2a14', fg: '#52ff9a', border: '#52ff9a' });
  { const bp = tiledPlane(36, 0.9, 18, 1, marq, 0, 13.0, -D / 2 - 0.07); bp.rotation.y = Math.PI; g.add(bp); }
  roofClutter(g, 30, 18, H, 77, 6);
  // ---------------- interior ----------------
  const bodyL = [], trayL = [], lampL = [], scr = [[], [], [], [], []], stools = [];
  const scrM = [0xff2d95, 0x19e6ff, 0xffe81a, 0x52ff9a, 0xb06cff].map((c) => glow(c));
  const names = ['LUCKY 7', 'SUPER STAR', 'NYAN NYAN', 'GOLD RUSH'];
  const island = (cx, cz, n, k) => {
    for (const dir of [1, -1]) for (let i = 0; i < n; i++) {
      const x = cx - n / 2 + i + 0.5, zb = cz + dir * 0.4, zfr = cz + dir * 0.8, c = (i + k + (dir > 0 ? 0 : 2)) % 5;
      bodyL.push([0.92, 1.9, 0.8, x, 0.95, zb]); trayL.push([0.86, 0.1, 0.3, x, 0.95, zfr + dir * 0.15]);
      scr[c].push([0.6, 0.55, 0.06, x, 1.55, zfr + dir * 0.03]); scr[(c + 2) % 5].push([0.5, 0.05, 0.04, x, 0.55, zfr + dir * 0.02]);
      lampL.push([0.8, 0.1, 0.14, x, 1.96, zfr]);
      const st = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 6); st.translate(x, 0.25, zfr + dir * 0.75); stools.push(st);
    }
    Bx(g, n + 0.3, 0.25, 2.0, dk, cx, 2.45, cz, 2);
    for (const sx of [-1, 1]) Bx(g, 0.12, 2.4, 0.12, dk, cx + sx * (n / 2 + 0.1), 1.2, cz, 1);
    for (const dir of [1, -1]) for (const q of [-1, 1]) sgn(g, names[(k + (q > 0 ? 1 : 0) + (dir > 0 ? 0 : 2)) % 4], 4.2, 0.9, cx + q * n / 4, 2.45, cz + dir * 1.01, dir > 0 ? 0 : Math.PI, { bg: '#16061c', fg: ['#ff2d95', '#19e6ff', '#ffe81a', '#52ff9a'][(k + (q > 0 ? 1 : 0)) % 4], border: '#ffffff' });
    boxes(g, [[n + 0.3, 0.05, 0.05, cx, 2.28, cz + 1.0], [n + 0.3, 0.05, 0.05, cx, 2.28, cz - 1.0]], glow(0xffffff));
    cols.push([cx - n / 2 - 0.2, cx + n / 2 + 0.2, cz - 1.8, cz + 1.8, 2.0]);
  };
  [[-10.9, -4.8, 0], [-10.9, 4.8, 1], [10.9, -4.8, 2], [10.9, 4.8, 3]].forEach(([x, z, k]) => island(x, z, 9, k));
  boxes(g, bodyL, C(0x4d4486)); boxes(g, trayL, C(0xc4c8d8)); boxes(g, lampL, glow(0xffffff));
  scr.forEach((l, i) => boxes(g, l, scrM[i]));
  g.add(new THREE.Mesh(merge(stools), C(0xa0306a)));
  // prize kiosk in the middle of the central aisle
  Cy(g, 1.8, 1.9, 1.1, 12, C(0xb8458c, 0x30102a), 0, 0.55, 0, 2); Ms(g, new THREE.TorusGeometry(1.8, 0.07, 5, 16), glow(0x19e6ff), 0, 1.15, 0, 1, 1, 1, Math.PI / 2);
  Cy(g, 0.22, 0.22, 3.6, 8, C(0xd9a62a, 0x30200a), 0, 2.4, 0, 1); Bx(g, 1.3, 0.7, 1.3, dk, 0, 2.7, 0, 1);
  for (const [x, z, ry] of [[0, 0.66, 0], [0, -0.66, Math.PI], [0.66, 0, Math.PI / 2], [-0.66, 0, -Math.PI / 2]]) sgn(g, 'PRIZES', 1.2, 0.55, x, 2.7, z, ry, { bg: '#16061c', fg: '#ffe81a', border: '#ffe81a' });
  Sg(g, glow(0xffe060), 0, 4.55, 0, 0.55, 0.55, 0.55, 10);
  cols.push([-1.9, 1.9, -1.9, 1.9, 3]);
  // wall panels, ceiling light strips
  for (const z of [-8, -3, 3, 8]) panel(g, `s6tk_nh${(z + 8) % 8 | 0}`, 5, 2.5, ix.x0 + 0.05, 3.2, z, Math.PI / 2);
  for (const z of [-8, 8]) panel(g, `s6tk_nh${(z + 12) % 8 | 0}`, 5, 2.5, ix.x1 - 0.05, 3.2, z, -Math.PI / 2);
  for (const x of [-13, -8, 8, 13]) { panel(g, `s6tk_nh${(x + 20) % 8 | 0}`, 4.4, 2.2, x, 3.2, ix.z0 + 0.05, 0); panel(g, `s6tk_nh${(x + 25) % 8 | 0}`, 4.4, 2.2, x, 3.2, ix.z1 - 0.05, Math.PI); }
  const cy = CH - 0.09;
  boxes(g, [[34, 0.1, 0.4, 0, cy, 0], [34, 0.1, 0.4, 0, cy, 9], [34, 0.1, 0.4, 0, cy, -9]], glow(0xfff3d0));
  boxes(g, [[0.4, 0.1, 22, 0, cy, 0], [0.3, 0.1, 22, -11, cy, 0], [0.3, 0.1, 22, 11, cy, 0]], glow(0xff4fa8));
  boxes(g, [[0.3, 0.1, 22, -14.5, cy, 0], [0.3, 0.1, 22, 14.5, cy, 0], [0.3, 0.1, 22, -7.5, cy, 0], [0.3, 0.1, 22, 7.5, cy, 0]], glow(0x19e6ff));
  g.userData.inside = ix; g.userData.doors = base.userData.doors;
  return size(g, W, D, 18, cols);
}

// =====================================================================
// 5. konbini  14 x 12 x 6
// =====================================================================
export function konbini() {
  const g = G(), FZ = 2.5, wall = keyed('kwall', () => new THREE.MeshLambertMaterial({ color: 0xe6eaf0, emissive: 0x2c333c })), cols = [];
  ground(g, 14, 12);
  Bx(g, 14, 4.5, 8.5, wall, 0, 0.06 + 2.25, -1.75, 4);
  Bx(g, 14.4, 0.5, 9, C(0x2a2f3a), 0, 4.8, -1.75, 3);
  Bx(g, 14, 0.8, 0.2, C(0x16222e), 0, 4.15, FZ + 0.1, 2);
  sgn(g, 'MART', 4.4, 0.7, 0, 4.15, FZ + 0.215, 0, { bg: '#0c1822', fg: '#ffffff', border: '#2fd06a' });
  [[0xf08a1c, 4.36], [0x2fb05a, 4.15], [0xe02a2a, 3.94]].forEach(([c, y]) => { for (const s of [-1, 1]) pl(g, basic(c), 4.2, 0.15, s * 4.7, y, FZ + 0.215); });
  // storefront: shelves seen through glass
  for (const s of [-1, 1]) pl(g, flatM('s6tk_shelf'), 5.1, 2.9, s * 4.05, 1.95, FZ + 0.05);
  pl(g, basic(0xfff4d8), 2.8, 2.9, 0, 1.95, FZ + 0.05);
  pl(g, glassM(0x9ad8ff, 0.14), 13.4, 3.0, 0, 1.95, FZ + 0.16);
  const al = C(0xb8bcc4);
  for (const x of [-6.7, -4.0, -1.5, 1.5, 4.0, 6.7]) Bx(g, 0.1, 3.0, 0.1, al, x, 1.95, FZ + 0.14, 1);
  Bx(g, 13.5, 0.1, 0.12, al, 0, 3.45, FZ + 0.14, 1); Bx(g, 13.5, 0.1, 0.12, al, 0, 0.5, FZ + 0.14, 1);
  Bx(g, 0.05, 2.4, 0.1, al, 0, 1.7, FZ + 0.14, 1);
  Bx(g, 14, 0.44, 0.2, tint('s6tk_plaster', 0x7a8c9a), 0, 0.28, FZ + 0.1, 3);
  // canopy + light spill
  Bx(g, 14.2, 0.14, 1.3, C(0x2fb05a, 0x103a1c), 0, 3.62, FZ + 0.65, 3);
  Bx(g, 13.4, 0.04, 0.35, glow(0xfff3c8), 0, 3.53, FZ + 0.9, 1);
  Bx(g, 12.8, 0.04, 0.35, glow(0xfff3c8), 0, 3.53, FZ + 0.35, 1);
  // pylon sign (MART / 24H)
  Cy(g, 0.14, 0.16, 5.4, 8, C(0x666c78), -6.2, 2.7, 5.2, 1); cols.push([-6.5, -5.9, 4.9, 5.5, 6]);
  Bx(g, 2.5, 1.9, 0.3, C(0x16222e), -6.2, 5.0, 5.2, 2);
  for (const [z, ry] of [[5.36, 0], [5.04, Math.PI]]) { sgn(g, 'MART', 2.3, 0.8, -6.2, 5.35, z, ry, { bg: '#0c1822', fg: '#ffffff', border: '#2fd06a' }); sgn(g, '24H', 2.3, 0.7, -6.2, 4.55, z, ry, { bg: '#0c1822', fg: '#ffe81a', border: '#f08a1c' }); }
  // forecourt: vending machines, bin, bike rack, stops
  [[2.6, 3.3], [3.8, 3.3], [5.0, 3.3]].forEach(([x, z], i) => { const v = vendingMachine({ variant: i }); v.position.set(x, 0, z); g.add(v); });
  cols.push([2.0, 5.6, 2.8, 3.8, 1.9]);
  Cy(g, 0.3, 0.3, 0.9, 8, C(0x3a6a4a), -3.5, 0.45, 3.5, 1); cols.push([-3.8, -3.2, 3.2, 3.8, 0.9]);
  boxes(g, [[0.08, 0.7, 0.08, 0.6, 0.35, 4.2], [0.08, 0.7, 0.08, 1.2, 0.35, 4.2], [0.08, 0.7, 0.08, 1.8, 0.35, 4.2], [1.4, 0.06, 0.06, 1.2, 0.7, 4.2]], C(0x9aa0aa));
  for (let i = 0; i < 5; i++) pl(g, basic(0xf4f4f0), 0.12, 2.2, -4.4 + i * 2.2, 0.075, 4.9, 0, -Math.PI / 2);
  for (const x of [-5, 5]) Bx(g, 1.6, 0.14, 0.3, mat('s6tk_conc'), x, 0.1, 5.6, 2);
  // sides / back
  for (const s of [-1, 1]) for (const z of [-4, 0]) win(g, 1.6, 1.5, s * 7.07, 2.3, z, s * Math.PI / 2, { fixed: true, lit: z === 0 });
  win(g, 1.6, 1.5, -3, 2.4, -6.07, Math.PI, { fixed: true, lit: true }); door(g, 1.1, 2.2, 3, 1.2, -6.07, Math.PI, '#5a6068');
  boxes(g, [[1.2, 0.8, 0.8, -4, 5.45, -3], [1.4, 0.9, 1.0, 3, 5.5, -2], [0.8, 0.6, 0.8, 5, 5.35, -5]], C(0x7a808a));
  cols.unshift([-7, 7, -6, FZ + 0.3, 6]);
  return size(g, 14, 12, 6, cols);
}
export const neonTower0 = () => neonTower({ variant: 0 });
export const neonTower1 = () => neonTower({ variant: 1 });
export const neonTower2 = () => neonTower({ variant: 2 });

// =====================================================================
// 6. tokyoTower  36 x 36 x 150  (red/white lattice)
//    cols: the four leg bases (corner blocks 5.5 x 5.5, h 16) + a small base building 8 x 8 x 6; the centre is open (>=7 m gaps).
// =====================================================================
export function tokyoTower() {
  const g = G(), Y = [0.5, 16, 32, 52, 57, 72, 88], HW = [16, 11.5, 8, 5.6, 5.0, 3.4, 2.2];
  const red = C(0xe8461a, 0x5a1a08), white = C(0xf2f0ea, 0x70706c);
  const cr = (i) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [sx * HW[i], Y[i], sz * HW[i]]);
  const L = { r: [[], [], []], w: [[], [], []] };                 // [legs, horizontals, braces]
  for (let i = 0; i < Y.length - 1; i++) {
    if (i === 3) continue;                                         // inside the main deck
    const k = i % 2 ? 'w' : 'r', a = cr(i), b = cr(i + 1);
    for (let c = 0; c < 4; c++) {
      L[k][0].push([a[c], b[c]]);
      L[k][1].push([a[c], a[(c + 1) % 4]]);
      const n = (c + 1) % 4; L[k][2].push([a[c], b[n]], [a[n], b[c]]);
    }
    if (i === Y.length - 2 || i === 2) for (let c = 0; c < 4; c++) L[k][1].push([b[c], b[(c + 1) % 4]]);
  }
  const rad = [0.5, 0.28, 0.2];
  for (const k of ['r', 'w']) for (let j = 0; j < 3; j++) rods(g, L[k][j], rad[j], k === 'r' ? red : white, 5);
  // cross struts inside each stage (extra triangulation at the middle)
  for (let i = 0; i < 6; i++) { if (i === 3) continue; const m = (Y[i] + Y[i + 1]) / 2, h = (HW[i] + HW[i + 1]) / 2, mat_ = i % 2 ? red : white; const lst = []; for (let c = 0; c < 4; c++) { const sx = [-1, 1, 1, -1][c], sz = [-1, -1, 1, 1][c], nx = [1, 1, -1, -1][c], nz = [-1, 1, 1, -1][c]; lst.push([[sx * h, m, sz * h], [nx * h, m, nz * h]]); } rods(g, lst, 0.2, mat_, 4); }
  // decks
  Bx(g, 16.4, 1.4, 16.4, red, 0, 52.7, 0, 4); Bx(g, 16.0, 2.2, 16.0, glow(0xffd88a), 0, 54.5, 0, 4); Bx(g, 16.4, 1.4, 16.4, red, 0, 56.3, 0, 4); Bx(g, 14, 1.0, 14, white, 0, 57.5, 0, 4);
  Bx(g, 9.0, 1.2, 9.0, red, 0, 88.6, 0, 4); Bx(g, 8.6, 1.6, 8.6, glow(0xffd88a), 0, 89.9, 0, 4); Bx(g, 9.0, 1.0, 9.0, red, 0, 91.2, 0, 4);
  // antenna with red/white bands
  const bands = [[92, 100, 0.9, 0.7], [100, 110, 0.7, 0.55], [110, 122, 0.55, 0.4], [122, 134, 0.4, 0.28], [134, 150, 0.28, 0.1]];
  bands.forEach(([a, b, r0, r1], i) => Cy(g, r1, r0, b - a, 8, i % 2 ? white : red, 0, (a + b) / 2, 0, 4));
  Cy(g, 1.6, 1.6, 0.6, 10, white, 0, 105, 0, 2);
  Ms(g, SPH(6, 4), glow(0xff2a2a), 0, 150.2, 0, 0.35);
  // foot town: base building and corner footings
  Bx(g, 8, 6, 8, C(0xb8a898), 0, 3, 0, 3); Bx(g, 8.4, 0.4, 8.4, C(0x7a3a2a), 0, 6.2, 0, 2);
  win(g, 1.6, 1.8, -2, 2.5, 4.07, 0, { lit: true, fixed: true }); win(g, 1.6, 1.8, 2, 2.5, 4.07, 0, { lit: true, fixed: true });
  sgn(g, 'TOWER SHOP', 5, 0.8, 0, 5.2, 4.08, 0, { bg: '#2a0a0a', fg: '#ff6a3a', border: '#ff6a3a' });
  const cols = [[-4, 4, -4, 4, 6]];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    Bx(g, 3.2, 0.8, 3.2, mat('s6tk_conc'), sx * 16, 0.4, sz * 16, 3);
    cols.push([sx > 0 ? 11.2 : -16.8, sx > 0 ? 16.8 : -11.2, sz > 0 ? 11.2 : -16.8, sz > 0 ? 16.8 : -11.2, 16]);
  }
  return size(g, 36, 36, 150, cols);
}

// =====================================================================
// 7. skytreeTower  24 x 24 x 200  (far scenery; cols = three foot blocks only)
// =====================================================================
export function skytreeTower() {
  const g = G(), A = [0, 1, 2].map((i) => Math.PI / 2 + i * Math.PI * 2 / 3), white = C(0xdfe8f2, 0x3a4658), blue = glow(0x6fd0ff), steel = C(0xaab4c0, 0x30363e);
  const ring = (y, r) => A.map((a) => [Math.cos(a) * r, y, Math.sin(a) * r]);
  const Ys = [0.9, 14, 28, 42, 56], Rs = [11, 8.8, 6.6, 4.8, 3.2], legs = [], hor = [], br = [];
  for (let i = 0; i < 4; i++) {
    const a = ring(Ys[i], Rs[i]), b = ring(Ys[i + 1], Rs[i + 1]);
    for (let c = 0; c < 3; c++) { const n = (c + 1) % 3; legs.push([a[c], b[c]]); hor.push([a[c], a[n]]); br.push([a[c], b[n]], [a[n], b[c]]); }
  }
  rods(g, legs, 0.7, white, 5); rods(g, hor, 0.3, steel, 4); rods(g, br, 0.22, steel, 4);
  Cy(g, 3.4, 3.4, 0.6, 10, white, 0, 56.3, 0, 4);
  Cy(g, 2.6, 3.2, 75, 10, white, 0, 94, 0, 6);                      // shaft
  Cy(g, 2.75, 2.75, 1.0, 10, blue, 0, 70, 0, 4); Cy(g, 2.7, 2.7, 1.0, 10, blue, 0, 85, 0, 4);
  Cy(g, 6.5, 6.5, 2.5, 12, white, 0, 99, 0, 4); Cy(g, 6.7, 6.7, 3.2, 12, glow(0x9fe0ff), 0, 101.8, 0, 4); Cy(g, 6.5, 5.0, 2.5, 12, white, 0, 104.7, 0, 4);
  Cy(g, 4.6, 4.6, 2.0, 12, white, 0, 126, 0, 4); Cy(g, 4.8, 4.8, 2.6, 12, glow(0x9fe0ff), 0, 128.2, 0, 4); Cy(g, 4.6, 3.0, 2.0, 12, white, 0, 130.5, 0, 4);
  Cy(g, 1.4, 2.4, 40, 8, white, 0, 152, 0, 6); Cy(g, 0.25, 1.4, 28, 6, C(0xd8d8e0, 0x404048), 0, 186, 0, 6);
  Ms(g, SPH(6, 4), glow(0xff2a2a), 0, 200, 0, 0.5);
  for (const [x, , z] of ring(0, 11)) Bx(g, 2.6, 1.0, 2.6, mat('s6tk_conc'), x, 0.5, z, 3);
  const cols = ring(0, 10.5).map(([x, , z]) => [x - 1.8, x + 1.8, z - 1.8, z + 1.8, 24]);
  return size(g, 24, 24, 200, cols);
}

// =====================================================================
// 8. kaminarimon  26 x 12 x 16   passage x in (-6.5, 6.5) is open; cols = two guardian bays (h 9.2)
// =====================================================================
export function kaminarimon() {
  const g = G(), red = C(0xc8281c, 0x300806), dark = C(0x241812), gold = C(0xd9a62a, 0x4a3408), wall = C(0xe4dccb, 0x2c2822);
  ground(g, 26, 12, mat('s6tk_conc'));
  const px = [-12.2, -7.2, 7.2, 12.2];
  for (const x of px) for (const z of [-4.2, 4.2]) { Cy(g, 0.6, 0.6, 8.4, 10, red, x, 0.06 + 4.2 + 0.4, z, 3); Cy(g, 0.8, 0.8, 0.5, 10, C(0x4a4a50), x, 0.31, z, 2); }
  // guardian bays: lattice front/back, statue inside
  for (const s of [-1, 1]) {
    const cx = s * 9.7;
    for (const z of [-4.2, 4.2]) { Bx(g, 4.0, 3.4, 0.3, tint('s6tk_slats', 0xd04030), cx, 1.8, z, 2); Bx(g, 4.0, 0.25, 0.4, dark, cx, 3.6, z, 1); for (let k = 0; k < 8; k++) Bx(g, 0.1, 3.9, 0.12, red, cx - 1.75 + k * 0.5, 5.75, z, 1); Bx(g, 4.0, 0.2, 0.2, red, cx, 7.7, z, 1); }
    Bx(g, 0.3, 3.4, 8.4, tint('s6tk_slats', 0xd04030), s * 12.3, 1.8, 0, 2); Bx(g, 0.3, 3.4, 8.4, tint('s6tk_slats', 0xd04030), s * 7.2 + s * 0.0, 1.8, 0, 2);
    // statue: stone pedestal, blue-grey body, red face, glowing eyes
    Bx(g, 2.0, 0.9, 1.6, C(0x6a6a72), cx, 0.55, 0, 2); Bx(g, 1.3, 2.4, 0.9, C(0x4a5f8a, 0x0c1424), cx, 2.5, 0, 2);
    Sg(g, C(0xd8503a, 0x400c08), cx, 4.0, 0, 0.5, 0.55, 0.5, 8); Bx(g, 0.35, 1.6, 0.35, C(0x4a5f8a), cx + s * 0.9, 3.0, 0, 1).rotation.z = s * 0.5; Bx(g, 0.35, 1.6, 0.35, C(0x4a5f8a), cx - s * 0.9, 3.0, 0, 1).rotation.z = -s * 0.5;
    boxes(g, [[0.12, 0.08, 0.05, cx - 0.2, 4.05, 0.5], [0.12, 0.08, 0.05, cx + 0.2, 4.05, 0.5]], glow(0xffe060));
  }
  // tie beams over the passage + upper floor
  for (const z of [-4.2, 4.2]) { Bx(g, 26.2, 0.8, 0.8, red, 0, 8.3, z, 2); Bx(g, 26.2, 0.3, 0.9, dark, 0, 7.8, z, 1); }
  Bx(g, 0.8, 0.8, 8.8, red, -12.2, 8.3, 0, 2); Bx(g, 0.8, 0.8, 8.8, red, 12.2, 8.3, 0, 2); Bx(g, 0.8, 0.8, 8.8, red, -7.2, 8.3, 0, 2); Bx(g, 0.8, 0.8, 8.8, red, 7.2, 8.3, 0, 2);
  Bx(g, 22.4, 0.5, 9.0, dark, 0, 8.9, 0, 2);
  Bx(g, 21, 4.0, 8.4, wall, 0, 11.1, 0, 3);
  for (const z of [-4.25, 4.25]) { for (let i = 0; i < 7; i++) { const x = -9 + i * 3; Bx(g, 0.35, 4.0, 0.3, red, x, 11.1, z, 1); } }
  for (const [z, ry] of [[4.34, 0], [-4.34, Math.PI]]) for (let i = 0; i < 6; i++) pl(g, flatM('s6tk_shoji'), 2.1, 2.0, -7.5 + i * 3, 11.1, z, ry);
  for (const s of [-1, 1]) pl(g, flatM('s6tk_shoji'), 2.4, 2.0, s * 10.55, 11.1, 0, s * Math.PI / 2);
  curvedRoof(g, 13.0, 6.0, 1.5, 0, 9.0, 0, { top: [10.5, 4.2], soffit: true });          // lower eave
  curvedRoof(g, 12.6, 6.2, 3.0, 0, 13.0, 0, { top: [5.5, 0.4] });                         // main roof
  for (const s of [-1, 1]) { Bx(g, 0.6, 0.9, 0.5, gold, s * 5.6, 16.0, 0, 1); }
  // paper lanterns under the beams + the giant one
  const big = flatM('s6tk_biglantern');
  Cy(g, 1.9, 1.9, 4.2, 14, big, 0, 5.1, 0, 4).rotation.y = -Math.PI / 2;
  Cy(g, 1.2, 1.9, 0.5, 14, C(0x15100e), 0, 7.45, 0, 2); Cy(g, 1.9, 1.2, 0.5, 14, C(0x15100e), 0, 2.75, 0, 2); Cy(g, 0.12, 0.12, 0.75, 6, dark, 0, 8.0, 0, 1);
  for (const x of [-4, 4]) for (const z of [-3.5, 3.5]) lantern(g, x, 6.4, z, 0.5, 0.7);
  sgn(g, 'KAMINARIMON', 7.5, 1.1, 0, 7.15, 4.66, 0, { bg: '#1a0e08', fg: '#f0d890', border: '#d9a62a' }); sgn(g, 'KAMINARIMON', 7.5, 1.1, 0, 7.15, -4.66, Math.PI, { bg: '#1a0e08', fg: '#f0d890', border: '#d9a62a' });
  return size(g, 26, 12, 16, [[6.4, 13.2, -4.9, 4.9, 9.2], [-13.2, -6.4, -4.9, 4.9, 9.2]]);
}

// =====================================================================
// 9. pagoda  16 x 16 x 34  (five tiers)
//    cols: stone podium (h 1) + three narrowing body blocks
// =====================================================================
export function pagoda() {
  const g = G(), red = C(0xc8281c, 0x300806), wall = C(0xe2dac8, 0x34302a), gold = C(0xd9a62a, 0x4a3408), dark = C(0x241812);
  Bx(g, 15, 1.0, 15, mat('s6tk_conc'), 0, 0.5, 0, 4);
  Bx(g, 5.5, 0.5, 1.3, mat('s6tk_conc'), 0, 0.25, 7.9 - 0.2, 3); Bx(g, 5.5, 0.25, 0.9, mat('s6tk_conc'), 0, 0.12, 8.1 - 0.35, 3);
  const half = [4.5, 4.0, 3.5, 3.0, 2.5], tip = [7.6, 6.8, 6.0, 5.2, 4.4];
  for (let i = 0; i < 5; i++) {
    const y = 1.0 + 5.6 * i, h = half[i], nxt = i < 4 ? half[i + 1] : 0.35;
    Bx(g, h * 2, 3.4, h * 2, wall, 0, y + 1.7, 0, 3);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) Bx(g, 0.5, 3.4, 0.5, red, sx * h, y + 1.7, sz * h, 1);
    Bx(g, h * 2 + 0.3, 0.3, h * 2 + 0.3, red, 0, y + 3.25, 0, 2);
    Bx(g, h * 2 + 0.6, 0.12, h * 2 + 0.6, dark, 0, y + 0.06, 0, 2);
    for (const [x, z, ry] of [[0, h + 0.07, 0], [0, -h - 0.07, Math.PI], [h + 0.07, 0, Math.PI / 2], [-h - 0.07, 0, -Math.PI / 2]]) {
      pl(g, flatM('s6tk_shoji'), Math.min(2.4, h * 0.55), 1.9, x, y + 1.7, z, ry);
      if (i > 0) { /* balcony rail */ }
    }
    curvedRoof(g, tip[i], tip[i], 2.2, 0, y + 3.4, 0, { top: [nxt, nxt] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lantern(g, sx * (tip[i] - 0.5), y + 2.7, sz * (tip[i] - 0.5), 0.2, 0.28);
  }
  const top = 1.0 + 5.6 * 4 + 3.4 + 2.2;                    // 28.6
  Cy(g, 0.14, 0.2, 5.4, 6, gold, 0, top + 2.5, 0, 2);
  for (let i = 0; i < 6; i++) Ms(g, new THREE.TorusGeometry(0.45 - i * 0.04, 0.07, 4, 8), gold, 0, top + 0.8 + i * 0.7, 0, 1, 1, 1, Math.PI / 2);
  Ms(g, SPH(8, 5), glow(0xffd860), 0, top + 5.5, 0, 0.22);
  // night lighting: warm glow at the foot
  Bx(g, 15.2, 0.1, 15.2, glow(0x70461a), 0, 1.06, 0, 2).scale.set(1, 0.3, 1);
  return size(g, 16, 16, 34, [[-7.5, 7.5, -7.5, 7.5, 1.0], [-4.6, 4.6, -4.6, 4.6, 10], [-4.1, 4.1, -4.1, 4.1, 21], [-3.1, 3.1, -3.1, 3.1, 34]]);
}

// =====================================================================
// 10. torii  14 x 3 x 10   (walk between the posts; cols = the two posts)
// =====================================================================
export function torii() {
  const g = G(), red = C(0xd8301c, 0x3a0c06), blk = C(0x1a1412), X = 5.0;
  for (const s of [-1, 1]) {
    Cy(g, 0.5, 0.62, 8.6, 10, red, s * X, 4.3, 0, 3); Cy(g, 0.72, 0.72, 0.7, 10, blk, s * X, 0.35, 0, 2);
    Bx(g, 1.3, 0.2, 1.3, mat('s6tk_conc'), s * X, 0.1, 0, 2);
  }
  Bx(g, 11.4, 0.5, 0.5, red, 0, 6.6, 0, 2);                                   // nuki
  Bx(g, 10.4, 0.6, 1.0, red, 0, 8.65, 0, 2); Bx(g, 10.6, 0.22, 1.2, blk, 0, 9.1, 0, 2);   // kasagi centre + black cap
  for (const s of [-1, 1]) { const a = Bx(g, 3.6, 0.6, 1.0, red, s * 6.1, 8.95, 0, 2); a.rotation.z = s * 0.2; const b = Bx(g, 3.7, 0.22, 1.2, blk, s * 6.1, 9.45, 0, 2); b.rotation.z = s * 0.2; }
  Bx(g, 11, 0.35, 0.7, blk, 0, 8.2, 0, 2);                                    // shimaki
  Bx(g, 1.3, 1.5, 0.25, blk, 0, 7.55, 0.05, 2); sgn(g, 'JINJA', 1.1, 0.5, 0, 7.55, 0.2, 0, { bg: '#10080a', fg: '#e8c860', border: '#e8c860' }); sgn(g, 'JINJA', 1.1, 0.5, 0, 7.55, -0.1, Math.PI, { bg: '#10080a', fg: '#e8c860', border: '#e8c860' });
  for (const x of [-2.4, 0, 2.4]) { lantern(g, x, 5.7, 0, 0.35, 0.5); Cy(g, 0.02, 0.02, 0.4, 4, blk, x, 6.35, 0, 1); }
  return size(g, 14, 3, 10, [[-5.7, -4.3, -0.7, 0.7, 10], [4.3, 5.7, -0.7, 0.7, 10]]);
}

addPainters({
  s6tk_halo(g, w, h) {
    const gr = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  },
});
const haloM = (hex) => keyed(`halo${hex}`, () => new THREE.MeshBasicMaterial({ map: tex('s6tk_halo'), color: hex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));

// =====================================================================
// 11. japaneseHouseRow  30 x 12 x 9
// =====================================================================
export function japaneseHouseRow() {
  const g = G(), W = 7.5, wood = tint('s6tk_slats', 0xa88060), plast = tint('s6tk_plaster', 0xcfc4ac), dark = C(0x2a1c14), zc = -0.5, F = zc + 4.2;   // house body z -4.7..3.7
  ground(g, 30, 12);
  for (let i = 0; i < 4; i++) {
    const cx = -11.25 + i * W, two = i % 2 === 1, hh = 3.4;
    Bx(g, 6.6, hh, 8.4, plast, cx, 0.06 + hh / 2, zc, 3);
    Bx(g, 6.7, 1.2, 8.44, wood, cx, 0.06 + 0.6, zc, 2);                                  // wooden plinth boards
    let top = 0.06 + hh;
    if (two) { Bx(g, 5.6, 2.8, 7.2, plast, cx, top + 1.4, zc, 3); Bx(g, 5.7, 0.4, 7.3, wood, cx, top + 0.2, zc, 2); top += 2.8; }
    // pent eave over the veranda (ground floor), main roof on top
    if (two) curvedRoof(g, 4.2, 5.4, 1.0, cx, 0.06 + 3.0, zc, { top: [2.8, 3.6], soffit: true });
    curvedRoof(g, two ? 3.9 : 4.6, two ? 4.9 : 5.5, two ? 2.2 : 2.7, cx, top - 0.1, zc, { top: two ? [0.3, 0.5] : [0.6, 0.5] });
    if (!two) { Cy(g, 0.03, 0.03, 2.4, 4, C(0x888c94), cx + 1.5, top + 3.0, zc - 1, 1); Bx(g, 0.9, 0.05, 0.05, C(0x888c94), cx + 1.5, top + 3.6, zc - 1, 1); }
    // front: shoji veranda + door
    const dx = i % 2 ? 1.6 : -1.6;
    for (let k = 0; k < 2; k++) pl(g, flatM('s6tk_shoji'), 1.4, 2.0, cx - dx + (k - 0.5) * 1.45, 1.4, F + 0.06);
    for (const x of [-1.5, 0, 1.5]) Bx(g, 0.12, 2.2, 0.12, dark, cx - dx + x * 1.0 - 0.0, 1.4, F + 0.08, 1);
    Bx(g, 3.2, 0.12, 0.14, dark, cx - dx, 2.5, F + 0.08, 1);
    door(g, 1.0, 2.1, cx + dx * 1.4, 1.15, F + 0.06, 0, '#5a3a22');
    pl(g, selfLit('s6tk_noren', 0x888888, true), 1.0, 0.7, cx + dx * 1.4, 2.0, F + 0.18);
    lantern(g, cx + dx * 2.1, 2.2, F + 0.45, 0.2, 0.3, flatM('s6tk_lanternW'));
    sgn(g, ['NO.7', 'NO.8', 'NO.9', 'NO.10'][i], 0.7, 0.3, cx + dx * 2.4, 1.2, F + 0.06, 0, { bg: '#18120e', fg: '#e8c860', border: '#e8c860' });
    if (two) { win(g, 1.3, 1.5, cx - 1.4, 5.15, zc + 3.67, 0, { lit: true }); win(g, 1.3, 1.5, cx + 1.4, 5.15, zc + 3.67, 0, { lit: i === 1 }); Bx(g, 3.8, 0.1, 0.5, dark, cx, 4.2, zc + 3.85, 1); }
    // back & stuff
    win(g, 1.2, 1.3, cx - 1.5, 2.0, zc - 4.27, Math.PI, { fixed: true, lit: true }); win(g, 1.2, 1.3, cx + 1.5, 2.0, zc - 4.27, Math.PI, { fixed: true, lit: i % 2 === 0 });
    boxes(g, [[0.9, 0.7, 0.5, cx + 1.8, 2.6, zc - 4.45]], C(0x8a9098));
    // garden: bushes and a stone lantern
    Sg(g, C(0x2e5a34), cx - dx * 1.2 - 2.4 * (i % 2 ? -1 : 1) * 0.0 + (i % 2 ? 2.6 : -2.6), 0.6, F + 1.6, 0.8, 0.55, 0.7, 8);
    if (i % 2 === 0) { const sx = cx + 2.7; Bx(g, 0.5, 0.3, 0.5, C(0x7a7a80), sx, 0.2, F + 2.0, 1); Bx(g, 0.2, 0.6, 0.2, C(0x7a7a80), sx, 0.65, F + 2.0, 1); Bx(g, 0.4, 0.3, 0.4, glow(0xffc060), sx, 1.1, F + 2.0, 1); Bx(g, 0.6, 0.15, 0.6, C(0x7a7a80), sx, 1.33, F + 2.0, 1); }
    for (let k = 0; k < 3; k++) Bx(g, 0.5, 0.05, 0.4, C(0x8a8a90), cx - dx + (k - 1) * 0.1, 0.09, F + 0.7 + k * 0.6, 1);
  }
  const v = vendingMachine({ variant: 2 }); v.position.set(13.2, 0, 5.2); g.add(v);
  Bx(g, 30, 0.7, 0.2, wood, 0, 0.4, 5.9, 3);                                           // low fence along the front yard
  return size(g, 30, 12, 9, [[-15, 15, -5.0, F + 0.2, 9], [12.6, 13.8, 4.8, 5.6, 1.9], [-15, 15, 5.8, 6.0, 0.8]]);
}

// =====================================================================
// 12. capsuleHotel  22 x 16 x 26
// =====================================================================
export function capsuleHotel() {
  const g = G();
  ground(g, 22, 16);
  fbox(g, 22, 26, 16, 's6tk_capsule', 0, 13.06, 0, 8);
  Bx(g, 22.4, 0.5, 16.4, C(0x4a4e58), 0, 26.3, 0, 3);
  // glowing stripes
  Bx(g, 0.9, 22, 0.14, glow(0x19e6ff), 0, 13.5, 8.07, 1); Bx(g, 0.35, 22, 0.14, glow(0xff2d95), -1.0, 13.5, 8.07, 1); Bx(g, 0.35, 22, 0.14, glow(0xff2d95), 1.0, 13.5, 8.07, 1);
  for (const s of [-1, 1]) { Bx(g, 0.14, 0.7, 16, glow(0x19e6ff), s * 11.07, 24.6, 0, 1); Bx(g, 0.14, 0.25, 16, glow(0xff2d95), s * 11.07, 23.9, 0, 1); }
  Bx(g, 22.2, 0.7, 0.14, glow(0x19e6ff), 0, 24.6, 8.07, 1);
  // entrance: glass vestibule, canopy, sign
  Bx(g, 8, 3.4, 0.3, C(0x20242c), 0, 1.76, 8.15, 2); pl(g, basic(0xdff6ff), 5.6, 2.8, 0, 1.6, 8.32); Bx(g, 0.1, 2.8, 0.08, C(0x20242c), 0, 1.6, 8.36, 1);
  Bx(g, 9, 0.3, 1.8, C(0x20242c), 0, 3.7, 8.9, 2); Bx(g, 8.6, 0.05, 1.5, glow(0xfff3c8), 0, 3.5, 8.9, 1);
  sgn(g, 'CAPSULE HOTEL', 8.6, 1.2, 0, 5.2, 8.2, 0, { bg: '#08121c', fg: '#19e6ff', border: '#ff2d95' });
  sgn(g, 'ONE NIGHT 3000', 5.2, 0.7, -6.2, 2.0, 8.08, 0, { bg: '#0e0e16', fg: '#ffe81a', border: '#ffe81a' }); sgn(g, 'OPEN 24H', 3.6, 0.7, 6.4, 2.0, 8.08, 0, { bg: '#0e0e16', fg: '#52ff9a', border: '#52ff9a' });
  // roof: sign on a frame, water tank, vents
  for (const x of [-5.5, 5.5]) Bx(g, 0.3, 3.2, 0.3, C(0x2a2e38), x, 28.1, 0, 1);
  sgn(g, 'CAPSULE', 12, 2.6, 0, 28.0, 0.2, 0, { bg: '#08121c', fg: '#ff2d95', border: '#19e6ff' }); sgn(g, 'CAPSULE', 12, 2.6, 0, 28.0, -0.2, Math.PI, { bg: '#08121c', fg: '#ff2d95', border: '#19e6ff' });
  Cy(g, 1.4, 1.4, 2.4, 10, C(0x7a808a), -7, 27.7, -4, 2); boxes(g, [[2, 1, 1.4, 6, 27, -4], [1.2, 0.8, 1.2, 8, 26.9, 3], [1.6, 1, 1.2, -4, 27, 4]], C(0x6a707a));
  // side fire escape (zig-zag stair) on the east face
  const fe = [], rl = [];
  for (let f = 0; f < 5; f++) { const y0 = 4 + f * 4.4, y1 = y0 + 4.4; fe.push([[11.35, y0, -6], [11.35, y1, 3]]); rl.push([[11.6, y0 + 1, -6], [11.6, y1 + 1, 3]]); Bx(g, 0.9, 0.12, 2.2, C(0x555a64), 11.55, y0, f % 2 ? 3.4 : -6.7, 1); }
  rods(g, fe, 0.08, C(0x555a64), 4); rods(g, rl, 0.04, C(0x555a64), 3);
  for (let f = 0; f < 5; f++) Bx(g, 0.07, 1, 0.07, C(0x555a64), 11.7, 4.5 + f * 4.4, f % 2 ? 3.4 : -6.7, 1);
  // door on back, ac boxes
  door(g, 1.4, 2.4, 3, 1.25, -8.07, Math.PI, '#3a3e48'); boxes(g, [[0.9, 0.7, 0.5, -6, 4, -8.3], [0.9, 0.7, 0.5, -3, 4, -8.3], [0.9, 0.7, 0.5, 6, 4, -8.3]], C(0x8a9098));
  return size(g, 22, 16, 26);
}

// =====================================================================
// 13. godzillaHotel  26 x 22 x 50  (head peeks over the front roof edge)
//     cols: tower block z -11..8 (h 50) + low front annex z 8..11 (h 6). The head overhangs the annex above y = 36.
// =====================================================================
export function godzillaHotel() {
  const g = G();
  ground(g, 26, 22);
  fbox(g, 26, 36, 19, 's6tk_offC', 0, 18.06, -1.5, 12);          // tower z -11..8, y 0..36
  Bx(g, 26.6, 0.8, 19.6, C(0x4a4640), 0, 36.4, -1.5, 3);
  fbox(g, 20, 3.4, 14, 's6tk_offC', 2, 38.5, -3.5, 12);          // roof house
  Bx(g, 20.4, 0.4, 14.4, C(0x4a4640), 2, 40.4, -3.5, 3);
  // front annex (shops) with lit signs
  Bx(g, 26, 6, 3, C(0x5a5650), 0, 3.06, 9.5, 3); Bx(g, 26.4, 0.4, 3.4, C(0x2a2824), 0, 6.2, 9.5, 2);
  for (let i = 0; i < 4; i++) { const x = -9.75 + i * 6.5; pl(g, basic(i % 2 ? 0xfff0c8 : 0xffe0f0), 4.4, 2.8, x, 2.2, 11.07); for (const dx of [-2.3, 2.3]) Bx(g, 0.1, 2.9, 0.08, C(0x20242c), x + dx, 2.2, 11.1, 1); }
  sgn(g, 'MONSTER HOTEL', 14, 1.7, 0, 7.6, 8.06, 0, { bg: '#0c1810', fg: '#52ff9a', border: '#52ff9a' });
  sgn(g, 'HOTEL', 3.4, 0.7, 9.8, 5.2, 11.07, 0, { bg: '#10061a', fg: '#ff2d95', border: '#ff2d95' }); sgn(g, 'KARAOKE', 4.2, 0.7, -9.8, 5.2, 11.07, 0, { bg: '#10061a', fg: '#19e6ff', border: '#19e6ff' });
  // vertical accent fins and a lit side sign
  for (const x of [-12.9, 12.9]) Bx(g, 0.3, 36, 0.3, C(0x6a6660), x, 18.06, 8.1, 1);
  Bx(g, 0.18, 14, 1.4, glow(0x52ff9a), 13.1, 24, 4, 1); Bx(g, 0.18, 14, 1.4, glow(0x52ff9a), -13.1, 24, 4, 1);
  coverWall(g, '-z', -11.06, -12, 4, 4, 5, 6, 6, true, 2);
  // ---- the head ----
  const H = G(), skin = keyed('gz1', () => new THREE.MeshPhongMaterial({ color: 0x7a9a86, emissive: 0x12201a, shininess: 24, specular: 0x555555 })), belly = keyed('gz2', () => new THREE.MeshPhongMaterial({ color: 0xa0b49e, emissive: 0x1a2620, shininess: 18, specular: 0x444444 })), dorsal = keyed('gz3', () => new THREE.MeshPhongMaterial({ color: 0xb4c8ba, emissive: 0x2a3a30, shininess: 40, specular: 0x666666 }));
  const mouthM = C(0x7a1c14, 0x501008), teeth = C(0xf2eedc, 0x606050);
  Sg(H, skin, 0, 0, 0, 3.6, 3.2, 4.4, 14);                                   // skull
  Sg(H, skin, 0, -0.9, 4.6, 2.5, 1.5, 3.6, 12);                              // snout
  Sg(H, belly, 0, -3.0, 3.9, 2.2, 0.9, 3.5, 12).rotation.x = 0.35;           // lower jaw (open)
  Sg(H, mouthM, 0, -2.2, 3.7, 1.9, 0.5, 3.2, 8);
  for (let i = 0; i < 7; i++) { const z = 2.2 + i * 0.85, x = 1.6 - Math.min(i, 3) * 0.12; for (const s of [-1, 1]) { Ms(H, new THREE.ConeGeometry(0.2, 0.75, 4), teeth, s * x, -1.95, z, 1, 1, 1, Math.PI); Ms(H, new THREE.ConeGeometry(0.17, 0.6, 4), teeth, s * (x - 0.1), -2.5 - i * 0.05, z + 0.2, 1, 1, 1, 0); } }
  for (const s of [-1, 1]) {
    Sg(H, glow(0xffd23a), s * 2.15, 1.0, 3.1, 0.55, 0.45, 0.5, 8);
    Sg(H, C(0x1a1410), s * 2.3, 1.05, 3.45, 0.18, 0.28, 0.16, 6);
    Ms(H, new THREE.BoxGeometry(1.8, 0.45, 1.8), skin, s * 2.2, 1.7, 3.0, 1, 1, 1, 0.2, 0, s * -0.25);   // brow ridge
    Sg(H, C(0x161a18), s * 0.8, -0.1, 7.8, 0.28, 0.22, 0.3, 6);
  }
  for (let i = 0; i < 7; i++) { const z = -2.5 - i * 0.8, y = 2.6 + i * 0.1 - 1.0; Ms(H, new THREE.ConeGeometry(0.9 - i * 0.05, 2.6 - i * 0.1, 5), dorsal, 0, y + 2.2 - i * 0.4, z, 1, 1, 1, -0.5, 0, 0); }
  Cy(H, 3.0, 3.6, 10, 10, skin, 0, -4.5, -3.5, 4).rotation.x = -0.45;         // neck sloping back down into the roof
  H.position.set(-3, 43.6, -0.4); H.rotation.x = 0.12; H.scale.setScalar(1.3); g.add(H);
  Bx(g, 9, 3.2, 6, C(0x4a4640), -3, 38.6 + 0.2, 0.0, 3);                     // pedestal box under the neck (hidden mostly)
  // rooftop antennas / lit helipad ring
  Cy(g, 0.08, 0.14, 8, 5, C(0x777c88), 9, 44.4, -8, 1); Ms(g, SPH(6, 4), glow(0xff2a2a), 9, 48.5, -8, 0.3);
  Ms(g, new THREE.TorusGeometry(3.4, 0.08, 4, 20), glow(0xff2d95), 6, 40.15, -3.5, 1, 1, 1, Math.PI / 2);
  win(g, 1.4, 1.6, 12.3, 20, 8.07, 0, { lit: true, fixed: true });
  return size(g, 26, 22, 50, [[-13, 13, -11, 8, 50], [-13, 13, 8, 11, 6]]);
}

// =====================================================================
// 14. elevatedTrack  44 x 8 x 12   cols = the four hammerhead piers only (open >= 9 m between them, free along z)
// =====================================================================
function trainCar(g, x, z, len, first, last) {
  const geo = new THREE.BoxGeometry(len, 3.3, 2.9), end = C(0x9aa0aa, 0x20242a), roof = C(0x8a909a, 0x181c22), under = C(0x2a2e36);
  const side = litM('s6tk_train'); const m = new THREE.Mesh(geo, [end, end, roof, under, side, side]); m.position.set(x, 10.15, z); g.add(m);
  Bx(g, len - 0.6, 0.35, 1.6, C(0x6a707a), x, 12.0 - 0.05, z, 2);                // AC / roof gear (top at 12.0)
  Bx(g, len - 1, 0.4, 2.5, C(0x2a2e36), x, 8.7, z, 2);                             // bogie skirt
  for (const s of [-1, 1]) if ((s < 0 && first) || (s > 0 && last)) { Bx(g, 0.06, 0.5, 1.2, glow(0xfff4c8), x + s * (len / 2 + 0.02), 9.5, z, 1); Bx(g, 0.06, 0.4, 1.8, glow(0x52ff9a), x + s * (len / 2 + 0.02), 11.3, z, 1); }
}
export function elevatedTrack() {
  const g = G(), conc = mat('s6tk_conc'), cdark = C(0x4a4c52);
  const PX = [-16.5, -5.5, 5.5, 16.5];
  for (const x of PX) { Bx(g, 1.6, 6.1, 2.4, conc, x, 3.05, 0, 3); Bx(g, 2.2, 0.8, 7.0, conc, x, 6.5, 0, 3); }
  Bx(g, 44, 1.3, 7.6, conc, 0, 7.55, 0, 4);                                         // deck slab y 6.9..8.2
  for (const s of [-1, 1]) { Bx(g, 44, 0.5, 0.8, cdark, 0, 6.65, s * 2.6, 3); Bx(g, 44, 1.0, 0.3, conc, 0, 8.7, s * 3.65, 3); }
  Bx(g, 43.6, 0.14, 6.9, C(0x45423e), 0, 8.27, 0, 3);                                // ballast
  for (const z of [1.9, -1.9]) { for (const o of [-0.7, 0.7]) Bx(g, 44, 0.12, 0.1, C(0x9aa0aa), 0, 8.4, z + o, 1); for (let i = 0; i < 44; i += 1) { /* sleepers merged below */ } }
  boxes(g, Array.from({ length: 56 }, (_, i) => [0.28, 0.08, 2.2, -21.5 + i * 0.78, 8.36, 1.9]).concat(Array.from({ length: 56 }, (_, i) => [0.28, 0.08, 2.2, -21.5 + i * 0.78, 8.36, -1.9])), C(0x5a4a3a));
  // train on the front track
  const cars = 3, L = 13.4, gap = 0.7, x0 = -(cars * L + (cars - 1) * gap) / 2 + L / 2;
  for (let i = 0; i < cars; i++) trainCar(g, x0 + i * (L + gap), 1.9, L, i === 0, i === cars - 1);
  // catenary masts + wires
  for (const x of [-20, -9.5, 0, 9.5, 20]) { Bx(g, 0.18, 3.7, 0.18, C(0x5a606a), x, 10.05, -3.45, 1); Bx(g, 0.14, 0.14, 5.6, C(0x5a606a), x, 11.85, -0.75, 1); }
  Bx(g, 44, 0.04, 0.04, C(0x2a2a30), 0, 11.8, 1.9, 1); Bx(g, 44, 0.04, 0.04, C(0x2a2a30), 0, 11.9, -1.9, 1);
  // signage on the viaduct beams, neon bits
  [['RAMEN', '#ffe81a', -16], ['24H', '#19e6ff', -5.5], ['SUSHI', '#ff2d95', 5.5], ['KARAOKE', '#52ff9a', 16]].forEach(([t, c, x]) => sgn(g, t, 3.4, 0.9, x, 7.55, 3.86, 0, { bg: '#10061c', fg: c, border: c }));
  [['GAME', '#ff2d95', -11], ['MART', '#ffe81a', 0], ['BAR', '#19e6ff', 11]].forEach(([t, c, x]) => sgn(g, t, 3.0, 0.9, x, 7.55, -3.86, Math.PI, { bg: '#10061c', fg: c, border: c }));
  // station-ish lamps on the parapet
  for (const x of [-18, -6, 6, 18]) { Bx(g, 0.1, 1.6, 0.1, C(0x5a606a), x, 9.7, 3.65, 1); Bx(g, 0.5, 0.12, 0.3, glow(0xfff0c0), x, 10.55, 3.65, 1); }
  return size(g, 44, 8, 12, PX.map((x) => [x - 0.8, x + 0.8, -1.2, 1.2, 6.9]));
}

// =====================================================================
// 15. giantScreen  14 x 2 x 10   cols = two posts (open underneath, screen from y 2.6)
// =====================================================================
export function giantScreen() {
  const g = G(), dk = C(0x23202e), tube = glow(0xff2d95), tube2 = glow(0x19e6ff);
  for (const s of [-1, 1]) { Bx(g, 0.9, 10, 1.4, dk, s * 6.6, 5, 0, 2); Bx(g, 1.8, 0.3, 2.0, mat('s6tk_conc'), s * 6.6, 0.15, 0, 2); }
  Bx(g, 12.4, 7.4, 0.6, dk, 0, 6.3, 0, 3);                                            // frame box y 2.6..10.0
  panel(g, 's6tk_screen0', 12.0, 6.5, 0, 6.3, 0.32, 0);
  panel(g, 's6tk_screen1', 12.0, 6.5, 0, 6.3, -0.32, Math.PI);
  for (const z of [0.33, -0.33]) { Bx(g, 12.2, 0.12, 0.08, tube, 0, 9.78, z, 1); Bx(g, 12.2, 0.12, 0.08, tube2, 0, 2.82, z, 1); for (const s of [-1, 1]) Bx(g, 0.12, 6.6, 0.08, tube2, s * 6.1, 6.3, z, 1); }
  for (const s of [-1, 1]) { rods(g, [[[s * 6.6, 3.0, -0.7], [s * 6.0, 6.0, -0.35]], [[s * 6.6, 9.0, -0.7], [s * 6.0, 6.5, -0.35]]], 0.07, dk, 4); }
  for (let i = 0; i < 5; i++) { const x = -5 + i * 2.5; Bx(g, 0.5, 0.35, 0.8, C(0x3a3846), x, 10.2, 0.6, 1); Bx(g, 0.4, 0.06, 0.5, glow(0xfff6d0), x, 10.0, 0.62, 1); }
  Bx(g, 3.2, 0.5, 0.2, C(0x1a1424), 0, 2.2, 0.3, 1); sgn(g, 'ON AIR', 3.0, 0.45, 0, 2.2, 0.41, 0, { bg: '#1a0408', fg: '#ff2a2a', border: '#ff2a2a' });
  return size(g, 14, 2, 10, [[-7.2, -6.0, -0.8, 0.8, 10], [6.0, 7.2, -0.8, 0.8, 10]]);
}

// =====================================================================
// Props
// =====================================================================
const VEND = [0xd8281e, 0x2a62c8, 0xe8ecf0, 0x2a9a5a];
export function vendingMachine(opts = {}) {
  const g = G(), body = C(VEND[(opts.variant | 0) % 4 === 2 ? 2 : (opts.variant | 0) % 4], 0x180806), dk = C(0x22242c);
  Bx(g, 1.0, 1.9, 0.8, body, 0, 0.95, 0, 2);
  pl(g, flatM('s6tk_vend'), 0.64, 1.1, -0.12, 1.22, 0.405);
  Bx(g, 0.7, 0.04, 0.06, dk, -0.12, 1.79, 0.41, 1); Bx(g, 0.7, 0.04, 0.06, dk, -0.12, 0.65, 0.41, 1); Bx(g, 0.04, 1.2, 0.06, dk, 0.22, 1.22, 0.41, 1); Bx(g, 0.04, 1.2, 0.06, dk, -0.46, 1.22, 0.41, 1);
  Bx(g, 0.2, 0.9, 0.05, dk, 0.37, 1.2, 0.41, 1);
  boxes(g, [[0.08, 0.06, 0.03, 0.37, 1.5, 0.44], [0.08, 0.06, 0.03, 0.37, 1.35, 0.44], [0.08, 0.06, 0.03, 0.37, 1.2, 0.44]], glow(0x52ff9a));
  boxes(g, [[0.12, 0.08, 0.03, 0.37, 0.95, 0.44]], glow(0xffe81a));
  Bx(g, 0.6, 0.25, 0.05, dk, -0.12, 0.38, 0.41, 1);                                     // pickup flap
  Bx(g, 0.94, 0.14, 0.04, glow(0xfff6d8), 0, 1.84, 0.41, 1);                            // lit header
  const h = pl(g, haloM(0xb8d8ff), 2.4, 2.0, 0, 0.03, 1.1, 0, -Math.PI / 2); h.renderOrder = 1;
  return size(g, 1, 0.8, 1.9, [[-0.5, 0.5, -0.4, 0.4, 1.9]]);
}

export function utilityPole(opts = {}) {
  const g = G(), span = opts.span || 8, sides = opts.sides || [-1, 1], wood = C(0x6a5a4a), ins = C(0xd8e0e8), wire = C(0x1c1c20);   // sides: which neighbours this pole's wires run to (local -x / +x); each half-span meets the neighbour's half at the middle
  Cy(g, 0.12, 0.18, 9, 8, wood, 0, 4.5, 0, 2);
  for (const y of [8.5, 7.7]) { Bx(g, 0.1, 0.1, 1.2, wood, 0, y, 0, 1); for (const z of [-0.5, 0, 0.5]) Cy(g, 0.04, 0.05, 0.16, 5, ins, 0, y + 0.13, z, 1); }
  Cy(g, 0.3, 0.3, 0.95, 8, C(0x7a808a), 0.5, 6.6, 0, 1); Bx(g, 0.04, 0.04, 0.04, wire, 0.2, 6.6, 0, 1);
  Bx(g, 0.34, 0.5, 0.04, C(0xe8c020), 0.0, 3.2, 0.19, 1); Bx(g, 0.5, 0.06, 0.06, C(0x6a707a), 0, 5.4, 0.12, 1);
  const lst = [];
  const half = span / 2, sag = 0.5;
  const curve = (y0, z, side) => { let px = 0, py = y0 + 0.13; for (let i = 1; i <= 5; i++) { const t = i / 5, x = side * half * t, y = y0 + 0.13 - sag * (1 - (1 - t) * (1 - t)) - 0.0; lst.push([[px, py, z], [x, y, z]]); px = x; py = y; } };
  for (const y of [8.5, 7.7]) for (const z of [-0.5, 0, 0.5]) for (const s of sides) curve(y, z, s);
  const tc = []; for (const s of sides) { let px = 0, py = 6.0; for (let i = 1; i <= 5; i++) { const t = i / 5, x = s * half * t, y = 6.0 - 0.7 * (1 - (1 - t) * (1 - t)); tc.push([[px, py, 0.14], [x, y, 0.14]]); px = x; py = y; } }
  rods(g, lst, 0.025, wire, 3); rods(g, tc, 0.045, C(0x101012), 3);
  return size(g, 1.2, 1.2, 9, [[-0.3, 0.3, -0.3, 0.3, 9]]);
}

export function sakuraTree() {
  const g = G(), bark = C(0x5a4636), br = [];
  const trunk = Cy(g, 0.32, 0.5, 3.6, 8, bark, 0, 1.8, 0, 1); trunk.rotation.z = 0.05;
  const arms = [[1.6, 5.2, 0.4], [-1.5, 5.0, -0.6], [0.3, 5.6, 1.6], [-0.4, 5.3, -1.6], [1.2, 6.0, -1.1]];
  arms.forEach(([x, y, z]) => br.push([[0, 3.0, 0], [x, y, z]]));
  rods(g, br, 0.13, bark, 5);
  const cm = [C(0xf6a8c4, 0x7a3050), C(0xffc4d8, 0x803858), C(0xf08ab0, 0x702848)];
  const pos = [[0, 6.6, 0, 1.9], [1.9, 5.4, 0.6, 1.5], [-1.9, 5.2, -0.5, 1.6], [0.4, 5.6, 2.0, 1.4], [-0.6, 5.5, -2.0, 1.5], [1.4, 6.6, -1.4, 1.2], [-1.3, 6.6, 1.2, 1.2], [0, 7.4, 0, 0.9]];
  const ico = new THREE.IcosahedronGeometry(1, 1);
  pos.forEach(([x, y, z, r], i) => Ms(g, ico, cm[i % 3], x, y, z, r, r * 0.8, r));
  const pt = new THREE.Mesh(new THREE.CircleGeometry(2.7, 12), keyed('petals', () => new THREE.MeshBasicMaterial({ color: 0xe8a0c0, transparent: true, opacity: 0.45, depthWrite: false })));
  pt.rotation.x = -Math.PI / 2; pt.position.y = 0.04; pt.renderOrder = 1; g.add(pt);
  return size(g, 6, 6, 8, [[-0.5, 0.5, -0.5, 0.5, 8]]);
}

export function paperLanternPost() {
  const g = G(), wood = C(0x4a3626), dark = C(0x1c1410);
  Bx(g, 0.6, 0.25, 0.6, C(0x7a7a80), 0, 0.125, 0, 1);
  Cy(g, 0.07, 0.09, 3.9, 6, wood, 0, 2.05, 0, 1);
  Bx(g, 1.0, 0.07, 0.07, wood, 0, 3.6, 0, 1); Bx(g, 0.07, 0.07, 0.5, wood, 0, 3.74, 0, 1);
  for (const s of [-1, 1]) { Cy(g, 0.01, 0.01, 0.2, 3, dark, s * 0.4, 3.45, 0, 1); lantern(g, s * 0.4, 3.12, 0, 0.2, 0.3); }
  for (let i = 0; i < 3; i++) lantern(g, 0, 3.0 - i * 0.75 + 0.15, 0.2, 0.15, 0.2, flatM(i === 1 ? 's6tk_lanternW' : 's6tk_lantern'));
  Bx(g, 0.18, 0.18, 0.18, glow(0xffd070), 0, 3.95 + 0.0, 0, 1);
  const h = pl(g, haloM(0xff8a40), 3.0, 3.0, 0, 0.03, 0, 0, -Math.PI / 2); h.renderOrder = 1;
  return size(g, 1, 1, 4, [[-0.25, 0.25, -0.25, 0.25, 4]]);
}

export function crossingLights() {
  const g = G(), pole = C(0x6a707a), dk = C(0x22242c);
  for (const s of [-1, 1]) {
    const x = s * 2.8;
    Cy(g, 0.07, 0.1, 6, 8, pole, x, 3, 0, 1);
    Bx(g, 0.5, 0.3, 0.5, C(0x7a7a80), x, 0.15, 0, 1);
    // pedestrian signal head facing the other pole
    const red = s < 0, fx = x - s * 0.22;
    Bx(g, 0.18, 0.95, 0.52, dk, x - s * 0.15, 2.7, 0, 1);
    Bx(g, 0.04, 0.34, 0.34, glow(red ? 0xff2a2a : 0x3a1010), fx - s * 0.0, 3.0, 0, 1); Bx(g, 0.04, 0.34, 0.34, glow(red ? 0x103a1c : 0x52ff9a), fx, 2.5, 0, 1);
    Bx(g, 0.1, 0.1, 0.3, glow(0xffe81a), x + 0.0, 1.2, 0.16, 1); Bx(g, 0.2, 0.28, 0.1, C(0xe8c020), x, 1.2, 0.14, 1);
    // street lamp arm over the road
    rods(g, [[[x, 5.8, 0], [x, 6.0, 0]], [[x, 5.95, 0], [x - s * 1.6, 5.7, 0]]], 0.05, pole, 5);
    Bx(g, 0.7, 0.12, 0.3, glow(0xfff0c0), x - s * 1.7, 5.62, 0, 1);
    Bx(g, 0.6, 0.6, 0.06, C(0x2a6ad8), x, 4.6, 0.12, 1);
    pl(g, haloM(0xffe0a0), 3.4, 3.4, x - s * 1.5, 0.03, 0, 0, -Math.PI / 2).renderOrder = 1;
  }
  return size(g, 6, 1, 6, [[-3.05, -2.55, -0.25, 0.25, 6], [2.55, 3.05, -0.25, 0.25, 6]]);
}

export function ramenCart() {
  const g = G(), red = C(0xa8281e, 0x200806), wood = C(0x7a5236), dk = C(0x22201e);
  Bx(g, 2.4, 0.9, 1.2, red, 0, 0.95, 0, 2); Bx(g, 2.5, 0.08, 1.3, wood, 0, 1.44, 0, 1);
  Bx(g, 2.3, 0.1, 1.1, dk, 0, 0.5, 0, 1);
  for (const x of [-0.95, 0.95]) for (const z of [-0.72, 0.72]) { const w = Cy(g, 0.45, 0.45, 0.1, 10, dk, x, 0.45, z, 1); w.rotation.x = Math.PI / 2; }
  rods(g, [[[-1.2, 0.9, 0.3], [-1.45, 1.1, 0.3]], [[-1.2, 0.9, -0.3], [-1.45, 1.1, -0.3]]], 0.04, wood, 4); Bx(g, 0.06, 0.06, 0.7, wood, -1.45, 1.1, 0, 1);
  for (const x of [-1.2, 1.2]) for (const z of [-0.55, 0.55]) Cy(g, 0.035, 0.035, 0.95, 4, wood, x, 1.95, z, 1);
  const roof = Bx(g, 2.9, 0.1, 1.5, C(0x3a2a24), 0, 2.45, 0, 2); roof.rotation.x = 0.06;
  Bx(g, 2.9, 0.06, 0.06, glow(0xffe8b0), 0, 2.3, 0.73, 1);
  pl(g, selfLit('s6tk_noren', 0x888888, true), 2.4, 0.55, 0, 2.0, 0.7);
  Cy(g, 0.32, 0.3, 0.45, 10, C(0xb0b6c0), -0.5, 1.7, 0, 1); Cy(g, 0.28, 0.28, 0.02, 10, glow(0xffd080), -0.5, 1.93, 0, 1);
  for (const x of [0.3, 0.75, 1.0]) Cy(g, 0.11, 0.08, 0.1, 8, C(0xf4f0e8), x, 1.53, 0.3, 1);
  const st = keyed('steam', () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false }));
  Sg(g, st, -0.5, 2.1, 0, 0.22, 0.3, 0.22, 6); Sg(g, st, -0.45, 2.3, 0.02, 0.17, 0.22, 0.17, 6);
  lantern(g, 1.15, 1.95, 0.85, 0.3, 0.36, flatM('s6tk_lanternW')); lantern(g, -1.15, 1.95, 0.85, 0.3, 0.36);
  for (const x of [-0.7, 0.2, 1.0]) { Cy(g, 0.22, 0.2, 0.5, 8, C(0x9a3a2a), x, 0.25, 1.35, 1); }
  return size(g, 3, 2, 2.5);
}
