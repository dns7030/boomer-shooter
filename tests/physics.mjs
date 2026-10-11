// Physics checks: chain-reacting barrels, breakable crates and windows, casings, knockback, bouncing drops.
import { launch } from './shot.mjs';
const { page, browser, srv, errors } = await launch();
let failed = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`); if (!ok) failed++; };

const setup = () => page.evaluate(() => {
  const g = window.__game, W = window.__weapons;
  g.loadLevel(0); g.begin(); document.getElementById('overlay').style.display = 'none'; g.wave.phase = 'idle';
  for (const pr of [...g.props]) { g.scene.remove(pr.obj); const i = g.boxes.indexOf(pr.box); if (i >= 0) g.boxes.splice(i, 1); } g.props = [];
  const p = g.p; for (const w of W) p.has[w.id] = true; for (const k of Object.keys(p.ammo)) p.ammo[k] = 99;
  p.x = 0; p.z = 30; p.yaw = 0; p.pitch = 0;
});

// --- barrel chain reaction ---
await setup();
const chain = await page.evaluate(() => {
  const g = window.__game, W = window.__weapons, p = g.p;
  const a = g.addProp({ type: 'barrel', x: 0, z: 20 }), b = g.addProp({ type: 'barrel', x: 3, z: 20 }), c = g.addProp({ type: 'barrel', x: 6, z: 18 });
  const e = g.spawnEnemy('grunt'); g.scene.remove(e.beam); Object.assign(e, { x: 1.5, z: 17, state: 'move', timer: 0, cool: 99, hp: 400 }); e.mesh.visible = true;
  const hp0 = e.hp, x0 = e.x, z0 = e.z;
  p.yaw = 0; p.pitch = Math.atan2(0.5 - 1.7, 10); p.weapon = W.findIndex((w) => w.id === 'pistol'); p.cd = 0; g.camera.rotation.set(p.pitch, 0, 0); g.camera.updateMatrixWorld(true);
  g.fire();
  for (let i = 0; i < 120; i++) { e.cool = 99; if (e.state !== 'dying') { e.state = 'pain'; e.timer = 1; } g.step(1 / 60); }
  return { dead: [a, b, c].map((x) => x.dead), enemyDmg: hp0 - e.hp, pushed: +Math.hypot(e.x - x0, e.z - z0).toFixed(2), debris: g.debris.items.filter((d) => d.m.visible).length, scorch: g.decals.meshes.filter((m) => m.visible).length };
});
check('shooting one barrel sets off the chain (3 of 3 destroyed)', chain.dead.every(Boolean), JSON.stringify(chain.dead));
check('barrel blast hurts and pushes the lizard', chain.enemyDmg > 40 && chain.pushed > 0.5, `dmg=${chain.enemyDmg} pushed=${chain.pushed}`);
check('blast leaves debris and scorch marks', chain.debris > 5 && chain.scorch > 0, `debris=${chain.debris} marks=${chain.scorch}`);

// --- crate breaks ---
await setup();
const crate = await page.evaluate(() => {
  const g = window.__game, W = window.__weapons, p = g.p;
  const c = g.addProp({ type: 'crate', x: 0, z: 20 });
  p.weapon = W.findIndex((w) => w.id === 'shotgun'); p.cd = 0; g.camera.rotation.set(0, 0, 0); g.camera.updateMatrixWorld(true);
  let shots = 0; while (!c.dead && shots < 8) { p.cd = 0; g.fire(); g.step(0.02); shots++; }
  return { dead: c.dead, shots, boxRemoved: !g.boxes.includes(c.box), wood: g.debris.items.filter((d) => d.m.visible && d.kind === 'wood').length };
});
check('crate breaks into wood debris and stops blocking', crate.dead && crate.boxRemoved && crate.wood > 5, JSON.stringify(crate));

// --- windows shatter ---
await setup();
const win = await page.evaluate(() => {
  const g = window.__game, W = window.__weapons, p = g.p;
  const total = g.windows.length;
  const w = g.windows.find((x) => !x.broken && Math.abs(x.pos.x) < 14 && x.pos.y > 1 && x.pos.y < 3.5);
  // stand in front of a window and shoot at it
  p.x = Math.sign(w.pos.x) * 4; p.z = w.pos.z; const dx = w.pos.x - p.x, dz = w.pos.z - p.z, dy = w.pos.y - 1.7;
  p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true);
  p.weapon = W.findIndex((x) => x.id === 'pistol'); p.cd = 0; g.fire(); g.step(0.02);
  return { total, broken: w.broken, glass: g.debris.items.filter((d) => d.m.visible && d.kind === 'glass').length };
});
check('a shot shatters a window into glass shards', win.total > 10 && win.broken && win.glass > 4, JSON.stringify(win));

// --- tumbling casings ---
await setup();
const cas = await page.evaluate(() => {
  const g = window.__game, W = window.__weapons, p = g.p;
  p.weapon = W.findIndex((x) => x.id === 'chaingun'); g.camera.rotation.set(0, 0, 0); g.camera.updateMatrixWorld(true);
  for (let i = 0; i < 6; i++) { p.cd = 0; g.fire(); g.step(0.016); }
  const midair = g.debris.items.filter((d) => d.m.visible && d.kind === 'brass').length;
  for (let i = 0; i < 150; i++) g.step(1 / 60);
  const rest = g.debris.items.filter((d) => d.m.visible && d.kind === 'brass');
  return { midair, resting: rest.length, onGround: rest.every((d) => d.m.position.y < 0.05), still: rest.every((d) => Math.abs(d.vx) + Math.abs(d.vz) < 0.5) };
});
check('casings fly out, bounce and come to rest on the ground', cas.midair >= 5 && cas.resting >= 5 && cas.onGround && cas.still, JSON.stringify(cas));

// --- shotgun pushes a lizard back ---
await setup();
const push = await page.evaluate(() => {
  const g = window.__game, W = window.__weapons, p = g.p;
  const e = g.spawnEnemy('grunt'); g.scene.remove(e.beam); Object.assign(e, { x: 0, z: 26, state: 'move', timer: 0, cool: 99, hp: 900 }); e.mesh.visible = true;
  p.weapon = W.findIndex((x) => x.id === 'ssg'); p.cd = 0; g.camera.rotation.set(0, 0, 0); g.camera.updateMatrixWorld(true);
  const z0 = e.z; g.fire();
  for (let i = 0; i < 40; i++) { e.cool = 99; e.state = 'pain'; e.timer = 1; g.step(1 / 60); }
  return { moved: +(z0 - e.z).toFixed(2), pushedAway: e.z < z0 };
});
check('super shotgun blast shoves the lizard backwards', push.pushedAway && push.moved > 0.8, JSON.stringify(push));

// --- dropped pickups bounce, roll and settle ---
await setup();
const drop = await page.evaluate(() => {
  const g = window.__game;
  g.addPickup('kvass', 1, 12, true);
  const k = g.pickups[g.pickups.length - 1]; const x0 = k.x, z0 = k.z;
  let bounces = 0, lastVy = 0, maxH = 0;
  g.p.x = -30; g.p.z = 30; // stay away so it is not collected
  for (let i = 0; i < 360; i++) { g.step(1 / 60); if (lastVy < -1 && k.vy > 0) bounces++; lastVy = k.vy; maxH = Math.max(maxH, k.py); }
  return { bounces, travelled: +Math.hypot(k.x - x0, k.z - z0).toFixed(2), settled: !k.toss, y: +k.mesh.position.y.toFixed(2) };
});
check('dropped item bounces, rolls away and settles as a pickup', drop.bounces >= 1 && drop.travelled > 1 && drop.settled && drop.y > 0.6, JSON.stringify(drop));

check('no console errors', errors.filter((e) => !/willReadFrequently/.test(e)).length === 0, errors.join(' | '));
await browser.close(); srv.close();
process.exit(failed ? 1 : 0);
