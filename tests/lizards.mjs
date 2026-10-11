// Lizards at close range from different angles and in different poses.  usage: node tests/lizards.mjs <outdir>
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
await page.evaluate(() => {
  const g = window.__game;
  g.begin(); document.getElementById('overlay').style.display = 'none'; g.wave.phase = 'idle';
  for (const k of [...g.props]) { g.scene.remove(k.obj); const i = g.boxes.indexOf(k.box); if (i >= 0) g.boxes.splice(i, 1); } g.props = [];
  const p = g.p; p.x = 0; p.z = 18; p.yaw = 0; p.pitch = -0.02;
  const mk = (type, x, z, face, state, extra = {}) => { const e = g.spawnEnemy(type); g.scene.remove(e.beam); Object.assign(e, { x, z, state, timer: 0, cool: 99, face, want: face, ...extra }); e.mesh.visible = true; e.shadow.visible = true; return e; };
  // row 1: grunts at different facings
  [0, 1, 2, 3, 4].forEach((i) => mk('grunt', -4.5 + i * 2.25, 11, i * Math.PI / 2.5, 'move', { anim: i }));
  // row 2: spitters / attack / pain / dying
  mk('spitter', -4, 7, Math.PI, 'move'); mk('grunt', -2, 7, Math.PI, 'attack', { timer: 0.4 }); mk('grunt', 0, 7, Math.PI, 'attack', { timer: 0.1 });
  mk('grunt', 2, 7, Math.PI, 'pain', { timer: 1 }); mk('spitter', 4, 7, Math.PI, 'attack', { timer: 0.1 });
  [0.05, 0.15, 0.27, 0.4, 0.6].forEach((t, i) => mk('grunt', -4 + i * 2, 4, Math.PI, 'dying', { deadT: t }));
  g.camera.rotation.set(p.pitch, p.yaw, 0);
  g.step(0.001); g.state = 'frozen'; g.render();
});
await page.screenshot({ path: `${out}/lizards3d.png` });
console.log(errors.filter((e) => !/willReadFrequently/.test(e)).join('\n') || 'no console errors');
await browser.close(); srv.close();
