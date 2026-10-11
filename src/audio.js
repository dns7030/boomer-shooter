// Tiny WebAudio synth. Everything is generated at runtime; no audio files.
let ctx = null, master = null, noiseBuffer = null;

export function getAudio() { return ctx ? { ctx, master } : null; }

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  startAmbient();
}

function tone({ type = 'square', f0 = 440, f1 = null, dur = 0.2, gain = 0.3, delay = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise({ dur = 0.2, gain = 0.4, f0 = 2000, f1 = 500, q = 1, type = 'lowpass', delay = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource(); s.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.02);
}

function startAmbient() {
  const s = ctx.createBufferSource(); s.buffer = noiseBuffer; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
  const g = ctx.createGain(); g.gain.value = 0.05;
  s.connect(f); f.connect(g); g.connect(master); s.start();
  const bell = () => {
    [523, 1046, 1568].forEach((fr, i) => tone({ type: 'sine', f0: fr, dur: 3.2 - i, gain: 0.05 / (i + 1) }));
  };
  setInterval(bell, 17000);
  setTimeout(bell, 4000);
}

export const sfx = {
  pistol() { noise({ dur: 0.2, gain: 0.55, f0: 3200, f1: 400 }); tone({ f0: 190, f1: 55, dur: 0.14, gain: 0.3 }); },
  shotgun() { this.blunder(); },
  ssg() { noise({ dur: 0.6, gain: 1.0, f0: 2600, f1: 90 }); noise({ dur: 0.45, gain: 0.7, f0: 1800, f1: 120, delay: 0.07 }); tone({ type: 'sawtooth', f0: 80, f1: 28, dur: 0.5, gain: 0.6 }); },
  chaingun() { this.skor(); },
  tink(v = 2) { tone({ type: 'triangle', f0: 3600 + Math.random() * 1400, f1: 2400, dur: 0.05, gain: Math.min(0.12, 0.03 * v) }); },
  glass() { noise({ dur: 0.35, gain: 0.5, f0: 9000, f1: 3000, type: 'highpass' }); tone({ type: 'triangle', f0: 4200, f1: 2600, dur: 0.12, gain: 0.12 }); },
  crate() { noise({ dur: 0.18, gain: 0.55, f0: 1400, f1: 300, type: 'bandpass', q: 1 }); tone({ type: 'square', f0: 140, f1: 60, dur: 0.12, gain: 0.25 }); },
  ssgOpen() { noise({ dur: 0.1, gain: 0.45, f0: 2500, f1: 500, type: 'bandpass', q: 2 }); tone({ type: 'square', f0: 320, f1: 160, dur: 0.07, gain: 0.18 }); },
  shellIn() { noise({ dur: 0.05, gain: 0.3, f0: 3500, f1: 1500, type: 'bandpass', q: 3 }); tone({ type: 'triangle', f0: 1000, f1: 600, dur: 0.05, gain: 0.2 }); },
  ssgClose() { noise({ dur: 0.12, gain: 0.55, f0: 1800, f1: 300 }); tone({ type: 'square', f0: 200, f1: 70, dur: 0.1, gain: 0.3 }); },
  rocket() { noise({ dur: 0.6, gain: 0.5, f0: 400, f1: 3000, type: 'bandpass', q: 1.5 }); tone({ type: 'sawtooth', f0: 120, f1: 40, dur: 0.4, gain: 0.4 }); },
  grenade() { tone({ type: 'sine', f0: 160, f1: 50, dur: 0.18, gain: 0.5 }); noise({ dur: 0.15, gain: 0.35, f0: 1400, f1: 200 }); },
  explosion() { noise({ dur: 1.0, gain: 1.0, f0: 1600, f1: 60 }); tone({ type: 'sine', f0: 90, f1: 22, dur: 0.9, gain: 0.8 }); noise({ dur: 0.5, gain: 0.5, f0: 6000, f1: 800, type: 'highpass', delay: 0.02 }); },
  plasma() { tone({ type: 'sawtooth', f0: 1400, f1: 300, dur: 0.1, gain: 0.16 }); tone({ type: 'square', f0: 700, f1: 180, dur: 0.08, gain: 0.08 }); },
  flame() { noise({ dur: 0.12, gain: 0.35, f0: 900, f1: 400, type: 'bandpass', q: 0.8 }); },
  rail() { tone({ type: 'sine', f0: 2400, f1: 120, dur: 0.5, gain: 0.35 }); noise({ dur: 0.3, gain: 0.4, f0: 5000, f1: 300 }); },
  bfg() { tone({ type: 'sawtooth', f0: 90, f1: 700, dur: 0.6, gain: 0.4 }); tone({ type: 'sine', f0: 60, f1: 30, dur: 1.0, gain: 0.6 }); noise({ dur: 0.8, gain: 0.5, f0: 400, f1: 3000, type: 'bandpass', q: 1 }); },
  blunder() { noise({ dur: 0.5, gain: 0.9, f0: 2600, f1: 120 }); tone({ type: 'sawtooth', f0: 100, f1: 35, dur: 0.35, gain: 0.5 }); },
  skor() { noise({ dur: 0.09, gain: 0.5, f0: 3000, f1: 700 }); tone({ f0: 240, f1: 90, dur: 0.07, gain: 0.2 }); },
  sabre() { noise({ dur: 0.28, gain: 0.35, f0: 600, f1: 5000, type: 'bandpass', q: 2 }); },
  hit() { tone({ type: 'sine', f0: 140, f1: 50, dur: 0.12, gain: 0.35 }); noise({ dur: 0.1, gain: 0.25, f0: 1200, f1: 300 }); },
  lizardPain() { tone({ type: 'sawtooth', f0: 520, f1: 260, dur: 0.18, gain: 0.12 }); },
  lizardDie() { tone({ type: 'sawtooth', f0: 420, f1: 60, dur: 0.6, gain: 0.2 }); noise({ dur: 0.5, gain: 0.25, f0: 4000, f1: 300, type: 'highpass' }); },
  hiss() { noise({ dur: 0.35, gain: 0.22, f0: 6000, f1: 3000, type: 'highpass' }); },
  spit() { tone({ type: 'sawtooth', f0: 220, f1: 900, dur: 0.22, gain: 0.18 }); noise({ dur: 0.2, gain: 0.15, f0: 3000, f1: 1000, type: 'bandpass', q: 3 }); },
  plasmaHit() { noise({ dur: 0.25, gain: 0.3, f0: 2500, f1: 200 }); },
  hurt() { tone({ type: 'sine', f0: 200, f1: 80, dur: 0.25, gain: 0.45 }); noise({ dur: 0.2, gain: 0.3, f0: 900, f1: 200 }); },
  pickup() { [660, 880, 1320].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.12, gain: 0.2, delay: i * 0.07 })); },
  empty() { tone({ type: 'square', f0: 120, f1: 90, dur: 0.05, gain: 0.15 }); },
  beam() { tone({ type: 'sine', f0: 200, f1: 1400, dur: 0.8, gain: 0.12 }); },
  wave() { [392, 523, 659].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.35, gain: 0.22, delay: i * 0.15 })); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.6, gain: 0.25, delay: i * 0.18 })); },
};
