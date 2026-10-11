// Landmarks, monuments, bridges and the industrial district of imperial St. Petersburg.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, gableRoof, decal } from './geo.js';
import { slab, sign } from './buildings2.js';
import { columns, pediment } from './buildings3.js';
import { tex } from './textures.js';
const tilt = (m, axis, v) => { m.rotation[axis] = v; return m; };   // (Object3D.add returns the parent, so tilt the child first)

const G = () => new THREE.Group();
const roofM = () => mat('roofTar');
const gold = () => color(0xd9a62a, { emissive: 0x3a2a00 });
const size = (g, w, d, h, cols = null) => { g.userData = { ...g.userData, w, d, h }; if (cols) g.userData.cols = cols; return g; };

function dome(R, mDome, { drum = 6, drumR = null, windows = true } = {}) {
  const g = G(), dr = drumR || R * 0.9;
  g.add(place(cylT(dr, dr, drum, 20, mat('stuccoWhite'), 4), 0, drum / 2, 0));
  if (windows) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.add(tilt(place(new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.6, 0.2), color(0x1c2a3a)), Math.sin(a) * (dr + 0.02), drum * 0.55, Math.cos(a) * (dr + 0.02)), 'y', a)); }
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(dr + 0.4, dr + 0.4, 0.6, 20), mat('stuccoWhite')), 0, drum + 0.3, 0));
  const d = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(mDome, { double: true }));
  d.scale.y = 0.9; d.position.y = drum + 0.6; g.add(d);
  g.add(place(cylT(R * 0.16, R * 0.2, R * 0.5, 10, mat('stuccoWhite'), 2), 0, drum + 0.6 + R * 0.9 + R * 0.2, 0));
  const top = drum + 0.6 + R * 0.9 + R * 0.5;
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(R * 0.14, 8, 6), gold()), 0, top + R * 0.1, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.28, R * 0.55, 0.28), gold()), 0, top + R * 0.5, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(R * 0.28, 0.24, 0.24), gold()), 0, top + R * 0.62, 0));
  return g;
}

// Kazan Cathedral: cathedral body + dome + two curved colonnade arms reaching forward (+Z)
export function kazan() {
  const g = G(), cols = [];
  const bodyW = 30, bodyD = 38, bodyH = 26, bz = -10;
  g.add(place(slab(bodyW, bodyH, bodyD, mat('stuccoGrey'), roofM(), 8), 0, bodyH / 2, bz));
  g.add(place(boxT(bodyW + 1, 0.8, bodyD + 1, mat('stuccoWhite'), 2), 0, bodyH + 0.4, bz));
  const rf = gableRoof(bodyW + 0.6, bodyD, 3, 0.2, mat('ironGreen', { double: true }), mat('stuccoWhite', { double: true }), 3); rf.rotation.y = Math.PI / 2; rf.position.set(0, bodyH + 0.8, bz); g.add(rf);
  for (let y = 7; y <= 18; y += 11) for (let i = 0; i < 7; i++) g.add(decal('window', 1.3, 2.8, -bodyW / 2 + 3 + i * 4, y, bz + bodyD / 2 + 0.07, { c: '#f4f0e0', lit: i % 3 === 0 }));
  const dm = dome(8.4, 'domeSilver', { drum: 7 }); dm.position.set(0, bodyH + 1.2, bz - 6); g.add(dm);
  columns(g, { n: 4, gap: 3.6, h: 14, r: 0.8, z: bz + bodyD / 2 + 2.4 });
  g.add(place(boxT(14.5, 1.3, 4.4, mat('stuccoWhite'), 2), 0, 14.65 + 0.4, bz + bodyD / 2 + 1.4));
  pediment(g, { w: 14.5, d: 4.4, rise: 2.6, y: 15.9 + 0.4, z: bz + bodyD / 2 + 1.4 });
  cols.push([-bodyW / 2, bodyW / 2, bz - bodyD / 2, bz + bodyD / 2 + 1, bodyH]);
  // curved colonnades
  const C = new THREE.Vector3(0, 0, bz - 6), R = 32, n = 14;
  for (const sd of [-1, 1]) {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = (50 + (i / (n - 1)) * 38) * Math.PI / 180; pts.push([sd * R * Math.sin(a), C.z + R * Math.cos(a)]); }
    pts.forEach(([x, z], i) => {
      g.add(place(cylT(0.75, 0.8, 11, 12, mat('stuccoGrey'), 3), x, 5.5, z));
      g.add(place(boxT(2.2, 0.5, 2.2, mat('stuccoWhite'), 2), x, 11.2, z));
      cols.push([x - 0.8, x + 0.8, z - 0.8, z + 0.8, 11]);
      if (i < pts.length - 1) {
        const [x2, z2] = pts[i + 1], len = Math.hypot(x2 - x, z2 - z), ang = Math.atan2(x2 - x, z2 - z);
        const e = boxT(0.9, 1.4, len, mat('stuccoWhite'), 2); e.position.set((x + x2) / 2, 12.2, (z + z2) / 2); e.rotation.y = ang; g.add(e);
        const roofSeg = boxT(3.0, 0.3, len, mat('ironGreen'), 2); roofSeg.position.set((x + x2) / 2 - sd * 0.2, 13.0, (z + z2) / 2); roofSeg.rotation.y = ang; g.add(roofSeg);
      }
    });
  }
  return size(g, 66, 56, bodyH + 36, cols);
}

export function isaac() {
  const g = G(), w = 44, d = 36, h = 26;
  g.add(place(boxT(w + 8, 1.2, d + 8, mat('granite'), 3), 0, 0.6, 0));
  g.add(place(slab(w, h, d, mat('stuccoGrey'), roofM(), 8), 0, 1.2 + h / 2, 0));
  g.add(place(boxT(w + 1.4, 1.2, d + 1.4, mat('stuccoWhite'), 2), 0, 1.2 + h + 0.6, 0));
  for (const [sx, sz, rot] of [[0, d / 2 + 2.4, 0], [0, -d / 2 - 2.4, Math.PI], [w / 2 + 2.4, 0, Math.PI / 2], [-w / 2 - 2.4, 0, -Math.PI / 2]]) {
    const p = G(); p.position.set(sx, 1.2, sz); p.rotation.y = rot; g.add(p);
    const n = rot === 0 || rot === Math.PI ? 8 : 8;
    columns(p, { n, gap: 3.5, h: 17, r: 0.95, z: 0 });
    p.add(place(boxT((n - 1) * 3.5 + 4, 1.4, 5.4, mat('stuccoWhite'), 2), 0, 17.7 + 0.5, -1.4));
    pediment(p, { w: (n - 1) * 3.5 + 4, d: 5.4, rise: 3.6, y: 18.4 + 0.7, z: -1.4 });
  }
  const dm = dome(11.5, 'domeGold', { drum: 9, drumR: 11.5 }); dm.position.set(0, 1.2 + h + 1.2, 0); g.add(dm);
  for (const [x, z] of [[-w / 2 + 3, -d / 2 + 3], [w / 2 - 3, -d / 2 + 3], [-w / 2 + 3, d / 2 - 3], [w / 2 - 3, d / 2 - 3]]) { const s = dome(2.6, 'domeGold', { drum: 3.4, windows: false }); s.position.set(x, 1.2 + h + 1.2, z); g.add(s); }
  for (let y of [7, 14, 21]) for (let i = 0; i < 6; i++) g.add(decal('window', 1.4, 2.8, -w / 2 + 5 + i * 6.8, y, d / 2 + 0.07 + 5, { c: '#f4f0e0' }));
  return size(g, w + 14, d + 14, h + 40);
}

export function birzha() {
  const g = G(), w = 28, d = 40;
  g.add(place(boxT(w + 6, 1.6, d + 6, mat('granite'), 3), 0, 0.8, 0));
  g.add(place(boxT(w - 4, 14, d - 4, mat('stuccoYellow'), 8), 0, 1.6 + 7, 0));
  for (let i = 0; i < 6; i++) for (const sz of [-1, 1]) {
    g.add(place(cylT(1.05, 1.15, 14, 14, mat('stuccoYellow'), 3), -w / 2 + 1.5 + (i * (w - 3)) / 5, 1.6 + 7, sz * (d / 2 - 1.5)));
  }
  for (let i = 1; i < 9; i++) for (const sx of [-1, 1]) g.add(place(cylT(1.05, 1.15, 14, 14, mat('stuccoYellow'), 3), sx * (w / 2 - 1.5), 1.6 + 7, -d / 2 + 1.5 + (i * (d - 3)) / 9));
  g.add(place(boxT(w + 1.2, 1.4, d + 1.2, mat('stuccoWhite'), 2), 0, 1.6 + 14.7, 0));
  const rf = gableRoof(d + 1.2, w + 1.2, 3.6, 0.4, mat('ironGreen', { double: true }), mat('stuccoWhite', { double: true }), 3); rf.rotation.y = Math.PI / 2; rf.position.set(0, 1.6 + 15.4, 0); g.add(rf);
  return size(g, w + 6, d + 6, 22);
}
export function rostralColumn() {
  const g = G();
  g.add(place(boxT(7, 2.4, 7, mat('granite'), 2), 0, 1.2, 0));
  g.add(place(cylT(1.7, 2.1, 26, 14, mat('stuccoTerra') , 3), 0, 2.4 + 13, 0));
  for (let t = 0; t < 3; t++) for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + t * 0.6; const prow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 2.0), color(0x6a4a2a)); prow.position.set(Math.sin(a) * 2.3, 2.4 + 6 + t * 5.5, Math.cos(a) * 2.3); prow.rotation.y = a; g.add(prow); }
  g.add(place(cylT(2.8, 2.0, 1.6, 14, mat('stuccoWhite'), 2), 0, 2.4 + 26 + 0.8, 0));
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('flame'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  flame.scale.set(3, 4.6, 1); flame.position.set(0, 2.4 + 26 + 3.4, 0); g.add(flame);
  g.userData.flame = flame;
  return size(g, 7, 7, 34);
}
export function alexanderColumn() {
  const g = G();
  g.add(place(boxT(9, 1, 9, mat('granite'), 2), 0, 0.5, 0));
  g.add(place(boxT(7, 8, 7, mat('stuccoGrey'), 4), 0, 1 + 4, 0));
  g.add(place(boxT(8, 1, 8, mat('stuccoWhite'), 2), 0, 9.5, 0));
  g.add(place(cylT(1.7, 2.1, 30, 16, mat('granite'), 3), 0, 10 + 15, 0));
  g.add(place(cylT(2.4, 1.8, 1.6, 16, mat('stuccoWhite'), 2), 0, 40.8, 0));
  g.add(place(cylT(2.2, 2.2, 0.6, 16, mat('stuccoWhite'), 2), 0, 41.8, 0));
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.7, 4, 8), color(0x2e3a30)), 0, 44, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.4, 0.15), color(0x2e3a30)), 0.6, 46.4, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 0.2), color(0x2e3a30)), 0, 45.4, 0));
  return size(g, 9, 9, 48);
}
export function bronzeHorseman() {
  const g = G(), br = color(0x4a4a36), rock = mat('granite');
  const stone = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), rock); stone.scale.set(8, 4.6, 6); stone.position.set(0, 2.2, 0); g.add(stone);
  const stone2 = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), rock); stone2.scale.set(5, 3.2, 4.6); stone2.position.set(-2.5, 5.2, -0.5); g.add(stone2);
  const horse = new THREE.Group(); horse.position.set(0.8, 8, 0); horse.rotation.z = 0.5; g.add(horse);
  horse.add(tilt(place(new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 2.6, 4, 10), br), 0, 0, 0), 'z', Math.PI / 2));
  for (const [x, z] of [[1.6, 0.45], [1.6, -0.45]]) horse.add(place(new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.8, 4, 6), br), x, -1.3, z));
  for (const [x, z] of [[-1.5, 0.45], [-1.5, -0.45]]) horse.add(tilt(place(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 2.0, 4, 6), br), x, -1.4, z), 'z', -0.4));
  horse.add(tilt(place(new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.8, 4, 8), br), 2.4, 1.2, 0), 'z', -0.7));
  horse.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), br), 3.1, 2.2, 0));
  const rider = new THREE.Group(); rider.position.set(0.4, 1.4, 0); horse.add(rider);
  rider.add(place(new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.2, 4, 8), br), 0, 0.8, 0));
  rider.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), br), 0, 1.9, 0));
  rider.add(tilt(place(new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 1.4, 4, 6), br), 0.6, 1.9, 0), 'z', -1.2));
  return size(g, 14, 10, 15);
}
export function teaHouse() {
  const g = G();
  g.add(place(boxT(11, 0.8, 8, mat('granite'), 2), 0, 0.4, 0));
  g.add(place(slab(9, 5, 6, mat('plainPink'), roofM(), 8), 0, 0.8 + 2.5, 0));
  columns(g, { n: 4, gap: 2.6, h: 4.8, r: 0.3, z: 3.6, y: 0.8 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 3.6, 4), mat('ironGreen', { double: true })); roof.rotation.y = Math.PI / 4; roof.position.set(0, 0.8 + 5 + 1.8, 0); g.add(roof);
  g.add(decal('window', 1.0, 2.2, -2.5, 3.0, 3.05, { c: '#fbfaf4', lit: true })); g.add(decal('window', 1.0, 2.2, 2.5, 3.0, 3.05, { c: '#fbfaf4' })); g.add(decal('door', 1.6, 2.8, 0, 2.2, 3.06, { c: '#6a4220' }));
  return size(g, 11, 9, 11);
}
export function kalancha() {
  const g = G();
  g.add(place(boxT(7, 14, 7, mat('sidingBlue'), 2), 0, 7, 0));
  g.add(place(boxT(6, 8, 6, mat('stuccoWhite'), 4), 0, 18, 0));
  g.add(place(boxT(7.4, 0.5, 7.4, mat('planks'), 2), 0, 22.2, 0));
  for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) g.add(place(boxT(0.4, 4.2, 0.4, mat('planks'), 1), x, 24.5, z));
  const rf = new THREE.Mesh(new THREE.ConeGeometry(5.6, 4.5, 4), mat('ironGreen', { double: true })); rf.rotation.y = Math.PI / 4; rf.position.y = 24.6 + 2.2 + 2.2; g.add(rf);
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 0.2), gold()), 0, 31.6, 0));
  g.add(decal('window', 1.2, 2.0, 0, 5.5, 3.55, { c: '#fbfaf4', lit: true })); g.add(decal('door', 1.6, 2.6, 0, 1.4, 3.55, { c: '#4a2a18' }));
  return size(g, 7.6, 7.6, 34);
}

// ---------- water: canal / river edges, bridges ----------
export function bridge({ len = 14, w = 16 } = {}) {
  // crossing direction along local X, bridge width along Z
  const g = G();
  g.add(place(boxT(len + 2, 0.7, w, mat('granite'), 3), 0, -0.3, 0));
  for (const sz of [-1, 1]) {
    g.add(place(boxT(len + 2, 1.1, 0.9, mat('granite'), 2), 0, 0.55, sz * (w / 2 - 0.45)));
    for (let x = -len / 2; x <= len / 2 + 0.1; x += len / 4) { g.add(place(cylT(0.28, 0.35, 4.2, 8, color(0x2a2a2c).map ? mat('granite') : mat('granite'), 1), x, 2.1, sz * (w / 2 - 0.45))); g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), color(0xfff0c0, { emissive: 0xffe9a0 })), x, 4.5, sz * (w / 2 - 0.45))); }
  }
  return size(g, len + 2, w, 5);
}
export function drawbridge({ len = 14, w = 16 } = {}) {
  const g = G();
  const leafLen = len / 2 + 0.5;
  for (const sd of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sd * (len / 2 + 0.6), 0.1, 0); pivot.rotation.z = sd * -1.2; g.add(pivot);
    pivot.add(place(boxT(leafLen, 0.6, w - 1, mat('planks'), 2), -sd * leafLen / 2, 0, 0));
    for (const sz of [-1, 1]) pivot.add(place(boxT(leafLen, 0.9, 0.4, mat('ironGrey'), 2), -sd * leafLen / 2, 0.7, sz * (w / 2 - 0.7)));
    g.add(place(boxT(2.4, 3.6, w, mat('granite'), 2), sd * (len / 2 + 2), 1.4, 0));            // abutment gatehouse
    g.add(place(boxT(2.4, 1.8, 2, mat('ironGrey'), 2), sd * (len / 2 + 4), 5.4, 0));          // counterweight
  }
  return size(g, len + 8, w, 8);
}

// ---------- industrial district ----------
export function ropeWalk() {
  const g = G(), w = 90, d = 8, h = 6.5;
  g.add(place(slab(w, h, d, mat('plainTerra'), roofM(), 8), 0, h / 2, 0));
  for (let x = -w / 2 + 3; x <= w / 2 - 2; x += 4.5) g.add(decal('window', 1.2, 2.0, x, 3.3, d / 2 + 0.06, { c: '#fbfaf4', lit: (x | 0) % 3 === 0 }));
  const rf = gableRoof(w + 0.6, d + 0.6, 2.6, 0.5, mat('ironGrey', { double: true }), mat('stuccoWhite', { double: true }), 3); rf.position.y = h; g.add(rf);
  g.add(place(boxT(1.2, 5, 1.2, mat('brick'), 1.5), 12, h + 3.5, -1));
  const s = sign('КАНАТНЫЙ ДВОР', 12, 1.4, { bg: '#4a2e1c' }); s.position.set(0, h - 0.8, d / 2 + 0.12); g.add(s);
  return size(g, w, d, h + 6);
}
export function porcelainWorks() {
  const g = G(), w = 40, d = 16, h = 16;
  g.add(place(slab(w, h, d, mat('brick'), roofM(), 4), 0, h / 2, 0));
  g.add(place(boxT(w + 0.6, 0.7, d + 0.6, mat('stuccoWhite'), 2), 0, h + 0.35, 0));
  for (let x = -w / 2 + 3; x <= w / 2 - 2; x += 4) for (const y of [5, 11]) g.add(decal('window', 1.3, 2.4, x, y, d / 2 + 0.06, { c: '#fbfaf4', lit: ((x | 0) + y) % 5 === 0 }));
  const rf = gableRoof(w + 0.6, d + 0.6, 3, 0.4, mat('ironRed', { double: true }), mat('stuccoWhite', { double: true }), 3); rf.position.y = h + 0.7; g.add(rf);
  g.add(place(cylT(1.4, 2.0, 46, 12, mat('chimney'), 6), -12, 23, -4));
  g.add(place(cylT(1.4, 2.0, 40, 12, mat('chimney'), 6), 8, 20, -4));
  const s = sign('ФАРФОРОВЫЙ ЗАВОД', 16, 1.5, { bg: '#1c3a6a' }); s.position.set(0, h - 1.2, d / 2 + 0.12); g.add(s);
  return size(g, w, d, h + 6);
}
export function mint() {
  const g = G(), w = 34, d = 24, h = 14;
  g.add(place(slab(w, h, d, mat('stuccoGrey'), roofM(), 4), 0, h / 2, 0));
  g.add(place(boxT(w + 0.6, 0.8, d + 0.6, mat('stuccoWhite'), 2), 0, h + 0.4, 0));
  for (let x = -w / 2 + 3; x <= w / 2 - 2; x += 4) g.add(decal('window', 1.2, 2.2, x, 6, d / 2 + 0.06, { c: '#fbfaf4', lit: (x | 0) % 3 === 0 }));
  const rf = gableRoof(w + 0.6, d + 0.6, 2.6, 0.4, mat('ironGreen', { double: true }), mat('stuccoWhite', { double: true }), 3); rf.position.y = h + 0.8; g.add(rf);
  g.add(place(slab(8, 10, 8, mat('stuccoGrey'), roofM(), 4), -w / 2 + 4, h + 5, 0));
  const sp = new THREE.Mesh(new THREE.ConeGeometry(3.2, 9, 8), mat('domeGold', { double: true })); sp.position.set(-w / 2 + 4, h + 10 + 4.5, 0); g.add(sp);
  g.add(place(cylT(1.0, 1.6, 30, 10, mat('chimney'), 6), w / 2 - 5, h + 13, -5));
  return size(g, w, d, h + 20);
}
export function arsenalFoundry() {
  const g = G(), w = 56, d = 24, h = 11;
  g.add(place(slab(w, h, d, mat('brick'), roofM(), 4), 0, h / 2, 0));
  for (let x = -w / 2 + 4; x <= w / 2 - 3; x += 5) g.add(decal('window', 1.6, 3.2, x, 5.5, d / 2 + 0.06, { c: '#6a6a6e', lit: (x | 0) % 4 === 0 }));
  for (let i = 0; i < 5; i++) { const r = gableRoof(d - 1, 11, 2.6, 0.1, mat('metalRoof', { double: true }), mat('brick', { double: true }), 3); r.rotation.y = Math.PI / 2; r.position.set(-w / 2 + 5.5 + i * 11, h, 0); g.add(r); }
  for (const x of [-18, 6, 20]) g.add(place(cylT(1.5, 2.3, 52, 12, mat('chimney'), 6), x, 11 + 26, -6));
  const s = sign('ЛИТЕЙНЫЙ ДВОР', 14, 1.5, { bg: '#2a2a2e' }); s.position.set(0, h - 1.2, d / 2 + 0.12); g.add(s);
  return size(g, w, d, h + 8);
}
export function windSawmill() {
  const g = G();
  g.add(place(boxT(12, 6, 8, mat('sidingGreen'), 2), 5, 3, 0));
  const rf = gableRoof(12.6, 8.6, 2.6, 0.4, mat('ironRed', { double: true }), mat('sidingGreen', { double: true }), 2); rf.position.set(5, 6, 0); g.add(rf);
  g.add(place(cylT(2.3, 3.6, 13, 8, mat('sidingYellow'), 2), -4, 6.5, 0));
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.8, 2.6, 8), mat('ironRed', { double: true })); cap.position.set(-4, 14.5, 0); g.add(cap);
  const hub = new THREE.Group(); hub.position.set(-4, 12, 3.2); g.add(hub);
  const bm = mat('lattice', { double: true });
  for (let i = 0; i < 4; i++) { const arm = new THREE.Group(); arm.rotation.z = (i * Math.PI) / 2; arm.add(place(boxT(0.22, 8, 0.2, mat('planks'), 1), 0, 4, 0)); const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 6.4), bm); pl.position.set(1.0, 4.4, 0.06); arm.add(pl); hub.add(arm); }
  g.userData.blades = hub;
  g.add(place(boxT(8, 0.3, 4, mat('planks'), 2), 5, 0.2, 7));         // log deck
  for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), mat('planks')); l.rotation.z = Math.PI / 2; l.position.set(3 + (i % 3) * 0.5, 0.7 + Math.floor(i / 3) * 0.8, 6.5 + (i % 2)); g.add(l); }
  return size(g, 22, 18, 16);
}
export function shipHull() {   // a ship under construction on the slipway of the Admiralty Shipyard
  const g = G(), wood = mat('planks');
  g.add(place(boxT(34, 0.7, 1.4, wood, 2), 0, 1.1, 0));
  for (let i = 0; i < 14; i++) {
    const x = -15 + i * 2.3, s = Math.sin((i / 13) * Math.PI) * 0.85 + 0.35, hgt = 3 + s * 6;
    for (const sd of [-1, 1]) { const rib = new THREE.Mesh(new THREE.BoxGeometry(0.4, hgt, 0.35), wood.clone ? wood : wood); rib.position.set(x, 1.4 + hgt / 2, sd * s * 4.2); rib.rotation.x = sd * 0.35; g.add(rib); }
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, s * 8.8), wood), x, 1.6 + hgt * 0.6, 0));
  }
  g.add(place(boxT(36, 0.5, 11, mat('planks'), 3), 0, 0.25, 0));
  for (const x of [-12, 12]) { g.add(place(boxT(0.6, 18, 0.6, mat('planks'), 2), x, 9, 7)); g.add(place(boxT(0.4, 0.4, 14, mat('planks'), 2), x, 17.5, 0)); }
  return size(g, 38, 12, 12);
}

// ---------- background: Peter and Paul Fortress across the river ----------
export function petrPavel() {
  const g = G();
  g.add(place(boxT(150, 7, 10, mat('stuccoGrey'), 8), 0, 3.5, 0));
  for (let x = -70; x <= 70; x += 14) g.add(place(boxT(8, 9, 8, mat('stuccoGrey'), 8), x, 4.5, 8));
  g.add(place(slab(16, 20, 40, mat('stuccoYellow'), roofM(), 8), 0, 10, 24));
  g.add(place(slab(10, 18, 10, mat('stuccoYellow'), roofM(), 8), 0, 9 + 9, 4));
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(2.6, 62, 8), gold()), 0, 18 + 31, 4));
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), gold()), 0, 18 + 62, 4));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 0.3), gold()), 0, 18 + 66, 4));
  return g;
}

// ---------- street props ----------
export function carriage() {
  const g = G(), body = color(0x2a4a3a), trim = color(0xd9a62a), dark = color(0x1c1c1e);
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.3, 2.6), body), 0, 1.3, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 2.7), trim), 0, 0.7, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 2.7), dark), 0, 2.05, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.9), dark), 0, 2.0, 1.9));
  for (const [x, z] of [[-0.95, 0.9], [0.95, 0.9], [-0.95, -0.9], [0.95, -0.9]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.14, 14), dark); w.rotation.z = Math.PI / 2; w.position.set(x, 0.55, z); g.add(w); }
  const horse = color(0x4a3220);
  for (const sx of [-0.45, 0.45]) {
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 1.7), horse), sx, 1.35, 3.6));
    for (const [dx, dz] of [[-0.18, 0.7], [0.18, 0.7], [-0.18, -0.7], [0.18, -0.7]]) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.95, 0.16), horse), sx + dx, 0.5, 3.6 + dz));
    g.add(tilt(place(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.8), horse), sx, 1.9, 4.6), 'x', -0.4));
  }
  return size(g, 2.4, 6.4, 3);
}
export function bench() {
  const g = G();
  g.add(place(boxT(1.8, 0.1, 0.5, mat('planks'), 1), 0, 0.5, 0));
  g.add(place(boxT(1.8, 0.5, 0.08, mat('planks'), 1), 0, 0.85, -0.22));
  for (const x of [-0.8, 0.8]) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5), color(0x1c1c1e)), x, 0.25, 0));
  return size(g, 1.9, 0.6, 1.2);
}
export function fountain() {
  const g = G();
  g.add(place(cylT(4.4, 4.6, 0.8, 20, mat('granite'), 2), 0, 0.4, 0));
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.1, 20), new THREE.MeshBasicMaterial({ map: tex('water') })), 0, 0.78, 0));
  g.add(place(cylT(0.5, 0.8, 2.6, 10, mat('granite'), 2), 0, 1.7, 0));
  g.add(place(cylT(1.6, 0.4, 0.5, 14, mat('granite'), 2), 0, 3.1, 0));
  const spray = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('steam'), transparent: true, opacity: 0.55, depthWrite: false })); spray.scale.set(3, 3.4, 1); spray.position.set(0, 4.4, 0); g.add(spray);
  return size(g, 9.4, 9.4, 4);
}
export function cafeTable() {
  const g = G();
  g.add(place(cylT(0.45, 0.45, 0.06, 12, color(0xe8e0d0).map ? mat('stuccoWhite') : mat('stuccoWhite'), 1), 0, 0.78, 0));
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.76, 6), color(0x2a2a2c)), 0, 0.38, 0));
  for (const a of [0, 2.1, 4.2]) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), color(0x4a3220)), Math.sin(a) * 0.8, 0.46, Math.cos(a) * 0.8));
  return size(g, 2.2, 2.2, 1);
}
