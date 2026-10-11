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
  while (g.state === 'playing' && steps < 60 * 900) {
    steps++;
    p.health = Math.max(p.health, 50);
    for (const k of Object.keys(p.ammo)) p.ammo[k] = Math.max(p.ammo[k], 60);
    const alive = g.enemies.filter((e) => ['move', 'attack', 'pain', 'dive', 'perch'].includes(e.state) && g.hasLOS(p.x, p.y + 1.6, p.z, e.x, e.y + (e.cfg.hitH || 2.3) / 2, e.z));
    // shield lizards and the Tsar can only be hurt from behind: the bot "circles" them by stepping behind
    for (const e of g.enemies) if ((e.cfg.shield || e.cfg.boss) && ['move', 'attack', 'pain'].includes(e.state) && steps % 30 === 0) {
      const bx = e.x - Math.sin(e.face) * 8, bz = e.z - Math.cos(e.face) * 8;
      if (!g.boxes.some((b) => b.h > 1 && bx > b.x0 - 1 && bx < b.x1 + 1 && bz > b.z0 - 1 && bz < b.z1 + 1)) { p.x = bx; p.z = bz; }
    }
    if (alive.length) {
      alive.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      const e = alive[0], dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz);
      p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2((e.cfg.hitH || 2.3) / 2 + e.y - 1.7, d);
      p.weapon = d < 3 ? idx('sabre') : d < 12 ? idx('ssg') : idx('chaingun'); p.cd = Math.min(p.cd, 0.05); p.switching = 0;
      g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true);
      g.fire();
    }
    g.step(1 / 60);
  }
  return { state: g.state, steps, kills: g.stats.kills, wave: g.wave.index, left: g.remaining() };
});
check('bot holds St. Petersburg through every wave', run3.state === 'won', JSON.stringify(run3));

// --- the three enterable halls: walk in through the main door ---
const halls = await page.evaluate(() => {
  const g = window.__game; g.loadLevel(3); g.setState('playing'); g.wave.phase = 'idle';
  const out = {};
  for (const h of g.level.halls) {
    const p = g.p; p.x = h.from.x; p.z = h.from.z; p.y = 0; p.vx = p.vz = 0;
    for (let t = 0; t < 60 * 14; t++) { p.health = 100; const dx = h.to.x - p.x, dz = h.to.z - p.z; p.yaw = Math.atan2(-dx, -dz); p.pitch = 0; g.keys.add('KeyW'); g.keys.add('ShiftLeft'); g.step(1 / 60); if (Math.hypot(dx, dz) < 1.5) break; }
    g.keys.clear();
    out[h.name] = +Math.hypot(h.to.x - p.x, h.to.z - p.z).toFixed(1);
  }
  return out;
});
for (const [n, d] of Object.entries(halls)) check(`you can walk into the ${n} hall through its door`, d < 3, `(${d} m from the target)`);

const run4 = await page.evaluate(() => {
  const g = window.__game, W = window.__weapons;
  g.loadLevel(3); g.setState('playing');
  const p = g.p;
  for (const w of W) p.has[w.id] = true;
  const idx = (id) => W.findIndex((w) => w.id === id);
  let steps = 0;
  while (g.state === 'playing' && steps < 60 * 1100) {
    steps++;
    p.health = Math.max(p.health, 50);
    for (const k of Object.keys(p.ammo)) p.ammo[k] = Math.max(p.ammo[k], 60);
    const alive = g.enemies.filter((e) => ['move', 'attack', 'pain', 'dive', 'perch'].includes(e.state) && g.hasLOS(p.x, p.y + 1.6, p.z, e.x, e.y + (e.cfg.hitH || 2.3) / 2, e.z));
    // shield lizards and the Tsar can only be hurt from behind: the bot "circles" them by stepping behind
    for (const e of g.enemies) if ((e.cfg.shield || e.cfg.boss) && ['move', 'attack', 'pain'].includes(e.state) && steps % 30 === 0) {
      const bx = e.x - Math.sin(e.face) * 8, bz = e.z - Math.cos(e.face) * 8;
      if (!g.boxes.some((b) => b.h > 1 && bx > b.x0 - 1 && bx < b.x1 + 1 && bz > b.z0 - 1 && bz < b.z1 + 1)) { p.x = bx; p.z = bz; }
    }
    if (alive.length) {
      alive.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      const e = alive[0], dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz);
      p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2((e.cfg.hitH || 2.3) / 2 + e.y - 1.7, d);
      p.weapon = d < 3 ? idx('sabre') : d < 12 ? idx('ssg') : idx('chaingun'); p.cd = Math.min(p.cd, 0.05); p.switching = 0;
      g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true);
      g.fire();
    }
    g.step(1 / 60);
  }
  return { state: g.state, steps, kills: g.stats.kills, wave: g.wave.index, left: g.remaining() };
});
check('bot holds the Soviet metropolis through every wave (incl. the Tsar)', run4.state === 'won', JSON.stringify(run4));


// --- new enemies: shield, boss weak spot, gargoyle, egg bombs, corpse physics ---
const nw = await page.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game, out = {};
  g.loadLevel(2); g.setState('playing'); g.wave.phase = 'idle';
  const p = g.p; p.x = 0; p.z = -30; p.health = 100;
  const mk = (t, x, z, face) => { const e = g.spawnEnemy(t); Object.assign(e, { x, z, state: 'move', timer: 0, cool: 99, face, want: face }); e.mesh.visible = true; g.scene.remove(e.beam); return e; };
  const sh = mk('shield', 0, -40, 0); sh.cfg = { ...sh.cfg, speed: 0 };
  const dmg = (e, y) => { const h = e.hp; g.damageEnemy(e, 100, new THREE.Vector3(e.x, y, e.z)); return h - e.hp; };
  out.shieldFront = dmg(sh, 1.2); sh.face = Math.PI; out.shieldBack = dmg(sh, 1.2); sh.face = 0; g.freezeEnemy(sh, 15); out.shieldFrozen = dmg(sh, 1.2);
  const ts = mk('tsar', 0, -50, 0); ts.cfg = { ...ts.cfg, speed: 0 };
  out.tsarFront = dmg(ts, 3); ts.face = Math.PI; out.tsarBack = dmg(ts, 3);
  const gg = g.spawnEnemy('gargoyle'); out.perched = gg.state; Object.assign(gg, { x: -10, y: 28.6, z: -77 });
  p.x = -10; p.z = -55; for (let t = 0; t < 10; t++) g.step(1 / 60);
  out.woke = gg.state; let hurt = false; const hp = p.health;
  for (let t = 0; t < 60 * 6 && !hurt; t++) { g.step(1 / 60); if (p.health < hp) hurt = true; }
  out.gargoyleHit = hurt;
  for (const e of g.enemies) e.state = 'dead';
  p.x = 0; p.z = -30; p.health = 100;
  const bm = mk('bomber', 4, -26, 0); bm.y = 7; g.dropEgg(bm);
  let bounces = 0, exploded = false; const egg = g.eggs[0];
  for (let t = 0; t < 60 * 5 && !exploded; t++) { g.step(1 / 60); if (g.eggs.length === 0) exploded = true; else bounces = Math.max(bounces, egg.bounces); }
  out.egg = { bounces, exploded };
  g.reset(); g.setState('playing'); g.wave.phase = 'idle';
  const c = g.spawnEnemy('grunt'); Object.assign(c, { x: 0, z: -40, state: 'move', timer: 0 }); c.mesh.visible = true; g.scene.remove(c.beam);
  g.killEnemy(c); for (let t = 0; t < 120; t++) g.step(1 / 60);
  const x0 = c.x, z0 = c.z; g.explode(x0 + 1.5, 0.3, z0, 5, 100, 'boom', null);
  let maxCy = 0; for (let t = 0; t < 240; t++) { g.step(1 / 60); maxCy = Math.max(maxCy, c.cy); }
  const x1 = c.x, z1 = c.z, d = new THREE.Vector3(1, 0, 0);
  g.corpseHit(c, d, 30, new THREE.Vector3(c.x, 0.3, c.z)); for (let t = 0; t < 120; t++) g.step(1 / 60);
  out.corpse = { blast: +Math.hypot(x1 - x0, z1 - z0).toFixed(1), hop: +maxCy.toFixed(2), shot: +Math.hypot(c.x - x1, c.z - z1).toFixed(1), settled: c.cy === 0 && c.tumble === 0 };
  return out;
});
check('shield blocks hits from the front, not from behind or when frozen', nw.shieldFront < 10 && nw.shieldBack > 90 && nw.shieldFrozen > 100, JSON.stringify(nw));
check('Tsar is armoured in front, weak on the back', nw.tsarFront < 20 && nw.tsarBack > 150, JSON.stringify(nw));
check('gargoyle sits as a statue, then wakes and dives at you', nw.perched === 'perch' && nw.woke === 'dive' && nw.gargoyleHit, JSON.stringify(nw));
check('bomber egg bounces and explodes', nw.egg.bounces >= 1 && nw.egg.exploded, JSON.stringify(nw.egg));
check('corpses get flung by blasts and pushed by bullets, then settle', nw.corpse.blast > 2 && nw.corpse.hop > 0.5 && nw.corpse.shot > 0.5 && nw.corpse.settled, JSON.stringify(nw.corpse));

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

// --- lizards are solid: the player can't walk through one ---
const solid = await page.evaluate(() => {
  const g = window.__game; g.loadLevel(2); g.setState('playing'); g.wave.phase = 'idle';
  const p = g.p; p.x = 0; p.z = -30; p.yaw = Math.PI; p.pitch = 0;   // facing +z
  const e = g.spawnEnemy('grunt'); Object.assign(e, { x: 0, z: -27, state: 'move', timer: 0, cool: 99 }); e.mesh.visible = true; g.scene.remove(e.beam); e.cfg = { ...e.cfg, speed: 0 };
  for (let t = 0; t < 120; t++) { g.keys.add('KeyW'); g.step(1 / 60); e.x = 0; e.z = -27; }
  g.keys.delete('KeyW');
  return { dist: +Math.hypot(p.x - e.x, p.z - e.z).toFixed(2) };
});
check('player cannot walk through a lizard', solid.dist > 0.8, JSON.stringify(solid));

// --- frost gun: freezes a lizard solid for 15 s, then it thaws; frozen drakes drop out of the sky ---
const ice = await page.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game, W = window.__weapons;
  g.loadLevel(2); g.setState('playing'); g.wave.phase = 'idle';
  const p = g.p; p.x = 0; p.z = -30; p.yaw = 0; p.pitch = 0; p.health = 100;
  p.has.frost = true; p.ammo.cells = 100; p.weapon = W.findIndex((w) => w.id === 'frost'); p.cd = 0; p.switching = 0;
  const e = g.spawnEnemy('grunt'); Object.assign(e, { x: 0, z: -45, state: 'move', timer: 0, cool: 0.1 }); e.mesh.visible = true; g.scene.remove(e.beam);
  const d = g.spawnEnemy('drake'); Object.assign(d, { x: 6, z: -48, y: 4.2, state: 'move', timer: 0, cool: 99 }); d.mesh.visible = true; g.scene.remove(d.beam);
  g.camera.rotation.set(0, 0, 0); g.camera.updateMatrixWorld(true);
  g.fire();
  let frozenAt = null, x0 = null, moved = 0, thawAt = null, f0 = null, turned = 0;
  for (let t = 0; t < 60 * 20; t++) {
    p.health = 100; g.step(1 / 60);
    if (frozenAt === null && e.frozen > 0) { frozenAt = t / 60; x0 = [e.x, e.z]; f0 = e.face; }
    if (frozenAt !== null && e.frozen > 0 && t % 120 === 0) { g.damageEnemy(e, 1, new THREE.Vector3(e.x, 1.2, e.z), true, { x: 1, z: 0 }); g.knock(e, 1, 0, 5); }
    if (frozenAt !== null && e.frozen > 0) turned = Math.max(turned, Math.abs(e.face - f0));
    if (frozenAt !== null && e.frozen > 0) moved = Math.max(moved, Math.hypot(e.x - x0[0], e.z - x0[1]));
    if (frozenAt !== null && thawAt === null && !(e.frozen > 0)) { thawAt = t / 60; break; }
  }
  // freeze the drake directly and check it drops
  g.freezeEnemy(d, 15); for (let t = 0; t < 90; t++) g.step(1 / 60);
  return { frozenAt, turned: +turned.toFixed(3), moved: +moved.toFixed(2), frozenFor: thawAt === null ? null : +(thawAt - frozenAt).toFixed(1), drakeY: +d.y.toFixed(2), drakeFrozen: d.frozen > 0 };
});
check('frost gun freezes a lizard solid for ~15 s, then it thaws', ice.frozenAt !== null && ice.moved < 0.01 && ice.turned < 0.001 && ice.frozenFor > 14 && ice.frozenFor < 15.6, JSON.stringify(ice));
check('a frozen drake falls out of the sky and stays put', ice.drakeY < 0.1 && ice.drakeFrozen, JSON.stringify(ice));

await page.evaluate(() => window.__game.render());
await page.screenshot({ path: `${out}/end-state.png` });
check('no console errors', errors.filter((e) => !/willReadFrequently|GPU stall/.test(e)).length === 0, errors.join(' | '));
await browser.close(); srv.close();
process.exit(failed ? 1 : 0);
