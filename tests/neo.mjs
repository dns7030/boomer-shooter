// Neo game check: loads neo.html level, screenshots tower + damage stages, tests base fail.
// usage: node tests/neo.mjs <outdir> [levelIndex]
import fs from 'node:fs';
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp/neo'; const lvl = Number(process.argv[3] || 0);
fs.mkdirSync(out, { recursive: true });
const { page, browser, srv, errors } = await launch('/neo.html');
await page.evaluate((i) => { const g = window.__game; g.loadLevel(i); g.begin(); }, lvl);
await page.waitForTimeout(1500);
const info = await page.evaluate(() => { const g = window.__game; return { base: g.base && { x: g.base.x, z: g.base.z, hp: g.base.hp }, enemies: g.enemies.length, p: [g.p.x, g.p.z] }; });
console.log(JSON.stringify(info));
const shot = async (n) => page.screenshot({ path: `${out}/${n}.png` });
await page.evaluate(() => { const g = window.__game; const b = g.base; g.p.x = b.x; g.p.z = b.z + 40; g.p.yaw = 0; g.p.pitch = 0.25; g.p.hp = 9999; });
await page.waitForTimeout(500); await shot('stage0');
for (let s = 1; s <= 4; s++) {
  await page.evaluate((s) => { const g = window.__game; g.p.hp = 9999; g.damageBase(g.base.maxHp * 0.2 + 1, g.base.x, 3, g.base.z); }, s);
  await page.waitForTimeout(700); await shot('stage' + s);
}
console.log('state', await page.evaluate(() => [window.__game.state, window.__game.failReason]));
console.log('errors', errors.slice(0, 10));
await browser.close(); srv.close();
