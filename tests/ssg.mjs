// Frames of the super shotgun reload.  usage: node tests/ssg.mjs <outdir>
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
await page.evaluate(() => {
  const g = window.__game, W = window.__weapons; g.begin(); document.getElementById('overlay').style.display = 'none';
  g.wave.phase = 'idle'; g.p.has.ssg = true; g.p.ammo.shells = 50; g.p.weapon = W.findIndex((w) => w.id === 'ssg'); g.p.x = 0; g.p.z = 20; g.p.yaw = 0; g.p.pitch = 0;
});
let i = 0;
for (const t of [10, 0.05, 0.3, 0.42, 0.62, 0.74, 0.95]) {
  await page.evaluate((t) => { const g = window.__game; g.state = 'frozen'; g.p.since = t; g.p.flash = t < 0.1 ? 1 : 0; g.render(); }, t);
  await page.screenshot({ path: `${out}/ssg${i++}.png`, clip: { x: 360, y: 200, width: 600, height: 340 } });
}
console.log(errors.filter((e) => !/willReadFrequently/.test(e)).join('\n') || 'no console errors');
await browser.close(); srv.close();
