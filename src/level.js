// Level 1: a Muscovy street (c. 1550s). Walk it, fight lizards, nobody enters buildings.
import * as THREE from 'three';
import { mat, color, plane } from './geo.js';
import * as B from './buildings.js';
import { tex } from './textures.js';
import { addSun, addSunlight } from './sky.js';

export const STREET_HALF = 6.4;   // walkable half-width
const FRONT_X = 7.0;              // x of the building facade line
export const BOUNDS = { zNear: 38.6, zFar: -57.6 };

const FOG = 0xc4defa;

function tiled(w, h, u, v, material, rotX = true) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  const m = new THREE.Mesh(g, material);
  if (rotX) m.rotation.x = -Math.PI / 2;
  return m;
}

export function buildLevel(scene) {
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 45, 260);

  scene.add(new THREE.HemisphereLight(0xbcd6ff, 0x8a7a60, 1.25));
  addSunlight(scene, 1.7);
  const sunDisc = addSun(scene, 330, 190);

  const boxes = [];
  const box = (x0, x1, z0, z1, h) => boxes.push({ x0, x1, z0, z1, h });

  // ---- sky, ground, treeline ----
  const skyMat = new THREE.MeshBasicMaterial({ map: tex('skyBlue'), side: THREE.BackSide, fog: false, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(380, 24, 16), skyMat);
  sky.renderOrder = -10;
  scene.add(sky);

  const flatM = (name, order) => { const m = mat(name).clone(); m.depthWrite = false; m.userData.order = order; return m; };
  const ground = tiled(700, 700, 175, 175, flatM('dirt', -9)); ground.renderOrder = -9;
  ground.position.y = 0;
  scene.add(ground);
  const road = tiled(STREET_HALF * 2 + 1.2, 118, 3.4, 29.5, flatM('cobble', -8)); road.renderOrder = -8;
  road.position.set(0, 0, -9);
  scene.add(road);
  for (const s of [-1, 1]) {
    const walk = tiled(0.9, 118, 1, 30, flatM('planks', -7)); walk.renderOrder = -7;
    walk.position.set(s * (STREET_HALF + 0.35), 0, -9);
    scene.add(walk);
  }

  const tm = new THREE.MeshBasicMaterial({ map: tex('treeline'), side: THREE.BackSide, transparent: true, alphaTest: 0.5, fog: false });
  const tg = new THREE.CylinderGeometry(190, 190, 40, 48, 1, true);
  const tuv = tg.attributes.uv;
  for (let i = 0; i < tuv.count; i++) tuv.setXY(i, tuv.getX(i) * 14, tuv.getY(i));
  const trees = new THREE.Mesh(tg, tm);
  trees.position.y = 18;
  scene.add(trees);

  // ---- buildings along both sides ----
  const place = (g, x, z, rotY, cols) => {
    g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
    return g;
  };
  const side = (s, z, fz, g) => {
    const rot = s < 0 ? Math.PI / 2 : -Math.PI / 2;
    place(g, s * (FRONT_X + fz), z, rot);
    for (const [lx0, lx1, lz0, lz1, h] of g.userData.cols || []) {
      const pts = [[lx0, lz0], [lx0, lz1], [lx1, lz0], [lx1, lz1]].map(([lx, lz]) => (s < 0 ? [lz, -lx] : [-lz, lx]));
      box(s * (FRONT_X + fz) + Math.min(...pts.map((p) => p[0])), s * (FRONT_X + fz) + Math.max(...pts.map((p) => p[0])),
        z + Math.min(...pts.map((p) => p[1])), z + Math.max(...pts.map((p) => p[1])), h);
    }
    return g;
  };
  let windmill = null;

  side(1, 33, 3.5 + 0.2, B.izba({ w: 8, d: 7 }));
  side(1, 22, 4.0, B.terem({ w: 11, d: 8 }));
  side(1, 8, 4.0, B.gostinyDvor({ w: 14, d: 8 }));
  side(1, -3.4, 2.6, B.bellTower());
  side(1, -14, 5.0, B.kizhiChurch());
  side(1, -27, 2.75, B.banya());
  side(1, -39, 3.5, B.izba({ w: 9, d: 7, trim: '#3f6aa8', roof: 'shingleGrey', lit: [0] }));
  side(1, -50.5, 3.5, B.smithy());

  side(-1, 33, 4.0, B.palaty({ w: 10, d: 8 }));
  side(-1, 22, 3.5, B.izba({ w: 8, d: 7, trim: '#3f6aa8', lit: [0] }));
  windmill = side(-1, 11, 3.1, B.windmill());
  side(-1, -1, 4.0, B.terem({ w: 11, d: 8, trim: '#3f6aa8', roof: 'shingleGreen' }));
  side(-1, -13, 4.0, B.palaty({ w: 10, d: 8, trim: '#b4352a' }));
  side(-1, -28, 4.0, B.gostinyDvor({ w: 14, d: 8 }));
  side(-1, -40, 3.5, B.izba({ w: 8, d: 7, trim: '#b4352a', roof: 'shingleBrown', lit: [1] }));
  side(-1, -52, 4.0, B.terem({ w: 10, d: 8, roof: 'shingleBrown' }));

  // ---- far end: Kremlin wall and gate tower ----
  const wall = B.kremlinWall(46, 9); place(wall, 0, -59.5, 0);
  place(B.gateTower(), 0, -62.04, 0);
  for (const x of [-15, 15]) place(B.wallTower(13), x, -60.5, 0);
  for (const x of [-30, 30]) place(B.wallTower(11), x, -60.5, 0);

  // ---- near end: wooden ostrog ----
  const pal = B.palisade(46); place(pal, 0, 40, Math.PI);
  const gate = plane(mat('ironDoor', { double: true }), 4.6, 5.0, 0, 2.5, 39.5); scene.add(gate);
  for (const x of [-9, 9]) place(B.guardTower(), x, 41.2, Math.PI);

  // ---- street furniture (with colliders) ----
  const prop = (g, x, z, rotY, sx, sz, h) => {
    place(g, x, 0, rotY); g.position.z = z; scene.add(g);
    box(x - sx / 2, x + sx / 2, z - sz / 2, z + sz / 2, h);
  };
  prop(B.stall('awningRed'), -4.4, 24, Math.PI / 2, 1.5, 2.8, 2.3);
  prop(B.stall('awningBlue'), 4.4, 14, -Math.PI / 2, 1.5, 2.8, 2.3);
  prop(B.crateStack(), 3.6, 29, 0.3, 2.3, 1.6, 1.9);
  prop(B.barrels(), -3.8, 15, 0, 1.8, 1.8, 1.0);
  prop(B.well(), 0, 0, 0, 2.2, 2.2, 3.4);
  prop(B.wayCross(), -4.2, -8, 0, 1.2, 1.2, 3.4);
  prop(B.hayCart(), 4.0, -18, 0.3, 2.9, 1.8, 1.9);
  prop(B.stall('awningBlue'), -4.4, -23, Math.PI / 2, 1.5, 2.8, 2.3);
  prop(B.barrels(), 3.6, -31, 0.5, 1.8, 1.8, 1.0);
  prop(B.crateStack(), -3.5, -35, 0, 2.3, 1.6, 1.9);
  prop(B.stall('awningRed'), 4.4, -41, -Math.PI / 2, 1.5, 2.8, 2.3);
  prop(B.wayCross(), 3.8, -48, 0, 1.2, 1.2, 3.4);
  prop(B.hayCart(), -4.0, -46, -0.2, 2.9, 1.8, 1.9);
  for (let z = 30; z > -56; z -= 17) for (const s of [-1, 1]) { const b = B.brazier(); place(b, s * 6.0, z, 0); scene.add(b); }

  // ---- invisible confinement walls (also block bullets / sight) ----
  box(-90, -STREET_HALF, -90, 70, 60);
  box(STREET_HALF, 90, -90, 70, 60);
  box(-90, 90, -90, BOUNDS.zFar, 60);
  box(-90, 90, BOUNDS.zNear, 90, 60);

  const spawnPoints = [];
  for (let z = 32; z >= -52; z -= 6) for (const x of [-3.6, 0, 3.6]) spawnPoints.push({ x: x + (z % 2 ? 0.8 : -0.8), z });

  const pickupSpawns = [
    { type: 'kvass', x: -2.0, z: 20 }, { type: 'kvass', x: 3.0, z: -10 }, { type: 'kvass', x: -3.0, z: -38 },
    { type: 'powder', x: 0.0, z: 26 }, { type: 'powder', x: -3.0, z: 3 }, { type: 'powder', x: 3.0, z: -25 }, { type: 'powder', x: 0.5, z: -45 },
    { type: 'shot', x: 3.0, z: 18 }, { type: 'shot', x: -4.0, z: -15 }, { type: 'shot', x: 2.0, z: -36 },
    { type: 'rockets', x: -2.0, z: -12 }, { type: 'rockets', x: 2.0, z: -34 },
    { type: 'cells', x: 3.0, z: -26 }, { type: 'cells', x: 1.0, z: -40 }, { type: 'cells', x: -3.0, z: -46 },
    { type: 'fuel', x: -3.0, z: -6 }, { type: 'fuel', x: 3.0, z: -32 },
    { type: 'w_shotgun', x: 2.0, z: 24 }, { type: 'w_ssg', x: -3.5, z: 14 }, { type: 'w_chaingun', x: -1.5, z: -3 },
    { type: 'w_rocket', x: 3.0, z: -14 }, { type: 'w_grenade', x: -3.0, z: -22 }, { type: 'w_flamer', x: 2.0, z: -30 },
    { type: 'w_plasma', x: -2.0, z: -38 }, { type: 'w_rail', x: 3.0, z: -44 }, { type: 'w_bfg', x: 0.0, z: -50 },
  ];


  function update(dt, t, camPos) {
    if (windmill) windmill.userData.blades.rotation.z -= dt * 0.7;
    sunDisc.update(camPos);
    sky.position.copy(camPos);
    trees.position.x = camPos.x; trees.position.z = camPos.z;
  }

  return {
    boxes, spawnPoints, pickupSpawns, update, fogColor: FOG,
    mode: 'waves', waves: [{ grunt: 4 }, { grunt: 4, spitter: 3 }, { grunt: 6, spitter: 5 }],
    start: { x: 0, z: 34, yaw: 0 }, startWeapons: ['sabre', 'pistol'],
    spawnRange: [14, 48], maxAlive: 8, range: 90,
    intro: 'LIZARDS FROM THE SKY — GRAB EVERY GUN YOU CAN FIND',
  };
}
