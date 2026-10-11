// Level 2: Soviet Avenue (1970s). A 350 m boulevard lined with panel blocks and Stalinist towers,
// ending at the Motherland monument. Same player and lizard scale as level 1, so everything around is huge.
import * as THREE from 'three';
import { mat, color } from './geo.js';
import { tex, mulberry } from './textures.js';
import * as B from './buildings2.js';
import { addSun, addSunlight } from './sky.js';

const HALF = 20.5;       // walkable half-width of the avenue
const FRONT = 22;        // x of the facade line
const Z_NEAR = 50, Z_FAR = -306, GOAL_Z = -296;
const FOG = 0xc6e0f8;

// flat ground layers: drawn first, in order, without touching the depth buffer (no z-fighting at any distance)
const flat = (name, order) => { const m = mat(name).clone(); m.depthWrite = false; m.userData.order = order; return m; };
function tiled(w, h, u, v, material) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  const m = new THREE.Mesh(g, material);
  m.rotation.x = -Math.PI / 2;
  if (material.userData.order !== undefined) m.renderOrder = material.userData.order;
  return m;
}

export function buildSoviet(scene) {
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 220, 1700);
  scene.add(new THREE.HemisphereLight(0xb8d4ff, 0x8a8f70, 1.3));
  addSunlight(scene, 1.8);
  const sunDisc = addSun(scene, 1700, 760);

  const boxes = [];
  const box = (x0, x1, z0, z1, h) => boxes.push({ x0, x1, z0, z1, h });
  const rnd = mulberry(2024);

  // ---- sky and ground ----
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 16), new THREE.MeshBasicMaterial({ map: tex('skyBlue'), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10;
  scene.add(sky);
  const ground = tiled(5000, 5000, 1000, 1000, flat('grass', -9)); ground.position.y = 0; scene.add(ground);

  const LEN = 372, CZ = -130;
  const road = tiled(28, LEN, 28 / 5, LEN / 5, flat('asphalt', -8)); road.position.set(0, 0, CZ); scene.add(road);
  for (const s of [-1, 1]) {
    const walk = tiled(9, LEN, 9 / 4, LEN / 4, flat('paving', -7)); walk.position.set(s * 18.5, 0, CZ); scene.add(walk);
  }
  const bed = tiled(9.4, LEN, 9.4 / 4, LEN / 4, flat('pavingDark', -7)); bed.position.set(0, 0, CZ); scene.add(bed);
  const railM = color(0x8a8a90);
  for (const x of [-3.15, -1.65, 1.65, 3.15]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, LEN), railM); r.position.set(x, 0.1, CZ); scene.add(r); }
  // centre line dashes
  const dashM = new THREE.MeshBasicMaterial({ color: 0xd8d4c4, depthWrite: false });
  for (let z = Z_NEAR - 6; z > Z_FAR; z -= 12) for (const x of [-9, 9]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 5), dashM); d.rotation.x = -Math.PI / 2; d.renderOrder = -6; d.position.set(x, 0, z); scene.add(d); }

  // ---- facade-line buildings ----
  const side = (s, z, fz, g) => {
    g.position.set(s * (FRONT + fz), 0, z);
    g.rotation.y = s < 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(g);
    return g;
  };
  // right (x > 0)
  side(1, 36, 14.4, B.metro());
  side(1, -8, 6.2, B.khrushchyovka({ w: 60, d: 12 }));
  side(1, -78, 7.2, B.brezhnevka({ w: 70, d: 14 }));
  side(1, -135, 17, B.workersClub());
  const factory = side(1, -203, 15.3, B.factory({ w: 90, d: 30 }));
  side(1, -285, 23.6, B.palaceOfCulture());
  // left (x < 0)
  side(-1, 22, 18, B.univermag({ w: 60, d: 24 }));
  side(-1, -48, 15, B.hotelCosmos());
  side(-1, -142, 22.6, B.stalinTower());
  side(-1, -222, 26.3, B.circus());
  side(-1, -278, 9.5, B.towerBlock({ w: 40, d: 16 }));
  void factory;

  // ---- far end: Motherland monument ----
  const mon = B.motherland(); mon.position.set(0, 0, -352); scene.add(mon);

  // ---- plaza: obelisk + eternal flame ----
  const ob = B.obelisk(); ob.position.set(-11, 0, -150); scene.add(ob);
  box(-17.5, -4.5, -156.5, -143.5, 70);
  const flame = B.eternalFlame(); flame.position.set(11, 0, -150); scene.add(flame);
  box(5.5, 16.5, -155.5, -144.5, 1.3);

  // ---- background skyline, landmarks ----
  const skyline = [() => B.brezhnevka({ w: 60, d: 14, floors: 9 }), () => B.towerBlock({ w: 36, d: 16, floors: 16 }), () => B.khrushchyovka({ w: 50, d: 12, floors: 5 }), () => B.brezhnevka({ w: 80, d: 14, floors: 12 })];
  for (let i = 0; i < 34; i++) {
    const sgn = rnd() < 0.5 ? -1 : 1, x = sgn * (95 + rnd() * 190), z = 90 - rnd() * 520;
    const g = skyline[(rnd() * skyline.length) | 0]();
    g.position.set(x, 0, z); g.rotation.y = rnd() < 0.5 ? Math.PI / 2 : 0; scene.add(g);
  }
  const ct1 = B.coolingTower(); ct1.position.set(135, 0, -178); scene.add(ct1);
  const ct2 = B.coolingTower(); ct2.position.set(178, 0, -226); scene.add(ct2);
  const tv = B.tvTower(); tv.position.set(-135, 0, -70); scene.add(tv);
  const wt = B.waterTower(); wt.position.set(112, 0, 12); scene.add(wt);
  for (let z = 40; z > -330; z -= 75) for (const x of [-215, 225]) { const p = B.pylon(); p.position.set(x, 0, z); scene.add(p); }

  // ---- street furniture with colliders ----
  const prop = (g, x, z, rotY, sx, sz, h, solid = true) => {
    g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
    if (solid) box(x - sx / 2, x + sx / 2, z - sz / 2, z + sz / 2, h);
  };
  for (const [x, z] of [[-2.4, -22], [2.4, -60], [-2.4, -98], [2.4, -128], [-2.4, -172], [2.4, -214], [-2.4, -250], [2.4, -284]]) prop(B.tram(), x, z, 0, 2.7, 14.2, 3.7);
  const carColors = [0x8a2a24, 0x2a4a6a, 0xd8d0b8, 0x4a5a3a, 0x7a6a2a, 0x5a2a5a];
  for (let i = 0; i < 18; i++) {
    const z = 36 - i * 19 - rnd() * 8, sgn = i % 2 ? 1 : -1;
    prop(B.lada(carColors[i % carColors.length]), sgn * (11.6 + rnd() * 0.8), z, rnd() < 0.2 ? 0.1 : 0, 1.9, 4.3, 1.7);
  }
  for (const [x, z, r] of [[-16.5, 6, Math.PI / 2], [16.5, -48, -Math.PI / 2], [-16.5, -118, Math.PI / 2], [16.5, -190, -Math.PI / 2], [-16.5, -258, Math.PI / 2]]) prop(B.busStop(), x, z, r, 2.4, 5.2, 2.8);
  for (const [x, z] of [[17, 18], [-17, -66], [17, -104], [-17, -184], [17, -240]]) prop(B.kiosk(), x, z, 0, 3.2, 2.6, 2.7);
  for (let z = 14; z > -300; z -= 34) {
    const off = rnd() * 6 - 3;
    for (const x of [-9 + off, 3 + off]) prop(B.barrier(), x, z, Math.PI / 2, 3, 0.9, 0.9);
  }
  const slogans = ['ХРАНИТЕ ДЕНЬГИ В СБЕРКАССЕ', 'МИР — ТРУД — МАЙ', 'ПЯТИЛЕТКУ — В ЧЕТЫРЕ ГОДА!', 'СЛАВА ТРУДУ!', 'НАРОД И ПАРТИЯ — ЕДИНЫ'];
  let si = 0;
  for (const [x, z] of [[-18.5, -30], [18.5, -100], [-18.5, -168], [18.5, -256], [-18.5, -298]]) {
    const b = B.billboard(slogans[si % slogans.length], si % 2 ? '#1a3a6a' : '#b8352a'); si++;
    b.position.set(x, 0, z); b.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(b);
  }

  // ---- instanced trees, lamp posts, tram poles (decor only) ----
  const treeSpots = [];
  for (let z = 44; z > -300; z -= 11) for (const x of [-15.2, 15.2]) {
    if (z < -138 && z > -162) continue; // keep the plaza clear
    treeSpots.push([x + (rnd() - 0.5) * 1.2, z + (rnd() - 0.5) * 3]);
  }
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.32, 4.2, 6), color(0x4a3a2a), treeSpots.length);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.6, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), treeSpots.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  treeSpots.forEach(([x, z], i) => {
    const sc = 0.8 + rnd() * 0.6;
    m4.compose(new THREE.Vector3(x, 2.1, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); trunks.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, 5.4 + sc, z), new THREE.Quaternion(), new THREE.Vector3(sc, sc * 1.35, sc)); crowns.setMatrixAt(i, m4);
    col.setHSL(0.24 + rnd() * 0.05, 0.38, 0.28 + rnd() * 0.1); crowns.setColorAt(i, col);
  });
  scene.add(trunks, crowns);

  const lampSpots = []; for (let z = 36; z > -300; z -= 30) for (const x of [-13.6, 13.6]) lampSpots.push([x, z]);
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 9, 6), color(0x55585c), lampSpots.length);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), lampSpots.length);
  lampSpots.forEach(([x, z], i) => {
    m4.compose(new THREE.Vector3(x, 4.5, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); poles.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x - Math.sign(x) * 0.7, 9.1, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); heads.setMatrixAt(i, m4);
  });
  scene.add(poles, heads);

  const tpoles = []; for (let z = 40; z > -310; z -= 28) for (const x of [-4.9, 4.9]) tpoles.push([x, z]);
  const tp = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.2, 8, 6), color(0x4a4d52), tpoles.length);
  tpoles.forEach(([x, z], i) => { m4.compose(new THREE.Vector3(x, 4, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); tp.setMatrixAt(i, m4); });
  scene.add(tp);
  for (const x of [-2.4, 2.4]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, LEN), color(0x222222)); w.position.set(x, 6.4, CZ); scene.add(w); }

  // ---- invisible confinement walls ----
  box(-600, -HALF, -700, 120, 400);
  box(HALF, 600, -700, 120, 400);
  box(-600, 600, -700, Z_FAR, 400);
  box(-600, 600, Z_NEAR, 120, 400);
  for (let k = 0; k < 4; k++) boxes[boxes.length - 1 - k].vis = false;   // invisible walls: no bullet holes

  // ---- spawn points and pickups ----
  const spawnPoints = [];
  for (let z = 42; z > -302; z -= 10) for (const x of [-16, -8, 0, 8, 16]) {
    const px = x + (rnd() - 0.5) * 3, pz = z + (rnd() - 0.5) * 3;
    if (boxes.some((b) => px > b.x0 - 1.8 && px < b.x1 + 1.8 && pz > b.z0 - 1.8 && pz < b.z1 + 1.8 && b.h < 100)) continue;
    spawnPoints.push({ x: px, z: pz });
  }
  const P = (type, x, z) => ({ type, x, z });
  const pickupSpawns = [
    P('kvass', 8, 30), P('kvass', -8, -52), P('kvass', 9, -112), P('kvass', -9, -170), P('kvass', 7, -228), P('kvass', -8, -282),
    P('powder', -6, 36), P('powder', 7, -12), P('powder', -7, -68), P('powder', 8, -140), P('powder', -8, -208), P('powder', 6, -262),
    P('shot', 6, 24), P('shot', -7, -40), P('shot', 7, -96), P('shot', -6, -190),
    P('rockets', 9, -62), P('rockets', -9, -128), P('rockets', 8, -196), P('rockets', -7, -270),
    P('cells', -7, -118), P('cells', 8, -180), P('cells', -6, -236), P('cells', 7, -288),
    P('fuel', 7, -150), P('fuel', -8, -206), P('fuel', 6, -258),
    P('w_ssg', -6, -18), P('w_rocket', 7, -46), P('w_grenade', -7, -80), P('w_plasma', 8, -112), P('w_frost', -7, -30),
    P('w_flamer', -8, -156), P('w_rail', 7, -198), P('w_bfg', -6, -246),
  ];

  const encounters = [
    { z: 30, spawn: { grunt: 3 }, msg: 'LIZARDS ON THE AVENUE!' },
    { z: -20, spawn: { grunt: 4, spitter: 2 } },
    { z: -75, spawn: { grunt: 5, spitter: 3 } },
    { z: -125, spawn: { grunt: 6, spitter: 4 }, msg: 'THEY ARE COMING FROM THE TOWERS!' },
    { z: -175, spawn: { grunt: 7, spitter: 5 } },
    { z: -225, spawn: { grunt: 8, spitter: 6 } },
    { z: -280, spawn: { grunt: 10, spitter: 8 }, msg: 'THE MONUMENT — THEY WANT IT TOO!' },
  ];

  function update(dt, t, camPos) {
    flame.userData.flame.scale.set(2.4 + Math.sin(t * 17) * 0.25 + Math.random() * 0.2, 3.6 + Math.sin(t * 13) * 0.4 + Math.random() * 0.3, 1);
    for (const ct of [ct1, ct2]) ct.userData.steam.scale.set(70 + Math.sin(t * 0.4 + ct.position.x) * 6, 56 + Math.sin(t * 0.3) * 5, 1);
    sunDisc.update(camPos);
    sky.position.copy(camPos);
  }

  return {
    boxes, spawnPoints, pickupSpawns, update, fogColor: FOG,
    propSpawns: (() => { const a = []; for (let z = 20; z > -300; z -= 23) { const x = (z % 2 ? -1 : 1) * (6 + ((z * 7) % 9)); a.push({ type: 'barrel', x, z }); a.push({ type: 'barrel', x: x + 0.9, z: z - 0.8 }); a.push({ type: 'crate', x: -x * 0.8, z: z - 9, rot: z * 0.1 }); } return a; })(),
    navBounds: { x0: -24, x1: 24, z0: -310, z1: 56 },
    mode: 'advance', encounters, goalZ: GOAL_Z,
    start: { x: 0, z: 44, yaw: 0 }, startWeapons: ['sabre', 'pistol', 'shotgun', 'chaingun'],
    spawnRange: [22, 80], maxAlive: 12, range: 400,
    intro: 'ADVANCE TO THE MOTHERLAND MONUMENT',
  };
}
