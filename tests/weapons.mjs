// Screenshots of every first-person weapon (idle + firing) for eyeballing.  usage: node tests/weapons.mjs <outdir>
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv } = await launch();
await page.evaluate(() => {
  const g = window.__game; g.begin(); document.getElementById('overlay').style.display = 'none';
  for (const w of window.__weapons) g.p.has[w.id] = true;
  g.wave.phase = 'idle'; const p = g.p; p.x = 0; p.z = 20; p.yaw = 0; p.pitch = 0;
});
const ids = await page.evaluate(() => window.__weapons.map((w) => w.id));
for (const id of ids) {
  for (const mode of ['idle', 'fire']) {
    await page.evaluate(([id, mode]) => {
      const g = window.__game, W = window.__weapons;
      g.reset(); g.state = 'playing'; g.wave.phase = 'idle'; for (const w of W) g.p.has[w.id] = true; g.p.x = 0; g.p.z = 20; g.p.yaw = 0; g.p.pitch = 0;
      g.p.weapon = W.findIndex((w) => w.id === id); g.p.cd = 0; g.p.flash = 0; g.p.swing = -1; g.p.since = 10; g.p.firing = false;
      for (const k of Object.keys(g.p.ammo)) g.p.ammo[k] = 100;
      if (mode === 'fire') { g.fire(); if (id === 'sabre') g.p.swing = 0.4; if (id === 'flamer') g.p.firing = true; g.p.since = 0.05; }
      g.state = 'frozen'; g.render();
    }, [id, mode]);
    await page.screenshot({ path: `${out}/wp-${id}-${mode}.png`, clip: { x: 300, y: 120, width: 660, height: 420 } });
  }
}
await browser.close(); srv.close();
