// Imperial St. Petersburg: townhouses, mansions, palaces, shops and wooden houses.
// Same conventions as the other building files: origin at footprint centre on the ground, front toward local +Z.
// Every builder stores its footprint and height in group.userData = { w, d, h } so the level can add colliders.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, gableRoof, decal } from './geo.js';
import { slab, tiledPlane, sign } from './buildings2.js';

const G = () => new THREE.Group();
const size = (g, w, d, h) => { g.userData = { ...g.userData, w, d, h }; return g; };
const roofM = () => mat('roofTar');

// ---------- shared pieces ----------
export function columns(g, { n, gap, h, r = 0.55, z, y = 0, wall = 'stuccoWhite', x0 = null }) {
  const start = x0 === null ? -((n - 1) * gap) / 2 : x0;
  for (let i = 0; i < n; i++) {
    const x = start + i * gap;
    g.add(place(cylT(r, r * 1.08, h, 14, mat(wall), 3), x, y + h / 2, z));
    g.add(place(boxT(r * 2.8, 0.45, r * 2.8, mat(wall), 2), x, y + h + 0.22, z));
    g.add(place(boxT(r * 2.5, 0.3, r * 2.5, mat(wall), 2), x, y + 0.15, z));
  }
}
// triangular pediment facing +Z. width across x, depth along z
export function pediment(g, { w, d = 1.2, rise, y, z, wall = 'stuccoWhite', roof = 'ironGrey' }) {
  const r = gableRoof(d, w, rise, 0.0, mat(roof, { double: true }), mat(wall, { double: true }), 3);
  r.rotation.y = Math.PI / 2; r.position.set(0, y, z); g.add(r);
}
function dormers(g, { w, d, y, slopeRise, over = 0.7, n, wall = 'stuccoWhite' }) {
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + ((i + 0.5) * w) / n, zz = d / 2 - 0.4;
    g.add(place(boxT(1.5, 1.6, 1.4, mat(wall), 2), x, y + 0.9, zz - 0.2));
    const rr = gableRoof(1.4, 1.5, 0.7, 0.15, mat('ironGrey', { double: true }), mat(wall, { double: true }), 1);
    rr.rotation.y = Math.PI / 2; rr.position.set(x, y + 1.7, zz - 0.2); g.add(rr);
    g.add(decal('window', 0.8, 1.1, x, y + 0.85, zz + 0.52, { c: '#f4f0e0' }));
  }
}
function chimneys(g, w, d, y, n = 3) {
  for (let i = 0; i < n; i++) g.add(place(boxT(0.9, 2.4, 0.9, mat('brick'), 1.5), -w / 2 + ((i + 0.5) * w) / n, y + 1.2, -d / 4));
}

// ---------- the generic classical street building ----------
// style: how fancy the front is. roof: 'ironRed' | 'ironGreen' | 'ironGrey'.
export function classical({ w = 40, d = 14, floors = 4, floorH = 4.2, wall = 'Yellow', roof = 'ironRed', portico = 0, balcony = false, arcade = false, door = '#4a2a18', tower = false, title = null, shopfront = false, awning = false } = {}) {
  const g = G(), gh = 4.6, H = gh + (floors - 1) * floorH;
  g.add(place(slab(w, gh, d, arcade ? mat('stuccoWhite') : mat('rustic'), roofM(), 4), 0, gh / 2, 0));
  if (arcade) g.add(tiledPlane(w - 0.4, gh, w / 4.5, 1, mat('arcade'), 0, gh / 2, d / 2 + 0.04));
  if (shopfront) {
    g.add(tiledPlane(w - 4, gh - 1.2, (w - 4) / 4, 1, mat('shopfront'), 0, gh / 2 - 0.1, d / 2 + 0.05));
  }
  g.add(place(slab(w, H - gh, d, mat('stucco' + wall), roofM(), 8), 0, gh + (H - gh) / 2, 0));
  g.add(place(boxT(w + 0.5, 0.5, d + 0.5, mat('stuccoWhite'), 2), 0, gh, 0));
  g.add(place(boxT(w + 1.2, 0.9, d + 1.2, mat('stuccoWhite'), 2), 0, H + 0.45, 0));
  // roof
  const rise = 3.4;
  const rf = gableRoof(w + 0.6, d + 0.6, rise, 0.5, mat(roof, { double: true }), mat('stuccoWhite', { double: true }), 3);
  rf.position.y = H + 0.9; g.add(rf);
  dormers(g, { w: w - 4, d, y: H + 1.0, slopeRise: rise, n: Math.max(2, Math.round(w / 9)) });
  chimneys(g, w, d, H + 0.9 + rise * 0.5, Math.max(2, Math.round(w / 14)));
  // entrance
  if (!arcade && !shopfront) {
    g.add(decal('door', 2.6, 3.4, 0, 1.75, d / 2 + 0.05, { c: door }));
    g.add(place(boxT(3.8, 0.4, 1.6, mat('stuccoWhite'), 2), 0, 3.8, d / 2 + 0.8));
    g.add(place(boxT(0.35, 3.6, 0.35, mat('stuccoWhite'), 1), -1.5, 1.8, d / 2 + 1.4));
    g.add(place(boxT(0.35, 3.6, 0.35, mat('stuccoWhite'), 1), 1.5, 1.8, d / 2 + 1.4));
  }
  if (balcony) {
    const y = gh + floorH * 0.35;
    g.add(place(boxT(Math.min(10, w * 0.35), 0.35, 1.6, mat('stuccoWhite'), 2), 0, y, d / 2 + 0.8));
    g.add(place(boxT(Math.min(10, w * 0.35), 0.9, 0.12, mat('ironGrey'), 1), 0, y + 0.65, d / 2 + 1.55));
  }
  if (portico) {
    columns(g, { n: portico, gap: 2.8, h: gh + floorH * 1.4, z: d / 2 + 2.2 });
    const pw = (portico - 1) * 2.8 + 3.4;
    g.add(place(boxT(pw, 1.2, 4.4, mat('stuccoWhite'), 2), 0, gh + floorH * 1.4 + 0.6 + 0.4, d / 2 + 1.0));
    pediment(g, { w: pw, d: 4.4, rise: 2.2, y: gh + floorH * 1.4 + 1.2 + 0.4, z: d / 2 + 1.0 });
    g.add(place(boxT(pw + 1, 0.4, 5.2, mat('stuccoWhite'), 2), 0, 0.2, d / 2 + 1.4));
  }
  if (awning) {
    const aw = new THREE.Mesh(new THREE.BoxGeometry(w - 5, 0.12, 2.2), mat('awningRed')); aw.position.set(0, 3.4, d / 2 + 1.1); aw.rotation.x = 0.25; g.add(aw);
  }
  if (tower) {
    g.add(place(slab(7, 7, 7, mat('stucco' + wall), roofM(), 8), 0, H + 0.9 + rise + 3.5, 0));
    const sp = new THREE.Mesh(new THREE.ConeGeometry(4.2, 11, 8), mat('domeGold', { double: true })); sp.position.set(0, H + 0.9 + rise + 7 + 5.5, 0); g.add(sp);
  }
  if (title) { const s = sign(title, Math.min(w * 0.7, 18), 1.6, { bg: '#1c3a4a' }); s.position.set(0, gh + 0.9, d / 2 + 0.28); g.add(s); }
  return size(g, w + 1.4, d + 1.4, H + rise + (tower ? 18 : 3));
}

// ---------- smaller things ----------
export function woodenHouse({ w = 12, d = 9, floors = 2, siding = 'Yellow', roof = 'ironRed' } = {}) {
  const g = G(), h = floors * 3.2;
  g.add(place(boxT(w + 0.3, 0.7, d + 0.3, mat('granite'), 2), 0, 0.35, 0));
  g.add(place(slab(w, h, d, mat('siding' + siding), mat('roofTar'), 2), 0, 0.7 + h / 2, 0));
  const rf = gableRoof(w + 0.6, d + 0.6, 2.8, 0.5, mat(roof, { double: true }), mat('siding' + siding, { double: true }), 2);
  rf.position.y = 0.7 + h; g.add(rf);
  for (let f = 0; f < floors; f++) for (let i = 0; i < 3; i++) g.add(decal('window', 1.0, 1.55, -w * 0.3 + i * w * 0.3, 0.7 + 1.7 + f * 3.2, d / 2 + 0.04, { c: '#fbfaf4', lit: (i + f) % 3 === 0 }));
  g.add(decal('door', 1.4, 2.3, w * 0.3 + 0.1, 0.7 + 1.2, d / 2 + 0.05, { c: '#6a4220' }));
  g.add(place(boxT(2.6, 0.12, 1.6, mat('planks'), 1), w * 0.3 + 0.1, 3.1, d / 2 + 0.9));
  for (const x of [-1.1, 1.1]) g.add(place(boxT(0.14, 2.4, 0.14, mat('planks'), 1), w * 0.3 + 0.1 + x, 1.9, d / 2 + 1.55));
  g.add(place(boxT(0.9, 3, 0.9, mat('brick'), 1.5), w * 0.28, 0.7 + h + 2.4, -d * 0.2));
  return size(g, w + 0.4, d + 0.4, h + 3.5);
}
export function lavka({ w = 9, d = 6 } = {}) {
  const g = G(), h = 4.2;
  g.add(place(slab(w, h, d, mat('stuccoCream'), roofM(), 8), 0, h / 2, 0));
  const rf = gableRoof(w + 0.6, d + 0.6, 1.6, 0.4, mat('ironGreen', { double: true }), mat('stuccoWhite', { double: true }), 3); rf.position.y = h; g.add(rf);
  g.add(tiledPlane(w - 1.4, 2.6, (w - 1.4) / 3, 1, mat('shopfront'), 0, 1.6, d / 2 + 0.05));
  const aw = new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 0.1, 2.0), mat('awningBlue')); aw.position.set(0, 3.2, d / 2 + 0.9); aw.rotation.x = 0.28; g.add(aw);
  const s = sign('ЛАВКА', 3.6, 0.8, { bg: '#7a1c14' }); s.position.set(0, 3.7, d / 2 + 0.06); g.add(s);
  return size(g, w + 1.6, d + 2, h + 2);
}
export function cafe({ w = 14, d = 12 } = {}) {
  const g = classical({ w, d, floors: 3, wall: 'Pink', roof: 'ironGreen', shopfront: true, awning: true, title: 'КОНДИТЕРСКАЯ' });
  return g;
}

// ---------- grand buildings ----------
export function winterPalace() {
  const g = G(), w = 92, d = 26, h = 21;
  g.add(place(boxT(w + 1, 1.2, d + 1, mat('granite'), 3), 0, 0.6, 0));
  g.add(place(slab(w, h, d, mat('stuccoMint'), roofM(), 8), 0, 1.2 + h / 2, 0));
  // tall white pilasters across the front
  for (let x = -w / 2 + 3; x <= w / 2 - 2; x += 4.6) g.add(place(boxT(1.1, h - 4, 0.9, mat('stuccoWhite'), 2), x, 1.2 + (h - 4) / 2 + 2, d / 2 + 0.45));
  g.add(place(boxT(w + 1.4, 1.4, d + 1.4, mat('stuccoWhite'), 2), 0, 1.2 + h + 0.7, 0));
  g.add(place(boxT(w, 1.2, 0.6, mat('stuccoWhite'), 2), 0, 1.2 + h + 2.0, d / 2 - 0.3));      // balustrade
  for (let x = -w / 2 + 3; x <= w / 2 - 2; x += 5) { g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 2.6, 8), color(0xeeeadc)), x, 1.2 + h + 3.9, d / 2 - 0.3)); g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), color(0xeeeadc)), x, 1.2 + h + 5.4, d / 2 - 0.3)); }
  // windows (decals, so they can be shot out) – two rows
  for (let row = 0; row < 2; row++) for (let x = -w / 2 + 4.4; x <= w / 2 - 3; x += 4.6) g.add(decal('window', 1.5, 2.6, x, 5 + row * 7.5, d / 2 + 0.07, { c: '#fbfaf4', lit: (x + row) % 3 < 1 }));
  // central gate arches
  for (const x of [-4.2, 0, 4.2]) g.add(decal('arch', 3.4, 5.6, x, 2.8 + 1.2, d / 2 + 0.06));
  columns(g, { n: 6, gap: 3.2, h: 15, r: 0.7, z: d / 2 + 2.0, y: 1.2 });
  g.add(place(boxT(18.5, 1.4, 4.4, mat('stuccoWhite'), 2), 0, 1.2 + 15.7, d / 2 + 1.2));
  pediment(g, { w: 18.5, d: 4.4, rise: 3.2, y: 1.2 + 16.4, z: d / 2 + 1.2 });
  g.add(place(boxT(20, 0.5, 6.6, mat('stuccoWhite'), 2), 0, 1.45, d / 2 + 2.2));
  // end pavilions with domes
  for (const sd of [-1, 1]) {
    g.add(place(slab(14, h + 2, d + 2, mat('stuccoMint'), roofM(), 8), sd * (w / 2 - 5), 1.2 + (h + 2) / 2, 0));
    columns(g, { n: 4, gap: 2.8, h: 13, r: 0.55, z: d / 2 + 1.8, y: 1.2, x0: sd * (w / 2 - 5) - 4.2 });
    const dm = new THREE.Mesh(new THREE.SphereGeometry(5.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('domeGreen2', { double: true }));
    dm.scale.y = 0.55; dm.position.set(sd * (w / 2 - 5), 1.2 + h + 2.6, 0); g.add(dm);
  }
  return size(g, w + 2, d + 8, h + 8);
}
export function admiralty() {
  const g = G(), w = 86, d = 15, h = 15;
  g.add(place(slab(w, h, d, mat('plainYellow'), roofM(), 8), 0, h / 2, 0));
  g.add(place(boxT(w + 1, 0.9, d + 1, mat('stuccoWhite'), 2), 0, h + 0.45, 0));
  for (let x = -w / 2 + 3; x <= w / 2 - 2; x += 4.4) g.add(decal('window', 1.4, 2.4, x, 6.5, d / 2 + 0.07, { c: '#fbfaf4', lit: (x | 0) % 3 === 0 }));
  for (let x = -w / 2 + 3; x <= w / 2 - 2; x += 4.4) g.add(decal('window', 1.4, 2.2, x, 11.6, d / 2 + 0.07, { c: '#fbfaf4' }));
  const rf = gableRoof(w + 0.6, d + 0.6, 2.4, 0.4, mat('ironGreen', { double: true }), mat('stuccoWhite', { double: true }), 3); rf.position.y = h + 0.9; g.add(rf);
  for (const sd of [-1, 1]) { g.add(place(slab(16, h + 3, d + 3, mat('plainYellow'), roofM(), 8), sd * (w / 2 - 8), (h + 3) / 2, 1)); columns(g, { n: 4, gap: 3, h: 12, z: d / 2 + 2.2, x0: sd * (w / 2 - 8) - 4.5, r: 0.5 }); }
  // central gate tower
  g.add(place(slab(14, 12, 14, mat('plainYellow'), roofM(), 8), 0, h + 6, 1));
  g.add(decal('arch', 7, 10, 0, 5, d / 2 + 1.1));
  g.add(place(slab(10, 9, 10, mat('stuccoWhite'), roofM(), 8), 0, h + 12 + 4.5, 1));
  columns(g, { n: 4, gap: 2.4, h: 7, z: 6.2, y: h + 12, r: 0.4 });
  const sp = new THREE.Mesh(new THREE.ConeGeometry(2.0, 30, 8), mat('domeGold', { double: true })); sp.position.set(0, h + 21 + 15, 1); g.add(sp);
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), mat('domeGold')), 0, h + 21 + 31, 1));
  return size(g, w + 1, d + 4, h + 50);
}
export function generalStaff({ wing = 34, gap = 14, d = 16 } = {}) {
  const g = G(), h = 18, total = wing * 2 + gap;
  for (const sd of [-1, 1]) {
    const x = sd * (gap / 2 + wing / 2);
    g.add(place(slab(wing, h, d, mat('plainYellow'), roofM(), 8), x, h / 2, 0));
    g.add(place(boxT(wing + 0.8, 0.8, d + 0.8, mat('stuccoWhite'), 2), x, h + 0.4, 0));
    for (let i = 0; i < Math.floor(wing / 4.2); i++) for (const y of [5.5, 11]) g.add(decal('window', 1.4, 2.4, x - wing / 2 + 3 + i * 4.2, y, d / 2 + 0.07, { c: '#fbfaf4', lit: (i + y) % 4 === 0 }));
    const rf = gableRoof(wing + 0.6, d + 0.6, 2, 0.4, mat('ironGreen', { double: true }), mat('stuccoWhite', { double: true }), 3); rf.position.set(x, h + 0.8, 0); g.add(rf);
  }
  // triumphal arch over the gap
  g.add(place(boxT(gap + 8, 7, d - 2, mat('stuccoWhite'), 3), 0, 14.5 + 3.5 - 3.5 + 3, 0));
  columns(g, { n: 2, gap: gap + 3, h: 11, r: 0.9, z: d / 2 + 0.6, y: 0 });
  for (const sd of [-1, 1]) g.add(place(boxT(2.4, 14, d - 2, mat('stuccoWhite'), 2), sd * (gap / 2 + 0.9), 7, 0));   // sticks 0.3 m into the gap (not coplanar with the wing ends)
  // chariot with horses on top
  const gold = color(0xd9a62a, { emissive: 0x3a2a00 });
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 3), gold), 0, 21.5 + 2.5, 0));
  for (let i = 0; i < 6; i++) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 1.2), gold), -2.5 + i, 21.5 + 2.2, 2.3));
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.9, 3, 6), gold), 0, 21.5 + 5, 0));
  g.userData.gap = gap;
  return size(g, total, d, h + 6);
}
export function neoMansion({ w = 30, d = 16, wall = 'Cream' } = {}) {
  return classical({ w, d, floors: 3, floorH: 4.6, wall, roof: 'ironGreen', portico: 6, balcony: false });
}
export function hotelEurope() {
  return classical({ w: 52, d: 18, floors: 6, wall: 'Ochre', roof: 'ironRed', balcony: true, title: 'ГРАНД ОТЕЛЬ ЕВРОПА', tower: false });
}
export function tenement({ w = 36, d = 14, wall = 'Terra' } = {}) { return classical({ w, d, floors: 5, floorH: 3.6, wall, roof: 'ironGrey' }); }
export function townhouse({ w = 24, d = 14, wall = 'Blue' } = {}) { return classical({ w, d, floors: 4, wall, roof: 'ironRed', balcony: true }); }
export function theatre() {
  const g = classical({ w: 52, d: 20, floors: 3, floorH: 5, wall: 'Cream', roof: 'ironGrey', portico: 6, title: 'АЛЕКСАНДРИНСКИЙ ТЕАТР' });
  return g;
}
export function kunstkamera() {
  const g = G(), w = 44, d = 15, h = 17;
  g.add(place(slab(w, h, d, mat('plainBlue'), roofM(), 8), 0, h / 2, 0));
  g.add(place(boxT(w + 1, 0.9, d + 1, mat('stuccoWhite'), 2), 0, h + 0.45, 0));
  for (let x = -w / 2 + 3; x <= w / 2 - 2; x += 4.4) for (const y of [5.8, 12]) g.add(decal('window', 1.4, 2.5, x, y, d / 2 + 0.07, { c: '#fbfaf4', lit: ((x | 0) + y) % 5 === 0 }));
  const rf = gableRoof(w + 0.6, d + 0.6, 3, 0.4, mat('ironGreen', { double: true }), mat('stuccoWhite', { double: true }), 3); rf.position.y = h + 0.9; g.add(rf);
  g.add(place(slab(11, 12, 11, mat('plainBlue'), roofM(), 8), 0, h + 6, 0.5));
  g.add(place(slab(8, 7, 8, mat('stuccoWhite'), roofM(), 8), 0, h + 12 + 3.5, 0.5));
  g.add(place(slab(5, 5, 5, mat('plainBlue'), roofM(), 8), 0, h + 19 + 2.5, 0.5));
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 6, 20), color(0xd9a62a)); t.position.set(0, h + 26, 0.5); t.rotation.set(i * 1.05, i * 0.6, 0); g.add(t); }
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.4, 4, 6), color(0xd9a62a)), 0, h + 29, 0.5));
  g.add(decal('door', 2.6, 3.4, 0, 1.8, d / 2 + 0.06, { c: '#4a2a18' }));
  return size(g, w + 1, d + 2, h + 30);
}
