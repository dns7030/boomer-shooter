import { Game } from './game.js';
import { initAudio } from './audio.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const overlay = $('overlay');
const slots = [...document.querySelectorAll('#slots .slot')];

const game = new Game({
  canvas,
  weaponCanvas: $('weapon'),
  ui: {
    hp: $('hp'), hpBar: $('hpbar'), ammo: $('ammo'), weapon: $('wname'), wave: $('wave'), msg: $('msg'), hurt: $('hurt'), slots,
    onState(s) { showOverlay(s); },
  },
});
window.__game = game; // handy for debugging and the headless smoke test

function showOverlay(s) {
  const title = $('ov-title'), body = $('ov-body'), btn = $('ov-btn');
  overlay.style.display = s === 'playing' ? 'none' : 'flex';
  if (s === 'paused') { title.textContent = 'PAUSED'; body.textContent = 'Click to resume.'; btn.textContent = 'RESUME'; }
  else if (s === 'dead') { title.textContent = 'YOU DIED'; body.textContent = `Lizards slain: ${game.stats.kills}. The street falls to the invaders.`; btn.textContent = 'TRY AGAIN'; }
  else if (s === 'won') {
    const t = Math.round(game.stats.time);
    title.textContent = 'STREET HELD'; body.textContent = `All lizards slain (${game.stats.kills}) in ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}. The Kremlin gate stays shut — for now.`; btn.textContent = 'PLAY AGAIN';
  }
}

function start() {
  initAudio();
  game.begin();
  if (canvas.requestPointerLock) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* ignore */ } }
}
$('ov-btn').addEventListener('click', start);
overlay.addEventListener('click', (e) => { if (e.target === overlay) start(); });

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas) game.pause();
});
document.addEventListener('mousemove', (e) => {
  if (game.state !== 'playing' || document.pointerLockElement !== canvas) return;
  const p = game.p;
  p.yaw -= e.movementX * 0.0022;
  p.pitch = Math.max(-1.45, Math.min(1.45, p.pitch - e.movementY * 0.0022));
});
document.addEventListener('mousedown', (e) => { if (e.button === 0) { game.mouseDown = true; } });
document.addEventListener('mouseup', (e) => { if (e.button === 0) game.mouseDown = false; });
document.addEventListener('wheel', (e) => { if (game.state === 'playing') game.cycleWeapon(e.deltaY > 0 ? 1 : -1); }, { passive: true });
window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  game.keys.add(e.code);
  if (game.state === 'playing' && /^Digit[1-4]$/.test(e.code)) game.selectWeapon(Number(e.code.slice(5)) - 1);
  if (game.state === 'playing' && e.code === 'KeyQ') game.cycleWeapon(-1);
  if ((game.state === 'dead' || game.state === 'won') && e.code === 'Enter') start();
});
window.addEventListener('keyup', (e) => game.keys.delete(e.code));
window.addEventListener('blur', () => { game.keys.clear(); game.mouseDown = false; game.pause(); });
window.addEventListener('resize', () => game.resize(canvas.clientWidth, canvas.clientHeight));

let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000; last = now;
  game.step(dt);
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
showOverlay('title');
