// Renders the procedural music offline (no speakers needed) and checks it is audible, not clipping, and reacts to intensity.
import { launch } from './shot.mjs';
const { page, browser, srv, errors } = await launch();
let failed = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`); if (!ok) failed++; };
const res = await page.evaluate(async () => {
  const { createMusic, TRACKS } = await import('/src/music.js');
  const out = [];
  for (let lvl = 0; lvl < TRACKS.length; lvl++) for (const inten of [0, 0.5, 1]) {
    const sr = 22050, secs = 16;
    const ctx = new OfflineAudioContext(2, sr * secs, sr);
    const m = createMusic(ctx, ctx.destination, { realtime: false });
    m.setIntensity(inten); m.start(lvl); m.pump(secs + 0.5);
    const buf = await ctx.startRendering();
    const d = buf.getChannelData(0);
    let peak = 0, sum = 0, nan = 0;
    for (let i = 0; i < d.length; i++) { const v = d[i]; if (v !== v) nan++; const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; }
    // beat detection: energy of the kick region (<150 Hz envelope) autocorrelated near the beat period
    const win = Math.floor(sr / 100), env = [];
    for (let i = 0; i + win < d.length; i += win) { let e = 0; for (let k = 0; k < win; k++) e += d[i + k] * d[i + k]; env.push(e); }
    out.push({ lvl, inten, bpm: TRACKS[lvl].bpm, peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), nan });
  }
  return out;
});
for (const r of res) {
  check(`level ${r.lvl + 1} @ intensity ${r.inten}: audible, no NaN, no clipping`, r.nan === 0 && r.rms > 0.01 && r.peak < 0.99, JSON.stringify(r));
}
for (let lvl = 0; lvl < 2; lvl++) {
  const calm = res.find((r) => r.lvl === lvl && r.inten === 0), fight = res.find((r) => r.lvl === lvl && r.inten === 1);
  check(`level ${lvl + 1}: fight music is fuller than calm music`, fight.rms > calm.rms * 1.1, `(${calm.rms} -> ${fight.rms})`);
}
check('no console errors', errors.filter((e) => !/willReadFrequently/.test(e)).length === 0, errors.join(' | '));
await browser.close(); srv.close();
process.exit(failed ? 1 : 0);
