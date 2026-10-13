import { Game } from './game.js';
import { initAudio, getAudio } from './audio.js';
import { createMusic } from './music.js';
import { WEAPONS } from './weapons.js';
import { LEVELS as DEFAULT_LEVELS } from './levels.js';
import { createProfile, scoreOf } from './profile.js';
import { BUILD } from './version.js';

const CFG = window.GAME_CONFIG || {};
const LEVELS = CFG.levels || DEFAULT_LEVELS;

const $ = (id) => document.getElementById(id);
const profile = createProfile(CFG.profileKey || 'rus');
const canvas = $('view');
const overlay = $('overlay');
const slots = [...document.querySelectorAll('#slots .slot')];

const game = new Game({
  canvas, levels: LEVELS,
  ui: {
    radar: $('radar'), uptime: $('uptime'), uptimeBar: $('uptime-bar'), uptimeLabel: $('uptime-label'), boss: $('boss'), bossLabel: $('boss-label'), bossBar: $('bossbar'), hp: $('hp'), hpBar: $('hpbar'), ammo: $('ammo'), weapon: $('wname'), wave: $('wave'), msg: $('msg'), hurt: $('hurt'), slots,
    onState(s) { showOverlay(s); },
    onStat(kind, run) { profile.event(kind, run); },
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

const GFX = ['LOW', 'MEDIUM (BLOOM)', 'HIGH (BLOOM + SHADOWS)'];
function renderSettings() {
  $('set-gfx').textContent = `GRAPHICS: ${GFX[game.quality]}  (G)`;
  $('set-liz').textContent = `LIZARDS: ${game.lizStyle === 'pixel' ? 'PIXEL' : '3D MODELS'}  (L)`;
}
$('set-gfx').addEventListener('click', (ev) => { ev.stopPropagation(); game.cycleQuality(); renderSettings(); });
$('set-liz').addEventListener('click', (ev) => { ev.stopPropagation(); game.toggleLizStyle(); renderSettings(); });
renderSettings();

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

function renderProfile() {
  const st = profile.stats(), box = $('mystats'), inp = $('nick');
  if (document.activeElement !== inp) inp.value = profile.nick;
  if (!st) { box.textContent = ''; return; }
  const top = profile.leaderboard().map((p, i) => `${i + 1}. ${p.nick} — ${p.best}`).join('   ');
  box.innerHTML = `BEST SCORE <b>${st.best}</b> · BOSSES KILLED <b>${st.bosses}</b> · WAVES CLEARED <b>${st.waves}</b><br>${top ? 'TOP (THIS BROWSER): ' + top : ''}`;
}
function showOverlay(s) {
  const title = $('ov-title'), body = $('ov-body'), btn = $('ov-btn');
  overlay.style.display = s === 'playing' ? 'none' : 'flex';
  const L = LEVELS[game.levelIndex];
  renderLevels(s !== 'paused' && s !== 'playing');
  renderSettings(); renderProfile();
  $('profile').style.display = s === 'paused' ? 'none' : 'block';
  $('ov-menu').style.display = s === 'paused' ? 'inline-block' : 'none';
  if (music) music.setMode(s === 'playing' ? 'play' : s === 'paused' ? 'pause' : s === 'won' ? 'win' : s === 'dead' ? 'dead' : 'pause');
  if (s === 'paused') { title.textContent = 'PAUSED'; body.textContent = 'Click to resume.  (P = developer freeze)'; btn.textContent = 'RESUME'; }
  else if (s === 'dead' && game.failReason === 'chain') { title.textContent = 'YOU’VE BEEN DEFEATED'; body.textContent = `Neo went offline. Lizards slain: ${game.stats.kills}.`; btn.textContent = 'TRY AGAIN'; }
  else if (s === 'dead') { title.textContent = 'YOU DIED'; body.textContent = `Lizards slain: ${game.stats.kills}. The invaders win this round.`; btn.textContent = 'TRY AGAIN'; }
  else if (s === 'won') {
    const t = Math.round(game.stats.time);
    title.textContent = 'LEVEL CLEARED';
    body.textContent = `${L.name}: all lizards slain (${game.stats.kills}) in ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}.`;
    btn.textContent = game.nextLevel() !== null ? 'NEXT LEVEL' : 'PLAY AGAIN';
  } else { title.textContent = CFG.title || 'LIZARDS OVER RUS'; btn.textContent = 'PLAY'; }
}

function start(levelIndex) {
  const fresh = game.state !== 'paused';
  if (fresh) {   // a nickname is needed to start a run (it keeps your stats)
    const inp = $('nick'), name = inp.value.trim() || profile.nick;
    if (!name) { inp.classList.add('bad'); inp.focus(); setTimeout(() => inp.classList.remove('bad'), 400); return; }
    profile.setNick(name); profile.startRun();
  }
  initAudio();
  if (typeof levelIndex !== 'number') {
    levelIndex = undefined;
    if (game.state === 'won' && game.nextLevel() !== null) levelIndex = game.nextLevel();
  }
  if (levelIndex !== undefined && (levelIndex !== game.levelIndex || game.state !== 'title')) game.loadLevel(levelIndex);
  game.begin();
  const m = ensureMusic(); if (m) m.start(LEVELS[game.levelIndex].track ?? game.levelIndex);
  if (canvas.requestPointerLock) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* ignore */ } }
}
$('ov-btn').addEventListener('click', () => start());
$('ov-menu').addEventListener('click', (ev) => { ev.stopPropagation(); game.toMenu(); });
overlay.addEventListener('click', (e) => { if (e.target === overlay) start(); });

// re-capture the mouse: any click on the game while it is running but unlocked (e.g. Esc-resume refused by the browser) locks it again
function lockMouse() {
  if (!canvas.requestPointerLock || document.pointerLockElement === canvas) return;
  try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* ignore */ }
}
canvas.addEventListener('mousedown', () => { if (game.state === 'playing') lockMouse(); });
document.addEventListener('pointerlockerror', () => { if (game.state === 'playing') game.pause(); });   // browser refused: back to the pause menu
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
  if (e.target && e.target.tagName === 'INPUT') { if (e.code === 'Enter') start(); return; }   // typing the nickname
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  game.keys.add(e.code);
  if (game.state === 'playing' && /^Digit[1-9]$/.test(e.code)) game.selectSlot(Number(e.code.slice(5)));
  if (game.state === 'playing' && e.code === 'KeyQ') game.cycleWeapon(-1);
  if (e.code === 'KeyP' && game.state === 'playing') game.setMessage((game.freeze = !game.freeze) ? 'DEV MODE: LIZARDS FROZEN  (P)' : 'DEV MODE OFF', 2);
  if (e.code === 'KeyG') { game.setMessage(`GRAPHICS: ${game.cycleQuality()}`, 2); renderSettings(); }
  if (e.code === 'KeyL') { game.setMessage(`LIZARDS: ${game.toggleLizStyle()}`, 2); renderSettings(); }
  if (e.code === 'KeyM' && music) game.setMessage(music.toggleMute() ? 'MUSIC OFF' : 'MUSIC ON', 1.5);
  if ((game.state === 'dead' || game.state === 'won') && e.code === 'Enter') start();
});
window.addEventListener('keyup', (e) => { if (!(e.target && e.target.tagName === 'INPUT')) game.keys.delete(e.code); });
window.addEventListener('blur', () => { game.keys.clear(); game.mouseDown = false; game.pause(); });
window.addEventListener('resize', () => game.resize(canvas.clientWidth, canvas.clientHeight));

// developer readout (P): position + nearest building, in its own always-visible element
const devEl = document.createElement('div');
devEl.style.cssText = 'position:fixed;left:50%;bottom:150px;transform:translateX(-50%);padding:6px 12px;background:rgba(0,0,0,.75);color:#7CFFB8;font:14px monospace;z-index:20;pointer-events:none;display:none;white-space:pre';
document.body.appendChild(devEl);
// build stamp in the top-left corner while developer mode (P) is on; also asks GitHub whether a newer commit exists (stale cache hint)
const verEl = document.createElement('div');
verEl.style.cssText = 'position:fixed;left:8px;top:8px;padding:4px 8px;background:rgba(0,0,0,.75);color:#7CFFB8;font:12px monospace;z-index:20;pointer-events:none;display:none;white-space:pre';
document.body.appendChild(verEl);
let latestNote = '';
async function checkLatest() {
  try {
    const r = await fetch('https://api.github.com/repos/dns7030/boomer-shooter/commits/claude%2Ffestive-dirac-8ebprl', { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(r.status);
    const j = await r.json(), t = Date.parse(j.commit.committer.date);
    latestNote = t > Date.parse(BUILD.time) + 180000 ? `NEWER VERSION ON GITHUB (${j.sha.slice(0, 7)}) - HARD REFRESH: CTRL+SHIFT+R` : `up to date (latest ${j.sha.slice(0, 7)})`;
  } catch (e) { latestNote = 'could not check GitHub'; }
}
let checked = false;
let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000; last = now;
  game.step(dt);
  if (music) music.setIntensity(game.intensity());
  game.render();
  devEl.style.display = game.freeze && game.state === 'playing' ? 'block' : 'none'; if (game.freeze) devEl.textContent = game.devText || '';
  verEl.style.display = game.freeze ? 'block' : 'none';
  if (game.freeze) { if (!checked) { checked = true; checkLatest(); } verEl.textContent = `build #${BUILD.n}  ${BUILD.time.slice(0, 16).replace('T', ' ')} UTC\n${latestNote}`; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
showOverlay('title');
