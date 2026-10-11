import { Game } from './game.js';
import { initAudio, getAudio } from './audio.js';
import { createMusic } from './music.js';
import { WEAPONS } from './weapons.js';
import { LEVELS } from './levels.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const overlay = $('overlay');
const slots = [...document.querySelectorAll('#slots .slot')];

const game = new Game({
  canvas,
  ui: {
    hp: $('hp'), hpBar: $('hpbar'), ammo: $('ammo'), weapon: $('wname'), wave: $('wave'), msg: $('msg'), hurt: $('hurt'), slots,
    onState(s) { showOverlay(s); },
  },
});
window.__game = game; // handy for debugging and the headless smoke test
window.__weapons = WEAPONS;

let music = null;
function ensureMusic() {
  const a = getAudio();
  if (a && !music) { music = createMusic(a.ctx, a.master); window.__music = music; }
  return music;
}

const levelBox = $('levels');
function renderLevels(show) {
  levelBox.style.display = show ? 'flex' : 'none';
  levelBox.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const b = document.createElement('button');
    b.className = 'lvl' + (i === game.levelIndex ? ' cur' : '');
    b.innerHTML = `<b>${i + 1}. ${L.name}</b><small>${L.era}</small>`;
    b.addEventListener('click', (ev) => { ev.stopPropagation(); start(i); });
    levelBox.appendChild(b);
  });
}

function showOverlay(s) {
  const title = $('ov-title'), body = $('ov-body'), btn = $('ov-btn');
  overlay.style.display = s === 'playing' ? 'none' : 'flex';
  const L = LEVELS[game.levelIndex];
  renderLevels(s !== 'paused' && s !== 'playing');
  if (music) music.setMode(s === 'playing' ? 'play' : s === 'paused' ? 'pause' : s === 'won' ? 'win' : s === 'dead' ? 'dead' : 'pause');
  if (s === 'paused') { title.textContent = 'PAUSED'; body.textContent = 'Click to resume.'; btn.textContent = 'RESUME'; }
  else if (s === 'dead') { title.textContent = 'YOU DIED'; body.textContent = `Lizards slain: ${game.stats.kills}. The invaders win this round.`; btn.textContent = 'TRY AGAIN'; }
  else if (s === 'won') {
    const t = Math.round(game.stats.time);
    title.textContent = 'LEVEL CLEARED';
    body.textContent = `${L.name}: all lizards slain (${game.stats.kills}) in ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}.`;
    btn.textContent = game.nextLevel() !== null ? 'NEXT LEVEL' : 'PLAY AGAIN';
  } else { title.textContent = 'LIZARDS OVER RUS'; btn.textContent = 'PLAY'; }
}

function start(levelIndex) {
  initAudio();
  if (typeof levelIndex !== 'number') {
    levelIndex = undefined;
    if (game.state === 'won' && game.nextLevel() !== null) levelIndex = game.nextLevel();
  }
  if (levelIndex !== undefined && (levelIndex !== game.levelIndex || game.state !== 'title')) game.loadLevel(levelIndex);
  game.begin();
  const m = ensureMusic(); if (m) m.start(game.levelIndex);
  if (canvas.requestPointerLock) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* ignore */ } }
}
$('ov-btn').addEventListener('click', () => start());
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
  if (game.state === 'playing' && /^Digit[1-9]$/.test(e.code)) game.selectSlot(Number(e.code.slice(5)));
  if (game.state === 'playing' && e.code === 'KeyQ') game.cycleWeapon(-1);
  if (e.code === 'KeyM' && music) game.setMessage(music.toggleMute() ? 'MUSIC OFF' : 'MUSIC ON', 1.5);
  if ((game.state === 'dead' || game.state === 'won') && e.code === 'Enter') start();
});
window.addEventListener('keyup', (e) => game.keys.delete(e.code));
window.addEventListener('blur', () => { game.keys.clear(); game.mouseDown = false; game.pause(); });
window.addEventListener('resize', () => game.resize(canvas.clientWidth, canvas.clientHeight));

let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000; last = now;
  game.step(dt);
  if (music) music.setIntensity(game.intensity());
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
showOverlay('title');
