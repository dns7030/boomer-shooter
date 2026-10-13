// Neo level 2: Seattle. A gloomy grey, drizzly city around the Neo node (a Space-Needle-style saucer tower).
// Pike Place Market has a walkable interior; a gritty back-alley district (no people) fills the east side. Mount Rainier looms behind.
import * as THREE from 'three';
import { color } from '../geo.js';
import { tex, mulberry } from '../textures.js';
import * as S from '../buildings5s.js';
import { makeKit } from '../levelkit.js';
import { addSunlight } from '../sky.js';
import { neoTowerSeattle } from './neotower.js';

const FOG = 0x8f9ba3;
const X0 = -110, X1 = 110, ZN = -87.5, ZS = 87.5;

export function buildNeoSeattle(scene) {
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 70, 950);
  scene.add(new THREE.HemisphereLight(0xc4d0d8, 0x6a7468, 1.55));
  addSunlight(scene, 0.7);
  const rnd = mulberry(1851);
  const boxes = [];
  const kit = makeKit(scene, boxes);
  const { box, lay, put, toWorld, free } = kit;

  const sky = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 16), new THREE.MeshBasicMaterial({ map: tex('skyGrey'), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10; scene.add(sky);
  lay('grass', -9, -1200, 1200, -1200, 1200, 8);
  lay('paving', -8, X0, X1, ZN, ZS, 5);
  lay('asphalt', -7, X0, X1, -9, 9);
  lay('asphalt', -7, -9, 9, ZN, ZS);
  lay('paving', -5, -34, 34, -34, 34, 4);

  const tower = neoTowerSeattle();
  put(tower, 0, 0, 'S', {});
  const baseRect = { x0: -tower.userData.rect.w / 2, x1: tower.userData.rect.w / 2, z0: -tower.userData.rect.d / 2, z1: tower.userData.rect.d / 2 };

  const bld = {};
  const add = (name, g, x, z, f, o = {}) => { put(g, x, z, f, o); bld[name] = { g, x, z, f, s: o.s || 1 }; return g; };
  add('mopop', S.moPOP(), 0, -64, 'S', { s: 0.6 });
  add('columbia', S.columbiaCenter(), -70, -66, 'S', { s: 0.6 });
  add('amazon', S.amazonSpheres(), 68, -66, 'S', { s: 0.8 });
  add('library', S.centralLibrary(), -98, -26, 'E', { s: 0.7 });
  add('smith', S.smithTower(), -100, -64, 'E', { s: 0.7 });
  add('pike', S.pikePlaceMarket(), -64, 40, 'N', { s: 0.9 });
  add('coffee', S.coffeeHouse(), -30, -46, 'S', { s: 1.2 });
  add('gasworks', S.gasWorksPark(), 96, -26, 'W', { s: 0.7 });
  add('troll', S.fremontTroll(), -100, 68, 'E', { s: 1 });
  add('wheel', S.greatWheel(), 4, 72, 'N', { s: 0.9 });
  add('monorail', S.monorailSection(), 56, -42, 'S', { s: 0.8 });
  // gritty back-alley district, east side (no people)
  add('warehouse', S.brickWarehouse(), 70, 42, 'N', { s: 0.9 });
  add('boarded', S.boardedShop(), 100, 62, 'W', { s: 0.9 });
  add('boarded2', S.boardedShop(), 100, 36, 'W', { s: 0.9 });
  add('graffiti', S.graffitiWall(), 40, 44, 'N', { s: 1 });
  add('graffiti2', S.graffitiWall(), 100, 12, 'W', { s: 1 });
  add('dumpster', S.dumpster(), 44, 68, 'N', { s: 1 });
  add('dumpster2', S.dumpster(), 84, 14, 'S', { s: 1 });
  add('containers', S.shippingContainerStack(), 100, 78, 'W', { s: 1 });
  add('fence', S.rustyFencing(), 28, 30, 'S', { s: 1 });
  add('neon', S.neonSignPole(), 48, 18, 'S', { s: 1 });

  const ring = [() => S.smithTower(), () => S.columbiaCenter(), () => S.brickWarehouse(), () => S.centralLibrary()];
  for (let i = 0; i < 16; i++) {
    const side = i % 4, g = ring[(rnd() * ring.length) | 0]();
    const x = side === 0 ? X0 - 30 - rnd() * 60 : side === 1 ? X1 + 30 + rnd() * 60 : -100 + rnd() * 200, z = side === 2 ? ZN - 30 - rnd() * 60 : side === 3 ? ZS + 30 + rnd() * 60 : -70 + rnd() * 140;
    put(g, x, z, ['E', 'W', 'S', 'N'][side], { solid: false, s: 0.8 + rnd() * 0.6 });
  }
  put(S.spaceNeedle(), 150, ZN - 90, 'S', { solid: false, s: 1.2 });
  put(S.mountRainier(), 60, ZN - 520, 'S', { solid: false, s: 3 });

  const spots = [];
  for (const sx of [-1, 1]) for (let z = ZN + 8; z < ZS; z += 14) spots.push([sx * 13, z]);
  for (let i = 0; i < 90; i++) spots.push([X0 + 4 + rnd() * (X1 - X0 - 8), ZN + 4 + rnd() * (ZS - ZN - 8)]);
  spots.filter(([x, z]) => free(x, z, 1.8, 2.5) && !(Math.abs(x) < 34 && Math.abs(z) < 34) && !(x > 30 && z > 10)).forEach(([x, z]) => {
    const t = S.firTree(); t.position.set(x, 0, z); t.rotation.y = rnd() * 6; t.scale.setScalar(0.8 + rnd() * 0.6); scene.add(t); box(x - 0.4, x + 0.4, z - 0.4, z + 0.4, 5);
  });

  box(X0 - 20, X0, ZN - 20, ZS + 20, 400, true); box(X1, X1 + 20, ZN - 20, ZS + 20, 400, true);
  box(X0 - 20, X1 + 20, ZN - 20, ZN, 400, true); box(X0 - 20, X1 + 20, ZS, ZS + 20, 400, true);

  const spawnPoints = [];
  for (let z = ZN + 5; z <= ZS - 4; z += 8) for (let x = X0 + 5; x <= X1 - 4; x += 8) {
    const px = x + (rnd() - 0.5) * 4, pz = z + (rnd() - 0.5) * 4;
    if (free(px, pz, 2.4) && (Math.abs(px) > 38 || Math.abs(pz) > 38)) spawnPoints.push({ x: px, z: pz });
  }
  const inside = (name, pts) => pts.map(([lx, lz, t]) => { const b = bld[name], w = toWorld(b.x, b.z, b.f, lx, lz, b.s); return { type: t, x: w.x, z: w.z }; });
  spawnPoints.push(...inside('pike', [[0, 8], [0, -8]]).map(({ x, z }) => ({ x, z })));
  const P = (type, x, z) => ({ type, x, z });
  const wanted = [
    P('neo', 0, 24), P('neo', -40, 3), P('neo', 40, -3), P('neo', -30, -40), P('neo', 30, 42), P('neo', 80, 3), P('neo', -85, -4),
    P('gas', 0, -24), P('gas', 40, 22), P('gas', -40, -22), P('gas', 30, -40), P('gas', -30, 45), P('gas', 60, -4), P('gas', -80, 5),
    P('powder', 14, 12), P('powder', -14, -12), P('powder', 50, 3), P('powder', -50, -3), P('powder', 22, 50), P('powder', -22, -48), P('powder', 90, -10), P('powder', -90, 18),
    P('shot', -14, 12), P('shot', 14, -12), P('shot', 40, -30), P('shot', -40, 30), P('shot', 70, 10), P('shot', -75, -10),
    P('rockets', 24, 24), P('rockets', -24, -24), P('rockets', 60, 46), P('rockets', -60, -50),
    P('cells', 24, -24), P('cells', -24, 24), P('cells', 90, 3), P('cells', -90, -3),
    P('fuel', 0, 40), P('fuel', 0, -30), P('fuel', 70, -4),
    P('w_shotgun', 8, 22), P('w_ssg', -22, 8), P('w_chaingun', 22, -8), P('w_rocket', 0, -26), P('w_grenade', 40, 3), P('w_flamer', -40, -3), P('w_plasma', 0, 30), P('w_frost', 24, 40), P('w_rail', -24, -30), P('w_bfg', 62, -20),
    ...inside('pike', [[0, 8, 'w_plasma'], [0, -8, 'neo'], [12, 0, 'gas'], [-12, 0, 'cells']]),
  ];
  const pickupSpawns = wanted.filter((q) => free(q.x, q.z, 1.2));
  const propSpawns = [];
  for (let i = 0; i < 34; i++) {
    const x = X0 + 8 + rnd() * (X1 - X0 - 16), z = ZN + 8 + rnd() * (ZS - ZN - 16);
    if (!free(x, z, 2.2) || (Math.abs(x) < 34 && Math.abs(z) < 34) || Math.abs(z) < 10 || Math.abs(x) < 10) continue;
    propSpawns.push({ type: i % 3 === 0 ? 'barrel' : 'crate', x, z, rot: rnd() * 3 });
  }
  const hallZone = (name, W, D2, H) => { const b = bld[name], t = -1.2, c = [[-W / 2 + t, -D2 / 2 + t], [W / 2 - t, D2 / 2 - t]].map(([lx, lz]) => toWorld(b.x, b.z, b.f, lx, lz, b.s)); return { name, x0: Math.min(c[0].x, c[1].x), x1: Math.max(c[0].x, c[1].x), z0: Math.min(c[0].z, c[1].z), z1: Math.max(c[0].z, c[1].z), top: H * b.s }; };
  const interiors = [hallZone('pike', 43.6, 27.6, 16)];

  function update(dt, t, camPos) { sky.position.copy(camPos); }

  return {
    boxes, spawnPoints, pickupSpawns, propSpawns, update, fogColor: FOG, perches: [], interiors,
    navBounds: { x0: X0, x1: X1, z0: ZN, z1: ZS },
    healTypes: ['neo', 'gas'],
    base: { x: 0, z: 0, hp: 2500, share: 0.4, rect: baseRect, h: 80, tower },
    enemyTypes: ['grunt', 'spitter', 'drake', 'bomber', 'gargoyle', 'shield', 'sasquatch'],
    layout: Object.entries(bld).map(([name, b]) => ({ name, x: b.x, z: b.z, f: b.f, s: b.s, w: b.g.userData.w, d: b.g.userData.d })),
    mode: 'waves', waves: [
      { grunt: 5, shield: 1 },
      { grunt: 4, spitter: 3, drake: 2, gargoyle: 2 },
      { grunt: 4, spitter: 3, shield: 3, bomber: 2, gargoyle: 2 },
      { grunt: 5, spitter: 4, drake: 3, shield: 3, bomber: 3, gargoyle: 3 },
      { sasquatch: 1, grunt: 5, spitter: 3, drake: 2, bomber: 2, shield: 2, gargoyle: 2 },
    ],
    start: { x: 0, z: 34, yaw: 0 }, startWeapons: ['sabre', 'pistol', 'shotgun'],
    spawnRange: [28, 100], maxAlive: 14, range: 300,
    intro: 'PROTECT THE NEO NODE — KEEP ITS UPTIME ABOVE ZERO',
  };
}
