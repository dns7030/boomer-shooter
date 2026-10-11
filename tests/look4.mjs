// Screenshot tour + collider map of level 4.  usage: node tests/look4.mjs <outdir> [view names...]
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
const err = await page.evaluate(() => { try { const g = window.__game; g.loadLevel(3); g.begin(); document.getElementById('overlay').style.display = 'none'; g.wave.phase = 'idle'; return null; } catch (e) { return String(e.stack || e); } });
if (err) { console.log('LOAD ERROR', err); await browser.close(); srv.close(); process.exit(1); }
const views = [
  ['m-start', { x: 0, z: -22, yaw: 0, pitch: 0.1 }],
  ['m-vdnkh', { x: 0, z: -45, yaw: 0, pitch: 0.12 }],
  ['m-ave', { x: -100, z: 0, yaw: -Math.PI / 2, pitch: 0.05 }],
  ['m-sis', { x: 118, z: -30, yaw: 0, pitch: 0.25 }],
  ['m-culture', { x: 0, z: 40, yaw: Math.PI, pitch: 0.2 }],
  ['m-stadium', { x: 118, z: 55, yaw: Math.PI, pitch: 0.12 }],
  ['m-nw', { x: -100, z: -20, yaw: 0.3, pitch: 0.12 }],
];
for (const [name, v] of views) {
  await page.evaluate((v) => { const g = window.__game; g.state = 'frozen'; g.p.x = v.x; g.p.z = v.z; g.p.yaw = v.yaw; g.p.pitch = v.pitch; g.render(); }, v);
  await page.screenshot({ path: `${out}/${name}.png` });
}
const map = await page.evaluate(() => {
  const g = window.__game, c = document.createElement('canvas'); c.width = 1360; c.height = 1040; const x = c.getContext('2d');
  x.fillStyle = '#222'; x.fillRect(0, 0, 1360, 1040);
  const S = 3.2, ox = 680, oy = 520;
  for (const b of g.boxes) { if (b.h < 1) continue; x.fillStyle = b.vis === false ? 'rgba(200,60,60,.35)' : b.h > 5 ? '#c9b27a' : '#6a8'; x.fillRect(ox + b.x0 * S, oy + b.z0 * S, (b.x1 - b.x0) * S, (b.z1 - b.z0) * S); }
  x.fillStyle = '#0ff'; for (const s of g.level.pickupSpawns) x.fillRect(ox + s.x * S - 2, oy + s.z * S - 2, 4, 4);
  x.fillStyle = '#ff0'; for (const s of g.level.spawnPoints) x.fillRect(ox + s.x * S - 1, oy + s.z * S - 1, 2, 2);
  x.fillStyle = '#f0f'; for (const s of g.level.perches) x.fillRect(ox + s.x * S - 3, oy + s.z * S - 3, 6, 6);
  return c.toDataURL();
});
(await import('fs')).writeFileSync(`${out}/m-map.png`, Buffer.from(map.split(',')[1], 'base64'));
console.log(errors.filter((e) => !/willReadFrequently/.test(e)).join('\n') || 'no console errors');
await browser.close(); srv.close();
