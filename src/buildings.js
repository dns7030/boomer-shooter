// Muscovy-era building facades (exteriors only — nobody walks inside).
// Every builder returns a THREE.Group with origin at footprint centre on the
// ground and the street-facing front toward local +Z.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, gableRoof, onionDome, decal, plane } from './geo.js';

const G = () => new THREE.Group();

function tiledPlane(w, h, u, v, material, x, y, z) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  return m;
}

function windowRow(g, n, y, span, z, trim, litIdx = [], size = [1.0, 1.5]) {
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : -span / 2 + (span * i) / (n - 1);
    g.add(decal('window', size[0], size[1], x, y, z + 0.03, { c: trim, lit: litIdx.includes(i) }));
  }
}

function porch(g, x, d, h, doorColor) {
  const z = d / 2;
  g.add(decal('door', 1.3, 2.3, x, 0.5 + 1.15, z + 0.03, { c: doorColor }));
  g.add(place(boxT(2.2, 0.12, 1.5, mat('planks'), 1), x, 3.0, z + 0.75));
  g.add(place(boxT(0.15, 2.5, 0.15, mat('logs'), 1), x - 1.0, 1.75, z + 1.4));
  g.add(place(boxT(0.15, 2.5, 0.15, mat('logs'), 1), x + 1.0, 1.75, z + 1.4));
  g.add(place(boxT(1.8, 0.3, 1.2, mat('planks'), 1), x, 0.15, z + 0.8));
}

// Izba: log house with plank gable roof.
export function izba({ w = 8, d = 7, h = 3.4, trim = '#b4352a', roof = 'shingleBrown', lit = [1], doorColor = '#6a4220' } = {}) {
  const g = G();
  g.add(place(boxT(w + 0.2, 0.5, d + 0.2, mat('stone'), 2), 0, 0.25, 0));
  g.add(place(boxT(w, h, d, mat('logs'), 2), 0, 0.5 + h / 2, 0));
  const rise = 2.6;
  const r = gableRoof(w, d, rise, 0.7, mat(roof, { double: true }), mat('planks', { double: true }));
  r.position.y = 0.5 + h;
  g.add(r);
  windowRow(g, 2, 0.5 + h * 0.55, w * 0.7, d / 2, trim, lit);
  porch(g, w / 2 - 1.6, d, h, doorColor);
  g.add(place(boxT(0.9, 2.6, 0.9, mat('brick'), 1.5), -w / 4, 0.5 + h + rise * 0.7, -d / 5));
  g.userData.cols = [[w / 2 - 1.6 - 1.1, w / 2 - 1.6 + 1.1, d / 2, d / 2 + 1.5, 3]];
  return g;
}

export function banya() {
  const g = izba({ w: 6, d: 5.5, h: 2.8, trim: '#3f6aa8', roof: 'shingleGrey', lit: [0] });
  g.add(place(boxT(0.7, 4, 0.7, mat('brick'), 1.5), 1.6, 5, -1.2));
  return g;
}

export function smithy() {
  const g = izba({ w: 9, d: 7, h: 3.2, trim: '#555', roof: 'shingleBrown', lit: [0, 1] });
  g.add(place(boxT(1.2, 7.5, 1.2, mat('brick'), 1.5), -2.8, 4.6, -1.5));
  g.add(place(boxT(2.6, 1.7, 0.3, color(0xff7a22, { emissive: 0xff5a10 })), -2.8, 1.6, 3.45));
  return g;
}

// Boyar terem: stone ground floor, log upper floor, steep roof, carved porch.
export function terem({ w = 11, d = 8, trim = '#b4352a', roof = 'shingleRed' } = {}) {
  const g = G();
  const h1 = 3.2, h2 = 3.0;
  g.add(place(boxT(w, h1, d, mat('plaster'), 2), 0, h1 / 2, 0));
  g.add(place(boxT(w + 0.8, 0.35, d + 0.8, mat('planks'), 1.5), 0, h1 + 0.17, 0));
  g.add(place(boxT(w + 0.5, h2, d + 0.5, mat('logs'), 2), 0, h1 + 0.35 + h2 / 2, 0));
  const rise = 4;
  const r = gableRoof(w + 0.5, d + 0.5, rise, 0.8, mat(roof, { double: true }), mat('planks', { double: true }));
  r.position.y = h1 + 0.35 + h2;
  g.add(r);
  const zf = d / 2;
  windowRow(g, 4, 1.9, w * 0.72, zf, '#e8e0cc', [1]);
  windowRow(g, 4, h1 + 0.35 + h2 / 2 + 0.1, w * 0.72, zf + 0.25, trim, [2]);
  // porch with stair and gallery
  for (let i = 0; i < 5; i++) g.add(place(boxT(2.4, 0.6 * (i + 1), 0.7, mat('planks'), 1), -w / 4, 0.3 * (i + 1), zf + 3.0 - i * 0.7 + 0.2));
  g.add(place(boxT(2.6, 0.2, 1.4, mat('planks'), 1), -w / 4, 3.1, zf + 0.2));
  g.add(decal('door', 1.4, 2.4, -w / 4, 3.1 + 1.2 + 0.2, zf + 0.28, { c: '#6a4220' }));
  g.add(place(boxT(0.18, 1.4, 0.18, mat('logs'), 1), -w / 4 - 1.2, 3.9, zf + 0.9));
  g.add(place(boxT(0.18, 1.4, 0.18, mat('logs'), 1), -w / 4 + 1.2, 3.9, zf + 0.9));
  // front dormer (kokoshnik-ish)
  const dm = place(boxT(3.2, 2.2, 1.4, mat('logs'), 2), w / 5, h1 + 0.35 + h2 + 0.5, zf + 0.5);
  g.add(dm);
  const dr = gableRoof(1.4, 3.2, 1.9, 0.3, mat(roof, { double: true }), mat('planks', { double: true }));
  dr.rotation.y = Math.PI / 2;
  dr.position.set(w / 5, h1 + 0.35 + h2 + 1.6, zf + 0.5);
  g.add(dr);
  g.add(decal('window', 0.9, 1.35, w / 5, h1 + 0.35 + h2 + 0.5, zf + 1.23, { c: trim, lit: true }));
  g.add(place(boxT(0.9, 3, 0.9, mat('brick'), 1.5), w / 4, h1 + h2 + 5.2, -d / 5));
  g.userData.cols = [[-w / 4 - 1.3, -w / 4 + 1.3, zf, zf + 3.6, 3.2]];
  return g;
}

// Merchant white-stone palaty.
export function palaty({ w = 10, d = 8, trim = '#8a8f92' } = {}) {
  const g = G();
  const h = 7.2;
  g.add(place(boxT(w + 0.3, 1.0, d + 0.3, mat('brick'), 2), 0, 0.5, 0));
  g.add(place(boxT(w, h, d, mat('plaster'), 2), 0, 1.0 + h / 2, 0));
  g.add(place(boxT(w + 0.4, 0.4, d + 0.4, mat('stone'), 1.5), 0, 1.0 + h + 0.1, 0));
  const r = gableRoof(w + 0.4, d + 0.4, 3.2, 0.5, mat('shingleRed', { double: true }), mat('plaster', { double: true }));
  r.position.y = 1.0 + h + 0.3;
  g.add(r);
  const zf = d / 2;
  windowRow(g, 3, 2.9, w * 0.62, zf, trim, [0]);
  windowRow(g, 3, 6.3, w * 0.62, zf, trim, [1]);
  g.add(decal('door', 1.5, 2.6, w * 0.34, 1.0 + 1.3, zf + 0.03, { c: '#4a2f16' }));
  g.add(place(boxT(2.4, 0.3, 1.4, mat('stone'), 1), w * 0.34, 3.9, zf + 0.6));
  g.add(place(boxT(0.9, 3.4, 0.9, mat('brick'), 1.5), -w / 4, 1.0 + h + 3.2, -d / 5));
  return g;
}

// Gostiny Dvor: two-tier trading arcade.
export function gostinyDvor({ w = 14, d = 8 } = {}) {
  const g = G();
  const h = 5.4;
  g.add(place(boxT(w, h, d, mat('plaster'), 2), 0, h / 2, 0));
  const bays = Math.max(1, Math.round(w / 5));
  g.add(tiledPlane(w - 0.2, h, bays, 2, mat('arcade'), 0, h / 2, d / 2 + 0.03));
  g.add(place(boxT(w + 0.5, 0.45, d + 0.5, mat('stone'), 1.5), 0, h + 0.2, 0));
  const r = gableRoof(w + 0.5, d + 0.5, 1.8, 0.4, mat('shingleGrey', { double: true }), mat('plaster', { double: true }));
  r.position.y = h + 0.4;
  g.add(r);
  return g;
}

// Kizhi-style wooden church with an onion-dome cluster.
export function kizhiChurch() {
  const g = G();
  const domeM = mat('domeSilver', { double: true });
  const cross = color(0xd9a62a, { emissive: 0x2a1c00 });
  g.add(place(boxT(7, 4.6, 7, mat('logs'), 2), 0, 2.3, 0));
  const r0 = gableRoof(7, 7, 2.0, 0.6, mat('shingleGrey', { double: true }), mat('planks', { double: true }));
  r0.position.y = 4.6; g.add(r0);
  g.add(place(cylT(2.7, 3.1, 3.4, 8, mat('logs'), 2), 0, 4.6 + 1.7 + 1.0, 0));
  const t2 = 4.6 + 3.4 + 1.0;
  const cone1 = new THREE.Mesh(new THREE.ConeGeometry(2.9, 1.6, 8), mat('shingleGrey', { double: true }));
  cone1.position.set(0, t2 + 0.8, 0); g.add(cone1);
  g.add(place(cylT(1.7, 2.0, 2.8, 8, mat('planks'), 2), 0, t2 + 1.4 + 0.9, 0));
  const t3 = t2 + 2.8 + 0.9;
  const cone2 = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.3, 8), mat('shingleGrey', { double: true }));
  cone2.position.set(0, t3 + 0.55, 0); g.add(cone2);
  g.add(place(cylT(0.9, 1.0, 1.4, 8, mat('planks'), 2), 0, t3 + 1.7, 0));
  const top = onionDome(1.5, 3.4, domeM, cross); top.position.set(0, t3 + 2.4, 0); g.add(top);
  for (const [dx, dz] of [[1.6, 1.6], [-1.6, 1.6], [1.6, -1.6], [-1.6, -1.6]]) {
    g.add(place(cylT(0.5, 0.55, 0.9, 8, mat('planks'), 1), dx, t2 + 0.5, dz));
    const dm = onionDome(0.95, 2.1, domeM, cross); dm.position.set(dx, t2 + 0.95, dz); g.add(dm);
  }
  g.add(place(boxT(2.6, 2.8, 2.0, mat('logs'), 2), 0, 1.4, 4.0));
  const pr = gableRoof(2.6, 2.0, 1.2, 0.3, mat('shingleGrey', { double: true }), mat('planks', { double: true }));
  pr.position.set(0, 2.8, 4.0); g.add(pr);
  g.add(decal('door', 1.2, 2.1, 0, 1.45, 5.03, { c: '#5a3a1c' }));
  g.add(decal('window', 0.8, 1.2, 2.4, 3.0, 3.53, { c: '#d8c8a0', lit: true }));
  g.add(decal('window', 0.8, 1.2, -2.4, 3.0, 3.53, { c: '#d8c8a0', lit: true }));
  g.userData.cols = [[-1.4, 1.4, 4.9 - 2.2, 5.1, 3]];
  return g;
}

// Kolokolnya: tall whitewashed bell tower with green tent roof.
export function bellTower() {
  const g = G();
  const crossM = color(0xd9a62a, { emissive: 0x2a1c00 });
  g.add(place(boxT(5.2, 7, 5.2, mat('plaster'), 2), 0, 3.5, 0));
  g.add(place(boxT(5.6, 0.5, 5.6, mat('stone'), 1.5), 0, 7.2, 0));
  g.add(decal('arch', 1.6, 2.4, 0, 1.25, 2.63));
  g.add(decal('window', 0.8, 1.2, 0, 4.4, 2.63, { c: '#d8c8a0' }));
  g.add(place(boxT(4.2, 4.2, 4.2, mat('plaster'), 2), 0, 7.45 + 2.1, 0));
  for (const [x, z, ry] of [[0, 2.13, 0], [0, -2.13, 0], [2.13, 0, Math.PI / 2], [-2.13, 0, Math.PI / 2]]) {
    const a = decal('arch', 2.0, 3.0, x, 7.45 + 2.0, z);
    a.rotation.y = ry; g.add(a);
  }
  g.add(place(boxT(4.6, 0.4, 4.6, mat('stone'), 1.5), 0, 11.85, 0));
  g.add(place(cylT(1.7, 2.1, 2.4, 8, mat('plaster'), 2), 0, 13.25, 0));
  const tent = new THREE.Mesh(new THREE.ConeGeometry(2.4, 6.5, 8), mat('shingleGreen', { double: true }));
  tent.position.set(0, 14.45 + 3.25, 0); g.add(tent);
  const dm = onionDome(0.6, 1.4, mat('domeGold', { double: true }), crossM); dm.position.set(0, 20.9, 0); g.add(dm);
  return g;
}

export function windmill() {
  const g = G();
  g.add(place(cylT(1.9, 3.1, 6.6, 8, mat('planks'), 2), 0, 3.3, 0));
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.6, 8), mat('shingleBrown', { double: true }));
  cap.position.set(0, 7.9, 0); g.add(cap);
  g.add(place(boxT(0.9, 1.9, 0.12, mat('ironDoor'), 1), 0, 1.0, 2.95));
  const hub = new THREE.Group();
  hub.position.set(0, 7.1, 2.2);
  hub.add(place(boxT(0.5, 0.5, 0.6, mat('logs'), 1), 0, 0, 0));
  const bm = mat('lattice', { double: true });
  bm.transparent = true; bm.alphaTest = 0.5;
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    arm.add(place(boxT(0.18, 6.3, 0.15, mat('logs'), 1), 0, 3.15, 0));
    arm.add(tiledPlane(1.5, 5.3, 1, 1, bm, 0.95, 3.5, 0.05));
    hub.add(arm);
  }
  g.add(hub);
  g.userData.blades = hub;
  return g;
}

// Spasskaya-style gate tower (front toward +Z).
export function gateTower() {
  const g = G();
  const crossM = color(0xd9a62a, { emissive: 0x3a2a00 });
  g.add(place(boxT(9, 15, 8, mat('brick'), 2), 0, 7.5, 0));
  g.add(place(boxT(9.6, 0.7, 8.6, mat('plaster'), 1.5), 0, 15.2, 0));
  g.add(place(boxT(6.4, 5.4, 6.4, mat('brick'), 2), 0, 15.55 + 2.7, 0));
  g.add(place(boxT(6.9, 0.5, 6.9, mat('plaster'), 1.5), 0, 21.2, 0));
  g.add(place(boxT(4.4, 3.4, 4.4, mat('brick'), 2), 0, 21.45 + 1.7, 0));
  const tent = new THREE.Mesh(new THREE.ConeGeometry(3.6, 9, 4), mat('shingleGreen', { double: true }));
  tent.rotation.y = Math.PI / 4; tent.position.set(0, 24.85 + 4.5, 0); g.add(tent);
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.2, 5), crossM), 0, 35.0, 0));
  g.add(plane(mat('clock'), 2.6, 2.6, 0, 18.3, 3.23));
  // gate: dark arch plus iron-bound doors
  g.add(decal('arch', 4.6, 7, 0, 3.5, 4.04));
  g.add(plane(mat('ironDoor'), 3.8, 5.0, 0, 2.55, 4.06));
  for (const s of [-1, 1]) {
    g.add(place(boxT(1.3, 1.6, 1.3, mat('brick'), 1.5), s * 3.6, 15.7 + 0.8 + 4.2, 3.3));
    g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 4), mat('shingleGreen', { double: true })), s * 3.6, 22.4 + 0.2, 3.3));
  }
  return g;
}

// Kremlin wall with swallowtail-ish merlons. Wall runs along X, front +Z.
export function kremlinWall(len, h = 9) {
  const g = G();
  g.add(place(boxT(len, h, 3, mat('brick'), 2), 0, h / 2, 0));
  g.add(place(boxT(len, 0.4, 3.4, mat('plaster'), 1.5), 0, h + 0.1, 0));
  const n = Math.floor(len / 1.9);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + 0.95 + i * 1.9;
    g.add(place(boxT(1.1, 1.5, 1.4, mat('brick'), 1.5), x, h + 0.3 + 0.75, 0));
    g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 4), mat('brick')), x, h + 0.3 + 1.75, 0));
  }
  return g;
}

export function wallTower(h = 14) {
  const g = G();
  g.add(place(boxT(5, h, 5, mat('brick'), 2), 0, h / 2, 0));
  g.add(place(boxT(5.5, 0.5, 5.5, mat('plaster'), 1.5), 0, h + 0.1, 0));
  const tent = new THREE.Mesh(new THREE.ConeGeometry(3.4, 5.5, 4), mat('shingleGreen', { double: true }));
  tent.rotation.y = Math.PI / 4; tent.position.set(0, h + 0.4 + 2.75, 0); g.add(tent);
  g.add(decal('window', 0.7, 1.05, 0, h - 3.5, 2.53, { c: '#d8c8a0' }));
  return g;
}

// Wooden ostrog palisade with a guard tower.
export function palisade(len) {
  const g = G();
  g.add(place(boxT(len, 5.2, 0.8, mat('planks'), 2), 0, 2.6, 0));
  const n = Math.floor(len / 0.62);
  const geo = new THREE.ConeGeometry(0.34, 0.9, 4);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, mat('planks'));
    m.position.set(-len / 2 + 0.31 + i * 0.62, 5.2 + 0.4, 0.05);
    m.rotation.y = Math.PI / 4; g.add(m);
  }
  return g;
}
export function guardTower() {
  const g = G();
  g.add(place(boxT(3.4, 7, 3.4, mat('logs'), 2), 0, 3.5, 0));
  g.add(place(boxT(4.6, 0.4, 4.6, mat('planks'), 1.5), 0, 7.2, 0));
  g.add(place(boxT(3.4, 1.8, 3.4, mat('planks'), 1.5), 0, 8.3, 0));
  const r = gableRoof(3.4, 3.4, 2.6, 0.7, mat('shingleBrown', { double: true }), mat('planks', { double: true }));
  r.position.y = 9.2; g.add(r);
  g.add(decal('window', 0.8, 1.2, 0, 8.3, 1.73, { c: '#7a5a38', lit: true }));
  return g;
}

// --------- street props ----------
export function stall(awning = 'awningRed') {
  const g = G();
  g.add(place(boxT(2.4, 1.0, 1.2, mat('planks'), 1), 0, 0.5, 0));
  for (const [x, z] of [[-1.1, 0.5], [1.1, 0.5], [-1.1, -0.5], [1.1, -0.5]]) g.add(place(boxT(0.12, 2.3, 0.12, mat('logs'), 1), x, 1.15, z));
  const aw = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.1, 1.9), mat(awning));
  aw.position.set(0, 2.35, 0.2); aw.rotation.x = 0.18; g.add(aw);
  const cols = [0xc04030, 0xd8b040, 0x6aa050, 0xe0e0d0];
  for (let i = 0; i < 6; i++) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.25), color(cols[i % 4])), -0.9 + i * 0.36, 1.1, 0.1));
  return g;
}
export function crateStack() {
  const g = G();
  g.add(place(boxT(1.0, 1.0, 1.0, mat('crate'), 1), 0, 0.5, 0));
  g.add(place(boxT(0.9, 0.9, 0.9, mat('crate'), 1), 0.95, 0.45, 0.1));
  const t = place(boxT(0.9, 0.9, 0.9, mat('crate'), 1), 0.3, 1.45, 0); t.rotation.y = 0.4; g.add(t);
  return g;
}
export function barrels() {
  const g = G();
  for (const [x, z] of [[0, 0], [0.9, 0.2], [0.4, -0.8]]) g.add(place(cylT(0.38, 0.38, 1.0, 10, mat('barrel'), 1), x, 0.5, z));
  return g;
}
export function wayCross() {
  const g = G();
  g.add(place(boxT(0.25, 3.4, 0.25, mat('logs'), 1), 0, 1.7, 0));
  g.add(place(boxT(1.3, 0.22, 0.2, mat('logs'), 1), 0, 2.7, 0));
  g.add(place(boxT(0.8, 0.18, 0.2, mat('logs'), 1), 0, 3.15, 0));
  const r = gableRoof(0.9, 0.5, 0.35, 0.1, mat('shingleBrown', { double: true }), mat('planks', { double: true }));
  r.position.set(0, 3.5, 0); g.add(r);
  g.add(place(cylT(0.9, 0.9, 0.5, 8, mat('stone'), 1), 0, 0.25, 0));
  return g;
}
export function well() {
  const g = G();
  g.add(place(cylT(1.0, 1.0, 1.0, 10, mat('stone'), 1), 0, 0.5, 0));
  g.add(place(boxT(0.15, 2.4, 0.15, mat('logs'), 1), -0.9, 1.9, 0));
  g.add(place(boxT(0.15, 2.4, 0.15, mat('logs'), 1), 0.9, 1.9, 0));
  const r = gableRoof(2.4, 1.4, 0.8, 0.2, mat('shingleBrown', { double: true }), mat('planks', { double: true }));
  r.position.set(0, 3.1, 0); g.add(r);
  return g;
}
export function hayCart() {
  const g = G();
  g.add(place(boxT(2.6, 0.5, 1.3, mat('planks'), 1), 0, 0.85, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.1), color(0xc9a850)), 0, 1.5, 0));
  for (const z of [-0.7, 0.7]) { const w = place(cylT(0.55, 0.55, 0.12, 12, mat('planks'), 1), -0.7, 0.55, z); w.rotation.x = Math.PI / 2; g.add(w); const w2 = place(cylT(0.55, 0.55, 0.12, 12, mat('planks'), 1), 0.7, 0.55, z); w2.rotation.x = Math.PI / 2; g.add(w2); }
  return g;
}
export function brazier() {
  const g = G();
  g.add(place(boxT(0.12, 1.4, 0.12, mat('logs'), 1), 0, 0.7, 0));
  g.add(place(cylT(0.35, 0.2, 0.3, 8, color(0x2d2d33), 1), 0, 1.5, 0));
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 5), color(0xff8a2a, { emissive: 0xff6a10 })), 0, 1.85, 0));
  return g;
}
