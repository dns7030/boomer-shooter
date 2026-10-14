// Level 5 (Dubai in a yellow desert), set D: landmarks, enterable halls, the Royal Gold Palace and desert props.
// Same conventions as the other building files: origin = footprint centre on the ground, front faces +Z,
// userData = { w, d, h[, cols] }.  Textures are prefixed s5d_.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, decal } from './geo.js';
import { slab, tiledPlane, sign } from './buildings2.js';
import { addPainters, mulberry } from './textures.js';
import { hall } from './interiors.js';

const G = () => new THREE.Group();
const size = (g, w, d, h, cols) => { g.userData = { ...g.userData, w, d, h }; if (cols) g.userData.cols = cols; return g; };
const put = (g, m, x = 0, y = 0, z = 0, ry = 0) => { m.position.set(x, y, z); if (ry) m.rotation.y = ry; g.add(m); return m; };
const box = (g, w, h, d, m, x, y, z, tile = 2) => put(g, boxT(w, h, d, m, tile), x, y, z);
const cyl = (g, rt, rb, h, n, m, x, y, z, tile = 3) => put(g, cylT(rt, rb, h, n, m, tile), x, y, z);
const ball = (g, r, m, x, y, z, sx = 1, sy = 1, sz = 1, seg = 8) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), m); s.scale.set(sx, sy, sz); return put(g, s, x, y, z); };
const tcache = {};
const tm = (key, o) => tcache[key] || (tcache[key] = new THREE.MeshLambertMaterial(o));
const GOLD = () => color(0xf0bc2c, { emissive: 0x4d3503 });
const GOLD2 = () => color(0xc9941c, { emissive: 0x2a1c02 });
const NEO = () => color(0x00e599, { emissive: 0x00e599 });
const LAMP = () => color(0xffc060, { emissive: 0xff9a30 });
const DARK = () => color(0x2a2a2e);
const STEEL = () => color(0xc4ccd4);

function limb(g, a, b, r1, r2, m, seg = 6) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, d.length(), seg), m);
  mesh.position.copy(A).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  g.add(mesh); return mesh;
}
function scaleUV(geo, k) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k); return geo; }
// vertical prism from an XZ polygon
function prism(pts, h, m, tile = 4) {
  const s = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], -p[1])));
  const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 8 });
  geo.rotateX(-Math.PI / 2); scaleUV(geo, 1 / tile); return new THREE.Mesh(geo, m);
}
// prism from an XY polygon extruded along z (centred on z = 0)
function prismXY(pts, depth, m, tile = 4) {
  const s = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 });
  geo.translate(0, 0, -depth / 2); scaleUV(geo, 1 / tile); return new THREE.Mesh(geo, m);
}
function lathe(g, pts, seg, m, x, y, z) {
  const geo = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
  return put(g, new THREE.Mesh(geo, m), x, y, z);
}
function domePts(R, H, n = 8) {
  const p = [];
  for (let i = 0; i <= n; i++) { const t = i / n; p.push([Math.max(0.03, R * (1 + 0.14 * Math.sin(Math.PI * Math.min(1, t * 1.1))) * Math.sqrt(Math.max(0, 1 - Math.pow(t, 1.7)))), H * t]); }
  return p;
}
function dome(g, R, H, m, x, y, z, finial = null, seg = 12) {
  lathe(g, domePts(R, H), seg, m, x, y, z);
  if (finial) { cyl(g, 0.08 * R, 0.14 * R, finial, 6, finial === 0 ? m : GOLD(), x, y + H + finial / 2 - 0.2, z, 1); ball(g, 0.2 * R + 0.1, GOLD(), x, y + H + finial, z, 1, 1, 1, 6); }
}
// windows / doors on one side of a building: side 'S'|'N'|'E'|'W', fixed = coordinate of the wall plane, along = positions along it
function wins(g, side, fixedC, along, ys, ww, wh, o = {}) {
  const fixed = o.fixed ?? side !== 'S';
  for (const a of along) for (const y of ys) {
    const lit = o.lit ? o.lit(a, y) : false;
    const d = decal(o.kind || 'window', ww, wh, 0, y, 0, { c: o.c || '#8a5a2a', lit: !!lit, fixed });
    const off = o.off ?? 0.07;
    if (side === 'S') d.position.set(a, y, fixedC + off);
    else if (side === 'N') { d.position.set(a, y, fixedC - off); d.rotation.y = Math.PI; }
    else if (side === 'E') { d.position.set(fixedC + off, y, a); d.rotation.y = Math.PI / 2; }
    else { d.position.set(fixedC - off, y, a); d.rotation.y = -Math.PI / 2; }
    g.add(d);
  }
}
const doors = (g, side, fixedC, along, y, w, h, c = '#5a3418') => wins(g, side, fixedC, along, [y], w, h, { kind: 'door', c, off: 0.08 });
const arches = (g, side, fixedC, along, y, w, h) => wins(g, side, fixedC, along, [y], w, h, { kind: 'arch', off: 0.09 });

// ---------- textures ----------
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const sp = (g, rnd, n, cols, w = 64, h = 64) => { for (let i = 0; i < n; i++) R(g, (rnd() * w) | 0, (rnd() * h) | 0, 1 + ((rnd() * 2) | 0), 1, cols[(rnd() * cols.length) | 0]); };
const glassP = (seed, pal, mull, span) => (g) => {
  const r = mulberry(seed);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) R(g, x * 8, y * 8, 8, 8, pal[(r() * pal.length) | 0]);
  for (let x = 0; x < 64; x += 8) R(g, x, 0, 1, 64, mull);
  for (let y = 0; y < 64; y += 16) { R(g, 0, y, 64, 2, span); R(g, 0, y + 2, 64, 1, 'rgba(0,0,0,0.18)'); }
};
addPainters({
  s5d_glass: glassP(501, ['#86afcd', '#7aa2c2', '#92b8d2', '#6f98ba', '#a3c4da'], '#d5dde3', '#9aa9b5'),
  s5d_glassTw: glassP(502, ['#5f9fb2', '#6aa9ba', '#528fa4', '#78b2c2', '#4d869c'], '#cfdadd', '#8fa6ad'),
  s5d_goldleaf(g) {
    const r = mulberry(503); R(g, 0, 0, 64, 64, '#e9b72e');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = i * 16, y = j * 16;
      R(g, x + 1, y + 1, 14, 14, (i + j) & 1 ? '#f4c848' : '#e3ac26'); R(g, x, y, 16, 1, '#fff0a0'); R(g, x, y, 1, 16, '#fff0a0'); R(g, x + 15, y, 1, 16, '#9a6a10'); R(g, x, y + 15, 16, 1, '#9a6a10');
      g.fillStyle = '#fde27c'; g.beginPath(); g.moveTo(x + 8, y + 3); g.lineTo(x + 13, y + 8); g.lineTo(x + 8, y + 13); g.lineTo(x + 3, y + 8); g.fill(); R(g, x + 7, y + 7, 2, 2, '#b47a14');
    }
    sp(g, r, 70, ['#fff6c0', '#ffffff', '#fff0a0']);
  },
  s5d_goldclad(g) {
    for (let x = 0; x < 64; x += 8) { R(g, x, 0, 3, 64, '#f0c850'); R(g, x + 3, 0, 4, 64, '#d9a62a'); R(g, x + 7, 0, 1, 64, '#8a5a0c'); }
    for (let y = 0; y < 64; y += 16) { R(g, 0, y, 64, 1, '#fff0a8'); R(g, 0, y + 1, 64, 2, '#a8741a'); }
    R(g, 0, 30, 64, 4, '#2c4a5c'); R(g, 0, 31, 64, 1, '#6a8ea4');
  },
  s5d_sandstone(g) {
    const r = mulberry(504); R(g, 0, 0, 64, 64, '#d6b583');
    for (let y = 0; y < 64; y += 8) { const o = (y / 8) % 2 ? 8 : 0; for (let x = -16; x < 64; x += 16) R(g, x + o + 1, y + 1, 15, 7, ['#dcbd8c', '#d1b07c', '#e0c494', '#cba978'][(r() * 4) | 0]); R(g, 0, y, 64, 1, '#b08e62'); }
    sp(g, r, 120, ['#c0a070', '#e8d0a0']);
  },
  s5d_sandhouse(g) {
    const r = mulberry(505); R(g, 0, 0, 64, 64, '#dcbb88');
    for (let i = 0; i < 26; i++) R(g, (r() * 60) | 0, (r() * 60) | 0, 3 + ((r() * 8) | 0), 3 + ((r() * 6) | 0), ['#d2af7a', '#e4c797', '#c9a56f'][(r() * 3) | 0]);
    R(g, 0, 56, 64, 8, '#c4a070'); R(g, 0, 0, 64, 2, '#e8d2a8'); sp(g, r, 140, ['#b8956a', '#efd9b0']);
  },
  s5d_windslot(g) {
    const r = mulberry(506); R(g, 0, 0, 64, 64, '#cfa874');
    for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) { R(g, 6 + k * 16, 6 + j * 28, 6, 22, '#2a1c10'); R(g, 6 + k * 16, 6 + j * 28, 6, 3, '#120a04'); }
    R(g, 0, 0, 64, 3, '#e8d2a8'); R(g, 0, 60, 64, 4, '#e8d2a8'); sp(g, r, 100, ['#b8956a', '#e2c692']);
  },
  s5d_calli(g) {   // museum skin: silver-white with dark swirling glyph cut-outs
    const r = mulberry(507); R(g, 0, 0, 64, 64, '#e6e9eb');
    for (let y = 0; y < 64; y += 32) R(g, 0, y, 64, 1, '#c8ced2');
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let k = 0; k < 7; k++) {
      const x0 = (r() * 56) | 0, y0 = (r() * 56) | 0;
      g.strokeStyle = '#1d2b33'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0 + 6);
      g.bezierCurveTo(x0 + 6, y0 - 4, x0 + 12, y0 + 12, x0 + 18, y0 + 2); g.bezierCurveTo(x0 + 22, y0 - 4, x0 + 26, y0 + 8, x0 + 30, y0 + 4); g.stroke();
      g.lineWidth = 2; g.beginPath(); g.arc(x0 + 8 + r() * 10, y0 + 12, 3 + r() * 2, 0, 6.3); g.stroke();
      R(g, x0 + 10, y0 - 3, 2, 2, '#1d2b33'); R(g, x0 + 14, y0 - 6, 2, 2, '#1d2b33');
    }
    for (let k = 0; k < 4; k++) { g.strokeStyle = '#4a6a78'; g.lineWidth = 1; g.beginPath(); g.moveTo((r() * 60) | 0, (r() * 60) | 0); g.bezierCurveTo((r() * 64) | 0, (r() * 64) | 0, (r() * 64) | 0, (r() * 64) | 0, (r() * 64) | 0, (r() * 64) | 0); g.stroke(); }
  },
  s5d_arcade(g) {  // souk exterior: sandstone with big arches and a gold frieze
    const r = mulberry(508); R(g, 0, 0, 64, 64, '#dcc08e');
    for (let y = 0; y < 64; y += 8) R(g, 0, y, 64, 1, '#c4a574'); sp(g, r, 140, ['#c8aa78', '#ecd4a2']);
    for (const ax of [0, 32]) {
      R(g, ax + 3, 17, 26, 47, '#f0dcae'); g.fillStyle = '#4a2c16'; g.beginPath(); g.moveTo(ax + 6, 64); g.lineTo(ax + 6, 32); g.arc(ax + 16, 32, 10, Math.PI, 0); g.lineTo(ax + 26, 64); g.fill();
      R(g, ax + 9, 40, 14, 3, '#d9a62a'); R(g, ax + 10, 46, 12, 18, '#2a1808'); R(g, ax + 14, 34, 4, 3, '#ffd24a');
    }
    R(g, 0, 4, 64, 4, '#d9a62a'); R(g, 0, 8, 64, 1, '#8a5a0c'); R(g, 0, 3, 64, 1, '#fff0a0');
  },
  s5d_soukwall(g) {
    const r = mulberry(509); R(g, 0, 0, 64, 64, '#e8c88a'); sp(g, r, 100, ['#d8b878', '#f2dcae']);
    R(g, 0, 0, 64, 6, '#2a6a7a'); R(g, 0, 6, 64, 2, '#d9a62a'); R(g, 0, 46, 64, 18, '#7a3a22'); R(g, 0, 46, 64, 2, '#d9a62a');
    for (let x = 0; x < 64; x += 8) { R(g, x + 2, 50, 4, 10, '#c05a38'); R(g, x + 3, 52, 2, 6, '#e8c88a'); R(g, x + 3, 1, 2, 4, '#e8c88a'); }
  },
  s5d_soukfloor(g) {
    const r = mulberry(510); R(g, 0, 0, 64, 64, '#d8b080');
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const X = x * 32, Y = y * 32; R(g, X + 2, Y + 2, 28, 28, '#c9a070'); g.fillStyle = '#3a7a8a'; g.beginPath(); g.moveTo(X + 16, Y + 4); g.lineTo(X + 28, Y + 16); g.lineTo(X + 16, Y + 28); g.lineTo(X + 4, Y + 16); g.fill();
      g.fillStyle = '#b8452a'; g.beginPath(); g.moveTo(X + 16, Y + 9); g.lineTo(X + 23, Y + 16); g.lineTo(X + 16, Y + 23); g.lineTo(X + 9, Y + 16); g.fill(); R(g, X + 14, Y + 14, 4, 4, '#e8c050');
    }
    R(g, 0, 0, 64, 1, '#8a6a40'); R(g, 0, 32, 64, 1, '#8a6a40'); R(g, 0, 0, 1, 64, '#8a6a40'); R(g, 32, 0, 1, 64, '#8a6a40'); sp(g, r, 80, ['#00000018', '#ffffff22']);
  },
  s5d_soukceil(g) {
    R(g, 0, 0, 64, 64, '#6a3e22');
    const pal = ['#d9382a', '#e8a020', '#2a8a8a', '#c0306a'];
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { R(g, x * 32 + 3, y * 32 + 3, 26, 26, pal[(x + y * 2) % 4]); for (let k = 0; k < 26; k += 4) R(g, x * 32 + 3 + k, y * 32 + 3, 2, 26, 'rgba(255,255,255,0.22)'); R(g, x * 32 + 14, y * 32 + 14, 4, 4, '#ffd24a'); }
  },
  s5d_rug(g) {
    R(g, 0, 0, 64, 64, '#8a1a22'); R(g, 2, 2, 60, 60, '#e8c070'); R(g, 5, 5, 54, 54, '#1a3a6a'); R(g, 8, 8, 48, 48, '#8a1a22');
    g.fillStyle = '#e8c070'; g.beginPath(); g.moveTo(32, 12); g.lineTo(52, 32); g.lineTo(32, 52); g.lineTo(12, 32); g.fill(); g.fillStyle = '#1a3a6a'; g.beginPath(); g.moveTo(32, 18); g.lineTo(46, 32); g.lineTo(32, 46); g.lineTo(18, 32); g.fill();
    g.fillStyle = '#c0382a'; g.beginPath(); g.arc(32, 32, 6, 0, 6.3); g.fill(); R(g, 30, 30, 4, 4, '#e8c070');
    for (let i = 0; i < 64; i += 4) { R(g, i, 0, 2, 2, '#f4ecd2'); R(g, i, 62, 2, 2, '#f4ecd2'); }
  },
  s5d_textile(g) {
    const pal = ['#e8a020', '#c0306a', '#1f8a8a', '#2a3a9a', '#d9382a', '#5a9a2a'];
    for (let x = 0; x < 64; x += 8) { R(g, x, 0, 8, 64, pal[(x / 8) % pal.length]); R(g, x + 3, 0, 2, 64, 'rgba(255,255,255,0.3)'); }
    for (let y = 6; y < 64; y += 14) { R(g, 0, y, 64, 2, '#ffd24a'); for (let x = 2; x < 64; x += 8) R(g, x, y + 3, 4, 3, 'rgba(0,0,0,0.25)'); }
  },
  s5d_mallglass(g) {
    for (let y = 0; y < 64; y++) R(g, 0, y, 64, 1, `rgb(${70 + (y >> 2)},${112 + (y >> 2)},${150 + (y >> 2)})`);
    const r = mulberry(511); for (let i = 0; i < 12; i++) R(g, (r() * 56) | 0, (r() * 56) | 0, 6 + ((r() * 10) | 0), 6, 'rgba(255,255,255,0.18)');
    for (let x = 0; x < 64; x += 16) R(g, x, 0, 2, 64, '#aab4bc'); for (let y = 0; y < 64; y += 16) R(g, 0, y, 64, 2, '#aab4bc'); R(g, 0, 30, 64, 4, '#e8ecee');
  },
  s5d_mallwall(g) {   // interior: three storeys of lit shop windows
    const r = mulberry(512); R(g, 0, 0, 64, 64, '#efe6d2');
    const cols = ['#ffe6a8', '#fff2d0', '#ffd0a0', '#d8ecff', '#ffc8d8', '#d8f0c8'];
    for (let f = 0; f < 3; f++) {
      const y = f * 21;
      for (let m = 0; m < 4; m++) { const x = m * 16; R(g, x + 1, y + 6, 14, 12, '#3a3f48'); R(g, x + 2, y + 7, 12, 10, cols[(r() * cols.length) | 0]); R(g, x + 2, y + 7, 12, 2, 'rgba(255,255,255,0.4)'); for (let k = 0; k < 3; k++) R(g, x + 3 + k * 4, y + 12, 2, 5, ['#c0382a', '#2a5aa8', '#e0a020'][(r() * 3) | 0]); R(g, x + 1, y + 2, 14, 3, '#2a2f38'); R(g, x + 3, y + 3, 10, 1, '#ffd24a'); }
      R(g, 0, y + 18, 64, 2, '#b8b2a2'); R(g, 0, y + 20, 64, 1, '#8a8678');
    }
  },
  s5d_shopglass(g) {
    const r = mulberry(513); R(g, 0, 0, 64, 64, '#2a2f38');
    R(g, 2, 2, 60, 60, '#ffeab8'); for (let i = 0; i < 12; i++) R(g, 4 + ((r() * 50) | 0), 6 + ((r() * 40) | 0), 6, 10, ['#c0382a', '#2a5aa8', '#e0a020', '#1f8a8a', '#c0306a'][(r() * 5) | 0]);
    R(g, 2, 44, 60, 3, '#8a8070'); R(g, 31, 2, 2, 60, '#2a2f38'); R(g, 2, 2, 60, 4, 'rgba(255,255,255,0.5)');
  },
  s5d_mallfloor(g) {
    R(g, 0, 0, 64, 64, '#efe8d8'); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) R(g, x * 32 + 1, y * 32 + 1, 30, 30, (x + y) & 1 ? '#e2d8c2' : '#f4eee0');
    g.fillStyle = '#b89a60'; g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 32); g.lineTo(32, 64); g.lineTo(0, 32); g.fill(); g.fillStyle = '#f4eee0'; g.beginPath(); g.moveTo(32, 10); g.lineTo(54, 32); g.lineTo(32, 54); g.lineTo(10, 32); g.fill();
    R(g, 0, 0, 64, 1, '#a89878'); R(g, 0, 0, 1, 64, '#a89878');
  },
  s5d_skylight(g) {
    R(g, 0, 0, 64, 64, '#cfe9f8'); for (let i = 0; i < 64; i += 16) { R(g, i, 0, 2, 64, '#8a9aa6'); R(g, 0, i, 64, 2, '#8a9aa6'); } R(g, 0, 0, 64, 64, 'rgba(255,255,255,0.18)');
  },
  s5d_metal(g) {
    const r = mulberry(514); R(g, 0, 0, 64, 64, '#b4bec8');
    for (let x = 0; x < 64; x += 16) { R(g, x, 0, 1, 64, '#8a96a2'); R(g, x + 1, 0, 1, 64, '#dfe6ec'); for (let y = 4; y < 64; y += 12) R(g, x + 8, y, 1, 1, '#6a7682'); }
    for (let y = 0; y < 64; y += 32) R(g, 0, y, 64, 2, '#8a96a2'); sp(g, r, 90, ['#c8d2da', '#a2adb8']);
  },
  s5d_snow(g) {
    const r = mulberry(515); R(g, 0, 0, 64, 64, '#f2f7fc'); sp(g, r, 150, ['#dce8f4', '#ffffff', '#c8d8ea']);
  },
  s5d_sail(g) {
    R(g, 0, 0, 64, 64, '#f6f5f0'); for (let y = 0; y < 64; y += 8) { R(g, 0, y, 64, 1, '#d2d6da'); } for (let x = 0; x < 64; x += 16) R(g, x, 0, 1, 64, '#dfe2e4');
  },
  s5d_trunk(g) {
    const r = mulberry(516); R(g, 0, 0, 64, 64, '#8a6a44');
    for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) { const o = (y / 8) % 2 ? 4 : 0; R(g, x + o, y, 5, 4, '#6e5232'); R(g, x + o + 1, y + 4, 5, 3, '#a2825a'); }
    sp(g, r, 50, ['#5a4228', '#b8966a']);
  },
}, { s5d_sandstone: [64, 64] });

// ---------- palms (shared) ----------
let leafGeo = null;
function getLeaf() {
  if (leafGeo) return leafGeo;
  const n = 6, pos = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = t, y = 0.38 * t - 0.75 * t * t, w = 0.21 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.04)), 0.6) + 0.01;
    pos.push(x, y, -w, x, y, w);
  }
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  leafGeo = new THREE.BufferGeometry(); leafGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); leafGeo.setIndex(idx); leafGeo.computeVertexNormals();
  return leafGeo;
}
function palmTree({ h = 10, trunk, leaf, fronds = 13, len = 3.5, lean = 0.5, dates = false, seed = 7, rBase = 0.42 }) {
  const g = G(), r = mulberry(seed);
  let x = 0, y = 0; const segs = 3, sh = h / segs;
  for (let i = 0; i < segs; i++) {
    const rb = rBase - i * 0.06, dx = lean / segs;
    const m = cylT(rb - 0.05, rb, sh * 1.04, 7, trunk, 2); m.position.set(x + dx / 2, y + sh / 2, 0); m.rotation.z = -Math.atan2(dx, sh); g.add(m); x += dx; y += sh;
  }
  ball(g, 0.5, color(0x6a4a2a), x, y, 0, 1, 0.8, 1, 6);
  for (let k = 0; k < fronds; k++) {
    const pv = new THREE.Group(); pv.position.set(x, y, 0); pv.rotation.y = (k / fronds) * Math.PI * 2 + r() * 0.3;
    const lf = new THREE.Mesh(getLeaf(), leaf); lf.rotation.z = 0.7 - (k % 3) * 0.45 + r() * 0.2; lf.scale.setScalar(len * (0.85 + r() * 0.3)); pv.add(lf); g.add(pv);
  }
  if (dates) for (let k = 0; k < 6; k++) { const a = k * 1.05; ball(g, 0.2, color(0xc0601c), x + Math.cos(a) * 0.5, y - 0.6 - (k % 2) * 0.2, Math.sin(a) * 0.5, 1, 1.3, 1, 5); }
  return g;
}
const palmLeaf = () => tm('palmleaf', { color: 0x3f7a2a, side: THREE.DoubleSide });
const goldLeaf = () => tm('goldleaf', { color: 0xe6b22a, emissive: 0x3c2802, side: THREE.DoubleSide });
export function datePalm(opts = {}) { return size(palmTree({ h: 10.5, trunk: mat('s5d_trunk'), leaf: palmLeaf(), dates: true, seed: opts.seed || 7 }), 4, 4, 12); }
export function goldPalm(opts = {}) { return size(palmTree({ h: 10.5, trunk: mat('s5d_goldleaf'), leaf: goldLeaf(), len: 3.6, seed: opts.seed || 11, rBase: 0.45 }), 4, 4, 12); }
function miniPalm(h = 4.4, gold = false) { return palmTree({ h, trunk: gold ? mat('s5d_goldleaf') : mat('s5d_trunk'), leaf: gold ? goldLeaf() : palmLeaf(), len: h * 0.38, fronds: 9, lean: 0.3, rBase: 0.2, seed: 3 }); }

// ---------- props ----------
export function goldCamelStatue() {
  const g = G(), gd = GOLD(), y0 = 0.9;
  box(g, 5, 0.9, 3, mat('s5d_sandstone'), 0, 0.45, 0, 2);
  box(g, 5.3, 0.14, 3.3, GOLD2(), 0, 0.93, 0);
  box(g, 2.2, 0.28, 0.06, NEO(), 0, 0.45, 1.53);
  ball(g, 1, gd, 0, y0 + 1.75, 0, 1.55, 0.62, 0.68, 10);
  ball(g, 0.5, gd, -0.15, y0 + 2.32, 0, 1, 1.1, 0.9, 8);
  for (const [lx, lz] of [[-0.95, -0.38], [-0.95, 0.38], [1.0, -0.38], [1.0, 0.38]]) { cyl(g, 0.12, 0.17, 1.15, 6, gd, lx, y0 + 0.62, lz, 1); ball(g, 0.19, gd, lx, y0 + 0.08, lz, 1.4, 0.5, 1.2, 5); }
  limb(g, [1.25, y0 + 1.9, 0], [2.0, y0 + 2.75, 0], 0.3, 0.17, gd, 7);
  ball(g, 0.34, gd, 2.25, y0 + 2.9, 0, 1.5, 0.8, 0.8, 8);
  ball(g, 0.2, gd, 2.62, y0 + 2.8, 0, 1.3, 0.9, 0.9, 6);
  ball(g, 0.07, DARK(), 2.35, y0 + 3.02, 0.26, 1, 1, 1, 4); ball(g, 0.07, DARK(), 2.35, y0 + 3.02, -0.26, 1, 1, 1, 4);
  limb(g, [-1.5, y0 + 1.9, 0], [-1.85, y0 + 1.0, 0], 0.1, 0.05, gd, 5); ball(g, 0.14, gd, -1.88, y0 + 0.9, 0, 1, 1.5, 1, 5);
  const sad = box(g, 0.9, 0.12, 1.1, color(0xb8352a), -0.15, y0 + 2.0, 0, 1); sad.rotation.z = 0.0;
  return size(g, 5, 3, 4);
}
export function sandDune() {
  const g = G(), W = 60, D = 40, geo = new THREE.PlaneGeometry(W, D, 24, 16); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), u = x / (W / 2), v = z / (D / 2);
    const zc = 3 * Math.sin(x * 0.09), dz = z - zc, wd = dz < 0 ? 17 : 8;
    const e = Math.pow(Math.max(0, Math.cos(u * Math.PI / 2)), 0.8) * (0.88 + 0.12 * Math.cos(u * 9));
    const f = Math.max(0, 1 - Math.pow(Math.abs(v), 2.6));
    const y = 10.4 * Math.exp(-Math.pow(dz / wd, 2)) * e * f;
    p.setY(i, y); const t = Math.min(1, y / 10), lee = dz > 0 ? 0.08 : 0;
    col.push(0.93 - lee + 0.05 * t, 0.77 - lee + 0.1 * t, 0.45 - lee * 0.8 + 0.18 * t);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, tm('dune', { vertexColors: true, flatShading: true })));
  return size(g, 60, 40, 10);
}
export function sandstoneWall() {
  const g = G(), st = mat('s5d_sandstone');
  box(g, 20, 2.6, 1.0, st, 0, 1.3, 0, 3); box(g, 20.4, 0.3, 1.25, st, 0, 2.75, 0, 3);
  for (let i = 0; i < 12; i++) box(g, 0.9, 0.6, 0.9, st, -9.4 + i * 1.7, 3.2, 0, 2);
  for (const x of [-9.7, -3.2, 3.2, 9.7]) {
    box(g, 1.2, 3.1, 1.2, st, x, 1.55, 0, 3); box(g, 1.5, 0.3, 1.5, st, x, 3.2, 0, 3);
    box(g, 0.34, 0.5, 0.34, LAMP(), x, 3.62, 0, 1); put(g, new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.35, 4), GOLD2()), x, 4.0, 0).rotation.y = 0.78;
  }
  for (const x of [-6.45, 0, 6.45]) for (const s of [1, -1]) {
    const d = decal('arch', 3.2, 2.2, x, 1.2, s * 0.53, {}); if (s < 0) d.rotation.y = Math.PI; g.add(d);
    box(g, 0.25, 0.4, 0.25, LAMP(), x, 2.0, s * 0.62, 1);
  }
  return size(g, 20, 1.3, 4.1);
}
export function lanternPost() {
  const g = G(), br = color(0x3a2a1c);
  cyl(g, 0.22, 0.28, 0.5, 8, br, 0, 0.25, 0, 1); cyl(g, 0.07, 0.1, 3.7, 6, br, 0, 2.35, 0, 1);
  box(g, 0.5, 0.08, 0.5, br, 0, 4.12, 0, 1);
  box(g, 0.34, 0.5, 0.34, LAMP(), 0, 4.42, 0, 1);
  for (const [x, z] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) box(g, 0.05, 0.56, 0.05, br, x, 4.42, z, 1);
  put(g, new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.34, 4), br), 0, 4.82, 0).rotation.y = 0.78;
  ball(g, 0.06, GOLD(), 0, 5.04, 0, 1, 1, 1, 5);
  return size(g, 0.6, 0.6, 5.1);
}
export function coffeePotMonument() {
  const g = G(), gold = GOLD(), brass = GOLD2();
  cyl(g, 2.4, 2.5, 1.1, 8, mat('s5d_sandstone'), 0, 0.55, 0, 2); cyl(g, 2.1, 2.3, 0.2, 8, brass, 0, 1.2, 0, 1);
  const body = [[0.01, 0], [1.2, 0], [1.5, 0.25], [1.82, 1.1], [1.9, 2.0], [1.7, 3.0], [1.25, 3.9], [0.9, 4.5], [0.78, 5.0], [0.95, 5.3], [1.05, 5.55], [0.01, 5.55]];
  lathe(g, body, 14, gold, 0, 1.3, 0);
  for (const [y, r] of [[1.45, 1.62], [2.5, 1.96], [3.5, 1.5]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 5, 16), DARK()); t.rotation.x = Math.PI / 2; put(g, t, 0, 1.3 + y, 0); }
  for (let k = 0; k < 8; k++) { const a = k * 0.785; ball(g, 0.14, color(0xd0103a, { emissive: 0x500410 }), Math.cos(a) * 1.93, 1.3 + 2.0, Math.sin(a) * 1.93, 1, 1, 1, 5); }
  lathe(g, [[0.01, 0], [0.9, 0], [0.8, 0.3], [0.45, 0.65], [0.15, 0.85], [0.01, 0.9]], 10, brass, 0, 6.85, 0);
  ball(g, 0.15, gold, 0, 7.85, 0, 1, 1, 1, 6);
  limb(g, [1.55, 2.4, 0], [1.85, 3.6, 0], 0.5, 0.34, gold, 7); limb(g, [1.85, 3.6, 0], [2.15, 5.0, 0], 0.34, 0.24, gold, 7); limb(g, [2.15, 5.0, 0], [2.35, 6.3, 0], 0.24, 0.17, gold, 7);
  limb(g, [2.35, 6.3, 0], [2.0, 6.95, 0], 0.17, 0.09, gold, 6);
  const h = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.13, 6, 12, Math.PI), brass); h.rotation.z = Math.PI / 2; put(g, h, -1.7, 5.6, 0);
  put(g, new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.06, 4, 20), NEO()), 0, 1.31, 0).rotation.x = Math.PI / 2;
  return size(g, 5, 5, 9);
}

// ---------- 1. Burj tower: Y-shaped plan, spiralling setbacks, long spire ----------
export function burjTower() {
  const g = G(), gl = mat('s5d_glass'), conc = mat('concrete'), cols = [];
  cyl(g, 13.5, 14.5, 2, 14, conc, 0, 1, 0, 4);
  box(g, 11, 4.5, 3, gl, 0, 2.25, 14, 8); box(g, 12, 0.4, 4, STEEL(), 0, 4.6, 14, 4);
  g.add(decal('door', 3, 3.4, 0, 1.7, 15.55, { c: '#9aa6b0' }));
  wins(g, 'S', 15.5, [-3.6, 3.6], [2.4], 1.6, 2.4, { c: '#d0d8de', fixed: false });
  const angs = [Math.PI, Math.PI / 3, -Math.PI / 3], H = 9;
  for (let i = 0; i < 3; i++) {
    const a = angs[i];
    for (let t = 0; t < 8; t++) {
      const Rr = 15.5 - 1.6 * (t + i / 3);
      if (Rr < 4.7) continue;
      const mid = (1.5 + Rr) / 2, m = boxT(6, H, Rr - 1.5, gl, 16);
      m.position.set(Math.sin(a) * mid, 2 + t * H + H / 2, Math.cos(a) * mid); m.rotation.y = a; g.add(m);
      const cap = boxT(6.4, 0.4, Rr - 1.3, STEEL(), 4); cap.position.set(Math.sin(a) * mid, 2 + (t + 1) * H + 0.1, Math.cos(a) * mid); cap.rotation.y = a; g.add(cap);
      const rnd = cyl(g, 3, 3, H, 8, gl, Math.sin(a) * (Rr - 3), 2 + t * H + H / 2, Math.cos(a) * (Rr - 3), 16); rnd.scale.set(0.95, 1, 0.95);
    }
  }
  cyl(g, 4.6, 4.8, 74, 6, gl, 0, 39, 0, 16);
  cyl(g, 3.8, 4.2, 12, 6, gl, 0, 80, 0, 16); box(g, 7.8, 0.4, 7.8, STEEL(), 0, 86.2, 0, 4).rotation.y = 0.52;
  cyl(g, 3.0, 3.6, 8, 6, gl, 0, 90, 0, 16); cyl(g, 2.2, 2.8, 7, 6, STEEL(), 0, 97.5, 0, 6);
  cyl(g, 1.0, 1.9, 8, 8, STEEL(), 0, 101, 0, 4); cyl(g, 0.25, 0.9, 12, 6, STEEL(), 0, 106, 0, 4);
  ball(g, 0.4, NEO(), 0, 112, 0, 1, 1, 1, 5);
  for (const y of [86, 96]) ball(g, 0.3, color(0xff3020, { emissive: 0xff2010 }), 2.4, y, 0, 1, 1, 1, 4);
  cols.push([-5.4, 5.4, -5.4, 5.4, 112]);
  return size(g, 30, 30, 112, cols);
}

// ---------- 2. Burj-al-Arab style sail hotel on its island ----------
export function burjAlArab() {
  const g = G(), cols = [], gl = mat('s5d_glass'), sand = mat('s5d_sandstone'), steel = STEEL();
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.2, 24), mat('water')); pool.scale.set(27, 1, 13); put(g, pool, 0, 0.1, 0);
  const isl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.06, 0.9, 20), color(0xe0c898)); isl.scale.set(10, 1, 11.5); put(g, isl, -17, 0.45, -1);
  // causeway
  box(g, 5, 0.5, 5, color(0xcfc3a8), -16, 0.45, 11, 2); for (const s of [-1, 1]) box(g, 0.18, 1.0, 5, steel, -16 + s * 2.4, 1.2, 11, 1);
  // podium and tower
  box(g, 16, 9, 17, sand, -17, 4.5, -3.5, 4); box(g, 17, 0.5, 18, color(0xf2ecdc), -17, 9.25, -3.5, 4);
  box(g, 12, 48, 13, gl, -19, 33, -4, 16); box(g, 12.6, 0.6, 13.6, steel, -19, 57.3, -4, 4);
  put(g, new THREE.Mesh(new THREE.ConeGeometry(0.5, 6, 5), steel), -19, 60.6, -4);
  box(g, 5.6, 7, 4, gl, -23, 8.5, 6.2, 8);
  g.add(decal('door', 3.4, 3.6, -22.8, 1.8, 8.28, { c: '#c9a24a' }));
  wins(g, 'S', 8.2, [-27.4 + 8], [6], 1.6, 2.2, { c: '#d9d2c0', fixed: false });
  // sail: translucent white panel, concave leading edge, in front of the tower
  const sh = new THREE.Shape(); sh.moveTo(-26, 8); sh.lineTo(-26, 60); sh.quadraticCurveTo(-4, 19, 26, 8); sh.lineTo(-26, 8);
  const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: false, curveSegments: 14 }); scaleUV(sg, 1 / 16); sg.translate(0, 0, 5.4);
  const sail = new THREE.Mesh(sg, tm('sail', { map: mat('s5d_sail').map, transparent: true, opacity: 0.88, side: THREE.DoubleSide })); g.add(sail);
  // sail frame and mast
  limb(g, [-26, 6, 5.8], [-26, 62, 5.8], 0.6, 0.4, steel, 8);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-26, 60, 5.8), new THREE.Vector3(-4, 19, 5.8), new THREE.Vector3(26, 8, 5.8)), cp = curve.getPoints(10);
  for (let i = 0; i < 10; i++) limb(g, cp[i].toArray(), cp[i + 1].toArray(), 0.28, 0.28, steel, 5);
  limb(g, [-26, 8, 5.8], [26, 8, 5.8], 0.3, 0.3, steel, 5);
  for (const x of [-18, -10, -2, 8, 17]) { const yt = 8 + (60 - 8) * Math.pow(Math.max(0, (26 - x)) / 52, 2.2); limb(g, [x, 8, 5.8], [x, Math.min(yt, 56), 5.8], 0.12, 0.12, steel, 4); }
  // diagonal bracing on the back and sides
  for (let k = 0; k < 3; k++) { limb(g, [-24.8, 10 + k * 13, -10.6], [-13.2, 23 + k * 13, -10.6], 0.18, 0.18, DARK(), 4); limb(g, [-13.2, 10 + k * 13, -10.6], [-24.8, 23 + k * 13, -10.6], 0.18, 0.18, DARK(), 4); }
  // helipad cantilevered from the tower's front, high up
  box(g, 1.2, 0.5, 5, steel, -19, 45.5, 7.5, 1);
  cyl(g, 3.6, 3.6, 0.5, 16, color(0x4a5058), -19, 46, 10.8, 3);
  put(g, new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.12, 4, 20), color(0xffffff, { emissive: 0x404040 })), -19, 46.32, 10.8).rotation.x = Math.PI / 2;
  box(g, 0.4, 0.05, 2.4, color(0xffffff), -19.9, 46.28, 10.8, 1); box(g, 0.4, 0.05, 2.4, color(0xffffff), -18.1, 46.28, 10.8, 1); box(g, 1.8, 0.05, 0.4, color(0xffffff), -19, 46.28, 10.8, 1);
  limb(g, [-19, 45.5, 8.5], [-19, 44, 4], 0.2, 0.2, steel, 4);
  ball(g, 0.35, NEO(), -19, 47, 14.2, 1, 1, 1, 5);
  // windows on podium / back / sides
  wins(g, 'N', -12, [-24, -20, -16, -12], [3, 6.5], 1.6, 2, { c: '#d9d2c0' });
  wins(g, 'W', -25, [-9, -4, 1], [3, 6.5], 1.6, 2, { c: '#d9d2c0' }); wins(g, 'E', -9, [-9, -4, 1], [3, 6.5], 1.6, 2, { c: '#d9d2c0' });
  doors(g, 'N', -12, [-18], 1.5, 2.4, 3, '#6a6a70');
  // roof gear and island palms
  box(g, 2.5, 1.2, 2.5, steel, -21, 10.1, -6, 1); box(g, 2, 1, 2, steel, -14, 10, -2, 1);
  for (const [x, z] of [[-26.4, 3.5], [-26, -9], [-8.5, -8], [-9, 5]]) g.add(place(miniPalm(3.4), x, 0.9, z));
  cols.push([-25, -9, -12, 5, 12], [-25, -13, -10.5, 2.5, 62]);
  return size(g, 54, 26, 64, cols);
}

// ---------- 3. Dubai Frame ----------
export function dubaiFrame() {
  const g = G(), clad = mat('s5d_goldclad'), cols = [];
  for (const s of [-1, 1]) {
    const x = s * 14.5;
    box(g, 5, 50, 5, clad, x, 25, 0, 8);
    box(g, 6, 1.2, 6, color(0xe8d9b0), x, 0.6, 0, 3);
    box(g, 0.3, 40, 3.2, mat('glass'), x - s * 2.55, 24, 0, 4);
    box(g, 5.4, 0.6, 5.4, GOLD2(), x, 44.4, 0, 2);
    g.add(decal('door', 2.4, 3, x, 2.2, 2.57, { c: '#c9a24a' })); wins(g, 'S', 2.5, [x], [8, 14, 20, 26, 32, 38], 1.4, 2, { c: '#f2d060', fixed: true });
    wins(g, 'N', -2.5, [x], [3, 9, 15, 21, 27, 33, 39], 1.4, 2, { c: '#f2d060' }); wins(g, 'N', -2.5, [x + 1.5], [1.6], 1.4, 2.4, { kind: 'door', c: '#4a3a28' });
    wins(g, s > 0 ? 'E' : 'W', s * 17, [0], [8, 16, 24, 32, 40], 1.4, 2, { c: '#f2d060' });
    cols.push([x - 2.5, x + 2.5, -2.5, 2.5, 50]);
  }
  box(g, 34, 6, 5.2, clad, 0, 47, 0, 8); box(g, 34.4, 0.6, 5.6, GOLD2(), 0, 50.2, 0, 2); box(g, 24, 0.8, 5.4, color(0x1a2a34), 0, 43.7, 0, 3);
  box(g, 24, 0.14, 0.14, NEO(), 0, 43.2, 2.5, 1); box(g, 24, 0.14, 0.14, NEO(), 0, 43.2, -2.5, 1);
  box(g, 24.4, 3.4, 0.1, mat('glass'), 0, 47, 2.65, 4); box(g, 24.4, 3.4, 0.1, mat('glass'), 0, 47, -2.65, 4);
  box(g, 9, 1.4, 4, GOLD2(), 0, 51, 0, 2); ball(g, 0.6, GOLD(), 0, 52.2, 0, 1, 1, 1, 6);
  for (let x = -14; x <= 14; x += 4) box(g, 0.25, 6.1, 5.3, GOLD2(), x, 47, 0, 1);
  for (const s of [-1, 1]) { const f = sign('DUBAI FRAME', 9, 1.2, { bg: '#2a1a06', fg: '#ffd24a' }); f.position.set(0, 40.6, 0); if (s < 0) { f.rotation.y = Math.PI; f.position.z = -2.7; } else f.position.z = 2.7; g.add(f); }
  box(g, 14, 0.3, 5, color(0xc8bc9c), 0, 0.15, 0, 3);
  return size(g, 34, 5, 50, cols);
}

// ---------- 4. Museum of the Future ----------
export function museumOfTheFuture() {
  const g = G(), cols = [];
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 1, 1, 18), color(0xe6dcc0)); mound.scale.set(23, 4, 13); put(g, mound, 0, 2, -2);
  const sh = new THREE.Shape(); sh.absellipse(0, 0, 22, 13, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absellipse(0, 0, 15, 7, 0, Math.PI * 2, false); sh.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 12, bevelEnabled: false, curveSegments: 28 }); scaleUV(geo, 1 / 11); geo.translate(0, 0, -6);
  const side = color(0xdfe3e6), cap = mat('s5d_calli');
  const ring = new THREE.Mesh(geo, [cap, side]); put(g, ring, 0, 17, -2); g.add(ring);
  const sh2 = new THREE.Shape(); sh2.absellipse(0, 0, 15.1, 7.1, 0, Math.PI * 2, false); const h2 = new THREE.Path(); h2.absellipse(0, 0, 14.6, 6.6, 0, Math.PI * 2, false); sh2.holes.push(h2);
  const lg = new THREE.ExtrudeGeometry(sh2, { depth: 12.2, bevelEnabled: false, curveSegments: 28 }); lg.translate(0, 0, -6.1);
  put(g, new THREE.Mesh(lg, tm('neoglow', { color: 0x00e599, emissive: 0x007a50, transparent: true, opacity: 0.7 })), 0, 17, -2);
  // entrance lobby and service block
  box(g, 16, 4.6, 4.2, mat('glass'), 0, 2.3, 13, 6); box(g, 17, 0.5, 5, STEEL(), 0, 4.85, 13, 4);
  g.add(decal('door', 3.6, 3.4, -2.5, 1.8, 15.12, { c: '#9aa6b0' })); g.add(decal('door', 3.6, 3.4, 2.5, 1.8, 15.12, { c: '#9aa6b0' }));
  box(g, 14, 3.4, 4, mat('concrete'), 0, 1.7, -13, 4);
  wins(g, 'N', -15, [-4.5, 0, 4.5], [2.4], 1.6, 1.6, { c: '#9aa6b0' }); doors(g, 'N', -15, [-5.5], 1.4, 2, 2.6, '#6a6a70');
  box(g, 3, 1.8, 2.4, STEEL(), 8, 4.9, -10, 1); box(g, 2, 1.2, 2, STEEL(), -9, 4.6, -9, 1);
  for (const s of [-1, 1]) box(g, 3, 0.5, 6, color(0xefe9d6), s * 20, 0.25, 8, 2);
  cols.push([-22, 22, -15, 11, 4], [-8, 8, 11, 15, 4.6]);
  return size(g, 46, 30, 30, cols);
}

// ---------- 5. Cayan-style twisting tower ----------
export function cayanTower() {
  const g = G(), gl = mat('s5d_glassTw'), slabM = color(0xf0eee6);
  box(g, 20, 4, 20, mat('plainCream'), 0, 2, 0, 6); g.add(decal('door', 3, 3, 0, 1.5, 10.06, { c: '#9aa6b0' }));
  wins(g, 'S', 10, [-6, -3 - 3, 6], [2.4], 2, 2, { c: '#d0d8de', fixed: false }); wins(g, 'N', -10, [-6, 0, 6], [2.4], 2, 2, { c: '#d0d8de' }); wins(g, 'E', 10, [-5, 5], [2.4], 2, 2, { c: '#d0d8de' }); wins(g, 'W', -10, [-5, 5], [2.4], 2, 2, { c: '#d0d8de' });
  const n = 23;
  for (let i = 0; i < n; i++) {
    const rot = (i / (n - 1)) * (Math.PI / 2), y = 4 + i * 3.08;
    const f = box(g, 14.5, 2.5, 14.5, gl, 0, y + 1.5, 0, 8); f.rotation.y = rot;
    const s = box(g, 15.4, 0.55, 15.4, slabM, 0, y + 0.28, 0, 8); s.rotation.y = rot;
  }
  const top = 4 + n * 3.08; const t = box(g, 15, 0.8, 15, slabM, 0, top + 0.3, 0, 8); t.rotation.y = Math.PI / 2;
  box(g, 8, 3, 8, gl, 0, top + 2, 0, 6).rotation.y = Math.PI / 2 + 0.3; cyl(g, 0.15, 0.3, 4, 5, STEEL(), 0, top + 5, 0, 2); ball(g, 0.25, NEO(), 0, top + 7.1, 0, 1, 1, 1, 5);
  return size(g, 20, 20, 78);
}

// ---------- 6. Al Fahidi old quarter: sandy courtyard houses with wind towers ----------
export function windTowerHouses() {
  const g = G(), cols = [], house = mat('s5d_sandhouse'), slot = mat('s5d_windslot'), wood = color(0x5a3a1c);
  const xs = [-16.5, 0, 16.5], zs = [-9.25, 9.25], hs = [[7, 7.5, 6.5], [6.5, 8, 7]], tw = [[11.6, 0, 11], [0, 12, 11.2]];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const x = xs[c], z = zs[r], hh = hs[r][c], W = 11, D = 13.5;
    box(g, W, hh, D, house, x, hh / 2, z, 4);
    box(g, W + 0.4, 0.35, D + 0.4, house, x, hh + 0.17, z, 4);
    for (const [px, pz, sx, sz] of [[0, D / 2 + 0.2 - 0.3, W + 0.4, 0.5], [0, -D / 2 - 0.2 + 0.3, W + 0.4, 0.5], [W / 2 + 0.2 - 0.3, 0, 0.5, D - 0.2], [-W / 2 - 0.2 + 0.3, 0, 0.5, D - 0.2]]) box(g, sx, 0.7, sz, house, x + px, hh + 0.7, z + pz, 3);
    // wind tower
    if (tw[r][c]) {
      const th = tw[r][c], tx = x + (c === 1 ? 2.5 : (c === 0 ? 3 : -3)), tz = z + (r === 0 ? 3 : -3);
      box(g, 2.4, th - hh, 2.4, slot, tx, hh + (th - hh) / 2, tz, 2.4);
      box(g, 2.8, 0.4, 2.8, house, tx, th + 0.2, tz, 2); put(g, new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.0, 4), house), tx, th + 0.9, tz).rotation.y = 0.78;
      for (const k of [-0.7, 0.7]) { box(g, 3.4, 0.14, 0.14, wood, tx, th - 1.2, tz + k * 0.6, 1); box(g, 0.14, 0.14, 3.4, wood, tx + k * 0.6, th - 2.0, tz, 1); }
    }
    // front/back/side detail
    const fz = z + D / 2, bz = z - D / 2;
    doors(g, 'S', fz, [x - 1.5], 1.5, 1.9, 2.8, '#5a3418'); box(g, 2.6, 0.3, 0.5, wood, x - 1.5, 3.1, fz + 0.2, 1); box(g, 0.25, 3, 0.4, wood, x - 2.7, 1.5, fz + 0.2, 1); box(g, 0.25, 3, 0.4, wood, x - 0.3, 1.5, fz + 0.2, 1);
    wins(g, 'S', fz, [x + 2.4, x - 4], [hh - 2.2], 1.1, 1.3, { c: '#6a4220', fixed: false });
    wins(g, 'S', fz, [x + 2.4], [2.3], 1.1, 1.3, { c: '#6a4220', fixed: true });
    wins(g, 'N', bz, [x - 3, x + 3], [2.5, hh - 2.2], 1.1, 1.3, { c: '#6a4220' }); doors(g, 'N', bz, [x], 1.4, 1.6, 2.5, '#4a2c14');
    wins(g, 'E', x + W / 2, [z - 3, z + 3], [2.6, hh - 2.2], 1.1, 1.3, { c: '#6a4220' }); wins(g, 'W', x - W / 2, [z - 3, z + 3], [2.6, hh - 2.2], 1.1, 1.3, { c: '#6a4220' });
    box(g, 0.3, 0.5, 0.3, LAMP(), x + 1.3, 3.2, fz + 0.4, 1);
    cols.push([x - W / 2, x + W / 2, z - D / 2, z + D / 2, hh + 1]);
  }
  // lane dressing (all non-solid): cloth awnings, pots, a lantern, a small date palm
  const aw = tm('awn', { map: mat('s5d_textile').map, side: THREE.DoubleSide });
  for (const z of [-9.25, 9.25]) { const a = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3), aw); a.rotation.x = -Math.PI / 2 + 0.12; a.position.set(-8.25, 4.2, z); g.add(a); }
  const a2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), aw); a2.rotation.x = -Math.PI / 2; a2.position.set(8.25, 4.0, 0); g.add(a2);
  for (const [x, z] of [[-8.2, 0.6], [-8.4, -3.2], [8.5, 3.4], [-2.6, 12.5]]) { cyl(g, 0.45, 0.35, 0.9, 8, color(0xb85a2a), x, 0.45, z, 1); }
  g.add(place(miniPalm(4.8), 8.4, 0, -1.2));
  return size(g, 44, 32, 12, cols);
}

// ---------- 11. Emirates-Towers style twin triangular towers ----------
function triTower(r, tops, m) {
  const P = [[0, -r], [r * 0.866, r * 0.5], [-r * 0.866, r * 0.5]], pos = [], uv = [], k = 1 / 16;
  const quad = (a, b, ha, hb, u0) => { const L = Math.hypot(P[b][0] - P[a][0], P[b][1] - P[a][1]);
    const v = [[P[a][0], 0, P[a][1]], [P[b][0], 0, P[b][1]], [P[b][0], hb, P[b][1]], [P[a][0], 0, P[a][1]], [P[b][0], hb, P[b][1]], [P[a][0], ha, P[a][1]]];
    const t = [[0, 0], [L, 0], [L, hb], [0, 0], [L, hb], [0, ha]]; v.forEach((p, i) => { pos.push(...p); uv.push(t[i][0] * k, t[i][1] * k); }); };
  quad(0, 2, tops[0], tops[2]); quad(2, 1, tops[2], tops[1]); quad(1, 0, tops[1], tops[0]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const tp = [[P[0][0], tops[0], P[0][1]], [P[1][0], tops[1], P[1][1]], [P[2][0], tops[2], P[2][1]]]; const g2 = new THREE.BufferGeometry();
  g2.setAttribute('position', new THREE.Float32BufferAttribute(tp.flat(), 3)); g2.computeVertexNormals();
  geo.computeVertexNormals(); return [new THREE.Mesh(geo, m), new THREE.Mesh(g2, color(0xd8dde0))];
}
export function twinTowers() {
  const g = G(), gl = mat('s5d_glassTw'), cols = [], pod = mat('plainCream');
  box(g, 38, 3.4, 22, pod, 0, 1.7, 0, 6); box(g, 38.6, 0.4, 22.6, color(0xf2ecdc), 0, 3.6, 0, 4);
  const defs = [{ x: -10, z: -2, r: 9.2, tops: [85, 70, 70] }, { x: 10.2, z: -2, r: 9, tops: [72, 58, 58] }];
  for (const d of defs) {
    const [body, top] = triTower(d.r, d.tops, gl); put(g, body, d.x, 3.4, d.z); put(g, top, d.x, 3.4, d.z);
    for (const P of [[0, -d.r], [d.r * 0.866, d.r * 0.5], [-d.r * 0.866, d.r * 0.5]]) { const hh = d.tops[P[0] === 0 ? 0 : 1]; cyl(g, 0.25, 0.25, hh, 5, STEEL(), d.x + P[0], 3.4 + hh / 2, d.z + P[1], 4); }
    const top0 = 3.4 + d.tops[0]; cyl(g, 0.15, 0.5, 13, 6, STEEL(), d.x, top0 + 6, d.z - d.r + 1, 3); ball(g, 0.35, color(0xff3020, { emissive: 0xff2010 }), d.x, top0 + 12.8, d.z - d.r + 1, 1, 1, 1, 4);
    cols.push([d.x - d.r * 0.866, d.x + d.r * 0.866, d.z - d.r, d.z + d.r * 0.5, d.tops[0] + 3.4]);
  }
  ball(g, 0.4, NEO(), defs[1].x, 3.4 + 58 + 0.3, defs[1].z + 4, 1, 1, 1, 5);
  // entrance, windows, back details on the podium
  g.add(decal('door', 3.4, 3, -4, 1.5, 11.06, { c: '#9aa6b0' })); g.add(decal('door', 3.4, 3, 4, 1.5, 11.06, { c: '#9aa6b0' }));
  box(g, 12, 0.3, 3, STEEL(), 0, 3.4, 12.4, 1);
  wins(g, 'S', 11, [-15, -9, 9, 15], [1.8], 2, 1.8, { c: '#d0d8de', fixed: false });
  wins(g, 'N', -11, [-15, -10, -5, 0, 5, 10, 15], [1.8], 2, 1.8, { c: '#d0d8de' }); doors(g, 'N', -11, [-17.5, 17.5], 1.3, 1.8, 2.6, '#6a6a70');
  wins(g, 'E', 19, [-5, 0, 5], [1.8], 2, 1.8, { c: '#d0d8de' }); wins(g, 'W', -19, [-5, 0, 5], [1.8], 2, 1.8, { c: '#d0d8de' });
  cols.push([-19, 19, -11, 11, 3.6]);
  return size(g, 38, 22, 85, cols);
}

// ---------- 12. A graceful sandstone mosque (scenery) ----------
export function jumeirahMosque() {
  const g = G(), st = mat('s5d_sandstone'), cream = color(0xe8d8b0), domeM = color(0xe2cfa0);
  box(g, 22, 9.5, 14, st, 0, 4.75, -6, 4); box(g, 22.8, 0.7, 14.8, cream, 0, 9.85, -6, 3);
  box(g, 19, 6, 5, st, 0, 3, 3.5, 4); box(g, 19.8, 0.6, 5.8, cream, 0, 6.3, 3.5, 3);
  arches(g, 'S', 6, [-7.2, -3.6, 0, 3.6, 7.2], 1.7, 2.8, 3.4);
  for (const x of [-9.6, -5.4, -1.8, 1.8, 5.4, 9.6]) { cyl(g, 0.25, 0.3, 4, 6, cream, x, 2.4, 6.05, 1).visible = Math.abs(x) > 8 || true; }
  for (const x of [-7.2, 0, 7.2]) box(g, 0.3, 0.5, 0.3, LAMP(), x, 3.6, 6.2, 1);
  for (let i = 0; i < 14; i++) box(g, 0.7, 0.6, 0.5, cream, -9.1 + i * 1.4, 6.9, 5.9, 1);
  arches(g, 'S', 1, [-9, 9], 6, 2, 3.4); arches(g, 'S', 1, [-5.5, 5.5], 6, 2, 3.4);
  for (const s of [-1, 1]) arches(g, s > 0 ? 'E' : 'W', s * 11, [-9, -6, -3, 0], 5.6, 2, 3.6);
  arches(g, 'N', -13, [-8, -4, 0, 4, 8], 5.4, 2, 3.6); doors(g, 'N', -13, [-10], 1.5, 1.8, 3, '#5a3a1c');
  cyl(g, 5.6, 5.9, 3.2, 12, st, 0, 11.4, -6, 4); cyl(g, 6, 6, 0.4, 12, cream, 0, 13.2, -6, 3);
  for (let k = 0; k < 8; k++) { const a = k * 0.785 + 0.39; const w = decal('arch', 1.4, 2, Math.sin(a) * 5.95, 11.4, -6 + Math.cos(a) * 5.95, {}); w.rotation.y = a; g.add(w); }
  dome(g, 5.8, 6.8, domeM, 0, 13.4, -6, 3.4);
  for (const [x, z] of [[-9.5, -11.5], [9.5, -11.5], [-9.5, 0], [9.5, 0]]) { cyl(g, 1.6, 1.7, 1.6, 8, st, x, 10.8, z, 2); dome(g, 1.7, 2.4, domeM, x, 11.6, z, 1.2, 8); }
  for (const s of [-1, 1]) {
    const x = s * 12.8, z = 3.5;
    box(g, 3.4, 8, 3.4, st, x, 4, z, 3); box(g, 3.8, 0.5, 3.8, cream, x, 8.2, z, 2);
    cyl(g, 1.15, 1.35, 11, 8, st, x, 13.8, z, 3); cyl(g, 1.9, 1.7, 0.6, 8, cream, x, 19.6, z, 2); cyl(g, 1.75, 1.75, 0.5, 8, st, x, 20.2, z, 1).scale.set(1, 0.4, 1);
    for (let k = 0; k < 8; k++) { const a = k * 0.785; cyl(g, 0.06, 0.06, 0.9, 4, cream, x + Math.cos(a) * 1.75, 20.3, z + Math.sin(a) * 1.75, 1); }
    cyl(g, 0.8, 1.0, 5, 8, st, x, 22.5, z, 3); cyl(g, 1.2, 1.1, 0.4, 8, cream, x, 25.2, z, 1);
    dome(g, 1.0, 2.2, domeM, x, 25.3, z, 2.2, 8);
    for (const y of [4, 12]) { wins(g, 'S', z + 1.7, [x], [y], 0.5, 1.4, {}); }
    arches(g, 'S', z + 1.7, [x], 3, 1.2, 2.4);
    ball(g, 0.14, NEO(), x, 29.4, z, 1, 1, 1, 4);
  }
  box(g, 11, 0.2, 2.6, color(0xefe3c0), 0, 0.1, 8.7, 2);
  return size(g, 30, 26, 30, [[-11, 11, -13, 1, 10], [-9.5, 9.5, 1, 6, 6.5], [-14.5, -11.1, 1.8, 5.2, 30], [11.1, 14.5, 1.8, 5.2, 30]]);
}

// ---------- 10. Ski Dubai style sloping tube ----------
export function skiDome() {
  const g = G(), metal = mat('s5d_metal'), snow = mat('s5d_snow'), TH = Math.atan(0.3125), yc = (x) => 17 + 0.3125 * x, cols = [];
  const wedge = prismXY([[-31, 0], [31, 0], [31, yc(31) - 5], [-31, yc(-31) - 5]], 8, color(0x7f97b4), 6); put(g, wedge, 0, 0, -3);
  const piv = new THREE.Group(); piv.position.set(0, 17, -3); piv.rotation.z = TH; g.add(piv);
  const tg = new THREE.CylinderGeometry(7, 7, 64, 18, 1, true); tg.rotateZ(-Math.PI / 2); scaleUV(tg, 0.2);
  const tube = new THREE.Mesh(tg, tm('skitube', { map: mat('s5d_metal').map, side: THREE.DoubleSide })); piv.add(tube);
  const sg = new THREE.CylinderGeometry(7.4, 7.4, 63, 18, 1, true, Math.PI * 1.5 - 1.0, 2.0); sg.rotateZ(-Math.PI / 2); scaleUV(sg, 0.3); piv.add(new THREE.Mesh(sg, tm('snowc', { map: mat('s5d_snow').map, side: THREE.DoubleSide })));
  for (let i = 0; i <= 12; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(7.1, 0.25, 5, 18), STEEL()); t.rotation.y = Math.PI / 2; t.position.x = -31 + i * 5.2; piv.add(t); }
  const rnd = mulberry(5);
  for (let i = 0; i < 16; i++) { const m = ball(piv, 1, snow, -30 + i * 4 + rnd() * 2, 7.4 + rnd() * 0.3, (rnd() - 0.5) * 4, 2.8 + rnd() * 1.6, 0.6 + rnd() * 0.3, 1 + rnd(), 6); }
  // lower end cap and glass high end
  
  box(g, 5, 12, 14, mat('glass'), 29.5, 27, -3, 6); box(g, 5.4, 0.6, 14.4, STEEL(), 29.5, 33.3, -3, 3);
  wins(g, 'S', 4, [-24, -17, -10, -3, 4, 11, 18], [8, 12], 2, 2.2, { c: '#cfd8e0', fixed: false, lit: (a, y) => a > 5 && y > 20 });
  wins(g, 'S', 4, [14, 22], [14, 18, 22], 2, 2.2, { c: '#cfd8e0', fixed: false });
  wins(g, 'N', -10, [-26, -20, -14, -8, -2, 4, 10, 16, 22], [6, 11, 16], 2, 2.2, { c: '#cfd8e0' }); doors(g, 'N', -10, [-28], 1.5, 2.2, 3, '#4a5058');
  for (let i = 0; i < 4; i++) { const hh = yc(-24 + i * 16) - 6; box(g, 2.4, 1.4, 2.4, STEEL(), -24 + i * 16 + 2, hh + 0.7 + 4, -9, 1); }
  // annex with the sign
  box(g, 24, 9, 8, mat('s5d_metal'), -20, 4.5, 8, 6); box(g, 24.6, 0.5, 8.6, color(0xdbe6f0), -20, 9.25, 8, 4);
  for (let i = 0; i < 6; i++) ball(g, 1.4, snow, -29 + i * 4.4, 9.6, 8.4, 1.6, 0.4, 1.4, 6);
  g.add(decal('door', 3.4, 3.4, -20, 1.7, 12.06, { c: '#3a6a9a' })); wins(g, 'S', 12, [-27, -13], [3], 3.2, 2.4, { c: '#cfd8e0', fixed: false, lit: () => true });
  const sg2 = sign('SKI IN THE DESERT', 21, 2.6, { bg: '#10243c', fg: '#e8f6ff', border: '#00e599' }); sg2.position.set(-20, 6.9, 12.08); g.add(sg2);
  box(g, 20, 0.12, 0.12, color(0x9ad8ff, { emissive: 0x6ac0ff }), -20, 8.4, 12.1, 1);
  wins(g, 'W', -32, [8], [3], 1.6, 2.4, { kind: 'door', c: '#4a5058' }); wins(g, 'W', -32, [4, 12], [6], 1.6, 1.6, { c: '#cfd8e0' });
  // ski lift: two pylons and a cable with chairs
  const lift = (x, hgt) => { for (const s of [-1, 1]) limb(g, [x + s * 1.6, 0, 9 - 1.2], [x + s * 0.3, hgt, 9], 0.14, 0.1, DARK(), 5), limb(g, [x + s * 1.6, 0, 9 + 1.2], [x + s * 0.3, hgt, 9], 0.14, 0.1, DARK(), 5);
    for (const y of [hgt * 0.35, hgt * 0.65]) limb(g, [x - 1.1, y, 9], [x + 1.1, y, 9], 0.06, 0.06, DARK(), 4); box(g, 0.4, 0.3, 4, DARK(), x, hgt + 0.1, 9, 1); cols.push([x - 1.7, x + 1.7, 7.6, 10.4, 1.2]); };
  lift(8, 21.4); lift(27, 28.6);
  limb(g, [-31, 9.6, 9.8], [30, 29.6, 9.8], 0.07, 0.07, DARK(), 4); limb(g, [-31, 9.6, 8.2], [30, 29.6, 8.2], 0.07, 0.07, DARK(), 4);
  for (let i = 0; i < 6; i++) { const x = -26 + i * 9.5, y = 9.6 + (x + 31) * (20 / 61); limb(g, [x, y, 9.8], [x, y - 1.3, 9.8], 0.04, 0.04, DARK(), 3); box(g, 0.9, 0.12, 0.6, color(i % 2 ? 0xd9382a : 0x2a5aa8), x, y - 1.4, 9.8, 1); }
  ball(g, 0.4, NEO(), 29, 35.5, -3, 1, 1, 1, 5);
  for (let i = 0; i < 8; i++) cols.push([-32 + i * 8, -24 + i * 8, -10, 4, yc(-32 + i * 8) + 7]);
  cols.push([-32, -8, 4, 12, 9.4]);
  return size(g, 64, 24, 34, cols);
}

// ---------- shared interior bits ----------
const rugCache = {};
function rug(g, name, w, d, x, z, ry = 0) {
  if (!rugCache[name]) { rugCache[name] = mat(name).clone(); rugCache[name].depthWrite = false; }
  const p = tiledPlane(w, d, 1, 1, rugCache[name], x, 0.06, z); p.rotation.x = -Math.PI / 2; p.rotation.z = ry; p.renderOrder = -3; g.add(p); return p;
}
function chandelier(g, x, y, z, r = 1.6) {
  cyl(g, 0.05, 0.05, 2.4, 5, DARK(), x, y + 1.2, z, 1);
  const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 6, 18), GOLD()); t.rotation.x = Math.PI / 2; put(g, t, x, y, z);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ball(g, 0.17, color(0xfff0b8, { emissive: 0xffe9a0 }), x + Math.cos(a) * r, y + 0.2, z + Math.sin(a) * r, 1, 1, 1, 5); }
  ball(g, r * 0.35, color(0xfff0b8, { emissive: 0xffe9a0 }), x, y - 0.1, z, 1, 1, 1, 6);
}
function lantern(g, x, y, z, s = 1) {
  cyl(g, 0.02, 0.02, 1.4, 3, DARK(), x, y + 0.9 * s, z, 1);
  cyl(g, 0.22 * s, 0.22 * s, 0.6 * s, 6, LAMP(), x, y, z, 1);
  put(g, new THREE.Mesh(new THREE.ConeGeometry(0.3 * s, 0.3 * s, 6), GOLD2()), x, y + 0.45 * s, z); ball(g, 0.1 * s, GOLD2(), x, y - 0.35 * s, z, 1, 1.3, 1, 4);
}

// ---------- 7. Gold Souk (enterable) ----------
export function goldSouk() {
  const g = G(), cols = [];
  const W = 47, D = 31, H = 11, CH = 8;
  const base = hall({ w: W, d: D, h: H, ch: CH, outer: 's5d_arcade', inner: 's5d_soukwall', floor: 's5d_soukfloor', ceil: 's5d_soukceil', roof: 'plainOchre', tile: 8,
    doors: [{ side: 'S', at: 0, w: 8, h: 6 }, { side: 'E', at: 0, w: 6, h: 5.2 }, { side: 'W', at: 0, w: 6, h: 5.2 }] });
  g.add(base); cols.push(...base.userData.cols); g.userData = { inside: base.userData.inside, doors: base.userData.doors };
  const ix = base.userData.inside, st = mat('s5d_sandstone'), cream = color(0xe8d8b0), gold = GOLD();
  // roof: parapet merlons, gold domes, a billboard sign
  for (let x = -W / 2 + 1; x < W / 2; x += 3.2) { box(g, 1.6, 0.9, 0.8, st, x, H + 0.45, D / 2 - 0.4, 2); box(g, 1.6, 0.9, 0.8, st, x, H + 0.45, -D / 2 + 0.4, 2); }
  for (let z = -D / 2 + 3; z < D / 2 - 2; z += 3.2) { box(g, 0.8, 0.9, 1.6, st, W / 2 - 0.4, H + 0.45, z, 2); box(g, 0.8, 0.9, 1.6, st, -W / 2 + 0.4, H + 0.45, z, 2); }
  cyl(g, 5, 5.3, 2.2, 12, st, 0, H + 1.1, 0, 3); dome(g, 5, 5.6, mat('domeGold'), 0, H + 2.2, 0, 2.6);
  for (const [x, z] of [[-20, -12], [20, -12], [-20, 12], [20, 12]]) { cyl(g, 1.5, 1.6, 1.6, 8, st, x, H + 0.8, z, 2); dome(g, 1.7, 2.5, mat('domeGold'), x, H + 1.6, z, 1.2, 8); }
  for (const x of [-9, 9]) { box(g, 0.5, 4.4, 0.5, st, x, H + 2.2, D / 2 - 1.5, 1); }
  const bb = sign('GOLD SOUK', 22, 3.4, { bg: '#2a1006', fg: '#ffd24a', border: '#ffd24a' }); bb.position.set(0, H + 5.2, D / 2 - 1.4); g.add(bb);
  const bb2 = sign('GOLD SOUK', 22, 3.4, { bg: '#2a1006', fg: '#ffd24a', border: '#ffd24a' }); bb2.position.set(0, H + 5.2, D / 2 - 1.6); bb2.rotation.y = Math.PI; g.add(bb2);
  box(g, 22.6, 0.25, 0.3, NEO(), 0, H + 3.35, D / 2 - 1.4, 1);
  // front: portal pylon with the big gold sign, door frames
  box(g, 14, 2.2, 1.4, st, 0, 8.95, D / 2 + 0.7, 3); box(g, 14.6, 0.35, 1.7, gold, 0, 10.2, D / 2 + 0.75, 2);
  const sn = sign('GOLD SOUK', 12.4, 1.8, { bg: '#2a1006', fg: '#ffd24a', border: '#ffd24a' }); sn.position.set(0, 8.95, D / 2 + 1.42); g.add(sn);
  for (const s of [-1, 1]) { box(g, 0.7, 6.2, 0.8, gold, s * 4.35, 3.1, D / 2 + 0.4, 1); box(g, 0.9, 0.6, 1.0, GOLD2(), s * 4.35, 6.3, D / 2 + 0.4, 1); cyl(g, 0.5, 0.5, 5.2, 8, st, s * 6.2, 2.6, D / 2 + 0.7, 2); ball(g, 0.5, LAMP(), s * 6.2, 5.6, D / 2 + 1.3, 1, 1.3, 1, 5); }
  for (const s of [-1, 1]) { box(g, 0.7, 5.4, 0.8, gold, s * (W / 2 + 0.4), 2.7, -3.45, 1); box(g, 0.7, 5.4, 0.8, gold, s * (W / 2 + 0.4), 2.7, 3.45, 1); box(g, 0.9, 0.5, 7.6, gold, s * (W / 2 + 0.4), 5.4, 0, 1); }
  for (const x of [-15, 15]) for (const y of [7.4]) wins(g, 'S', D / 2, [x - 3, x + 3], [y], 1.6, 2, { c: '#d9a62a', lit: () => true, fixed: false });
  wins(g, 'N', -D / 2, [-18, -9, 0, 9, 18], [6.8], 1.6, 2.2, { c: '#d9a62a' }); doors(g, 'N', -D / 2, [-5, 5], 1.7, 2.2, 3.4, '#3a2410');
  arches(g, 'N', -D / 2, [-14, 14], 1.9, 2.4, 3.8);
  wins(g, 'E', W / 2, [-11, 11], [6.8], 1.6, 2.2, { c: '#d9a62a' }); wins(g, 'W', -W / 2, [-11, 11], [6.8], 1.6, 2.2, { c: '#d9a62a' });
  box(g, 1.6, 1.6, 1.6, STEEL(), 14, H + 1.8, -6, 1); box(g, 1.2, 1.2, 1.2, STEEL(), -14, H + 1.6, 4, 1);
  // ---- interior ----
  rug(g, 's5d_rug', 8, 8, 0, -4.5); rug(g, 's5d_rug', 5, 9, 0, 6.5, Math.PI / 2); rug(g, 's5d_rug', 6, 4, -14, 4); rug(g, 's5d_rug', 6, 4, 14, 4);
  const goldGlow = color(0xffc830, { emissive: 0x8a5a08 }), gem = [color(0xd0103a, { emissive: 0x500410 }), color(0x10a050, { emissive: 0x053a1a }), color(0x2060d0, { emissive: 0x081850 }), color(0xf4f4ff, { emissive: 0x606070 })];
  const wood = mat('planks'), tex2 = mat('s5d_textile');
  const jewels = (grp, w, seed, y) => {
    const r = mulberry(seed);
    for (let i = 0; i < 4; i++) { const b = boxT(0.5, 0.12, 0.28, goldGlow, 1); b.position.set(-w / 2 + 0.6 + i * 0.55, y + 0.06 + (i % 2) * 0.12, 0.2); b.rotation.y = r() * 0.5; grp.add(b); }
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 3, 7), goldGlow); b.position.set(-w / 2 + 2.8 + i * 0.35, y + 0.35, 0.3); b.rotation.x = -1.2; grp.add(b); }
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), gem[(r() * 4) | 0]); b.position.set(-w / 2 + 0.4 + r() * (w - 0.8), y + 0.12 + r() * 0.2, -0.1 + r() * 0.5); grp.add(b); }
    const bust = cylT(0.12, 0.2, 0.7, 6, goldGlow, 1); bust.position.set(w / 2 - 0.5, y + 0.35, 0.1); grp.add(bust); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), goldGlow); hd.position.set(w / 2 - 0.5, y + 0.85, 0.1); grp.add(hd);
  };
  const stall = (x, z, ry, k) => {
    const s = G(); s.position.set(x, 0, z); s.rotation.y = ry;
    const back = boxT(4, 3.4, 0.25, tex2, 2); back.position.set(0, 1.7, -1.0); s.add(back);
    const ctr = boxT(4, 1.1, 1.0, wood, 1.5); ctr.position.set(0, 0.55, 0.15); s.add(ctr);
    const top = boxT(4.15, 0.12, 1.15, color(0x3a2410), 1.5); top.position.set(0, 1.16, 0.15); s.add(top);
    const gl = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.55, 0.95), tm('showcase', { color: 0xaee0ff, transparent: true, opacity: 0.28 })); gl.position.set(0, 1.5, 0.15); s.add(gl);
    jewels(s, 4, 100 + k, 1.22);
    const aw = boxT(4.5, 0.12, 1.9, [tex2, tex2, tex2, tex2, tex2, tex2], 2); aw.position.set(0, 3.0, -0.3); aw.rotation.x = 0.28; s.add(aw);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 0.1), goldGlow); bar.position.set(0, 2.2, -0.82); s.add(bar);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), gem[(i + k) % 4]); b.position.set(-1.4 + i * 0.7, 2.2, -0.74); s.add(b); }
    lantern(s, 1.7, 2.7, 0.5, 0.8); lantern(s, -1.7, 2.7, 0.5, 0.8);
    g.add(s);
    const sw = Math.abs(Math.sin(ry)) > 0.5; cols.push(sw ? [x - 1.2, x + 1.2, z - 2.05, z + 2.05, 2.6] : [x - 2.05, x + 2.05, z - 1.2, z + 1.2, 2.6]);
  };
  let k = 0;
  for (const x of [-18, -12, -6, 0, 6, 12, 18]) stall(x, ix.z0 + 1.15, 0, k++);
  for (const x of [-19, -13.5, -8.5, 8.5, 13.5, 19]) stall(x, ix.z1 - 1.15, Math.PI, k++);
  for (const z of [-7, 7]) { stall(ix.x0 + 1.15, z, Math.PI / 2, k++); stall(ix.x1 - 1.15, z, -Math.PI / 2, k++); }
  // central gold-bar pyramid under glass, and two island counters
  const pz = -4.5;
  cyl(g, 2.5, 2.7, 0.7, 8, mat('granite'), 0, 0.35, pz, 2);
  for (let l = 0; l < 4; l++) for (let i = 0; i < 4 - l; i++) for (let j = 0; j < 4 - l; j++) box(g, 0.78, 0.4, 0.5, goldGlow, -1.17 + l * 0.39 + i * 0.78, 0.9 + l * 0.42, pz - 1.17 + l * 0.39 + j * 0.78 + (i % 2) * 0.01, 1);
  { const gl = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 3.8), tm('showcase', { color: 0xaee0ff, transparent: true, opacity: 0.28 })); put(g, gl, 0, 1.9, pz); }
  ball(g, 0.5, goldGlow, 0, 3.6, pz, 1, 1, 1, 6);
  cols.push([-2.2, 2.2, pz - 2.2, pz + 2.2, 3.4]);
  for (const s of [-1, 1]) {
    const x = s * 11.5;
    box(g, 10, 1.1, 2.2, wood, x, 0.55, pz, 1.5); box(g, 10.2, 0.12, 2.4, color(0x3a2410), x, 1.16, pz, 1.5);
    const gl = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.6, 2.0), tm('showcase', { color: 0xaee0ff, transparent: true, opacity: 0.28 })); put(g, gl, x, 1.52, pz);
    const grp = G(); grp.position.set(x, 0, pz); jewels(grp, 10, 300 + s, 1.22); g.add(grp); const grp2 = G(); grp2.position.set(x + 4, 0, pz); grp2.rotation.y = Math.PI; jewels(grp2, 3.4, 330 + s, 1.22); g.add(grp2);
    cyl(g, 0.12, 0.12, 5.4, 6, gold, x - 4.7, 2.7, pz, 1); cyl(g, 0.12, 0.12, 5.4, 6, gold, x + 4.7, 2.7, pz, 1);
    cols.push([x - 5.1, x + 5.1, pz - 1.2, pz + 1.2, 2.2]);
  }
  // hanging lanterns, textiles, chandeliers
  for (const x of [-16, -8, 8, 16]) for (const z of [-9, 1, 10]) lantern(g, x, CH - 2.4, z, 1);
  for (const z of [-2, 7]) chandelier(g, 0, CH - 2.6, z, 1.6);
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.6), tm('hang', { map: mat('s5d_textile').map, side: THREE.DoubleSide })); m.position.set(-18 + (i % 5) * 9, CH - 1.9, i < 5 ? -9.7 : 9.7); m.rotation.y = (i % 2) * 0.4; g.add(m); }
  for (const s of [-1, 1]) { const b = sign('HAND-MADE GOLD', 8, 1.2, { bg: '#7a1c14', fg: '#ffd24a' }); b.position.set(s * (ix.x1 - 0.12), 6.4, 0); b.rotation.y = -s * Math.PI / 2; g.add(b); }
  { const b = sign('GOLD FOR EVERYONE', 9, 1.2, { bg: '#1f5f6a', fg: '#ffd24a' }); b.position.set(0, 6.6, ix.z1 - 0.12); b.rotation.y = Math.PI; g.add(b); }
  return size(g, W + 4, D + 2, H + 10, cols);
}

// ---------- 8. Dubai Mall (enterable) ----------
export function dubaiMall() {
  const g = G(), cols = [];
  const W = 57, D = 41, H = 16, CH = 13;
  const base = hall({ w: W, d: D, h: H, ch: CH, outer: 's5d_mallglass', inner: 's5d_mallwall', floor: 's5d_mallfloor', ceil: 's5d_skylight', roof: 'metalRoof', tile: 13,
    doors: [{ side: 'S', at: 0, w: 9, h: 7 }, { side: 'E', at: 0, w: 6.5, h: 5.5 }, { side: 'W', at: 0, w: 6.5, h: 5.5 }] });
  g.add(base); cols.push(...base.userData.cols); g.userData = { inside: base.userData.inside, doors: base.userData.doors };
  const ix = base.userData.inside, steel = STEEL();
  // exterior: fins, canopy, vault, roof sign
  for (let x = -W / 2 + 2; x < W / 2; x += 4) box(g, 0.3, H, 0.6, steel, x, H / 2, D / 2 + 0.3, 1);
  for (let z = -D / 2 + 2; z < D / 2; z += 4) { box(g, 0.6, H, 0.3, steel, W / 2 + 0.3, H / 2, z, 1); box(g, 0.6, H, 0.3, steel, -W / 2 - 0.3, H / 2, z, 1); }
  for (let x = -W / 2 + 2; x < W / 2; x += 4) box(g, 0.3, H, 0.6, steel, x, H / 2, -D / 2 - 0.3, 1);
  box(g, 16, 0.4, 5, mat('glass'), 0, 8.2, D / 2 + 2.5, 4); for (const s of [-1, 1]) cyl(g, 0.2, 0.2, 8, 6, steel, s * 7.6, 4.1, D / 2 + 4.6, 1);
  const vg = new THREE.CylinderGeometry(15, 15, W - 4, 18, 1, true, 0, Math.PI); vg.rotateZ(Math.PI / 2); scaleUV(vg, 0.1);
  const vault = new THREE.Mesh(vg, tm('vault', { color: 0x9ad0ee, transparent: true, opacity: 0.55, side: THREE.DoubleSide })); vault.scale.set(1, 0.38, 1); put(g, vault, 0, H, 0); g.add(vault);
  for (let x = -W / 2 + 4; x <= W / 2 - 4; x += 6) { const t = new THREE.Mesh(new THREE.TorusGeometry(15, 0.2, 4, 18, Math.PI), steel); t.rotation.y = Math.PI / 2; t.scale.set(1, 0.38, 1); t.position.set(x, H, 0); g.add(t); }
  const gs = sign('DUBAI MALL', 26, 4, { bg: '#101820', fg: '#ffe9a8', border: '#ffd24a' }); gs.position.set(0, 12.2, D / 2 + 0.2); g.add(gs);
  box(g, 26, 0.22, 0.25, NEO(), 0, 10.0, D / 2 + 0.3, 1);
  const rs = sign('DUBAI MALL', 30, 4.6, { bg: '#101820', fg: '#ffe9a8', border: '#ffd24a' }); rs.position.set(0, H + 8.5, 14.3); g.add(rs);
  const rs2 = sign('DUBAI MALL', 30, 4.6, { bg: '#101820', fg: '#ffe9a8', border: '#ffd24a' }); rs2.position.set(0, H + 8.5, 14.1); rs2.rotation.y = Math.PI; g.add(rs2);
  for (const x of [-12, 12]) box(g, 0.5, 6.4, 0.5, steel, x, H + 3.2, 14.2, 1); box(g, 30, 0.3, 0.3, NEO(), 0, H + 5.9, 14.5, 1);
  wins(g, 'N', -D / 2, [-18, -6, 6, 18], [5], 3, 3, { c: '#aab4bc', lit: () => true }); doors(g, 'N', -D / 2, [-9, 9], 2.2, 3.2, 4.4, '#8a949c');
  box(g, 3, 2, 3, steel, 20, H + 1, -8, 1); box(g, 4, 1.4, 2, steel, -18, H + 0.7, -5, 1);
  // ---- interior ----
  const fz = -2;
  cyl(g, 6.4, 6.6, 0.9, 20, mat('granite'), 0, 0.45, fz, 3);
  cyl(g, 5.8, 5.8, 0.12, 20, color(0x3f9ad0, { emissive: 0x1a6aa8 }), 0, 0.9, fz, 3);
  put(g, new THREE.Mesh(new THREE.TorusGeometry(6.1, 0.07, 4, 24), NEO()), 0, 0.96, fz).rotation.x = Math.PI / 2;
  const water = tm('jet', { color: 0xdff4ff, emissive: 0x6ab8e8, transparent: true, opacity: 0.7 });
  cyl(g, 0.3, 0.5, 9.5, 8, water, 0, 5.4, fz, 2); ball(g, 0.9, water, 0, 10.4, fz, 1, 0.9, 1, 7);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, jh = 3.5 + (i % 2) * 2; const j = cylT(0.1, 0.22, jh, 6, water, 2); j.position.set(Math.cos(a) * 2.4, 0.9 + jh / 2, fz + Math.sin(a) * 2.4); j.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); g.add(j); ball(g, 0.35, water, Math.cos(a) * 2.9, 0.9 + jh, fz + Math.sin(a) * 2.9, 1, 0.7, 1, 5); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; put(g, new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.2, 5), water), Math.cos(a) * 5.0, 1.5, fz + Math.sin(a) * 5.0).rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); }
  cols.push([-6.4, 6.4, fz - 6.4, fz + 6.4, 1.2]);
  // aquarium on the north wall
  const az = ix.z0 + 2.6;
  box(g, 22, 0.8, 5.6, DARK(), 0, 0.4, az, 3); box(g, 22, 0.8, 5.6, DARK(), 0, 9.2, az, 3);
  const aq = new THREE.Mesh(new THREE.BoxGeometry(21.6, 8, 5.2), tm('aqua', { color: 0x2a8ad0, emissive: 0x1a6fb0, transparent: true, opacity: 0.62 })); put(g, aq, 0, 4.8, az);
  for (const x of [-10.8, 10.8, 0]) box(g, 0.5, 8.4, 0.5, DARK(), x, 4.8, az + 2.7, 1);
  const fr = mulberry(77);
  for (let i = 0; i < 16; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8, 5), color([0xff8a1c, 0xffd020, 0xf4f4f4, 0xff5a8a][i % 4])); f.rotation.z = (i % 2) ? Math.PI / 2 : -Math.PI / 2; f.position.set(-9.5 + fr() * 19, 2 + fr() * 6, az - 1.5 + fr() * 3); g.add(f); }
  { const sk = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3, 6), color(0x6a7a88)); sk.rotation.z = -Math.PI / 2; put(g, sk, 3, 5.2, az); put(g, new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 4), color(0x6a7a88)), 1.0, 5.2, az).rotation.z = Math.PI / 2; box(g, 0.1, 1, 0.9, color(0x6a7a88), 4.7, 5.5, az, 1); }
  for (let i = 0; i < 9; i++) { const m = cylT(0.06, 0.04, 2.2 + fr() * 1.6, 4, color(0x2f9a50), 1); m.position.set(-9.5 + i * 2.4, 1.6, az + (fr() - 0.5) * 3); g.add(m); }
  for (let i = 0; i < 6; i++) ball(g, 0.5 + fr() * 0.6, color(0x8a7a6a), -9 + i * 3.6, 1.1, az + (fr() - 0.5) * 3, 1.4, 0.7, 1, 5);
  const as = sign('DUBAI AQUARIUM', 12, 1.3, { bg: '#0a2a4a', fg: '#a8ecff' }); as.position.set(0, 10.4, az + 2.9 - 0.1); g.add(as);
  cols.push([-11, 11, ix.z0, az + 2.9, 9.6]);
  // shop-fronts
  const names = ['WATCHES', 'PERFUME', 'FASHION', 'SHOES', 'TOYS', 'COFFEE', 'TECH', 'GIFTS', 'JEWELS', 'BOOKS', 'SWEETS', 'SPORT'], bgs = ['#1f3a6a', '#7a1c14', '#1f5f6a', '#4a2a6a', '#8a5a0c', '#2a5a2a'];
  const shop = (side, along, idx) => {
    const sgn = sign(names[idx % names.length], 5.2, 1.0, { bg: bgs[idx % bgs.length], fg: '#fff4d0' }), s = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.6, 0.7), mat('s5d_shopglass'));
    const grp = G();
    const f = boxT(5.4, 3.6, 0.7, [mat('s5d_shopglass'), mat('s5d_shopglass'), color(0xcfc8b6), color(0x888070), mat('s5d_shopglass'), color(0x888070)], 5.4); f.position.set(0, 1.8, 0); grp.add(f); sgn.position.set(0, 4.1, 0.37); grp.add(sgn);
    if (side === 'N') { grp.position.set(along, 0, ix.z0 + 0.35); }
    if (side === 'S') { grp.position.set(along, 0, ix.z1 - 0.35); grp.rotation.y = Math.PI; }
    if (side === 'E') { grp.position.set(ix.x1 - 0.35, 0, along); grp.rotation.y = -Math.PI / 2; }
    if (side === 'W') { grp.position.set(ix.x0 + 0.35, 0, along); grp.rotation.y = Math.PI / 2; }
    g.add(grp); const hx = side === 'N' || side === 'S';
    cols.push(hx ? [grp.position.x - 2.7, grp.position.x + 2.7, grp.position.z - 0.35, grp.position.z + 0.35, 4.6] : [grp.position.x - 0.35, grp.position.x + 0.35, grp.position.z - 2.7, grp.position.z + 2.7, 4.6]);
  };
  let n = 0;
  for (const x of [-23.5, -18, -12.5]) { shop('N', x, n++); } for (const x of [12.5, 18, 23.5]) { shop('N', x, n++); }
  for (const x of [-23.5, -18, -12.5, -7]) shop('S', x, n++); for (const x of [7, 12.5, 18, 23.5]) shop('S', x, n++);
  for (const z of [-14, -8.5, 8.5, 14]) { shop('E', z, n++); shop('W', z, n + 5); n++; }
  // palms in planters, kiosks, benches
  for (const [x, z] of [[-16, -9], [16, -9], [-16, 9], [16, 9], [-24, -16.5], [24, -16.5], [-22, 4], [22, 4]]) {
    cyl(g, 1.0, 0.85, 0.9, 10, mat('granite'), x, 0.45, z, 2); g.add(place(miniPalm(5.6), x, 0.8, z)); cols.push([x - 1, x + 1, z - 1, z + 1, 2]);
  }
  for (const [x, z] of [[-11, 11], [11, 11]]) {
    box(g, 3, 1.1, 1.6, mat('planks'), x, 0.55, z, 1.5); box(g, 3.4, 0.15, 2.2, color(0xd9382a), x, 2.9, z, 1); for (const s of [-1, 1]) cyl(g, 0.08, 0.08, 2.4, 5, DARK(), x + s * 1.5, 1.7, z + 0.8, 1);
    cols.push([x - 1.6, x + 1.6, z - 0.9, z + 0.9, 3]);
  }
  for (const [x, z] of [[-6, 12], [6, 12], [-7, -9.5], [7, -9.5]]) chandelier(g, x, CH - 3.2, z, 1.4);
  chandelier(g, 0, CH - 3.6, fz, 2.4);
  for (const [t, x, z, ry, bg] of [['SUMMER SALE', ix.x1 - 0.1, 9, -Math.PI / 2, '#b8352a'], ['SUMMER SALE', ix.x0 + 0.1, -9, Math.PI / 2, '#b8352a'], ['NEW SEASON', ix.x1 - 0.1, -9, -Math.PI / 2, '#1f5f6a'], ['WELCOME', ix.x0 + 0.1, 9, Math.PI / 2, '#4a2a6a']]) { const b = sign(t, 8, 2, { bg }); b.position.set(x, 9.6, z); b.rotation.y = ry; g.add(b); }
  for (const [x, z] of [[-9, 4], [9, 4], [-20, -9], [20, -9]]) for (const ry of [0, Math.PI]) { const b = sign(x < 0 ? 'FASHION WEEK' : 'DEALS', 6, 1.8, { bg: x < 0 ? '#7a1c14' : '#1f3a6a' }); b.position.set(x, 8.6, z + (ry ? -0.05 : 0.05)); b.rotation.y = ry; g.add(b); cyl(g, 0.03, 0.03, 4, 3, DARK(), x - 2.6, 11, z, 1); cyl(g, 0.03, 0.03, 4, 3, DARK(), x + 2.6, 11, z, 1); }
  { const p = tiledPlane(10, 8, 1, 1, Object.assign(mat('s5d_rug').clone(), { depthWrite: false }), 0, 0.05, 11); p.rotation.x = -Math.PI / 2; p.renderOrder = -3; g.add(p); }
  return size(g, W + 2, D + 4, H + 14, cols);
}

// ---------- 9. THE ROYAL GOLD PALACE ----------
function lion(g, x, z, cols) {
  const L = G(), gd = GOLD(), leaf = mat('s5d_goldleaf');
  box(L, 2.6, 1.3, 4.6, leaf, 0, 0.65, 0, 2.5); box(L, 2.9, 0.25, 4.9, GOLD2(), 0, 1.4, 0, 2); box(L, 3.0, 0.2, 5.0, GOLD2(), 0, 0.1, 0, 2);
  const y = 1.5;
  ball(L, 1, gd, 0, y + 1.25, -0.5, 0.8, 0.75, 1.5, 8);          // body
  ball(L, 0.7, gd, 0, y + 0.8, -1.5, 1, 0.9, 0.9, 7);             // haunches
  ball(L, 1.05, GOLD2(), 0, y + 2.1, 1.3, 1, 1, 0.9, 8);          // mane
  ball(L, 0.6, gd, 0, y + 2.05, 1.7, 1, 0.95, 1, 8);              // head
  box(L, 0.5, 0.4, 0.5, gd, 0, y + 1.85, 2.2, 1);
  ball(L, 0.07, DARK(), -0.22, y + 2.3, 2.2, 1, 1, 1, 4); ball(L, 0.07, DARK(), 0.22, y + 2.3, 2.2, 1, 1, 1, 4);
  for (const s of [-1, 1]) { box(L, 0.4, 1.4, 0.4, gd, s * 0.45, y + 0.7, 1.2, 1); box(L, 0.45, 0.2, 0.8, gd, s * 0.45, y + 0.05, 1.5, 1); ball(L, 0.18, gd, s * 0.4, y + 2.7, 1.2, 1, 1, 1, 4); }
  limb(L, [0, y + 1.0, -2.1], [0, y + 0.2, -3.0], 0.12, 0.08, gd, 5); ball(L, 0.2, GOLD2(), 0, y + 0.1, -3.05, 1, 1.3, 1, 5);
  L.position.set(x, 0.0, z); g.add(L); cols.push([x - 1.5, x + 1.5, z - 2.5, z + 2.5, 4.4]);
}
function goldFountain(g, x, z, cols) {
  const gd = GOLD(), wat = tm('gfw', { color: 0xb8ecff, emissive: 0x4a98c8, transparent: true, opacity: 0.8 });
  cyl(g, 2.9, 3.1, 0.9, 12, gd, x, 0.45, z, 2); cyl(g, 2.5, 2.5, 0.1, 12, wat, x, 0.9, z, 2);
  cyl(g, 0.4, 0.6, 3.2, 8, gd, x, 2.4, z, 1); cyl(g, 1.7, 0.6, 0.5, 10, gd, x, 3.8, z, 1); cyl(g, 1.5, 1.5, 0.1, 10, wat, x, 4.1, z, 1);
  cyl(g, 0.2, 0.3, 1.8, 6, gd, x, 5.0, z, 1); cyl(g, 0.08, 0.2, 2.6, 6, wat, x, 6.2, z, 1); ball(g, 0.4, wat, x, 7.6, z, 1, 0.9, 1, 6);
  for (let i = 0; i < 6; i++) { const a = i * 1.047; const j = cylT(0.06, 0.16, 1.6, 5, wat, 1); j.position.set(x + Math.cos(a) * 1.0, 1.7, z + Math.sin(a) * 1.0); j.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(j); }
  ball(g, 0.3, color(0xd0103a, { emissive: 0x500410 }), x, 5.9, z, 1, 1, 1, 5);
  cols.push([x - 3.1, x + 3.1, z - 3.1, z + 3.1, 1.0]);
}
export function goldPalaceHotel() {
  const g = G(), cols = [], gold = GOLD(), gold2 = GOLD2(), leaf = mat('s5d_goldleaf'), clad = mat('s5d_goldclad'), marble = mat('s4i_marble');
  const gemR = color(0xd0103a, { emissive: 0x500410 }), gemG = color(0x10a050, { emissive: 0x053a1a }), gemB = color(0x2060d0, { emissive: 0x081850 }), gems = [gemR, gemG, gemB];
  const gemGeo = new THREE.OctahedronGeometry(0.42), wingX = 24;
  // central body, wings, cornices
  put(g, slab(36, 26, 26, leaf, leaf, 8), 0, 13, -8); box(g, 38, 1.2, 28, gold, 0, 26.6, -8, 4); box(g, 37, 0.6, 27, gold2, 0, 13.2, -8, 4); box(g, 38, 1.4, 28, gold2, 0, 1.9, -8, 4);
  for (const s of [-1, 1]) {
    const x = s * wingX;
    put(g, slab(12, 20, 22, leaf, leaf, 8), x, 10, -9); box(g, 13, 1, 23, gold, x, 20.5, -9, 4); box(g, 12.6, 0.5, 22.6, gold2, x, 10.2, -9, 4);
    cyl(g, 4.2, 4.4, 2.6, 12, clad, x, 22.3, -9, 3); dome(g, 4.3, 5.4, gold, x, 23.6, -9, 3.2);
    ball(g, 0.5, gemR, x, 22.5, -9 + 4.4, 1, 1, 1, 5);
    // front/back/side windows on wings
    wins(g, 'S', 2 - 0, [x - 2.5, x + 2.5], [5, 13], 1.8, 3, { c: '#f6d050', lit: (a, y) => (a + y) % 3 === 0, fixed: false });
    wins(g, 'N', -20, [x - 2.5, x + 2.5], [4, 9, 14], 1.8, 3, { c: '#f6d050' });
    wins(g, s > 0 ? 'E' : 'W', s * (wingX + 6), [-14, -9, -4], [4, 9, 14], 1.8, 3, { c: '#f6d050' });
  }
  cols.push([-18, 18, -21, 5, 26], [-30, -18, -20, 2, 20], [18, 30, -20, 2, 20]);
  // golden domes: the grand dome, corner turrets
  cyl(g, 7.4, 7.8, 3.4, 14, clad, 0, 28.9, -8, 4); cyl(g, 8.1, 8.1, 0.5, 14, gold2, 0, 30.8, -8, 3);
  for (let k = 0; k < 7; k++) { const a = -1.2 + k * 0.4; const w = decal('arch', 1.5, 2.4, Math.sin(a) * 7.55, 28.9, -8 + Math.cos(a) * 7.55, {}); w.rotation.y = a; g.add(w); }
  lathe(g, domePts(7.9, 8.8, 10), 14, gold, 0, 31.0, -8); cyl(g, 0.14, 0.4, 3.4, 6, gold, 0, 40.2, -8, 1); ball(g, 0.5, gold, 0, 42.0, -8, 1, 1.2, 1, 6);
  for (const [x, z] of [[-16.5, 2.6], [16.5, 2.6], [-16.5, -18.6], [16.5, -18.6]]) { cyl(g, 1.7, 1.9, 5, 10, clad, x, 29.1, z, 3); box(g, 4.4, 0.5, 4.4, gold2, x, 26.9, z, 2); dome(g, 2.0, 3.6, gold, x, 31.6, z, 2.2, 10); ball(g, 0.4, gems[(x > 0) + (z > 0)], x, 30.3, z + (z > 0 ? 1.9 : -1.9), 1, 1, 1, 5); }
  // portico: deck, steps, colonnade, entablature, pediment
  box(g, 44, 0.9, 8.4, marble, 0, 0.45, 9, 4); box(g, 44.8, 0.2, 9, gold2, 0, 0.95, 9, 4);
  for (let s = 0; s < 3; s++) box(g, 18 + (2 - s) * 1.0, 0.3 * (s + 1), 2.7, marble, 0, 0.15 * (s + 1), 20 - s * 2.65 - 0.65 + 0.0, 3).position.z = 19.65 - s * 2.65;
  const carp = (len, z, y) => { const c = tiledPlane(len, 5, len / 3, 1, tm('carp', { map: mat('s4i_carpet').map, polygonOffset: true, polygonOffsetFactor: -2 }), 0, y, z); c.rotation.set(-Math.PI / 2, 0, Math.PI / 2); g.add(c); };
  carp(7.4, 8.9, 1.07); carp(2.7, 14.15, 0.93); carp(2.7, 16.8, 0.63); carp(2.7, 19.45, 0.33);
  for (let i = 0; i < 8; i++) {
    const x = -17.5 + i * 5;
    cyl(g, 1.0, 1.15, 18, 12, clad, x, 9.9, 11.2, 3); box(g, 3.0, 0.8, 3.0, gold2, x, 1.3, 11.2, 2); cyl(g, 1.65, 1.1, 1.2, 12, gold, x, 19.5, 11.2, 2); box(g, 3.4, 0.5, 3.4, gold2, x, 20.35, 11.2, 2);
    cols.push([x - 1.2, x + 1.2, 10.0, 12.4, 21]);
  }
  box(g, 41, 3, 8.4, leaf, 0, 22.1, 8.8, 6); box(g, 42, 0.6, 9.2, gold, 0, 23.9, 8.8, 4); box(g, 41.6, 0.4, 8.8, gold2, 0, 20.75, 8.8, 4);
  put(g, prismXY([[-21, 0], [21, 0], [0, 6.2]], 8.6, leaf, 6), 0, 24.2, 8.8);
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.3, 18), gold); m.rotation.x = Math.PI / 2; put(g, m, 0, 26.2, 13.2); for (let k = 0; k < 12; k++) { const a = k * 0.5236; const r = box(g, 0.2, 1.4, 0.12, gold, Math.cos(a) * 3.4, 26.2 + Math.sin(a) * 3.4, 13.15, 1); r.rotation.z = a - Math.PI / 2; } ball(g, 0.7, gemR, 0, 26.2, 13.4, 1, 1, 0.6, 6); }
  for (const s of [-1, 1]) { ball(g, 0.5, gold, s * 21, 25.2, 13.0, 1, 1.3, 1, 6); cyl(g, 0.2, 0.5, 1.6, 6, gold, s * 21, 24.8, 13.0, 1); }
  ball(g, 0.8, gold, 0, 30.6, 12.8, 1, 1.3, 1, 6); cyl(g, 0.15, 0.4, 1.8, 6, gold, 0, 30.0, 12.8, 1);
  const sg = sign('ROYAL GOLD PALACE', 30, 2.5, { bg: '#4a0a14', fg: '#ffd84a', border: '#ffd84a' }); sg.position.set(0, 22.1, 13.03); g.add(sg);
  box(g, 30.4, 0.18, 0.2, NEO(), 0, 20.7, 13.1, 1);
  for (let i = 0; i < 21; i++) { const gm = new THREE.Mesh(gemGeo, gems[i % 3]); gm.scale.set(0.8, 1.1, 0.5); gm.position.set(-20 + i * 2, 24.6, 13.2); g.add(gm); }
  for (let i = 0; i < 9; i++) { const gm = new THREE.Mesh(gemGeo, gems[(i + 1) % 3]); gm.scale.set(0.8, 1.1, 0.8); gm.position.set(-16 + i * 4, 27.4, 5.1 - 8 + 8); g.add(gm); }
  // palace front: door, windows
  g.add(decal('door', 6, 7.4, 0, 4.6, 5.08, { c: '#f2c230' })); box(g, 7.4, 0.5, 0.5, gold, 0, 8.5, 5.2, 1); box(g, 0.5, 7.8, 0.5, gold, -3.5, 4.7, 5.2, 1); box(g, 0.5, 7.8, 0.5, gold, 3.5, 4.7, 5.2, 1);
  put(g, new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.18, 5, 12, Math.PI), gold), 0, 8.6, 5.25);
  wins(g, 'S', 5, [-15, -10, -5, 5, 10, 15], [5, 13.5, 20], 1.9, 3.2, { c: '#f6d050', lit: (a, y) => ((a / 5) + (y | 0)) % 3 === 0, fixed: false });
  wins(g, 'S', 5, [-15, -10, 10, 15], [5], 1.9, 3.2, { c: '#f6d050', fixed: false });
  wins(g, 'S', 5, [-4, 4], [13.5, 20], 1.9, 3.2, { c: '#f6d050', fixed: false });
  wins(g, 'N', -21, [-15, -10, -5, 0, 5, 10, 15], [6, 12, 18, 23], 1.9, 3.2, { c: '#f6d050' }); doors(g, 'N', -21, [-8, 8], 2.3, 2.6, 4.2, '#c9941c');
  wins(g, 'E', 18, [-17, -12, -7, -2], [14, 20], 1.9, 3.2, { c: '#f6d050' }); wins(g, 'W', -18, [-17, -12, -7, -2], [14, 20], 1.9, 3.2, { c: '#f6d050' });
  box(g, 3, 2, 3, gold2, 6, 28, -8, 1); box(g, 2, 1.6, 2, gold2, -8, 28, -12, 1);
  for (const x of [-6, 6]) { cyl(g, 0.15, 0.15, 7, 5, gold2, x, 30.2, -2, 1); const f = box(g, 2.2, 1.2, 0.05, color(0x00e599, { emissive: 0x00a06a }), x + 1.1, 33.3, -2, 1); f.rotation.y = 0; }
  // lions, fountains, palms, ATM
  lion(g, -12.2, 18.2, cols); lion(g, 12.2, 18.2, cols); goldFountain(g, -17.2, 17.5, cols); goldFountain(g, 17.2, 17.5, cols);
  for (const [x, z] of [[-25.5, 18], [25.5, 18], [-28.5, 10], [28.5, 10]]) { const p = goldPalm({ seed: Math.abs(x) | 0 }); p.position.set(x, 0, z); p.scale.setScalar(0.95); g.add(p); cols.push([x - 0.6, x + 0.6, z - 0.6, z + 0.6, 10]); }
  { const ax = 10, az = 6.8, a = G(); a.position.set(ax, 0.95, az);
    box(a, 1.6, 2.6, 1.2, gold, 0, 1.3, 0, 1); box(a, 1.8, 0.3, 1.4, gold2, 0, 2.7, 0, 1); box(a, 1.0, 0.8, 0.06, NEO(), 0, 1.75, 0.63, 1); box(a, 1.1, 0.5, 0.3, gold2, 0, 1.1, 0.7, 1);
    const as = sign('GOLD ATM', 1.7, 0.5, { bg: '#1a1208', fg: '#ffd84a' }); as.position.set(0, 3.1, 0.62); a.add(as); box(a, 0.7, 0.18, 0.08, color(0x101010), 0, 0.85, 0.82, 1);
    g.add(a); cols.push([ax - 0.9, ax + 0.9, az - 0.7, az + 0.7, 3.6]); }
  // utility on the back
  for (const x of [-12, 4, 14]) cyl(g, 0.2, 0.2, 18, 5, gold2, x, 9, -21.5, 1);
  box(g, 3, 2.4, 1.6, gold2, -3, 1.2, -22.2, 1); box(g, 2.4, 2, 1.4, gold2, 12, 1, -22, 1);
  return size(g, 60, 42, 42, cols);
}
