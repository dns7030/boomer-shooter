// Neo: with every lizard going for the node and the player idle, the chain must eventually halt; checks all levels.
import { launch } from './shot.mjs';
const { page, browser, srv, errors } = await launch('/neo.html');
const n = await page.evaluate(() => window.__game.levels.length);
for (const i of (process.argv[2] ? [Number(process.argv[2])] : [...Array(n).keys()])) {
  const r = await page.evaluate(async (i) => {
    const g = window.__game; g.loadLevel(i); g.begin(); g.p.health = 1e9;
    for (let k = 0; k < 60 * 400 && g.state === 'playing'; k++) { for (const e of g.enemies) { e.tgt = "base"; } g.p.health = 1e9; g.step(1 / 30); }
    return { level: g.levels[i].name, state: g.state, fail: g.failReason, hp: Math.round(g.base.hp), kills: g.stats.kills, t: Math.round(g.time), pickups: g.pickups.length };
  }, i);
  console.log(JSON.stringify(r));
}
console.log('errors', errors.slice(0, 5)); await browser.close(); srv.close();
