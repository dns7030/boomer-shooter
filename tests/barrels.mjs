import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
await page.evaluate(() => {
  const g = window.__game, W = window.__weapons;
  g.begin(); document.getElementById('overlay').style.display = 'none'; g.wave.phase = 'idle';
  const p = g.p; for (const w of W) p.has[w.id] = true; for (const k of Object.keys(p.ammo)) p.ammo[k] = 99;
  p.x = 0; p.z = 12; p.yaw = 0; p.pitch = Math.atan2(0.4 - 1.7, 12); g.camera.rotation.set(p.pitch, 0, 0); g.camera.updateMatrixWorld(true);
  g.state = 'frozen'; g.render();
});
await page.screenshot({ path: `${out}/barrels0.png` });
await page.evaluate(() => {
  const g = window.__game, W = window.__weapons, p = g.p;
  g.state = 'playing'; p.weapon = W.findIndex((w) => w.id === 'pistol'); p.cd = 0; g.fire();
  for (let i = 0; i < 24; i++) g.step(1 / 60);
  g.state = 'frozen'; g.render();
});
await page.screenshot({ path: `${out}/barrels1.png` });
console.log(errors.filter((e) => !/willReadFrequently/.test(e)).join('\n') || 'no console errors');
await browser.close(); srv.close();
