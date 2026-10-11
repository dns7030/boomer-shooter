// Tiny WebAudio synth. Everything is generated at runtime; no audio files.
let ctx = null, master = null, noiseBuffer = null;

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
