// Neo level 3: Dubai. A bright golden-hour desert city around the Neo node (a twisting golden-glass spire).
// The gold souk and the mall have walkable interiors; the mosque is scenery. One exuberant gold palace hotel.
import * as THREE from 'three';
import { color } from '../geo.js';
import { tex, mulberry, addPainters } from '../textures.js';
import * as D from '../buildings5d.js';
import { makeKit } from '../levelkit.js';
import { addSun, addSunlight } from '../sky.js';
import { neoTowerDubai } from './neotower.js';

const FOG = 0xf3dfaa;
const X0 = -110, X1 = 110, ZN = -87.5, ZS = 87.5;
addPainters({
  neo_sand(g, w, h) {
    const r = mulberry(31); g.fillStyle = '#e2c283'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,235,180,0.25)' : 'rgba(170,125,60,0.2)'; g.fillRect(r() * 64, r() * 64, 1 + r() * 2, 1); }
  },
  neo_dubroad(g) {
    g.fillStyle = '#6d6a66'; g.fillRect(0, 0, 64, 64);
    const r = mulberry(32); for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'; g.fillRect(r() * 64, r() * 64, 2, 1); }
  },
  neo_dubtile(g) {
    g.fillStyle = '#e9dcc0'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#cdb98f'; g.fillRect(0, 0, 64, 2); g.fillRect(0, 0, 2, 64);
    g.fillStyle = '#c9ab6a'; g.fillRect(30, 30, 4, 4);
  },
});

export function buildNeoDubai(scene) {
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 240, 1700);
  scene.add(new THREE.HemisphereLight(0xfff0cc, 0xd8b078, 2.0));
  addSunlight(scene, 2.3);
  const sunDisc = addSun(scene, 1700, 640);
  const rnd = mulberry(2020);
  const boxes = [];
  const kit = makeKit(scene, boxes);
  const { box, lay, put, toWorld, free } = kit;

  const sky = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 16), new THREE.MeshBasicMaterial({ map: tex('skyBlue'), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10; scene.add(sky);
  lay('neo_sand', -9, -1200, 1200, -1200, 1200, 10);
  lay('neo_dubtile', -8, X0, X1, ZN, ZS, 6);
  lay('neo_dubroad', -7, X0, X1, -9, 9);
  lay('neo_dubroad', -7, -9, 9, ZN, ZS);
  lay('neo_dubtile', -5, -34, 34, -34, 34, 4);

  const tower = neoTowerDubai();
  put(tower, 0, 0, 'S', {});
  const baseRect = { x0: -tower.userData.rect.w / 2, x1: tower.userData.rect.w / 2, z0: -tower.userData.rect.d / 2, z1: tower.userData.rect.d / 2 };

  const bld = {};
  const add = (name, g, x, z, f, o = {}) => { put(g, x, z, f, o); bld[name] = { g, x, z, f, s: o.s || 1 }; return g; };
  add('palace', D.goldPalaceHotel(), 0, -62, 'S', { s: 0.6 });
  add('alarab', D.burjAlArab(), -72, -64, 'S', { s: 0.6 });
  add('museum', D.museumOfTheFuture(), 70, -66, 'S', { s: 0.6 });
  add('frame', D.dubaiFrame(), 72, -34, 'S', { s: 0.7 });
  add('wind', D.windTowerHouses(), -98, -30, 'E', { s: 0.7 });
  add('souk', D.goldSouk(), -64, 38, 'N', { s: 0.8 });
  add('mall', D.dubaiMall(), 66, 62, 'N', { s: 0.6 });
  add('ski', D.skiDome(), 4, 70, 'N', { s: 0.5 });
  add('twin', D.twinTowers(), -100, 62, 'E', { s: 0.6 });
  add('mosque', D.jumeirahMosque(), 96, 22, 'W', { s: 0.7 });
  add('cayan', D.cayanTower(), -98, 12, 'E', { s: 0.8 });
  add('coffee', D.coffeePotMonument(), 24, -46, 'S', { s: 1 });
  add('camel', D.goldCamelStatue(), -22, -46, 'S', { s: 1.4 });

  // skyline beyond the walls
  const ring = [() => D.burjTower(), () => D.twinTowers(), () => D.cayanTower(), () => D.dubaiFrame()];
  for (let i = 0; i < 16; i++) {
    const side = i % 4, g = ring[(rnd() * ring.length) | 0]();
    const x = side === 0 ? X0 - 30 - rnd() * 60 : side === 1 ? X1 + 30 + rnd() * 60 : -100 + rnd() * 200, z = side === 2 ? ZN - 30 - rnd() * 60 : side === 3 ? ZS + 30 + rnd() * 60 : -70 + rnd() * 140;
    put(g, x, z, ['E', 'W', 'S', 'N'][side], { solid: false, s: 0.8 + rnd() * 0.6 });
  }
  { const far = D.burjTower(); put(far, 20, ZN - 150, 'S', { solid: false, s: 1.6 }); }
  for (const [x, z, s] of [[-250, 120, 1], [260, -40, 1.2], [-200, -200, 1.1], [180, 220, 1]]) put(D.sandDune(), x, z, 'S', { solid: false, s: s * 2.5 });

  // palms, lanterns
  const spots = [];
  for (const sx of [-1, 1]) for (let z = ZN + 8; z < ZS; z += 12) spots.push([sx * 13, z]);
  for (let x = X0 + 8; x < X1; x += 12) { spots.push([x, -13]); spots.push([x + 6, 13]); }
  for (let i = 0; i < 40; i++) spots.push([X0 + 6 + rnd() * (X1 - X0 - 12), ZN + 6 + rnd() * (ZS - ZN - 12)]);
  spots.filter(([x, z]) => free(x, z, 1.8, 2.5) && !(Math.abs(x) < 34 && Math.abs(z) < 34)).forEach(([x, z], i) => {
    const p = i % 7 === 0 ? D.goldPalm({ seed: i }) : D.datePalm({ seed: i }); p.position.set(x, 0, z); p.rotation.y = rnd() * 6; scene.add(p); box(x - 0.4, x + 0.4, z - 0.4, z + 0.4, 5);
  });
  for (let x = X0 + 10; x < X1; x += 22) for (const z of [-10.5, 10.5]) if (free(x, z, 0.6, 2)) { const l = D.lanternPost(); l.position.set(x, 0, z); scene.add(l); box(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 5); }

  box(X0 - 20, X0, ZN - 20, ZS + 20, 400, true); box(X1, X1 + 20, ZN - 20, ZS + 20, 400, true);
  box(X0 - 20, X1 + 20, ZN - 20, ZN, 400, true); box(X0 - 20, X1 + 20, ZS, ZS + 20, 400, true);

  const spawnPoints = [];
  for (let z = ZN + 5; z <= ZS - 4; z += 8) for (let x = X0 + 5; x <= X1 - 4; x += 8) {
    const px = x + (rnd() - 0.5) * 4, pz = z + (rnd() - 0.5) * 4;
    if (free(px, pz, 2.4) && (Math.abs(px) > 38 || Math.abs(pz) > 38)) spawnPoints.push({ x: px, z: pz });
  }
  const inside = (name, pts) => pts.map(([lx, lz, t]) => { const b = bld[name], w = toWorld(b.x, b.z, b.f, lx, lz, b.s); return { type: t, x: w.x, z: w.z }; });
  spawnPoints.push(...inside('souk', [[-14, 0], [14, 0]]).map(({ x, z }) => ({ x, z })), ...inside('mall', [[-18, 0], [18, 0]]).map(({ x, z }) => ({ x, z })));
  const P = (type, x, z) => ({ type, x, z });
  const wanted = [
    P('neo', 0, 24), P('neo', -40, 3), P('neo', 40, -3), P('neo', -30, -42), P('neo', 30, 42), P('neo', 80, 3), P('neo', -85, -4),
    P('gas', 0, -24), P('gas', 40, 22), P('gas', -40, -22), P('gas', 30, -42), P('gas', -30, 42), P('gas', 60, -4), P('gas', -80, 5),
    P('powder', 14, 12), P('powder', -14, -12), P('powder', 50, 3), P('powder', -50, -3), P('powder', 22, 48), P('powder', -22, -48), P('powder', 90, -20), P('powder', -90, 18),
    P('shot', -14, 12), P('shot', 14, -12), P('shot', 40, -30), P('shot', -40, 30), P('shot', 70, 10), P('shot', -75, -10),
    P('rockets', 24, 24), P('rockets', -24, -24), P('rockets', 60, 46), P('rockets', -60, -50),
    P('cells', 24, -24), P('cells', -24, 24), P('cells', 90, 3), P('cells', -90, -3),
    P('fuel', 0, 40), P('fuel', 0, -30), P('fuel', 70, -4),
    P('w_shotgun', 8, 22), P('w_ssg', -22, 8), P('w_chaingun', 22, -8), P('w_rocket', 0, -26), P('w_grenade', 40, 3), P('w_flamer', -40, -3), P('w_plasma', 0, 30), P('w_frost', 24, 40), P('w_rail', -24, -30), P('w_bfg', 62, -20),
    ...inside('souk', [[-14, 0, 'w_rocket'], [14, 0, 'neo'], [0, 9, 'gas'], [0, -9, 'cells']]),
    ...inside('mall', [[-18, 0, 'w_plasma'], [18, 0, 'rockets'], [0, 12, 'neo'], [0, -12, 'gas']]),
  ];
  const pickupSpawns = wanted.filter((q) => free(q.x, q.z, 1.2));
  const propSpawns = [];
  for (let i = 0; i < 34; i++) {
    const x = X0 + 8 + rnd() * (X1 - X0 - 16), z = ZN + 8 + rnd() * (ZS - ZN - 16);
    if (!free(x, z, 2.2) || (Math.abs(x) < 34 && Math.abs(z) < 34) || Math.abs(z) < 10 || Math.abs(x) < 10) continue;
    propSpawns.push({ type: i % 3 === 0 ? 'barrel' : 'crate', x, z, rot: rnd() * 3 });
  }
  const hallZone = (name, W, D2, H) => { const b = bld[name], t = -1.2, c = [[-W / 2 + t, -D2 / 2 + t], [W / 2 - t, D2 / 2 - t]].map(([lx, lz]) => toWorld(b.x, b.z, b.f, lx, lz, b.s)); return { name, x0: Math.min(c[0].x, c[1].x), x1: Math.max(c[0].x, c[1].x), z0: Math.min(c[0].z, c[1].z), z1: Math.max(c[0].z, c[1].z), top: H * b.s }; };
  const interiors = [hallZone('souk', 44.2, 28.2, 21), hallZone('mall', 54.2, 38.2, 30)];

  function update(dt, t, camPos) { sunDisc.update(camPos); sky.position.copy(camPos); }

  return {
    boxes, spawnPoints, pickupSpawns, propSpawns, update, fogColor: FOG, perches: [], interiors,
    navBounds: { x0: X0, x1: X1, z0: ZN, z1: ZS },
    healTypes: ['neo', 'gas'],
    base: { x: 0, z: 0, hp: 2500, share: 0.4, rect: baseRect, h: 90, tower },
    enemyTypes: ['grunt', 'spitter', 'drake', 'bomber', 'gargoyle', 'shield', 'goldwyrm'],
    layout: Object.entries(bld).map(([name, b]) => ({ name, x: b.x, z: b.z, f: b.f, s: b.s, w: b.g.userData.w, d: b.g.userData.d })),
    mode: 'waves', waves: [
      { grunt: 5, shield: 1 },
      { grunt: 4, spitter: 3, drake: 2, gargoyle: 2 },
      { grunt: 4, spitter: 3, shield: 3, bomber: 2, gargoyle: 2 },
      { grunt: 5, spitter: 4, drake: 3, shield: 3, bomber: 3, gargoyle: 3 },
      { goldwyrm: 1, grunt: 5, spitter: 3, drake: 2, bomber: 2, shield: 2, gargoyle: 2 },
    ],
    start: { x: 0, z: 34, yaw: 0 }, startWeapons: ['sabre', 'pistol', 'shotgun'],
    spawnRange: [28, 100], maxAlive: 14, range: 300,
    intro: 'PROTECT THE NEO NODE — KEEP ITS UPTIME ABOVE ZERO',
  };
}
