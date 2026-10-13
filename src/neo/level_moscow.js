// Neo level 1: Moscow. A compact (220 × 175 m) Stalin-era city around the Neo node (a glowing stepped tower in the central plaza).
// Seven Sisters, the Palace of Culture and the VDNKh pavilion have walkable interiors. Lizards split between hunting you and the node.
import * as THREE from 'three';
import { color } from '../geo.js';
import { tex, mulberry } from '../textures.js';
import * as B2 from '../buildings2.js';
import * as A from '../buildings4a.js';
import * as BB from '../buildings4b.js';
import * as C from '../buildings4c.js';
import * as I from '../interiors.js';
import { makeKit, flat, tiledPlane } from '../levelkit.js';
import { addSun, addSunlight } from '../sky.js';
import { neoTowerMoscow } from './neotower.js';

const FOG = 0xc6e0f8;
const X0 = -110, X1 = 110, ZN = -87.5, ZS = 87.5;

export function buildNeoMoscow(scene) {
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 200, 1800);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0xb0b290, 1.9));
  addSunlight(scene, 2.0);
  const sunDisc = addSun(scene, 1700, 760);
  const rnd = mulberry(1937);
  const boxes = [];
  const kit = makeKit(scene, boxes);
  const { box, lay, put, toWorld, free } = kit;

  // ---- sky, ground, avenues, plaza ----
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 16), new THREE.MeshBasicMaterial({ map: tex('skyBlue'), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10; scene.add(sky);
  lay('grass', -9, -1200, 1200, -1200, 1200, 8);
  lay('grass', -8, X0, X1, ZN, ZS, 8);
  lay('asphalt', -7, X0, X1, -9, 9);                                    // the two avenues
  lay('asphalt', -7, -9, 9, ZN, ZS);
  for (const z of [-10.6, 10.6]) lay('paving', -6, X0, X1, z - 1.6, z + 1.6, 4);
  for (const x of [-10.6, 10.6]) lay('paving', -6, x - 1.6, x + 1.6, ZN, ZS, 4);
  lay('paving', -5, -38, 38, -38, 38, 4);                               // the central plaza around the Neo node
  lay('paving', -5, -30, 30, -87.5, -45, 4);                            // forecourts of the northern landmarks
  lay('paving', -5, -26, 26, 45, 87.5, 4);

  // ---- the Neo node ----
  const tower = neoTowerMoscow();
  put(tower, 0, 0, 'S', {});
  const baseRect = { x0: -tower.userData.rect.w / 2, x1: tower.userData.rect.w / 2, z0: -tower.userData.rect.d / 2, z1: tower.userData.rect.d / 2 };

  // ---- Stalin-era city (positions found with tests/layout checks; sizes are after scaling) ----
  const bld = {};
  const add = (name, g, x, z, f, o = {}) => { put(g, x, z, f, o); bld[name] = { g, x, z, f, s: o.s || 1 }; return g; };
  add('sisters', I.sevenSisters(), -64, -68, 'S', { s: 0.6 });
  add('school', A.school(), -66, -33, 'S', { s: 0.7 });
  add('kindergarten', A.kindergarten(), -100, -36, 'E', { s: 0.8 });
  add('vdnkh', I.vdnkhPavilion(), 66, -68, 'S', { s: 0.6 });
  add('stalinka', A.stalinka(), 80, -28, 'S', { s: 0.6 });
  add('workerKolkhoz', C.workerKolkhozWoman(), 0, -60, 'S', { s: 0.8 });
  add('culture', I.palaceOfCultureHall(), -64, 68, 'N', { s: 0.6 });
  add('univermag', B2.univermag({ w: 60, d: 24 }), -66, 30, 'N', { s: 0.8, size: { w: 60, d: 24, h: 23 } });
  add('metro', B2.metro(), -100, 26, 'N', { s: 0.8, size: { w: 25, d: 18, h: 15 } });
  add('planetarium', A.planetarium(), -100, 56, 'S', { s: 0.6 });
  add('stadium', BB.stadium(), 72, 68, 'N', { s: 0.4 });
  add('matenadaran', BB.matenadaran(), 96, 20, 'W', { s: 0.6 });
  add('workersClub', B2.workersClub(), 56, 28, 'N', { s: 0.8, size: { w: 39, d: 22, h: 25 } });
  add('sanatorium', C.sanatorium(), 4, 70, 'N', { s: 0.5 });

  // ---- skyline beyond the walls: more Stalin-era blocks and towers ----
  const ring = [() => A.stalinka(), () => B2.univermag({ w: 60, d: 24 }), () => A.school()];
  for (let i = 0; i < 22; i++) {
    const side = i % 4, g = ring[(rnd() * ring.length) | 0]();
    const x = side === 0 ? X0 - 25 - rnd() * 50 : side === 1 ? X1 + 25 + rnd() * 50 : -100 + rnd() * 200, z = side === 2 ? ZN - 25 - rnd() * 50 : side === 3 ? ZS + 25 + rnd() * 50 : -70 + rnd() * 140;
    const f = ['E', 'W', 'S', 'N'][side];
    if (g.userData.w === undefined) g.userData = { ...g.userData, w: 60, d: 24, h: 23 };
    put(g, x, z, f, { solid: false, s: 0.8 + rnd() * 0.5 });
  }
  { const far = I.sevenSisters(); put(far, 0, ZN - 130, 'S', { solid: false, s: 1.1 }); const far2 = I.palaceOfCultureHall(); put(far2, 150, ZN - 80, 'S', { solid: false, s: 1.0 }); }

  // ---- little park furniture and trees ----
  const pg = (x, z) => { const g = C.playground(); g.position.set(x, 0, z); scene.add(g); box(x - 4, x + 4, z - 4, z + 4, 2.2); };
  pg(-100, -75); pg(100, 75);
  for (const [x, z] of [[-20, -60], [20, -60], [-12, 58], [12, 58]]) { const f = C.flowerBed(); f.position.set(x, 0, z); scene.add(f); box(x - 2.8, x + 2.8, z - 2.8, z + 2.8, 0.9); }
  { const l = C.leninStatue(); l.position.set(0, 0, 44); l.rotation.y = Math.PI;   // faces the Neo tower
   scene.add(l); box(-2, 2, 42, 46, 6); }
  const trees = [];
  for (const sx of [-1, 1]) for (let z = ZN + 6; z < ZS; z += 10) { trees.push([sx * 12.8 + (rnd() - 0.5), z + rnd() * 3]); }
  for (let x = X0 + 6; x < X1; x += 10) { trees.push([x + rnd() * 3, -12.8]); trees.push([x + rnd() * 3, 12.8]); }
  for (let i = 0; i < 110; i++) trees.push([X0 + 4 + rnd() * (X1 - X0 - 8), ZN + 4 + rnd() * (ZS - ZN - 8)]);
  const treeOK = trees.filter(([x, z]) => free(x, z, 1.8, 2.5) && !(Math.abs(x) < 38 && Math.abs(z) < 38));
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.32, 4.2, 6), color(0x4a3a2a), treeOK.length);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.6, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), treeOK.length);
  const m4 = new THREE.Matrix4(), cc = new THREE.Color();
  treeOK.forEach(([x, z], i) => {
    const sc = 0.8 + rnd() * 0.6;
    m4.compose(new THREE.Vector3(x, 2.1, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); trunks.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, 5.4 + sc, z), new THREE.Quaternion(), new THREE.Vector3(sc, sc * 1.35, sc)); crowns.setMatrixAt(i, m4);
    cc.setHSL(0.24 + rnd() * 0.05, 0.38, 0.28 + rnd() * 0.1); crowns.setColorAt(i, cc);
    box(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 4);
  });
  scene.add(trunks, crowns);
  const lampSpots = [];
  for (const sx of [-1, 1]) for (let z = ZN + 8; z < ZS; z += 24) lampSpots.push([sx * 9.6, z]);
  for (let x = X0 + 8; x < X1; x += 24) { lampSpots.push([x, -9.6]); lampSpots.push([x + 12, 9.6]); }
  const lamps = lampSpots.filter(([x, z]) => free(x, z, 0.6, 2));
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 9, 6), color(0x55585c), lamps.length);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), lamps.length);
  lamps.forEach(([x, z], i) => {
    m4.compose(new THREE.Vector3(x, 4.5, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); poles.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, 9.1, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); heads.setMatrixAt(i, m4);
    box(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 8);
  });
  scene.add(poles, heads);

  // ---- confinement walls ----
  box(X0 - 20, X0, ZN - 20, ZS + 20, 400, true); box(X1, X1 + 20, ZN - 20, ZS + 20, 400, true);
  box(X0 - 20, X1 + 20, ZN - 20, ZN, 400, true); box(X0 - 20, X1 + 20, ZS, ZS + 20, 400, true);

  // ---- spawn points, pickups, props ----
  const spawnPoints = [];
  for (let z = ZN + 5; z <= ZS - 4; z += 8) for (let x = X0 + 5; x <= X1 - 4; x += 8) {
    const px = x + (rnd() - 0.5) * 4, pz = z + (rnd() - 0.5) * 4;
    if (free(px, pz, 2.4) && (Math.abs(px) > 40 || Math.abs(pz) > 40)) spawnPoints.push({ x: px, z: pz });
  }
  const inside = (name, pts) => pts.map(([lx, lz, t]) => { const b = bld[name], w = toWorld(b.x, b.z, b.f, lx, lz, b.s); return { type: t, x: w.x, z: w.z }; });
  spawnPoints.push(...inside('sisters', [[-10, -4], [10, -4]]).map(({ x, z }) => ({ x, z })), ...inside('vdnkh', [[-14, 0], [14, 0]]).map(({ x, z }) => ({ x, z })), ...inside('culture', [[-25.5, 0], [25.5, 0]]).map(({ x, z }) => ({ x, z })));
  const P = (type, x, z) => ({ type, x, z });
  const wanted = [
    P('neo', 0, 24), P('neo', -40, 3), P('neo', 40, -3), P('neo', -30, -45), P('neo', 30, 45), P('neo', 80, 3), P('neo', -85, -4),
    P('gas', 0, -24), P('gas', 40, 22), P('gas', -40, -22), P('gas', 30, -45), P('gas', -30, 45), P('gas', 60, -4), P('gas', -80, 5),
    P('powder', 14, 12), P('powder', -14, -12), P('powder', 50, 3), P('powder', -50, -3), P('powder', 22, -48), P('powder', -22, 48), P('powder', 90, -20), P('powder', -90, 18),
    P('shot', -14, 12), P('shot', 14, -12), P('shot', 40, -30), P('shot', -40, 30), P('shot', 70, 10), P('shot', -75, -10),
    P('rockets', 24, 24), P('rockets', -24, -24), P('rockets', 60, 46), P('rockets', -60, -50),
    P('cells', 24, -24), P('cells', -24, 24), P('cells', 90, 3), P('cells', -90, -3),
    P('fuel', 0, 40), P('fuel', 0, -44), P('fuel', 70, -4),
    P('w_shotgun', 8, 22), P('w_ssg', -22, 8), P('w_chaingun', 22, -8), P('w_rocket', 0, -34), P('w_grenade', 40, 3), P('w_flamer', -40, -3), P('w_plasma', 0, 30), P('w_frost', 24, 40), P('w_rail', -24, -40), P('w_bfg', 62, -30),
    ...inside('sisters', [[0, -8, 'w_rocket'], [-18, 4, 'neo'], [18, 4, 'gas'], [0, 10, 'cells']]),
    ...inside('culture', [[-25.5, 6, 'w_plasma'], [25.5, 6, 'rockets'], [0, 17, 'shot'], [-12, 18, 'gas']]),
    ...inside('vdnkh', [[-18, 10, 'w_bfg'], [18, 10, 'cells'], [-18, -10, 'powder'], [18, -10, 'rockets'], [0, 14, 'neo']]),
  ];
  const pickupSpawns = wanted.filter((q) => free(q.x, q.z, 1.2));
  const propSpawns = [];
  for (let i = 0; i < 34; i++) {
    const x = X0 + 8 + rnd() * (X1 - X0 - 16), z = ZN + 8 + rnd() * (ZS - ZN - 16);
    if (!free(x, z, 2.2) || (Math.abs(x) < 38 && Math.abs(z) < 38) || Math.abs(z) < 10 || Math.abs(x) < 10) continue;
    propSpawns.push({ type: i % 3 === 0 ? 'barrel' : 'crate', x, z, rot: rnd() * 3 });
    if (i % 2 === 0) propSpawns.push({ type: 'barrel', x: x + 1.0, z: z + 0.8 });
  }
  const perches = [];
  const ledge = (name, pts) => pts.forEach(([lx, ly, lz]) => { const b = bld[name], w = toWorld(b.x, b.z, b.f, lx, lz, b.s); perches.push({ x: w.x, y: ly * b.s, z: w.z }); });
  ledge('sisters', [[-14, 39.4, 14], [14, 39.4, 14], [-14, 39.4, -14], [0, 68.5, 12]]);
  ledge('culture', [[-30, 25.3, 18], [30, 25.3, 18], [-12, 44.4, 8]]);
  ledge('vdnkh', [[-30, 27.3, 16], [30, 27.3, 16]]);
  const hallZone = (name, W, D, H) => { const b = bld[name], t = -1.2, c = [[-W / 2 + t, -D / 2 + t], [W / 2 - t, D / 2 - t]].map(([lx, lz]) => toWorld(b.x, b.z, b.f, lx, lz, b.s)); return { name, x0: Math.min(c[0].x, c[1].x), x1: Math.max(c[0].x, c[1].x), z0: Math.min(c[0].z, c[1].z), z1: Math.max(c[0].z, c[1].z), top: H * b.s }; };
  const interiors = [hallZone('sisters', 60, 44, 38), hallZone('culture', 76, 44, 24), hallZone('vdnkh', 72, 40, 26)];

  function update(dt, t, camPos) { sunDisc.update(camPos); sky.position.copy(camPos); }

  return {
    boxes, spawnPoints, pickupSpawns, propSpawns, update, fogColor: FOG, perches, interiors,
    navBounds: { x0: X0, x1: X1, z0: ZN, z1: ZS },
    healTypes: ['neo', 'gas'],
    base: { x: 0, z: 0, hp: 2500, share: 0.4, rect: baseRect, h: 66, tower },
    enemyTypes: ['grunt', 'spitter', 'drake', 'bomber', 'gargoyle', 'shield', 'tsar'],
    layout: Object.entries(bld).map(([name, b]) => ({ name, x: b.x, z: b.z, f: b.f, s: b.s, w: b.g.userData.w, d: b.g.userData.d })),
    mode: 'waves', waves: [
      { grunt: 5, shield: 1 },
      { grunt: 4, spitter: 3, drake: 2, gargoyle: 2 },
      { grunt: 4, spitter: 3, shield: 3, bomber: 2, gargoyle: 2 },
      { grunt: 5, spitter: 4, drake: 3, shield: 3, bomber: 3, gargoyle: 3 },
      { tsar: 1, grunt: 5, spitter: 3, drake: 2, bomber: 2, shield: 2, gargoyle: 2 },
    ],
    start: { x: 0, z: 34, yaw: 0 }, startWeapons: ['sabre', 'pistol', 'shotgun'],
    spawnRange: [28, 100], maxAlive: 14, range: 300,
    intro: 'PROTECT NEO — KEEP ITS BLOCKCHAIN HEALTH ABOVE ZERO',
  };
}
