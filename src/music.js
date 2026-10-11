// Procedural techno, generated live with WebAudio (no audio files).
// Layers (kick, hats, clap, bass, arp, pad, stab) fade in and out with the fight "intensity".
// Friendly rather than aggressive: soft filtered synths, no distortion, gentle compression.

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ramp = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));

// One config per level: tempo, key, chord progression (semitones from root + quality), pattern seed.
export const TRACKS = [
  { name: 'Sunny Rush', bpm: 122, root: 45, seed: 11, prog: [[0, 'm'], [-4, 'M'], [3, 'M'], [-2, 'M']] },   // A: Am F C G
  { name: 'Avenue Groove', bpm: 126, root: 50, seed: 29, prog: [[0, 'm'], [-2, 'M'], [-4, 'M'], [-2, 'M']] }, // D: Dm C Bb C
];
const TRIAD = { m: [0, 3, 7], M: [0, 4, 7] };

function makePatterns(seed) {
  const r = rng(seed), bass = [], arp = [], stab = [];
  for (let v = 0; v < 4; v++) {
    const b = new Array(16).fill(null), a = new Array(16).fill(null), s = new Array(16).fill(null);
    for (const st of [2, 6, 10, 14]) b[st] = 0;                    // classic off-beat bass
    if (v % 2) { b[7] = 7; b[15] = 12; } else { b[11] = 7; if (r() < 0.6) b[3] = 12; }
    if (v === 3) b[13] = 5;
    let k = v;
    for (let st = 0; st < 16; st++) {
      const strong = st % 2 === 0, p = strong ? 0.8 : 0.42;
      if (r() < p) { a[st] = (k % 6); k += 1 + ((r() * 2) | 0); }
    }
    a[0] = 0;
    for (const st of [3, 6, 10, 13]) if (r() < 0.55) s[st] = 1;
    bass.push(b); arp.push(a); stab.push(s);
  }
  return { bass, arp, stab };
}

export function createMusic(ctx, dest, { realtime = true } = {}) {
  const bus = ctx.createGain(); bus.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.2;
  bus.connect(comp); comp.connect(dest);

  const L = {};
  for (const n of ['kick', 'hat', 'clap', 'bass', 'arp', 'pad', 'stab']) { L[n] = ctx.createGain(); L[n].gain.value = 0; L[n].connect(bus); }
  const padDuck = ctx.createGain(); padDuck.connect(L.pad);        // sidechain-style pumping on the pad
  // echo for the arp / stab
  const send = ctx.createGain(); send.gain.value = 0.5;
  const delay = ctx.createDelay(2), fb = ctx.createGain(), dl = ctx.createBiquadFilter(), wet = ctx.createGain();
  fb.gain.value = 0.3; dl.type = 'lowpass'; dl.frequency.value = 2400; wet.gain.value = 0.4;
  send.connect(delay); delay.connect(dl); dl.connect(fb); fb.connect(delay); dl.connect(wet); wet.connect(bus);

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  { const d = noiseBuf.getChannelData(0), r = rng(7); for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; }

  // ---------- instruments ----------
  function kick(t, v = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g); g.connect(L.kick); o.start(t); o.stop(t + 0.36);
  }
  function noiseHit(t, dur, freq, type, vel, out, q = 0.7) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  const hat = (t, open, v) => noiseHit(t, open ? 0.16 : 0.045, 7500, 'highpass', v * (open ? 0.5 : 0.4), L.hat);
  function clap(t) { for (let i = 0; i < 3; i++) noiseHit(t + i * 0.011, i === 2 ? 0.14 : 0.03, 1700, 'bandpass', 0.55, L.clap, 1.2); }
  function bassNote(t, midi, dur) {
    const o = ctx.createOscillator(), sub = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; sub.type = 'sine';
    o.frequency.value = mtof(midi); sub.frequency.value = mtof(midi - 12);
    f.type = 'lowpass'; f.Q.value = 4; f.frequency.setValueAtTime(140, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.03); f.frequency.exponentialRampToValueAtTime(220, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); sub.connect(f); f.connect(g); g.connect(L.bass); o.start(t); sub.start(t); o.stop(t + dur + 0.02); sub.stop(t + dur + 0.02);
  }
  function pluck(t, midi, dur, out, peak, cutoff) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = mtof(midi); o2.frequency.value = mtof(midi) * 1.004;
    f.type = 'lowpass'; f.Q.value = 3; f.frequency.setValueAtTime(cutoff, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(out); g.connect(send);
    o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
  }
  function padChord(t, midis, dur) {
    for (const m of midis) for (const det of [-7, 0, 7]) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
      f.type = 'lowpass'; f.frequency.value = 850; f.Q.value = 0.5;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.35); g.gain.setValueAtTime(0.05, t + dur - 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(padDuck); o.start(t); o.stop(t + dur + 0.02);
    }
  }

  // ---------- sequencer ----------
  let track = TRACKS[0], pat = makePatterns(track.seed), step = 0, nextT = 0, timer = null, running = false;
  let intensity = 0, smooth = 0, muted = false, mode = 'play', levelIdx = -1;

  function applyLayers(now) {
    const i = smooth;
    const tg = {
      kick: 0.5 + 0.25 * i, hat: ramp(i, 0.1, 0.35) * 0.55, clap: ramp(i, 0.3, 0.55) * 0.6,
      bass: 0.18 + ramp(i, 0.2, 0.45) * 0.55, arp: 0.3 + ramp(i, 0.35, 0.8) * 0.3, pad: 0.55 - 0.2 * i, stab: ramp(i, 0.65, 0.9) * 0.5,
    };
    for (const k of Object.keys(tg)) L[k].gain.setTargetAtTime(tg[k], now, 0.35);
  }
  function busLevel() {
    if (muted) return 0;
    return mode === 'play' ? 0.3 : mode === 'pause' ? 0.08 : mode === 'win' ? 0.2 : 0;
  }

  function scheduleStep(s, bar, t) {
    const sixteenth = 60 / track.bpm / 4, i = smooth;
    const [off, q] = track.prog[bar % track.prog.length], root = track.root + off, v = (bar >> 2) % 4, tones = TRIAD[q];
    if (s % 4 === 0) {
      kick(t, 1);
      padDuck.gain.setValueAtTime(0.35, t); padDuck.gain.linearRampToValueAtTime(1, t + 0.24);
    }
    if (i > 0.08) hat(t, s % 4 === 2, s % 2 ? 0.55 : 0.8);
    if (i > 0.28 && (s === 4 || s === 12)) clap(t);
    const b = pat.bass[v][s];
    if (b !== null) bassNote(t, root - 12 + b, sixteenth * 1.6);
    const a = pat.arp[v][s];
    if (a !== null && (i > 0.3 || s % 4 === 0 || s === 6 || s === 14)) {
      const oct = a >= tones.length ? 12 : 0, n = tones[a % tones.length];
      pluck(t, root + 12 + n + oct + (i > 0.8 && a % 2 ? 12 : 0), sixteenth * 1.5, L.arp, 0.22, 3200 + 1800 * i);
    }
    if (i > 0.6 && pat.stab[v][s]) for (const n of tones) pluck(t, root + 24 + n, sixteenth * 0.9, L.stab, 0.07, 3000);
    if (s === 0) padChord(t, [root + 12, root + 12 + tones[1], root + 12 + tones[2], root + 24], sixteenth * 16);
  }

  function pump(until) {
    if (!running) return;
    const sixteenth = 60 / track.bpm / 4;
    while (nextT < until) {
      scheduleStep(step % 16, Math.floor(step / 16), nextT);
      step++; nextT += sixteenth;
    }
  }

  const api = {
    get name() { return track.name; },
    get running() { return running; },
    start(level = 0) {
      const now = ctx.currentTime;
      if (running && level === levelIdx) { mode = 'play'; bus.gain.setTargetAtTime(busLevel(), now, 0.3); return; }
      levelIdx = level; track = TRACKS[level % TRACKS.length]; pat = makePatterns(track.seed);
      step = 0; nextT = now + 0.08; running = true; mode = 'play'; smooth = intensity;
      applyLayers(now); bus.gain.setTargetAtTime(busLevel(), now, 0.3);
      if (realtime && !timer) timer = setInterval(() => { smooth += (intensity - smooth) * 0.12; applyLayers(ctx.currentTime); pump(ctx.currentTime + 0.18); }, 25);
    },
    pump,
    stop() { running = false; if (timer) { clearInterval(timer); timer = null; } bus.gain.setTargetAtTime(0, ctx.currentTime, 0.2); },
    setIntensity(v) { intensity = Math.min(1, Math.max(0, v)); if (!realtime) smooth = intensity; },
    setMode(m) { mode = m; bus.gain.setTargetAtTime(busLevel(), ctx.currentTime, m === 'dead' ? 0.8 : 0.25); },
    toggleMute() { muted = !muted; bus.gain.setTargetAtTime(busLevel(), ctx.currentTime, 0.15); return muted; },
  };
  return api;
}
