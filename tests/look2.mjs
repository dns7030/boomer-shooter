// Screenshot tour of level 2.  usage: node tests/look2.mjs <outdir>
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
await page.evaluate(() => { const g = window.__game; g.loadLevel(1); g.begin(); document.getElementById('overlay').style.display = 'none'; g.wave.enc = 99; });
const views = [
  ['s-start', { x: 0, z: 44, yaw: 0, pitch: 0.02 }],
  ['s-left', { x: 0, z: -10, yaw: Math.PI / 2, pitch: 0.12 }],
  ['s-right', { x: 0, z: -80, yaw: -Math.PI / 2, pitch: 0.15 }],
  ['s-mid', { x: 0, z: -110, yaw: 0, pitch: 0.05 }],
  ['s-plaza', { x: 0, z: -140, yaw: 0.3, pitch: 0.05 }],
  ['s-end', { x: 0, z: -270, yaw: 0, pitch: 0.2 }],
  ['s-back', { x: 0, z: -200, yaw: Math.PI, pitch: 0.1 }],
];
for (const [name, v] of views) {
  await page.evaluate((v) => { const g = window.__game; g.state = 'frozen'; g.p.x = v.x; g.p.z = v.z; g.p.yaw = v.yaw; g.p.pitch = v.pitch; g.render(); }, v);
  await page.screenshot({ path: `${out}/${name}.png` });
}
console.log(errors.filter((e) => !/willReadFrequently/.test(e)).join('\n') || 'no console errors');
await browser.close(); srv.close();
