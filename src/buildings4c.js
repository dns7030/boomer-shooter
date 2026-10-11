// Level 4 (Soviet metropolis): monuments, big public buildings and small street props.
// Palace of Concerts & Sports (Vilnius), House of Soviets (Kaliningrad), Sochi sanatorium,
// Worker and Kolkhoz Woman, Monument to the Conquerors of Space + small props.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, decal } from './geo.js';
import { slab, sign } from './buildings2.js';
import { addPainters, mulberry } from './textures.js';

const G = () => new THREE.Group();
const size = (g, w, d, h, cols = null) => { g.userData = { ...g.userData, w, d, h }; if (cols) g.userData.cols = cols; return g; };
const roofM = () => mat('roofTar');
const B = (g, w, h, d, m, x, y, z, tile = 2) => { const o = place(boxT(w, h, d, m, tile), x, y, z); g.add(o); return o; };
const C = (g, rT, rB, h, n, m, x, y, z, tile = 2) => { const o = place(cylT(rT, rB, h, n, m, tile), x, y, z); g.add(o); return o; };
const S = (g, geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; };
const lim = (g, a, b, r, m, seg = 7) => {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), seg), m);
  o.position.copy(A).addScaledVector(d, 0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  g.add(o); return o;
};
const uvScale = (geo, s) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * s, uv.getY(i) * s); return geo; };
const dbl = (hex, o = {}) => { const k = 'd' + hex + JSON.stringify(o); return (dbl[k] = dbl[k] || new THREE.MeshLambertMaterial({ color: hex, side: THREE.DoubleSide, ...o })); };
const gold = () => color(0xd9a62a, { emissive: 0x3a2a00 });
const red = () => color(0xc02a22, { emissive: 0x300800 });
const dark = () => color(0x2a2c30);

// window decal helper; ry 0 = +Z face, PI = -Z, PI/2 = +X, -PI/2 = -X
const wd = (g, x, y, z, ry = 0, o = {}) => {
  const m = decal('window', o.w || 1.4, o.h || 2.4, x, y, z, { c: o.c || '#fbfaf4', lit: !!o.lit, fixed: !!o.fixed });
  m.rotation.y = ry; g.add(m); return m;
};
const dr = (g, x, y, z, ry = 0, o = {}) => {
  const m = decal('door', o.w || 2, o.h || 2.8, x, y, z, { c: o.c || '#4a2a18' }); m.rotation.y = ry; g.add(m); return m;
};
// row/grid of windows along a face. ts = positions along the face, off = distance of the face from the origin
const grid = (g, ts, ys, off, ry, o = {}) => {
  const along = Math.abs(Math.sin(ry)) > 0.5;
  ts.forEach((t, i) => ys.forEach((y, j) => {
    const lit = o.litEvery ? (i * 3 + j * 5) % o.litEvery === 0 : false;
    wd(g, along ? off : t, y, along ? t : off, ry, { ...o, lit });
  }));
};
const range = (a, b, s) => { const r = []; for (let v = a; v <= b + 1e-6; v += s) r.push(v); return r; };
const planeAt = (m, w, h, x, y, z, ry = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; return p; };

// ---------------------------------------------------------------- textures
addPainters({
  s4c_glass(g, w, h) {   // 4 m tile: 4x4 blue panes with mullions
    const r = mulberry(41);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const b = 150 + ((r() * 30) | 0);
      g.fillStyle = `rgb(${b - 70},${b - 20},${b + 40})`; g.fillRect(i * 16, j * 16, 16, 16);
      g.fillStyle = 'rgba(255,255,255,0.22)'; for (let k = 0; k < 6; k++) g.fillRect(i * 16 + 2 + k * 2, j * 16 + 12 - k * 2, 2, 2);
    }
    g.fillStyle = '#2b3036'; for (let k = 0; k < 4; k++) { g.fillRect(k * 16, 0, 1, 64); g.fillRect(0, k * 16, 64, 1); }
    g.fillStyle = '#4b535b'; for (let k = 0; k < 4; k++) g.fillRect(k * 16 + 1, 0, 1, 64);
  },
  s4c_ribs(g, w, h) {    // weathered ribbed concrete roof
    const r = mulberry(42);
    g.fillStyle = '#b9b8ae'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 400; i++) { g.fillStyle = r() > 0.5 ? '#a9a89f' : '#c8c7bd'; g.fillRect((r() * 64) | 0, (r() * 64) | 0, 1, 1); }
    g.fillStyle = '#8f8e86'; for (let k = 0; k < 64; k += 16) g.fillRect(0, k, 64, 1);
    g.fillStyle = '#d6d5cb'; for (let k = 1; k < 64; k += 16) g.fillRect(0, k, 64, 1);
    g.fillStyle = '#7a8a62'; for (let i = 0; i < 18; i++) g.fillRect((r() * 64) | 0, (r() * 64) | 0, 2, 1);   // moss
  },
  s4c_hos(g, w, h) {     // grey brutalist facade, 3.3 m = one storey: four narrow windows
    const r = mulberry(43);
    g.fillStyle = '#8c8d89'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 300; i++) { g.fillStyle = r() > 0.5 ? '#7c7d79' : '#9b9c97'; g.fillRect((r() * 64) | 0, (r() * 64) | 0, 1, 2); }
    for (let i = 0; i < 4; i++) {
      const x = 4 + i * 16;
      g.fillStyle = '#6e6f6b'; g.fillRect(x - 1, 9, 10, 48);
      g.fillStyle = r() > 0.8 ? '#cbd9d8' : '#1d2a37'; g.fillRect(x, 10, 8, 46);
      g.fillStyle = 'rgba(180,210,230,0.35)'; g.fillRect(x, 10, 3, 22);
      g.fillStyle = '#5d5e5a'; g.fillRect(x - 1, 57, 10, 2);
    }
    g.fillStyle = '#6a6b67'; g.fillRect(0, 0, 64, 2); g.fillRect(0, 62, 64, 2);
  },
  s4c_steel(g, w, h) {   // stainless steel, vertical brushing
    const r = mulberry(44);
    for (let x = 0; x < 32; x++) { const b = 205 + ((r() * 40) | 0); g.fillStyle = `rgb(${b - 6},${b},${b + 8})`; g.fillRect(x, 0, 1, 64); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect((r() * 32) | 0, (r() * 64) | 0, 1, 3); }
    g.fillStyle = 'rgba(80,100,120,0.35)'; for (let k = 0; k < 64; k += 21) g.fillRect(0, k, 32, 1);
  },
  s4c_ti(g, w, h) {      // titanium panels
    const r = mulberry(45);
    g.fillStyle = '#cdd4da'; g.fillRect(0, 0, 32, 64);
    for (let x = 0; x < 32; x++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '60,70,90'},0.12)`; g.fillRect(x, 0, 1, 64); }
    g.fillStyle = '#8a929a'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 32, 32, 1);
    g.fillStyle = '#dfe5ea'; g.fillRect(0, 1, 32, 1); g.fillRect(0, 33, 32, 1);
    g.fillStyle = '#8a929a'; g.fillRect(0, 0, 1, 64); g.fillRect(31, 0, 1, 64);
    g.fillStyle = '#f2f6f9'; for (let i = 0; i < 10; i++) g.fillRect(4 + ((r() * 24) | 0), (r() * 62) | 0, 1, 4);
  },
  s4c_relief(g, w, h) {  // bronze plaque with gold figures: rockets, stars, marching people
    g.fillStyle = '#3d3a30'; g.fillRect(0, 0, 64, 32);
    g.fillStyle = '#6b5a2c'; g.fillRect(0, 0, 64, 2); g.fillRect(0, 30, 64, 2); g.fillRect(0, 0, 2, 32); g.fillRect(62, 0, 2, 32);
    g.fillStyle = '#d4a93c';
    for (let i = 0; i < 6; i++) { const x = 6 + i * 9; g.fillRect(x, 14, 4, 12); g.fillRect(x + 1, 9, 2, 3); g.fillRect(x - 1, 16, 1, 6); g.fillRect(x + 4, 13, 2, 5); }
    g.fillStyle = '#e8c860';
    g.beginPath(); g.moveTo(52, 4); g.lineTo(56, 14); g.lineTo(48, 14); g.fill(); g.fillRect(50, 14, 4, 8); g.fillRect(47, 20, 3, 4); g.fillRect(54, 20, 3, 4);
    for (const [x, y] of [[8, 5], [20, 7], [34, 4], [42, 8]]) { g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y - 1, 1, 3); }
  },
  s4c_pavilion(g, w, h) { // light sandstone ashlar
    const r = mulberry(46);
    g.fillStyle = '#d9d0b8'; g.fillRect(0, 0, 64, 64);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) {
      const ox = (j % 2) * 16; g.fillStyle = r() > 0.5 ? '#d2c8ad' : '#e0d8c2'; g.fillRect(i * 32 + ox - 16, j * 16, 31, 15);
    }
    g.fillStyle = '#b3a98f'; for (let k = 0; k < 64; k += 16) g.fillRect(0, k, 64, 1);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) g.fillRect(((j % 2) * 16 + i * 32) % 64, j * 16, 1, 16);
  },
  s4c_mosaic(g, w, h) {   // 128x64 smalt mosaic: sun rays, rocket, cosmonaut, workers, stars
    const r = mulberry(47);
    for (let y = 0; y < 64; y += 2) { const t = y / 64; g.fillStyle = `rgb(${30 + t * 100 | 0},${80 + t * 110 | 0},${150 + t * 80 | 0})`; g.fillRect(0, y, 128, 2); }
    for (let k = 0; k < 14; k++) {   // sun rays
      const a0 = Math.PI + (k / 14) * Math.PI, a1 = Math.PI + ((k + 1) / 14) * Math.PI;
      g.fillStyle = k % 2 ? '#f2b92e' : '#e8782a';
      g.beginPath(); g.moveTo(64, 66); g.lineTo(64 + Math.cos(a0) * 120, 66 + Math.sin(a0) * 120); g.lineTo(64 + Math.cos(a1) * 120, 66 + Math.sin(a1) * 120); g.fill();
    }
    g.fillStyle = '#f7d44a'; g.beginPath(); g.arc(64, 66, 17, Math.PI, 0); g.fill();
    g.fillStyle = '#f0f0ea'; g.beginPath(); g.arc(64, 66, 11, Math.PI, 0); g.fill();
    // rocket (left)
    g.fillStyle = '#f2f2ee'; g.fillRect(24, 14, 8, 30);
    g.fillStyle = '#d8301f'; g.beginPath(); g.moveTo(24, 14); g.lineTo(28, 2); g.lineTo(32, 14); g.fill();
    g.fillRect(20, 34, 4, 10); g.fillRect(32, 34, 4, 10); g.fillStyle = '#1f3a66'; g.fillRect(26, 20, 4, 4);
    g.fillStyle = '#f9e060'; g.beginPath(); g.moveTo(24, 44); g.lineTo(28, 60); g.lineTo(32, 44); g.fill(); g.fillStyle = '#ee7b22'; g.beginPath(); g.moveTo(26, 44); g.lineTo(28, 54); g.lineTo(30, 44); g.fill();
    // cosmonaut (right)
    g.fillStyle = '#f4f4f0'; g.beginPath(); g.arc(98, 14, 6, 0, 7); g.fill(); g.fillRect(92, 20, 12, 16); g.fillRect(86, 22, 6, 4); g.fillRect(104, 20, 8, 4); g.fillRect(92, 36, 5, 12); g.fillRect(99, 36, 5, 12);
    g.fillStyle = '#e8b030'; g.fillRect(94, 11, 8, 5); g.fillStyle = '#c42a22'; g.fillRect(95, 26, 3, 3);
    // workers (bottom, silhouettes in red)
    g.fillStyle = '#b8231c';
    g.fillRect(8, 36, 6, 18); g.beginPath(); g.arc(11, 33, 3.5, 0, 7); g.fill(); g.fillRect(14, 38, 12, 3); g.fillRect(24, 30, 3, 10); g.fillRect(21, 29, 9, 3);   // worker + hammer
    g.fillRect(112, 38, 6, 16); g.beginPath(); g.arc(115, 35, 3.5, 0, 7); g.fill(); g.fillRect(106, 40, 6, 3);
    g.strokeStyle = '#b8231c'; g.lineWidth = 2; g.beginPath(); g.arc(105, 34, 6, 0.4, 4.5); g.stroke();   // sickle
    g.fillStyle = '#e8c040'; for (let i = 0; i < 5; i++) g.fillRect(40 + i * 3, 46 - i % 2 * 3, 2, 12);   // wheat
    g.fillStyle = '#fff2a0'; for (const [x, y] of [[8, 6], [40, 10], [58, 6], [76, 12], [120, 8], [114, 22], [44, 24]]) { g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y - 1, 1, 3); }
    // tile grout + noise
    for (let i = 0; i < 700; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'; g.fillRect(((r() * 32) | 0) * 4, ((r() * 16) | 0) * 4, 4, 4); }
    g.fillStyle = 'rgba(30,30,30,0.45)'; for (let x = 0; x < 128; x += 4) g.fillRect(x, 0, 1, 64); for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 128, 1);
  },
  s4c_mosaicStripe(g, w, h) {   // geometric border mosaic
    const cols = ['#b8231c', '#f0eee4', '#1f4f94', '#e8b030'];
    for (let y = 0; y < 64; y += 4) for (let x = 0; x < 32; x += 4) {
      const k = ((x >> 2) + (y >> 2) + (((x >> 2) & 1) ? 1 : 0)) % 4; g.fillStyle = cols[((y >> 2) % 8 < 4 ? k : 3 - k + 4) % 4]; g.fillRect(x, y, 4, 4);
    }
    g.fillStyle = 'rgba(30,30,30,0.45)'; for (let x = 0; x < 32; x += 4) g.fillRect(x, 0, 1, 64); for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 32, 1);
  },
  s4c_flower(g, w, h) {   // round flower bed seen from above: soil, red/yellow flowers, concentric rings
    const r = mulberry(48);
    g.fillStyle = '#4a3a24'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 260; i++) {
      const rr = ((i % 5) + 1) * 5 + r() * 3, a = r() * 7, x = 32 + Math.cos(a) * rr, y = 32 + Math.sin(a) * rr;
      g.fillStyle = (i % 5) % 2 ? '#e33a2c' : (i % 5 === 2 ? '#f2d03a' : '#d42424'); g.fillRect(x | 0, y | 0, 2, 2);
      g.fillStyle = '#3f7a2e'; g.fillRect((x + 1) | 0, (y + 2) | 0, 1, 1);
    }
  },
  s4c_sand(g) {
    const r = mulberry(49); g.fillStyle = '#d9c68a'; g.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 120; i++) { g.fillStyle = r() > 0.5 ? '#c9b576' : '#e6d8a0'; g.fillRect((r() * 32) | 0, (r() * 32) | 0, 1, 1); }
  },
  s4c_poster(g) {         // phone-booth / machine enamel plate
    g.fillStyle = '#e8e2d0'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#b8231c'; g.fillRect(0, 0, 64, 12); g.fillRect(0, 52, 64, 12);
    g.fillStyle = '#1f4f94'; g.fillRect(8, 20, 48, 24);
  },
}, { s4c_glass: [64, 64], s4c_ribs: [64, 64], s4c_hos: [64, 64], s4c_steel: [32, 64], s4c_ti: [32, 64], s4c_relief: [64, 32], s4c_pavilion: [64, 64], s4c_mosaic: [128, 64], s4c_mosaicStripe: [32, 64], s4c_flower: [64, 64], s4c_sand: [32, 32], s4c_poster: [64, 64] });

// ======================================================================= 1. Palace of Concerts and Sports
const palaceF = (x) => 15 + 7.5 * Math.pow(Math.abs(Math.sin(Math.PI * (x + 33) / (66 / 7))), 0.75);
export function palaceOfConcertsAndSports() {
  const g = G(), conc = mat('concrete'), concD = mat('concreteDark');
  // podium + steps
  B(g, 70, 2.4, 35, conc, 0, 1.2, -2.5, 4);
  for (let i = 0; i < 6; i++) B(g, 44, 2.4 * (6 - i) / 7, 1.67, conc, 0, 2.4 * (6 - i) / 14, 15 + 0.835 + i * 1.67, 3);
  // wavy roof
  const N = 56, xs = range(0, N, 1).map((i) => -33.8 + (67.6 * i) / N);
  const rs = new THREE.Shape(); rs.moveTo(xs[0], palaceF(xs[0]) + 1.1);
  xs.forEach((x) => rs.lineTo(x, palaceF(x) + 1.1)); for (let i = xs.length - 1; i >= 0; i--) rs.lineTo(xs[i], palaceF(xs[i]));
  const roofGeo = uvScale(new THREE.ExtrudeGeometry(rs, { depth: 36, bevelEnabled: false }), 0.25);
  S(g, roofGeo, mat('s4c_ribs', { double: true }), 0, 0, -22);
  // front glass tympanum and rear concrete wall following the wave
  const fill = (z, m, th) => {
    const s = new THREE.Shape(); s.moveTo(-33, 2.4); const xs2 = range(0, 56, 1).map((i) => -33 + (66 * i) / 56);
    xs2.forEach((x) => s.lineTo(x, palaceF(x))); s.lineTo(33, 2.4); s.lineTo(-33, 2.4);
    S(g, uvScale(new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false }), 0.25), m, 0, 0, z);
  };
  fill(10.8, mat('s4c_glass'), 0.4); fill(-20.4, conc, 0.8);
  // side walls
  for (const sd of [-1, 1]) {
    B(g, 0.8, 13.2, 31.4, conc, sd * 32.9, 9, -4.7, 4);
    grid(g, range(-18, 8, 4.4), [6.5, 11], sd * 33.35, sd * Math.PI / 2, { w: 1.6, h: 2.6, fixed: true, litEvery: 4 });
    dr(g, sd * 33.32, 4.4, -16, sd * Math.PI / 2, { w: 2, h: 3.2, c: '#6a5a3a' });
  }
  // piers carrying the roof (front and rear)
  for (let k = 0; k < 8; k++) {
    const x = -33 + k * (66 / 7);
    B(g, 1.7, 12.6, 1.5, conc, x, 2.4 + 6.3, 13, 4); B(g, 1.7, 12.6, 1.5, conc, x, 2.4 + 6.3, -21, 4);
    B(g, 2.3, 0.6, 2.1, concD, x, 2.7, 13, 3);
  }
  // glass entrance details
  { const s = sign('ДВОРЕЦ КОНЦЕРТОВ И СПОРТА', 24, 1.7, { bg: '#20262c', fg: '#f4efe0' }); s.position.set(0, 12.6, 11.45); g.add(s); }
  for (const x of [-9, -3, 3, 9]) dr(g, x, 4.2, 11.46, 0, { w: 2.6, h: 3.6, c: '#3a3f46' });
  grid(g, range(-27, 27, 6), [8.6], 11.47, 0, { w: 2.4, h: 4, c: '#c8ccd0', litEvery: 3 });
  for (const sd of [-1, 1]) { C(g, 0.1, 0.12, 14, 6, color(0xd8d8d8), sd * 31, 9.5, 19); S(g, new THREE.PlaneGeometry(4, 2.4), dbl(0xc02a22), sd * 31 + 2, 14.5, 19); }
  // rear annex (back of house) with service doors
  B(g, 40, 6, 5, mat('stuccoGrey'), 0, 3, -22.5, 4);
  B(g, 40.6, 0.5, 5.6, roofM(), 0, 6.25, -22.5, 3);
  grid(g, range(-17, 17, 5.6), [3.4], -25.06, Math.PI, { w: 1.5, h: 2, fixed: true });
  for (const x of [-12, 12]) dr(g, x, 1.5, -25.06, Math.PI, { w: 2.6, h: 3, c: '#5a6a5a' });
  dr(g, 0, 1.4, -25.06, Math.PI, { w: 5, h: 2.8, c: '#6a6a6a' });
  for (const x of [-6, 7]) { B(g, 2, 1.4, 2, dark(), x, 7.2, -23, 2); C(g, 0.4, 0.4, 3, 8, color(0x8a8a8a), x + 3, 7.8, -22, 2); }
  C(g, 0.5, 0.5, 9, 8, color(0xa0a0a0), 15, 10.5, -23, 2);
  grid(g, range(-26, 26, 6.5), [5.5, 9.5], -20.82, Math.PI, { w: 1.8, h: 2.4, fixed: true, litEvery: 5 });
  B(g, 0.3, 11, 0.3, dark(), -24, 7.9, -20.3, 1); B(g, 0.3, 11, 0.3, dark(), 24, 7.9, -20.3, 1);   // downpipes
  // mid-side buttress ribs under the roof edge
  for (const sd of [-1, 1]) for (const z of [-14, -6, 2]) B(g, 1.2, 12.6, 1.4, conc, sd * 34.2, 8.7, z, 4);
  return size(g, 70, 50, 24);
}

// ======================================================================= 2. House of Soviets, Kaliningrad
export function houseOfSoviets() {
  const g = G(), hos = mat('s4c_hos'), conc = mat('concrete'), concD = mat('concreteDark');
  const H = 66, TW = 18, TD = 34;
  const tower = (cx) => {
    const t = slab(TW, H, TD, hos, roofM(), 3.3); t.position.set(cx, H / 2, 0); g.add(t);
    B(g, TW + 0.6, 8, TD + 0.6, conc, cx, 4, 0, 4);                                   // plinth
    for (const y of [8.2, 29, 49.5]) B(g, TW + 0.9, 0.6, TD + 0.9, concD, cx, y, 0, 4);        // cornices
    B(g, TW + 1.2, 1.2, TD + 1.2, concD, cx, H + 0.6, 0, 4);                            // crown
    for (let i = 0; i < 7; i++) {   // vertical fins on the long faces
      const fx = cx - TW / 2 + 1.5 + i * 2.5;
      B(g, 0.7, H - 8.8, 0.5, concD, fx, 8.8 + (H - 8.8) / 2, TD / 2 + 0.25, 3); B(g, 0.7, H - 8.8, 0.5, concD, fx, 8.8 + (H - 8.8) / 2, -TD / 2 - 0.25, 3);
    }
    // blank lift-shaft strips on the outer ends
    const so = cx < 0 ? -1 : 1;
    B(g, 0.6, H - 8.5, 5, concD, cx + so * (TW / 2 + 0.3), 8.5 + (H - 8.5) / 2, 0, 3);
    // ground windows
    grid(g, [cx - 6, cx - 2, cx + 2, cx + 6], [3, 6], TD / 2 + 0.38, 0, { w: 1.5, h: 2, litEvery: 4 });
    grid(g, [cx - 6, cx - 2, cx + 2, cx + 6], [3, 6], -TD / 2 - 0.38, Math.PI, { w: 1.5, h: 2, fixed: true, litEvery: 4 });
    grid(g, range(-13, 13, 4.4), [3, 6], cx + so * (TW / 2 + 0.38), so * Math.PI / 2, { w: 1.5, h: 2, fixed: true, litEvery: 6 });
  };
  tower(-23); tower(23);
  // the connecting block (bridge) and the stepped front mass
  const link = slab(28, 54, 16, hos, roofM(), 3.3); link.position.set(0, 27, -5); g.add(link);
  B(g, 28.6, 0.6, 16.6, concD, 0, 54.3, -5, 4);
  B(g, 28.6, 0.6, 16.6, concD, 0, 20, -5, 4);
  { const a = slab(30, 12, 14, conc, roofM(), 4); a.position.set(0, 6, 10); g.add(a); }
  { const a = slab(24, 9, 10, conc, roofM(), 4); a.position.set(0, 16.5, 8); g.add(a); }
  B(g, 31, 0.7, 15, concD, 0, 12.3, 10, 4); B(g, 25, 0.6, 11, concD, 0, 21.3, 8, 4);
  // stairs and entrance canopy
  for (let i = 0; i < 4; i++) B(g, 14, 0.3 * (4 - i), 0.8, conc, 0, 0.15 * (4 - i), 17.4 + i * 0.8, 2);
  B(g, 16, 0.5, 4, concD, 0, 5.6, 18.6, 3); B(g, 0.8, 5.5, 0.8, conc, -7, 2.8, 20.2, 2); B(g, 0.8, 5.5, 0.8, conc, 7, 2.8, 20.2, 2);
  for (const x of [-4.5, 0, 4.5]) dr(g, x, 2.1, 17.06, 0, { w: 3.2, h: 4.2, c: '#3a3f46' });
  { const s = sign('ДОМ СОВЕТОВ', 18, 1.8, { bg: '#2a2e33', fg: '#f0e8d0' }); s.position.set(0, 13.3, 17.1); g.add(s); }
  grid(g, [-12, -8, 8, 12], [3, 8.5], 17.07, 0, { w: 1.8, h: 2.8, litEvery: 3 });
  grid(g, range(-10, 10, 4), [13.5, 17.5], 13.07, 0, { w: 1.6, h: 2.6, litEvery: 3 });
  grid(g, range(-10, 10, 4), [17.5], 13.07, 0, { w: 1.6, h: 2.6 });
  // side walls of the front mass
  for (const sd of [-1, 1]) grid(g, [6, 11, 15], [3, 8.5], sd * 15.06, sd * Math.PI / 2, { w: 1.6, h: 2.6, fixed: true });
  // rear annex: loading bays, doors, service stuff
  B(g, 28, 9, 5.5, conc, 0, 4.5, -14.75, 4); B(g, 28.8, 0.6, 6.3, roofM(), 0, 9.3, -14.75, 3);
  for (const x of [-9, 0, 9]) dr(g, x, 2.2, -17.56, Math.PI, { w: 4, h: 4.2, c: '#5a5a58' });
  grid(g, [-12.5, -4.5, 4.5, 12.5], [6.5], -17.56, Math.PI, { w: 1.6, h: 1.8, fixed: true });
  grid(g, range(-10, 10, 5), [4, 8], -13.06, Math.PI, { w: 1.5, h: 2.2, fixed: true, litEvery: 5 });
  B(g, 0.5, 20, 0.5, color(0x6a5a4a), -13.5, 10, -18.1, 1); B(g, 0.4, 20, 0.4, color(0x6a5a4a), -12.6, 10, -18.1, 1);
  B(g, 3, 1.4, 3, dark(), 8, 10, -15, 2); C(g, 0.6, 0.6, 2.4, 8, color(0xa0a0a0), 4, 10.5, -15, 2);
  // fire-escape ladders on the towers' rear faces
  for (const cx of [-23, 23]) { B(g, 0.12, 54, 0.12, dark(), cx - 3.2, 35, -17.7, 1); B(g, 0.12, 54, 0.12, dark(), cx - 2.4, 35, -17.7, 1); for (let y = 9; y < 62; y += 1.5) B(g, 0.8, 0.08, 0.1, dark(), cx - 2.8, y, -17.7, 1); }
  // roof: unfinished machinery, rebar stubs, crane, tanks
  const R = 0, rb = color(0x6d4b34);
  for (const cx of [-23, 23]) {
    B(g, 5, 4, 5, concD, cx - 4, H + 3.2, -8, 3); B(g, 3.4, 2.4, 6, conc, cx + 4, H + 2.4, 6, 3); B(g, 2.4, 1.6, 2.4, dark(), cx + 5, H + 4.4, 6, 2);
    for (let i = 0; i < 9; i++) B(g, 0.14, 2.4 + (i % 3) * 0.8, 0.14, rb, cx - 8 + i * 2, H + 2.4, 15.8, 1);
    for (let i = 0; i < 9; i++) B(g, 0.14, 2.2 + (i % 4) * 0.5, 0.14, rb, cx - 8 + i * 2, H + 2.3, -15.8, 1);
  }
  // exposed concrete skeleton on the left tower (unfinished top floor)
  for (const x of [-30, -24, -18]) for (const z of [-4, 4, 12]) B(g, 0.9, 5, 0.9, conc, x, H + 3.7, z, 2);
  B(g, 13, 0.7, 17.4, concD, -24, H + 6.5, 4, 3);
  // tank + antennas
  C(g, 2, 2, 3.4, 12, color(0x8a8a82), 20, H + 2.9, 0, 3); C(g, 2.1, 1.9, 0.5, 12, dark(), 20, H + 4.8, 0, 3);
  B(g, 0.15, 14, 0.15, dark(), 28, H + 7, -10, 1); B(g, 3, 0.12, 0.12, dark(), 28, H + 12, -10, 1); B(g, 2, 0.12, 0.12, dark(), 28, H + 10, -10, 1);
  // tower crane on the right tower
  const cr = color(0xe8a822);
  B(g, 0.9, 16, 0.9, cr, 18, H + 9, 10, 1); B(g, 0.5, 0.5, 26, cr, 18, H + 17, 3, 1); B(g, 0.5, 0.5, 8, cr, 18, H + 17, 18.2, 1);
  B(g, 2.2, 1.6, 2.2, color(0x5a5a5a), 18, H + 16.4, 20.5, 1); B(g, 0.18, 8, 0.18, dark(), 18, H + 13, -6, 1);
  B(g, 1.4, 1.2, 1.4, dark(), 18, H + 8.4, -6, 1);
  lim(g, [18, H + 17, 3], [18, H + 17, 21], 0.1, cr, 4);
  return size(g, 64, 38, H);
}

// ======================================================================= 3. Sochi sanatorium
function palm(h = 7, seed = 1) {
  const g = G(), r = mulberry(seed * 7), trunk = color(0x806246), leaf = dbl(0x3f7d34), leaf2 = dbl(0x2f6a2c);
  let x = 0, y = 0;
  for (let i = 0; i < 4; i++) { const seg = h / 4; C(g, 0.2 - i * 0.02, 0.26 - i * 0.02, seg + 0.1, 7, trunk, x, y + seg / 2, 0, 2); y += seg; x += 0.14; }
  for (let k = 0; k < 9; k++) {
    const piv = G(); piv.position.set(x, y, 0); piv.rotation.y = (k / 9) * Math.PI * 2 + r(); g.add(piv);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 3.4), k % 2 ? leaf : leaf2); fr.position.set(0, 0.1, 1.5); fr.rotation.x = 0.35 + r() * 0.3; piv.add(fr);
  }
  S(g, new THREE.SphereGeometry(0.28, 6, 5), color(0x6a4a2a), x + 0.25, y - 0.2, 0.2);
  return g;
}
function cypress(h = 7) {
  const g = G(), m = color(0x234d2c);
  C(g, 0.15, 0.2, 0.8, 6, color(0x5a4630), 0, 0.4, 0, 2);
  S(g, new THREE.ConeGeometry(0.95, h, 8), m, 0, 0.6 + h / 2, 0);
  S(g, new THREE.ConeGeometry(0.7, h * 0.5, 8), color(0x2a5a33), 0.02, 0.6 + h * 0.62, 0.02);
  return g;
}
function colonnade(g, xs, y0, h, z, r = 0.45, m = mat('stuccoWhite')) {
  for (const x of xs) {
    C(g, r * 0.86, r, h, 12, m, x, y0 + h / 2, z, 3); B(g, r * 2.9, 0.35, r * 2.9, m, x, y0 + h + 0.18, z, 2); B(g, r * 2.6, 0.3, r * 2.6, m, x, y0 + 0.15, z, 2);
  }
}
const prism = (g, w, rise, depth, m, x, y, z) => {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, rise); s.lineTo(-w / 2, 0);
  const o = new THREE.Mesh(uvScale(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }), 0.3), m); o.position.set(x, y, z - depth / 2); g.add(o); return o;
};
export function sanatorium() {
  const g = G(), wh = mat('stuccoWhite'), cream = mat('stuccoWhite'), terr = mat('plainTerra'), cols = [];
  // ---- central block + portico + rotunda
  g.add(place(slab(28, 12, 18, cream, roofM(), 6), 0, 6, -4));
  B(g, 29.2, 0.9, 19.2, wh, 0, 12.45, -4, 3);
  B(g, 26, 0.5, 5.6, wh, 0, 1.55, 7.8, 3);                                  // portico floor
  B(g, 26, 1.8, 5.6, wh, 0, 0.9, 7.8, 3);
  colonnade(g, range(-10.5, 10.5, 3), 1.8, 8.6, 9.7, 0.5);
  B(g, 25.4, 1.4, 6, wh, 0, 11.1, 7.9, 3);
  prism(g, 25.6, 2.8, 0.9, wh, 0, 11.8, 10.4);
  prism(g, 20, 2, 0.5, terr, 0, 12.0, 10.6);
  B(g, 26, 8.6, 0.4, terr, 0, 6.1, 5.0, 3);                                   // portico back wall (terracotta)
  grid(g, [-8, -4, 4, 8], [5.3], 5.25, 0, { w: 1.5, h: 3.4, lit: false });
  dr(g, 0, 4.1, 5.27, 0, { w: 3.2, h: 4.8, c: '#6a4220' });
  { const s = sign('САНАТОРИЙ ИМ. ОРДЖОНИКИДЗЕ', 18, 1.1, { bg: '#f0ead8', fg: '#7a1d17' }); s.position.set(0, 9.9, 10.9); g.add(s); }
  // stairs: wide terraces
  for (let i = 0; i < 8; i++) B(g, 30 - i * 0.4, 0.225 * (8 - i), 0.62, wh, 0, 0.1125 * (8 - i), 10.9 + 0.31 + i * 0.62, 2);
  for (const sd of [-1, 1]) { B(g, 8, 0.9, 5, wh, sd * 21.5, 0.45, 12, 3); B(g, 7.2, 0.5, 4.2, color(0x4a8a3a), sd * 21.5, 1.05, 12, 3); B(g, 0.6, 1.4, 5, wh, sd * 17.8, 0.7, 12.6, 2); }
  cols.push([-15, 15, -13, 10.8, 13], [-15.2, 15.2, 10.8, 15, 1.8], [-25.5, -17.5, 9.5, 14.5, 1.4], [17.5, 25.5, 9.5, 14.5, 1.4]);
  // rotunda
  C(g, 6.2, 6.2, 4.4, 16, wh, 0, 13 + 2.2, -4, 4);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; const m = decal('window', 1.4, 2.6, Math.sin(a) * 6.26, 15.3, -4 + Math.cos(a) * 6.26, { c: '#fbfaf4', fixed: true }); m.rotation.y = a; g.add(m); }
  C(g, 6.8, 6.8, 0.5, 16, wh, 0, 17.65, -4, 4);
  S(g, new THREE.SphereGeometry(6.2, 16, 7, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xe8e6da }), 0, 17.9, -4);
  C(g, 1.2, 1.4, 2, 10, wh, 0, 17.9 + 6.2 + 0.9, -4, 3); S(g, new THREE.SphereGeometry(1.4, 8, 6, 0, 6.3, 0, 1.6), color(0xd8d4c4), 0, 17.9 + 6.2 + 1.9, -4);
  S(g, new THREE.ConeGeometry(0.22, 3.2, 6), gold(), 0, 17.9 + 6.2 + 4.4, -4);
  S(g, new THREE.OctahedronGeometry(0.5, 0), gold(), 0, 17.9 + 6.2 + 6.3, -4);
  // ---- wings
  for (const sd of [-1, 1]) {
    const wx = sd * (14 + 14.5);
    g.add(place(slab(29, 10.8, 14, cream, roofM(), 6), wx - sd * 0, 5.4, -8));
    B(g, 30.2, 0.7, 15.2, wh, wx, 11.1, -8, 3); B(g, 29.4, 0.5, 14.4, wh, wx, 0.25, -8, 3);
    // end pavilion
    g.add(place(slab(8, 12, 15.5, cream, roofM(), 6), sd * 39, 6, -7.25));
    B(g, 9.2, 0.9, 16.7, wh, sd * 39, 12.45, -7.25, 3);
    prism(g, 8.4, 1.6, 0.8, wh, sd * 39, 12.9, 0.6);
    B(g, 6.4, 7.2, 0.35, terr, sd * 39, 7.2, 0.7, 3);
    B(g, 7.0, 0.3, 1.9, wh, sd * 39, 3.6, 1.5, 2); B(g, 7.0, 0.4, 2.3, wh, sd * 39, 10.9, 1.7, 2);
    colonnade(g, [sd * 36, sd * 39, sd * 42], 3.7, 7, 2.2, 0.28);
    for (const y of [4.3, 7.9]) B(g, 6.6, 0.9, 0.1, wh, sd * 39, y, 2.35, 1);
    dr(g, sd * 39 - 1.4, 5.1, 0.9, 0, { w: 1.5, h: 2.6, c: '#6a4220' }); dr(g, sd * 39 + 1.4, 5.1, 0.9, 0, { w: 1.5, h: 2.6, c: '#6a4220' });
    dr(g, sd * 39, 8.8, 0.9, 0, { w: 1.5, h: 2.6, c: '#6a4220' });
    dr(g, sd * 39, 1.5, 0.8, 0, { w: 1.8, h: 2.8, c: '#5a3a20' });
    // bays: windows + balconies on alternate bays
    for (let i = 0; i < 6; i++) {
      const bx = sd * (16.2 + i * 3.6);
      for (let k = 0; k < 3; k++) {
        const balc = i % 2 === 1 && k > 0;
        if (balc) {
          dr(g, bx, 3.6 * k + 1.35, -0.93, 0, { w: 1.5, h: 2.6, c: '#fbfaf4' });
          B(g, 3.0, 0.25, 1.2, wh, bx, 3.6 * k, -0.4, 2); B(g, 3.0, 0.9, 0.08, wh, bx, 3.6 * k + 0.7, 0.2, 1);
          B(g, 0.08, 0.9, 1.2, wh, bx - 1.5, 3.6 * k + 0.7, -0.4, 1); B(g, 0.08, 0.9, 1.2, wh, bx + 1.5, 3.6 * k + 0.7, -0.4, 1);
        } else wd(g, bx, 1.9 + 3.6 * k, -0.93, 0, { w: 1.4, h: 2.4, lit: (i + k) % 4 === 0 });
      }
    }
    // rear
    for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) wd(g, sd * (16.2 + i * 3.6), 1.9 + 3.6 * k, -15.07, Math.PI, { fixed: true, lit: (i + k) % 5 === 0 });
    grid(g, [-11, -7, -3, 1], [2.2, 6, 9.6], sd * 43.07, sd * Math.PI / 2, { fixed: true });
    wd(g, sd * 39, 2.4, -15.07, Math.PI, { fixed: true, w: 1.6 }); wd(g, sd * 39, 6, -15.07, Math.PI, { fixed: true }); wd(g, sd * 39, 9.6, -15.07, Math.PI, { fixed: true });
    B(g, 1.6, 4, 1.6, wh, sd * 24, 12.9, -12, 3); B(g, 1.6, 3.2, 1.6, wh, sd * 33, 12.5, -12, 3);   // chimneys
    cols.push([sd > 0 ? 14 : -43, sd > 0 ? 43 : -14, -15, -1, 11]);
    cols.push([sd > 0 ? 35 : -43, sd > 0 ? 43 : -35, -15, 0.7, 12]);
  }
  // central front windows (second/third floor sides of portico) and back
  grid(g, [-12.5, 12.5], [2, 5.5, 9.2], 5.1, 0, { w: 1.4, h: 2.4, lit: false });
  for (const sd of [-1, 1]) grid(g, [-9, -4, 1], [2.2, 6, 9.6], sd * 14.1, sd * Math.PI / 2, { fixed: true });
  grid(g, range(-12, 12, 4), [2.2, 6, 9.6], -13.1, Math.PI, { fixed: true, litEvery: 5 });
  dr(g, 0, 1.4, -13.12, Math.PI, { w: 2.6, h: 2.8, c: '#5a3a20' });
  // rear terrace + boiler pipes
  B(g, 8, 0.6, 3, wh, 0, 0.3, -14.6, 2); B(g, 0.35, 12, 0.35, color(0x777777), 10.5, 6, -13.5, 1); B(g, 0.35, 12, 0.35, color(0x777777), 11.2, 6, -13.5, 1);
  // ---- garden: fountains, palms, cypresses, hedges
  for (const sd of [-1, 1]) {
    const fx = sd * 21.5, fz = 12;
    C(g, 2.6, 2.7, 0.7, 14, wh, fx, 1.35 + 0.35, fz, 3); C(g, 2.3, 2.3, 0.2, 14, mat('water'), fx, 2.0, fz, 2);
    C(g, 0.3, 0.45, 1.6, 8, wh, fx, 2.7, fz, 2); C(g, 0.9, 0.5, 0.25, 10, wh, fx, 3.5, fz, 2);
    S(g, new THREE.ConeGeometry(0.35, 1.2, 6), color(0xbfe2f4, { emissive: 0x203038 }), fx, 4.2, fz);
  }
  const pal = [[-40, 6, 8], [-31, 7.5, 6], [-9, 11, 6], [9, 11, 7.5], [31, 7.5, 7], [40, 6, 8], [-28, 12, 9], [28, 12, 8.5], [-36, 11.5, 6], [36, 12, 7]];
  pal.forEach(([x, z, h], i) => { const p = palm(h, i + 1); p.position.set(x, 0, z); g.add(p); });
  for (const x of [-38, -24, -12.5, 12.5, 24, 38]) { const c = cypress(7 + (Math.abs(x) % 3)); c.position.set(x, 0, 3.5); g.add(c); }
  for (const x of [-18, 18]) { const c = cypress(8); c.position.set(x, 0, 14); g.add(c); }
  for (const sd of [-1, 1]) { B(g, 24, 0.9, 1.2, color(0x2f6a2c), sd * 30, 0.45, 9.5, 2); B(g, 12, 0.9, 1.2, color(0x2f6a2c), sd * 9, 0.45, 13.8, 2); }
  return size(g, 86, 30, 24, cols);
}

// ======================================================================= 4. Worker and Kolkhoz Woman
function cloth(w, h, amp, m, phase = 0) {
  const geo = new THREE.PlaneGeometry(w, h, 8, 3), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) / w + 0.5; p.setZ(i, Math.sin(u * Math.PI * 3 + phase) * amp * (0.3 + u) + p.getY(i) * 0.15); }
  geo.computeVertexNormals(); return new THREE.Mesh(geo, m);
}
export function workerKolkhozWoman() {
  const g = G(), stone = mat('s4c_pavilion'), granite = mat('granite'), st = mat('s4c_steel', { double: true }), steel = new THREE.MeshLambertMaterial({ color: 0xdfe5ec, emissive: 0x2a3038, side: THREE.DoubleSide });
  const steel2 = new THREE.MeshLambertMaterial({ color: 0xc4cdd6, emissive: 0x20262c, side: THREE.DoubleSide });
  // ---- pavilion base (14 m)
  B(g, 26, 0.5, 14, granite, 0, 0.25, 0, 3); B(g, 24, 0.5, 13, granite, 0, 0.75, 0, 3);
  const body = slab(20, 10.4, 10, stone, roofM(), 4); body.position.set(0, 6.2, 0); g.add(body);
  B(g, 21.4, 0.8, 11.4, mat('stuccoWhite'), 0, 11.8, 0, 3); B(g, 17, 1.6, 9, stone, 0, 13.0, 0, 3); B(g, 17.6, 0.45, 9.6, mat('stuccoWhite'), 0, 13.9, 0, 3);
  for (const x of [-9.4, -3.1, 3.1, 9.4]) { C(g, 0.45, 0.5, 9.6, 10, mat('stuccoWhite'), x, 6.2, 5.35, 3); B(g, 1.3, 0.4, 1.3, mat('stuccoWhite'), x, 11.2, 5.35, 2); }
  { const s = sign('СЛАВА ТРУДУ', 11, 1.2, { bg: '#b8352a', fg: '#f4efe0' }); s.position.set(0, 10.4, 5.07); g.add(s); }
  dr(g, 0, 4.1, 5.07, 0, { w: 4, h: 6.2, c: '#3a2a1a' });
  grid(g, [-6.2, 6.2], [4.6], 5.08, 0, { w: 2.2, h: 5, c: '#e8e2d0', lit: false });
  grid(g, [-8.3, 8.3], [4.6], 5.08, 0, { w: 1.2, h: 5, c: '#e8e2d0' });
  for (const sd of [-1, 1]) {
    for (const z of [-3, 0, 3]) wd(g, sd * 10.07, 4.6, z, sd * Math.PI / 2, { w: 1.6, h: 5, fixed: true });
    B(g, 0.3, 8, 0.3, color(0x666666), sd * 9.4, 5.2, -5.3, 1);
  }
  grid(g, [-7, -3.5, 3.5, 7], [6], -5.07, Math.PI, { w: 1.6, h: 4.4, fixed: true });
  dr(g, -9, 2.4, -5.07, Math.PI, { w: 2, h: 3.6, c: '#5a5a58' }); dr(g, 0, 2.4, -5.07, Math.PI, { w: 3.6, h: 3.6, c: '#5a5a58' });
  B(g, 2.4, 1.6, 1.2, dark(), 9, 1.8, -5.6, 2); B(g, 1.6, 1, 0.8, color(0x888888), 6, 1.5, -5.5, 2);
  for (let i = 0; i < 3; i++) B(g, 6, 0.2 * (3 - i), 0.5, granite, 0, 0.1 * (3 - i), 5.8 + i * 0.5, 2);
  // ---- figures
  const y0 = 14;
  const worker = (fx, inn, isWoman) => {
    const f = G(); f.position.set(fx, y0, 0); g.add(f);
    const A = steel, Bm = steel2;
    // legs (striding forward +Z)
    lim(f, [0, 18, 0.3], [0, 9.3, 2.4], 2.0, Bm, 8); lim(f, [0, 9.3, 2.4], [0, 1.2, 4.4], 1.7, Bm, 8);
    lim(f, [inn * 0.4, 18, 0], [inn * 0.4, 9.5, -2.0], 1.9, Bm, 8); lim(f, [inn * 0.4, 9.5, -2.0], [inn * 0.4, 1.6, -5.6], 1.6, Bm, 8);
    S(f, new THREE.BoxGeometry(2.4, 1.2, 4.2), A, 0, 0.6, 5.0); S(f, new THREE.BoxGeometry(2.3, 1.2, 4.0), A, inn * 0.4, 0.9, -6.2, -0.35);
    // torso / head
    S(f, new THREE.CapsuleGeometry(2.7, 6.2, 3, 10), A, 0, 23.6, 0.3, 0.12).scale.set(1.12, 1, 0.9);
    S(f, new THREE.SphereGeometry(1.9, 10, 8), A, 0, 32.4, 0.7);
    S(f, new THREE.CylinderGeometry(0.8, 1, 1.4, 8), A, 0, 29.8, 0.6);
    if (isWoman) {
      C(f, 2.5, 4.2, 9.5, 12, steel, 0, 14.2, 0.5, 3); // skirt
      const sk = cloth(7, 5, 0.9, steel, 0.5); sk.position.set(-inn * 0, 11.5, -3.6); sk.rotation.set(0.2, 0, 0); f.add(sk);
      const sc = cloth(15, 6, 2.2, steel, 1.2); sc.position.set(-inn * 4.3, 29, -4.2); sc.rotation.set(0.05, -0.55 * -inn * 0 + inn * 0.4, 0.25 * inn); f.add(sc);
      const sc2 = cloth(11, 4, 1.6, steel2, 2.2); sc2.position.set(-inn * 3.4, 26.8, -6.2); sc2.rotation.set(0.1, inn * 0.5, -0.15 * inn); f.add(sc2);
    } else {
      S(f, new THREE.TorusGeometry(2.2, 0.35, 5, 12), Bm, 0, 19.6, 0.3, Math.PI / 2 + 0.1);   // belt
      const sh = cloth(5, 5, 0.8, steel2, 0); sh.position.set(-inn * 2.4, 22, -2.9); sh.rotation.set(0.1, 0, 0); f.add(sh);   // coat flap
    }
    // arms: inner raised, outer swung back
    lim(f, [inn * 1.9, 27.6, 0.4], [inn * 3.3, 33.5, 1.0], 1.4, A, 7); lim(f, [inn * 3.3, 33.5, 1.0], [inn * 2.7, 39, 0.8], 1.25, A, 7);
    S(f, new THREE.SphereGeometry(1.1, 7, 6), A, inn * 2.7, 39.5, 0.8);
    lim(f, [-inn * 2.1, 27.6, 0.2], [-inn * 3.9, 21.5, -2.6], 1.35, A, 7); lim(f, [-inn * 3.9, 21.5, -2.6], [-inn * 5.0, 16.5, -5.8], 1.2, A, 7);
    S(f, new THREE.SphereGeometry(0.95, 7, 6), A, -inn * 5.0, 16.0, -6.1);
    return f;
  };
  worker(-3.3, 1, false); worker(3.3, -1, true);
  // hammer (held by the worker) and sickle (woman): both raised high
  const hx = -0.55, hy = y0 + 39.4;
  S(g, new THREE.BoxGeometry(1.0, 8.6, 1.0), steel2, hx, hy + 1.0, 0.8);
  S(g, new THREE.BoxGeometry(7, 3.2, 3), steel, hx, hy + 5.0, 0.8);
  S(g, new THREE.BoxGeometry(2.2, 2.6, 2.4), steel2, hx + 4.4, hy + 5.0, 0.8);
  const sx = 0.55;
  S(g, new THREE.CylinderGeometry(0.4, 0.4, 5, 6), steel2, sx, hy + 0.3, 0.8);
  const sick = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.75, 5, 16, 4.3), steel); sick.position.set(sx + 0.8, hy + 5.0, 0.8); sick.rotation.z = 0.9; g.add(sick);
  S(g, new THREE.ConeGeometry(0.5, 1.6, 5), steel, sx + 3.4, hy + 4.3, 0.8, 0, 0, -0.4);
  return size(g, 26, 14, 62, [[-13, 13, -7, 7, 14]]);
}

// ======================================================================= 5. Monument to the Conquerors of Space
function tiltTo(m, dir) { m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); return m; }
function statueFig(g, x, z, scale, body, suit) {
  const f = G(); f.position.set(x, 0, z); f.scale.setScalar(scale); g.add(f);
  C(f, 0.7, 0.9, 2.6, 8, body, 0, 1.3, 0, 2); C(f, 0.6, 0.75, 1.6, 8, body, 0, 3.4, 0, 2);
  S(f, new THREE.SphereGeometry(0.42, 8, 6), suit ? color(0xf2f2ee) : body, 0, 4.5, 0.1);
  return f;
}
export function spaceObelisk() {
  const g = G(), gran = mat('granite'), ti = mat('s4c_ti');
  // granite base, plaza
  B(g, 18.5, 1, 13.5, gran, 0, 0.5, -9, 3); B(g, 16, 5, 12, gran, 0, 3.5, -9, 3); B(g, 17, 0.5, 13, mat('concreteDark'), 0, 6.25, -9, 3);
  g.add(planeAt(mat('s4c_relief'), 12, 3.6, 0, 3.2, -2.94));
  g.add(planeAt(mat('s4c_relief'), 9, 3.2, 8.06, 3.2, -9, Math.PI / 2)); g.add(planeAt(mat('s4c_relief'), 9, 3.2, -8.06, 3.2, -9, -Math.PI / 2));
  g.add(planeAt(mat('s4c_relief'), 12, 3.6, 0, 3.2, -15.06, Math.PI));
  { const s = sign('СЛАВА ПОКОРИТЕЛЯМ КОСМОСА', 12.6, 0.9, { bg: '#c9a640', fg: '#2a2418', border: '#2a2418' }); s.position.set(0, 5.2, -2.93); g.add(s); }
  { const s = sign('1957 · 1961', 8, 0.8, { bg: '#c9a640', fg: '#2a2418', border: '#2a2418' }); s.position.set(0, 5.2, -15.07); s.rotation.y = Math.PI; g.add(s); }
  // maintenance door + vents on the back
  dr(g, -5.5, 1.9, -15.08, Math.PI, { w: 1.6, h: 2.6, c: '#4a4a48' });
  for (const x of [4, 6]) B(g, 1.2, 0.8, 0.2, dark(), x, 1.2, -15.06, 1);
  // the sweeping shaft
  const P = (t) => new THREE.Vector3(0, 6.5 + 63 * t, -9 + 14.5 * Math.pow(t, 2.3));
  const Rw = (t) => 0.55 + 3.6 * Math.pow(1 - t, 1.5);
  const n = 18;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, a = P(t0), b = P(t1), dir = b.clone().sub(a), len = dir.length() * 1.06;
    const geo = new THREE.CylinderGeometry(Rw(t1), Rw(t0), len, 4, 1); geo.rotateY(Math.PI / 4);
    const m = new THREE.Mesh(geo, ti); m.scale.set(1.9, 1, 0.9); m.position.copy(a.clone().add(b).multiplyScalar(0.5)); tiltTo(m, dir); g.add(m);
  }
  // rocket on the tip
  const top = P(1), tdir = P(1).sub(P(0.94));
  const rk = G(); rk.position.copy(top); tiltTo(rk, tdir); g.add(rk);
  C(rk, 0.7, 0.8, 3.2, 8, color(0xeeeeea), 0, 1.6, 0, 2); S(rk, new THREE.ConeGeometry(0.7, 2, 8), red(), 0, 4.2, 0);
  C(rk, 0.82, 0.82, 0.4, 8, red(), 0, 0.9, 0, 2);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; S(rk, new THREE.BoxGeometry(0.1, 1.4, 1.1), color(0xcfd2d6), Math.sin(a) * 1.0, 0.8, Math.cos(a) * 1.0, 0, a, 0); }
  // museum entrance block
  const mus = slab(24, 4.6, 8, mat('plainCream'), roofM(), 4); mus.position.set(0, 2.3, 7.5); g.add(mus);
  B(g, 25, 0.5, 9, mat('concrete'), 0, 4.85, 7.5, 3); B(g, 25, 0.35, 2.6, mat('concrete'), 0, 4.1, 12.3, 3);
  for (const x of [-12, -6, 0, 6, 12]) B(g, 0.6, 3.8, 0.6, mat('concrete'), x, 1.9, 12.9, 2);
  for (let i = 0; i < 3; i++) B(g, 12, 0.18 * (3 - i), 0.7, gran, 0, 0.09 * (3 - i), 13.4 + i * 0.7, 2);
  { const s = sign('МУЗЕЙ ИСТОРИИ КОСМОНАВТИКИ', 15, 0.9, { bg: '#1f3a66', fg: '#f4efe0' }); s.position.set(0, 3.55, 11.58); g.add(s); }
  for (const x of [-2, 2]) dr(g, x, 1.6, 11.52, 0, { w: 2.2, h: 3, c: '#3a4a6a' });
  grid(g, [-9, -6, 6, 9], [1.9], 11.52, 0, { w: 1.8, h: 2.4, litEvery: 2 });
  grid(g, [-9, -5, 5, 9], [1.9], 3.43, Math.PI, { w: 1.6, h: 2.2, fixed: true });
  grid(g, [5.5, 9.5], [2], 12.06, Math.PI / 2, { w: 1.6, h: 2.2, fixed: true }); grid(g, [5.5, 9.5], [2], -12.06, -Math.PI / 2, { w: 1.6, h: 2.2, fixed: true });
  dr(g, 0, 1.4, 3.43, Math.PI, { w: 2.4, h: 2.8, c: '#555' });
  B(g, 2.4, 1.2, 2, dark(), -6, 5.6, 7, 2); C(g, 0.5, 0.5, 2, 8, color(0xaaaaaa), 6, 5.8, 8, 2);
  // statues: Tsiolkovsky and a cosmonaut on pedestals
  B(g, 2.4, 2.4, 2.4, gran, -9.5, 1.2, 14.4, 2); B(g, 2.8, 0.3, 2.8, gran, -9.5, 0.15, 14.4, 2);
  { const f = statueFig(g, -9.5, 14.4, 0.9, color(0x6a6858), false); f.position.y = 2.4; lim(f, [0.3, 3.8, 0], [1.1, 4.4, 0.8], 0.22, color(0x6a6858), 6); S(f, new THREE.ConeGeometry(0.2, 0.7, 5), color(0x6a6858), 0, 4.2, 0.55, Math.PI); }
  B(g, 2.4, 2.4, 2.4, gran, 9.5, 1.2, 14.4, 2); B(g, 2.8, 0.3, 2.8, gran, 9.5, 0.15, 14.4, 2);
  { const f = statueFig(g, 9.5, 14.4, 0.9, color(0xe4e6e8), true); f.position.y = 2.4; lim(f, [0.35, 3.9, 0], [1.2, 5.1, 0.2], 0.22, color(0xe4e6e8), 6); S(f, new THREE.SphereGeometry(0.5, 8, 6), color(0x22344a), 0, 4.55, 0.35); }
  // benches + lamps
  for (const x of [-4, 4]) { B(g, 2.2, 0.15, 0.6, mat('planks'), x, 0.5, 15.6, 1); B(g, 0.2, 0.5, 0.5, dark(), x - 0.9, 0.25, 15.6, 1); B(g, 0.2, 0.5, 0.5, dark(), x + 0.9, 0.25, 15.6, 1); }
  return size(g, 30, 30, 75, [[-9.3, 9.3, -15.7, -2.3, 6.5], [-4.8, 4.8, -13.5, -5, 75], [-12.6, 12.6, 3.4, 12.2, 5.2]]);
}

// ======================================================================= 6. small props
export function playground() {
  const g = G(), red_ = color(0xc8352a), blue = color(0x2f5fa8), yel = color(0xe8b82a), steel = color(0x8a929a), wood = mat('planks');
  B(g, 12, 0.12, 12, mat('gravel'), 0, 0.06, 0, 4);
  // sandbox
  B(g, 3.8, 0.12, 3.8, mat('s4c_sand'), -3.5, 0.2, -3.5, 2);
  for (const [w, d, x, z] of [[4, 0.25, 0, -1.9], [4, 0.25, 0, 1.9], [0.25, 3.6, -1.9, 0], [0.25, 3.6, 1.9, 0]]) B(g, w, 0.45, d, wood, -3.5 + x, 0.3, -3.5 + z, 1);
  S(g, new THREE.ConeGeometry(0.5, 0.35, 8), color(0xd0bb7c), -3.9, 0.35, -3.7); C(g, 0.12, 0.1, 0.25, 6, red_, -2.6, 0.4, -3.0, 1);
  // slide
  const sl = G(); sl.position.set(3.6, 0, -3.4); g.add(sl);
  for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) B(sl, 0.1, 2.0, 0.1, blue, x, 1.0, z, 1);
  B(sl, 1.3, 0.1, 1.3, yel, 0, 2.0, 0, 1); for (const sd of [-1, 1]) B(sl, 0.06, 0.5, 1.3, red_, sd * 0.62, 2.35, 0, 1); B(sl, 1.3, 0.5, 0.06, red_, 0, 2.35, -0.62, 1);
  const ramp = B(sl, 0.8, 0.08, 3.4, steel, 0, 1.0, 2.2, 1); ramp.rotation.x = 0.52;
  for (const sd of [-1, 1]) { const rail = B(sl, 0.06, 0.2, 3.4, red_, sd * 0.42, 1.1, 2.2, 1); rail.rotation.x = 0.52; }
  for (let i = 0; i < 5; i++) B(sl, 0.8, 0.06, 0.12, steel, 0, 0.4 + i * 0.32, -0.9 - i * 0.07, 1);
  for (const sd of [-1, 1]) lim(sl, [sd * 0.4, 0, -0.7], [sd * 0.4, 2.0, -1.1], 0.04, blue, 5);
  // swings
  const sw = G(); sw.position.set(-3, 0, 3.6); g.add(sw);
  for (const sd of [-1, 1]) { lim(sw, [sd * 2.6, 0, -0.9], [sd * 2.6, 2.6, 0], 0.07, blue, 6); lim(sw, [sd * 2.6, 0, 0.9], [sd * 2.6, 2.6, 0], 0.07, blue, 6); }
  lim(sw, [-2.7, 2.6, 0], [2.7, 2.6, 0], 0.08, blue, 6);
  for (const x of [-1, 1]) { B(sw, 0.02, 1.7, 0.02, dark(), x - 0.2, 1.75, 0, 1); B(sw, 0.02, 1.7, 0.02, dark(), x + 0.2, 1.75, 0, 1); B(sw, 0.5, 0.06, 0.2, yel, x, 0.88, 0, 1); }
  // rocket-shaped climbing frame
  const rk = G(); rk.position.set(3.6, 0, 3.4); g.add(rk);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; lim(rk, [Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4], [Math.cos(a) * 0.25, 3.6, Math.sin(a) * 0.25], 0.045, red_, 5); }
  for (const [y, r] of [[0.9, 1.15], [1.8, 0.95], [2.7, 0.62]]) S(rk, new THREE.TorusGeometry(r, 0.04, 4, 12), yel, 0, y, 0, Math.PI / 2);
  S(rk, new THREE.ConeGeometry(0.35, 0.9, 6), red_, 0, 4.05, 0);
  // bench + mushroom shade
  B(g, 2.2, 0.12, 0.5, wood, 0, 0.5, -5.5, 1); B(g, 2.2, 0.5, 0.08, wood, 0, 0.8, -5.75, 1); B(g, 0.12, 0.5, 0.45, dark(), -0.9, 0.25, -5.5, 1); B(g, 0.12, 0.5, 0.45, dark(), 0.9, 0.25, -5.5, 1);
  C(g, 0.1, 0.1, 1.5, 6, blue, 0, 0.75, 0.3, 1); S(g, new THREE.ConeGeometry(0.9, 0.5, 8), red_, 0, 1.75, 0.3);
  for (const [x, z] of [[-5.6, -1], [-5.6, 1], [5.6, 0.2], [0.2, 5.7]]) B(g, 0.1, 0.9, 0.1, wood, x, 0.45, z, 1);
  return size(g, 12, 12, 4.4);
}
export function leninStatue() {
  const g = G(), gran = mat('granite'), br = color(0x62634f), br2 = color(0x74755f);
  B(g, 5.6, 0.5, 5.6, gran, 0, 0.25, 0, 3); B(g, 4.8, 0.5, 4.8, gran, 0, 0.75, 0, 3); B(g, 3.6, 3.2, 3.6, gran, 0, 2.6, 0, 3); B(g, 4.2, 0.4, 4.2, gran, 0, 4.4, 0, 3);
  { const s = sign('В. И. ЛЕНИН', 3, 0.7, { bg: '#c9a640', fg: '#2a2418', border: '#2a2418' }); s.position.set(0, 2.8, 1.82); g.add(s); }
  { const s = sign('1870 · 1924', 2.4, 0.5, { bg: '#c9a640', fg: '#2a2418', border: '#2a2418' }); s.position.set(0, 2.8, -1.82); s.rotation.y = Math.PI; g.add(s); }
  const y = 4.6;
  C(g, 0.55, 0.62, 1.2, 8, br, -0.2, y + 0.6, 0, 1); C(g, 0.55, 0.62, 1.2, 8, br, 0.25, y + 0.6, 0.05, 1);
  C(g, 0.9, 1.0, 2.6, 10, br2, 0, y + 2.1, 0, 2);                       // coat
  S(g, new THREE.BoxGeometry(2.0, 0.55, 0.9), br2, 0, y + 3.5, 0);      // shoulders
  C(g, 0.5, 0.7, 0.6, 8, br2, 0, y + 3.2, 0.05, 2);
  S(g, new THREE.SphereGeometry(0.42, 8, 7), br, 0, y + 4.1, 0.15);
  S(g, new THREE.ConeGeometry(0.2, 0.4, 5), br, 0, y + 3.82, 0.5, Math.PI * 0.9);               // beard
  lim(g, [0.95, y + 3.45, 0.1], [1.7, y + 3.9, 1.0], 0.26, br2, 7); lim(g, [1.7, y + 3.9, 1.0], [2.15, y + 4.9, 1.9], 0.22, br2, 7);   // raised arm
  S(g, new THREE.BoxGeometry(0.28, 0.5, 0.15), br, 2.2, y + 5.2, 2.0, -0.4);
  lim(g, [-0.95, y + 3.45, 0.1], [-1.0, y + 2.6, 0.5], 0.24, br2, 7); S(g, new THREE.SphereGeometry(0.28, 6, 5), br, -1.0, y + 2.45, 0.55);
  // cobbles/flowers around
  for (const sd of [-1, 1]) B(g, 0.8, 0.5, 5.6, color(0xb02a22), sd * 3.4, 0.25, 0, 2);
  return size(g, 6, 6, 10.6);
}
export function sodaMachine() {
  const g = G(), body = color(0xb8312a), cream = color(0xe8e0c8), chrome = color(0xc6ccd2);
  B(g, 1.0, 1.9, 0.8, body, 0, 1.0, 0, 2); B(g, 1.1, 0.12, 0.9, chrome, 0, 2.0, 0, 1); B(g, 1.08, 0.2, 0.88, cream, 0, 0.1, 0, 1);
  B(g, 1.04, 0.5, 0.04, cream, 0, 1.55, 0.41, 1);
  { const s = sign('ГАЗИРОВАННАЯ ВОДА', 0.92, 0.42, { bg: '#e8e0c8', fg: '#b8231c', border: '#b8231c' }); s.position.set(0, 1.56, 0.435); g.add(s); }
  B(g, 0.7, 0.5, 0.04, color(0x1f3a66), 0, 1.0, 0.41, 1);
  B(g, 0.5, 0.4, 0.02, color(0x4a6a9a), 0, 1.0, 0.435, 1);
  S(g, new THREE.CylinderGeometry(0.05, 0.05, 0.08, 6), chrome, 0.38, 0.62, 0.43, Math.PI / 2);
  B(g, 0.3, 0.06, 0.04, dark(), -0.28, 0.62, 0.43, 1);
  B(g, 0.46, 0.05, 0.3, chrome, 0, 0.55, 0.52, 1); B(g, 0.46, 0.05, 0.02, dark(), 0, 0.5, 0.67, 1);
  C(g, 0.07, 0.055, 0.17, 8, new THREE.MeshLambertMaterial({ color: 0xcfe8f4, transparent: true, opacity: 0.6 }), 0, 0.66, 0.52, 1);
  // back: service door, vent and a stamped plate
  B(g, 0.6, 1.2, 0.03, chrome, 0, 1.0, -0.41, 1); B(g, 0.3, 0.3, 0.03, dark(), 0, 1.7, -0.41, 1); B(g, 0.1, 0.1, 0.04, color(0xd9a62a), 0.18, 1.0, -0.43, 1);
  for (let i = 0; i < 4; i++) B(g, 0.5, 0.025, 0.03, dark(), 0, 0.3 + i * 0.06, -0.42, 1);
  B(g, 0.03, 1.4, 0.8, cream, 0.51, 1.0, 0, 1); B(g, 0.03, 1.4, 0.8, cream, -0.51, 1.0, 0, 1);
  return size(g, 1.2, 1.0, 2.15);
}
export function phoneBooth() {
  const g = G(), fr = color(0xc2402a), glass = new THREE.MeshLambertMaterial({ color: 0xa8c8d8, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
  B(g, 1.1, 0.12, 1.1, mat('concrete'), 0, 0.06, 0, 1);
  for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) B(g, 0.08, 2.3, 0.08, fr, x, 1.25, z, 1);
  B(g, 1.1, 0.1, 1.1, fr, 0, 2.4, 0, 1); B(g, 1.1, 0.3, 1.1, fr, 0, 0.3, 0, 1);
  for (const [w, d, x, z] of [[0.92, 0.03, 0, 0.5], [0.92, 0.03, 0, -0.5], [0.03, 0.92, -0.5, 0], [0.03, 0.92, 0.5, 0]]) { B(g, w, 1.7, d, glass, x, 1.3, z, 1); B(g, w, 0.05, d + 0.02, fr, x, 1.3, z, 1); }
  B(g, 0.08, 1.7, 0.04, fr, 0, 1.3, 0.5, 1);
  { const s = sign('ТЕЛЕФОН', 1.0, 0.28, { bg: '#f2e6b0', fg: '#222', border: '#222' }); s.position.set(0, 2.54, 0.56); g.add(s); const s2 = s.clone(); s2.position.z = -0.56; s2.rotation.y = Math.PI; g.add(s2); }
  B(g, 0.35, 0.55, 0.15, color(0x2a2c30), 0, 1.25, -0.4, 1); B(g, 0.1, 0.14, 0.1, color(0x1a1a1a), -0.16, 1.27, -0.3, 1);
  B(g, 0.3, 0.04, 0.2, fr, 0.0, 0.95, -0.38, 1);
  B(g, 0.4, 0.04, 0.4, color(0x5a3a20), 0, 0.54, 0.0, 1);
  return size(g, 1.2, 1.2, 2.7);
}
export function gazebo() {
  const g = G(), wh = mat('stuccoWhite'), green = mat('ironGreen', { double: true });
  C(g, 3.6, 3.7, 0.4, 8, mat('concrete'), 0, 0.2, 0, 3); C(g, 3.1, 3.1, 0.15, 8, mat('planks'), 0, 0.46, 0, 2);
  for (let k = 0; k < 8; k++) {
    const a = (k + 0.5) / 8 * Math.PI * 2, x = Math.sin(a) * 2.9, z = Math.cos(a) * 2.9;
    C(g, 0.17, 0.2, 3.2, 8, wh, x, 2.1, z, 2); B(g, 0.5, 0.2, 0.5, wh, x, 3.8, z, 1);
    if (k !== 0 && k !== 7) {   // railing between posts
      const a2 = (k + 1.5) / 8 * Math.PI * 2, x2 = Math.sin(a2) * 2.9, z2 = Math.cos(a2) * 2.9;
      const mx = (x + x2) / 2, mz = (z + z2) / 2, len = Math.hypot(x2 - x, z2 - z), ang = Math.atan2(x2 - x, z2 - z);
      const rail = B(g, 0.08, 0.1, len, wh, mx, 1.15, mz, 1); rail.rotation.y = ang;
      for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5 - 0.5; const b = B(g, 0.06, 0.65, 0.06, wh, mx + Math.sin(ang) * len * t, 0.85, mz + Math.cos(ang) * len * t, 1); b.rotation.y = ang; }
    }
  }
  const rim = C(g, 3.5, 3.5, 0.5, 8, wh, 0, 4.0, 0, 3); rim.rotation.y = Math.PI / 8;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.0, 1.9, 8), green); roof.position.y = 5.2; roof.rotation.y = Math.PI / 8; g.add(roof);
  S(g, new THREE.CylinderGeometry(0.05, 0.1, 1.4, 6), gold(), 0, 6.8, 0);
  S(g, new THREE.OctahedronGeometry(0.28, 0), red(), 0, 7.6, 0);
  for (const sd of [-1, 1]) { B(g, 0.4, 0.08, 2.4, mat('planks'), sd * 1.9, 0.8, -0.2, 1); B(g, 0.08, 0.4, 2.4, wh, sd * 2.05, 1.0, -0.2, 1); }
  B(g, 2.4, 0.08, 0.4, mat('planks'), 0, 0.8, -2.0, 1);
  for (let i = 0; i < 2; i++) B(g, 2.4, 0.2 * (2 - i), 0.5, mat('concrete'), 0, 0.1 * (2 - i), 3.4 + i * 0.5 - 0.2, 1);
  return size(g, 7.4, 7.4, 8);
}
export function flowerBed() {
  const g = G(), fm = new THREE.MeshLambertMaterial({ map: mat('s4c_flower').map });
  C(g, 2.9, 3.0, 0.5, 20, mat('concrete'), 0, 0.25, 0, 3);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.7, 0.3, 20), mat('s4c_flower')); top.position.y = 0.55; g.add(top);
  S(g, new THREE.SphereGeometry(2.6, 16, 5, 0, Math.PI * 2, 0, 0.55), mat('s4c_flower'), 0, 0.2, 0).scale.y = 0.45;
  // star of flowers
  const pts = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.55 : 1.6; pts.push(new THREE.Vector2(Math.sin(a) * r, Math.cos(a) * r)); }
  const sg = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.3, bevelEnabled: false }); sg.rotateX(-Math.PI / 2);
  S(g, sg, red(), 0, 0.7, 0); const sg2 = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map((p) => p.clone().multiplyScalar(0.45))), { depth: 0.3, bevelEnabled: false }); sg2.rotateX(-Math.PI / 2); S(g, sg2, color(0xf2d03a), 0, 1.0, 0);
  const r = mulberry(5);
  for (let i = 0; i < 28; i++) { const a = r() * 7, rr = 1.7 + r() * 0.8; S(g, new THREE.SphereGeometry(0.14, 5, 4), i % 3 ? red() : color(0xf2d03a), Math.cos(a) * rr, 0.78, Math.sin(a) * rr); }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; B(g, 0.12, 0.7, 0.12, color(0x3f7a2e), Math.sin(a) * 2.95, 0.55, Math.cos(a) * 2.95, 1); }
  return size(g, 6, 6, 1.6);
}
export function sovietMosaicWall() {
  const g = G(), conc = mat('concrete'), concD = mat('concreteDark');
  B(g, 20, 6, 0.8, conc, 0, 3, 0, 3);
  B(g, 20.6, 0.5, 1.2, concD, 0, 6.25, 0, 3); B(g, 21, 0.6, 1.6, concD, 0, 0.3, 0, 3);
  g.add(planeAt(mat('s4c_mosaic'), 12, 5.6, 0, 3.0, 0.43)); g.add(planeAt(mat('s4c_mosaicStripe'), 3.2, 5.6, -7.6, 3.0, 0.43)); g.add(planeAt(mat('s4c_mosaicStripe'), 3.2, 5.6, 7.6, 3.0, 0.43));
  for (const x of [-5.9, 5.9]) B(g, 0.2, 5.8, 0.06, color(0xc8c0a8), x, 3, 0.44, 1);
  for (const x of [-9.4, -5.9, 5.9, 9.4]) B(g, 0.12, 5.8, 0.06, color(0xc8c0a8), x, 3, 0.44, 1);
  // back: plain panel wall with slogan, buttresses, vents
  { const s = sign('МИР · ТРУД · МАЙ', 10, 1.2, { bg: '#b8352a', fg: '#f4efe0' }); s.position.set(0, 4.6, -0.43); s.rotation.y = Math.PI; g.add(s); }
  g.add(planeAt(mat('s4c_mosaicStripe'), 20, 0.5, 0, 0.9, -0.43, Math.PI)).scale.y = 1;
  for (const x of [-8, -3, 3, 8]) B(g, 0.8, 4.4, 0.7, concD, x, 2.2, -0.75, 2);
  for (const x of [-5.5, 5.5]) { dr(g, x, 1.3, -0.432, Math.PI, { w: 1.1, h: 2.4, c: '#5a5a58' }); B(g, 1.6, 0.4, 0.1, dark(), x, 3.4, -0.45, 1); }
  B(g, 0.3, 5, 0.1, color(0x777777), 0, 2.8, -0.5, 1);
  for (const sd of [-1, 1]) B(g, 0.08, 6.4, 0.08, color(0x777777), sd * 10.2, 3.2, 0, 1);
  return size(g, 20, 1.6, 6.8);
}
