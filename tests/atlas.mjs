// Dumps the baked lizard sprite sheets to PNG files.  usage: node tests/atlas.mjs <outdir>
import fs from 'node:fs';
import { launch } from './shot.mjs';
const out = process.argv[2] || '/tmp';
const { page, browser, srv, errors } = await launch();
const res = await page.evaluate(async () => {
  const L = await import('/src/lizard3d.js');
  const g = window.__game, r = g.renderer;
  const t0 = performance.now();
  const atlases = L.renderLizardAtlases(r, ['tsar', 'sasquatch', 'goldwyrm', 'jadewyrm', 'kaiju', 'merlizard', 'carnival']);
  const ms = Math.round(performance.now() - t0);
  const W = L.FRAME * L.ANGLES, H = L.FRAME * L.POSE_COUNT, files = {};
  for (const [kind, a] of Object.entries(atlases)) {
    const buf = new Uint8Array(W * H * 4);
    r.readRenderTargetPixels(a.target, 0, 0, W, H, buf);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'), img = ctx.createImageData(W, H);
    // flip vertically (GL origin is bottom-left) and add a grey backdrop so alpha edges are visible
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const s = ((H - 1 - y) * W + x) * 4, d = (y * W + x) * 4, a = buf[s + 3] / 255;
      img.data[d] = buf[s] * a + 120 * (1 - a); img.data[d + 1] = buf[s + 1] * a + 140 * (1 - a); img.data[d + 2] = buf[s + 2] * a + 160 * (1 - a); img.data[d + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    files[kind] = c.toDataURL('image/png');
  }
  return { ms, files };
});
for (const [k, url] of Object.entries(res.files)) fs.writeFileSync(`${out}/atlas-${k}.png`, Buffer.from(url.split(',')[1], 'base64'));
console.log(`rendered in ${res.ms} ms`, errors.filter((e) => !/willReadFrequently/.test(e)).join('\n') || 'no console errors');
await browser.close(); srv.close();
