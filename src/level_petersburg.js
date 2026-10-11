// Level 3: Imperial St. Petersburg (1800s). Six city blocks around a street grid and a canal, with the Neva beyond.
// Same scale as the other levels. Lizards path around whole blocks (see nav.js), so you can run laps.
//
//   x -132 .. 132, z -106 .. 104.   Streets: x = -48 and x = +48 (canal in the middle of the east one), z = 0.
//   NW garden + Admiralty + Kunstkamera | Palace Square | NE St. Isaac's, Bronze Horseman, Rostral columns
//   SW Nevsky frontage                  | Kazan Cathedral and forecourt | SE ropeworks, foundry, mint, sawmill
import * as THREE from 'three';
import { mat, color, boxT } from './geo.js';
import { tex, mulberry } from './textures.js';
import * as B from './buildings3.js';
import * as L from './landmarks3.js';
import { addSun, addSunlight } from './sky.js';

const FOG = 0xc6e0f8;
const X0 = -132, X1 = 132, ZN = -106, ZS = 104;

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

export function buildPetersburg(scene) {
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 240, 1700);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0xb0b290, 1.9));
  addSunlight(scene, 2.0);
  const sunDisc = addSun(scene, 1700, 760);
  const rnd = mulberry(1703);

  const boxes = [];
  const box = (x0, x1, z0, z1, h, hidden = false) => { boxes.push({ x0, x1, z0, z1, h, ...(hidden ? { vis: false } : {}) }); };

  // ---- sky, ground, streets, squares ----
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 16), new THREE.MeshBasicMaterial({ map: tex('skyBlue'), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10; scene.add(sky);
  const lay = (name, order, x0, x1, z0, z1, tile = 5) => {
    const m = tiled(x1 - x0, z1 - z0, (x1 - x0) / tile, (z1 - z0) / tile, flat(name, order));
    m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); scene.add(m); return m;
  };
  lay('grass', -9, -900, 900, -110, 900, 8);
  lay('gravel', -8, X0, X1, ZN, ZS, 6);                       // gravel everywhere (yards, gardens)…
  for (const sx of [-48, 48]) lay('asphalt', -7, sx - 8, sx + 8, ZN, ZS);          // …streets
  lay('asphalt', -7, X0, X1, -8, 8);
  lay('paving', -6, -40, 40, -100, -8, 4);                    // Palace Square
  lay('paving', -6, -40, 40, 8, 58, 4);                       // Kazan forecourt
  lay('paving', -6, 56, 132, -100, -8, 4);                    // Isaac's square
  lay('paving', -6, X0, X1, ZN, -100, 4);                     // river promenade
  for (const sx of [-48, 48]) for (const s of [-1, 1]) lay('paving', -5, sx + s * 8 - 2 + (s > 0 ? 2 : 0) - (s > 0 ? 0 : 0), sx + s * 8 + (s > 0 ? 2 : -2) + (s > 0 ? 0 : 0), ZN, ZS, 4);
  for (const z of [-8, 8]) lay('paving', -5, X0, X1, z - (z < 0 ? 0 : -3) - 0, z + (z < 0 ? 3 : 0), 4);

  // ---- the Neva (north) and the canal (x 44..52) ----
  const waterM = flat('water', -4); waterM.map = waterM.map.clone(); waterM.map.needsUpdate = true; waterM.map.wrapS = waterM.map.wrapT = THREE.RepeatWrapping;
  const river = tiled(1400, 600, 160, 70, waterM); river.position.set(0, 0.03, ZN - 300); scene.add(river);
  const canalM = flat('water', -4); canalM.map = waterM.map;
  const canal = tiled(8, ZS - ZN, 1, (ZS - ZN) / 8, canalM); canal.position.set(48, 0.03, (ZN + ZS) / 2); scene.add(canal);
  const granite = mat('granite');
  // river parapet and canal banks
  const wallV = (x0, x1, z0, z1, h = 1.0) => { const m = boxT(x1 - x0, h, z1 - z0, granite, 3); m.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2); scene.add(m); };
  wallV(X0, X1, ZN - 0.6, ZN, 1.0);
  const bridgesZ = [-55, 0, 55], BW = 16, DRAW_Z = 28;
  const spans = []; let zc = ZN;
  for (const bz of bridgesZ) { spans.push([zc, bz - BW / 2]); zc = bz + BW / 2; }
  spans.push([zc, ZS]);
  for (const [a, b] of spans) for (const x of [44, 51.2]) {
    wallV(x, x + 0.8, a, b, 0.9);
    box(x - 0.2, x + 1.0, a, b, 1.5, true);                    // can't hop the canal (low enough to shoot over)
  }
  box(X0 - 20, X1 + 20, ZN - 3, ZN - 2, 400, true);
  // bridges + a raised drawbridge
  for (const bz of bridgesZ) { const br = L.bridge({ len: 8, w: BW }); br.position.set(48, 0, bz); scene.add(br); }
  const db = L.drawbridge({ len: 8, w: BW }); db.position.set(48, 0, DRAW_Z); scene.add(db);
  box(40, 56, DRAW_Z - BW / 2 - 0.1, DRAW_Z + BW / 2 + 0.1, 1.5, true);   // the canal is blocked here (bridge is up)
  // (the drawbridge crossing is not walkable: its span is covered by the canal colliders above)

  // ---- placement helpers ----
  // facing says where the FRONT looks: S = +z, N = -z, E = +x, W = -x
  const ROT = { S: 0, N: Math.PI, E: Math.PI / 2, W: -Math.PI / 2 };
  function put(g, x, z, f, { sx = 1, solid = true, hidden = false } = {}) {
    g.position.set(x, 0, z); g.rotation.y = ROT[f]; g.scale.x = sx; scene.add(g);
    if (!solid) return g;
    const ud = g.userData, rot = ROT[f], c = Math.cos(rot), s = Math.sin(rot);
    const rects = ud.cols ? ud.cols : [[-ud.w / 2, ud.w / 2, -ud.d / 2, ud.d / 2, ud.h]];
    for (const [a0, a1, b0, b1, h] of rects) {
      // rotate the local rect about Y (x' = x c + z s, z' = -x s + z c), take the axis-aligned bound
      const pts = [[a0 * sx, b0], [a1 * sx, b0], [a0 * sx, b1], [a1 * sx, b1]].map(([lx, lz]) => [x + lx * c + lz * s, z - lx * s + lz * c]);
      box(Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1])), h, hidden);
    }
    return g;
  }
  // a row of buildings along an edge: fronts on the baseline, stretched to fill the length
  function row(edge, from, to, face, makers) {
    const gs = makers.map((m) => m()), total = gs.reduce((a, g) => a + g.userData.w, 0), len = to - from, sx = len / total;
    let t = from;
    for (const g of gs) {
      const w = g.userData.w * sx, d = g.userData.d, cen = t + w / 2; t += w;
      const along = (face === 'N' || face === 'S');
      const off = d / 2;
      let x, z;
      if (face === 'S') { x = cen; z = edge - off; } else if (face === 'N') { x = cen; z = edge + off; }
      else if (face === 'E') { x = edge - off; z = cen; } else { x = edge + off; z = cen; }
      put(g, x, z, face, { sx });
      void along;
    }
  }

  // ---- NW: the Admiralty, the Kunstkamera and a garden ----
  const adm = B.admiralty(); put(adm, -94, ZN + 6 + 7, 'S', { sx: 0.82 });
  put(B.kunstkamera(), -94, -8 - 9, 'S');
  for (const z of [-72, -56, -40]) put(B.woodenHouse({ siding: z === -56 ? 'Green' : z === -72 ? 'Blue' : 'Yellow' }), -125, z, 'E');
  const fnt = L.fountain(); put(fnt, -84, -56, 'S');
  for (const [x, z, f] of [[-70, -40, 'W'], [-70, -70, 'W'], [-98, -48, 'E'], [-98, -64, 'E']]) put(L.bench(), x, z, f);
  put(L.teaHouse(), -112, -56, 'E');

  // ---- N-mid: Palace Square ----
  const wp = B.winterPalace(); put(wp, 0, ZN + 6 + 17 * 0.8, 'S', { sx: 0.8 });
  const gs = B.generalStaff(); {
    const k = 0.9, wing = 34 * k, gap = gs.userData.gap * k;
    gs.position.set(0, 0, -8 - 8); gs.rotation.y = Math.PI; gs.scale.set(k, 1, 1); scene.add(gs);
    for (const sd of [-1, 1]) { const cx = sd * (gap / 2 + wing / 2); box(cx - wing / 2, cx + wing / 2, -8 - 16, -8, 18); }
  }
  const col = L.alexanderColumn(); put(col, 0, -52, 'S', { solid: false }); box(-2.6, 2.6, -54.6, -49.4, 48);
  for (const [x, z, r] of [[-26, -34, 0.4], [24, -70, -0.5], [-20, -76, 2.6]]) { const c = L.carriage(); c.position.set(x, 0, z); c.rotation.y = r; scene.add(c); box(x - 1.4, x + 1.4, z - 3.2, z + 3.2, 2.2); }

  // ---- NE: St. Isaac's, the Bronze Horseman, Rostral columns ----
  put(L.isaac(), 94, -52, 'S');
  put(L.bronzeHorseman(), 70, -92, 'W');
  const rostral = [L.rostralColumn(), L.rostralColumn()];
  put(rostral[0], 96, -92, 'S'); put(rostral[1], 120, -92, 'S');
  for (const [x, z] of [[62, -20], [126, -20], [126, -60]]) put(L.bench(), x, z, 'S');

  // ---- SW: Nevsky frontage (rows of shops, hotels and a theatre) ----
  box(X0, -56, 8, ZS, 30, true);                               // block interior
  row(8, X0, -56, 'N', [() => B.hotelEurope(), () => B.townhouse({ wall: 'Pink' })]);       // along the E-W street (fronts face -z)
  row(-56, 26, ZS, 'E', [() => B.theatre(), () => B.townhouse({ wall: 'Mint' })]);          // along the west street (fronts face +x)
  for (const [x, z] of [[-52.5, 24], [-52.5, 62]]) { const t = L.cafeTable(); put(t, x - 0.4, z, 'S'); }

  // ---- S-mid: Kazan Cathedral and Gostiny Dvor ----
  put(L.kazan(), 0, 72, 'N');
  put(B.classical({ w: 40, d: 12, floors: 3, wall: 'Terra', arcade: true, roof: 'ironGreen' }), -34, 32, 'E');
  box(-40, 40, ZS - 1, ZS, 30, true);

  // ---- SE: industrial yards ----
  box(57, X1, 8, 20, 30, true);
  put(L.porcelainWorks(), 82, 8 + 8, 'N');
  put(L.mint(), 114, 8 + 12, 'N');
  put(L.ropeWalk(), 128, 58, 'W');
  put(L.arsenalFoundry(), 88, 66, 'N');
  const saw = L.windSawmill(); put(saw, 70, 92, 'N');
  put(L.shipHull(), 108, 94, 'N');

  // ---- river skyline (Peter and Paul fortress) and the city beyond the walls ----
  const fort = L.petrPavel(); fort.position.set(10, 0, ZN - 150); fort.scale.set(1.7, 1.7, 1.7); fort.rotation.y = Math.PI; scene.add(fort);
  const ring = [() => B.tenement({ w: 40 }), () => B.townhouse({ w: 30, wall: 'Cream' }), () => B.neoMansion({ w: 34, wall: 'Pink' }), () => B.tenement({ w: 44, wall: 'Ochre' }), () => B.hotelEurope()];
  const beyond = (face, edge, from, to) => {
    let t = from;
    while (t < to) {
      const g = ring[(rnd() * ring.length) | 0](), w = g.userData.w, d = g.userData.d, cen = t + w / 2; t += w + 2 + rnd() * 6;
      if (face === 'E') put(g, edge + d / 2 + 4, cen, 'W', { solid: false });
      else if (face === 'W') put(g, edge - d / 2 - 4, cen, 'E', { solid: false });
      else put(g, cen, edge + d / 2 + 4, 'N', { solid: false });
    }
  };
  beyond('E', X1, -100, 110); beyond('W', X0, -100, 110); beyond('S', ZS, X0, X1);

  // ---- confinement walls ----
  box(X0 - 20, X0, ZN - 3, ZS + 20, 400, true);
  box(X1, X1 + 20, ZN - 3, ZS + 20, 400, true);
  box(X0 - 20, X1 + 20, ZS, ZS + 20, 400, true);
  const mapN = boxes.length;
  void mapN;

  // ---- decor: trees, lamps ----
  const trees = [];
  for (let i = 0; i < 46; i++) trees.push([-124 + rnd() * 66, -84 + rnd() * 52]);                       // garden
  for (let z = 14; z < 100; z += 14) { trees.push([-37, z]); trees.push([37, z]); }                    // forecourt edges
  for (let x = -128; x < 128; x += 24) trees.push([x, -3.5 + (x % 48 ? 0 : 0)].map((v, i) => (i ? -5.6 : v)));
  const treeOK = trees.filter(([x, z]) => !boxes.some((b) => b.h > 3 && x > b.x0 - 1.2 && x < b.x1 + 1.2 && z > b.z0 - 1.2 && z < b.z1 + 1.2));
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
  for (let z = -92; z <= 98; z += 30) for (const x of [-54, -42, 42, 54]) lampSpots.push([x, z]);
  for (let x = -126; x <= 126; x += 30) for (const z of [-6.5, 6.5]) { if (x > 38 && x < 58) continue; lampSpots.push([x, z]); }
  const lamps = lampSpots.filter(([x, z]) => !boxes.some((b) => b.h > 2 && x > b.x0 - 0.3 && x < b.x1 + 0.3 && z > b.z0 - 0.3 && z < b.z1 + 0.3));
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.15, 5.5, 6), color(0x1c2420), lamps.length);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), new THREE.MeshBasicMaterial({ color: 0xfff0c0 }), lamps.length);
  lamps.forEach(([x, z], i) => {
    m4.compose(new THREE.Vector3(x, 2.75, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); poles.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, 5.9, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); heads.setMatrixAt(i, m4);
    box(x - 0.15, x + 0.15, z - 0.15, z + 0.15, 5.5);
  });
  scene.add(poles, heads);

  // ---- spawn points, pickups, props ----
  const free = (x, z, m = 2) => !boxes.some((b) => b.h > 1 && x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m);
  const spawnPoints = [];
  for (let z = -98; z <= 100; z += 9) for (let x = -128; x <= 128; x += 9) {
    const px = x + (rnd() - 0.5) * 4, pz = z + (rnd() - 0.5) * 4;
    if (free(px, pz, 2.2)) spawnPoints.push({ x: px, z: pz });
  }
  const P = (type, x, z) => ({ type, x, z });
  const wanted = [
    P('kvass', -48, -60), P('kvass', 0, -30), P('kvass', 70, -14), P('kvass', -48, 60), P('kvass', 20, 30), P('kvass', 80, 40), P('kvass', -90, -30),
    P('powder', -20, 3), P('powder', 30, -60), P('powder', -48, 20), P('powder', 100, -12), P('powder', 45, 80), P('powder', -80, -74), P('powder', 0, 40),
    P('shot', 20, -20), P('shot', -48, -85), P('shot', 60, -4), P('shot', -10, 20), P('shot', 100, 30),
    P('rockets', 0, -70), P('rockets', 60, 40), P('rockets', -48, 40), P('rockets', 110, -12),
    P('cells', 15, -50), P('cells', 48, -30), P('cells', -60, -20), P('cells', 90, 40),
    P('fuel', -30, -30), P('fuel', -48, 80), P('fuel', 100, 20),
    P('w_shotgun', 6, -30), P('w_ssg', -46, -4), P('w_chaingun', 30, -80), P('w_rocket', 46, 3), P('w_grenade', -20, 20),
    P('w_flamer', -90, -74), P('w_plasma', 100, -8), P('w_frost', -24, -40), P('w_rail', 20, 48), P('w_bfg', 100, 46),
  ];
  const pickupSpawns = wanted.filter((q) => free(q.x, q.z, 1.2));
  const propSpawns = [];
  for (const [x, z] of [[-30, -12], [14, -12], [-48, -30], [-46, 30], [-52, 72], [30, 24], [-20, 46], [20, -40], [-10, -64], [60, 3], [-60, -3], [62, 24], [100, 40], [75, 40], [100, 70], [-100, -50], [-72, -80]]) {
    if (!free(x, z, 1.4)) continue;
    propSpawns.push({ type: (x + z) % 3 === 0 ? 'barrel' : 'crate', x, z, rot: x * 0.07 });
    if ((x + z) % 2 === 0) propSpawns.push({ type: 'barrel', x: x + 1.0, z: z + 0.8 });
  }

  const perches = [[-30, 28.6, -77], [-10, 28.6, -77], [10, 28.6, -77], [30, 28.6, -77], [-22, 19.4, -24], [22, 19.4, -24], [0, 49.5, -52], [-34, 28.6, -77], [34, 28.6, -77]].map(([x, y, z]) => ({ x, y, z }));

  function update(dt, t, camPos) {
    canalM.map.offset.x = river.material.map.offset.x = (t * 0.015) % 1; river.material.map.offset.y = (t * 0.01) % 1;
    for (const r of rostral) r.userData.flame.scale.set(3 + Math.sin(t * 17) * 0.3, 4.6 + Math.sin(t * 13) * 0.4 + Math.random() * 0.2, 1);
    saw.userData.blades.rotation.z -= dt * 0.8;
    sunDisc.update(camPos);
    sky.position.copy(camPos);
  }

  return {
    boxes, spawnPoints, pickupSpawns, propSpawns, update, fogColor: FOG,
    navBounds: { x0: X0, x1: X1, z0: ZN, z1: ZS },
    enemyTypes: ['grunt', 'spitter', 'drake', 'bomber', 'gargoyle', 'shield', 'tsar'],
    // ledges where gargoyles sit like statues: Winter Palace roofline, General Staff wings, Alexander Column
    perches,
    mode: 'waves', waves: [
      { grunt: 5, shield: 1 },
      { grunt: 4, spitter: 3, drake: 2, gargoyle: 2 },
      { grunt: 4, spitter: 3, shield: 3, bomber: 2, gargoyle: 2 },
      { grunt: 5, spitter: 4, drake: 3, shield: 3, bomber: 3, gargoyle: 3 },
      { tsar: 1, grunt: 5, spitter: 3, drake: 2, bomber: 2, shield: 2, gargoyle: 2 },
    ],
    start: { x: 0, z: -22, yaw: 0 }, startWeapons: ['sabre', 'pistol', 'shotgun'],
    spawnRange: [28, 95], maxAlive: 14, range: 400,
    intro: 'ST. PETERSBURG — LAPS AROUND THE BLOCKS ARE ALLOWED',
  };
}
