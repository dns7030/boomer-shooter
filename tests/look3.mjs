// Screenshot tour of level 3.  usage: node tests/look3.mjs <outdir>
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
await page.evaluate(() => { const g = window.__game; g.loadLevel(2); g.begin(); document.getElementById('overlay').style.display = 'none'; g.wave.phase = 'idle'; });
const views = [
  ['p-start', { x: 0, z: -22, yaw: 0, pitch: 0.1 }],
  ['p-sq-back', { x: 0, z: -40, yaw: Math.PI, pitch: 0.12 }],
  ['p-ns', { x: -48, z: 0, yaw: 0, pitch: 0.1 }],
  ['p-canal', { x: 41, z: 14, yaw: Math.PI + 0.55, pitch: 0.05 }],
  ['p-kazan', { x: 0, z: 10, yaw: Math.PI, pitch: 0.12 }],
  ['p-isaac', { x: 66, z: -6, yaw: -0.5, pitch: 0.2 }],
  ['p-garden', { x: -58, z: -56, yaw: Math.PI / 2, pitch: 0.05 }],
  ['p-yard', { x: 62, z: 14, yaw: -2.4, pitch: 0.1 }],
  ['p-river', { x: 0, z: -102, yaw: 0, pitch: 0.12 }],
];
for (const [name, v] of views) {
  await page.evaluate((v) => { const g = window.__game; g.state = 'frozen'; g.p.x = v.x; g.p.z = v.z; g.p.yaw = v.yaw; g.p.pitch = v.pitch; g.render(); }, v);
  await page.screenshot({ path: `${out}/${name}.png` });
}
// top-down map of colliders
const map = await page.evaluate(() => {
  const g = window.__game, c = document.createElement('canvas'); c.width = 1056; c.height = 840; const x = c.getContext('2d');
  x.fillStyle = '#222'; x.fillRect(0, 0, 1056, 840);
  const S = 4, ox = 528, oy = 424;
  for (const b of g.boxes) { if (b.h < 1) continue; x.fillStyle = b.vis === false ? 'rgba(200,60,60,.35)' : b.h > 5 ? '#c9b27a' : '#6a8'; x.fillRect(ox + b.x0 * S, oy + (b.z0 + 0) * S, (b.x1 - b.x0) * S, (b.z1 - b.z0) * S); }
  x.fillStyle = '#0ff'; for (const s of g.level.pickupSpawns) x.fillRect(ox + s.x * S - 2, oy + s.z * S - 2, 4, 4);
  x.fillStyle = '#ff0'; for (const s of g.level.spawnPoints) x.fillRect(ox + s.x * S - 1, oy + s.z * S - 1, 2, 2);
  return c.toDataURL();
});
const fs = await import('fs'); fs.writeFileSync(`${out}/p-map.png`, Buffer.from(map.split(',')[1], 'base64'));
console.log(errors.filter((e) => !/willReadFrequently/.test(e)).join('\n') || 'no console errors');
await browser.close(); srv.close();
