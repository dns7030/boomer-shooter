// Soviet-era buildings, built at "real" scale (a storey is 3 m). Same conventions as buildings.js:
// origin at footprint centre on the ground, street-facing front toward local +Z.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, gableRoof, decal } from './geo.js';
import { textTexture, mulberry, tex } from './textures.js';

const G = () => new THREE.Group();
const roofM = () => mat('roofTar');

// ---------- helpers ----------
export function slab(w, h, d, side, roof, tile = 6) { // box with separate side / roof materials
  const m = boxT(w, h, d, side, tile);
  m.material = [side, side, roof, roof, side, side];
  return m;
}
export function tiledPlane(w, h, u, v, material, x, y, z) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  return m;
}
const signMats = {};
export function sign(text, w, h, opts = {}) {
  const key = `${text}|${opts.bg || ''}|${opts.fg || ''}`;
  if (!signMats[key]) signMats[key] = new THREE.MeshBasicMaterial({ map: textTexture(text, 512, Math.max(32, Math.round((512 * h) / w)), { font: `bold ${Math.round((512 * h) / w * 0.62)}px Arial, Helvetica, sans-serif`, ...opts }) });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), signMats[key]);
}
function parapet(g, w, d, y, h = 0.7, t = 0.4) {
  const m = mat('concrete');
  g.add(place(boxT(w, h, t, m, 2), 0, y + h / 2, d / 2 - t / 2));
  g.add(place(boxT(w, h, t, m, 2), 0, y + h / 2, -d / 2 + t / 2));
  g.add(place(boxT(t, h, d - 2 * t, m, 2), -w / 2 + t / 2, y + h / 2, 0));
  g.add(place(boxT(t, h, d - 2 * t, m, 2), w / 2 - t / 2, y + h / 2, 0));
}
function antennas(g, w, d, y, n, seed = 1) {
  const r = mulberry(seed), dark = color(0x2a2a2c);
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * (w - 4), z = (r() - 0.5) * (d - 3), hgt = 2 + r() * 3;
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.06, hgt, 0.06), dark), x, y + hgt / 2, z));
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.05), dark), x, y + hgt - 0.3, z));
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.05), dark), x, y + hgt - 0.8, z));
  }
}
function limbBox(a, b, r, m) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), m);
  mesh.position.copy(A).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return mesh;
}
function entrances(g, w, d, y0, n, doorColor) {
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + ((i + 0.5) * w) / n;
    g.add(decal('door', 2.2, 2.6, x, y0 + 1.3, d / 2 + 0.04, { c: doorColor }));
    g.add(place(boxT(3.8, 0.25, 1.9, mat('concrete'), 2), x, y0 + 3.2, d / 2 + 0.95));
    for (let s = 0; s < 3; s++) g.add(place(boxT(3, 0.33 * (3 - s), 0.5, mat('concrete'), 1.5), x, 0.165 * (3 - s), d / 2 + 0.3 + s * 0.5));
  }
}

// ---------- residential ----------
export function khrushchyovka({ w = 60, d = 12, floors = 5, door = '#3a5a8a' } = {}) {
  const g = G(), h = floors * 3;
  g.add(place(boxT(w + 0.3, 1, d + 0.3, mat('concreteDark'), 4), 0, 0.5, 0));
  g.add(place(slab(w, h, d, mat('panel'), roofM(), 6), 0, 1 + h / 2, 0));
  parapet(g, w, d, 1 + h);
  entrances(g, w, d, 1, Math.max(2, Math.round(w / 15)), door);
  antennas(g, w, d, 1 + h, 12, 11);
  return g;
}
export function brezhnevka({ w = 72, d = 14, floors = 9, door = '#6a3a2a' } = {}) {
  const g = G(), h = floors * 3;
  g.add(place(boxT(w + 0.3, 1, d + 0.3, mat('concreteDark'), 4), 0, 0.5, 0));
  g.add(place(slab(w, h, d, mat('panelLoggia'), roofM(), 6), 0, 1 + h / 2, 0));
  parapet(g, w, d, 1 + h);
  entrances(g, w, d, 1, Math.max(3, Math.round(w / 18)), door);
  for (const x of [-w / 4, w / 4]) g.add(place(boxT(5, 3, 5, mat('concrete'), 3), x, 1 + h + 1.5, -d / 4));
  antennas(g, w, d, 1 + h, 16, 12);
  return g;
}
export function towerBlock({ w = 40, d = 16, floors = 16 } = {}) {
  const g = G(), h = floors * 3;
  g.add(place(boxT(w + 0.3, 1.2, d + 0.3, mat('concreteDark'), 4), 0, 0.6, 0));
  g.add(place(slab(w, h, d, mat('ribbon'), roofM(), 6), 0, 1.2 + h / 2, 0));
  for (const x of [-w / 2 + 1, w / 2 - 1]) g.add(place(boxT(2, h, d + 0.4, mat('concrete'), 3), x, 1.2 + h / 2, 0));
  g.add(place(boxT(w * 0.35, 3, d * 0.6, mat('concrete'), 3), 0, 1.2 + h + 1.5, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.15, 14, 0.15), color(0x2a2a2c)), 0, 1.2 + h + 10, 0));
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), color(0xff3020, { emissive: 0xff2010 })), 0, 1.2 + h + 17, 0));
  entrances(g, w, d, 1.2, 2, '#3a5a8a');
  return g;
}

// ---------- Stalinist stepped towers ----------
export function stepped({ tiers, wings = [], columns = null, spire = null, signText = null } = {}) {
  const g = G(), side = mat('stalin'), cornice = mat('concrete');
  let y = 0;
  tiers.forEach((t, i) => {
    g.add(place(slab(t.w, t.h, t.d, side, roofM(), 6), 0, y + t.h / 2, 0));
    g.add(place(boxT(t.w + 1.6, 1.2, t.d + 1.6, cornice, 2), 0, y + t.h + 0.6, 0));
    if (i === 0) for (let x = -t.w / 2 + 4; x <= t.w / 2 - 3; x += 8) g.add(place(boxT(1, t.h, 0.8, cornice, 3), x, t.h / 2, t.d / 2 + 0.4));
    y += t.h + 1.2;
  });
  const base = tiers[0];
  for (const wg of wings) {
    g.add(place(slab(wg.w, wg.h, wg.d, side, roofM(), 6), wg.dx, wg.h / 2, (wg.d - base.d) / 2 + (wg.dz || 0)));
    g.add(place(boxT(wg.w + 1.4, 1.0, wg.d + 1.4, cornice, 2), wg.dx, wg.h + 0.5, (wg.d - base.d) / 2 + (wg.dz || 0)));
    // corner turret on each wing end
    const tx = wg.dx + Math.sign(wg.dx) * (wg.w / 2 - 3), tz = (wg.d - base.d) / 2 + (wg.dz || 0) + wg.d / 2 - 3;
    g.add(place(slab(6, 10, 6, side, roofM(), 6), tx, wg.h + 1 + 5, tz));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.6, 9, 4), mat('shingleGreen', { double: true })); cone.rotation.y = Math.PI / 4; cone.position.set(tx, wg.h + 11 + 4.5, tz); g.add(cone);
  }
  if (columns) {
    for (let i = 0; i < columns.n; i++) {
      const x = -((columns.n - 1) * columns.gap) / 2 + i * columns.gap;
      g.add(place(cylT(0.9, 1.0, columns.h, 12, mat('concrete'), 3), x, columns.h / 2, base.d / 2 + 2));
    }
    g.add(place(boxT((columns.n - 1) * columns.gap + 4, 1.6, 3.2, cornice, 3), 0, columns.h + 0.8, base.d / 2 + 1.6));
    g.add(place(boxT((columns.n - 1) * columns.gap + 6, 0.7, 6, cornice, 3), 0, 0.35, base.d / 2 + 2.6));
  }
  if (spire) {
    const top = y, mid = tiers[tiers.length - 1];
    const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.min(mid.w, mid.d) * 0.42, spire.h, 8), mat('shingleGreen', { double: true }));
    cone.position.set(0, top + spire.h / 2, 0); g.add(cone);
    if (spire.star) {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(2.2), color(0xe03020, { emissive: 0xa01808 }));
      star.scale.set(1, 1.5, 1); star.position.set(0, top + spire.h + 2.5, 0); g.add(star);
      g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4, 6), color(0xd9a62a)), 0, top + spire.h, 0));
    }
  }
  if (signText) { const s = sign(signText, 30, 3.4, { bg: '#7a1c14' }); s.position.set(0, columns ? columns.h + 3 : base.h * 0.5, base.d / 2 + 0.1); g.add(s); }
  return g;
}
export function stalinTower() {
  return stepped({
    tiers: [{ w: 54, d: 34, h: 44 }, { w: 40, d: 26, h: 34 }, { w: 26, d: 20, h: 28 }, { w: 15, d: 14, h: 20 }],
    wings: [{ w: 26, d: 30, h: 28, dx: -40 }, { w: 26, d: 30, h: 28, dx: 40 }],
    columns: { n: 6, gap: 6, h: 14 }, spire: { h: 34, star: true },
  });
}
export function palaceOfCulture() {
  return stepped({
    tiers: [{ w: 74, d: 36, h: 22 }, { w: 36, d: 24, h: 16 }, { w: 18, d: 14, h: 14 }],
    wings: [],
    columns: { n: 9, gap: 7, h: 14 }, spire: { h: 26, star: true }, signText: 'ДВОРЕЦ КУЛЬТУРЫ',
  });
}

// ---------- industry ----------
export function factory({ w = 90, d = 30 } = {}) {
  const g = G();
  g.add(place(slab(w, 5, d, mat('brick'), roofM(), 4), 0, 2.5, 0));
  g.add(place(slab(w, 9, d, mat('ribbon'), roofM(), 6), 0, 9.5, 0));
  const n = Math.floor(w / 10);
  for (let i = 0; i < n; i++) {
    const r = gableRoof(d - 2, 10, 3, 0.1, mat('metalRoof', { double: true }), mat('concrete', { double: true }));
    r.rotation.y = Math.PI / 2; r.position.set(-w / 2 + 5 + i * 10, 14, 0); g.add(r);
  }
  for (const [x, hgt] of [[-w / 2 + 14, 70], [-w / 2 + 28, 58], [-w / 2 + 40, 62]]) {
    g.add(place(cylT(1.5, 2.4, hgt, 14, mat('chimney'), 6), x, 14 + hgt / 2, -d / 2 + 5));
    g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.7, 1.2, 14), color(0x2a2a2c)), x, 14 + hgt, -d / 2 + 5));
  }
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, w * 0.8, 10), color(0x7a6a5a)); pipe.rotation.z = Math.PI / 2; pipe.position.set(0, 12.3, d / 2 + 0.7); g.add(pipe);
  for (let x = -w * 0.38; x <= w * 0.38; x += 12) g.add(place(boxT(0.4, 6, 0.4, mat('concreteDark'), 2), x, 9.3, d / 2 + 0.7));
  for (const x of [-w / 4, w / 4]) { g.add(place(new THREE.Mesh(new THREE.BoxGeometry(6, 6.4, 0.2), mat('ironDoor', { double: true })), x, 3.2, d / 2 + 0.12)); }
  const s = sign('СЛАВА ТРУДУ!', 36, 5, { bg: '#b8352a' }); s.position.set(0, 14 + 5.5, d / 2 - 1); g.add(s);
  for (const x of [-16, 16]) g.add(place(boxT(0.5, 6, 0.5, mat('concreteDark'), 2), x, 14 + 2, d / 2 - 1.2));
  return g;
}
export function coolingTower({ H = 80, rBase = 21, rWaist = 13, yWaist = 55 } = {}) {
  const g = G(), k = (rBase * rBase - rWaist * rWaist) / (yWaist * yWaist), pts = [];
  for (let i = 0; i <= 24; i++) { const y = (i / 24) * H; pts.push(new THREE.Vector2(Math.sqrt(rWaist * rWaist + k * (y - yWaist) * (y - yWaist)), y)); }
  const geo = new THREE.LatheGeometry(pts, 28);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 12, uv.getY(i) * (H / 6));
  g.add(new THREE.Mesh(geo, mat('concreteDark', { double: true })));
  const steam = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('steam'), transparent: true, opacity: 0.85, depthWrite: false }));
  steam.scale.set(70, 56, 1); steam.position.set(0, H + 22, 0); g.add(steam);
  g.userData.steam = steam;
  return g;
}

// ---------- civic ----------
export function metro() {
  const g = G();
  g.add(place(slab(24, 9, 16, mat('stalin'), roofM(), 6), 0, 4.5, 0));
  g.add(place(boxT(25.6, 1, 17.6, mat('concrete'), 2), 0, 9.5, 0));
  g.add(decal('arch', 8, 8, 0, 4, 8.05));
  g.add(place(boxT(14, 0.7, 6, mat('concrete'), 2), 0, 8.2, 11));
  for (const x of [-6, 6]) g.add(place(cylT(0.5, 0.5, 8, 10, mat('concrete'), 2), x, 4, 13.6));
  const s = sign('МЕТРО', 12, 2.4, { bg: '#1a3a6a' }); s.position.set(0, 7.0, 14.1); g.add(s);
  const m = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), new THREE.MeshBasicMaterial({ map: textTexture('М', 128, 128, { bg: '#c8202a', fg: '#ffffff', font: 'bold 112px Arial, Helvetica, sans-serif', border: '#ffffff' }) }));
  m.position.set(0, 13.2, 8.5); g.add(m);
  g.add(place(boxT(0.4, 4, 0.4, mat('concreteDark'), 2), 0, 11.2, 8.4));
  return g;
}
export function circus() {
  const g = G();
  g.add(place(cylT(22, 22, 10, 28, mat('circus'), 8), 0, 5, 0));
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(22.8, 22.8, 1.2, 28), mat('concrete')), 0, 10.6, 0));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(23, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), mat('domeBlue', { double: true }));
  dome.scale.set(1, 0.7, 1); dome.position.y = 11.2; g.add(dome);
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(2.4, 10, 10), mat('domeGold', { double: true })), 0, 11.2 + 12.6 + 3, 0));
  g.add(place(slab(16, 7, 6, mat('concrete'), roofM(), 4), 0, 3.5, 23));
  g.add(place(boxT(18, 0.6, 8, mat('concrete'), 2), 0, 7.3, 24));
  const s = sign('ЦИРК', 14, 3.4, { bg: '#2f5fa8' }); s.position.set(0, 9.2, 26.2); g.add(s);
  g.add(decal('arch', 7, 6.5, 0, 3.25, 26.05));
  return g;
}
export function univermag({ w = 60, d = 24 } = {}) {
  const g = G();
  g.add(place(slab(w, 17, d, mat('concrete'), roofM(), 6), 0, 8.5, 0));
  g.add(tiledPlane(w - 4, 9, (w - 4) / 4, 9 / 4, mat('curtain'), 0, 5.6, d / 2 + 0.06));
  g.add(tiledPlane(w, 7, w / 6, 7 / 6, mat('ribbon'), 0, 13.5, d / 2 + 0.06));
  g.add(place(boxT(w - 6, 0.8, 6, mat('concrete'), 2), 0, 1.4 + 5.2, d / 2 + 3));
  for (let x = -w / 2 + 6; x <= w / 2 - 5; x += 12) g.add(place(cylT(0.35, 0.35, 6.2, 8, mat('concrete'), 2), x, 3.1, d / 2 + 5.4));
  const s = sign('УНИВЕРМАГ', 30, 5, { bg: '#1a3a6a' }); s.position.set(0, 17 + 3.6, d / 2 - 1); g.add(s);
  for (const x of [-12, 12]) g.add(place(boxT(0.5, 4, 0.5, mat('concreteDark'), 2), x, 17 + 1.2, d / 2 - 1.2));
  return g;
}
export function workersClub() {
  const g = G();
  g.add(place(slab(34, 18, 22, mat('concrete'), roofM(), 5), 0, 9, 0));
  g.add(place(cylT(5, 5, 24, 18, mat('curtain'), 4), -15, 12, 12));
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.8, 18), mat('concrete')), -15, 24.4, 12));
  g.add(place(slab(22, 6, 14, mat('ribbon'), roofM(), 6), 8, 20, 10));
  for (const [x, z] of [[0, 15], [16, 15]]) g.add(place(cylT(0.5, 0.5, 17, 8, mat('concrete'), 2), x, 8.5, z));
  g.add(tiledPlane(14, 14, 3.5, 3.5, mat('curtain'), 8, 9, 11.06));
  const s = sign('КЛУБ', 14, 3, { bg: '#b8352a' }); s.position.set(8, 23.4, 17.06); g.add(s);
  return g;
}
export function hotelCosmos({ R = 60, span = 1.15, N = 12, h = 30 } = {}) {
  const g = G(), dd = 14;
  for (let i = 0; i < N; i++) {
    const a = -span / 2 + ((i + 0.5) * span) / N;
    const seg = slab(((R + dd / 2) * span) / N + 0.4, h, dd, mat('ribbon'), roofM(), 6);
    seg.position.set(R * Math.sin(a), h / 2, R * Math.cos(a) - R); seg.rotation.y = a; g.add(seg);
    const cap = boxT(((R + dd / 2) * span) / N + 0.6, 1.2, dd + 1.2, mat('concrete'), 2);
    cap.position.set(R * Math.sin(a), h + 0.6, R * Math.cos(a) - R); cap.rotation.y = a; g.add(cap);
  }
  g.add(place(boxT(24, 6, 12, mat('stalin'), 4), 0, 3, 9));
  const s = sign('ГОСТИНИЦА КОСМОС', 26, 3.2, { bg: '#1a3a6a' }); s.position.set(0, h + 3, dd / 2 - 1.2); g.add(s);
  return g;
}

// ---------- landmarks ----------
export function tvTower() {
  const g = G(), pts = [new THREE.Vector2(7, 0), new THREE.Vector2(6, 30), new THREE.Vector2(4.4, 90), new THREE.Vector2(3.2, 150), new THREE.Vector2(2.6, 180)];
  const geo = new THREE.LatheGeometry(pts, 16);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6, uv.getY(i) * 20);
  g.add(new THREE.Mesh(geo, mat('concrete', { double: true })));
  g.add(place(cylT(11, 6, 5, 16, mat('concreteDark'), 4), 0, 112, 0));
  g.add(place(cylT(12, 12, 6, 16, mat('curtain'), 4), 0, 117.5, 0));
  g.add(place(cylT(5, 12, 4, 16, mat('concreteDark'), 4), 0, 122.5, 0));
  g.add(place(cylT(7, 7, 2.5, 16, mat('concrete'), 3), 0, 126, 0));
  g.add(place(cylT(0.5, 1.3, 70, 8, mat('chimney'), 6), 0, 180 + 35, 0));
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), color(0xff3020, { emissive: 0xff2010 })), 0, 252, 0));
  return g;
}
export function waterTower() {
  const g = G();
  for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) g.add(limbBox([x * 1.2, 0, z * 1.2], [x * 0.8, 18, z * 0.8], 0.35, mat('concreteDark')));
  g.add(place(cylT(5.5, 5.5, 8, 18, mat('concrete'), 4), 0, 22, 0));
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(6, 3.5, 18), color(0x4a4f55)), 0, 27.7, 0));
  return g;
}
export function pylon(h = 42) {
  const g = G(), m = color(0x6a6f76);
  const L = [[-4, -4], [4, -4], [-4, 4], [4, 4]];
  for (const [x, z] of L) g.add(limbBox([x, 0, z], [x * 0.25, h, z * 0.25], 0.22, m));
  for (let y = 6; y < h; y += 8) { const k = 1 - y / h * 0.75; g.add(limbBox([-4 * k, y, -4 * k], [4 * k, y + 8, -4 * k], 0.1, m)); g.add(limbBox([4 * k, y, 4 * k], [-4 * k, y + 8, 4 * k], 0.1, m)); }
  for (const [y, w] of [[h - 9, 16], [h - 3, 12]]) { g.add(place(new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, 0.5), m), 0, y, 0)); for (const s of [-1, 1]) g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 6), color(0xbfc6a8)), s * w / 2, y - 1.2, 0)); }
  return g;
}
export function obelisk() {
  const g = G(), steel = color(0xb4bcc6), gold = color(0xd9a62a, { emissive: 0x3a2a00 });
  g.add(place(cylT(8, 9, 1, 16, mat('concrete'), 3), 0, 0.5, 0));
  g.add(place(cylT(5.5, 6.5, 2, 16, mat('concreteDark'), 3), 0, 2, 0));
  let x = 0, y = 3, ang = 0, r0 = 3.2;
  for (let i = 0; i < 5; i++) {
    const len = 11, r1 = r0 * 0.74;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 14), steel);
    seg.position.set(x + Math.sin(ang) * len / 2, y + Math.cos(ang) * len / 2, 0); seg.rotation.z = -ang; g.add(seg);
    x += Math.sin(ang) * len; y += Math.cos(ang) * len; ang += 0.07; r0 = r1;
  }
  const rocket = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4, 8), gold); rocket.position.set(x + 0.4, y + 1.6, 0); rocket.rotation.z = -ang; g.add(rocket);
  return g;
}
export function eternalFlame() {
  const g = G(), pts = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 2.2 : 5; pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
  const sh = new THREE.Shape(pts);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
  g.add(new THREE.Mesh(geo, mat('concreteDark')));
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.0, 0.8, 10), color(0x3a3a3c)), 0, 1.6, 0));
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('flame'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  flame.scale.set(2.6, 3.8, 1); flame.position.set(0, 3.6, 0); g.add(flame);
  g.userData.flame = flame;
  return g;
}
export function motherland() {
  const g = G(), stone = mat('concrete'), steel = color(0xd0d6dc);
  g.add(place(cylT(16, 44, 20, 28, mat('grass'), 8), 0, 10, 0));
  for (let i = 0; i < 4; i++) g.add(place(cylT(20 - i * 2, 22 - i * 2, 1, 24, mat('paving'), 4), 0, 0.5 + i * 0.5, 22 - i * 0.0));
  g.add(place(cylT(11, 14, 16, 14, mat('concreteDark'), 4), 0, 28, 0));
  g.add(place(cylT(4.2, 9, 30, 14, stone, 5), 0, 51, 0));            // robe
  g.add(place(cylT(3.6, 5.6, 10, 12, stone, 4), 0, 71, 0));          // torso
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(3.2, 14, 10), stone), 0, 78.5, 0));
  const drape = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 16), stone); drape.position.set(-5, 58, -4); drape.rotation.z = 0.12; g.add(drape);
  g.add(limbBox([3, 74, 0], [11, 91, 0], 1.7, stone));                // raised arm
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(2.0, 10, 8), stone), 11.3, 91.6, 0));
  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.4, 34, 0.5), steel); blade.position.set(8.4, 108, 0); blade.rotation.z = 0.2; g.add(blade);
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(7, 1, 1), color(0xd9a62a)), 10.8, 92.5, 0));
  g.add(limbBox([-3, 72, 0], [-9, 62, 4], 1.6, stone));               // shield arm
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.8, 12, 8), steel); shield.position.set(-10, 62, 5); shield.rotation.y = 0.6; g.add(shield);
  return g;
}

// ---------- street props ----------
export function tram() {
  const g = G(), cream = color(0xe8e0c8), dark = color(0x2a2a2c);
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 14), cream), 0, 1.0, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 14), color(0xb8352a)), 0, 2.5, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 13.6), dark), 0, 3.5, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 13.8), dark), 0, 0.35, 0));
  const sm = new THREE.MeshBasicMaterial({ map: tex('tramSide'), side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.2), sm); p.position.set(s * 1.31, 1.95, 0); p.rotation.y = s * Math.PI / 2; g.add(p); }
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 4), dark), 0, 4.2, 0));
  g.add(limbBox([0, 3.6, -1], [0, 4.6, 0.2], 0.05, dark)); g.add(limbBox([0, 3.6, 1], [0, 4.6, 0.2], 0.05, dark));
  for (const z of [-7.02, 7.02]) { g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.05), color(0x26323e)), 0, 2.2, z)); for (const x of [-0.9, 0.9]) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.06), color(0xfff3b0, { emissive: 0xfff3b0 })), x, 1.0, z)); }
  return g;
}
export function lada(hex) {
  const g = G(), body = color(hex), glass = color(0x1a2430);
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 4.2), body), 0, 0.7, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.6, 2.2), glass), 0, 1.3, -0.1));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 2.0), body), 0, 1.65, -0.1));
  for (const [x, z] of [[-0.82, 1.35], [0.82, 1.35], [-0.82, -1.35], [0.82, -1.35]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10), color(0x111111)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.32, z); g.add(w); }
  return g;
}
export function busStop() {
  const g = G(), m = color(0x6a7a86);
  g.add(place(boxT(5, 0.2, 2.2, mat('concrete'), 2), 0, 2.7, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(5, 2.3, 0.1), color(0x7a98a8)), 0, 1.5, -0.95));
  for (const x of [-2.4, 2.4]) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.12), m), x, 1.3, 0.9));
  g.add(place(boxT(3.2, 0.12, 0.5, mat('planks'), 1), 0, 0.5, -0.5));
  const s = sign('АВТОБУС', 2.6, 0.7, { bg: '#1a3a6a' }); s.position.set(0, 3.2, 0.9); g.add(s);
  return g;
}
export function kiosk() {
  const g = G();
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 2.4), color(0x5a7a6a)), 0, 1.3, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, 2.8), color(0x2a3a32)), 0, 2.7, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 0.05), color(0x1a2430)), 0, 1.5, 1.22));
  const s = sign('ГАЗЕТЫ', 2.4, 0.6, { bg: '#b8352a' }); s.position.set(0, 2.2, 1.23); g.add(s);
  return g;
}
export function barrier() {
  const g = G();
  g.add(place(boxT(0.8, 0.9, 3, mat('concrete'), 1.5), 0, 0.45, 0));
  return g;
}
export function billboard(text, bg = '#b8352a') {
  const g = G(), s = sign(text, 14, 4.5, { bg });
  s.position.set(0, 7.5, 0.2); g.add(s);
  const back = new THREE.Mesh(new THREE.BoxGeometry(14.4, 4.9, 0.3), color(0x3a3a3c)); back.position.set(0, 7.5, 0); g.add(back);
  for (const x of [-5, 5]) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 0.4), color(0x3a3a3c)), x, 3, 0));
  return g;
}
