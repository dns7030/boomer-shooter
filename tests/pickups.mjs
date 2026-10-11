// Row of every pickup in the world.  usage: node tests/pickups.mjs <outdir>
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
await page.evaluate(() => {
  const g = window.__game; g.begin(); document.getElementById('overlay').style.display = 'none'; g.wave.phase = 'idle';
  for (const k of [...g.pickups]) g.scene.remove(k.mesh); g.pickups = [];
  const ids = ['shotgun', 'ssg', 'chaingun', 'rocket', 'grenade', 'plasma', 'flamer', 'rail', 'bfg'];
  ids.forEach((id, i) => g.addPickup('w_' + id, -4.2 + (i % 3) * 4.2, 24 - Math.floor(i / 3) * 4.5));
  ['kvass', 'powder', 'shot', 'rockets', 'cells', 'fuel'].forEach((t, i) => g.addPickup(t, -3 + i * 1.2, 15));
  const p = g.p; p.x = 0; p.z = 28; p.yaw = 0; p.pitch = -0.3; g.state = 'frozen'; g.render();
});
await page.screenshot({ path: `${out}/pickups.png` });
console.log(errors.filter((e) => !/willReadFrequently/.test(e)).join('\n') || 'no console errors');
await browser.close(); srv.close();
