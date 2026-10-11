import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp/claude-0/-home-user-sim-city/1aa86f3d-829f-562b-a291-f7c68251a109/scratchpad';
const { page, browser, srv, errors } = await launch();
await page.evaluate(() => { const g = window.__game; g.begin(); document.getElementById('overlay').style.display='none'; });
const views = [
  ['start', { x: 0, z: 34, yaw: 0 }],
  ['mid', { x: 0, z: 5, yaw: 0 }],
  ['left', { x: 0, z: 5, yaw: Math.PI / 2 }],
  ['right', { x: 0, z: -10, yaw: -Math.PI / 2 }],
  ['end', { x: 0, z: -40, yaw: 0 }],
  ['back', { x: 0, z: 20, yaw: Math.PI }],
];
for (const [name, v] of views) {
  await page.evaluate((v) => { const g = window.__game; g.p.x = v.x; g.p.z = v.z; g.p.yaw = v.yaw; g.p.pitch = 0.05; g.render(); }, v);
  await page.screenshot({ path: `${out}/${name}.png` });
}
console.log(errors.join('\n') || 'no console errors');
await browser.close(); srv.close();
