// Headless smoke test: boots the game, checks every weapon + combat + wave flow, saves screenshots.
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
let failed = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`); if (!ok) failed++; };

await page.evaluate(() => { window.__game.begin(); document.getElementById('overlay').style.display = 'none'; });

// --- lizards render ---
await page.evaluate(() => {
  const g = window.__game, p = g.p;
  p.x = 0; p.z = 20; p.yaw = 0; p.pitch = 0; g.wave.phase = 'idle';
  const a = g.spawnEnemy('grunt'), b = g.spawnEnemy('spitter');
  for (const [e, x, z] of [[a, -1.5, 12], [b, 2.0, 9]]) { Object.assign(e, { x, z, state: 'move', timer: 0, cool: 99 }); e.mesh.visible = true; e.shadow.visible = true; g.scene.remove(e.beam); }
  g.render();
});
await page.screenshot({ path: `${out}/lizards.png` });

// --- every weapon does something ---
const ids = await page.evaluate(() => window.__weapons.map((w) => w.id));
for (const id of ids) {
  const r = await page.evaluate((id) => {
    const g = window.__game, p = g.p, W = window.__weapons;
    g.reset(); g.setState('playing'); g.wave.phase = 'idle';
    const q = g.p;
    for (const w of W) q.has[w.id] = true;
    for (const k of Object.keys(q.ammo)) q.ammo[k] = 100;
    q.x = 0; q.z = 20; q.yaw = 0; q.pitch = 0;
    const e = g.spawnEnemy('grunt'); g.scene.remove(e.beam);
    Object.assign(e, { x: 0, z: id === 'sabre' ? 18 : 14, state: 'move', timer: 0, cool: 99, hp: 1000 }); e.mesh.visible = true;
    q.weapon = W.findIndex((w) => w.id === id); q.cd = 0; q.switching = 0;
    g.camera.rotation.set(0, 0, 0); g.camera.updateMatrixWorld(true);
    const shots0 = g.pshots.length, hp0 = e.hp;
    g.mouseDown = false;
    const ok = g.fire();
    let lastHp = e.hp;
    for (let i = 0; i < 120; i++) { if (id === 'flamer' || id === 'chaingun' || id === 'plasma') { q.cd = 0; g.fire(); } g.step(1 / 60); e.x = 0; e.z = Math.max(e.z, 13); e.state = 'move'; e.cool = 99; if (e.state === 'dying') break; }
    return { ok, dmg: hp0 - e.hp, projectiles: g.pshots.length - shots0, fx: g.fx.length };
  }, id);
  check(`weapon ${id}`, r.ok && (r.dmg > 0 || r.projectiles > 0), JSON.stringify(r));
}

// --- weapons never cover the crosshair ---
const cover = await page.evaluate(() => {
  const g = window.__game, W = window.__weapons, r = g.renderer, gl = r.getContext();
  const size = r.getSize(new g.camera.position.constructor().constructor === Object ? {} : { x: 0, y: 0, set() {} });
  const cw = r.domElement.width, ch = r.domElement.height;
  const out = {};
  for (const w of W) {
    r.setClearColor(0xff00ff, 1); r.clear();
    g.wview.update({ id: w.id, bob: 0, bobAmp: 0, flash: 0, swing: -1, shotN: 0, spin: 0, lower: 0, since: 10, firing: false });
    r.clearDepth(); r.render(g.wview.scene, g.wview.camera);
    const R = 22, buf = new Uint8Array(R * 2 * R * 2 * 4);
    gl.readPixels(Math.round(cw / 2) - R, Math.round(ch / 2) - R, R * 2, R * 2, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let n = 0; for (let i = 0; i < buf.length; i += 4) if (!(buf[i] > 240 && buf[i + 1] < 12 && buf[i + 2] > 240)) n++;
    out[w.id] = n;
  }
  r.setClearColor(0x000000, 1);
  return { out, size: [cw, ch], _: !!size };
});
for (const [id, n] of Object.entries(cover.out)) check(`crosshair clear: ${id}`, n === 0, `(${n} px)`);

// --- walls block the player ---
const r4 = await page.evaluate(() => {
  const g = window.__game; g.reset(); g.setState('playing'); const p = g.p;
  p.x = 0; p.z = 0; for (let i = 0; i < 60; i++) { p.vx = 30; g.step(1 / 60); }
  return { x: p.x };
});
check('player stays in street', Math.abs(r4.x) <= 6.45, `x=${r4.x.toFixed(2)}`);

// --- full bot run through every wave of level 1 ---
const run = await page.evaluate(() => {
  const g = window.__game, W = window.__weapons;
  g.reset(); g.setState('playing');
  const p = g.p;
  for (const w of W) p.has[w.id] = true;
  let steps = 0;
  const idx = (id) => W.findIndex((w) => w.id === id);
  while (g.state === 'playing' && steps < 60 * 400) {
    steps++;
    p.health = Math.max(p.health, 50);
    for (const k of Object.keys(p.ammo)) p.ammo[k] = Math.max(p.ammo[k], 60);
    const alive = g.enemies.filter((e) => ['move', 'attack', 'pain'].includes(e.state));
    if (alive.length) {
      alive.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      const e = alive[0], dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz);
      p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(1.2 + (e.y || 0) - 1.7, d);
      p.weapon = d < 3 ? idx('sabre') : d < 10 ? idx('ssg') : idx('chaingun');
      p.cd = Math.min(p.cd, 0.05); p.switching = 0;
      g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true);
      g.fire();
    }
    g.step(1 / 60);
  }
  return { state: g.state, steps, kills: g.stats.kills, wave: g.wave.index, left: g.enemies.filter((e) => ['spawn', 'move', 'attack', 'pain'].includes(e.state)).length };
});
check('bot clears all waves of level 1', run.state === 'won', JSON.stringify(run));

// --- level 2: bot walks the avenue, fighting each encounter, until the goal ---
const run2 = await page.evaluate(() => {
  const g = window.__game, W = window.__weapons;
  g.loadLevel(1); g.setState('playing');
  const p = g.p;
  for (const w of W) p.has[w.id] = true;
  const idx = (id) => W.findIndex((w) => w.id === id);
  let steps = 0, maxAlive = 0, lastZ = p.z;
  while (g.state === 'playing' && steps < 60 * 600) {
    steps++;
    if (steps % 90 === 0) { if (Math.abs(p.z - lastZ) < 1) p.x += (Math.random() < 0.5 ? -1 : 1) * 6; lastZ = p.z; } // sidestep a prop if stuck
    p.health = Math.max(p.health, 50);
    for (const k of Object.keys(p.ammo)) p.ammo[k] = Math.max(p.ammo[k], 60);
    const alive = g.enemies.filter((e) => ['move', 'attack', 'pain'].includes(e.state));
    maxAlive = Math.max(maxAlive, g.aliveCount());
    if (alive.length) {
      alive.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      const e = alive[0], dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz);
      p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(1.2 + (e.y || 0) - 1.7, d);
      p.weapon = d < 3 ? idx('sabre') : d < 14 ? idx('ssg') : idx('chaingun'); p.cd = Math.min(p.cd, 0.05); p.switching = 0;
      g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true);
      g.fire();
    }
    // walk down the avenue unless lizards are close
    if (!alive.some((e) => Math.hypot(e.x - p.x, e.z - p.z) < 25)) { p.z -= 7.5 / 60; if (Math.abs(p.x) > 7) p.x *= 0.97; }
    g.step(1 / 60);
  }
  return { state: g.state, steps, kills: g.stats.kills, z: +p.z.toFixed(1), maxAlive, enc: g.wave.enc, left: g.aliveCount() };
});
check('bot fights down the Soviet avenue to the goal', run2.state === 'won', JSON.stringify(run2));

// --- level 3: lizards path around whole city blocks; bot holds the Palace Square through every wave ---
const nav3 = await page.evaluate(() => {
  const g = window.__game; g.loadLevel(2); g.setState('playing'); g.wave.phase = 'idle';
  const p = g.p; p.x = -48; p.z = 40; p.health = 100;       // west street, south of the E-W street
  const e = g.spawnEnemy('grunt'); Object.assign(e, { x: 48, z: 40, state: 'move', timer: 0, cool: 99 }); e.mesh.visible = true; g.scene.remove(e.beam);
  let t = 0, close = 1e9;
  while (t < 60 * 60 && close > 3) { t++; p.health = 100; g.step(1 / 60); close = Math.hypot(e.x - p.x, e.z - p.z); }
  return { secs: +(t / 60).toFixed(1), close: +close.toFixed(1) };
});
check('lizard walks around the blocks to reach the player', nav3.close <= 3.5, JSON.stringify(nav3));
const run3 = await page.evaluate(() => {
  const g = window.__game, W = window.__weapons;
  g.loadLevel(2); g.setState('playing');
  const p = g.p;
  for (const w of W) p.has[w.id] = true;
  const idx = (id) => W.findIndex((w) => w.id === id);
  let steps = 0;
  while (g.state === 'playing' && steps < 60 * 500) {
    steps++;
    p.health = Math.max(p.health, 50);
    for (const k of Object.keys(p.ammo)) p.ammo[k] = Math.max(p.ammo[k], 60);
    const alive = g.enemies.filter((e) => ['move', 'attack', 'pain'].includes(e.state) && g.hasLOS(p.x, p.y + 1.6, p.z, e.x, 1.3 + e.y, e.z));
    if (alive.length) {
      alive.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      const e = alive[0], dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz);
      p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(1.2 + (e.y || 0) - 1.7, d);
      p.weapon = d < 3 ? idx('sabre') : d < 12 ? idx('ssg') : idx('chaingun'); p.cd = Math.min(p.cd, 0.05); p.switching = 0;
      g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true);
      g.fire();
    }
    g.step(1 / 60);
  }
  return { state: g.state, steps, kills: g.stats.kills, wave: g.wave.index, left: g.remaining() };
});
check('bot holds St. Petersburg through every wave', run3.state === 'won', JSON.stringify(run3));

// --- flying fire drake: hovers, throws fireballs, can be shot out of the air ---
const drake = await page.evaluate(() => {
  const g = window.__game; g.loadLevel(2); g.setState('playing'); g.wave.phase = 'idle';
  const p = g.p; p.x = 0; p.z = -30; p.health = 100;
  const d = g.spawnEnemy('drake'); Object.assign(d, { x: 0, z: -60, state: 'move', timer: 0, cool: 0.1 }); d.mesh.visible = true; g.scene.remove(d.beam);
  let fired = false, maxY = 0, hurt = 100;
  for (let t = 0; t < 60 * 8; t++) { g.step(1 / 60); fired = fired || g.projectiles.some((q) => q.fire); maxY = Math.max(maxY, d.y); hurt = Math.min(hurt, p.health); }
  // shoot it: aim at its body with the pistol
  p.health = 100; p.has.pistol = true; const W = window.__weapons; p.weapon = W.findIndex((w) => w.id === 'chaingun'); p.has.chaingun = true; p.ammo.bullets = 999; p.switching = 0;
  let steps = 0;
  while (d.state !== 'dying' && d.state !== 'dead' && steps++ < 60 * 12) {
    const dx = d.x - p.x, dz = d.z - p.z, dd = Math.hypot(dx, dz); p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(1.2 + d.y - 1.7, dd); p.cd = 0; p.health = 100;
    g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true); g.fire(); g.step(1 / 60);
  }
  for (let t = 0; t < 90; t++) g.step(1 / 60);
  return { fired, maxY: +maxY.toFixed(1), hurt: Math.round(hurt), state: d.state, landed: d.y < 0.05 };
});
check('fire drake hovers, throws fireballs and can be shot down', drake.fired && drake.maxY > 3 && drake.hurt < 100 && drake.state === 'dead' && drake.landed, JSON.stringify(drake));
const sty = await page.evaluate(() => {
  const g = window.__game; g.loadLevel(0); g.setState('playing'); g.wave.phase = 'idle';
  const e = g.spawnEnemy('grunt'); e.mesh.visible = true;
  const a = { st: g.lizStyle, w: e.mesh.geometry.parameters.width };
  g.setLizStyle('pixel'); const b = { pix: e.pix, w: e.mesh.geometry.parameters.width };
  g.step(1 / 60); g.setLizStyle('sprite3d'); const c = { pix: e.pix, w: e.mesh.geometry.parameters.width };
  return { a, b, c };
});
check('lizard look can be switched live (3D <-> pixel)', sty.a.w > 2.7 && sty.b.pix === true && sty.b.w < 2.5 && sty.c.pix === false && sty.c.w > 2.7, JSON.stringify(sty));

await page.evaluate(() => window.__game.render());
await page.screenshot({ path: `${out}/end-state.png` });
check('no console errors', errors.filter((e) => !/willReadFrequently|GPU stall/.test(e)).length === 0, errors.join(' | '));
await browser.close(); srv.close();
process.exit(failed ? 1 : 0);
