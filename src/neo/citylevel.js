// Data-driven Neo city level (used by Shanghai, Tokyo, Singapore, Rio). A city is a spec object:
//   id, X0,X1,ZN,ZS (play-area rectangle), sky ('skyBlue' | 'skyGrey' | a painter name from spec.painters), fog:[colour,near,far],
//   hemi:[skyColour, groundColour, intensity], sun:[intensity, colour], sunDisc (bool),
//   painters:{name:fn(g,w,h)} extra canvas textures, ground:[[tex, order, x0,x1,z0,z1, tile], ...],
//   base:{x,z}, tower: () => group,
//   buildings:[[key, () => group, x, z, facing 'N|S|E|W', scale, {size,solid}], ...]   (solid, with colliders)
//   skyline:[[() => group, x, z, facing, scale], ...]                                   (scenery beyond / far away, no colliders)
//   decor(ctx): callback to add trees, props, rails, water, hidden walls ... ctx = { scene, kit, rnd, free, box, lay, put, bld, add }
//   blocked:[[x0,x1,z0,z1], ...] invisible solid rectangles (river, sea) so nothing walks or spawns there
//   halls:[{ name, W, D, H, items:[[lx,lz,type],...] }]    enterable halls among `buildings` (zones, spawn points and pickups inside)
//   walkable(x,z) optional extra filter for spawns/pickups, bossType, start, waveBoss
import * as THREE from 'three';
import { color } from '../geo.js';
import { tex, mulberry, addPainters } from '../textures.js';
import { makeKit } from '../levelkit.js';
import { addSun, addSunlight } from '../sky.js';
import { DEMO } from '../demo.js';

// skies for the new cities (512x256, painted like skyBlue: upper 62 % is the sky, the rest is the horizon band)
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function cloudsOn(g, w, h, seed, n, alpha, tintRGB = '255,255,255') {
  const rnd = mulberry(seed);
  for (let c = 0; c < n; c++) {
    const cx = rnd() * w, cy = h * (0.08 + rnd() * 0.4), k = 6 + ((rnd() * 8) | 0);
    for (let i = 0; i < k; i++) {
      const x = cx + (rnd() - 0.5) * 70, y = cy + (rnd() - 0.5) * 12, r = 10 + rnd() * 18, rg = g.createRadialGradient(x, y, 1, x, y, r);
      rg.addColorStop(0, `rgba(${tintRGB},${alpha})`); rg.addColorStop(0.6, `rgba(${tintRGB},${alpha * 0.45})`); rg.addColorStop(1, `rgba(${tintRGB},0)`);
      g.fillStyle = rg; g.fillRect(x - r, y - r * 0.7, r * 2, r * 1.4);
    }
  }
}
addPainters({
  neo_skyDusk(g, w, h) {   // Tokyo: purple-blue dusk with a pink glow at the horizon and a few stars
    const gr = g.createLinearGradient(0, 0, 0, h * 0.62);
    gr.addColorStop(0, '#10143a'); gr.addColorStop(0.5, '#2c2a6a'); gr.addColorStop(0.85, '#7a4a8a'); gr.addColorStop(1, '#e0788a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); R(g, 0, h * 0.62, w, h, '#3a2a4a');
    const rnd = mulberry(77); for (let i = 0; i < 90; i++) R(g, rnd() * w, rnd() * h * 0.4, 1, 1, `rgba(255,255,255,${0.4 + rnd() * 0.6})`);
    cloudsOn(g, w, h, 21, 10, 0.25, '200,150,190');
  },
  neo_skyTropic(g, w, h) {   // Singapore / Rio: deep tropical blue with big bright cumulus
    const gr = g.createLinearGradient(0, 0, 0, h * 0.62);
    gr.addColorStop(0, '#0f4fb8'); gr.addColorStop(0.45, '#2f86e6'); gr.addColorStop(0.85, '#8fd0f6'); gr.addColorStop(1, '#e4f4ff');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); R(g, 0, h * 0.62, w, h, '#6a9a8a');
    cloudsOn(g, w, h, 5, 34, 0.85);
  },
  neo_skyHaze(g, w, h) {   // Shanghai: pale hazy blue-grey
    const gr = g.createLinearGradient(0, 0, 0, h * 0.62);
    gr.addColorStop(0, '#5f8fc8'); gr.addColorStop(0.5, '#9db9d6'); gr.addColorStop(1, '#dfe6ea');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); R(g, 0, h * 0.62, w, h, '#9aa8a8');
    cloudsOn(g, w, h, 9, 18, 0.5, '240,244,248');
  },
}, { neo_skyDusk: [512, 256], neo_skyTropic: [512, 256], neo_skyHaze: [512, 256] });

export function buildCity(scene, S) {
  const { X0, X1, ZN, ZS } = S, FOG = S.fog[0];
  if (S.painters) addPainters(S.painters, S.painterSizes || {});
  scene.background = new THREE.Color(DEMO ? 0xf2a8c4 : FOG);
  scene.fog = new THREE.Fog(DEMO ? 0xf2a8c4 : FOG, S.fog[1], S.fog[2]);
  scene.add(new THREE.HemisphereLight(S.hemi[0], S.hemi[1], S.hemi[2]));
  addSunlight(scene, S.sun[0], S.sun[1]);
  const sunDisc = S.sunDisc ? addSun(scene, 1700, S.sunSize || 700) : null;
  const rnd = mulberry(S.seed || 4242);
  const boxes = [];
  const kit = makeKit(scene, boxes);
  const { box, lay, put, toWorld, free } = kit;

  const sky = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 16), new THREE.MeshBasicMaterial({ map: tex(S.sky), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10; scene.add(sky);
  for (const g of S.ground) lay(...g);

  // anything of a building that dips below the ground is cut off at y = 0 (ground layers don't write depth)
  const GROUND = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)], bb = new THREE.Box3();
  const clip = (root) => {
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry) return; bb.setFromObject(o);
      if (bb.min.y < -0.05) { const arr = Array.isArray(o.material) ? o.material : [o.material]; const out = arr.map((m) => { const c = m.clone(); c.clippingPlanes = GROUND; return c; }); o.material = Array.isArray(o.material) ? out : out[0]; }
    });
  };

  // ---- the Neo tower ----
  const B = S.base, tower = S.tower();
  put(tower, B.x, B.z, B.f || 'S', {});
  const tr = tower.userData.rect;
  const baseRect = { x0: B.x - tr.w / 2, x1: B.x + tr.w / 2, z0: B.z - tr.d / 2, z1: B.z + tr.d / 2 };

  const bld = {};
  const add = (name, g, x, z, f, o = {}) => { put(g, x, z, f, o); if (S.clip !== false) clip(g); bld[name] = { g, x, z, f, s: o.s || 1 }; return g; };
  for (const [key, fn, x, z, f, s, o] of S.buildings) add(key, fn(), x, z, f, { s: s || 1, ...(o || {}) });
  for (const [fn, x, z, f, s] of S.skyline || []) { const g = fn(); put(g, x, z, f, { solid: false, s: s || 1 }); if (S.clip !== false) clip(g); }

  const ctx = { scene, kit, rnd, free, box, lay, put, bld, add, clip, toWorld, tower, base: B };
  if (S.decor) S.decor(ctx);
  for (const [x0, x1, z0, z1] of S.blocked || []) box(x0, x1, z0, z1, 400, true);
  box(X0 - 20, X0, ZN - 20, ZS + 20, 400, true); box(X1, X1 + 20, ZN - 20, ZS + 20, 400, true);
  box(X0 - 20, X1 + 20, ZN - 20, ZN, 400, true); box(X0 - 20, X1 + 20, ZS, ZS + 20, 400, true);

  // ---- spawn points, pickups, props ----
  const walk = (x, z) => x > X0 + 2 && x < X1 - 2 && z > ZN + 2 && z < ZS - 2 && (!S.walkable || S.walkable(x, z));
  const farFromBase = (x, z, d) => Math.hypot(x - B.x, z - B.z) > d;
  const spawnPoints = [];
  for (let z = ZN + 5; z <= ZS - 4; z += 8) for (let x = X0 + 5; x <= X1 - 4; x += 8) {
    const px = x + (rnd() - 0.5) * 4, pz = z + (rnd() - 0.5) * 4;
    if (walk(px, pz) && free(px, pz, 2.4) && farFromBase(px, pz, 40)) spawnPoints.push({ x: px, z: pz });
  }
  const inside = (name, pts) => pts.map(([lx, lz, t]) => { const b = bld[name], w = toWorld(b.x, b.z, b.f, lx, lz, b.s); return { type: t, x: w.x, z: w.z }; });
  for (const h of S.halls || []) spawnPoints.push(...inside(h.name, h.items.slice(0, 2).map(([a, b]) => [a, b])).map(({ x, z }) => ({ x, z })));

  let pickups = [];
  const quota = S.quota || { w_shotgun: 1, w_ssg: 1, w_chaingun: 1, w_rocket: 1, w_grenade: 1, w_flamer: 1, w_plasma: 1, w_frost: 1, w_rail: 1, w_bfg: 1, neo: 7, gas: 7, powder: 8, shot: 6, rockets: 4, cells: 4, fuel: 3 };
  const place = (type, rMin, rMax, tries = 80) => {
    for (let k = 0; k < tries; k++) {
      const a = rnd() * 6.283, r = rMin + rnd() * (rMax - rMin), x = B.x + Math.cos(a) * r, z = B.z + Math.sin(a) * r;
      if (walk(x, z) && free(x, z, 1.6)) { if (!pickups.some((p) => Math.hypot(p.x - x, p.z - z) < 4)) { pickups.push({ type, x, z }); return; } }
    }
  };
  for (const [type, n] of Object.entries(quota)) for (let i = 0; i < n; i++) place(type, type.startsWith('w_') ? 14 : 14, type.startsWith('w_') ? 50 : 85);   // weapons close together, near the tower
  for (const h of S.halls || []) pickups.push(...inside(h.name, h.items));
  if (S.extraPickups) pickups.push(...S.extraPickups);
  const pickupSpawns = pickups.filter((q) => free(q.x, q.z, 1.0));

  const propSpawns = [];
  for (let i = 0; i < 40; i++) {
    const x = X0 + 8 + rnd() * (X1 - X0 - 16), z = ZN + 8 + rnd() * (ZS - ZN - 16);
    if (!walk(x, z) || !free(x, z, 2.2) || !farFromBase(x, z, 26)) continue;
    propSpawns.push({ type: i % 3 === 0 ? 'barrel' : 'crate', x, z, rot: rnd() * 3 });
  }
  const hallZone = (h) => { const b = bld[h.name], t = -1.2, c = [[-h.W / 2 + t, -h.D / 2 + t], [h.W / 2 - t, h.D / 2 - t]].map(([lx, lz]) => toWorld(b.x, b.z, b.f, lx, lz, b.s)); return { name: h.name, x0: Math.min(c[0].x, c[1].x), x1: Math.max(c[0].x, c[1].x), z0: Math.min(c[0].z, c[1].z), z1: Math.max(c[0].z, c[1].z), top: h.H * b.s }; };
  const interiors = (S.halls || []).map(hallZone);

  function update(dt, t, camPos) { if (sunDisc) sunDisc.update(camPos); sky.position.copy(camPos); if (S.update) S.update(dt, t, camPos); }

  const boss = S.bossType;
  return {
    boxes, spawnPoints, pickupSpawns, propSpawns, update, fogColor: FOG, perches: [], interiors,
    navBounds: { x0: X0, x1: X1, z0: ZN, z1: ZS },
    healTypes: ['neo', 'gas'],
    base: { x: B.x, z: B.z, hp: 2500, share: 0.4, rect: baseRect, h: tower.userData.h, tower },
    enemyTypes: ['grunt', 'spitter', 'drake', 'bomber', 'gargoyle', 'shield', boss],
    layout: Object.entries(bld).map(([name, b]) => ({ name, x: b.x, z: b.z, f: b.f, s: b.s, w: b.g.userData.w, d: b.g.userData.d })),
    mode: 'waves', waves: [
      { grunt: 5, shield: 1 },
      { grunt: 4, spitter: 3, drake: 2, gargoyle: 2 },
      { grunt: 4, spitter: 3, shield: 3, bomber: 2, gargoyle: 2 },
      { grunt: 5, spitter: 4, drake: 3, shield: 3, bomber: 3, gargoyle: 3 },
      { [boss]: 1, grunt: 5, spitter: 3, drake: 2, bomber: 2, shield: 2, gargoyle: 2 },
    ],
    start: S.start || { x: B.x, z: B.z + 34, yaw: 0 }, startWeapons: ['sabre', 'pistol', 'shotgun'],
    spawnRange: [28, 100], maxAlive: 14, range: 300,
    intro: 'PROTECT NEO — KEEP ITS BLOCKCHAIN HEALTH ABOVE ZERO',
  };
}
