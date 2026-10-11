// Visual check of impacts, explosions and decals.  usage: node tests/fx.mjs <outdir>
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
await page.evaluate(() => {
  const g = window.__game, W = window.__weapons;
  g.begin(); document.getElementById('overlay').style.display = 'none'; g.wave.phase = 'idle';
  const p = g.p; for (const w of W) p.has[w.id] = true; for (const k of Object.keys(p.ammo)) p.ammo[k] = 99;
  p.x = 0; p.z = 14; p.yaw = Math.PI / 2 - 0.35; p.pitch = -0.05;      // face the left-hand building wall
  g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true);
  // spray a wall with the chaingun, then a rocket
  p.weapon = W.findIndex((w) => w.id === 'chaingun');
  for (let i = 0; i < 14; i++) { p.cd = 0; p.yaw = Math.PI / 2 - 0.35 + (Math.random() - 0.5) * 0.12; p.pitch = -0.05 + (Math.random() - 0.5) * 0.08; g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true); g.fire(); g.step(0.016); }
  p.weapon = W.findIndex((w) => w.id === 'rocket'); p.cd = 0; p.yaw = Math.PI / 2 + 0.25; p.pitch = 0; g.camera.rotation.set(0, p.yaw, 0); g.camera.updateMatrixWorld(true); g.fire();
  for (let i = 0; i < 14; i++) g.step(0.016);
  // a few lizards to splatter
  for (const [x, z] of [[-3, 6], [1, 4]]) { const e = g.spawnEnemy('grunt'); g.scene.remove(e.beam); Object.assign(e, { x, z, state: 'move', timer: 0, cool: 99, hp: 5 }); e.mesh.visible = true; e.shadow.visible = true; }
  p.yaw = 0.05; p.pitch = -0.15; g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true);
  p.weapon = W.findIndex((w) => w.id === 'ssg'); p.cd = 0; g.fire();
  for (let i = 0; i < 6; i++) g.step(0.016);
  p.weapon = W.findIndex((w) => w.id === 'pistol'); p.yaw = Math.PI / 2 + 0.25; p.pitch = -0.1; g.camera.rotation.set(p.pitch, p.yaw, 0); g.camera.updateMatrixWorld(true);
  g.state = 'frozen'; g.render();
});
await page.screenshot({ path: `${out}/fx1.png` });
await page.evaluate(() => {
  const g = window.__game, p = g.p; p.yaw = 0.05; p.pitch = -0.35; g.render();
});
await page.screenshot({ path: `${out}/fx2.png` });
console.log(errors.filter((e) => !/willReadFrequently/.test(e)).join('\n') || 'no console errors');
await browser.close(); srv.close();
