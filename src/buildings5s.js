// Seattle: gloomy, rainy Pacific-Northwest landmarks + a gritty back-alley district.
// Same conventions as the other building files: origin = footprint centre on the ground, front faces local +Z,
// group.userData = { w, d, h[, cols] }.  Textures are prefixed s5s_.
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
const glow = (hex) => color(hex, { emissive: hex });                 // lit-looking flat colour
// extra materials (cached)
const _m = {};
const keyed = (k, f) => _m[k] || (_m[k] = f());
const shiny = (hex, sh = 60) => keyed(`p${hex}_${sh}`, () => new THREE.MeshPhongMaterial({ color: hex, shininess: sh, specular: 0x666666 }));
const glassM = (hex, op) => keyed(`g${hex}_${op}`, () => new THREE.MeshLambertMaterial({ color: hex, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
const basic = (hex) => keyed(`b${hex}`, () => new THREE.MeshBasicMaterial({ color: hex }));
const alphaMat = (name) => keyed(`a${name}`, () => new THREE.MeshLambertMaterial({ map: tex(name), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
const tint = (name, hex) => keyed(`t${name}${hex}`, () => new THREE.MeshLambertMaterial({ map: tex(name), color: hex }));
const metalM = (hex, sh = 80) => keyed(`pm${hex}_${sh}`, () => new THREE.MeshPhongMaterial({ color: hex, map: tex('s5s_metal'), shininess: sh, specular: 0x888888 }));
const flatMap = (name) => keyed(`f${name}`, () => new THREE.MeshBasicMaterial({ map: tex(name) }));

// ---- scene-building helpers (all add to g and return the mesh) ----
const Bx = (g, w, h, d, m, x, y, z, tile = 3) => { const b = boxT(w, h, d, m, tile); b.position.set(x, y, z); g.add(b); return b; };
const Cy = (g, rt, rb, h, n, m, x, y, z, tile = 3) => { const b = cylT(rt, rb, h, n, m, tile); b.position.set(x, y, z); g.add(b); return b; };
const Ms = (g, geo, m, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); g.add(o); return o;
};
const SPH = (r = 1, a = 12, b = 8) => new THREE.SphereGeometry(r, a, b);
const Sg = (g, m, x, y, z, sx, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0, n = 12) => Ms(g, SPH(1, n, Math.max(4, Math.round(n * 0.6))), m, x, y, z, sx, sy, sz, rx, ry, rz);
const win = (g, w, h, x, y, z, ry = 0, o = {}) => { const d = decal('window', w, h, x, y, z, { c: '#d8d2c0', ...o }); d.rotation.y = ry; g.add(d); return d; };
const door = (g, w, h, x, y, z, ry = 0, c = '#4a3a2a') => { const d = decal('door', w, h, x, y, z, { c }); d.rotation.y = ry; g.add(d); return d; };
const flat = (g, m, w, h, x, y, z, ry = 0, rx = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); g.add(p); return p; };
const sgn = (g, text, w, h, x, y, z, ry = 0, o = {}) => { const s = sign(text, w, h, o); s.position.set(x, y, z); s.rotation.y = ry; g.add(s); return s; };

// rod between two points as geometry (for merging)
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
// merged boxes: [[w,h,d,x,y,z], ...]
const boxes = (g, list, m) => {
  const gs = list.map(([w, h, d, x, y, z]) => { const b = new THREE.BoxGeometry(w, h, d); b.translate(x, y, z); return b; });
  const me = new THREE.Mesh(merge(gs), m); g.add(me); return me;
};

// ---------- textures ----------
const noise = (g, w, h, r, n, cols, s = 1) => { for (let i = 0; i < n; i++) R(g, (r() * w) | 0, (r() * h) | 0, s, s, pick(r, cols)); };
function graffiti(g, w, h, seed, base = '#6d6a66') {
  const r = mulberry(seed);
  R(g, 0, 0, w, h, base);
  for (let y = 0; y < h; y += 8) R(g, 0, y, w, 1, 'rgba(0,0,0,0.14)');
  noise(g, w, h, r, 300, ['rgba(0,0,0,.12)', 'rgba(255,255,255,.07)']);
  const pal = ['#ff3d8b', '#ffd23d', '#38c6f4', '#7cf05a', '#ff7a1a', '#a45bff', '#00E599', '#f4f4f0'];
  for (let i = 0; i < w / 40; i++) {
    g.fillStyle = pick(r, pal); g.beginPath(); g.ellipse(r() * w, h * 0.2 + r() * h * 0.6, 8 + r() * 16, 6 + r() * 9, r() * 3, 0, 6.28); g.fill();
  }
  const words = ['RAIN', 'MOSS', 'GLOOM', 'ZAP', 'WOW', 'LATTE', 'DRIP', 'HELLO', 'SUN?', 'CATS', 'BEEP', 'MEOW', 'FOG'];
  g.font = `bold ${Math.round(h * 0.34)}px Arial, Helvetica, sans-serif`; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (let i = 0; i < w / 56; i++) {
    const t = pick(r, words), x = 6 + r() * (w - 60), y = h * 0.28 + r() * h * 0.5;
    g.lineWidth = 4; g.strokeStyle = '#15141a'; g.strokeText(t, x, y); g.fillStyle = pick(r, pal); g.fillText(t, x, y);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + 2, y - h * 0.12, 6, 2);
    for (let k = 0; k < 3; k++) { g.fillStyle = pick(r, pal); g.fillRect(x + 4 + k * 11, y + h * 0.15, 1.5, 4 + r() * 12); }   // drips
  }
  for (let i = 0; i < w / 90; i++) {   // smileys, stars, cats
    const x = 14 + r() * (w - 28), y = 12 + r() * (h - 24), k = (r() * 3) | 0;
    if (k === 0) { g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(x, y, 7, 0, 6.28); g.fill(); R(g, x - 3, y - 2, 2, 2, '#222'); R(g, x + 1, y - 2, 2, 2, '#222'); R(g, x - 3, y + 2, 6, 1, '#222'); }
    else if (k === 1) { g.fillStyle = pick(r, pal); g.beginPath(); for (let j = 0; j < 10; j++) { const a = j * 0.628 - 1.57, rr = j % 2 ? 3 : 8; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
    else { g.fillStyle = '#222'; g.beginPath(); g.arc(x, y, 6, 0, 6.28); g.moveTo(x - 6, y - 2); g.lineTo(x - 5, y - 10); g.lineTo(x - 1, y - 5); g.moveTo(x + 6, y - 2); g.lineTo(x + 5, y - 10); g.lineTo(x + 1, y - 5); g.fill(); R(g, x - 3, y - 1, 2, 2, '#00E599'); R(g, x + 1, y - 1, 2, 2, '#00E599'); }
  }
  for (let i = 0; i < 40; i++) R(g, (r() * w) | 0, (r() * h) | 0, 2, 1, 'rgba(0,0,0,.2)');
}
function container(g, w, h, base, dark, seed) {
  const r = mulberry(seed);
  R(g, 0, 0, w, h, base);
  for (let x = 0; x < w; x += 4) { R(g, x, 3, 1, h - 6, dark); R(g, x + 2, 3, 1, h - 6, 'rgba(255,255,255,.08)'); }
  R(g, 0, 0, w, 3, dark); R(g, 0, h - 3, w, 3, dark);
  for (let i = 0; i < 14; i++) { const x = (r() * w) | 0; R(g, x, 3, 1 + ((r() * 3) | 0), 8 + ((r() * 30) | 0), 'rgba(120,60,20,.45)'); }
  noise(g, w, h, r, 120, ['rgba(110,50,15,.5)', 'rgba(0,0,0,.2)'], 2);
}
const archPath = (g, x, y, w, h) => { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); };

addPainters({
  s5s_glassBlack(g) {
    const r = mulberry(501); R(g, 0, 0, 64, 64, '#07090c');
    for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
      const x = cx * 16, y = cy * 16, lit = r() < 0.06;
      R(g, x + 1, y + 1, 14, 11, lit ? '#b9a273' : '#18222c'); R(g, x + 1, y + 1, 14, 4, lit ? '#d6c28f' : '#2b3e4f');
      R(g, x + 3, y + 5, 6, 1, 'rgba(255,255,255,.07)'); R(g, x + 7, y + 1, 1, 11, '#090c10'); R(g, x, y + 12, 16, 4, '#0b0f13');
    }
    R(g, 0, 0, 1, 64, '#020304');
  },
  s5s_terra(g) {
    const r = mulberry(502); R(g, 0, 0, 64, 64, '#dccaa6');
    noise(g, 64, 64, r, 120, ['rgba(120,90,60,.10)', 'rgba(255,255,255,.12)']);
    for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
      const x = cx * 16, y = cy * 16;
      R(g, x, y, 2, 16, '#b86d4e'); R(g, x + 14, y, 2, 16, '#b86d4e');
      R(g, x + 3, y + 2, 10, 11, '#efe4c8'); R(g, x + 4, y + 3, 8, 9, r() < 0.07 ? '#d8b66a' : '#2a323c'); R(g, x + 8, y + 3, 1, 9, '#efe4c8'); R(g, x + 4, y + 7, 8, 1, '#efe4c8');
      R(g, x + 2, y + 13, 12, 1, '#a8765a'); R(g, x, y + 15, 16, 1, 'rgba(0,0,0,.2)');
    }
  },
  s5s_diamond(g) {
    R(g, 0, 0, 64, 64, '#6b8794');
    const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(0,0,0,.12)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const cx = i * 32 + 16, cy = j * 32 + 16; g.fillStyle = (i + j) % 2 ? 'rgba(20,40,55,.35)' : 'rgba(210,235,245,.22)';
      g.beginPath(); g.moveTo(cx, cy - 16); g.lineTo(cx + 16, cy); g.lineTo(cx, cy + 16); g.lineTo(cx - 16, cy); g.fill();
    }
    g.strokeStyle = '#1f2a31'; g.lineWidth = 2;
    for (let k = -2; k <= 4; k++) { g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32 + 64, 64); g.moveTo(k * 32, 64); g.lineTo(k * 32 + 64, 0); g.stroke(); }
    R(g, 8, 28, 3, 3, '#e0b86a'); R(g, 44, 12, 3, 3, '#e0b86a'); R(g, 36, 50, 3, 3, '#e0b86a');
  },
  s5s_brickDark(g) {
    const r = mulberry(504); R(g, 0, 0, 64, 64, '#3a2b27');
    for (let row = 0; row < 8; row++) { const off = row % 2 ? 8 : 0; for (let bx = -8; bx < 64; bx += 16) R(g, bx + off + 1, row * 8 + 1, 14, 6, pick(r, ['#7d3d2f', '#6c3429', '#87452f', '#5f2e25', '#74382c'])); }
    for (let i = 0; i < 9; i++) R(g, (r() * 64) | 0, 0, 1 + ((r() * 2) | 0), 64, 'rgba(0,0,0,.13)');
    noise(g, 64, 64, r, 80, ['rgba(255,255,255,.07)', 'rgba(0,0,0,.15)']);
  },
  s5s_woodwall(g) {
    const r = mulberry(505); R(g, 0, 0, 64, 64, '#6b4b2d');
    for (let x = 0; x < 64; x += 8) { R(g, x, 0, 1, 64, 'rgba(0,0,0,.35)'); R(g, x + 1 + ((r() * 5) | 0), 0, 1, 64, 'rgba(255,220,160,.1)'); }
    noise(g, 64, 64, r, 100, ['rgba(0,0,0,.18)', 'rgba(255,230,180,.1)']);
    R(g, 0, 44, 64, 20, '#2f4a3c'); R(g, 0, 43, 64, 2, '#c9b78a'); R(g, 0, 0, 64, 3, '#3d2a18');
  },
  s5s_marketFloor(g) {
    const r = mulberry(506); R(g, 0, 0, 64, 64, '#2e2a27');
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) R(g, x * 8 + 1, y * 8 + 1, 7, 7, pick(r, ['#4c4540', '#454039', '#524a43', '#3d3833']));
    for (let i = 0; i < 6; i++) R(g, (r() * 56) | 0, (r() * 56) | 0, 6 + ((r() * 10) | 0), 3, 'rgba(110,140,160,.28)');
  },
  s5s_beams(g) {
    const r = mulberry(507); R(g, 0, 0, 64, 64, '#4a3623');
    for (let y = 0; y < 64; y += 8) { R(g, 0, y, 64, 1, 'rgba(0,0,0,.4)'); R(g, 0, y + 3, 64, 1, 'rgba(255,220,160,.07)'); }
    noise(g, 64, 64, r, 120, ['rgba(0,0,0,.2)', 'rgba(255,220,160,.1)']);
  },
  s5s_metal(g) {
    const r = mulberry(513); R(g, 0, 0, 64, 64, '#d2d2d2');
    for (let y = 0; y < 64; y += 4) R(g, 0, y, 64, 1, 'rgba(0,0,0,.10)');
    for (let y = 0; y < 64; y += 16) { R(g, 0, y, 64, 1, 'rgba(0,0,0,.28)'); for (let x = ((y / 16) % 2) * 16; x < 64; x += 32) R(g, x, y, 1, 16, 'rgba(0,0,0,.22)'); }
    noise(g, 64, 64, r, 80, ['rgba(255,255,255,.18)', 'rgba(0,0,0,.08)']);
  },
  s5s_awnGreen(g) { for (let i = 0; i < 8; i++) R(g, i * 4, 0, 4, 32, i % 2 ? '#e4dfc8' : '#1f6b4a'); R(g, 0, 28, 32, 4, 'rgba(0,0,0,.2)'); },
  s5s_awnPlum(g) { for (let i = 0; i < 8; i++) R(g, i * 4, 0, 4, 32, i % 2 ? '#e4dfc8' : '#5a2f58'); },
  s5s_emblem(g, w, h) {
    R(g, 0, 0, w, h, '#0e4a36'); g.fillStyle = '#e8dcb8'; g.beginPath(); g.arc(64, 64, 60, 0, 6.28); g.fill(); g.fillStyle = '#0e4a36'; g.beginPath(); g.arc(64, 64, 55, 0, 6.28); g.fill();
    g.strokeStyle = '#e8dcb8'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 48, 0, 6.28); g.stroke();
    g.fillStyle = '#efe4c8'; g.beginPath(); g.moveTo(40, 52); g.lineTo(88, 52); g.lineTo(82, 82); g.quadraticCurveTo(64, 92, 46, 82); g.closePath(); g.fill();
    g.strokeStyle = '#efe4c8'; g.lineWidth = 5; g.beginPath(); g.arc(90, 62, 9, -1.5, 1.5); g.stroke();
    g.fillStyle = '#c99a5a'; g.fillRect(44, 55, 40, 4);
    g.fillStyle = '#efe4c8'; g.beginPath(); g.ellipse(64, 90, 30, 5, 0, 0, 6.28); g.fill();
    g.strokeStyle = '#7fe8c0'; g.lineWidth = 3; for (const x of [52, 64, 76]) { g.beginPath(); g.moveTo(x, 46); g.bezierCurveTo(x - 6, 40, x + 6, 34, x, 28); g.stroke(); }
    g.strokeStyle = '#38b8e8'; g.lineWidth = 3; g.beginPath(); g.moveTo(34, 100); g.bezierCurveTo(44, 92, 52, 108, 64, 100); g.bezierCurveTo(76, 92, 84, 108, 94, 100); g.stroke();
    g.font = 'bold 13px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#efe4c8'; g.fillText('ORIGINAL', 64, 22); g.fillText('COFFEE', 64, 116);
  },
  s5s_rust(g) {
    const r = mulberry(508); R(g, 0, 0, 64, 64, '#7c4a2c');
    for (let i = 0; i < 40; i++) R(g, (r() * 64) | 0, (r() * 64) | 0, 2 + ((r() * 6) | 0), 1, pick(r, ['#9a5a30', '#5e3520', '#b06a38', '#46301f']));
    for (let i = 0; i < 12; i++) R(g, (r() * 64) | 0, 0, 1 + ((r() * 2) | 0), 64, 'rgba(30,15,5,.35)');
    for (let y = 0; y < 64; y += 16) R(g, 0, y, 64, 1, 'rgba(0,0,0,.35)');
  },
  s5s_wetConcrete(g) {
    const r = mulberry(509); R(g, 0, 0, 64, 64, '#6a6e6b');
    noise(g, 64, 64, r, 400, ['rgba(0,0,0,.12)', 'rgba(255,255,255,.08)', 'rgba(60,90,50,.18)']);
    for (let i = 0; i < 12; i++) { const x = (r() * 64) | 0; R(g, x, 0, 1 + ((r() * 3) | 0), 64, 'rgba(20,30,25,.2)'); }
    for (let i = 0; i < 5; i++) R(g, (r() * 56) | 0, 40 + ((r() * 24) | 0), 4 + ((r() * 14) | 0), 3, 'rgba(70,110,60,.4)');
    R(g, 0, 31, 64, 1, 'rgba(0,0,0,.22)');
  },
  s5s_archwin(g, w, h) {
    g.clearRect(0, 0, w, h); g.fillStyle = '#b9a688'; archPath(g, 0, 0, 32, 48); g.fill();
    g.fillStyle = '#1b2530'; archPath(g, 4, 4, 24, 41); g.fill();
    g.fillStyle = '#34495c'; g.fillRect(6, 18, 20, 6);
    g.fillStyle = '#d8c9a8'; g.fillRect(15, 14, 2, 31); g.fillRect(5, 28, 22, 2); g.fillRect(0, 45, 32, 3);
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(6, 8, 3, 12);
  },
  s5s_archwinLit(g, w, h) {
    g.clearRect(0, 0, w, h); g.fillStyle = '#b9a688'; archPath(g, 0, 0, 32, 48); g.fill();
    g.fillStyle = '#e8b45a'; archPath(g, 4, 4, 24, 41); g.fill(); g.fillStyle = '#ffd890'; g.fillRect(6, 10, 20, 8);
    g.fillStyle = '#d8c9a8'; g.fillRect(15, 14, 2, 31); g.fillRect(5, 28, 22, 2); g.fillRect(0, 45, 32, 3);
  },
  s5s_oldad(g, w, h) {
    const r = mulberry(510); R(g, 0, 0, w, h, '#c9b790'); R(g, 3, 3, w - 6, h - 6, '#a8362a'); R(g, 6, 6, w - 12, h - 12, '#e2d5ae');
    g.textAlign = 'center'; g.fillStyle = '#a8362a'; g.font = 'bold 22px Arial, Helvetica, sans-serif'; g.fillText('HARBOR', w / 2, 28); g.fillText('HARDWARE', w / 2, 50);
    g.font = 'bold 10px Arial, Helvetica, sans-serif'; g.fillStyle = '#2a4a6a'; g.fillText('NAILS - ROPE - LANTERNS', w / 2, h - 12);
    g.fillStyle = '#2a4a6a'; g.beginPath(); g.arc(20, 32, 8, 0, 6.28); g.fill(); g.fillStyle = '#e2d5ae'; g.fillRect(19, 24, 2, 16); g.fillRect(14, 27, 12, 2);
    noise(g, w, h, r, 500, ['rgba(80,50,30,.35)', 'rgba(255,255,255,.22)'], 2);
    for (let i = 0; i < 10; i++) R(g, (r() * w) | 0, 0, 1 + ((r() * 2) | 0), h, 'rgba(40,40,40,.14)');
  },
  s5s_plywood(g) {
    const r = mulberry(511); R(g, 0, 0, 64, 64, '#9d8052');
    for (let i = 0; i < 30; i++) R(g, (r() * 64) | 0, (r() * 64) | 0, 8 + ((r() * 20) | 0), 1, pick(r, ['#85683f', '#b2955f', '#6f5530']));
    R(g, 0, 31, 64, 2, '#4a3a22'); R(g, 31, 0, 2, 64, '#4a3a22');
    for (const [x, y] of [[3, 3], [60, 3], [3, 60], [60, 60], [31, 4], [31, 59], [4, 31], [59, 31]]) R(g, x, y, 2, 2, '#2a2a2a');
    for (let i = 0; i < 7; i++) R(g, (r() * 64) | 0, 8 + ((r() * 40) | 0), 1, 10 + ((r() * 20) | 0), 'rgba(20,20,30,.3)');
    g.strokeStyle = '#e8e0d0'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, 10); g.lineTo(54, 20); g.stroke();
  },
  s5s_grime(g) {
    const r = mulberry(512); R(g, 0, 0, 64, 64, '#8c867a');
    noise(g, 64, 64, r, 300, ['rgba(0,0,0,.12)', 'rgba(255,255,255,.08)', 'rgba(60,70,55,.15)']);
    for (let i = 0; i < 14; i++) R(g, (r() * 64) | 0, (r() * 20) | 0, 1 + ((r() * 3) | 0), 20 + ((r() * 44) | 0), 'rgba(30,28,25,.18)');
    R(g, 0, 52, 64, 12, 'rgba(30,30,28,.35)'); R(g, 0, 0, 64, 2, 'rgba(0,0,0,.3)');
  },
  s5s_graffA: (g, w, h) => graffiti(g, w, h, 520), s5s_graffB: (g, w, h) => graffiti(g, w, h, 521, '#5e625f'),
  s5s_graffC: (g, w, h) => graffiti(g, w, h, 522, '#7a6a58'),
  s5s_contRust: (g, w, h) => container(g, w, h, '#8f4a2a', '#6a3419', 530),
  s5s_contBlue: (g, w, h) => container(g, w, h, '#3d5f86', '#2a4568', 531),
  s5s_contGreen: (g, w, h) => container(g, w, h, '#4f7258', '#385641', 532),
  s5s_contOrange: (g, w, h) => container(g, w, h, '#b8742c', '#8a5218', 533),
  s5s_contEnd(g, w, h) {
    R(g, 0, 0, w, h, '#6a4a34'); R(g, 3, 3, w - 6, h - 6, '#7b5238'); R(g, w / 2 - 1, 3, 2, h - 6, '#2a1c12');
    for (const x of [14, 22, 42, 50]) R(g, x, 6, 2, h - 12, '#b0aaa0');
    for (const y of [10, h - 14]) { R(g, 8, y, 14, 3, '#b0aaa0'); R(g, 42, y, 14, 3, '#b0aaa0'); }
    R(g, 0, h - 4, w, 4, '#3a2a1e'); R(g, 0, 0, w, 3, '#3a2a1e'); noise(g, w, h, mulberry(534), 90, ['rgba(120,50,15,.45)', 'rgba(0,0,0,.25)'], 2);
  },
  s5s_corrug(g) {
    const r = mulberry(535); R(g, 0, 0, 64, 64, '#8d8f86');
    for (let x = 0; x < 64; x += 4) { R(g, x, 0, 1, 64, 'rgba(0,0,0,.28)'); R(g, x + 2, 0, 1, 64, 'rgba(255,255,255,.14)'); }
    for (let i = 0; i < 10; i++) R(g, (r() * 64) | 0, (r() * 50) | 0, 2 + ((r() * 3) | 0), 8 + ((r() * 24) | 0), 'rgba(140,70,25,.5)');
    noise(g, 64, 64, r, 100, ['rgba(0,0,0,.2)'], 2);
  },
  s5s_dumpG(g) {
    const r = mulberry(536); R(g, 0, 0, 64, 64, '#2f5a3e');
    for (let x = 0; x < 64; x += 16) R(g, x, 0, 2, 64, '#244a31'); R(g, 0, 0, 64, 4, '#244a31'); R(g, 0, 60, 64, 4, '#244a31');
    for (let i = 0; i < 10; i++) R(g, (r() * 64) | 0, (r() * 60) | 0, 2, 6 + ((r() * 18) | 0), 'rgba(130,70,25,.55)');
    noise(g, 64, 64, r, 140, ['rgba(0,0,0,.25)', 'rgba(200,200,190,.15)'], 2);
    g.fillStyle = '#e8e4d0'; g.fillRect(8, 24, 22, 3); g.fillRect(8, 30, 14, 3);
  },
  s5s_chain(g) {
    g.clearRect(0, 0, 32, 32); g.strokeStyle = '#9aa0a2'; g.lineWidth = 1.5;
    for (let k = -1; k <= 4; k++) { g.beginPath(); g.moveTo(k * 8, 0); g.lineTo(k * 8 + 32, 32); g.moveTo(k * 8, 32); g.lineTo(k * 8 + 32, 0); g.stroke(); }
  },
}, {
  s5s_oldad: [128, 64], s5s_emblem: [128, 128], s5s_archwin: [32, 48], s5s_archwinLit: [32, 48],
  s5s_graffA: [256, 64], s5s_graffB: [256, 64], s5s_graffC: [256, 64], s5s_contRust: [64, 32], s5s_contBlue: [64, 32], s5s_contGreen: [64, 32], s5s_contOrange: [64, 32], s5s_contEnd: [64, 64],
  s5s_awnGreen: [32, 32], s5s_awnPlum: [32, 32], s5s_chain: [32, 32],
});

// =====================================================================
// 1. Space Needle
// =====================================================================
export function spaceNeedle() {
  const g = G(), white = C(0xe0e2e4), steel = C(0xa4abb2), dark = C(0x20252c);
  Cy(g, 7.8, 8, 0.4, 20, mat('pavingDark'), 0, 0.2, 0, 3);
  const prof = [[0.4, 7], [14, 4.8], [30, 2.8], [45, 1.6], [57, 2.2], [67, 3.5]];
  const A = [0, 1, 2].map((i) => Math.PI / 2 + i * Math.PI * 2 / 3);
  const P = (a, k) => [Math.cos(a) * prof[k][1], prof[k][0], Math.sin(a) * prof[k][1]];
  const legs = [], cross = [];
  A.forEach((a, i) => {
    for (let k = 0; k < prof.length - 1; k++) legs.push([P(a, k), P(a, k + 1)]);
    const b = A[(i + 1) % 3];
    for (let k = 0; k < prof.length; k++) cross.push([P(a, k), P(b, k)]);
    for (let k = 0; k < prof.length - 1; k++) cross.push([P(a, k), P(b, k + 1)]);
  });
  rods(g, legs, 0.8, white, 6); rods(g, cross, 0.2, steel, 4);
  Cy(g, 0.9, 1.4, 70, 10, white, 0, 35, 0);
  Bx(g, 1.4, 3, 1.4, steel, 0, 20, 1.6, 1);
  // saucer
  Cy(g, 10, 3.2, 4, 18, white, 0, 71, 0, 3);
  Cy(g, 10, 10, 2.8, 20, color(0x586068, { emissive: 0x6a4e22 }), 0, 74.4, 0, 3);
  const mull = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; mull.push([[Math.cos(a) * 10.1, 73, Math.sin(a) * 10.1], [Math.cos(a) * 10.1, 75.8, Math.sin(a) * 10.1]]); }
  rods(g, mull, 0.12, dark, 4);
  Ms(g, new THREE.TorusGeometry(10.5, 0.22, 5, 30), glow(NEO), 0, 72.9, 0, 1, 1, 1, Math.PI / 2);     // neo-green halo
  Cy(g, 4.2, 10.4, 2.2, 18, white, 0, 77.1, 0, 3);
  Cy(g, 6.2, 6.2, 1.8, 16, color(0x4a5560, { emissive: 0x4a3a1a }), 0, 79.1, 0, 3);
  Cy(g, 1.2, 6.8, 1.4, 16, white, 0, 80.7, 0, 3);
  Cy(g, 0.35, 0.8, 14, 6, steel, 0, 88.4, 0, 1);
  Ms(g, SPH(0.5, 8, 6), glow(0xff3030), 0, 95.3, 0);
  // ground lobby and planters
  Bx(g, 5, 3.2, 3.6, C(0x3a4048), -4.5, 1.6, -2.5, 2); Bx(g, 5.4, 0.3, 4, white, -4.5, 3.3, -2.5, 2);
  door(g, 1.6, 2.4, -4.5, 1.25, -0.68, 0, '#2a2e34'); win(g, 1.4, 2.0, -6.2, 1.8, -0.68, 0, { fixed: true }); win(g, 1.4, 2.0, -2.8, 1.8, -0.68, 0, { fixed: true });
  for (const [x, z] of [[5, 5], [-6, 4], [6.5, -3]]) Bx(g, 1.8, 0.6, 1.8, mat('concrete'), x, 0.6, z, 1);
  sgn(g, 'SPACE NEEDLE', 5, 0.7, 0, 3.1, 7.2, 0, { bg: '#10151a', fg: '#00E599' });
  const c = (a) => [Math.cos(a) * 7, Math.sin(a) * 7];
  const cols = [[-1.6, 1.6, -1.6, 1.6, 95], [-7, -2, -4.3, -0.7, 4]];
  A.forEach((a) => { const [x, z] = c(a); cols.push([x - 0.9, x + 0.9, z - 0.9, z + 0.9, 12]); });
  return size(g, 21, 21, 96, cols);
}

// =====================================================================
// 2. Smith Tower
// =====================================================================
export function smithTower() {
  const g = G(), T = mat('s5s_terra'), roof = mat('concrete'), cream = C(0xe4d6b4), corn = mat('stuccoWhite');
  const tiers = [[18, 30, 0], [14.5, 21, 31.2], [10.5, 9, 53]];
  for (const [w, h, y] of tiers) {
    Bx(g, w, h, w, T, 0, y + h / 2, 0, 8).material = [T, T, roof, roof, T, T];
    Bx(g, w + 1.6, 1.2, w + 1.6, corn, 0, y + h + 0.6, 0, 2);
    Bx(g, w + 0.6, 0.5, w + 0.6, cream, 0, y + h - 0.2, 0, 2);
  }
  Bx(g, 18.4, 4.2, 18.4, mat('granite'), 0, 2.1, 0, 2);
  Bx(g, 5, 0.4, 2.4, cream, 0, 5.2, 9.8, 2);
  const arch = decal('arch', 4, 5.2, 0, 2.6, 9.23, {}); g.add(arch); door(g, 2.4, 3.6, 0, 1.9, 9.25, 0, '#3a2a1a');
  for (const sx of [-1, 1]) Bx(g, 0.5, 5, 0.5, cream, sx * 2.5, 2.5, 9.6, 1);
  sgn(g, 'SMITH TOWER', 7, 0.9, 0, 4.7, 9.28, 0, { bg: '#2a1c14', fg: '#e6c870' });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { Bx(g, 1.2, 25, 1.2, corn, sx * 9.1, 17.5, sz * 9.1, 2); Bx(g, 1.0, 17, 1.0, corn, sx * 7.3, 40, sz * 7.3, 2); }
  Bx(g, 6.4, 3.4, 6.4, C(0xd2c4a2), 0, 64.5, 0, 2);
  Bx(g, 6.6, 0.4, 6.6, glow(NEO), 0, 66, 0, 2);            // neo-green band
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Bx(g, 0.6, 3.4, 0.6, cream, sx * 3.1, 64.5, sz * 3.1, 1);
  for (const [ry, x, z] of [[0, 0, 3.26], [Math.PI, 0, -3.26], [Math.PI / 2, 3.26, 0], [-Math.PI / 2, -3.26, 0]]) win(g, 2.4, 2.2, x, 64.5, z, ry, { lit: true, fixed: true });
  const cap = Ms(g, new THREE.ConeGeometry(5.1, 5, 4), mat('shingleGreen', { double: true }), 0, 69.3, 0); cap.rotation.y = Math.PI / 4;
  Cy(g, 0.06, 0.1, 3, 5, C(0x333333), 0, 72.5, 0, 1);
  door(g, 1.8, 3, -4, 1.7, -9.25, Math.PI, '#2a2a2a'); Bx(g, 2.2, 1.8, 0.8, C(0x4a4e52), 5.5, 1, -9.7, 1);
  Bx(g, 0.3, 28, 0.3, C(0x5a5e60), 8.8, 15, -9.3, 1);
  return size(g, 20, 20, 72);
}

// =====================================================================
// 3. Columbia Center
// =====================================================================
export function columbiaCenter() {
  const g = G(), GB = mat('s5s_glassBlack'), dk = C(0x0b0e12), conc = mat('concrete');
  const sec = (w, y0, y1) => { const b = Bx(g, w, y1 - y0, w, GB, 0, (y0 + y1) / 2, 0, 12); b.material = [GB, GB, dk, dk, GB, GB]; };
  sec(26, 6, 76); sec(23, 76, 88); sec(19.5, 88, 96); sec(14, 96, 101); sec(7, 101, 103.5);
  Bx(g, 26.4, 6, 26.4, C(0x1b2229), 0, 3, 0, 3);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { Bx(g, 1.4, 70, 1.4, dk, sx * 13, 41, sz * 13, 2); Bx(g, 1.1, 12, 1.1, dk, sx * 11.2, 82, sz * 11.2, 2); Bx(g, 0.9, 8, 0.9, dk, sx * 9.4, 92, sz * 9.4, 2); }
  for (const [w, y] of [[23.2, 76.4], [19.7, 88.4], [14.2, 96.4]]) Bx(g, w, 0.4, w, C(0x20262c), 0, y, 0, 2);
  Bx(g, 14.3, 0.35, 14.3, glow(NEO), 0, 100.4, 0, 2);       // neo-green crown line
  Bx(g, 7.3, 0.3, 7.3, glow(NEO), 0, 102.6, 0, 2);
  Cy(g, 0.1, 0.35, 6, 6, C(0x777b80), 0, 106, 0, 1);
  Ms(g, SPH(0.3, 6, 4), glow(0xff3030), 0, 109, 0);
  Bx(g, 12, 0.5, 3, C(0x3a4048), 0, 5, 14.5, 2);
  for (const x of [-4.5, -1.5, 1.5, 4.5]) win(g, 2.6, 4.2, x, 2.7, 13.26, 0, { lit: true, fixed: true, c: '#1c2228' });
  door(g, 3, 3.8, 0, 2.0, 13.28, 0, '#20262c'); for (const x of [-8.2, 8.2]) win(g, 2.6, 4.2, x, 2.7, 13.26, 0, { lit: false, fixed: true, c: '#1c2228' });
  for (const x of [-5, 5]) Cy(g, 0.3, 0.3, 5, 8, C(0x3a4048), x, 2.5, 14.8, 1);
  sgn(g, 'COLUMBIA CENTER', 9, 0.8, 0, 6.6, 13.3, 0, { bg: '#0a0c10', fg: '#c8d0d8' });
  Bx(g, 8, 4, 2, conc, 0, 2, -14.3, 2); door(g, 4, 3.2, 0, 1.7, -15.32, Math.PI, '#303438'); door(g, 1.6, 2.6, -8.5, 1.4, -13.26, Math.PI, '#303438');
  for (let i = 0; i < 4; i++) Bx(g, 2.2, 1.6, 0.4, C(0x30363c), 3 + i * 2.5, 3.4, -13.4, 1);
  Bx(g, 0.5, 6, 0.5, C(0x30363c), 10, 3, -13.4, 1);
  return size(g, 28, 30, 110);
}

// =====================================================================
// 4. Amazon Spheres
// =====================================================================
export function amazonSpheres() {
  const g = G(), rnd = mulberry(77);
  const greens = [C(0x2f7a3a), C(0x3f9a45), C(0x1f5a2f), C(0x58b050), C(0x2a6a4a)];
  const brown = C(0x5a3d26), frame = C(0x2c3a36), cols = [];
  const defs = [[-9, -2.5, 13], [9.5, -3, 11], [1, 5.5, 9.5]];
  const ground = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];   // nothing of the domes may show below the ground (the ground layers don't write depth)
  const clipM = (m) => { const c = m.clone(); c.clippingPlanes = ground; return c; };
  const frameC = clipM(frame);
  for (const [cx, cz, r] of defs) {
    const cy = r * 0.62;
    const ico = new THREE.IcosahedronGeometry(r, 1);
    { const gm = Ms(g, new THREE.IcosahedronGeometry(r * 0.995, 2), clipM(glassM(0x9fd8c8, 0.3)), cx, cy, cz); gm.material.flatShading = true; }
    const edges = new THREE.EdgesGeometry(ico).attributes.position.array, list = [];
    for (let i = 0; i < edges.length; i += 6) list.push([[cx + edges[i], cy + edges[i + 1], cz + edges[i + 2]], [cx + edges[i + 3], cy + edges[i + 4], cz + edges[i + 5]]]);
    rods(g, list, 0.16, frameC, 4);
    const lnM = new THREE.LineBasicMaterial({ color: 0x1d2a26 }); lnM.clippingPlanes = ground;
    const ln = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r * 1.002, 2), 1), lnM); ln.position.set(cx, cy, cz); g.add(ln);
    const n = Math.round(r * 2.4);
    for (let i = 0; i < n; i++) {
      let x, y, z, t = 0;
      do { x = (rnd() * 2 - 1) * r * 0.8; y = rnd() * r * 1.5; z = (rnd() * 2 - 1) * r * 0.8; t++; } while (t < 20 && Math.hypot(x, y - r * 0.2, z) > r * 0.8);
      const wy = Math.max(1, y), br = 0.9 + rnd() * 1.5;
      Ms(g, new THREE.IcosahedronGeometry(1, 0), greens[(rnd() * greens.length) | 0], cx + x, wy, cz + z, br, br * (0.7 + rnd() * 0.5), br, rnd(), rnd() * 3, 0);
      if (rnd() < 0.5) Cy(g, 0.12, 0.18, wy, 5, brown, cx + x, wy / 2, cz + z, 1);
      if (i % 6 === 0) Ms(g, SPH(0.18, 5, 4), glow(i % 12 === 0 ? NEO : 0xffe3a0), cx + x * 0.9, wy + 0.8, cz + z + 0.8);
    }
    Cy(g, 0.35, 0.6, r * 0.9, 6, brown, cx, r * 0.45, cz, 1);
    Ms(g, new THREE.IcosahedronGeometry(1, 1), greens[1], cx, r * 0.98, cz, r * 0.38, r * 0.3, r * 0.38);
    Cy(g, r * 0.82, r * 0.86, 0.5, 20, mat('pavingDark'), cx, 0.25, cz, 3);
    const gr = Math.sqrt(1 - 0.62 * 0.62) * r * 0.72;
    cols.push([cx - gr, cx + gr, cz - gr, cz + gr, cy + r * 0.7]);
  }
  Bx(g, 7, 3.6, 3.4, C(0x39443f), 1, 1.8, 13.6, 2); Bx(g, 7.6, 0.3, 4, mat('concrete'), 1, 3.75, 13.6, 2);
  door(g, 2.4, 2.6, 0, 1.4, 15.34, 0, '#1e2824'); win(g, 1.5, 2.2, 3.4, 1.8, 15.34, 0, { lit: true, fixed: true }); win(g, 1.5, 2.2, -1.4, 1.8, 15.34, 0, { lit: true, fixed: true });
  sgn(g, 'THE SPHERES', 6, 0.7, 1, 4.4, 15.4, 0, { bg: '#10201a', fg: '#00E599' });
  cols.push([-2.5, 4.5, 11.9, 15.3, 3.8]);
  Bx(g, 6, 4, 2.6, mat('concrete'), -8, 2, -14, 2); door(g, 1.8, 2.8, -8, 1.5, -15.34, Math.PI, '#303438');
  for (let i = 0; i < 3; i++) Bx(g, 1.4, 1.2, 0.4, C(0x30363c), -10 + i * 1.8, 2.8, -15.34, 1);
  Cy(g, 0.25, 0.25, 4.5, 6, C(0x666a6e), -5.4, 2.3, -14.2, 1);
  cols.push([-11, -5, -15.3, -12.7, 4]);
  return size(g, 38, 31, 24, cols);
}

// =====================================================================
// 5. MoPOP (Gehry blobs) + monorail pylon
// =====================================================================
export function moPOP() {
  const g = G(), cols = [];
  const blob = (hex, x, y, z, sx, sy, sz, rx, ry, rz, solid = true, sh = 80) => {
    const geo = SPH(1, 18, 12), u = geo.attributes.uv, pp = geo.attributes.position, ph = x * 1.7 + z; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * 4, u.getY(i) * 3);
    for (let i = 0; i < pp.count; i++) { const px = pp.getX(i), py = pp.getY(i), pz = pp.getZ(i), k = 1 + 0.13 * Math.sin(px * 3 + ph) * Math.cos(py * 2.4 + pz * 2.2 + ph) + 0.07 * Math.sin(pz * 4.5 - ph); pp.setXYZ(i, px * k, py * k, pz * k); }
    geo.computeVertexNormals();
    Ms(g, geo, metalM(hex, sh), x, y, z, sx, sy, sz, rx, ry, rz);
    if (solid) cols.push([x - sx * 0.62, x + sx * 0.62, z - sz * 0.62, z + sz * 0.62, y + sy * 0.55]);
  };
  const PUR = 0x8a4cc4, RED = 0xd03a34, GOLD = 0xe0b030, SIL = 0xc4ccd6, BLU = 0x3a7ac8, TEAL = 0x2ab8ac, PINK = 0xe86aa8;
  blob(PUR, -11, 6.2, 3, 11, 8, 9, 0.1, 0.5, 0.25);
  blob(RED, 9, 5.8, 6, 9.5, 7.5, 8, -0.15, 0.2, -0.3);
  blob(GOLD, -3, 5, -8, 11, 6.5, 7.5, 0.2, -0.4, 0.15);
  blob(SIL, 16, 5.5, -6, 7.5, 8, 8.5, 0, 0.9, 0.25, true, 120);
  blob(BLU, -18, 4.6, -8, 8, 6, 6.5, 0.2, 0.3, -0.4);
  blob(PINK, -20, 3.2, 6, 5, 3.6, 5, 0, 0.3, 0.3);
  blob(TEAL, 1, 3.8, 9, 5.5, 3.8, 5, 0, 0.4, 0.2, false);
  blob(GOLD, 22, 3.2, 5, 4, 3.2, 4.4, 0, 0.2, 0.3);
  blob(PINK, -2, 2.8, -1, 6, 3.4, 5, 0.3, 0.2, 0, false);
  // swooping arches and tubes joining the blobs
  Ms(g, new THREE.TorusGeometry(6.2, 1.0, 7, 18, Math.PI), metalM(GOLD, 100), 0, 0.3, 10, 1, 1.1, 1.2, 0, 0, 0);
  for (const [hex, x, y, z, rz, ry, l] of [[GOLD, -7, 11.5, 8, 0.8, 0.5, 5], [SIL, 11, 11.8, -1, -0.5, 1.2, 4], [PUR, 4, 11.5, -6, 0.9, 0.2, 5], [RED, -15, 9.5, -2, -0.6, 0.4, 5]]) Ms(g, new THREE.CapsuleGeometry(1.1, l, 4, 9), metalM(hex), x, y, z, 1, 1, 1, 0.3, ry, rz);
  for (const [x, y, z, ry, w, h] of [[-12, 7.5, 12.1, 0.3, 4.5, 0.8], [-9, 4, 12.2, 0.2, 3.5, 0.7], [9, 6, 13.9, -0.1, 4, 0.9], [14, 7, -2.2, 1.3, 3.5, 0.8], [-3, 5.8, -14, 0.1, 5, 0.8], [-16, 5, -13, 0.3, 4, 0.7]]) Ms(g, new THREE.BoxGeometry(w, h, 0.4), color(0x0e1822, { emissive: 0x0a2630 }), x, y, z, 1, 1, 1, 0, ry, 0.15);
  Bx(g, 8, 3.4, 3, C(0x2a3036), 0, 1.7, 15.2, 2); Bx(g, 9, 0.35, 4, C(0xc8ccd0), 0, 3.5, 15.2, 2);
  door(g, 2.4, 2.6, 0, 1.4, 16.72, 0, '#14181c'); win(g, 1.6, 2.2, 2.8, 1.8, 16.72, 0, { lit: true, fixed: true }); win(g, 1.6, 2.2, -2.8, 1.8, 16.72, 0, { lit: true, fixed: true });
  sgn(g, 'MoPOP', 6, 1.2, 0, 4.6, 16.8, 0, { bg: '#0c0c10', fg: '#00E599' });
  cols.push([-4.5, 4.5, 13.7, 16.8, 3.6]);
  Bx(g, 5, 3.4, 2.2, mat('concrete'), 3, 1.7, -16.4, 2); door(g, 2, 2.6, 3, 1.4, -17.52, Math.PI, '#2a2e32');
  Bx(g, 2, 1.4, 1, C(0x4a4e52), -3, 0.8, -16.8, 1); Cy(g, 0.3, 0.3, 4, 6, C(0x666a6e), 6.2, 2, -16.2, 1);
  cols.push([0.5, 5.5, -17.6, -15.3, 3.4]);
  // monorail beam passing through above the blobs
  const bz = 1.5;
  Bx(g, 52, 1.1, 1.3, mat('concrete'), 0, 14.4, bz, 4); Bx(g, 52, 0.25, 0.5, C(0x1c1c20), 0, 15.1, bz, 4);
  for (const x of [-24, 24]) { Bx(g, 1.3, 14, 1.3, mat('concrete'), x, 7, bz, 4); Bx(g, 3, 0.7, 1.9, mat('concrete'), x, 13.8, bz, 4); cols.push([x - 0.65, x + 0.65, bz - 0.65, bz + 0.65, 14]); }
  return size(g, 56, 38, 24, cols);
}

// =====================================================================
// 6. Central Library (stacked diamond-lattice slabs)
// =====================================================================
export function centralLibrary() {
  const g = G(), steel = C(0x3a3f44), cols = [];
  const slabs = [
    [-20, 14, -16, 12, 0, 7, 0x9ab4b0], [-8, 20, -18, 14, 7, 15, 0xc8d4cc], [-20, 6, -14, 18, 15, 23, 0xb4c8d8],
    [-2, 20, -16, 10, 23, 31, 0xd0d8c0], [-17, 8, -12, 16, 31, 38, 0xa8bcc8],
  ];
  slabs.forEach(([x0, x1, z0, z1, y0, y1, tc]) => {
    const w = x1 - x0, d = z1 - z0, h = y1 - y0, side = tint('s5s_diamond', tc);
    const b = Bx(g, w, h, d, side, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 6); b.material = [side, side, steel, steel, side, side];
    Bx(g, w + 0.3, 0.5, d + 0.3, steel, (x0 + x1) / 2, y1 + 0.05, (z0 + z1) / 2, 2);
    Bx(g, w + 0.3, 0.4, d + 0.3, steel, (x0 + x1) / 2, y0 + 0.2, (z0 + z1) / 2, 2);
  });
  cols.push([-20, 14, -16, 12, 38]);
  rods(g, [
    [[18, 7, 12], [12, 0.5, 11]], [[18, 7, -16], [13, 0.5, -15]], [[-19, 15, 17], [-19, 7, 11]], [[4, 15, 17], [4, 7, 11]],
    [[19, 23, 9], [14, 15, 9]], [[-19, 23, 17], [-19, 15, 14]], [[6, 31, 15], [4, 23, 12]], [[17, 15, 13], [14, 7, 12]],
  ], 0.35, steel, 5);
  Bx(g, 14, 4.4, 0.3, C(0x1c2630), -3, 2.5, 12.02, 2);
  for (const x of [-8, -3, 2]) win(g, 4, 3.4, x, 2.5, 12.2, 0, { lit: true, fixed: true, c: '#2a3036' });
  door(g, 2.8, 3.4, -5.5, 1.8, 12.22, 0, '#20262c');
  Bx(g, 8, 0.25, 2.2, C(0xd8dcd8), 2.0, 4.8, 13.1, 2);
  Bx(g, 22, 0.3, 0.3, glow(NEO), 9, 22.8, 9.3, 2);            // neo-green edge light
  sgn(g, 'CENTRAL LIBRARY', 10, 1, -6, 6.1, 12.4, 0, { bg: '#10161a', fg: '#e8e4d0' });
  Bx(g, 4, 2.4, 2.4, C(0xd8b838), 2, 10.4, 14.2, 2);
  Bx(g, 3, 1.4, 3, C(0x777b80), -8, 39.2, 0, 2); Bx(g, 2, 2.2, 2, C(0x666a6e), -12, 39.6, 6, 2); Cy(g, 0.15, 0.15, 6, 5, C(0x666a6e), -4, 41, 2, 1);
  Bx(g, 5, 4, 2.2, mat('concrete'), -14, 2, -17.1, 2); door(g, 2.2, 3, -14, 1.6, -18.22, Math.PI, '#2a2e32');
  Bx(g, 2.4, 1.6, 0.6, steel, -8, 1.2, -16.3, 1);
  cols.push([-16.4, -11.6, -18.2, -16, 4]);
  return size(g, 40, 36, 44, cols);
}

// =====================================================================
// 7. Pike Place Market (enterable hall)
//    doors: S (front) at x=0 w9, N (back) at x=0 w9, E (side) at z=0 w7
// =====================================================================
const bulbGeo = () => new THREE.OctahedronGeometry(0.15, 0);
function marketStall(g, cols, x, z, kind, awn, label) {
  const w = 3.6, d = 2.6, wood = mat('planks'), dk = C(0x4a331f);
  Bx(g, w, 0.9, d, wood, x, 0.45, z, 2);
  Bx(g, w + 0.1, 0.08, d + 0.1, kind === 'flowers' ? C(0x3a4a50) : C(0xd8d0b8), x, 0.94, z, 2);
  const cr = [0xc83030, 0xe08a20, 0x58a838, 0xd8c030, 0x7a2a5a, 0xc86a3a], xi = Math.abs(x | 0);
  if (kind === 'produce') {
    for (let i = 0; i < 6; i++) { const cx = x - 1.2 + (i % 3) * 1.2, cz = z + (i < 3 ? -0.65 : 0.65); Bx(g, 1.0, 0.3, 0.8, dk, cx, 1.12, cz, 1); Bx(g, 0.9, 0.18, 0.7, C(cr[(i + xi) % cr.length]), cx, 1.32, cz, 1); Sg(g, C(cr[(i + 2 + xi) % cr.length]), cx, 1.46, cz, 0.28, 0.2, 0.28, 0, 0, 0, 7); }
  } else if (kind === 'flowers') {
    const fl = [0xe83a8a, 0xf0c020, 0xb040e0, 0xf06a30, 0xf4f0e8, 0xd02a40];
    for (let i = 0; i < 8; i++) { const cx = x - 1.35 + (i % 4) * 0.9, cz = z + (i < 4 ? -0.65 : 0.65); Cy(g, 0.28, 0.22, 0.6, 7, C(0x2a4a7a), cx, 1.26, cz, 1); Sg(g, C(fl[(i + xi) % fl.length]), cx, 1.8, cz, 0.42, 0.34, 0.42, 0, 0, 0, 7); Sg(g, C(fl[(i + 3 + xi) % fl.length]), cx + 0.15, 1.95, cz + 0.1, 0.25, 0.22, 0.25, 0, 0, 0, 6); }
  } else {   // bakery / honey
    for (let i = 0; i < 7; i++) { const cx = x - 1.3 + (i % 4) * 0.85, cz = z + (i < 4 ? -0.6 : 0.6); Ms(g, new THREE.CapsuleGeometry(0.2, 0.55, 3, 6), C(i % 2 ? 0xb87a38 : 0xd09a50), cx, 1.2, cz, 1, 1, 1, 0, 0.3 * i, Math.PI / 2); }
    for (let i = 0; i < 4; i++) Cy(g, 0.17, 0.15, 0.3, 7, C([0xd8a020, 0xe8c040, 0xc88a18, 0xf0d060][i]), x - 1.2 + i * 0.8, 1.2, z + (i % 2 ? 0.1 : -0.1), 1);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Cy(g, 0.05, 0.05, 2.2, 5, dk, x + sx * 1.7, 2.05, z + sz * 1.25, 1);
  Bx(g, w + 0.4, 0.1, d + 0.3, awn, x, 3.15, z, 4);
  Bx(g, w + 0.4, 0.5, 0.06, awn, x, 2.95, z + 1.4, 4); Bx(g, w + 0.4, 0.5, 0.06, awn, x, 2.95, z - 1.4, 4);
  for (const s of [-1, 1]) { const sp = sign(label, 1.9, 0.42, { bg: '#241a10', fg: '#f0dca0' }); sp.position.set(x, 2.35, z + s * 1.45); sp.rotation.y = s > 0 ? 0 : Math.PI; g.add(sp); }
  cols.push([x - w / 2, x + w / 2, z - d / 2, z + d / 2, 1.1]);
}
function wallUnit(g, cols, x, z, len, seed) {   // shelf of crates against a side wall
  const r = mulberry(seed), cr = [0xc83030, 0xe08a20, 0x58a838, 0xd8c030, 0x7a2a5a];
  const bx = 0.7, bz = len;
  Bx(g, bx, 1.0, bz, mat('planks'), x, 0.5, z, 2);
  for (let i = 0; i < 4; i++) { const pz = z - len / 2 + 0.5 + i * (len - 1) / 3; Bx(g, 0.6, 0.35, 0.6, C(cr[(r() * cr.length) | 0]), x, 1.17, pz, 1); Bx(g, 0.5, 0.5, 0.5, C(0x6a4a2a), x, 1.6, pz, 1); }
  cols.push([x - bx / 2, x + bx / 2, z - bz / 2, z + bz / 2, 1.2]);
}
export function pikePlaceMarket() {
  const W = 46, D = 30, H = 13, CH = 9.5, T = 1.2, cols = [];
  const g = G();
  const base = hall({ w: W, d: D, h: H, ch: CH, t: T, outer: 's5s_brickDark', inner: 's5s_woodwall', floor: 's5s_marketFloor', ceil: 's5s_beams', roof: 'roofTar', tile: 4,
    doors: [{ side: 'S', at: 0, w: 9, h: 5.2 }, { side: 'N', at: 0, w: 9, h: 5.2 }, { side: 'E', at: 0, w: 7, h: 5 }] });
  g.add(base); cols.push(...base.userData.cols);
  const ix = base.userData.inside, wood = mat('planks'), stone = mat('granite'), dkm = C(0x2a2a2c);
  // ---------------- exterior ----------------
  Bx(g, W + 0.8, 0.6, D + 0.8, stone, 0, H + 0.05, 0, 3);
  Bx(g, W + 1.2, 0.5, 0.5, dkm, 0, H + 0.6, D / 2 + 0.2, 2); Bx(g, W + 1.2, 0.5, 0.5, dkm, 0, H + 0.6, -D / 2 - 0.2, 2);
  Bx(g, 0.5, 0.5, D + 0.4, dkm, W / 2 + 0.2, H + 0.6, 0, 2); Bx(g, 0.5, 0.5, D + 0.4, dkm, -W / 2 - 0.2, H + 0.6, 0, 2);
  const frame = (x, z, ry, dw, dh) => { const f = new THREE.Group(); Bx(f, 0.55, dh, 0.55, wood, -dw / 2 - 0.3, dh / 2, 0, 1); Bx(f, 0.55, dh, 0.55, wood, dw / 2 + 0.3, dh / 2, 0, 1); Bx(f, dw + 1.4, 0.6, 0.6, wood, 0, dh + 0.3, 0, 1); f.position.set(x, 0, z); f.rotation.y = ry; g.add(f); };
  frame(0, D / 2 + 0.1, 0, 9, 5.2); frame(0, -D / 2 - 0.1, Math.PI, 9, 5.2); frame(W / 2 + 0.1, 0, Math.PI / 2, 7, 5);
  const aw = [mat('awningRed'), mat('s5s_awnGreen'), mat('awningBlue'), mat('s5s_awnPlum')];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) { win(g, 2.1, 3.0, s * (7.6 + i * 3.8), 3.3, D / 2 + 0.07, 0, { lit: (i + (s > 0 ? 1 : 0)) % 2 === 0, c: '#e8e0c8' }); win(g, 1.5, 2.4, s * (7.6 + i * 3.8), 9.3, D / 2 + 0.07, 0, { fixed: true, lit: i % 2 === 1, c: '#d8d0b8' }); }
    for (const k of [0, 1]) { const a = Bx(g, 7.2, 0.14, 2.2, aw[(k * 2 + (s > 0 ? 1 : 0)) % 4], s * (9.5 + k * 7.6), 5.0, D / 2 + 1.0, 4); a.rotation.x = 0.28; }
  }
  Bx(g, 13.8, 3.1, 0.7, C(0x2a1010), 0, 14.65, D / 2 - 0.9, 2);
  const sg1 = sign('PUBLIC MARKET CENTER', 13, 2.4, { bg: '#1a0707', fg: '#ff3a30', border: '#ff3a30' }); sg1.position.set(0, 14.65, D / 2 - 0.52); g.add(sg1);
  const sg2 = sign('PUBLIC MARKET CENTER', 13, 2.4, { bg: '#1a0707', fg: '#ff3a30', border: '#ff3a30' }); sg2.position.set(0, 14.65, D / 2 - 1.28); sg2.rotation.y = Math.PI; g.add(sg2);
  for (const sx of [-1, 1]) Bx(g, 0.4, 2.2, 0.4, dkm, sx * 6.6, 13.5, D / 2 - 0.9, 1);
  const clk = mat('clock'), clock = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.4, 20), [dkm, clk, clk]); clock.position.set(0, 10.9, D / 2 + 0.95); clock.rotation.x = Math.PI / 2; g.add(clock);
  Bx(g, 0.3, 0.3, 1.0, dkm, 0, 10.9, D / 2 + 0.5, 1); Bx(g, 0.3, 2.0, 0.3, dkm, 0, 9.8, D / 2 + 0.95, 1);
  sgn(g, 'MEET THE PRODUCER', 6, 0.7, 0, 7.6, D / 2 + 0.06, 0, { bg: '#241a10', fg: '#f0dca0' });
  sgn(g, 'EST. 1907', 3, 0.55, 0, 7.0, D / 2 + 0.06, 0, { bg: '#241a10', fg: '#c8b078' });
  sgn(g, 'FRESH', 2.6, 0.8, 11.5, 7.6, D / 2 + 0.07, 0, { bg: '#08140f', fg: '#00E599', border: '#00E599' });
  const fl = [0xe83a8a, 0xf0c020, 0xb040e0, 0xf06a30, 0xe8e8f0];
  const basket = (x, y, z, ry, k) => { const b = G(); Bx(b, 0.12, 0.12, 0.9, dkm, 0, 0.5, 0.4, 1); Cy(b, 0.36, 0.26, 0.4, 8, C(0x2a3a2a), 0, 0.1, 0.9, 1); for (let i = 0; i < 4; i++) Sg(b, C(fl[(k + i) % 5]), Math.cos(i * 1.6) * 0.22, 0.38 + (i % 2) * 0.08, 0.9 + Math.sin(i * 1.6) * 0.22, 0.24, 0.2, 0.24, 0, 0, 0, 6); Sg(b, C(0x2f7a3a), 0, 0.28, 0.9, 0.34, 0.14, 0.34, 0, 0, 0, 6); b.position.set(x, y, z); b.rotation.y = ry; g.add(b); };
  [-17, -13, -9.5, -6.3, 6.3, 9.5, 13, 17].forEach((x, i) => basket(x, 4.1, D / 2, 0, i));
  [-9, -5.5, 5.5, 9].forEach((z, i) => basket(W / 2, 4.1, z, Math.PI / 2, i + 2));
  { const a = Bx(g, 2.2, 0.14, 8.6, aw[0], W / 2 + 1.0, 5.6, 0, 4); a.rotation.z = -0.28; }
  for (const z of [-11, -7.5, 7.5, 11]) win(g, 2.1, 3.0, W / 2 + 0.07, 3.3, z, Math.PI / 2, { fixed: true, lit: z > 0 });
  for (const z of [-11.5, -8, -4, 4, 8, 11.5]) win(g, 2.1, 3.0, -W / 2 - 0.07, 3.3, z, -Math.PI / 2, { fixed: true, lit: z % 2 > 0 });
  for (const z of [-10, -4.5, 0, 4.5, 10]) { win(g, 1.5, 2.4, W / 2 + 0.07, 9.3, z, Math.PI / 2, { fixed: true }); win(g, 1.5, 2.4, -W / 2 - 0.07, 9.3, z, -Math.PI / 2, { fixed: true }); }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { win(g, 2.1, 3.0, s * (7.6 + i * 3.8), 3.3, -D / 2 - 0.07, Math.PI, { fixed: true, lit: i % 2 === 0 }); win(g, 1.5, 2.4, s * (7.6 + i * 3.8), 9.3, -D / 2 - 0.07, Math.PI, { fixed: true }); }
  for (const s of [-1, 1]) {
    Bx(g, 7, 1.0, 1.6, mat('concrete'), s * 10.5, 0.5, -D / 2 - 0.9, 3); cols.push([s * 10.5 - 3.5, s * 10.5 + 3.5, -D / 2 - 1.7, -D / 2 - 0.1, 1.0]);
    for (let i = 0; i < 3; i++) Bx(g, 0.9, 0.8, 0.7, wood, s * 10.5 - 2 + i * 1.8, 1.4, -D / 2 - 0.9, 1);
    Bx(g, 1.8, 1.2, 1.2, C(0x5a5e60), s * 17.5, 0.6, -D / 2 - 0.7, 1); cols.push([s * 17.5 - 0.9, s * 17.5 + 0.9, -D / 2 - 1.3, -D / 2, 1.2]);
    Cy(g, 0.14, 0.14, 12, 6, C(0x555a5c), s * 20.5, 6.5, -D / 2 - 0.3, 1);
  }
  { const a = Bx(g, 10.4, 0.12, 2.6, mat('s5s_corrug'), 0, 6.0, -D / 2 - 1.2, 3); a.rotation.x = -0.2; }
  sgn(g, 'DELIVERIES', 4, 0.7, 0, 5.7, -D / 2 - 0.1, Math.PI, { bg: '#241a10', fg: '#f0dca0' });
  for (const x of [-12, 0, 12]) { Bx(g, 8, 1.3, 3.6, C(0x20303a), x, H + 1.2, 0, 2); Bx(g, 8.4, 0.2, 4, dkm, x, H + 1.9, 0, 2); }
  for (const [x, z] of [[-19, 8], [19, -8], [-6, -9]]) Bx(g, 1.1, 3, 1.1, mat('s5s_brickDark'), x, H + 1.8, z, 2);
  for (const [x, z] of [[18, 7], [-17, -8]]) Cy(g, 0.5, 0.5, 1.4, 8, C(0x6a6e70), x, H + 1.0, z, 1);
  // ---------------- interior ----------------
  Bx(g, ix.x1 - ix.x0, 0.05, ix.z1 - ix.z0, mat('s5s_marketFloor'), 0, 0.025, 0, 6);          // solid floor slab
  const aws = [mat('awningRed'), mat('s5s_awnGreen'), mat('awningBlue'), mat('s5s_awnPlum'), mat('awningRed'), mat('s5s_awnGreen')];
  const names = { n: ['APPLES', 'PEARS', 'KALE', 'CHERRIES', 'HONEY', 'BREAD'], f: ['TULIPS', 'ROSES', 'PEONIES', 'DAHLIAS'] };
  let ni = 0;
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = sx * (10.3 + i * 4.2);
    marketStall(g, cols, x, -8.4, (i + (sx > 0 ? 1 : 0)) % 3 === 2 ? 'bakery' : 'produce', aws[(ni + 1) % 6], names.n[ni % 6]); ni++;
  }
  for (let i = 0; i < 3; i++) marketStall(g, cols, 10.3 + i * 4.2, 8.4, 'flowers', aws[(i * 2 + 1) % 6], names.f[i]);
  { const fx = -14.5, fz = 8.4;
    Bx(g, 12, 1.1, 2.6, C(0x8a9296), fx, 0.55, fz, 2); Bx(g, 12.3, 0.1, 2.9, C(0xc8ccd0), fx, 1.1, fz, 2);
    Bx(g, 11.6, 0.3, 2.3, C(0xe8f2f6), fx, 1.3, fz, 2);
    const fc = [0xc0c8d0, 0xd8788a, 0x8a98a8, 0xe8a070, 0x6a7a88], r = mulberry(91);
    for (let i = 0; i < 26; i++) { const x = fx - 5.4 + (i % 13) * 0.84 + r() * 0.2, z = fz + (i < 13 ? -0.65 : 0.65) + r() * 0.2; Sg(g, C(fc[(r() * fc.length) | 0]), x, 1.58, z, 0.42, 0.12, 0.14, 0, r() * 1.2 - 0.6, 0, 7); Sg(g, C(0x222830), x - 0.38, 1.58, z, 0.12, 0.1, 0.05, 0, 0, 0, 5); }
    for (let i = 0; i < 5; i++) Sg(g, C(0xc83a20), fx - 4.5 + i * 2.4, 1.6, fz + (i % 2 ? 0.1 : -0.1), 0.3, 0.12, 0.26, 0, i, 0, 6);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) Cy(g, 0.05, 0.05, 2.4, 5, dkm, fx + sx * 5.9, 2.2, fz + sz * 1.25, 1);
    Bx(g, 12.4, 0.1, 3.0, aw[2], fx, 3.4, fz, 4); Bx(g, 12.4, 0.5, 0.06, aw[2], fx, 3.2, fz + 1.5, 4); Bx(g, 12.4, 0.5, 0.06, aw[2], fx, 3.2, fz - 1.5, 4);
    for (const s of [-1, 1]) { const sp = sign('FRESH FISH', 5.2, 0.95, { bg: '#06120e', fg: '#00E599', border: '#00E599' }); sp.position.set(fx, 4.1, fz + s * 1.55); sp.rotation.y = s > 0 ? 0 : Math.PI; g.add(sp); }
    cols.push([fx - 6, fx + 6, fz - 1.3, fz + 1.3, 1.5]);
  }
  { const px = -5.8, pz = 10.8, br = shiny(0x9a6a2e, 70);
    Bx(g, 2.2, 0.5, 3.6, stone, px, 0.25, pz, 2);
    Sg(g, br, px, 1.45, pz, 0.8, 0.7, 1.3, 0, 0, 0, 10);
    Sg(g, br, px, 1.55, pz + 1.3, 0.55, 0.55, 0.55, 0, 0, 0, 10);
    Ms(g, new THREE.CylinderGeometry(0.2, 0.24, 0.3, 8), br, px, 1.45, pz + 1.8, 1, 1, 1, Math.PI / 2, 0, 0);
    for (const sx of [-1, 1]) { Ms(g, new THREE.ConeGeometry(0.2, 0.4, 5), br, px + sx * 0.35, 2.0, pz + 1.2, 1, 1, 1, 0.3, 0, sx * 0.5); for (const sz of [-0.7, 0.7]) Cy(g, 0.15, 0.13, 0.9, 6, br, px + sx * 0.4, 0.95, pz + sz, 1); }
    Ms(g, new THREE.TorusGeometry(0.15, 0.04, 4, 8), br, px, 1.7, pz - 1.3, 1, 1, 1, 0.5);
    Bx(g, 0.5, 0.06, 0.3, dkm, px, 0.52, pz - 1.4, 1);
    cols.push([px - 1.1, px + 1.1, pz - 1.8, pz + 1.8, 2.3]);
  }
  [-10, -4.2, 5, 10.5].forEach((z, i) => wallUnit(g, cols, ix.x0 + 0.5, z, 3.6, 20 + i));
  [-11, -6.5, 6.5, 11].forEach((z, i) => wallUnit(g, cols, ix.x1 - 0.5, z, 3.4, 30 + i));
  [['FRESH - LOCAL - DAILY', '#7a1c14'], ['SINCE 1907', '#1a3a4a']].forEach(([t, bg], i) => {
    sgn(g, t, 7, 1.1, i ? 14 : -14, 7, ix.z0 + 0.1, 0, { bg }); sgn(g, i ? 'OPEN EVERY DAY' : 'FRESH FLOWERS', 7, 1.1, i ? -14 : 14, 7, ix.z1 - 0.1, Math.PI, { bg: i ? '#7a1c14' : '#1a3a4a' });
  });
  sgn(g, 'THIS WAY TO THE WATERFRONT', 8, 1, ix.x0 + 0.1, 7.2, 6, Math.PI / 2, { bg: '#1a3a4a' });
  sgn(g, 'MEET YOUR FARMER', 8, 1, ix.x1 - 0.1, 7.2, -7, -Math.PI / 2, { bg: '#7a1c14' });
  for (const z of [-12, -6, 0, 6, 12]) Bx(g, ix.x1 - ix.x0, 0.7, 0.5, wood, 0, CH - 0.35, z, 2);
  for (const x of [-11, 11]) Bx(g, 0.5, 0.7, ix.z1 - ix.z0, wood, x, CH - 0.35, 0, 2);
  const bulbs = [], cords = [];
  for (const z of [-8.4, 0, 8.4]) { for (let x = -20; x <= 20; x += 1.6) { const b = bulbGeo(); b.translate(x, CH - 0.9 - 0.4 * (1 - Math.abs(Math.sin(x * 0.4))), z); bulbs.push(b); } cords.push([[-21, CH - 0.7, z], [21, CH - 0.7, z]]); }
  g.add(new THREE.Mesh(merge(bulbs), basic(0xffe3a0))); rods(g, cords, 0.02, dkm, 3);
  return size(g, W, D + 3, 16, cols);
}

// =====================================================================
// 8. Original Coffee (generic coffee shop)
// =====================================================================
export function coffeeHouse() {
  const g = G(), side = tint('sidingGreen', 0x8aa090), trim = C(0xd8d0b8), dk = C(0x2a2a2c), wood = mat('planks');
  Bx(g, 12, 4.4, 6.4, side, 0, 2.2, -1.8, 4);
  Bx(g, 12.6, 0.5, 7, mat('roofTar'), 0, 4.65, -1.8, 3);
  Bx(g, 12.6, 0.5, 0.5, trim, 0, 4.9, 1.45, 1);
  Bx(g, 12.4, 0.35, 6.4, mat('granite'), 0, 0.2, -1.8, 2);
  Bx(g, 13.2, 0.18, 4.2, mat('pavingDark'), 0, 0.09, 3.3, 3);
  win(g, 2.8, 2.5, -3.6, 1.9, 1.42, 0, { lit: true, c: '#d8d0b8' }); win(g, 2.8, 2.5, 3.6, 1.9, 1.42, 0, { lit: true, c: '#d8d0b8' });
  door(g, 1.5, 2.6, 0, 1.4, 1.42, 0, '#8a5a2a');
  for (const x of [-5.8, -1.7, 1.7, 5.8]) Bx(g, 0.35, 3.6, 0.3, wood, x, 1.9, 1.5, 1);
  const awn = mat('s5s_awnGreen'); const a = Bx(g, 11.6, 0.1, 2.0, awn, 0, 3.3, 2.4, 4); a.rotation.x = 0.3;
  Bx(g, 11.6, 0.55, 0.08, awn, 0, 3.0, 3.35, 4);
  sgn(g, 'ORIGINAL COFFEE', 6, 0.85, 1.6, 4.05, 1.45, 0, { bg: '#0f3a2a', fg: '#efe4c8' });
  for (const [z, ry] of [[1.62, 0], [1.42, Math.PI]]) { const c = new THREE.Mesh(new THREE.CircleGeometry(1.15, 24), flatMap('s5s_emblem')); c.position.set(-3.8, 5.6, z); c.rotation.y = ry; g.add(c); }
  Ms(g, new THREE.TorusGeometry(1.17, 0.07, 5, 24), C(0xc8b078), -3.8, 5.6, 1.52); Bx(g, 0.2, 1.2, 0.5, dk, -3.8, 4.8, 1.45, 1);
  sgn(g, 'OPEN', 1.1, 0.4, -3.6, 1.0, 1.46, 0, { bg: '#08140f', fg: '#00E599', border: '#00E599' });
  Bx(g, 0.8, 1.1, 0.06, C(0x20301f), 2.2, 0.6, 3.2, 1);
  sgn(g, 'LATTE', 0.7, 0.5, 2.2, 0.8, 3.24, 0, { bg: '#20301f', fg: '#efe4c8' });
  const um = [0x2f8a5a, 0xe4dfc8, 0x2f8a5a];
  [-4.2, 0, 4.2].forEach((x, i) => {
    Cy(g, 0.55, 0.55, 0.06, 10, wood, x, 0.8, 4.2, 1); Cy(g, 0.06, 0.1, 0.8, 6, dk, x, 0.4, 4.2, 1);
    for (const [cx, cz] of [[-0.9, 0], [0.9, 0]]) { Bx(g, 0.45, 0.06, 0.45, wood, x + cx, 0.5, 4.2 + cz, 1); Bx(g, 0.45, 0.5, 0.06, wood, x + cx, 0.78, 4.2 + cz + 0.2, 1); Bx(g, 0.05, 0.5, 0.05, dk, x + cx - 0.2, 0.25, 4.2 + cz, 1); Bx(g, 0.05, 0.5, 0.05, dk, x + cx + 0.2, 0.25, 4.2 + cz, 1); }
    Cy(g, 0.03, 0.03, 2.5, 5, dk, x, 1.3, 4.2, 1); Ms(g, new THREE.ConeGeometry(1.5, 0.6, 8), C(um[i]), x, 2.65, 4.2);
    Cy(g, 0.12, 0.1, 0.12, 6, C(0xefe4c8), x + 0.2, 0.89, 4.1, 1);
  });
  for (const x of [-6.1, 6.1]) { Bx(g, 0.8, 0.6, 1.4, wood, x, 0.5, 3.4, 1); Sg(g, C(0x2f7a3a), x, 1.0, 3.4, 0.55, 0.4, 0.7, 0, 0, 0, 6); }
  for (let x = -5; x <= 5; x += 2.5) { if (Math.abs(x) < 1) continue; Bx(g, 0.08, 0.8, 0.08, dk, x, 0.5, 5.3, 1); }
  Bx(g, 11, 0.06, 0.06, dk, 0, 0.88, 5.3, 1);
  for (const s of [-1, 1]) { win(g, 1.8, 2.2, s * 6.07, 2.0, -3.4, s * Math.PI / 2, { fixed: true, lit: s > 0 }); win(g, 1.8, 2.2, s * 6.07, 2.0, -0.4, s * Math.PI / 2, { fixed: true }); }
  door(g, 1.4, 2.4, 3, 1.3, -5.03, Math.PI, '#4a3a2a'); win(g, 1.8, 2.2, -3.5, 2.0, -5.03, Math.PI, { fixed: true }); win(g, 1.2, 1.0, 0, 2.6, -5.03, Math.PI, { fixed: true });
  Bx(g, 1.8, 1.4, 1.2, C(0x666a6e), -1.5, 0.8, -5.7, 1); Cy(g, 0.12, 0.12, 4.6, 6, C(0x666a6e), 5.4, 2.3, -5.2, 1);
  Bx(g, 1.0, 1.0, 1.0, C(0x2f5a3e), 4.4, 0.55, -5.9, 1); Bx(g, 1.1, 0.12, 1.1, C(0x20402c), 4.4, 1.1, -5.9, 1);
  Cy(g, 0.35, 0.35, 1.2, 8, C(0x6a6e70), -5, 5.5, -3, 1);
  return size(g, 14, 10, 6.8);
}

// =====================================================================
// 9. Gas Works Park
// =====================================================================
export function gasWorksPark() {
  const g = G(), rust = mat('s5s_rust'), rustL = tint('s5s_rust', 0xb8a898), dk = C(0x2a2420), cols = [];
  Bx(g, 34, 0.2, 30, mat('gravel'), 0, 0.1, 0, 4);
  const tower = (x, z, r, h) => {
    Cy(g, r, r * 1.05, h, 12, rust, x, h / 2 + 0.2, z, 3);
    for (let y = 4; y < h; y += 5) Cy(g, r + 0.15, r + 0.15, 0.3, 12, rustL, x, y, z, 2);
    Cy(g, r * 0.5, r, 2, 12, rustL, x, h + 1.2, z, 2);
    cols.push([x - r * 0.75, x + r * 0.75, z - r * 0.75, z + r * 0.75, h]);
  };
  tower(-11, -4, 2.7, 30); tower(-4.5, -5.5, 2.2, 25);
  { const x = 4, z = -6, s = 2.2, h = 32, pl = [];
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) Bx(g, 0.5, h, 0.5, rust, x + a * s, h / 2, z + b * s, 2);
    for (let y = 0; y < h - 4; y += 4) { for (const f of [[[-s, y, -s], [s, y + 4, -s]], [[s, y, -s], [-s, y + 4, -s]], [[-s, y, s], [s, y + 4, s]], [[s, y, s], [-s, y + 4, s]], [[-s, y, -s], [-s, y + 4, s]], [[s, y, -s], [s, y + 4, s]]]) pl.push(f.map(([a, b, c]) => [x + a, b, z + c])); Bx(g, s * 2 + 0.6, 0.25, s * 2 + 0.6, dk, x, y + 4, z, 2); }
    rods(g, pl, 0.12, rust, 4);
    Cy(g, 1.1, 1.1, 14, 8, rustL, x, 8, z, 2); Cy(g, 0.8, 1.1, 5, 8, rust, x, 17, z, 2);
    Ms(g, SPH(0.4, 7, 5), glow(NEO), x, h + 0.7, z);
    cols.push([x - s - 0.3, x + s + 0.3, z - s - 0.3, z + s + 0.3, h]);
  }
  Cy(g, 0.7, 1.4, 27, 10, rust, 13, 13.7, -9, 3); Cy(g, 0.85, 0.7, 0.8, 10, dk, 13, 27.4, -9, 1); cols.push([11.8, 14.2, -10.2, -7.8, 27]);
  Cy(g, 3.2, 3.2, 12, 14, rust, 9, 4.2, 5, 3).rotation.z = Math.PI / 2;
  Ms(g, SPH(3.2, 12, 8), rust, 3, 4.2, 5, 1, 1, 1); Ms(g, SPH(3.2, 12, 8), rust, 15, 4.2, 5, 1, 1, 1);
  for (const x of [5, 9, 13]) Bx(g, 0.8, 1.5, 4.2, dk, x, 0.95, 5, 2);
  cols.push([2.5, 15.5, 2.4, 7.6, 7.4]);
  Cy(g, 4.5, 4.5, 9, 14, rust, -10, 4.7, 8.5, 3); Ms(g, SPH(4.5, 12, 6), rust, -10, 9.2, 8.5, 1, 0.45, 1);
  for (let a = 0; a < 6; a++) Cy(g, 4.6, 4.6, 0.25, 14, rustL, -10, 1.5 + a * 1.5, 8.5, 2);
  cols.push([-13.3, -6.7, 5.2, 11.8, 10]);
  Ms(g, SPH(2.6, 12, 8), rust, -1, 2.8, 12, 1, 1, 1); Cy(g, 0.2, 0.2, 3, 5, dk, -1, 1.4, 12, 1); cols.push([-2.8, 0.8, 10.2, 13.8, 5.4]);
  const pipes = [
    [[-11, 3, -1.4], [-11, 3, 6]], [[-11, 3, -1.4], [-4.5, 3, -3.4]], [[-4.5, 3, -3.4], [3, 3, -3.4]], [[3, 3, -3.4], [3, 3, 2.4]], [[-6.7, 3, 8.5], [-11, 3, 6]], [[3, 3, 2.4], [-1, 3, 9.4]],
    [[-4.5, 6, -3.3], [-4.5, 24, -3.3]], [[-11, 6, -1.5], [-11, 28, -1.5]], [[9, 7.5, 2.4], [9, 12, 2.4]], [[9, 12, 2.4], [13, 12, -6]], [[13, 12, -6], [13, 12, -8.4]], [[-4.5, 25, -5.5], [4, 25, -6]], [[-11, 29, -4], [-4.5, 24, -5.5]],
  ];
  rods(g, pipes, 0.38, rustL, 6);
  for (const [a] of pipes.slice(0, 6)) Ms(g, SPH(0.5, 6, 5), rustL, a[0], a[1], a[2]);
  Bx(g, 7, 0.25, 1.4, dk, -7.8, 16, -3, 2); Bx(g, 8, 0.25, 1.4, dk, 0, 22, -3.2, 2);
  const rl = []; for (const [x0, x1, y, z] of [[-11.3, -4.3, 16, -2.3], [-11.3, -4.3, 16, -3.7], [-4, 4, 22, -2.5], [-4, 4, 22, -3.9]]) { rl.push([[x0, y + 1, z], [x1, y + 1, z]]); for (let x = x0; x <= x1; x += 1.75) rl.push([[x, y, z], [x, y + 1, z]]); }
  rods(g, rl, 0.04, dk, 3);
  for (let i = 0; i < 12; i++) Bx(g, 1.1, 0.12, 0.5, dk, -13.8 + i * 0.28, 0.5 + i * 1.3, 0.5, 1);
  rods(g, [[[-14.2, 0.2, 0.2], [-10.6, 15.8, 0.2]], [[-14.2, 0.2, 0.8], [-10.6, 15.8, 0.8]]], 0.05, dk, 3);
  const hut = tint('plaster', 0xa8a090);
  Bx(g, 8, 4.2, 5, hut, 9.5, 2.3, 11.5, 4); Bx(g, 8.6, 0.4, 5.6, mat('metalRoof'), 9.5, 4.6, 11.5, 3);
  door(g, 1.4, 2.4, 11.5, 1.4, 14.02, 0, '#5a4a30'); win(g, 1.3, 1.8, 8.6, 2.2, 14.02, 0, { lit: true }); win(g, 1.3, 1.8, 6.7, 2.2, 14.02, 0, { lit: false });
  for (const z of [10, 13]) { win(g, 1.3, 1.8, 5.47, 2.2, z, -Math.PI / 2, { fixed: true }); win(g, 1.3, 1.8, 13.53, 2.2, z, Math.PI / 2, { fixed: true }); }
  win(g, 1.3, 1.8, 8, 2.2, 8.97, Math.PI, { fixed: true }); door(g, 1.4, 2.4, 11.5, 1.4, 8.97, Math.PI, '#4a3a2a');
  sgn(g, 'GAS WORKS PARK', 4.5, 0.7, 9.5, 3.7, 14.06, 0, { bg: '#2a2420', fg: '#00E599' });
  cols.push([5.5, 13.5, 9, 14, 4.8]);
  Bx(g, 0.3, 1.2, 0.3, dk, -15, 0.8, 13, 1); sgn(g, 'KEEP OFF PIPES', 2.4, 0.8, -15, 1.9, 13, 0, { bg: '#c8a820', fg: '#201a10' });
  return size(g, 34, 30, 33, cols);
}

// =====================================================================
// 10. Fremont Troll
// =====================================================================
export function fremontTroll() {
  const g = G(), conc = mat('s5s_wetConcrete'), cols = [];
  const sph = (r, uv = 4) => { const s = new THREE.SphereGeometry(r, 12, 9); const u = s.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * uv, u.getY(i) * uv); return s; };
  // bridge deck, piers, arch ribs
  Bx(g, 22, 1.5, 11, conc, 0, 11.25, -1, 4);
  Bx(g, 22.4, 0.5, 11.4, C(0x3a3d3c), 0, 12.25, -1, 3);
  for (const s of [-1, 1]) { Bx(g, 2.6, 10.5, 5, conc, s * 8.5, 5.25, -1, 4); Bx(g, 3.4, 0.8, 6, conc, s * 8.5, 10.4, -1, 4); }
  for (const z of [-3.2, 1.2]) { const arc = Ms(g, new THREE.TorusGeometry(7.4, 0.55, 5, 16, Math.PI), conc, 0, 3.0, z, 1, 1.1, 1); }
  for (const x of [-3.5, 0, 3.5]) Bx(g, 0.5, 4.6, 4.8, conc, x, 8.3, -1, 3);
  for (let x = -10; x <= 10; x += 2.5) Bx(g, 0.12, 1.2, 0.12, C(0x2a2c2e), x, 13.1, 4.4, 1);
  Bx(g, 22, 0.1, 0.1, C(0x2a2c2e), 0, 13.7, 4.4, 1);
  // head
  const hx = -3.2, hz = 2.2;
  Ms(g, sph(3.3), conc, hx, 3.7, hz, 1, 1.12, 0.95);
  Ms(g, sph(2.0), conc, hx, 6.6, hz - 0.4, 1.3, 0.6, 1.1);                               // brow/forehead hump
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 1.4 + 0.9; Ms(g, sph(1.2, 2), conc, hx + Math.cos(a) * 3.0, 6.6 + Math.sin(a * 2) * 0.5, hz - 1.4 - Math.abs(Math.sin(a)) * 1.2, 1, 1.4, 1); }  // hair lumps
  Ms(g, sph(1.15), conc, hx, 3.2, hz + 3.1, 1, 1.25, 1.1);                               // nose
  Ms(g, sph(0.7), conc, hx - 0.8, 2.4, hz + 3.1, 1, 1, 1); Ms(g, sph(0.7), conc, hx + 0.8, 2.4, hz + 3.1, 1, 1, 1);
  Bx(g, 2.8, 0.5, 0.5, C(0x1c1f20), hx, 1.1, hz + 3.0, 1);                                // mouth
  for (let i = 0; i < 4; i++) Bx(g, 0.3, 0.45, 0.3, C(0xcfcab8), hx - 0.9 + i * 0.6, 1.3, hz + 3.2, 1);
  Ms(g, sph(0.9), conc, hx + 3.1, 3.6, hz + 0.4, 0.5, 1.4, 1); Ms(g, sph(0.9), conc, hx - 3.1, 3.6, hz + 0.4, 0.5, 1.4, 1);   // ears
  // the single hubcap eye
  const hub = Ms(g, new THREE.CylinderGeometry(0.95, 0.95, 0.35, 14), shiny(0xd8dce0, 120), hx - 1.15, 4.6, hz + 2.85, 1, 1, 1, Math.PI / 2 + 0.2);
  Ms(g, new THREE.CylinderGeometry(0.45, 0.45, 0.4, 10), C(0x20242a), hx - 1.15, 4.6, hz + 3.0, 1, 1, 1, Math.PI / 2 + 0.2);
  Ms(g, new THREE.CylinderGeometry(0.2, 0.2, 0.45, 8), shiny(0xe0e4e8, 120), hx - 1.15, 4.6, hz + 3.05, 1, 1, 1, Math.PI / 2 + 0.2);
  Ms(g, sph(0.55), C(0x1a1d1e), hx + 1.25, 4.5, hz + 2.85, 1, 0.8, 0.6);                   // the other, hollow eye socket
  // hand with the little car
  const px = 4.7, pz = 2.6;
  Ms(g, sph(2.2), conc, px, 1.2, pz - 1.2, 1.3, 0.8, 1.1);                                   // palm
  const car = G(); car.position.set(px + 0.2, 1.3, pz + 0.7); car.rotation.y = 0.5;
  Ms(car, SPH(1, 12, 8), shiny(0x6aa8c8, 40), 0, 0.9, 0, 2.3, 0.85, 1.35); Ms(car, SPH(1, 10, 7), shiny(0x6aa8c8, 40), -0.1, 1.55, 0, 1.15, 0.65, 1.0);
  for (const [x, z] of [[-1.3, 1.05], [-1.3, -1.05], [1.3, 1.05], [1.3, -1.05]]) Ms(car, new THREE.CylinderGeometry(0.4, 0.4, 0.3, 9), C(0x1c1c1e), x, 0.45, z, 1, 1, 1, Math.PI / 2);
  Ms(car, new THREE.BoxGeometry(0.3, 0.4, 0.9), C(0x14181c), 0.5, 1.55, 0); g.add(car);
  for (let i = 0; i < 4; i++) Ms(g, new THREE.CapsuleGeometry(0.42, 2.3, 3, 7), conc, px - 1.7 + i * 1.15, 2.2, pz + 1.9, 1, 1, 1, 1.1, 0, 0.1 * i - 0.1);   // fingers wrapping the car
  Ms(g, new THREE.CapsuleGeometry(0.5, 2.0, 3, 7), conc, px + 3.0, 1.8, pz + 0.6, 1, 1, 1, 0.3, 0, -0.9);   // thumb
  Ms(g, new THREE.CapsuleGeometry(1.0, 4, 3, 8), conc, px + 1.0, 0.6, pz - 3.8, 1, 1, 1, 1.45, 0, 0);       // forearm back to the pier
  // rebar & moss details + tag sign
  for (let i = 0; i < 3; i++) Cy(g, 0.04, 0.04, 1.8, 4, C(0x7a3a1a), hx - 1.6 + i * 0.5, 7.9, hz - 1.7, 1).rotation.z = 0.2 * (i - 1);
  Ms(g, sph(0.8), C(0x4a6a3a), hx + 2.4, 6.2, hz + 0.6, 1, 0.5, 1);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), mat('s5s_graffC')); tag.position.set(8.5, 3.2, 1.55); g.add(tag);
  sgn(g, 'TROLL XING', 3.4, 0.7, -8.5, 3.6, 1.54, 0, { bg: '#08140f', fg: '#00E599', border: '#00E599' });
  { const t2 = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), mat('s5s_graffB')); t2.position.set(8.5, 3.2, -3.55); t2.rotation.y = Math.PI; g.add(t2); }
  cols.push([-9.8, -7.2, -3.5, 1.5, 12], [7.2, 9.8, -3.5, 1.5, 12], [hx - 2.3, hx + 2.3, hz - 2.0, hz + 3.6, 7.2], [px - 2.5, px + 3.0, pz - 2.2, pz + 2.9, 3.3]);
  return size(g, 22, 14, 14, cols);
}

// =====================================================================
// 11. Great Wheel + ferry terminal
// =====================================================================
export function greatWheel() {
  const g = G(), cols = [], white = C(0xe4e6e8), steel = C(0xa8aeb4), dk = C(0x2a2e34);
  const hubY = 22.5, r = 17, wz = -3.4;
  Bx(g, 34, 0.7, 14, mat('planks'), 0, 0.35, 0, 4);
  for (let x = -16; x <= 16; x += 4) { Bx(g, 0.5, 0.6, 14, dk, x, 0.0, 0, 2); }
  // terminal
  const wall = tint('sidingBlue', 0x8095a8);
  Bx(g, 30, 5.2, 5.4, wall, 0, 3.3, 4.2, 4);
  const rf = gableRoof(30, 5.4, 1.8, 0.5, mat('ironGrey', { double: true }), wall, 3); rf.position.set(0, 5.9, 4.2); g.add(rf);
  for (const x of [-11, -6, -1, 6, 11]) win(g, 2.4, 2.6, x, 3.2, 6.95, 0, { lit: x < 0 || x > 5 });
  door(g, 2.4, 3.2, 3.2, 2.3, 6.97, 0, '#2a4a6a'); door(g, 2.4, 3.2, -3.0, 2.3, 6.97, 0, '#2a4a6a');
  sgn(g, 'FERRY TERMINAL', 9, 1.1, 0, 6.2, 7.0, 0, { bg: '#0e1a24', fg: '#00E599', border: '#00E599' });
  const a = Bx(g, 8, 0.14, 1.8, mat('awningBlue'), 0, 4.3, 7.8, 4); a.rotation.x = 0.25;
  for (const x of [-13.9, 13.9]) for (const z of [3.2, 5.8]) win(g, 1.6, 2.2, x < 0 ? -15.07 : 15.07, 3.2, z, x < 0 ? -Math.PI / 2 : Math.PI / 2, { fixed: true });
  for (const x of [-12, -6, 0, 6, 12]) win(g, 2.2, 2.4, x, 3.3, 1.47, Math.PI, { fixed: true, lit: x % 2 === 0 });
  door(g, 2.0, 2.8, 8.5, 2.1, 1.47, Math.PI, '#4a3a2a');
  Bx(g, 2.4, 1.6, 1.4, C(0x5a5e60), -14, 0.8 + 0.35, 0.1, 1); Cy(g, 0.12, 0.12, 3, 6, C(0x666a6e), 14.6, 2.0, 1.5, 1);
  cols.push([-15, 15, 1.5, 6.9, 7]);
  // wheel
  const N = 36, rim = [], rimB = [], inner = [], spokes = [];
  const pt = (k, rad, z) => [Math.cos(k / N * Math.PI * 2) * rad, hubY + Math.sin(k / N * Math.PI * 2) * rad, z];
  for (let k = 0; k < N; k++) { for (const z of [wz - 0.9, wz + 0.9]) rim.push([pt(k, r, z), pt(k + 1, r, z)]); inner.push([pt(k, r * 0.82, wz), pt(k + 1, r * 0.82, wz)]); rimB.push([pt(k, r, wz - 0.9), pt(k, r, wz + 0.9)]); }
  for (let k = 0; k < N; k += 3) for (const z of [wz - 0.9, wz + 0.9]) spokes.push([[0, hubY, z], pt(k, r, z)]);
  for (let k = 0; k < N; k += 3) spokes.push([pt(k, r, wz - 0.9), pt(k + 3, r * 0.82, wz)], [pt(k, r, wz + 0.9), pt(k + 3, r * 0.82, wz)]);
  rods(g, rim, 0.24, white, 5); rods(g, rimB, 0.1, steel, 4); rods(g, spokes, 0.07, steel, 4);
  rods(g, inner, 0.09, glow(NEO), 4);                            // neo-green LED ring
  Ms(g, new THREE.CylinderGeometry(1.6, 1.6, 3.2, 12), white, 0, hubY, wz, 1, 1, 1, Math.PI / 2);
  Ms(g, new THREE.CylinderGeometry(0.7, 0.7, 4.8, 8), steel, 0, hubY, wz, 1, 1, 1, Math.PI / 2);
  // gondolas
  const gl = [], lit = [];
  for (let k = 0; k < 24; k++) { const a2 = k / 24 * Math.PI * 2, x = Math.cos(a2) * r, y = hubY + Math.sin(a2) * r - 1.1; (k % 3 === 0 ? lit : gl).push([1.5, 1.4, 1.8, x, y, wz]); }
  boxes(g, gl, C(0xdfe6ea)); boxes(g, lit, C(0xf0d890, 0x6a5a28));
  boxes(g, [...gl, ...lit].map(([w, h, d, x, y, z]) => [w + 0.2, 0.2, d + 0.2, x, y + 0.8, z]), dk);
  rods(g, [...gl, ...lit].map(([w, h, d, x, y, z]) => [[x, y + 0.9, z], [x, y + 1.3, z]]), 0.05, dk, 3);
  // A-frame supports
  const legs = [];
  for (const z of [wz - 2.4, wz + 2.4]) for (const s of [-1, 1]) legs.push([[s * 0.6, hubY, wz + (z < wz ? -1.2 : 1.2)], [s * 6.2, 0.7, z]]);
  rods(g, legs, 0.5, white, 6);
  rods(g, [[[-6.2, 0.7, wz - 2.4], [-6.2, 0.7, wz + 2.4]], [[6.2, 0.7, wz - 2.4], [6.2, 0.7, wz + 2.4]], [[0, hubY, wz - 1.2], [0, hubY, wz + 1.2]], [[-3.4, 12, wz - 1.85], [3.4, 12, wz - 1.85]], [[-3.4, 12, wz + 1.85], [3.4, 12, wz + 1.85]]], 0.25, steel, 5);
  for (const x of [-6.2, 6.2]) for (const z of [wz - 2.4, wz + 2.4]) { Bx(g, 1.6, 0.8, 1.6, mat('concrete'), x, 0.9, z, 2); cols.push([x - 0.8, x + 0.8, z - 0.8, z + 0.8, 4]); }
  Cy(g, 0.1, 0.25, 6, 5, steel, 0, hubY + r + 2.5, wz, 1); Ms(g, SPH(0.4, 7, 5), glow(0xff3030), 0, hubY + r + 5.6, wz);
  // pier lamps, bollards, rails
  for (const x of [-14, -5, 5, 14]) { Cy(g, 0.08, 0.1, 4.4, 5, dk, x, 2.9, -6.4, 1); Ms(g, SPH(0.3, 6, 5), glow(0xffe3a0), x, 5.2, -6.4); }
  rods(g, [[[-17, 1.4, -6.9], [17, 1.4, -6.9]], [[-17, 0.9, -6.9], [17, 0.9, -6.9]]], 0.05, white, 3);
  for (let x = -17; x <= 17; x += 3.4) rods(g, [[[x, 0.7, -6.9], [x, 1.5, -6.9]]], 0.05, white, 3);
  for (const x of [-9, 9]) Cy(g, 0.35, 0.4, 0.8, 7, dk, x, 1.1, -5.6, 1);
  sgn(g, 'GREAT WHEEL', 8, 0.9, 0, 1.7, -6.92, Math.PI, { bg: '#0e1a24', fg: '#e8e4d0' });
  return size(g, 34, 14, 40, cols);
}

// =====================================================================
// 12. Monorail section
// =====================================================================
export function monorailSection() {
  const g = G(), cols = [], conc = mat('concrete'), dk = C(0x22262a), wht = C(0xe2e6ea);
  const by = 7.4;
  for (const z of [-2.2, 2.2]) { Bx(g, 40, 1.0, 1.2, conc, 0, by + 0.0, z, 4); Bx(g, 40, 0.14, 0.5, dk, 0, by + 0.57, z, 4); }
  for (const x of [-17, -6, 6, 17]) {
    Bx(g, 1.4, by - 0.5, 1.4, conc, x, (by - 0.5) / 2, 0, 3); Bx(g, 1.6, 0.9, 6.6, conc, x, by - 0.45, 0, 3);
    Bx(g, 2.4, 0.5, 2.4, conc, x, 0.25, 0, 3);
    cols.push([x - 0.75, x + 0.75, -0.75, 0.75, by]);
  }
  // station platform
  Bx(g, 16, 0.5, 4.4, mat('pavingDark'), 0, by + 0.55, -1.2, 3);
  Bx(g, 16.4, 0.3, 0.3, C(0xd8c040), 0, by + 0.84, 0.8, 1);
  Bx(g, 16, 3.0, 0.3, C(0x2a343c), 0, by + 2.3, -3.2, 3);
  for (let i = 0; i < 5; i++) win(g, 2.4, 2.0, -6.4 + i * 3.2, by + 2.4, -3.37, Math.PI, { fixed: true, lit: i % 2 === 0, c: '#aab4bc' });
  for (let i = 0; i < 5; i++) win(g, 2.4, 2.0, -6.4 + i * 3.2, by + 2.4, -3.04, 0, { fixed: true, lit: i % 2 === 0, c: '#aab4bc' });
  const rf = Bx(g, 17.4, 0.3, 6.6, C(0x3a4c5c), 0, by + 4.2, -0.4, 3); rf.rotation.z = 0;
  Bx(g, 17.4, 0.5, 0.3, wht, 0, by + 4.2, 2.9, 2);
  for (const x of [-7.5, -2.5, 2.5, 7.5]) Cy(g, 0.12, 0.12, 3.7, 6, wht, x, by + 2.45, 0.7, 1);
  sgn(g, 'MONORAIL', 6, 0.8, 0, by + 3.55, 2.88, 0, { bg: '#0e1a24', fg: '#e8e4d0' });
  sgn(g, 'MONORAIL', 6, 0.8, 0, by + 3.9, -3.5, Math.PI, { bg: '#0e1a24', fg: '#00E599' });
  Bx(g, 1.2, 1.2, 0.8, C(0x4a5058), -6.8, by + 1.4, -2.7, 1); Bx(g, 0.2, 2.2, 1.2, wht, 6.8, by + 1.7, -2.7, 1);
  // stairs to the platform (visual)
  for (let i = 0; i < 14; i++) Bx(g, 0.5, 0.14, 1.6, dk, -15 + i * 0.46, 0.3 + i * 0.55, -1.2, 1);
  rods(g, [[[-15.2, 0.2, -2.0], [-8.4, 7.9, -2.0]], [[-15.2, 0.2, -0.4], [-8.4, 7.9, -0.4]]], 0.07, dk, 4);
  // the train, parked at the station on the +z beam
  const tr = G();
  Ms(tr, new THREE.BoxGeometry(11, 2.6, 2.7), shiny(0xe6eaee, 50), 0, 0, 0);
  Ms(tr, SPH(1, 10, 8), shiny(0xe6eaee, 50), 5.5, 0, 0, 1.4, 1.3, 1.35); Ms(tr, SPH(1, 10, 8), shiny(0xe6eaee, 50), -5.5, 0, 0, 1.4, 1.3, 1.35);
  Ms(tr, new THREE.BoxGeometry(11.2, 0.45, 2.8), shiny(0x2a8a6a, 40), 0, -0.9, 0, 1, 1, 1);
  Ms(tr, new THREE.BoxGeometry(9.6, 1.0, 2.78), color(0x1e2c38, { emissive: 0x2a3a48 }), 0, 0.25, 0);
  Ms(tr, new THREE.BoxGeometry(2.6, 0.3, 2.78), glow(NEO), 0, -0.5, 0, 1, 0.3, 1);
  tr.position.set(0, by + 0.57 + 1.55 + 0.2, 2.2); g.add(tr);
  Bx(g, 9, 0.35, 2.3, dk, 0, by + 0.57 + 0.2, 2.2, 2);
  return size(g, 44, 8, 12, cols);
}

// =====================================================================
// 13. Pioneer Square brick warehouse
// =====================================================================
function fireEscape(g, x, z, ry, floors, w = 3.2) {
  const f = G(), rail = C(0x1c1c1e);
  const rl = [];
  floors.forEach((y, i) => {
    Bx(f, w, 0.12, 1.4, C(0x26262a), 0, y, 0.7, 1);
    rl.push([[-w / 2, y + 1, 1.35], [w / 2, y + 1, 1.35]], [[-w / 2, y + 1, 0.05], [-w / 2, y + 1, 1.35]], [[w / 2, y + 1, 0.05], [w / 2, y + 1, 1.35]]);
    for (const px of [-w / 2, w / 2, 0]) rl.push([[px, y, 1.35], [px, y + 1, 1.35]]);
    rl.push([[-w / 2, y + 0.5, 1.35], [w / 2, y + 0.5, 1.35]]);
    if (i > 0) { const y0 = floors[i - 1]; rl.push([[w / 2 - 0.5, y0, 1.1], [w / 2 - 0.5, y0 + 0.3, 1.1]]); for (let s = 0; s < 8; s++) Bx(f, 0.8, 0.07, 0.3, rail, w / 2 - 0.9, y0 + 0.35 + s * (y - y0 - 0.35) / 8, 1.35 - s * 0.14, 1); rl.push([[w / 2 - 1.3, y0 + 0.2, 1.4], [w / 2 - 1.3, y, 0.2]], [[w / 2 - 0.5, y0 + 0.2, 1.4], [w / 2 - 0.5, y, 0.2]]); }
  });
  rl.push([[-w / 2 + 0.4, floors[0] - 2.6, 1.2], [-w / 2 + 0.4, floors[0], 1.2]], [[-w / 2 + 1.0, floors[0] - 2.6, 1.2], [-w / 2 + 1.0, floors[0], 1.2]]);
  for (let k = 0; k < 6; k++) rl.push([[-w / 2 + 0.4, floors[0] - 2.4 + k * 0.4, 1.2], [-w / 2 + 1.0, floors[0] - 2.4 + k * 0.4, 1.2]]);
  rods(f, rl, 0.04, rail, 3);
  f.position.set(x, 0, z); f.rotation.y = ry; g.add(f);
}
export function brickWarehouse() {
  const g = G(), B = mat('s5s_brickDark'), sand = C(0x9c8a70), dk = C(0x2a2a2c), W = 36, D = 16, FH = [5, 8.6, 12.2, 15.8];
  const top = FH[3];
  Bx(g, W, top, D, B, 0, top / 2, 0, 4).material = [B, B, mat('roofTar'), mat('roofTar'), B, B];
  Bx(g, W + 0.6, 0.7, D + 0.6, sand, 0, top + 0.1, 0, 3); Bx(g, W + 0.2, 0.7, D + 0.2, B, 0, top + 0.7, 0, 3);
  Bx(g, W + 0.7, 0.4, D + 0.7, sand, 0, 5.0, 0, 3);              // belt course over the ground floor
  Bx(g, W + 0.5, 0.3, D + 0.5, sand, 0, 8.6, 0, 3); Bx(g, W + 0.5, 0.3, D + 0.5, sand, 0, 12.2, 0, 3);
  for (let i = 0; i < 8; i++) { const x = -17.5 + i * 5; Bx(g, 0.8, top, 0.3, sand, x, top / 2, D / 2 + 0.1, 1); Bx(g, 0.8, top, 0.3, sand, x, top / 2, -D / 2 - 0.1, 1); }
  const aw = alphaMat('s5s_archwin'), awl = alphaMat('s5s_archwinLit');
  const arch = (x, y, z, ry, w2, h2, lit) => flat(g, lit ? awl : aw, w2, h2, x, y, z, ry);
  // front: ground floor arches + shopfronts, 3 upper floors
  for (let i = 0; i < 7; i++) {
    const x = -15 + i * 5;
    for (const y of [6.9, 10.5, 14.1]) arch(x, y, D / 2 + 0.08, 0, 2.2, 3.1, (i * 3 + (y | 0)) % 7 === 0);
    arch(x, 2.6, D / 2 + 0.08, 0, 3.4, 5.1, i === 4);
  }
  door(g, 1.7, 2.9, 0, 1.5, D / 2 + 0.12, 0, '#3a4a5a'); door(g, 1.7, 2.9, -10, 1.5, D / 2 + 0.12, 0, '#6a2a22');
  Bx(g, 4, 0.2, 1.2, mat('awningRed'), 0, 3.8, D / 2 + 0.6, 3).rotation.x = 0.3;
  sgn(g, 'OPEN', 1.5, 0.55, -5, 1.8, D / 2 + 0.14, 0, { bg: '#08140f', fg: '#00E599', border: '#00E599' });
  sgn(g, 'PIONEER SQUARE HARDWARE', 9, 0.9, 5, 5.6, D / 2 + 0.2, 0, { bg: '#2a1c14', fg: '#d8c488' });
  // east side: big painted ad
  flat(g, mat('s5s_oldad'), 12, 6, W / 2 + 0.07, 12.4, 0, Math.PI / 2);
  for (const z of [-5.5, 0, 5.5]) { arch(W / 2 + 0.08, 6.9, z, Math.PI / 2, 2.2, 3.1, false); arch(W / 2 + 0.08, 2.6, z, Math.PI / 2, 3.4, 5.1, z > 3); }
  for (const z of [-5.5, 5.5]) arch(W / 2 + 0.08, 16.4, z, Math.PI / 2, 0.01, 0.01, false);
  // west side + back: windows and fire escapes
  for (const z of [-5.5, 0, 5.5]) { for (const y of [6.9, 10.5, 14.1]) arch(-W / 2 - 0.08, y, z, -Math.PI / 2, 2.2, 3.1, (z + y) % 5 === 0); arch(-W / 2 - 0.08, 2.6, z, -Math.PI / 2, 3.4, 5.1, false); }
  for (let i = 0; i < 7; i++) { const x = -15 + i * 5; for (const y of [6.9, 10.5, 14.1]) arch(x, y, -D / 2 - 0.08, Math.PI, 2.2, 3.1, (i + (y | 0)) % 6 === 0); arch(x, 2.6, -D / 2 - 0.08, Math.PI, 3.4, 5.1, false); }
  door(g, 1.7, 2.9, 5, 1.5, -D / 2 - 0.12, Math.PI, '#4a4a4a'); door(g, 2.2, 2.9, -2.5, 1.5, -D / 2 - 0.12, Math.PI, '#3a3a3a');
  fireEscape(g, 10, -D / 2 - 0.02, Math.PI, [4.7, 8.3, 11.9, 15.5]);
  fireEscape(g, -W / 2 - 0.02, -3, -Math.PI / 2, [4.7, 8.3, 11.9, 15.5], 3.4);
  Bx(g, 2.6, 1.8, 1.2, C(0x5a5e60), -10, 0.9, -D / 2 - 0.7, 1); Bx(g, 0.35, top, 0.35, C(0x44484a), -16.6, top / 2, -D / 2 - 0.3, 1);
  // roof: wooden water tank, chimneys, hatch
  const tx = -9, tz = 2.5;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Bx(g, 0.25, 1.8, 0.25, mat('planks'), tx + sx * 1.3, top + 1.4, tz + sz * 1.3, 1);
  Bx(g, 3.2, 0.2, 3.2, mat('planks'), tx, top + 2.4, tz, 1);
  Cy(g, 1.8, 1.9, 2.6, 12, mat('planks'), tx, top + 3.8, tz, 1.5); Ms(g, new THREE.ConeGeometry(2.0, 1.0, 12), mat('ironGrey'), tx, top + 5.6, tz);
  for (const y of [top + 3, top + 4.4]) Ms(g, new THREE.TorusGeometry(1.88, 0.05, 4, 14), dk, tx, y, tz, 1, 1, 1, Math.PI / 2);
  for (const [x, z] of [[12, 3], [-18, -4], [4, -2]]) Bx(g, 1.4, 3.2, 1.4, B, x, top + 2.3, z, 1.5);
  Bx(g, 2.2, 1.6, 2.2, C(0x5a5e60), 14, top + 1.5, -3, 1);
  return size(g, 36, 18, 21);
}

// =====================================================================
// 14. Gritty district props
// =====================================================================
const puddle = (g, x, z, rx, rz) => { const p = Ms(g, new THREE.CircleGeometry(1, 14), shiny(0x1a2228, 150), x, 0.03, z, rx, rz, 1, -Math.PI / 2); p.material = keyed('pud', () => new THREE.MeshPhongMaterial({ color: 0x151c22, shininess: 150, specular: 0x8899aa, transparent: true, opacity: 0.85 })); return p; };
export function boardedShop() {
  const g = G(), grime = mat('s5s_grime'), ply = mat('s5s_plywood'), dk = C(0x2a2a2c);
  Bx(g, 16, 6.4, 10, grime, 0, 3.2, 0, 4).material = [grime, grime, mat('roofTar'), mat('roofTar'), grime, grime];
  Bx(g, 16.5, 0.5, 10.5, C(0x58534c), 0, 6.55, 0, 3); Bx(g, 16.2, 0.9, 0.4, grime, 0, 7.0, 4.9, 2); Bx(g, 0.4, 0.9, 10.2, grime, 7.9, 7.0, 0, 2); Bx(g, 0.4, 0.9, 10.2, grime, -7.9, 7.0, 0, 2); Bx(g, 16.2, 0.9, 0.4, grime, 0, 7.0, -4.9, 2);
  // boarded windows and a roll shutter
  for (const s of [-1, 1]) {
    Bx(g, 5.2, 3.8, 0.2, dk, s * 4.8, 2.5, 5.02, 1);
    Bx(g, 4.8, 1.3, 0.14, ply, s * 4.8, 3.1, 5.16, 2); Bx(g, 4.8, 1.3, 0.14, ply, s * 4.8, 1.9, 5.16, 2).rotation.z = s * 0.03;
    Bx(g, 5.4, 0.35, 0.18, ply, s * 4.8, 2.5, 5.24, 2).rotation.z = s * 0.35;
  }
  Bx(g, 2.8, 3.4, 0.16, mat('s5s_corrug'), 0, 1.7, 5.07, 2.5);
  Bx(g, 3.0, 0.3, 0.3, dk, 0, 3.55, 5.12, 1);
  flat(g, mat('s5s_graffA'), 6.2, 1.55, -4.7, 1.0, 5.22, 0); flat(g, mat('s5s_graffC'), 3.6, 0.9, 5.6, 5.4, 5.07, 0);
  const sn = sgn(g, 'LUCKY MART', 6, 1.0, 0.8, 5.3, 5.2, 0, { bg: '#5e5238', fg: '#a89c78', border: '#7a6e50' }); sn.rotation.z = 0.04;
  Bx(g, 0.1, 0.3, 0.5, dk, -2.3, 5.5, 5.2, 1);
  const lease = sgn(g, 'FOR LEASE', 5.2, 1.0, -4.8, 3.9, 5.32, 0, { bg: '#c9c13a', fg: '#2a2418', border: '#2a2418' }); lease.rotation.z = -0.07;
  sgn(g, 'CALL NOW', 1.8, 0.5, 6.8, 3.0, 5.12, 0, { bg: '#d8d4c8', fg: '#2a2a2a' });
  // gutter, downpipe, vents, wires
  Bx(g, 16.4, 0.18, 0.3, C(0x4a4e50), 0, 6.1, 5.2, 1); Cy(g, 0.1, 0.1, 6, 6, C(0x4a4e50), 7.7, 3.0, 5.2, 1);
  puddle(g, 7.2, 6.4, 1.8, 0.9); puddle(g, -2.5, 6.6, 1.2, 0.6);
  // side (+x): graffiti + boarded windows;  west: windows
  flat(g, mat('s5s_graffB'), 8, 2.5, 8.07, 2.6, 0, Math.PI / 2);
  for (const z of [-3.2, 3.2]) { Bx(g, 0.14, 1.8, 1.6, ply, 8.1, 4.9, z, 2); }
  for (const z of [-3, 0, 3]) win(g, 1.3, 2.0, -8.07, 3.6, z, -Math.PI / 2, { fixed: true });
  // back: metal door, windows, AC unit, fire ladder
  door(g, 1.6, 2.6, 3, 1.4, -5.07, Math.PI, '#4a4e50'); Bx(g, 2.6, 0.2, 1.2, dk, 3, 2.9, -5.5, 1);
  for (const x of [-5, -1.5]) win(g, 1.3, 1.9, x, 3.4, -5.07, Math.PI, { fixed: true });
  win(g, 1.3, 1.9, -6, 4.8 - 0.0, -5.07, Math.PI, { fixed: true, lit: true });
  Bx(g, 1.8, 1.2, 1.1, C(0x6a6e70), -5, 0.7, -5.7, 1); Cy(g, 0.8, 0.8, 0.4, 10, dk, 6, 6.9, -2, 1); Bx(g, 1.2, 1.4, 1.2, C(0x5a5e60), -4, 7.6, 1, 1);
  Bx(g, 0.08, 6.6, 0.08, dk, -7.5, 3.3, -5.1, 1);
  flat(g, mat('s5s_graffA'), 5.5, 1.4, -1.5, 1.0, -5.07, Math.PI);
  puddle(g, 3.5, -6.6, 1.5, 0.8);
  return size(g, 16, 10, 8);
}
export function graffitiWall() {
  const g = G(), conc = mat('s5s_grime');
  Bx(g, 20, 4.8, 1, conc, 0, 2.4, 0, 3);
  Bx(g, 20.4, 0.3, 1.3, mat('concrete'), 0, 4.95, 0, 2);
  const f1 = flat(g, mat('s5s_graffA'), 19.6, 4.7, 0, 2.4, 0.505, 0); const f2 = flat(g, mat('s5s_graffB'), 19.6, 4.7, 0, 2.4, -0.505, Math.PI);
  for (let x = -10; x <= 10; x += 5) Bx(g, 0.7, 5.1, 1.5, mat('concrete'), x, 2.55, 0, 2);
  for (const x of [-9.6, 9.6]) Bx(g, 0.5, 0.5, 0.5, C(0x30343a), x, 5.45, 0, 1);
  Bx(g, 1.0, 1.0, 0.9, C(0x6a4a2a), 6, 0.5, 1.5, 1); Bx(g, 1.2, 0.08, 1.2, mat('planks'), -7, 0.6, -1.5, 1).rotation.z = 0.3;
  Ms(g, SPH(0.45, 7, 5), C(0x111318), -3, 0.35, 1.3, 1, 0.8, 1); Ms(g, SPH(0.4, 7, 5), C(0x181a20), -2.4, 0.3, 1.6);
  puddle(g, 2, 2, 2.4, 0.9); puddle(g, -5, -2, 1.5, 0.7);
  return size(g, 20.4, 3, 5.5);
}
export function dumpster() {
  const g = G(), body = mat('s5s_dumpG'), dk = C(0x1c2422);
  Bx(g, 3, 1.3, 1.6, body, 0, 0.95, 0, 2.5);
  Bx(g, 3.2, 0.1, 1.7, dk, 0, 0.3, 0, 1);
  const l1 = Bx(g, 1.55, 0.1, 1.7, dk, -0.8, 1.72, 0, 1); l1.rotation.z = 0.12; const l2 = Bx(g, 1.55, 0.1, 1.7, dk, 0.85, 1.9, 0, 1); l2.rotation.z = -0.5; l2.position.x = 1.2; l2.position.y = 2.0;
  for (const x of [-1.2, 1.2]) for (const z of [-0.6, 0.6]) Ms(g, new THREE.CylinderGeometry(0.14, 0.14, 0.12, 8), C(0x111111), x, 0.14, z, 1, 1, 1, Math.PI / 2);
  Ms(g, SPH(0.55, 7, 5), C(0x15171c), -0.5, 1.7, 0.1, 1, 0.8, 1); Ms(g, SPH(0.5, 7, 5), C(0x1d2024), -0.1, 1.75, -0.3); Bx(g, 0.6, 0.5, 0.5, C(0xb8a07a), -1.0, 1.8, -0.3, 1).rotation.y = 0.4;
  Ms(g, SPH(0.4, 7, 5), C(0x20242a), 1.9, 0.3, 0.9, 1, 0.8, 1); Bx(g, 0.5, 0.3, 0.5, C(0xb8a07a), 2.1, 0.25, -0.7, 1).rotation.y = 0.7;
  Bx(g, 0.3, 0.1, 1.7, dk, 1.6, 1.4, 0, 1);
  sgn(g, 'NO DUMPING', 1.4, 0.4, -0.2, 1.3, 0.83, 0, { bg: '#d8d4c8', fg: '#2a2a2a', border: null });
  puddle(g, 0.2, 1.5, 1.4, 0.5);
  return size(g, 3.4, 2.2, 2.4);
}
export function shippingContainerStack() {
  const g = G();
  const cont = (nm, x, y, z, ry = 0) => {
    const side = mat(nm), end = mat('s5s_contEnd'), roof = C(0x5a3a28);
    const b = Bx(g, 6, 2.6, 2.4, side, x, y, z, 2.6); b.material = [end, end, roof, roof, side, side]; b.rotation.y = ry;
    const rib = Bx(g, 6.1, 0.12, 2.5, C(0x30343a), x, y - 1.25, z, 1); rib.rotation.y = ry;
  };
  const names = ['s5s_contRust', 's5s_contBlue', 's5s_contGreen', 's5s_contOrange'];
  let k = 0;
  for (const x of [-3, 3]) for (const z of [-1.3, 1.3]) cont(names[k++ % 4], x, 1.3, z);
  cont(names[2], -3, 3.9, -1.3); cont(names[0], 3, 3.9, -1.3); cont(names[3], 3.2, 3.9, 1.3);
  cont(names[1], -2.7, 6.5, -1.3, 0.04); cont(names[0], 3.3, 6.5, 1.1);
  puddle(g, -2, 3.6, 2, 0.8);
  return size(g, 12.4, 5.4, 8);
}
export function neonSignPole() {
  const g = G(), pole = C(0x2a2e34), dk = C(0x15161a);
  Cy(g, 0.2, 0.28, 9.2, 8, pole, 0, 4.6, 0, 1); Cy(g, 0.45, 0.5, 0.6, 8, mat('concrete'), 0, 0.3, 0, 1);
  const board = (text, w, h, y, fg, bd, rx = 0) => {
    Bx(g, w + 0.3, h + 0.3, 0.3, dk, 0, y, 0.55, 1);
    for (const s of [1, -1]) { const p = sign(text, w, h, { bg: '#10090c', fg, border: bd }); p.position.set(0, y, 0.55 + s * 0.17); p.rotation.y = s > 0 ? 0 : Math.PI; g.add(p); }
    Bx(g, 0.12, 0.12, 0.45, dk, 0, y + h / 2 + 0.1, 0.4, 1);
  };
  board('PAWN', 2.8, 1.3, 8.2, '#ffc030', '#ff3a30');
  board('VAPE', 2.4, 1.1, 6.2, '#00E599', '#00E599');
  board('OPEN 24H', 1.9, 0.6, 4.7, '#ff4fa0', '#ff4fa0');
  const bulbs = []; for (let i = 0; i < 9; i++) { const g2 = new THREE.IcosahedronGeometry(0.09, 0); g2.translate(-1.35 + i * 0.34, 8.95, 0.7); bulbs.push(g2); }
  g.add(new THREE.Mesh(merge(bulbs), basic(0xfff0c0)));
  Bx(g, 1.2, 0.5, 0.5, C(0x4a4e52), 0.2, 3.2, 0.0, 1);
  puddle(g, 0.3, 1.3, 1.6, 0.8);
  return size(g, 3.4, 1.8, 9.6);
}
export function rustyFencing() {
  const g = G(), post = C(0x6a4430), chain = alphaMat('s5s_chain');
  for (let i = 0; i < 5; i++) { const p = Cy(g, 0.07, 0.08, 2.7, 6, post, -5 + i * 2.5, 1.35, 0, 1); if (i === 3) p.rotation.z = 0.12; }
  Bx(g, 10, 0.07, 0.07, post, 0, 2.62, 0, 1); Bx(g, 10, 0.06, 0.06, post, 0, 0.15, 0, 1);
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), chain); const u = p.geometry.attributes.uv; for (let k = 0; k < u.count; k++) u.setXY(k, u.getX(k) * 4, u.getY(k) * 4); p.position.set(-3.75 + i * 2.5, 1.4, 0); g.add(p); }
  const p4 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.3), chain); p4.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * 4; }); p4.position.set(3.75, 1.35, 0.15); p4.rotation.y = 0.0; p4.rotation.z = 0.12; g.add(p4);
  const pat = Bx(g, 2.2, 1.4, 0.05, mat('s5s_corrug'), -2.5, 0.9, 0.06, 2); pat.rotation.z = 0.08;
  const zig = []; for (let i = 0; i < 40; i++) zig.push([[-5 + i * 0.25, 2.72 + (i % 2) * 0.15, 0], [-5 + (i + 1) * 0.25, 2.72 + ((i + 1) % 2) * 0.15, 0.05]]);
  rods(g, zig, 0.015, C(0x4a4a4a), 3);
  sgn(g, 'KEEP OUT', 1.6, 0.6, 1.2, 1.7, 0.08, 0, { bg: '#c8a820', fg: '#201a10', border: '#201a10' });
  sgn(g, 'KEEP OUT', 1.6, 0.6, 1.2, 1.7, -0.08, Math.PI, { bg: '#c8a820', fg: '#201a10', border: '#201a10' });
  Bx(g, 0.6, 0.08, 0.3, post, 4.9, 0.1, 0.4, 1); Ms(g, SPH(0.3, 6, 4), C(0x3a3e30), -4.3, 0.2, 0.4, 1.5, 0.5, 0.7);
  return size(g, 10.4, 0.9, 2.9);
}

// =====================================================================
// 15. Mount Rainier (skyline backdrop, non-solid)
// =====================================================================
export function mountRainier() {
  const g = G(), rnd = mulberry(1889), N = 72;
  const base = [[150, 0], [134, 8], [112, 24], [92, 44], [72, 70], [54, 94], [38, 114], [24, 128], [14, 136], [8, 138.5], [0, 136]];
  const prof = [];   // double the rows (midpoints) for a more detailed silhouette
  for (let j = 0; j < base.length; j++) { prof.push(base[j]); if (j < base.length - 1) prof.push([(base[j][0] + base[j + 1][0]) / 2, (base[j][1] + base[j + 1][1]) / 2]); }
  const ph = []; for (let k = 0; k < 12; k++) ph.push(rnd() * 6.283);
  const ridge = (a) => { let t = 0; for (let k = 2; k < 12; k++) t += Math.sin(k * a + ph[k]) / k; return t * 0.55; };
  const V = [];
  for (let j = 0; j < prof.length; j++) {
    const row = [], last = j === prof.length - 1, hf = prof[j][1] / 138;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, amp = j === 0 ? 0.05 : 0.2 * (1 - hf * 0.5);
      const r = prof[j][0] * (1 + (last ? 0 : amp * (ridge(a) * (0.6 + hf) + (rnd() - 0.5) * 0.25)));
      const y = prof[j][1] + (j > 0 && !last ? (ridge(a * 2 + j) * 5 + (rnd() - 0.5) * 4) * (1 - hf * 0.4) : 0);
      row.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    V.push(row);
  }
  const pos = [], col = [], tmp = new THREE.Color(), sun = new THREE.Vector3(0.5, 0.65, 0.35).normalize();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nn = new THREE.Vector3(), haze = new THREE.Color(0x9aa8b2);
  const pick = (hexes) => hexes[(rnd() * hexes.length) | 0];
  const tri = (a, b, c, ang) => {
    const cy = (a[1] + b[1] + c[1]) / 3, snow = 78 + 10 * ridge(ang * 1.7) + 8 * Math.sin(ang * 3.0 + 1);
    e1.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); e2.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); nn.crossVectors(e1, e2).normalize();
    const cx = (a[0] + b[0] + c[0]) / 3, cz = (a[2] + b[2] + c[2]) / 3; if (nn.x * cx + nn.z * cz < 0) nn.negate();   // face outward
    const steep = 1 - Math.abs(nn.y);
    if (cy > snow && steep < 0.8) tmp.setHex(cy > snow + 14 ? pick([0xf4f8fb, 0xeaf1f7]) : pick([0xdbe6f0, 0xcfdce9]));
    else if (cy > snow - 10 && steep < 0.6) tmp.setHex(0xaec3d6);                            // glacier blue
    else if (cy > 52) tmp.setHex(pick([0x6f6a68, 0x7c726a, 0x5f5c5e, 0x84766a]));              // bare rock
    else if (cy > 26) tmp.setHex(pick([0x5f6b5c, 0x6a705c, 0x55624f]));                         // alpine meadow / scree
    else tmp.setHex(pick([0x2f4a36, 0x38543b, 0x2a4231, 0x41603f]));                           // fir forest
    const lit = 0.62 + 0.55 * Math.max(0, nn.dot(sun)) - 0.12 * steep;
    tmp.multiplyScalar(lit).lerp(haze, 0.22 + 0.2 * (1 - cy / 140));   // a little atmospheric haze, thicker low down
    for (const p of [a, b, c]) { pos.push(...p); col.push(tmp.r, tmp.g, tmp.b); }
  };
  for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < N; i++) {
    const i2 = (i + 1) % N, ang = (i / N) * Math.PI * 2;
    tri(V[j][i], V[j + 1][i], V[j][i2], ang); tri(V[j][i2], V[j + 1][i], V[j + 1][i2], ang);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(geo, keyed('rainier_basic', () => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false })));
  m.userData.keep = true;   // mergeStatic would drop the vertex colours
  g.add(m);
  // a lesser shoulder peak
  const sh = new THREE.Mesh(new THREE.ConeGeometry(34, 52, 9), keyed('rainier2b', () => new THREE.MeshBasicMaterial({ color: 0x7a7a78, fog: false }))); sh.position.set(84, 20, 28); sh.rotation.y = 0.4; g.add(sh);
  const sc = new THREE.Mesh(new THREE.ConeGeometry(12, 17, 9), keyed('rainier3b', () => new THREE.MeshBasicMaterial({ color: 0xe6eef5, fog: false }))); sc.position.set(84, 38, 28); sc.rotation.y = 0.4; g.add(sc);
  g.userData.solid = false;
  return size(g, 300, 300, 140, []);
}

// =====================================================================
// 16. Fir tree
// =====================================================================
export function firTree() {
  const g = G(), r = mulberry(31);
  const greens = [C(0x203a28), C(0x274630), C(0x1c3322), C(0x2c4a34)];
  Cy(g, 0.22, 0.34, 3.2, 6, C(0x4a3424), 0, 1.6, 0, 1);
  const L = [[1.5, 3.2, 2.6], [1.3, 5.2, 2.4], [1.1, 7.0, 2.2], [0.85, 8.8, 2.0], [0.55, 10.4, 1.7]];
  L.forEach(([rad, y, h], i) => { const c = new THREE.Mesh(new THREE.ConeGeometry(rad, h + 0.9, 8), greens[i % 4]); c.position.set((r() - 0.5) * 0.15, y + h / 2 - 0.3, (r() - 0.5) * 0.15); c.rotation.y = r() * 3; g.add(c); });
  Ms(g, new THREE.ConeGeometry(0.2, 1.4, 5), greens[1], 0, 11.6, 0);
  return size(g, 3, 3, 12, [[-0.4, 0.4, -0.4, 0.4, 12]]);
}
