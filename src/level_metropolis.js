// Level 4: the Soviet metropolis (1980s). Three avenues around six open districts of free-standing buildings, a VDNKh-style
// plaza, and three walkable interiors (Seven Sisters lobby, Palace of Culture theatre, VDNKh exhibition hall).
// Same player/lizard scale as the other levels; lizards path around buildings (nav.js) and in through the doors.
import * as THREE from 'three';
import { mat, color } from './geo.js';
import { tex, mulberry } from './textures.js';
import * as B2 from './buildings2.js';
import * as A from './buildings4a.js';
import * as BB from './buildings4b.js';
import * as C from './buildings4c.js';
import * as I from './interiors.js';
import { makeKit, flat, tiledPlane } from './levelkit.js';
import { addSun, addSunlight } from './sky.js';

const FOG = 0xc6e0f8;
const X0 = -185, X1 = 185, ZN = -145, ZS = 145;

export function buildMetropolis(scene) {
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 260, 1900);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0xb0b290, 1.9));
  addSunlight(scene, 2.0);
  const sunDisc = addSun(scene, 1700, 760);
  const rnd = mulberry(1984);
  const boxes = [];
  const kit = makeKit(scene, boxes);
  const { box, lay, put, toWorld, free } = kit;

  // ---- sky, ground, avenues, plazas ----
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 16), new THREE.MeshBasicMaterial({ map: tex('skyBlue'), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10; scene.add(sky);
  lay('grass', -9, -1200, 1200, -1200, 1200, 8);
  lay('grass', -8, X0, X1, ZN, ZS, 8);
  lay('asphalt', -7, X0, X1, -12, 12);                                  // the main avenue (E-W)
  for (const sx of [-60, 60]) lay('asphalt', -7, sx - 8, sx + 8, ZN, ZS);
  lay('pavingDark', -6, X0, X1, -3.2, 3.2, 4);                          // tram bed
  for (const z of [-2.2, -0.8, 0.8, 2.2]) lay('concreteDark', -5, X0, X1, z - 0.07, z + 0.07, 2);
  for (const z of [-11.4, 11.4]) lay('paving', -6, X0, X1, z - 2.6, z + 2.6, 4);   // sidewalks
  for (const sx of [-60, 60]) for (const o of [-7.2, 7.2]) lay('paving', -6, sx + o - 1.6, sx + o + 1.6, ZN, ZS, 4);
  lay('paving', -5, -52, 52, -145, -12, 4);                             // VDNKh plaza
  lay('paving', -5, -52, 52, 12, 80, 4);                                // forecourt of the Palace of Culture
  lay('paving', -5, 68, 185, -62, -12, 4);                              // Intourist / Seven Sisters square
  const dashM = new THREE.MeshBasicMaterial({ color: 0xd8d4c4, depthWrite: false });
  for (let x = X0 + 6; x < X1; x += 12) for (const z of [-7.5, 7.5]) { if (Math.abs(Math.abs(x) - 60) < 10) continue; const d = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.3), dashM); d.rotation.x = -Math.PI / 2; d.renderOrder = -4; d.position.set(x, 0, z); scene.add(d); }

  // ---- buildings: [factory, x, z, facing, options] ----
  const sizes = { factory: { w: 90, d: 30, h: 30 }, metro: { w: 25, d: 18, h: 15 }, circus: { w: 45, d: 45, h: 24 }, univermag: { w: 60, d: 24, h: 23 }, workersClub: { w: 39, d: 22, h: 25 }, hotelCosmos: { w: 74, d: 31, h: 35 }, obelisk: { w: 8, d: 8, h: 61 } };
  const bld = {};   // name -> { g, x, z, f, s }
  const add = (name, g, x, z, f, o = {}) => { put(g, x, z, f, { size: sizes[name], ...o }); bld[name] = { g, x, z, f, s: o.s || 1 }; return g; };

  // NW district: microdistrict
  add('stalinka', A.stalinka(), -148, -112, 'S', { s: 0.85 });
  add('kindergarten', A.kindergarten(), -98, -118, 'W');
  add('school', A.school(), -138, -36, 'S');
  add('planetarium', A.planetarium(), -88, -50, 'S', { s: 0.75 });
  // N-mid: VDNKh plaza
  add('vdnkh', I.vdnkhPavilion(), 0, -118, 'S');
  add('workerKolkhoz', C.workerKolkhozWoman(), 0, -74, 'S');
  add('spaceObelisk', C.spaceObelisk(), -34, -48, 'S');
  add('eternalFlame', B2.eternalFlame(), 34, -48, 'S', { size: { w: 9.5, d: 9, h: 3 } });
  // NE: Seven Sisters, the hotel and the Highways Ministry bridge
  add('sisters', I.sevenSisters(), 128, -118, 'S', { s: 0.8 });
  add('intourist', A.hotelIntourist(), 128, -74, 'S');
  add('highways', BB.highwaysMinistry(), 128, -34, 'S', { s: 0.7 });
  // SW: shops and clubs
  add('univermag', B2.univermag({ w: 60, d: 24 }), -135, 40, 'N');
  add('metro', B2.metro(), -90, 26, 'N');
  add('workersClub', B2.workersClub(), -172, 76, 'E');
  add('pioneers', A.palaceOfPioneers(), -120, 125, 'N');
  // S-mid: Palace of Culture and the arena
  add('culture', I.palaceOfCultureHall(), 0, 115, 'N');
  add('circus', B2.circus(), -27, 48, 'N');
  add('concerts', C.palaceOfConcertsAndSports(), 25, 48, 'N', { s: 0.7 });
  // SE: science and sport
  add('institute', A.researchInstitute(), 122, 34, 'N');
  add('saucer', BB.flyingSaucer(), 88, 72, 'S', { s: 0.8 });
  add('matenadaran', BB.matenadaran(), 168, 66, 'W', { s: 0.7 });
  add('stadium', BB.stadium(), 140, 114, 'N', { s: 0.6 });

  // ---- the city beyond the walls: atomic plant, factory, TV tower, Motherland, Cosmos, panel blocks ----
  const sky4 = (name, g, x, z, f, s = 1) => { put(g, x, z, f, { solid: false, s }); bld[name] = { g, x, z, f, s }; return g; };
  sky4('houseOfSoviets', C.houseOfSoviets(), 60, ZS + 45, 'N', 0.8);
  sky4('linnahall', BB.linnahall(), -45, ZS + 50, 'N', 0.7);
  sky4('sanatorium', C.sanatorium(), 180, ZN - 40, 'S', 0.8);
  sky4('atomic', BB.atomicPlant(), 0, ZN - 110, 'S', 0.7);
  sky4('factory', B2.factory({ w: 90, d: 30 }), -140, ZS + 45, 'N');
  sky4('cosmos', B2.hotelCosmos(), 150, ZS + 55, 'N');
  sky4('tv', B2.tvTower(), X0 - 40, -80, 'S');
  sky4('motherland', B2.motherland(), X1 + 130, 0, 'W', 0.8);
  const skyline = [() => B2.brezhnevka({ w: 60, d: 14, floors: 9 }), () => B2.towerBlock({ w: 36, d: 16, floors: 16 }), () => B2.khrushchyovka({ w: 50, d: 12, floors: 5 }), () => B2.brezhnevka({ w: 80, d: 14, floors: 12 })];
  for (let i = 0; i < 28; i++) {
    const side = i % 4, g = skyline[(rnd() * skyline.length) | 0]();
    const x = side === 0 ? X0 - 25 - rnd() * 60 : side === 1 ? X1 + 25 + rnd() * 60 : -150 + rnd() * 300, z = side === 2 ? ZN - 30 - rnd() * 60 : side === 3 ? ZS + 30 + rnd() * 70 : -100 + rnd() * 200;
    put(g, x, z, ['E', 'W', 'S', 'N'][side], { solid: false });
  }
  const ct = B2.coolingTower(); put(ct, 120, ZN - 90, 'S', { solid: false });

  // ---- street furniture ----
  const prop = (g, x, z, rotY, sx, sz, h) => { g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); if (h) box(x - sx / 2, x + sx / 2, z - sz / 2, z + sz / 2, h); };
  for (const [x, z] of [[-130, 2], [-60, -2], [10, 2], [76, -2], [140, 2]]) prop(B2.tram(), x, z, Math.PI / 2, 14.2, 2.7, 3.7);
  const carColors = [0x8a2a24, 0x2a4a6a, 0xd8d0b8, 0x4a5a3a, 0x7a6a2a, 0x5a2a5a];
  for (let i = 0; i < 26; i++) {
    const x = -160 + i * 12.6 + rnd() * 5, z = (i % 2 ? 1 : -1) * (6.5 + rnd() * 0.8);
    if (Math.abs(Math.abs(x) - 60) < 10) continue;
    prop(B2.lada(carColors[i % carColors.length]), x, z, Math.PI / 2 + (rnd() < 0.15 ? 0.15 : 0), 4.3, 1.9, 1.7);
  }
  for (const [x, z, r] of [[-96, 14, 0], [96, -14, Math.PI], [-20, 14, 0], [40, -14, Math.PI]]) prop(B2.busStop(), x, z, r, 5.2, 2.4, 2.8);
  for (const [x, z] of [[-45, 15], [45, -15], [-130, -15], [130, 15], [62, 24], [-62, -24]]) prop(B2.kiosk(), x, z, 0, 3.2, 2.6, 2.7);
  const slogans = ['СЛАВА ТРУДУ!', 'МИР — ТРУД — МАЙ', 'ПЯТИЛЕТКУ — В ЧЕТЫРЕ ГОДА!', 'НАРОД И ПАРТИЯ — ЕДИНЫ', 'СЛАВА КОСМОНАВТАМ!', 'КОММУНИЗМ — ЭТО МОЛОДОСТЬ МИРА'];
  [[-100, -16], [-30, 16], [30, -16], [100, 16], [-62, 70], [62, -70], [-150, -118], [150, 118]].forEach(([x, z], i) => { const b = B2.billboard(slogans[i % slogans.length], i % 2 ? '#1a3a6a' : '#b8352a'); b.position.set(x, 0, z); b.rotation.y = z < 0 ? 0 : Math.PI; scene.add(b); });
  // little park furniture around the district (colliders where they matter)
  const pg = (x, z) => { const g = C.playground(); g.position.set(x, 0, z); scene.add(g); box(x - 4, x + 4, z - 4, z + 4, 2.2); };
  pg(-100, -82); pg(-100, 78); pg(104, 72);
  for (const [x, z] of [[-24, -90], [24, -90], [-12, 78], [12, 78]]) { const f = C.flowerBed(); f.position.set(x, 0, z); scene.add(f); box(x - 2.8, x + 2.8, z - 2.8, z + 2.8, 0.9); }
  { const l = C.leninStatue(); l.position.set(0, 0, 24); scene.add(l); box(-2, 2, 22, 26, 6); }
  for (const [x, z] of [[-44, 24], [44, 24], [-50, -22], [50, -22]]) { const s = C.sodaMachine(); s.position.set(x, 0, z); scene.add(s); box(x - 0.7, x + 0.7, z - 0.7, z + 0.7, 2); }
  { const gz = C.gazebo(); gz.position.set(-84, 0, -96); scene.add(gz); box(-87.7, -80.3, -99.7, -92.3, 3); }
  { const w = C.sovietMosaicWall(); w.position.set(0, 0, -143); scene.add(w); box(-10, 10, -144, -142, 6); }

  // ---- trees and lamps (instanced) ----
  const trees = [];
  for (const sx of [-60, 60]) for (let z = ZN + 8; z < ZS; z += 13) { trees.push([sx - 5.6, z + rnd() * 3]); trees.push([sx + 5.6, z + rnd() * 3]); }
  for (let x = X0 + 8; x < X1; x += 13) { if (Math.abs(Math.abs(x) - 60) < 12) continue; trees.push([x + rnd() * 3, -9.4]); trees.push([x + rnd() * 3, 9.4]); }
  for (let i = 0; i < 90; i++) trees.push([X0 + 6 + rnd() * (X1 - X0 - 12), ZN + 6 + rnd() * (ZS - ZN - 12)]);
  const treeOK = trees.filter(([x, z]) => free(x, z, 1.6, 2.5) && !(Math.abs(z) < 12));
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
  for (const sx of [-60, 60]) for (let z = ZN + 10; z < ZS; z += 30) { lampSpots.push([sx - 8.2, z]); lampSpots.push([sx + 8.2, z + 15]); }
  for (let x = X0 + 10; x < X1; x += 30) { if (Math.abs(Math.abs(x) - 60) < 12) continue; lampSpots.push([x, -12.4]); lampSpots.push([x + 15, 12.4]); }
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
  for (let z = ZN + 6; z <= ZS - 4; z += 10) for (let x = X0 + 6; x <= X1 - 4; x += 10) {
    const px = x + (rnd() - 0.5) * 5, pz = z + (rnd() - 0.5) * 5;
    if (free(px, pz, 2.4)) spawnPoints.push({ x: px, z: pz });
  }
  // interiors: a few spawn points and pickups inside the three halls
  const inside = (name, pts, type) => pts.map(([lx, lz, t]) => { const b = bld[name], w = toWorld(b.x, b.z, b.f, lx, lz, b.s); return { type: t, x: w.x, z: w.z }; });
  const hallSpawns = [
    ...inside('sisters', [[-10, -4], [10, -4], [0, 8]]), ...inside('culture', [[-25.5, 0], [25.5, 0], [0, 17]]), ...inside('vdnkh', [[-14, 0], [14, 0], [0, 12]]),
  ].map(({ x, z }) => ({ x, z }));
  spawnPoints.push(...hallSpawns);
  const P = (type, x, z) => ({ type, x, z });
  const wanted = [
    P('kvass', 0, -30), P('kvass', -56, 40), P('kvass', 56, -40), P('kvass', 90, 20), P('kvass', -100, -10), P('kvass', 20, 60), P('kvass', -20, 84), P('kvass', 130, -20),
    P('powder', 0, 5), P('powder', -60, -60), P('powder', 60, 60), P('powder', -90, 20), P('powder', 100, -20), P('powder', 30, -40), P('powder', -30, 70), P('powder', 140, 20),
    P('shot', -56, 20), P('shot', 56, -20), P('shot', 0, -70), P('shot', -100, -60), P('shot', 100, 60),
    P('rockets', 0, -20), P('rockets', -60, 70), P('rockets', 60, -70), P('rockets', 120, 10),
    P('cells', -30, -20), P('cells', 30, 20), P('cells', 90, -30), P('cells', -90, 50),
    P('fuel', 20, 20), P('fuel', -20, -26), P('fuel', 100, 20),
    P('w_ssg', -52, -8), P('w_chaingun', 52, 8), P('w_rocket', 0, -80), P('w_grenade', -100, 24), P('w_flamer', 118, -70),
    P('w_plasma', 60, 80), P('w_frost', -60, 100), P('w_rail', -120, 0), P('w_bfg', 0, 130 - 14),
    ...inside('sisters', [[0, -8, 'w_rocket'], [-18, 4, 'kvass'], [18, 4, 'powder'], [0, 10, 'cells']]),
    ...inside('culture', [[-25.5, 6, 'w_plasma'], [25.5, 6, 'rockets'], [0, 17, 'shot'], [-12, 18, 'kvass']]),
    ...inside('vdnkh', [[-18, 10, 'w_bfg'], [18, 10, 'cells'], [-18, -10, 'powder'], [18, -10, 'rockets'], [0, 14, 'kvass']]),
  ];
  const pickupSpawns = wanted.filter((q) => free(q.x, q.z, 1.2));
  const propSpawns = [];
  for (let i = 0; i < 46; i++) {
    const x = X0 + 10 + rnd() * (X1 - X0 - 20), z = ZN + 10 + rnd() * (ZS - ZN - 20);
    if (!free(x, z, 2.2) || Math.abs(z) < 10) continue;
    propSpawns.push({ type: i % 3 === 0 ? 'barrel' : 'crate', x, z, rot: rnd() * 3 });
    if (i % 2 === 0) propSpawns.push({ type: 'barrel', x: x + 1.0, z: z + 0.8 });
  }
  // gargoyle ledges: Seven Sisters tiers, Palace of Culture, VDNKh pavilion spire base, Stalinka towers
  const perches = [];
  const ledge = (name, pts) => pts.forEach(([lx, ly, lz]) => { const b = bld[name], w = toWorld(b.x, b.z, b.f, lx, lz, b.s); perches.push({ x: w.x, y: ly * b.s, z: w.z }); });
  ledge('sisters', [[-14, 39.4, 14], [14, 39.4, 14], [-14, 39.4, -14], [0, 68.5, 12], [-43, 31.6, 6], [43, 31.6, 6]]);
  ledge('culture', [[-30, 25.3, 18], [30, 25.3, 18], [-12, 44.4, 8], [12, 44.4, 8]]);
  ledge('vdnkh', [[-30, 27.3, 16], [30, 27.3, 16], [0, 45, 6]]);

  function update(dt, t, camPos) {
    const fl = bld.eternalFlame && bld.eternalFlame.g.userData.flame;
    if (fl) fl.scale.set(2.4 + Math.sin(t * 17) * 0.25 + Math.random() * 0.2, 3.6 + Math.sin(t * 13) * 0.4 + Math.random() * 0.3, 1);
    const st = bld.atomic && bld.atomic.g.userData.steam;
    if (Array.isArray(st)) st.forEach((sp, i) => { if (!sp.userData.b) sp.userData.b = sp.scale.clone(); sp.scale.set(sp.userData.b.x * (1 + Math.sin(t * 0.4 + i) * 0.05), sp.userData.b.y * (1 + Math.sin(t * 0.3 + i) * 0.05), 1); });
    sunDisc.update(camPos);
    sky.position.copy(camPos);
  }

  return {
    boxes, spawnPoints, pickupSpawns, propSpawns, update, fogColor: FOG,
    // walk-in test routes for the three enterable halls: stand outside the main door, walk to a point inside
    // hall interiors as world rectangles (flyers that end up inside while you are outside climb out through the roof)
    interiors: [['sisters', 60, 44, 38], ['culture', 76, 44, 24], ['vdnkh', 72, 40, 26]].map(([name, W, D, H]) => {
      const b = bld[name], t = 1.4, c = [[-W / 2 + t, -D / 2 + t], [W / 2 - t, D / 2 - t]].map(([lx, lz]) => toWorld(b.x, b.z, b.f, lx, lz, b.s));
      return { name, x0: Math.min(c[0].x, c[1].x), x1: Math.max(c[0].x, c[1].x), z0: Math.min(c[0].z, c[1].z), z1: Math.max(c[0].z, c[1].z), top: H * b.s };
    }),
    halls: [['sisters', 44, 0, 8], ['culture', 44, 3.5, 18], ['vdnkh', 40, 0, 12]].map(([name, D, lx, tz]) => {
      const b = bld[name], a = toWorld(b.x, b.z, b.f, lx, D / 2 + 9 / b.s, b.s), c = toWorld(b.x, b.z, b.f, lx, tz, b.s);
      return { name, from: a, to: c };
    }),
    layout: Object.entries(bld).map(([name, b]) => ({ name, x: b.x, z: b.z, f: b.f, s: b.s, w: (sizes[name] || b.g.userData).w, d: (sizes[name] || b.g.userData).d })),
    navBounds: { x0: X0, x1: X1, z0: ZN, z1: ZS },
    enemyTypes: ['grunt', 'spitter', 'drake', 'bomber', 'gargoyle', 'shield', 'tsar'],
    perches,
    mode: 'waves', waves: [
      { grunt: 6, shield: 1 },
      { grunt: 5, spitter: 4, drake: 2, gargoyle: 2 },
      { grunt: 5, spitter: 4, shield: 3, bomber: 2, gargoyle: 3 },
      { grunt: 6, spitter: 5, drake: 3, shield: 3, bomber: 3, gargoyle: 3 },
      { tsar: 1, grunt: 6, spitter: 4, drake: 3, bomber: 3, shield: 3, gargoyle: 3 },
    ],
    start: { x: 0, z: -22, yaw: 0 }, startWeapons: ['sabre', 'pistol', 'shotgun'],
    spawnRange: [30, 110], maxAlive: 16, range: 450,
    intro: 'THE SOVIET METROPOLIS — FIGHT THROUGH THE HALLS OF THE REVOLUTION',
  };
}
