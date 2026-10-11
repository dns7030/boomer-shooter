import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv } = await launch();
await page.evaluate(() => { const g = window.__game; g.begin(); document.getElementById('overlay').style.display = 'none'; g.p.unlocked = [true, true, true, true]; g.wave.phase = 'idle';
  const p = g.p; p.x = 0; p.z = 20; p.yaw = 0; p.pitch = 0; });
for (let i = 0; i < 4; i++) {
  await page.evaluate((i) => { const g = window.__game; g.state = 'playing'; g.p.weapon = i; g.p.cd = 0; g.p.flash = 0; g.p.swing = -1; g.p.ammo.powder = 100; g.p.ammo.shot = 20; g.render(); }, i);
  await page.screenshot({ path: `${out}/w${i}-idle.png`, clip: { x: 200, y: 140, width: 620, height: 400 } });
  await page.evaluate((i) => { const g = window.__game; g.fire(); if (i === 0) g.p.swing = 0.35; g.state = 'frozen'; g.render(); }, i);
  await page.screenshot({ path: `${out}/w${i}-fire.png`, clip: { x: 200, y: 140, width: 620, height: 400 } });
}
// enemy close-ups: every pose
await page.evaluate(() => { const g = window.__game, p = g.p; g.reset(); g.setState('playing'); g.wave.phase = 'idle'; const q = g.p; q.x = 0; q.z = 10; q.yaw = 0; q.pitch = 0.0;
  const poses = ['move', 'attack', 'pain', 'dying', 'dying', 'dead'];
  ['grunt', 'spitter'].forEach((t, row) => poses.forEach((s, i) => { const e = g.spawnEnemy(t); g.scene.remove(e.beam); e.mesh.visible = true; e.shadow.visible = true; e.state = s; e.cool = 99; e.x = -5 + i * 2; e.z = 6 - row * 2.2; e.anim = 1; e.deadT = i === 3 ? 0.05 : i === 4 ? 0.3 : 0.9; }));
  g.render(); });
await page.screenshot({ path: `${out}/poses.png`, clip: { x: 0, y: 150, width: 960, height: 300 } });
await browser.close(); srv.close();
