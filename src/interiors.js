// Walkable building interiors: a hollow "hall" with real walls, door gaps, a floor and a ceiling, plus the three
// enterable Soviet landmarks (Seven Sisters tower, Palace of Culture, VDNKh Central Pavilion).
// Everything is on one level (no stairs): walls get colliders with the doorways left open, the interior props get small colliders.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, decal } from './geo.js';
import { slab, tiledPlane, sign } from './buildings2.js';
import { addPainters, mulberry } from './textures.js';

const tilt = (m, axis, v) => { m.rotation[axis] = v; return m; };   // (Object3D.add returns the parent)
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
addPainters({
  s4i_marble(g, w, h) {            // cream + grey marble checker with veins
    const rnd = mulberry(401);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) R(g, x * 32, y * 32, 32, 32, (x + y) % 2 ? '#8e9094' : '#e6dfcf');
    for (let i = 0; i < 90; i++) R(g, (rnd() * 64) | 0, (rnd() * 64) | 0, 1 + ((rnd() * 5) | 0), 1, rnd() < 0.5 ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.2)');
    R(g, 0, 0, 64, 1, 'rgba(0,0,0,0.25)'); R(g, 0, 32, 64, 1, 'rgba(0,0,0,0.25)'); R(g, 0, 0, 1, 64, 'rgba(0,0,0,0.25)'); R(g, 32, 0, 1, 64, 'rgba(0,0,0,0.25)');
  },
  s4i_parquet(g, w, h) {           // herringbone-ish dark parquet
    const rnd = mulberry(402);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const c = 100 + ((rnd() * 28) | 0); R(g, x * 8, y * 8, 8, 8, `rgb(${c + 40},${c},${c - 40})`); R(g, x * 8, y * 8 + ((x + y) % 2 ? 0 : 4), 8, 1, 'rgba(0,0,0,0.25)'); }
  },
  s4i_plaster(g, w, h) {           // cream interior wall: pilaster strip, dado band at the bottom, cornice at the top
    const rnd = mulberry(403);
    R(g, 0, 0, 64, 64, '#e8dcba');
    for (let i = 0; i < 120; i++) R(g, (rnd() * 64) | 0, (rnd() * 64) | 0, 1, 1, rnd() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)');
    R(g, 0, 40, 64, 24, '#b9a87e'); R(g, 0, 39, 64, 2, '#f4ecd2'); R(g, 0, 0, 64, 4, '#f4ecd2'); R(g, 0, 4, 64, 1, 'rgba(0,0,0,0.2)');
    R(g, 0, 0, 3, 64, '#f4ecd2'); R(g, 28, 5, 8, 34, '#d7c89c'); R(g, 28, 5, 1, 34, 'rgba(0,0,0,0.15)');
  },
  s4i_coffer(g, w, h) {            // coffered ceiling
    R(g, 0, 0, 64, 64, '#efe7cf');
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { R(g, x * 32 + 3, y * 32 + 3, 26, 26, '#d9cfae'); R(g, x * 32 + 6, y * 32 + 6, 20, 20, '#f3ecd6'); R(g, x * 32 + 14, y * 32 + 14, 4, 4, '#d9a62a'); }
  },
  s4i_carpet(g, w, h) {            // red carpet with a gold border
    R(g, 0, 0, 64, 64, '#8a1a1c'); R(g, 0, 0, 64, 5, '#d9a62a'); R(g, 0, 59, 64, 5, '#d9a62a'); R(g, 0, 8, 64, 2, '#d9a62a'); R(g, 0, 54, 64, 2, '#d9a62a');
    for (let x = 4; x < 64; x += 12) { R(g, x, 26, 8, 12, '#d9a62a'); R(g, x + 2, 28, 4, 8, '#8a1a1c'); }
  },
  s4i_seat(g, w, h) {              // theatre seats seen from the front: red plush backs with gold numbers
    R(g, 0, 0, 64, 64, '#6a1218');
    for (let x = 0; x < 64; x += 8) { R(g, x + 1, 4, 6, 40, '#a8242c'); R(g, x + 1, 4, 6, 4, '#c0343a'); R(g, x + 1, 46, 6, 14, '#8a1a1e'); R(g, x + 3, 50, 2, 3, '#d9a62a'); }
  },
  s4i_curtain(g, w, h) {           // heavy red velvet curtain folds
    for (let x = 0; x < 64; x += 8) { R(g, x, 0, 4, 64, '#9a1820'); R(g, x + 4, 0, 4, 64, '#6e1016'); R(g, x + 3, 0, 1, 64, '#c4343c'); }
  },
  s4i_mural(g, w, h) {             // socialist-realist mosaic: sun rays, wheat and gear
    R(g, 0, 0, 128, 64, '#d9b04a');
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#e9c862' : '#c99a38'; g.beginPath(); g.moveTo(64, 70); g.lineTo(64 + (i - 7) * 24 - 12, -10); g.lineTo(64 + (i - 7) * 24 + 12, -10); g.fill(); }
    g.fillStyle = '#b8352a'; g.beginPath(); g.arc(64, 44, 24, 0, 7); g.fill(); g.fillStyle = '#d9a62a'; g.beginPath(); g.arc(64, 44, 14, 0, 7); g.fill(); g.fillStyle = '#b8352a'; g.beginPath(); g.arc(64, 44, 6, 0, 7); g.fill();
    for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283; R(g, 64 + Math.cos(a) * 17 - 3, 44 + Math.sin(a) * 17 - 3, 6, 6, '#b8352a'); }
    for (let x = 4; x < 124; x += 10) { R(g, x, 52, 2, 12, '#6a8a30'); R(g, x - 2, 48, 6, 6, '#e6c040'); }
    R(g, 0, 0, 128, 3, '#7a1c14'); R(g, 0, 61, 128, 3, '#7a1c14');
  },
  s4i_glassroof(g, w, h) {         // luminous skylight panes
    R(g, 0, 0, 64, 64, '#bfe6fa'); for (let i = 0; i < 64; i += 16) { R(g, i, 0, 1, 64, '#7a9ab0'); R(g, 0, i, 64, 1, '#7a9ab0'); } R(g, 0, 0, 64, 64, 'rgba(255,255,255,0.15)');
  },
}, { s4i_mural: [128, 64] });

// ---------- the hollow hall ----------
// opts: w,d (outer), h (outer height of the walls), ch (interior ceiling height), t (wall thickness),
// outer / inner / floor / ceil: material names, roof: material name for the top, doors: [{ side:'S'|'N'|'E'|'W', at:0, w:8, h:6 }]
// returns the group with userData { w, d, h, cols, inside:{x0,x1,z0,z1}, doors }
export function hall({ w, d, h, ch = 12, t = 1.4, outer = 'stalin', inner = 's4i_plaster', floor = 's4i_marble', ceil = 's4i_coffer', roof = 'roofTar', doors = [{ side: 'S', at: 0, w: 8, h: 6 }], tile = 6 }) {
  const g = new THREE.Group(), cols = [];
  const O = mat(outer), I = mat(inner), RF = mat(roof), C = mat('concrete');
  const wall = (x0, x1, z0, z1, y0, y1, outerFace, collide) => {   // axis-aligned wall box; outerFace in '+x','-x','+z','-z'
    const sx = x1 - x0, sz = z1 - z0, sy = y1 - y0; if (sx < 0.01 || sz < 0.01 || sy < 0.01) return;
    const m = boxT(sx, sy, sz, O, tile);
    const face = { '+x': 0, '-x': 1, '+z': 4, '-z': 5 }, mats = [I, I, RF, C, I, I]; mats[face[outerFace]] = O;
    // inner faces get their own uv scale (tile in metres of the plaster texture)
    m.material = mats; m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); g.add(m);
    if (collide) cols.push([x0, x1, z0, z1, y1]);
  };
  const sides = {
    S: { out: '+z', fixed: d / 2 - t, along: 'x', len: w, dir: 1 }, N: { out: '-z', fixed: -d / 2, along: 'x', len: w, dir: -1 },
    E: { out: '+x', fixed: w / 2 - t, along: 'z', len: d, dir: 1 }, W: { out: '-x', fixed: -w / 2, along: 'z', len: d, dir: -1 },
  };
  for (const [name, s] of Object.entries(sides)) {
    const ds = doors.filter((q) => q.side === name).sort((a, b) => a.at - b.at);
    const half = s.along === 'x' ? s.len / 2 : s.len / 2 - t; let cur = -half;
    const seg = (a, b, y0, y1, collide) => {
      if (s.along === 'x') wall(a, b, s.fixed, s.fixed + t, y0, y1, s.out, collide); else wall(s.fixed, s.fixed + t, a, b, y0, y1, s.out, collide);
    };
    for (const q of ds) { seg(cur, q.at - q.w / 2, 0, h, true); seg(q.at - q.w / 2, q.at + q.w / 2, q.h, h, false); cur = q.at + q.w / 2; }
    seg(cur, half, 0, h, true);
  }
  // floor, ceiling, upper mass
  const ix0 = -w / 2 + t, ix1 = w / 2 - t, iz0 = -d / 2 + t, iz1 = d / 2 - t;
  const fm = mat(floor).clone(); fm.depthWrite = false;
  const fl = tiledPlane(ix1 - ix0, iz1 - iz0, (ix1 - ix0) / 8, (iz1 - iz0) / 8, fm, (ix0 + ix1) / 2, 0.03, (iz0 + iz1) / 2); fl.rotation.x = -Math.PI / 2; fl.renderOrder = -4; g.add(fl);
  const top = boxT(ix1 - ix0, h - ch, iz1 - iz0, RF, 6); top.material = [C, C, RF, mat(ceil), C, C];
  top.position.set((ix0 + ix1) / 2, (ch + h) / 2, (iz0 + iz1) / 2); g.add(top);
  g.userData = { w, d, h, cols, inside: { x0: ix0, x1: ix1, z0: iz0, z1: iz1 }, doors };
  return g;
}

// ---------- interior furniture helpers ----------
const warm = () => color(0xfff0b8, { emissive: 0xffe9a0 });
function chandelier(g, x, y, z, r = 1.6) {
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 5), color(0x2a2a2c)), x, y + 1.2, z));
  g.add(tilt(place(new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 6, 20), color(0xd9a62a, { emissive: 0x4a3a08 })), x, y, z), 'x', Math.PI / 2));
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), warm()), x + Math.cos(a) * r, y + 0.2, z + Math.sin(a) * r)); }
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(r * 0.35, 8, 6), warm()), x, y - 0.1, z));
}
function pillar(g, cols, x, z, r, ch, wallMat = 'stalin') {
  g.add(place(cylT(r, r * 1.1, ch, 14, mat('concrete'), 3), x, ch / 2, z));
  g.add(place(boxT(r * 2.8, 0.5, r * 2.8, mat('concrete'), 2), x, ch - 0.25, z)); g.add(place(boxT(r * 2.6, 0.4, r * 2.6, mat('concrete'), 2), x, 0.2, z));
  cols.push([x - r, x + r, z - r, z + r, ch]);
}
function solid(g, cols, mesh, x, y, z, hx, hz, h) { g.add(place(mesh, x, y, z)); cols.push([x - hx, x + hx, z - hz, z + hz, h]); }
function banner(g, text, w, h, x, y, z, rotY = 0, bg = '#b8352a') { const s = sign(text, w, h, { bg }); s.position.set(x, y, z); s.rotation.y = rotY; g.add(s); }
function statue(g, cols, x, z, h = 4.2) {   // heroic worker on a plinth
  const grey = color(0xb8b4a8);
  g.add(place(boxT(2.2, 1.6, 2.2, mat('granite'), 1.5), x, 0.8, z));
  g.add(place(new THREE.Mesh(new THREE.CapsuleGeometry(0.4, h * 0.45, 4, 8), grey), x, 1.6 + h * 0.3, z));
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), grey), x, 1.6 + h * 0.62, z));
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 1.4, 4, 6), grey); arm.position.set(x + 0.5, 1.6 + h * 0.72, z); arm.rotation.z = -0.5; g.add(arm);
  cols.push([x - 1.1, x + 1.1, z - 1.1, z + 1.1, 3]);
}
const size = (g, w, d, h, cols) => { g.userData = { ...g.userData, w, d, h }; if (cols) g.userData.cols = cols; return g; };

// ---------- 1. Seven Sisters style tower with a walkable grand lobby ----------
export function sevenSisters() {
  const g = new THREE.Group(), cols = [];
  const W = 60, D = 44, H = 38, CH = 15;
  const base = hall({ w: W, d: D, h: H, ch: CH, outer: 'stalin', doors: [{ side: 'S', at: 0, w: 10, h: 8 }, { side: 'E', at: 0, w: 6, h: 5.5 }, { side: 'W', at: 0, w: 6, h: 5.5 }, { side: 'N', at: 12, w: 5, h: 5 }] });
  g.add(base); cols.push(...base.userData.cols);
  const cornice = mat('concrete');
  g.add(place(boxT(W + 1.6, 1.2, D + 1.6, cornice, 2), 0, H + 0.6, 0));
  // upper tiers (solid, above the lobby) and the wings
  const tiers = [{ w: 44, d: 30, h: 28 }, { w: 30, d: 22, h: 24 }, { w: 18, d: 16, h: 18 }];
  let y = H + 1.2;
  tiers.forEach((t) => { g.add(place(slab(t.w, t.h, t.d, mat('stalin'), mat('roofTar'), 6), 0, y + t.h / 2, 0)); g.add(place(boxT(t.w + 1.4, 1.1, t.d + 1.4, cornice, 2), 0, y + t.h + 0.55, 0)); y += t.h + 1.1; });
  for (const sd of [-1, 1]) {
    const x = sd * 43;
    g.add(place(slab(26, 30, 32, mat('stalin'), mat('roofTar'), 6), x, 15, -D / 2 + 16 - 6)); cols.push([x - 13, x + 13, -D / 2 - 6, -D / 2 + 26, 30]);
    g.add(place(boxT(27.4, 1, 33.4, cornice, 2), x, 30.5, -D / 2 + 16 - 6));
    g.add(place(slab(6, 10, 6, mat('stalin'), mat('roofTar'), 6), x + sd * 9, 36, -D / 2 + 13));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.6, 9, 4), mat('shingleGreen', { double: true })); cone.rotation.y = Math.PI / 4; cone.position.set(x + sd * 9, 45.5, -D / 2 + 13); g.add(cone);
  }
  const spire = new THREE.Mesh(new THREE.ConeGeometry(6, 36, 8), mat('shingleGreen', { double: true })); spire.position.set(0, y + 18, 0); g.add(spire);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(2.3), color(0xe03020, { emissive: 0xa01808 })); star.scale.set(1, 1.5, 1); star.position.set(0, y + 38.5, 0); g.add(star);
  // portico on the front
  for (let i = 0; i < 6; i++) { const x = -15 + i * 6; g.add(place(cylT(0.9, 1.0, 14, 12, mat('concrete'), 3), x, 7, D / 2 + 2.6)); cols.push([x - 1, x + 1, D / 2 + 1.6, D / 2 + 3.6, 14]); }
  g.add(place(boxT(34, 1.6, 4, cornice, 3), 0, 14.8, D / 2 + 2.6)); g.add(place(boxT(38, 0.7, 7, cornice, 3), 0, 0.35, D / 2 + 3.2));
  banner(g, 'ГЛАВНОЕ ЗДАНИЕ', 22, 2.6, 0, 18, D / 2 + 0.2);
  // windows on the outer base (decals on the walls)
  for (let x = -26; x <= 26; x += 5.5) for (const yy of [11, 20, 28]) g.add(decal('window', 1.6, 3.2, x, yy, D / 2 + 0.07, { c: '#f4f0e0', lit: ((x | 0) + yy) % 5 === 0 }));
  for (let x = -26; x <= 26; x += 5.5) for (const yy of [11, 20, 28]) { const win = decal('window', 1.6, 3.2, x, yy, -D / 2 - 0.07, { c: '#f4f0e0', fixed: true }); win.rotation.y = Math.PI; g.add(win); }
  // ---- the lobby (inside the hall) ----
  const ix = base.userData.inside;
  const midZ = (ix.z0 + ix.z1) / 2;
  // red carpet runner from the door to the stairs
  { const cm = mat('s4i_carpet').clone(); cm.depthWrite = false; const c = tiledPlane(7, ix.z1 - ix.z0 - 8, 3, 16, cm, 0, 0.04, midZ + 2); c.rotation.x = -Math.PI / 2; c.renderOrder = -3; g.add(c); }
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) pillar(g, cols, sx * 14, ix.z0 + 8 + i * 9.5, 1.1, CH);
  // grand staircase at the back (solid blocks) with a mural above it
  for (let s = 0; s < 6; s++) { const wdt = 20 - s * 1.5, m = boxT(wdt, 0.3 * (s + 1), 2.2, mat('granite'), 1.5); m.position.set(0, 0.15 * (s + 1), ix.z0 + 1.1 + (5 - s) * 2.2); g.add(m); }
  cols.push([-10, 10, ix.z0, ix.z0 + 13.2, 1.8]);
  { const mu = new THREE.Mesh(new THREE.PlaneGeometry(26, 8), new THREE.MeshBasicMaterial({ map: mat('s4i_mural').map })); mu.position.set(0, 9.5, ix.z0 + 0.06); g.add(mu); }
  banner(g, 'СЛАВА ТРУДУ!', 14, 1.6, 0, 14, ix.z0 + 0.08);
  // reception desk, statues, palms, chandeliers
  solid(g, cols, boxT(11, 1.1, 2.2, mat('planks'), 1.5), 0, 0.55, ix.z0 + 17, 5.5, 1.1, 1.1);
  g.add(place(boxT(11.4, 0.12, 2.6, mat('granite'), 1.5), 0, 1.16, ix.z0 + 17));
  banner(g, 'БЮРО ПРОПУСКОВ', 5, 0.8, 0, 2.2, ix.z0 + 17 + 1.15, 0, '#1a3a6a');
  statue(g, cols, -22, ix.z0 + 5); statue(g, cols, 22, ix.z0 + 5);
  for (const [x, z] of [[-24, ix.z1 - 4], [24, ix.z1 - 4], [-24, midZ], [24, midZ]]) {
    g.add(place(cylT(0.6, 0.45, 0.7, 8, color(0x6a3a22), 1), x, 0.35, z)); const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), color(0x2f6a30)); leaf.scale.set(1, 1.6, 1); g.add(place(leaf, x, 1.9, z)); cols.push([x - 0.7, x + 0.7, z - 0.7, z + 0.7, 2.5]);
  }
  for (const z of [midZ - 6, midZ + 8]) chandelier(g, 0, CH - 3.2, z, 2.2);
  chandelier(g, -22, CH - 3.0, midZ, 1.5); chandelier(g, 22, CH - 3.0, midZ, 1.5);
  // big flags on the side walls
  for (const sx of [-1, 1]) banner(g, 'СССР', 8, 3, sx * (ix.x1 - 0.1), 9, midZ, -sx * Math.PI / 2, '#b8352a');
  return size(g, 108, D + 8, 100, cols);
}

// ---------- 2. Palace of Culture with a walkable theatre ----------
export function palaceOfCultureHall() {
  const g = new THREE.Group(), cols = [];
  const W = 76, D = 44, H = 24, CH = 17;
  const base = hall({ w: W, d: D, h: H, ch: CH, outer: 'stalin', doors: [{ side: 'S', at: 0, w: 12, h: 8 }, { side: 'S', at: -26, w: 5, h: 5 }, { side: 'S', at: 26, w: 5, h: 5 }, { side: 'E', at: 6, w: 5, h: 5 }, { side: 'W', at: 6, w: 5, h: 5 }] });
  g.add(base); cols.push(...base.userData.cols);
  const cornice = mat('concrete'); let y = H;
  g.add(place(boxT(W + 1.6, 1.2, D + 1.6, cornice, 2), 0, H + 0.6, 0)); y = H + 1.2;
  for (const t of [{ w: 40, d: 26, h: 18 }, { w: 20, d: 16, h: 16 }]) { g.add(place(slab(t.w, t.h, t.d, mat('stalin'), mat('roofTar'), 6), 0, y + t.h / 2, 0)); g.add(place(boxT(t.w + 1.4, 1.1, t.d + 1.4, cornice, 2), 0, y + t.h + 0.55, 0)); y += t.h + 1.1; }
  const spire = new THREE.Mesh(new THREE.ConeGeometry(5, 30, 8), mat('shingleGreen', { double: true })); spire.position.set(0, y + 15, 0); g.add(spire);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(2.0), color(0xe03020, { emissive: 0xa01808 })); star.scale.set(1, 1.5, 1); star.position.set(0, y + 32.5, 0); g.add(star);
  for (let i = 0; i < 9; i++) { const x = -28 + i * 7; g.add(place(cylT(0.9, 1.0, 14, 12, mat('concrete'), 3), x, 7, D / 2 + 2.6)); cols.push([x - 1, x + 1, D / 2 + 1.6, D / 2 + 3.6, 14]); }
  g.add(place(boxT(66, 1.6, 4, cornice, 3), 0, 14.8, D / 2 + 2.6)); g.add(place(boxT(70, 0.7, 7, cornice, 3), 0, 0.35, D / 2 + 3.2));
  banner(g, 'ДВОРЕЦ КУЛЬТУРЫ', 30, 3, 0, 18.5, D / 2 + 0.2, 0, '#7a1c14');
  for (let x = -32; x <= 32; x += 6) for (const yy of [11, 19]) { if (Math.abs(x) < 7 && yy === 11) continue; g.add(decal('window', 1.7, 3.4, x, yy, D / 2 + 0.07, { c: '#f4f0e0', lit: ((x | 0) + yy) % 7 === 0 })); }
  for (let x = -32; x <= 32; x += 6) for (const yy of [11, 19]) { const win = decal('window', 1.7, 3.4, x, yy, -D / 2 - 0.07, { c: '#f4f0e0', fixed: true }); win.rotation.y = Math.PI; g.add(win); }
  const ix = base.userData.inside, midX = 0;
  // ---- foyer (front third) and auditorium ----
  const stageZ = ix.z0 + 2, stageD = 9;
  solid(g, cols, boxT(34, 1.3, stageD, mat('planks'), 2), 0, 0.65, stageZ + stageD / 2, 17, stageD / 2, 1.3);
  g.add(place(boxT(36, 0.25, stageD + 0.6, mat('s4i_carpet'), 3), 0, 1.4, stageZ + stageD / 2));
  // curtains + proscenium
  for (const sx of [-1, 1]) { const c = boxT(7, 12, 0.5, mat('s4i_curtain'), 3); g.add(place(c, sx * 13.5, 7.3, stageZ + stageD + 0.3)); }
  g.add(place(boxT(34, 4, 0.8, mat('s4i_curtain'), 3), 0, 14, stageZ + stageD + 0.3));
  g.add(place(boxT(38, 1.4, 1.2, color(0xd9a62a, { emissive: 0x3a2a08 }), 3), 0, 16.2, stageZ + stageD + 0.3));
  { const bd = new THREE.Mesh(new THREE.PlaneGeometry(26, 9), new THREE.MeshBasicMaterial({ map: mat('s4i_mural').map })); bd.position.set(0, 7.3, ix.z0 + 0.1); g.add(bd); }
  // seats: rows of red plush benches, aisle in the middle (each row a low jumpable box)
  const rowZ0 = stageZ + stageD + 5;
  for (let r = 0; r < 9; r++) for (const sx of [-1, 1]) {
    const z = rowZ0 + r * 2.4, x = sx * 12.5;
    const m = boxT(20, 1.0, 0.9, mat('s4i_seat'), 2); m.position.set(x, 0.5, z); g.add(m); g.add(place(boxT(20, 1.0, 0.25, mat('s4i_seat'), 2), x, 1.0, z + 0.45));
    cols.push([x - 10, x + 10, z - 0.5, z + 0.5, 1.0]);
  }
  g.add(place((() => { const c = tiledPlane(4, 22, 2, 11, Object.assign(mat('s4i_carpet').clone(), { depthWrite: false }), 0, 0.05, 0); c.rotation.x = -Math.PI / 2; c.renderOrder = -3; return c; })(), 0, 0.05, rowZ0 + 9));
  // columns along the side walls, chandeliers, balcony ledge, boxes
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) pillar(g, cols, sx * 29, ix.z0 + 8 + i * 9, 0.9, CH);
  for (const z of [ix.z0 + 12, ix.z0 + 24, ix.z1 - 8]) chandelier(g, 0, CH - 3.5, z, 2.4);
  for (const sx of [-1, 1]) { g.add(place(boxT(1.6, 0.5, ix.z1 - ix.z0 - 4, mat('concrete'), 2), sx * (ix.x1 - 0.9), 7.5, (ix.z0 + ix.z1) / 2)); g.add(place(boxT(0.2, 1.1, ix.z1 - ix.z0 - 4, mat('s4i_curtain'), 2), sx * (ix.x1 - 1.7), 8.3, (ix.z0 + ix.z1) / 2)); }
  statue(g, cols, -20, ix.z1 - 4); statue(g, cols, 20, ix.z1 - 4);
  solid(g, cols, boxT(8, 1.1, 2, mat('planks'), 1.5), -10, 0.55, ix.z1 - 7, 4, 1, 1.1);   // ticket desks
  solid(g, cols, boxT(8, 1.1, 2, mat('planks'), 1.5), 10, 0.55, ix.z1 - 7, 4, 1, 1.1);
  return size(g, 76, D + 8, 100, cols);
}

// ---------- 3. VDNKh Central Pavilion with a walkable exhibition hall ----------
export function vdnkhPavilion() {
  const g = new THREE.Group(), cols = [];
  const W = 72, D = 40, H = 26, CH = 20;
  const base = hall({ w: W, d: D, h: H, ch: CH, outer: 'stalin', doors: [{ side: 'S', at: 0, w: 14, h: 10 }, { side: 'E', at: 0, w: 6, h: 6 }, { side: 'W', at: 0, w: 6, h: 6 }, { side: 'N', at: 0, w: 6, h: 6 }] });
  g.add(base); cols.push(...base.userData.cols);
  const gold = color(0xd9a62a, { emissive: 0x3a2a08 }), cornice = mat('concrete');
  g.add(place(boxT(W + 1.6, 1.2, D + 1.6, cornice, 2), 0, H + 0.6, 0));
  // central tower + gilded spire, rooftop pediment
  g.add(place(slab(26, 16, 22, mat('stalin'), mat('roofTar'), 6), 0, H + 1.2 + 8, 0));
  g.add(place(boxT(27.6, 1.1, 23.6, cornice, 2), 0, H + 17.8, 0));
  const spire = new THREE.Mesh(new THREE.ConeGeometry(4, 40, 8), mat('domeGold', { double: true })); spire.position.set(0, H + 18.4 + 20, 0); g.add(spire);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.8), color(0xe03020, { emissive: 0xa01808 })); star.scale.set(1, 1.5, 1); star.position.set(0, H + 18.4 + 41.8, 0); g.add(star);
  // long portico with gilded capitals
  for (let i = 0; i < 8; i++) { const x = -24.5 + i * 7; g.add(place(cylT(1.0, 1.15, 16, 12, mat('concrete'), 3), x, 8, D / 2 + 3)); g.add(place(boxT(2.8, 0.9, 2.8, gold, 1), x, 16.4, D / 2 + 3)); cols.push([x - 1.1, x + 1.1, D / 2 + 1.9, D / 2 + 4.1, 16]); }
  g.add(place(boxT(60, 1.6, 4.6, cornice, 3), 0, 17.6, D / 2 + 3)); g.add(place(boxT(64, 0.7, 8, cornice, 3), 0, 0.35, D / 2 + 3.6));
  banner(g, 'ДОСТИЖЕНИЯ НАРОДНОГО ХОЗЯЙСТВА СССР', 40, 2.4, 0, 21, D / 2 + 0.2, 0, '#7a1c14');
  for (let x = -30; x <= 30; x += 6) for (const yy of [12, 21]) { if (Math.abs(x) < 8 && yy === 12) continue; g.add(decal('window', 1.7, 3.6, x, yy, D / 2 + 0.07, { c: '#f4f0e0', lit: ((x | 0) + yy) % 7 === 0 })); }
  for (let x = -30; x <= 30; x += 6) for (const yy of [12, 21]) { const win = decal('window', 1.7, 3.6, x, yy, -D / 2 - 0.07, { c: '#f4f0e0', fixed: true }); win.rotation.y = Math.PI; g.add(win); }
  // ---- exhibition hall ----
  const ix = base.userData.inside, midZ = (ix.z0 + ix.z1) / 2;
  { const sk = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ map: mat('s4i_glassroof').map, side: THREE.DoubleSide })); sk.rotation.x = Math.PI / 2; sk.position.set(0, CH - 0.05, midZ); g.add(sk); }
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) pillar(g, cols, sx * 21, ix.z0 + 8 + i * 12, 1.1, CH);
  // the Vostok rocket in the middle on a stepped base, surrounded by a low fountain basin
  { const rx = 0, rz = midZ;
    g.add(place(cylT(7, 7.4, 0.8, 18, mat('granite'), 3), rx, 0.4, rz));
    g.add(place(cylT(5.6, 5.8, 0.55, 18, color(0x3f7bb0, { emissive: 0x0a2a40 }), 3), rx, 0.95, rz));
    g.add(place(cylT(1.7, 2.2, 14, 14, color(0xe8e8ec), 3), rx, 8, rz));
    g.add(place(new THREE.Mesh(new THREE.ConeGeometry(1.7, 5, 14), color(0xc0382a)), rx, 17.5, rz));
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; g.add(place(cylT(0.55, 0.7, 9, 8, color(0xdcdce0), 2), rx + Math.cos(a) * 2.5, 5.2, rz + Math.sin(a) * 2.5)); g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.8, 8), color(0xc0382a)), rx + Math.cos(a) * 2.5, 10.6, rz + Math.sin(a) * 2.5)); }
    cols.push([rx - 7.2, rx + 7.2, rz - 7.2, rz + 7.2, 1.0], [rx - 2.4, rx + 2.4, rz - 2.4, rz + 2.4, 17]);
    { const sg = sign('ВОСТОК-1', 4, 0.9, { bg: '#1a3a6a' }); sg.position.set(0, 1.4, rz + 7.45); g.add(sg); }
  }
  // exhibits on plinths: a tractor, a satellite, a wheat sheaf, a globe, a turbine
  const plinth = (x, z) => { g.add(place(boxT(5, 1.0, 5, mat('granite'), 2), x, 0.5, z)); cols.push([x - 2.5, x + 2.5, z - 2.5, z + 2.5, 3.2]); };
  plinth(-18, ix.z0 + 8); { const t = new THREE.Group(); t.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.6), color(0xc0382a)), 0, 0.9, 0)); t.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 1.2), color(0x2a2a2c)), 0.4, 1.7, 0)); for (const [x, z, r] of [[-0.8, 0.9, 0.55], [-0.8, -0.9, 0.55], [0.9, 0.8, 0.3], [0.9, -0.8, 0.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.4, 10), color(0x1c1c1e)); w.rotation.x = Math.PI / 2; w.position.set(x, r, z); t.add(w); } t.position.set(-18, 1.0, ix.z0 + 8); g.add(t); }
  plinth(18, ix.z0 + 8); { const s = new THREE.Group(); s.add(new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), color(0xdcdce0))); for (const sx of [-1, 1]) s.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 0.9), color(0x2a4a8a)), sx * 1.8, 0, 0)); s.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 4), color(0xdcdce0)), 0, 1.1, 0)); s.position.set(18, 2.4, ix.z0 + 8); g.add(s); }
  plinth(-18, ix.z1 - 8); { const s = new THREE.Group(); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const c = new THREE.Mesh(new THREE.ConeGeometry(0.1, 2.2, 5), color(0xe6c040)); c.position.set(Math.cos(a) * 0.5, 1.2, Math.sin(a) * 0.5); c.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); s.add(c); } s.position.set(-18, 1.0, ix.z1 - 8); g.add(s); }
  plinth(18, ix.z1 - 8); { const s = new THREE.Group(); const gl = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 10), color(0x3f7bb0)); gl.position.y = 1.9; s.add(gl); s.add(tilt(place(new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.05, 5, 24), gold), 0, 1.9, 0), 'x', 1.2)); s.position.set(18, 1.0, ix.z1 - 8); g.add(s); }
  // banners, red carpet strip, chandeliers
  { const cm = mat('s4i_carpet').clone(); cm.depthWrite = false; const c = tiledPlane(5, ix.z1 - ix.z0 - 4, 2, 14, cm, 0, 0.04, midZ); c.rotation.x = -Math.PI / 2; c.renderOrder = -3; g.add(c); }
  banner(g, 'ВДНХ СССР', 12, 2, 0, 12, ix.z0 + 0.1, 0, '#1a3a6a');
  { const mu = new THREE.Mesh(new THREE.PlaneGeometry(22, 9), new THREE.MeshBasicMaterial({ map: mat('s4i_mural').map })); mu.position.set(0, 5.4, ix.z1 - 0.1); mu.rotation.y = Math.PI; g.add(mu); }
  for (const z of [midZ - 12, midZ + 12]) chandelier(g, 0, CH - 3.6, z, 2.4);
  for (const sx of [-1, 1]) banner(g, 'МИР · ТРУД · МАЙ', 12, 2.2, sx * (ix.x1 - 0.1), 10, midZ, -sx * Math.PI / 2, '#b8352a');
  return size(g, 72, D + 10, 100, cols);
}
