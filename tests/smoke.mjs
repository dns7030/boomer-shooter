// Headless smoke test: boots the game, checks combat + wave flow, saves screenshots.
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
let failed = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`); if (!ok) failed++; };

await page.evaluate(() => { window.__game.begin(); document.getElementById('overlay').style.display = 'none'; });

// --- lizards render + take damage ---
const r1 = await page.evaluate(() => {
  const g = window.__game, p = g.p;
  p.x = 0; p.z = 20; p.yaw = 0; p.pitch = 0; g.wave.phase = 'idle';
  const a = g.spawnEnemy('grunt'), b = g.spawnEnemy('spitter');
  Object.assign(a, { x: -1.5, z: 12, state: 'move', timer: 0, cool: 99 }); a.mesh.visible = true; a.shadow.visible = true; g.scene.remove(a.beam);
  Object.assign(b, { x: 2.0, z: 9, state: 'move', timer: 0, cool: 99 }); b.mesh.visible = true; b.shadow.visible = true; g.scene.remove(b.beam);
  g.render();
  return { hpA: a.hp, hpB: b.hp };
});
await page.screenshot({ path: `${out}/lizards.png` });

const r2 = await page.evaluate(() => {
  const g = window.__game, p = g.p;
  const e = g.enemies[0];
  // aim at grunt and fire pistol
  const aim = (e) => { const dx = e.x - p.x, dz = e.z - p.z; p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(1.3 - 1.7, Math.hypot(dx, dz)); };
  aim(e); g.render();
  p.weapon = 1; p.cd = 0; const hp0 = e.hp; g.fire();
  const afterPistol = e.hp;
  p.cd = 0; p.unlocked[2] = true; p.weapon = 2; p.cd = 0; g.fire();
  return { hp0, afterPistol, afterShotgun: e.hp, state: e.state };
});
check('pistol damages grunt', r2.afterPistol < r2.hp0, JSON.stringify(r2));
check('shotgun hurts grunt', r2.afterShotgun < r2.afterPistol);

// --- melee ---
const r3 = await page.evaluate(() => {
  const g = window.__game, p = g.p, e = g.enemies[1];
  e.x = p.x; e.z = p.z - 2; p.yaw = 0; p.weapon = 0; p.cd = 0; const hp0 = e.hp; g.fire();
  for (let i = 0; i < 20; i++) g.step(1 / 60);
  return { hp0, hp: e.hp };
});
check('sabre hits', r3.hp < r3.hp0, JSON.stringify(r3));

// --- walls block bullets & player ---
const r4 = await page.evaluate(() => {
  const g = window.__game, p = g.p;
  p.x = 0; p.z = 0; p.vx = 30; for (let i = 0; i < 60; i++) { p.vx = 30; g.step(1 / 60); }
  return { x: p.x };
});
check('player stays in street', Math.abs(r4.x) <= 6.45, `x=${r4.x.toFixed(2)}`);

// --- full bot run through all waves ---
const run = await page.evaluate(() => {
  const g = window.__game;
  g.reset(); g.setState('playing');
  const p = g.p;
  p.unlocked = [true, true, true, true]; p.ammo.powder = 150; p.ammo.shot = 40;
  const t0 = performance.now();
  let steps = 0, shotsHeld = false;
  while (g.state === 'playing' && steps < 60 * 400) {
    steps++;
    p.health = Math.max(p.health, 50); // test bot is immortal; we test flow, not balance
    p.ammo.powder = Math.max(p.ammo.powder, 40);
    const alive = g.enemies.filter((e) => ['move', 'attack', 'pain'].includes(e.state));
    if (alive.length) {
      alive.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      const e = alive[0], dx = e.x - p.x, dz = e.z - p.z;
      p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(1.2 - 1.7, Math.hypot(dx, dz));
      const d = Math.hypot(dx, dz);
      p.weapon = d < 3 ? 0 : d < 10 ? 2 : 3;
      p.cd = Math.min(p.cd, 0.05);
      g.render ? 0 : 0;
      g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true);
      g.fire();
    }
    g.step(1 / 60);
  }
  return { state: g.state, steps, kills: g.stats.kills, wave: g.wave.index, ms: Math.round(performance.now() - t0), left: g.enemies.filter((e) => ['spawn', 'move', 'attack', 'pain'].includes(e.state)).map((e) => [e.type, e.state, +e.x.toFixed(1), +e.z.toFixed(1), e.hp]), p: [+p.x.toFixed(1), +p.z.toFixed(1)] };
});
check('bot clears all 3 waves', run.state === 'won' && run.wave === 2, JSON.stringify(run));

await page.evaluate(() => window.__game.render());
await page.screenshot({ path: `${out}/end-state.png` });
check('no console errors', errors.filter((e) => !/willReadFrequently|GPU stall/.test(e)).length === 0, errors.join(' | '));
await browser.close(); srv.close();
process.exit(failed ? 1 : 0);
